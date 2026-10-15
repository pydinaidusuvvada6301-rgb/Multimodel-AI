import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { authenticate } from '../middleware/auth.middleware.js';
import { aiLimiter } from '../middleware/rateLimit.middleware.js';
import { AuthenticatedRequest, ConversationRecord, MessageRecord } from '../types/index.js';
import { GeminiService } from '../services/gemini/gemini.service.js';
import { RetrievalService } from '../services/retrieval/retrieval.service.js';
import { inMemoryDb } from '../config/database.js';
import { env } from '../config/env.js';

const router = Router();
router.use(authenticate);
router.use(aiLimiter);

const ChatRequestSchema = z.object({
  question: z.string().min(1, 'Question cannot be empty.').max(4000),
  conversationId: z.string().uuid().optional(),
  workspaceId: z.string().uuid().optional(),
  documentIds: z.array(z.string().uuid()).optional(),
  detailLevel: z.enum(['concise', 'balanced', 'detailed']).optional().default('balanced'),
});

const CompareRequestSchema = z.object({
  documentIds: z.array(z.string().uuid()).min(2, 'At least two documents are required for comparison.'),
  objective: z.string().max(1000).optional(),
});

const GenerateRequestSchema = z.object({
  artifactType: z.enum([
    'study_guide',
    'meeting_minutes',
    'research_brief',
    'executive_summary',
    'flashcards',
    'faq',
    'action_items',
    'comparison',
    'custom_report',
  ]),
  title: z.string().min(1).max(200),
  workspaceId: z.string().uuid().optional(),
  documentIds: z.array(z.string().uuid()).optional(),
  prompt: z.string().max(2000).optional(),
});

// GET /api/v1/ai/capabilities
router.get('/capabilities', async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      provider: 'Google Gemini',
      isConfigured: GeminiService.isConfigured(),
      model: env.GEMINI_MODEL,
      embeddingModel: env.GEMINI_EMBEDDING_MODEL,
      supportedModalities: ['document', 'text', 'image', 'audio', 'video', 'structured'],
      supportedFormats: ['PDF', 'DOCX', 'TXT', 'MD', 'CSV', 'JSON', 'PNG', 'JPG', 'WEBP', 'MP3', 'WAV', 'MP4', 'WEBM'],
      features: {
        crossModalComparison: true,
        groundedQnA: true,
        sourceCitations: true,
        intentClassification: true,
        vectorSearch: true,
        contentGeneration: true,
      },
    },
  });
});

