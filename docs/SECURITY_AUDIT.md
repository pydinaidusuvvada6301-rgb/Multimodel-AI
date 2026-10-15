# OmniMind AI — Security Audit & Defense Architecture

**Audit Date:** October 2026  
**Security Level:** Enterprise Grade / Multimodal Data Isolation  

---

## 1. Authentication & Session Security
- **Bcrypt Hashing:** Passwords are never stored in plaintext; 10-round bcrypt salted hashing is strictly enforced on user creation and password changes.
- **JWT & Session Integrity:** Authentication tokens (`omnimind_token`) are verified via backend middleware; invalid or expired tokens return HTTP 401.
- **Credential Protection:** `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` are kept exclusively in backend environment variables and NEVER exposed in frontend code bundles.
- **Account Deletion Safety Barrier:** Permanent account deletion requires an explicit confirmation payload (`DELETE`) before any cascading database operations occur.

---

## 2. Authorization & Multi-Tenancy Isolation
- **Row-Level Security (RLS):** Supabase PostgreSQL schemas enforce that users can access only their own workspaces, documents, conversation history, and generated reports.
- **API Guardrails:** All document download, deletion, retrieval, and message operations perform strict user ID verification (`authMiddleware`) before fulfilling requests.
- **Cross-User Attack Defense:** Automated integration tests explicitly verify that User B receives HTTP 403 / 404 when attempting to query or delete User A's files.

---

## 3. Multimodal Ingestion & AI Defense
- **File Size Caps:** Upload endpoints enforce a strict 25MB ceiling per file with MIME type validation to prevent denial-of-service via oversized files.
- **Citation Hallucination Filter:** In `rag.service.ts`, AI-generated citations are validated against actual retrieved vector chunks; any fabricated model citation is stripped from the response payload before reaching the client.
- **Rate Limit & Quota Resilience:** The Gemini service detects HTTP 429 rate limits and 503 spikes, executing bounded exponential backoff with jitter (max 2 retries) without entering infinite loops.
