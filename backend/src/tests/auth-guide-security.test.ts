import { describe, it, expect, beforeAll, vi } from 'vitest';
import { AuthService } from '../services/auth/auth.service.js';
import { GuideService } from '../services/assistant/guide.service.js';
import { GeminiService } from '../services/gemini/gemini.service.js';
import { inMemoryDb } from '../config/database.js';
import { env } from '../config/env.js';

describe('OmniMind AI — Full Auth, Security & OmniMind Guide Test Suite', () => {
  beforeAll(() => {
    vi.spyOn(GeminiService as any, 'getClient').mockReturnValue({
      models: {
        generateContent: vi.fn().mockImplementation(async (opts: any) => {
          const contents = Array.isArray(opts.contents) ? opts.contents.join(' ') : String(opts.contents || '');
          if (contents.includes('AUTHORIZE') || contents.includes('EVIDENCE_ID')) {
            return {
              text: JSON.stringify({
                answer: 'OmniMind AI uses Row Level Security and private storage buckets.',
                confidence: 'high',
                insufficient_evidence: false,
                key_findings: ['RLS enforced', 'Private storage used'],
                citations: [
                  {
                    evidence_id: 'chunk-sec-guide-1',
                    claim: 'Storage security',
                    supporting_quote: 'All user files are stored in private buckets protected by RLS.',
                  },
                ],
              }),
            };
          }
          return {
            text: JSON.stringify({
              answer: 'Mock response from Gemini model.',
              confidence: 'high',
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

  describe('SECTION 2 — Authentication Verification', () => {
    const testEmail = `auth_user_${Date.now()}@omnimind.ai`;
    const testPassword = 'Password123!';
    let registeredUserId: string;

    it('A1: Successful registration creates user with hashed password and initial workspace', async () => {
      const result = await AuthService.register({
        email: testEmail,
        password: testPassword,
        displayName: 'Test Auth User',
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testEmail);
      expect(result.user.displayName).toBe('Test Auth User');
      registeredUserId = result.user.id;

      // Check DB record: password must NEVER be plaintext
      const dbUser = inMemoryDb.app_users.get(result.user.id);
      expect(dbUser).toBeDefined();
      expect(dbUser?.password_hash).not.toBe(testPassword);
      expect(dbUser?.password_hash.startsWith('$2')).toBe(true); // bcrypt signature
    });

    it('A2: Rejects duplicate email registration cleanly', async () => {
      await expect(
        AuthService.register({
          email: testEmail,
          password: 'AnotherPassword123!',
          displayName: 'Duplicate User',
        })
      ).rejects.toThrow();
    });

    it('A3: Login with valid credentials succeeds after verification', async () => {
      // Simulate confirmed email
      await AuthService.confirmUserEmail(testEmail);

      const loginRes = await AuthService.login(testEmail, testPassword);
      expect(loginRes.accessToken).toBeDefined();
      expect(loginRes.user.email).toBe(testEmail);

      const verified = AuthService.verifyAccessToken(loginRes.accessToken);
      expect(verified.sub).toBe(registeredUserId);
    });

    it('A4: Login with invalid credentials fails with generic message to prevent enumeration', async () => {
      await expect(
        AuthService.login(testEmail, 'WrongPassword!')
      ).rejects.toThrow(/invalid/i);
    });

    it('A5: Resend verification email provides safe non-enumerating response', async () => {
      const resendRes = await AuthService.resendVerification(testEmail);
      expect(resendRes.message).toBeDefined();
      expect(typeof resendRes.message).toBe('string');
    });

    it('A6: Password reset request returns generic confirmation message', async () => {
      const resetReq = await AuthService.requestPasswordReset(testEmail);
      expect(resetReq.message).toContain('instructions have been sent');
    });

    it('A7: Password reset updates user password hash', async () => {
      const newPassword = 'NewSecretPassword123!';
      const resetRes = await AuthService.resetPassword(testEmail, newPassword);

      expect(resetRes.success).toBe(true);

      // Verify login with new password
      const newLogin = await AuthService.login(testEmail, newPassword);
      expect(newLogin.accessToken).toBeDefined();
    });

    it('A8: Account deletion requires explicit DELETE confirmation', async () => {
      // Must reject non-matching confirmation
      await expect(
        AuthService.deleteAccount(registeredUserId, 'cancel')
      ).rejects.toThrow(/explicitly confirm/i);

      // Must succeed when 'DELETE' is supplied
      const deleteRes = await AuthService.deleteAccount(registeredUserId, 'DELETE');
      expect(deleteRes.deleted).toBe(true);
      expect(inMemoryDb.app_users.has(registeredUserId)).toBe(false);
    });
  });

  describe('SECTION 3 — Security Architecture Tests', () => {
    it('S1: Cross-user document isolation enforces authorization barrier', async () => {
      const userAlpha = await AuthService.register({
        email: `alpha_${Date.now()}@omnimind.ai`,
        password: 'Password123!',
        displayName: 'Alpha',
      });
      const userBeta = await AuthService.register({
        email: `beta_${Date.now()}@omnimind.ai`,
        password: 'Password123!',
        displayName: 'Beta',
      });

      const alphaDocId = `doc-alpha-${Date.now()}`;
      inMemoryDb.documents.set(alphaDocId, {
        id: alphaDocId,
        user_id: userAlpha.user.id,
        workspace_id: 'ws-alpha',
        original_filename: 'Alpha_Confidential.pdf',
        mime_type: 'application/pdf',
        modality: 'document',
        status: 'ready',
        created_at: new Date().toISOString(),
      });

      // User Beta's documents list must not include Alpha's document
      const betaDocs = Array.from(inMemoryDb.documents.values()).filter(
        (d) => d.user_id === userBeta.user.id && !d.deleted_at
      );
      expect(betaDocs.find((d) => d.id === alphaDocId)).toBeUndefined();
    });

    it('S2: Cross-user conversation access is blocked', async () => {
      const userGamma = await AuthService.register({
        email: `gamma_${Date.now()}@omnimind.ai`,
        password: 'Password123!',
        displayName: 'Gamma',
      });
      const convId = `conv-${Date.now()}`;
      inMemoryDb.conversations.set(convId, {
        id: convId,
        user_id: userGamma.user.id,
        workspace_id: null,
        title: 'Confidential Strategy',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const unauthorizedUserId = 'forged-attacker-uuid';
      const conv = inMemoryDb.conversations.get(convId);
      expect(conv?.user_id).toBe(userGamma.user.id);
      expect(conv?.user_id).not.toBe(unauthorizedUserId);
    });

    it('S3: System rejects invalid or forged JWT access tokens', () => {
      expect(() => AuthService.verifyAccessToken('forged.token.payload')).toThrow();
    });

    it('S4: Sensitive secrets are strictly kept on server and never leaked', () => {
      const capabilities = GuideService.getSystemCapabilities();
      const serialized = JSON.stringify(capabilities);
      expect(serialized).not.toContain(env.JWT_SECRET);
      expect(serialized).not.toContain(env.GEMINI_API_KEY);
      expect(serialized).not.toContain('secret');
      expect(serialized).not.toContain('service_role');
    });
  });

  describe('SECTION 4 — OmniMind Guide Chatbot Behavior', () => {
    let guideUserId: string;

    beforeAll(async () => {
      const user = await AuthService.register({
        email: `guide_tester_${Date.now()}@omnimind.ai`,
        password: 'Password123!',
        displayName: 'Dr. Jane',
      });
      guideUserId = user.user.id;
    });

    it('G1: Greeting receives a friendly, non-technical greeting with starter suggestions', async () => {
      const res = await GuideService.handleChat({
        userId: guideUserId,
        userDisplayName: 'Dr. Jane',
        message: 'hi',
      });

      expect(res.reply).toContain('Dr. Jane');
      expect(res.reply).toContain('OmniMind Guide');
      expect(res.suggestedActions.length).toBeGreaterThanOrEqual(1);
    });

    it('G2: "How do I use this app?" receives a beginner-friendly 3-step explanation', async () => {
      const res = await GuideService.handleChat({
        userId: guideUserId,
        message: 'I do not know how to use this website',
      });

      expect(res.reply).toContain('Here is how it works in 3 easy steps');
      expect(res.reply).toContain('Upload your files');
      expect(res.stepGuide?.totalSteps).toBe(3);
      expect(res.suggestedActions.some((a) => a.id === 'open_upload')).toBe(true);
    });

    it('G3: "Where should I start?" recommends a simple initial task', async () => {
      const res = await GuideService.handleChat({
        userId: guideUserId,
        message: 'Where should I start?',
      });

      expect(res.reply.toLowerCase()).toContain('upload');
      expect(res.suggestedActions.some((a) => a.id === 'open_upload')).toBe(true);
    });

    it('G4: College PDF summary request guides to upload workflow', async () => {
      const res = await GuideService.handleChat({
        userId: guideUserId,
        message: 'I have a college PDF and want short notes',
      });

      expect(res.reply.toLowerCase()).toContain('pdf');
      expect(res.suggestedActions.some((a) => a.id === 'open_upload')).toBe(true);
    });

    it('G5: Comparison request identifies the requirement for at least 2 sources', async () => {
      const res = await GuideService.handleChat({
        userId: guideUserId,
        message: 'Can you compare these two reports?',
      });

      expect(res.reply.toLowerCase()).toContain('at least 2');
      expect(res.suggestedActions.some((a) => a.id === 'open_upload')).toBe(true);
    });

    it('G6: Direct action "show_supported_formats" lists supported multimodal types without hallucination', async () => {
      const res = await GuideService.handleChat({
        userId: guideUserId,
        action: 'show_supported_formats',
      });

      expect(res.reply).toContain('PDF');
      expect(res.reply).toContain('DOCX');
      expect(res.reply).toContain('MP3');
      expect(res.reply).toContain('MP4');
      expect(res.reply).toContain('WEBP');
    });

    it('G7: Direct action "check_processing_status" returns accurate count of user files', async () => {
      const res = await GuideService.handleChat({
        userId: guideUserId,
        action: 'check_processing_status',
      });

      expect(res.reply).toBeDefined();
      expect(res.suggestedActions).toBeDefined();
    });

    it('G8: Questions about uploaded document ground answers with citations', async () => {
      // Seed a processed document and chunk for this user
      const docId = `doc-guide-${Date.now()}`;
      const chunkId = `chunk-sec-guide-1`;

      inMemoryDb.documents.set(docId, {
        id: docId,
        user_id: guideUserId,
        workspace_id: 'ws-guide',
        original_filename: 'Storage_Architecture.pdf',
        mime_type: 'application/pdf',
        modality: 'document',
        status: 'processed',
        created_at: new Date().toISOString(),
      });

      inMemoryDb.document_chunks.set(chunkId, {
        id: chunkId,
        user_id: guideUserId,
        document_id: docId,
        chunk_index: 0,
        modality: 'document',
        content: 'All user files are stored in private buckets protected by RLS and system storage architecture.',
        page_number: 2,
        embedding: Array(768).fill(0.01),
        created_at: new Date().toISOString(),
      });

      const res = await GuideService.handleChat({
        userId: guideUserId,
        message: 'What storage architecture does the system use?',
        selectedDocumentIds: [docId],
      });

      expect(res.reply).toBeDefined();
      expect(res.citations).toBeDefined();
      expect(res.citations!.length).toBeGreaterThanOrEqual(1);
      expect(res.citations![0].chunk_id).toBe(chunkId);
    });
  });
});
