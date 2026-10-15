# OmniMind AI — Comprehensive Testing & Quality Assurance Plan

**Frameworks:** Vitest 3.0.8, TypeScript Typechecking (`tsc --noEmit`), Vite Production Bundler  

---

## 1. Test Suite Architecture

### Suite A: API & Functional Integration Tests (`backend/src/tests/api.test.ts`)
- Health probes (`/health`, `/ready`) returning HTTP 200 with database status.
- User registration, duplicate email rejection, login authentication, invalid password rejection.
- Workspace creation, document upload, and deletion.
- RAG retrieval, citation verification, and hallucination defense.
- Cross-user authorization barriers (User A vs User B).

### Suite B: Acceptance Criteria Verification (`backend/src/tests/acceptance-criteria.test.ts`)
- PDF, DOCX, TXT upload and status monitoring.
- Document-grounded questions and answers with accurate page citations.
- Multi-source cross-modal synthesis.
- Corrupt and oversized file rejection.
- Transient Gemini HTTP 429 and 503 retry resilience with bounded backoff.

### Suite C: Full Auth, Security & Guide Suite (`backend/src/tests/auth-guide-security.test.ts`)
- Email password verification and password updates.
- Cross-user conversation barrier.
- Customer Guidance Assistant (`/assistant/chat`) intent recognition and step guide triggers.

---

## 2. Frontend Regression & Build Verification
- Strict TypeScript compile (`tsc --noEmit`) to verify all components, props, and types.
- Production build execution (`npm run build`) via Vite to ensure zero asset bundling regressions.
- WebGL / Three.js fallback verification for environments where hardware acceleration or WebGL is disabled.
- Responsive viewport verification (mobile, tablet, desktop).
