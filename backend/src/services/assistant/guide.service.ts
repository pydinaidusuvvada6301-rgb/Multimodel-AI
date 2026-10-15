import crypto from 'crypto';
import { inMemoryDb } from '../../config/database.js';
import { env } from '../../config/env.js';
import { GeminiService } from '../gemini/gemini.service.js';
import { RetrievalService } from '../retrieval/retrieval.service.js';
import { ConversationRecord, MessageRecord } from '../../types/index.js';

export interface GuideChatOptions {
  userId: string;
  userDisplayName?: string;
  message?: string;
  conversationId?: string;
  selectedDocumentIds?: string[];
  action?: string;
  isGuideMode?: boolean;
}

export interface GuideActionItem {
  id:
    | 'open_upload'
    | 'select_sources'
    | 'check_processing_status'
    | 'summarize_sources'
    | 'ask_about_sources'
    | 'compare_sources'
    | 'open_settings'
    | 'show_supported_formats';
  label: string;
  payload?: any;
}

export interface GuideChatResponse {
  conversationId: string;
  messageId: string;
  reply: string;
  suggestedActions: GuideActionItem[];
  citations?: any[];
  stepGuide?: {
    currentStep: number;
    totalSteps: number;
    stepTitle: string;
    actionId?: string;
  };
}

export class GuideService {
  /**
   * Safe server-generated capabilities description
   */
  public static getSystemCapabilities() {
    return {
      appName: 'OmniMind AI',
      supportedFormats: [
        'PDF',
        'DOCX',
        'TXT',
        'CSV',
        'MD',
        'PNG',
        'JPG',
        'WEBP',
        'MP3',
        'WAV',
        'MP4',
        'WEBM',
      ],
      maxFileSizeMB: 50,
      features: [
        'Multimodal Document Understanding',
        'Audio Transcription & Reasoning',
        'Visual Image Analysis',
        'Video Frame Extraction & Synthesis',
        'Cross-Modal Comparative Intelligence',
        'Strict Source Citations (Page numbers & Timestamps)',
        'Private Row Level Security Storage',
      ],
      routes: {
        upload: '/app/upload',
        library: '/app/library',
        chat: '/app/chat',
        reports: '/app/reports',
        settings: '/app/settings',
      },
    };
  }

