# OmniMind AI — Security & Isolation Policy

Security in OmniMind AI is implemented as a core architectural constraint across every layer.

---

## 1. Authentication & Token Lifecycle

- **Authoritative Identity:** Application identity is strictly managed in the PostgreSQL `app_users` table.
- **Password Protection:** Passwords are never stored in plaintext. Passwords are salted and hashed using `bcrypt` (10 rounds).
- **Access Tokens:** Signed using JSON Web Tokens (JWT) with strong HS256 / RS256 keys. Access tokens have a short lifespan of 15 minutes.
- **Refresh Token Rotation:** Refresh tokens are 40-byte cryptographically secure random values. Only the SHA-256 hash of the token is stored in the database. When refreshed, the existing token is revoked immediately and a new token pair is issued.
- **HTTP-Only Cookies:** Tokens can be transported in `HttpOnly`, `SameSite=Lax`, and `Secure` (production) cookies, preventing XSS-based extraction.

---

## 2. Multi-Tenant Data Isolation

### Database Isolation
- Every database query explicitly verifies that `user_id` matches the verified token claim.
- Workspaces, documents, chunks, conversations, citations, and generated artifacts are bound by foreign keys with cascading deletes.
- A user can never access or query rows belonging to another user.

### Storage Isolation
- Files are stored in private buckets with randomized paths:
  `users/<user-id>/workspaces/<workspace-id>/<document-id>/<safe-filename>`
- Files are never publicly exposed. Direct access is blocked.
- Download links are issued as time-bounded HMAC-SHA256 signed URLs that expire after 1 hour.

---

## 3. Multimodal Untrusted Data Handling & Prompt Injection Defense

1. **Untrusted Input Treatment:** All uploaded documents, extracted text, image OCR, and audio transcripts are classified as untrusted user data.
2. **System Instruction Precedence:** System prompts clearly instruct the model that content inside uploaded files cannot override developer rules or system constraints.
3. **No Automatic Code Execution:** Model outputs are treated as display-only Markdown. Code blocks are rendered with syntax highlighting but are never automatically evaluated in the browser or executed on the server.
4. **Citation Verification Guard:** The server verifies all evidence IDs returned by the model against the list of chunks actually retrieved for the authenticated user. Any citation pointing to an unretrieved ID or foreign document is rejected before the response reaches the user.

---

## 4. API Rate Limiting & Denial-of-Service Defense

- **General API Limiter:** 120 requests / minute per client IP.
- **Auth Endpoint Limiter:** 30 attempts / 15 minutes for login and registration to mitigate brute-force and credential stuffing.
- **AI Request Limiter:** 30 requests / minute to prevent quota exhaustion and cost spikes.
- **Upload Boundaries:** Maximum 25MB per file, maximum 10 files per upload.
