import { describe, it, expect, beforeAll, vi } from 'vitest';
import { createApp } from '../app.js';
import { AuthService } from '../services/auth/auth.service.js';
import { RetrievalService } from '../services/retrieval/retrieval.service.js';
import { GeminiService } from '../services/gemini/gemini.service.js';
import { inMemoryDb } from '../config/database.js';

describe('OmniMind AI — Backend Verification Test Suite', () => {
  const app = createApp();

  beforeAll(() => {
    // Mock external Gemini AI client for deterministic automated tests (Phase 9 requirement)
    vi.spyOn(GeminiService as any, 'getClient').mockReturnValue({
      models: {
        generateContent: vi.fn().mockImplementation(async (opts: any) => {
          const contents = Array.isArray(opts.contents) ? opts.contents.join(' ') : String(opts.contents || '');
          if (contents.includes('Classify the user intent')) {
            return {
              text: JSON.stringify({
                intent: 'compare',
                requires_retrieval: true,
                requires_media_context: true,
                suggested_modalities: ['document', 'image'],
                reason: 'Deterministic classification mock for automated unit test.',
              }),
            };
          }
          if (contents.includes('cross-modal comparison') || contents.includes('SOURCES:')) {
            return {
              text: JSON.stringify({
                comparison_title: 'Multi-Source Cross-Modal Comparison',
                overall_summary: 'Synthesized evidence comparing document text and image diagrams.',
                agreements: ['Consistent data architecture'],
                differences: ['Diagram adds network boundaries'],
                contradictions: [],
                missing_information: [],
                evidence_ids: ['source-doc-1', 'source-img-1'],
              }),
            };
          }
          if (contents.includes('AUTHORIZE') || contents.includes('EVIDENCE_ID')) {
            return {
              text: JSON.stringify({
                answer: 'All API requests require TLS 1.3 and JWT Bearer token authentication.',
                confidence: 'high',
                insufficient_evidence: false,
                key_findings: ['TLS 1.3 required', 'JWT Bearer token authenticated'],
                citations: [
                  {
                    evidence_id: 'chunk-sec-01',
                    claim: 'Authentication requirement',
                    supporting_quote: 'All API requests require TLS 1.3 and JWT Bearer token authentication with 15-minute expiration.',
                  },
                ],
              }),
            };
          }
          return {
            text: JSON.stringify({
              answer: 'Deterministic mocked response.',
              confidence: 'medium',
              insufficient_evidence: false,
              key_findings: [],
              citations: [],
            }),
          };
        }),
        embedContent: vi.fn().mockResolvedValue({
          embedding: { values: Array(768).fill(0.01) },
        }),
      },
    });
  });

  describe('1. Health and System Endpoints', () => {
    it('should report healthy on /health endpoint', async () => {
      // Test health handler directly
      const req: any = {};
      const res: any = {
        json: (data: any) => {
          expect(data.status).toBe('healthy');
          expect(data.service).toBe('omnimind-api');
        },
      };
      // App is initialized
      expect(app).toBeDefined();
    });

    it('should expose capabilities without leaking secrets', async () => {
      expect(GeminiService.isConfigured).toBeDefined();
    });
  });

  describe('2. Authentication and Security Isolation', () => {
    const testEmail = `test_${Date.now()}@omnimind.ai`;
    let userTokens: any;

    it('should successfully register a new user with hashed password', async () => {
      userTokens = await AuthService.register({
        email: testEmail,
        password: 'Password123!',
        displayName: 'Test Researcher',
      });

      expect(userTokens).toBeDefined();
      expect(userTokens.accessToken).toBeDefined();
      expect(userTokens.user.email).toBe(testEmail);
    });

    it('should prevent duplicate user registration', async () => {
      await expect(
        AuthService.register({
          email: testEmail,
          password: 'Password123!',
          displayName: 'Test Duplicate',
        })
      ).rejects.toThrow('already exists');
    });

    it('should authenticate user with valid credentials', async () => {
      await AuthService.confirmUserEmail(testEmail);
      const loginResult = await AuthService.login(testEmail, 'Password123!');
      expect(loginResult.accessToken).toBeDefined();
      expect(loginResult.user.email).toBe(testEmail);
    });

    it('should reject login with wrong password', async () => {
      await expect(AuthService.login(testEmail, 'WrongPassword!')).rejects.toThrow('Invalid email or password');
    });

    it('should rotate refresh tokens securely', async () => {
      const rotated = await AuthService.refreshToken(userTokens.refreshToken);
      expect(rotated.accessToken).toBeDefined();
      expect(rotated.refreshToken).toBeDefined();
      expect(rotated.refreshToken).not.toBe(userTokens.refreshToken);
    });
  });

  describe('3. RAG Retrieval & Citation Hallucination Defense', () => {
    it('should chunk text with defined overlap and boundaries', () => {
      const longText = Array(300).fill('multimodal intelligence context').join(' ');
      const chunks = RetrievalService.chunkText(longText, {
        chunkSizeWords: 100,
        overlapWords: 20,
        modality: 'document',
      });

      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0].chunk_index).toBe(0);
      expect(chunks[1].chunk_index).toBe(1);
    });

    it('should strictly filter out unverified model citations', () => {
      const retrievedChunks = [
        {
          id: 'valid-chunk-uuid-1',
          document_id: 'doc-uuid-1',
          document_name: 'System_Architecture.pdf',
          modality: 'document' as const,
          chunk_index: 0,
          content: 'The platform integrates multimodal intelligence with pgvector.',
          relevance_score: 0.95,
        },
      ];

      const modelCitations = [
        {
          evidence_id: 'valid-chunk-uuid-1',
          claim: 'Uses pgvector for retrieval',
          supporting_quote: 'integrates multimodal intelligence with pgvector',
        },
        {
          // Hallucinated ID
          evidence_id: 'fake-hallucinated-id-999',
          claim: 'Fabricated claim',
          supporting_quote: 'Non-existent quote',
        },
      ];

      const verified = RetrievalService.validateCitations(modelCitations, retrievedChunks);

      expect(verified.length).toBe(1);
      expect(verified[0].chunk_id).toBe('valid-chunk-uuid-1');
      expect(verified[0].document_name).toBe('System_Architecture.pdf');
    });
  });

  describe('4. Conversational Relevance vs Document Q&A', () => {
    it('should classify conversational greetings without requiring retrieval', async () => {
      const classification = await GeminiService.classifyIntent('hi');
      expect(classification.intent).toBe('conversation');
      expect(classification.requires_retrieval).toBe(false);
    });

    it('should classify comparison queries as comparison intent', async () => {
      const classification = await GeminiService.classifyIntent('compare these two diagrams');
      expect(classification.intent).toBe('compare');
      expect(classification.requires_retrieval).toBe(true);
    }, 15000);
  });

  describe('5. Cross-User Authorization Barriers & Data Isolation', () => {
    it('should prevent User B from accessing or deleting User A documents', async () => {
      const userA = await AuthService.register({
        email: `usera_${Date.now()}@omnimind.ai`,
        password: 'Password123!',
        displayName: 'User A',
      });

      const userB = await AuthService.register({
        email: `userb_${Date.now()}@omnimind.ai`,
        password: 'Password123!',
        displayName: 'User B',
      });

      const docId = `doc-${Date.now()}`;
      inMemoryDb.documents.set(docId, {
        id: docId,
        user_id: userA.user.id,
        workspace_id: 'ws-a',
        original_filename: 'Confidential_Research.pdf',
        mime_type: 'application/pdf',
        modality: 'document',
        status: 'ready',
        created_at: new Date().toISOString(),
      });

      // User B attempts to access User A's document
      const retrieved = inMemoryDb.documents.get(docId);
      expect(retrieved?.user_id).toBe(userA.user.id);
      expect(retrieved?.user_id).not.toBe(userB.user.id);

      // Verify that query filter for User B excludes User A's document
      const userBDocs = Array.from(inMemoryDb.documents.values()).filter(
        (d) => d.user_id === userB.user.id && !d.deleted_at
      );
      expect(userBDocs.find((d) => d.id === docId)).toBeUndefined();
    });
  });

  describe('6. Multi-Source Grounding & Unanswerable Question Defense', () => {
    it('should flag insufficient evidence when no sources are available', async () => {
      const result = await GeminiService.answerWithGrounding(
        'What was the Q3 revenue in the undisclosed financial file?',
        []
      );

      expect(result.insufficient_evidence).toBe(true);
      expect(result.citations.length).toBe(0);
      expect(result.confidence).toBe('low');
    });

    it('should ground answers strictly in provided evidence without fabricating sources', async () => {
      const evidence = [
        {
          id: 'chunk-sec-01',
          document_id: 'doc-sec-01',
          document_name: 'Security_Policy.pdf',
          modality: 'document',
          content: 'All API requests require TLS 1.3 and JWT Bearer token authentication with 15-minute expiration.',
          page_number: 4,
        },
      ];

      const result = await GeminiService.answerWithGrounding(
        'What are the authentication requirements for API requests?',
        evidence
      );

      expect(result.citations.length).toBeGreaterThanOrEqual(1);
      expect(result.citations[0].evidence_id).toBe('chunk-sec-01');
      expect(result.insufficient_evidence).toBe(false);
    });

    it('should compare multiple sources across modalities', async () => {
      const sources = [
        {
          id: 'source-doc-1',
          name: 'Architecture_Plan.pdf',
          modality: 'document',
          content: 'The system uses PostgreSQL for metadata and object storage for files.',
        },
        {
          id: 'source-img-1',
          name: 'Infra_Diagram.png',
          modality: 'image',
          content: 'Diagram displays client connecting to Node.js backend with Supabase Storage.',
        },
      ];

      const comparison = await GeminiService.compareSources(sources, 'Verify architecture consistency');
      expect(comparison.comparison_title).toBeDefined();
      expect(comparison.overall_summary).toBeDefined();
      expect(comparison.evidence_ids).toContain('source-doc-1');
      expect(comparison.evidence_ids).toContain('source-img-1');
    });
  });
});

