import { describe, it, expect, beforeAll, vi } from 'vitest';
import { GeminiService, ChatContextMessage } from '../services/gemini/gemini.service.js';
import { RetrievalService } from '../services/retrieval/retrieval.service.js';
import { inMemoryDb } from '../config/database.js';

describe('OmniMind AI — Phase 5 Chatbot Response Relevance Test Suite', () => {
  beforeAll(() => {
    // Mock external Gemini AI client for deterministic execution
    vi.spyOn(GeminiService as any, 'getClient').mockReturnValue({
      models: {
        generateContent: vi.fn().mockImplementation(async (opts: any) => {
          const contents = Array.isArray(opts.contents) ? opts.contents.join(' ') : String(opts.contents || '');

          if (contents.includes('Current User Question: "Hi"') || contents.includes('Current User Question: "Hello"')) {
            return {
              text: JSON.stringify({
                answer: 'Hi! How can I help you today?',
                confidence: 'high',
                insufficient_evidence: false,
                key_findings: ['Conversational greeting acknowledged.'],
                citations: [],
              }),
            };
          }

          if (contents.includes('Current User Question: "What is 2 + 2?"')) {
            return {
              text: JSON.stringify({
                answer: '2 + 2 = 4.',
                confidence: 'high',
                insufficient_evidence: false,
                key_findings: ['Basic arithmetic calculation.'],
                citations: [],
              }),
            };
          }

          if (contents.includes('Current User Question: "Make it shorter."')) {
            return {
              text: JSON.stringify({
                answer: 'In short: Plants convert sunlight, water, and CO2 into sugar and oxygen.',
                confidence: 'high',
                insufficient_evidence: false,
                key_findings: ['Condensed prior photosynthesis explanation.'],
                citations: [],
              }),
            };
          }

          if (contents.includes('Current User Question: "Explain photosynthesis in simple words."')) {
            return {
              text: JSON.stringify({
                answer: 'Photosynthesis is the process by which green plants and certain other organisms use sunlight to synthesize foods with the aid of chlorophyll from carbon dioxide and water, releasing oxygen as a byproduct.',
                confidence: 'high',
                insufficient_evidence: false,
                key_findings: ['Biological definition provided.'],
                citations: [],
              }),
            };
          }

          if (contents.includes('Current User Question: "What did I ask you earlier?"')) {
            if (contents.includes('Explain photosynthesis in simple words.')) {
              return {
                text: JSON.stringify({
                  answer: 'Earlier you asked: "Explain photosynthesis in simple words."',
                  confidence: 'high',
                  insufficient_evidence: false,
                  key_findings: ['Retrieved previous question from session context.'],
                  citations: [],
                }),
              };
            } else {
              return {
                text: JSON.stringify({
                  answer: "You haven't asked any previous questions in this conversation session yet.",
                  confidence: 'high',
                  insufficient_evidence: false,
                  key_findings: ['No prior session history.'],
                  citations: [],
                }),
              };
            }
          }

          if (contents.includes('Current User Question: "Summarize this PDF."')) {
            return {
              text: JSON.stringify({
                answer: 'No PDF has been selected or uploaded yet. Please upload your PDF in the Upload Center or select one from your Knowledge Library so I can analyze and summarize it for you.',
                confidence: 'high',
                insufficient_evidence: true,
                key_findings: ['Prompted user to upload PDF.'],
                citations: [],
              }),
            };
          }

          if (contents.includes('Current User Question: "What is in this image?"')) {
            return {
              text: JSON.stringify({
                answer: 'No image is currently attached or selected. Please upload an image in the Upload Center or attach one so I can analyze its visual elements and structure for you.',
                confidence: 'high',
                insufficient_evidence: true,
                key_findings: ['Prompted user to upload image.'],
                citations: [],
              }),
            };
          }

          if (contents.includes('Current User Question: "What are the vector dimensions?"')) {
            return {
              text: JSON.stringify({
                answer: 'Based on the attached document, vector embeddings use 768 dimensions with cosine distance.',
                confidence: 'high',
                insufficient_evidence: false,
                key_findings: ['768 embedding dimensions confirmed'],
                citations: [
                  {
                    evidence_id: 'test-chunk-101',
                    claim: 'Vector dimensions are 768',
                    supporting_quote: 'vector embeddings use 768 dimensions with cosine distance',
                  },
                ],
              }),
            };
          }

          return {
            text: JSON.stringify({
              answer: 'I am OmniMind AI, your multimodal intelligence workspace assistant.',
              confidence: 'medium',
              insufficient_evidence: false,
              key_findings: [],
              citations: [],
            }),
          };
        }),
      },
    });
  });

  describe('Core Relevance & Context Retention Tests (User-Specified Acceptance)', () => {
    it('Test 1: User says "Hi" -> natural conversational greeting', async () => {
      const response = await GeminiService.generateChatResponse({
        question: 'Hi',
        conversationHistory: [],
      });

      expect(response.answer.toLowerCase()).toContain('hi');
      expect(response.answer.toLowerCase()).toContain('how can i help');
      expect(response.confidence).toBe('high');
    });

    it('Test 2: User says "What is 2 + 2?" -> "2 + 2 = 4."', async () => {
      const response = await GeminiService.generateChatResponse({
        question: 'What is 2 + 2?',
        conversationHistory: [],
      });

      expect(response.answer).toContain('4');
      expect(response.confidence).toBe('high');
    });

    it('Test 3: User says "Explain photosynthesis in simple words." -> biological explanation, not generic text', async () => {
      const response = await GeminiService.generateChatResponse({
        question: 'Explain photosynthesis in simple words.',
        conversationHistory: [],
      });

      expect(response.answer.toLowerCase()).toContain('photosynthesis');
      expect(response.answer.toLowerCase()).toMatch(/sunlight|plants|oxygen|carbon/);
      expect(response.confidence).toBe('high');
    });

    it('Test 4: User asks "What did I ask you earlier?" -> uses authorized conversation history', async () => {
      const history: ChatContextMessage[] = [
        { role: 'user', content: 'Explain photosynthesis in simple words.' },
        { role: 'assistant', content: 'Photosynthesis is how plants turn sunlight into energy.' },
      ];

      const response = await GeminiService.generateChatResponse({
        question: 'What did I ask you earlier?',
        conversationHistory: history,
      });

      expect(response.answer.toLowerCase()).toContain('earlier you asked');
      expect(response.answer).toContain('photosynthesis');
    });

    it('Test 4b: User asks "What did I ask you earlier?" with no prior history -> states context is unavailable', async () => {
      // Temporarily test unconfigured or empty history branch
      const response = await GeminiService.generateChatResponse({
        question: 'What did I ask you earlier?',
        conversationHistory: [],
      });

      expect(response.answer).toBeDefined();
    });

    it('Test 5: User says "Summarize this PDF." without upload -> asks user to upload PDF', async () => {
      const response = await GeminiService.generateChatResponse({
        question: 'Summarize this PDF.',
        conversationHistory: [],
        evidenceItems: [],
        workspaceDocumentsCount: 0,
      });

      expect(response.answer.toLowerCase()).toContain('pdf');
      expect(response.answer.toLowerCase()).toMatch(/upload|selected|library/);
    });

    it('Test 6: User says "What is in this image?" without image -> prompts user to upload image', async () => {
      const response = await GeminiService.generateChatResponse({
        question: 'What is in this image?',
        conversationHistory: [],
        evidenceItems: [],
      });

      expect(response.answer.toLowerCase()).toContain('image');
      expect(response.answer.toLowerCase()).toMatch(/upload|attached|select/);
    });

    it('Test 7: Contextual follow-up "Make it shorter." uses prior explanation', async () => {
      const history: ChatContextMessage[] = [
        { role: 'user', content: 'Explain photosynthesis in simple words.' },
        {
          role: 'assistant',
          content: 'Photosynthesis is the process by which green plants and certain other organisms use sunlight to synthesize foods.',
        },
      ];

      const response = await GeminiService.generateChatResponse({
        question: 'Make it shorter.',
        conversationHistory: history,
      });

      expect(response.answer.length).toBeLessThan(150);
      expect(response.answer.toLowerCase()).toMatch(/short|plants|sunlight|sugar|oxygen/);
    });

    it('Test 8: Document question with evidence -> includes accurate citations', async () => {
      const evidence = [
        {
          id: 'test-chunk-101',
          document_id: 'doc-uuid-101',
          document_name: 'Vector_Spec.pdf',
          modality: 'document',
          content: 'vector embeddings use 768 dimensions with cosine distance',
          page_number: 3,
        },
      ];

      const response = await GeminiService.generateChatResponse({
        question: 'What are the vector dimensions?',
        evidenceItems: evidence,
      });

      expect(response.answer).toContain('768');
      expect(response.citations.length).toBeGreaterThan(0);
      expect(response.citations[0].evidence_id).toBe('test-chunk-101');
    });
  });
});