  /**
   * Main intelligent customer assistant entry point
   */
  public static async handleChat(options: GuideChatOptions): Promise<GuideChatResponse> {
    const { userId, userDisplayName = 'Researcher', message = '', selectedDocumentIds = [], action } = options;
    const cleanMessage = message.trim();
    const userDocs = Array.from(inMemoryDb.documents.values()).filter((d) => d.user_id === userId);
    const processedDocs = userDocs.filter((d) => d.status === 'processed');

    // 1. Establish or retrieve conversation
    let conversationId = options.conversationId;
    if (conversationId) {
      const existing = inMemoryDb.conversations.get(conversationId);
      if (!existing || existing.user_id !== userId) {
        conversationId = undefined;
      }
    }

    if (!conversationId) {
      conversationId = crypto.randomUUID();
      const now = new Date().toISOString();
      const title = cleanMessage ? cleanMessage.slice(0, 35) + '...' : 'Guide Session';
      inMemoryDb.conversations.set(conversationId, {
        id: conversationId,
        user_id: userId,
        workspace_id: null,
        title,
        created_at: now,
        updated_at: now,
      });
    }

    // Persist incoming user message if provided
    if (cleanMessage) {
      const userMsgId = crypto.randomUUID();
      inMemoryDb.messages.set(userMsgId, {
        id: userMsgId,
        conversation_id: conversationId,
        user_id: userId,
        role: 'user',
        content: cleanMessage,
        status: 'complete',
        model_name: null,
        token_usage: {},
        created_at: new Date().toISOString(),
      });
    }

    let reply = '';
    let suggestedActions: GuideActionItem[] = [];
    let citations: any[] = [];
    let stepGuide: GuideChatResponse['stepGuide'] = undefined;

    // 2. Direct Action Handling
    if (action) {
      switch (action) {
        case 'open_upload':
          reply =
            'You can upload your files right here. OmniMind AI accepts PDFs, Word documents, text files, images (PNG, JPG, WEBP), audio (MP3, WAV), and video (MP4, WEBM) up to 50MB.';
          suggestedActions = [
            { id: 'show_supported_formats', label: 'View Supported Formats' },
            { id: 'check_processing_status', label: 'Check Existing Uploads' },
          ];
          stepGuide = {
            currentStep: 1,
            totalSteps: 3,
            stepTitle: 'Upload Sources',
            actionId: 'open_upload',
          };
          break;

        case 'show_supported_formats':
          reply =
            '**Supported Multimodal Formats:**\n\n' +
            '• **Documents:** PDF, DOCX, TXT, CSV, Markdown (.md)\n' +
            '• **Images:** PNG, JPG, JPEG, WEBP (Visual inspection & OCR)\n' +
            '• **Audio:** MP3, WAV (Automated transcription & acoustic reasoning)\n' +
            '• **Video:** MP4, WEBM (Scene comprehension & multimodal transcripts)\n\n' +
            'All uploads are isolated with Row Level Security in private Supabase storage.';
          suggestedActions = [
            { id: 'open_upload', label: 'Go to Upload Page' },
            { id: 'check_processing_status', label: 'Check Processing Status' },
          ];
          break;

        case 'check_processing_status':
          if (userDocs.length === 0) {
            reply =
              "You don't have any uploaded files in your workspace yet. Would you like to upload a PDF, image, audio, or video file to get started?";
            suggestedActions = [{ id: 'open_upload', label: 'Upload Your First File' }];
          } else {
            const processing = userDocs.filter((d) => d.status === 'processing');
            const failed = userDocs.filter((d) => d.status === 'failed');
            reply =
              `You have **${userDocs.length} total file(s)**:\n\n` +
              `• **${processedDocs.length} ready** for questions & summaries\n` +
              `• **${processing.length} currently processing**\n` +
              `• **${failed.length} failed**\n\n` +
              (processedDocs.length > 0
                ? 'Would you like to ask a question or generate a summary from your ready files?'
                : 'Upload additional files or wait for pending items to complete.');
            suggestedActions =
              processedDocs.length > 0
                ? [
                    { id: 'summarize_sources', label: 'Summarize Files' },
                    { id: 'ask_about_sources', label: 'Ask a Question' },
                  ]
                : [{ id: 'open_upload', label: 'Upload More Files' }];
          }
          break;

        case 'summarize_sources':
          if (processedDocs.length === 0) {
            reply =
              'To summarize a document or recording, please upload a file first. Once uploaded, OmniMind extracts key insights and executive takeaways automatically.';
            suggestedActions = [{ id: 'open_upload', label: 'Upload File to Summarize' }];
          } else {
            const targetDoc =
              selectedDocumentIds.length > 0
                ? processedDocs.find((d) => selectedDocumentIds.includes(d.id)) || processedDocs[0]
                : processedDocs[0];
            reply =
              `I can summarize **${targetDoc.title}** for you right now. You can also ask for specific sections, key takeaways, or action items!`;
            suggestedActions = [
              { id: 'ask_about_sources', label: 'Ask Questions About It' },
              { id: 'compare_sources', label: 'Compare With Another File' },
            ];
          }
          break;

        case 'compare_sources':
          if (processedDocs.length < 2) {
            reply =
              `Comparing requires at least 2 processed sources. You currently have **${processedDocs.length} ready file(s)**. Please upload another file so I can cross-reference them for you.`;
            suggestedActions = [{ id: 'open_upload', label: 'Upload Second Source' }];
          } else {
            reply =
              `You have ${processedDocs.length} sources ready. Select the 2 files you want to compare, and I will highlight agreements, differences, and unique findings between them.`;
            suggestedActions = [
              { id: 'select_sources', label: 'Select Documents to Compare' },
              { id: 'open_upload', label: 'Upload Additional Source' },
            ];
          }
          break;

        case 'open_settings':
          reply =
            'You can manage your account settings, update your password, review security policies, and manage your data retention in the Settings area.';
          suggestedActions = [
            { id: 'check_processing_status', label: 'Check File Status' },
          ];
          break;

        default:
          reply =
            "I'm here to guide you. Tell me what you'd like to do, and I'll walk you through it step by step.";
          suggestedActions = [
            { id: 'open_upload', label: 'Upload a File' },
            { id: 'show_supported_formats', label: 'What Formats Are Supported?' },
          ];
      }
    } else {
      // 3. Conversational Intent Understanding
      const lower = cleanMessage.toLowerCase();

      // Greetings
      if (
        lower === 'hi' ||
        lower === 'hello' ||
        lower === 'hey' ||
        lower.startsWith('hi ') ||
        lower.startsWith('hello ') ||
        lower === 'greetings'
      ) {
        reply =
          `Hi ${userDisplayName}! I'm your **OmniMind Guide**. Tell me what you are trying to do, and I will help you choose the right tools. You don't need to know any technical terms!`;
        suggestedActions = [
          { id: 'open_upload', label: 'Upload a PDF or Document' },
          { id: 'show_supported_formats', label: 'Explain Supported Formats' },
          { id: 'check_processing_status', label: 'Check My Files' },
        ];
      }
      // "How do I use this app?" or "I don't know how to use this website"
      else if (
        lower.includes("don't know how to use") ||
        lower.includes('how to use this') ||
        lower.includes('how does this work') ||
        lower.includes('explain how this application works') ||
        lower.includes('what can this app do')
      ) {
        reply =
          '**Welcome to OmniMind AI! Here is how it works in 3 easy steps:**\n\n' +
          '1. **Upload your files:** Bring in PDFs, docs, lecture slides, audio notes, photos, or video recordings.\n' +
          '2. **Intelligent Indexing:** We analyze text, transcribe audio, inspect images, and generate vector embeddings.\n' +
          '3. **Explore & Ask:** Ask questions in plain English, get instant summaries, or compare multiple sources with exact page numbers and citation timestamps.\n\n' +
          'Where would you like to start?';
        suggestedActions = [
          { id: 'open_upload', label: 'Upload a File' },
          { id: 'show_supported_formats', label: 'See Supported Formats' },
        ];
        stepGuide = {
          currentStep: 1,
          totalSteps: 3,
          stepTitle: 'Getting Started',
          actionId: 'open_upload',
        };
      }
      // "Where should I start?"
      else if (
        lower.includes('where should i start') ||
        lower.includes('where to start') ||
        lower.includes('help me choose')
      ) {
        reply =
          'The simplest way to start is to **upload one file**—like a PDF, research article, or lecture recording. Once uploaded, you can ask me anything about it or ask for a 2-minute summary.\n\nWould you like to upload a file now?';
        suggestedActions = [
          { id: 'open_upload', label: 'Upload a File Now' },
          { id: 'show_supported_formats', label: 'What Files Can I Upload?' },
        ];
      }
      // College PDF / Short Notes / Summaries
      else if (
        lower.includes('pdf') ||
        lower.includes('college') ||
        lower.includes('notes') ||
        lower.includes('summarize')
      ) {
        if (processedDocs.length === 0) {
          reply =
            'To get short notes or a summary from your PDF, upload it using the upload button below. Our AI will read every page, extract key concepts, and prepare clean study notes with source page references.';
          suggestedActions = [{ id: 'open_upload', label: 'Upload Your PDF' }];
        } else {
          reply =
            `You have **${processedDocs.length} ready source(s)**! Ask me for short notes, key takeaways, or a full executive summary, and I will ground every point with page citations.`;
          suggestedActions = [
            { id: 'summarize_sources', label: 'Generate Summary Notes' },
            { id: 'ask_about_sources', label: 'Ask a Specific Question' },
          ];
        }
      }
      // Image Analysis
      else if (lower.includes('image') || lower.includes('photo') || lower.includes('diagram') || lower.includes('picture')) {
        reply =
          'OmniMind inspects images for text (OCR), charts, diagrams, and visual relationships. Upload a PNG, JPG, or WEBP image, and you can ask questions directly about what is depicted.';
        suggestedActions = [{ id: 'open_upload', label: 'Upload an Image' }];
      }
      // Audio or Podcast
      else if (lower.includes('audio') || lower.includes('recording') || lower.includes('voice') || lower.includes('podcast')) {
        reply =
          'You can upload MP3 or WAV audio recordings. OmniMind transcribes the speech, identifies speakers, and allows you to search or summarize discussions with exact second-by-second timestamps.';
        suggestedActions = [{ id: 'open_upload', label: 'Upload Audio Recording' }];
      }
      // Video
      else if (lower.includes('video') || lower.includes('mp4') || lower.includes('lecture recording')) {
        reply =
          'Upload MP4 or WEBM video files. We analyze the spoken transcript alongside visual cues to give you grounded answers with direct video timestamps.';
        suggestedActions = [{ id: 'open_upload', label: 'Upload Video File' }];
      }
      // Comparison
      else if (lower.includes('compare') || lower.includes('contrast') || lower.includes('difference between')) {
        if (processedDocs.length < 2) {
          reply =
            `Comparing multiple files requires at least 2 processed documents. You currently have **${processedDocs.length} ready file(s)**. Please upload another file so I can cross-reference them for you.`;
          suggestedActions = [{ id: 'open_upload', label: 'Upload Another File' }];
        } else {
          reply =
            `I can cross-reference and compare your sources! Tell me which topics you want to compare between **${processedDocs[0].title}** and your other files.`;
          suggestedActions = [
            { id: 'compare_sources', label: 'Start Source Comparison' },
            { id: 'select_sources', label: 'Select Files to Compare' },
          ];
        }
      }
      // General question about uploaded knowledge
      else if (processedDocs.length > 0) {
        // Query user's authorized chunks
        const retrieved = await RetrievalService.searchChunks({
          userId,
          queryText: cleanMessage,
          documentIds: selectedDocumentIds.length > 0 ? selectedDocumentIds : undefined,
          limit: 4,
        });

        if (retrieved.length > 0 && GeminiService.isConfigured()) {
          const grounded = await GeminiService.answerWithGrounding(
            cleanMessage,
            retrieved.map((r) => ({
              id: r.id,
              document_id: r.document_id,
              document_name: r.document_name,
              modality: r.modality,
              content: r.content,
              page_number: r.page_number,
              start_seconds: r.start_seconds,
            })),
            'balanced'
          );

          reply = grounded.answer;
          citations = RetrievalService.validateCitations(grounded.citations, retrieved);
          suggestedActions = [
            { id: 'ask_about_sources', label: 'Ask a Follow-Up' },
            { id: 'summarize_sources', label: 'Summarize Key Findings' },
          ];
        } else {
          reply =
            "I checked your uploaded workspace files, but didn't find specific evidence matching your question. You can try rephrasing, or upload additional documents covering this topic.";
          suggestedActions = [
            { id: 'open_upload', label: 'Upload More Sources' },
            { id: 'check_processing_status', label: 'Check File Library' },
          ];
        }
      } else {
        // No uploaded files yet, friendly fallback guidance
        reply =
          "I'm your OmniMind Guide. I don't see any files in your workspace yet. Would you like to upload a PDF, image, audio file, or video to see how multimodal AI intelligence works?";
        suggestedActions = [
          { id: 'open_upload', label: 'Upload a File to Start' },
          { id: 'show_supported_formats', label: 'View Supported Formats' },
        ];
      }
    }

    // Persist assistant message
    const assistantMsgId = crypto.randomUUID();
    inMemoryDb.messages.set(assistantMsgId, {
      id: assistantMsgId,
      conversation_id: conversationId,
      user_id: userId,
      role: 'assistant',
      content: reply,
      status: 'complete',
      model_name: env.GEMINI_MODEL,
      token_usage: {},
      created_at: new Date().toISOString(),
      citations,
    });

    return {
      conversationId,
      messageId: assistantMsgId,
      reply,
      suggestedActions,
      citations,
      stepGuide,
    };
  }
}