// POST /api/v1/ai/chat (Contextual OmniMind Grounded AI Chat)
router.post('/chat', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const validated = ChatRequestSchema.parse(req.body);

    // 1. Manage Conversation Container
    let conversationId = validated.conversationId;
    let conversation: ConversationRecord | undefined;

    if (conversationId) {
      conversation = inMemoryDb.conversations.get(conversationId);
      if (!conversation || conversation.user_id !== userId) {
        conversationId = undefined; // reset if unauthorized
      }
    }

    if (!conversationId) {
      conversationId = crypto.randomUUID();
      const now = new Date().toISOString();
      const firstTitle = validated.question.slice(0, 45) + (validated.question.length > 45 ? '...' : '');
      conversation = {
        id: conversationId,
        user_id: userId,
        workspace_id: validated.workspaceId || null,
        title: firstTitle,
        created_at: now,
        updated_at: now,
      };
      inMemoryDb.conversations.set(conversationId, conversation);
    }

    // Retrieve prior conversation messages before appending current message to maintain context
    const previousMessages = Array.from(inMemoryDb.messages.values())
      .filter((m) => m.conversation_id === conversationId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(-10)
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    // Record user message
    const userMessageId = crypto.randomUUID();
    const userMessage: MessageRecord = {
      id: userMessageId,
      conversation_id: conversationId,
      user_id: userId,
      role: 'user',
      content: validated.question,
      status: 'complete',
      model_name: null,
      token_usage: {},
      created_at: new Date().toISOString(),
    };
    inMemoryDb.messages.set(userMessageId, userMessage);

    // 2. Classify Query Intent
    const classification = await GeminiService.classifyIntent(validated.question);

    // 3. Retrieve Grounded Evidence from Authorized Documents
    let retrievedEvidence: any[] = [];
    if (classification.requires_retrieval || validated.documentIds?.length || classification.intent !== 'conversation') {
      retrievedEvidence = await RetrievalService.searchChunks({
        userId,
        workspaceId: validated.workspaceId,
        documentIds: validated.documentIds,
        queryText: validated.question,
        limit: env.MAX_RETRIEVAL_CHUNKS,
      });
    }

    const userDocsCount = Array.from(inMemoryDb.documents.values()).filter(
      (d) => d.user_id === userId && (validated.workspaceId ? d.workspace_id === validated.workspaceId : true)
    ).length;

    // 4. Generate Grounded & Contextual AI Response
    const groundedResponse = await GeminiService.generateChatResponse({
      question: validated.question,
      conversationHistory: previousMessages,
      evidenceItems: retrievedEvidence.map((e) => ({
        id: e.id,
        document_id: e.document_id,
        document_name: e.document_name,
        modality: e.modality,
        content: e.content,
        page_number: e.page_number,
        start_seconds: e.start_seconds,
      })),
      detailLevel: validated.detailLevel,
      userName: req.user!.displayName,
      workspaceDocumentsCount: userDocsCount,
    });

    const answerText = groundedResponse.answer;
    const confidence = groundedResponse.confidence;
    const keyFindings = groundedResponse.key_findings;

    // 5. Strictly validate citations to prevent hallucinations
    const citations = RetrievalService.validateCitations(groundedResponse.citations, retrievedEvidence);

    // 7. Persist Assistant Response
    const assistantMessageId = crypto.randomUUID();
    const assistantMessage: MessageRecord = {
      id: assistantMessageId,
      conversation_id: conversationId,
      user_id: userId,
      role: 'assistant',
      content: answerText,
      status: 'complete',
      model_name: env.GEMINI_MODEL,
      token_usage: {},
      created_at: new Date().toISOString(),
      citations,
    };
    inMemoryDb.messages.set(assistantMessageId, assistantMessage);

    for (const c of citations) {
      const citationId = c.id || crypto.randomUUID();
      inMemoryDb.message_citations.set(citationId, {
        id: citationId,
        message_id: assistantMessageId,
        document_id: c.document_id,
        chunk_id: c.chunk_id,
        page_number: c.page_number,
        start_seconds: c.start_seconds,
        end_seconds: c.end_seconds,
        quoted_text: c.quoted_text,
        relevance_score: c.relevance_score,
        created_at: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      data: {
        conversationId,
        messageId: assistantMessageId,
        answer: answerText,
        confidence,
        keyFindings,
        citations,
        intent: classification.intent,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/ai/compare (Cross-Modal Multi-Source Comparison)
router.post('/compare', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const validated = CompareRequestSchema.parse(req.body);

    const sources: Array<{ id: string; name: string; modality: string; content: string }> = [];

    for (const docId of validated.documentIds) {
      const doc = inMemoryDb.documents.get(docId);
      if (!doc || doc.user_id !== userId || doc.deleted_at) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: `Unauthorized or missing document ID: ${docId}` },
        });
        return;
      }
      sources.push({
        id: doc.id,
        name: doc.original_filename,
        modality: doc.modality,
        content: doc.extracted_text || doc.summary || `[${doc.modality} metadata]`,
      });
    }

    const comparison = await GeminiService.compareSources(sources, validated.objective);

    res.json({
      success: true,
      data: comparison,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/ai/analyze (Deep Single Document / Media Analysis)
router.post('/analyze', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { documentId } = req.body;

    if (!documentId) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_PARAM', message: 'documentId is required.' },
      });
      return;
    }

    const doc = inMemoryDb.documents.get(documentId);
    if (!doc || doc.user_id !== userId || doc.deleted_at) {
      res.status(404).json({
        success: false,
        error: { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found or unauthorized.' },
      });
      return;
    }

    let analysis: any;
    if (doc.modality === 'audio' || doc.modality === 'video') {
      analysis = await GeminiService.analyzeMedia(
        doc.original_filename,
        doc.modality as any,
        doc.extracted_text || ''
      );
    } else {
      analysis = await GeminiService.analyzeDocument(
        doc.original_filename,
        doc.extracted_text || '',
        doc.modality
      );
    }

    res.json({
      success: true,
      data: analysis,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/ai/analyze/document (Section 12 & 15.2 Document Analysis)
router.post('/analyze/document', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { documentId, content, filename } = req.body;
    let targetDoc: any = documentId ? inMemoryDb.documents.get(documentId) : null;
    if (documentId && (!targetDoc || targetDoc.user_id !== userId || targetDoc.deleted_at)) {
      res.status(404).json({ success: false, error: { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found or unauthorized.' } });
      return;
    }
    const textToAnalyze = targetDoc ? (targetDoc.extracted_text || targetDoc.summary || '') : (content || '');
    const docName = targetDoc ? targetDoc.original_filename : (filename || 'Document');
    const result = await GeminiService.analyzeDocument(docName, textToAnalyze, 'document');
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/ai/analyze/image (Section 12 & 15.5 Image Analysis)
router.post('/analyze/image', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { documentId, content, filename } = req.body;
    let targetDoc: any = documentId ? inMemoryDb.documents.get(documentId) : null;
    if (documentId && (!targetDoc || targetDoc.user_id !== userId || targetDoc.deleted_at)) {
      res.status(404).json({ success: false, error: { code: 'DOCUMENT_NOT_FOUND', message: 'Image document not found or unauthorized.' } });
      return;
    }
    const textToAnalyze = targetDoc ? (targetDoc.extracted_text || targetDoc.summary || '') : (content || '');
    const docName = targetDoc ? targetDoc.original_filename : (filename || 'Image');
    const result = await GeminiService.analyzeDocument(docName, textToAnalyze, 'image');
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/ai/analyze/audio (Section 12 & 15.4 Audio Analysis & Transcription)
router.post('/analyze/audio', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { documentId, content, filename } = req.body;
    let targetDoc: any = documentId ? inMemoryDb.documents.get(documentId) : null;
    if (documentId && (!targetDoc || targetDoc.user_id !== userId || targetDoc.deleted_at)) {
      res.status(404).json({ success: false, error: { code: 'DOCUMENT_NOT_FOUND', message: 'Audio document not found or unauthorized.' } });
      return;
    }
    const textToAnalyze = targetDoc ? (targetDoc.extracted_text || targetDoc.summary || '') : (content || '');
    const docName = targetDoc ? targetDoc.original_filename : (filename || 'Audio Recording');
    const result = await GeminiService.analyzeMedia(docName, 'audio', textToAnalyze);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/ai/analyze/video (Section 12 & 15.5 Video Analysis)
router.post('/analyze/video', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { documentId, content, filename } = req.body;
    let targetDoc: any = documentId ? inMemoryDb.documents.get(documentId) : null;
    if (documentId && (!targetDoc || targetDoc.user_id !== userId || targetDoc.deleted_at)) {
      res.status(404).json({ success: false, error: { code: 'DOCUMENT_NOT_FOUND', message: 'Video document not found or unauthorized.' } });
      return;
    }
    const textToAnalyze = targetDoc ? (targetDoc.extracted_text || targetDoc.summary || '') : (content || '');
    const docName = targetDoc ? targetDoc.original_filename : (filename || 'Video Demonstration');
    const result = await GeminiService.analyzeMedia(docName, 'video', textToAnalyze);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/ai/analyze/multimodal (Section 12 & 15.6 Cross-Modal Synthesis)
router.post('/analyze/multimodal', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const validated = CompareRequestSchema.parse(req.body);

    const sources: Array<{ id: string; name: string; modality: string; content: string }> = [];

    for (const docId of validated.documentIds) {
      const doc = inMemoryDb.documents.get(docId);
      if (!doc || doc.user_id !== userId || doc.deleted_at) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: `Unauthorized or missing document ID: ${docId}` },
        });
        return;
      }
      sources.push({
        id: doc.id,
        name: doc.original_filename,
        modality: doc.modality,
        content: doc.extracted_text || doc.summary || `[${doc.modality} metadata]`,
      });
    }

    const comparison = await GeminiService.compareSources(sources, validated.objective);

    res.json({
      success: true,
      data: comparison,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/ai/generate (Content & Artifact Generation)
router.post('/generate', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const validated = GenerateRequestSchema.parse(req.body);

    const evidenceItems: Array<{ id: string; name: string; content: string }> = [];

    // Gather selected documents or workspace documents
    if (validated.documentIds && validated.documentIds.length > 0) {
      for (const id of validated.documentIds) {
        const doc = inMemoryDb.documents.get(id);
        if (doc && doc.user_id === userId && !doc.deleted_at) {
          evidenceItems.push({
            id: doc.id,
            name: doc.original_filename,
            content: doc.extracted_text || doc.summary || '',
          });
        }
      }
    } else if (validated.workspaceId) {
      for (const doc of inMemoryDb.documents.values()) {
        if (doc.workspace_id === validated.workspaceId && doc.user_id === userId && !doc.deleted_at) {
          evidenceItems.push({
            id: doc.id,
            name: doc.original_filename,
            content: doc.extracted_text || doc.summary || '',
          });
        }
      }
    }

    const generated = await GeminiService.generateArtifact(
      validated.artifactType,
      validated.title,
      evidenceItems,
      validated.prompt
    );

    // Save as generated artifact in DB
    const artifactId = crypto.randomUUID();
    const now = new Date().toISOString();
    const artifactRecord = {
      id: artifactId,
      user_id: userId,
      workspace_id: validated.workspaceId || null,
      title: generated.title,
      artifact_type: generated.artifact_type,
      content_markdown: generated.content_markdown,
      source_document_ids: generated.source_evidence_ids,
      metadata: { limitations: generated.limitations },
      created_at: now,
      updated_at: now,
    };
    inMemoryDb.generated_artifacts.set(artifactId, artifactRecord);

    res.status(201).json({
      success: true,
      data: artifactRecord,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
