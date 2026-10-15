# OmniMind AI — Clear Differentiation: Frontend vs Backend Files

To ensure absolute modularity, security, and independent deployability, OmniMind AI strictly isolates **Frontend** code from **Backend** code into two distinct top-level directories:

- **Frontend (`frontend/`)**: Runs in the **user's browser**. Responsible for UI, rendering, user interaction, state management, and sending requests to the API. It **never** has access to database credentials, server secrets, or private API keys.
- **Backend (`backend/`)**: Runs on the **Node.js server**. Responsible for database management, password hashing, JWT signing, private storage operations, official Gemini SDK calls, and text extraction.

---

## 1. Directory & File Comparison Table

| Attribute | Frontend (`frontend/`) | Backend (`backend/`) |
|---|---|---|
| **Root Location** | `frontend/` | `backend/` |
| **Runtime Environment** | Web Browser (Client) | Node.js (Server) |
| **Framework / Engine** | React 18 + Vite | Express.js 4/5 (ESM) |
| **Styling** | Tailwind CSS + Vanilla CSS (`index.css`) | N/A (Headless REST API) |
| **Language** | TypeScript (TSX / TS) | TypeScript (NodeNext TS) |
| **Entry Point** | `src/main.tsx` -> `index.html` | `src/server.ts` -> `dist/server.js` |
| **Routing** | Client-side (React Router v7) | Server-side REST (`/api/v1/*`) |
| **Database Access** | ❌ **NONE** (Never direct) | ✅ **Direct** (pg pool & Supabase client) |
| **AI SDK Access** | ❌ **NONE** (Never touches Gemini keys) | ✅ **Official `@google/genai` SDK** |
| **File Storage Access** | ❌ **NONE** (Uses signed download URLs) | ✅ **Supabase Storage & local disk adapter** |
| **Local Port** | `http://localhost:5173` | `http://localhost:5000` |
| **Deploy Target** | Vercel / Cloudflare Pages / Static CDN | Render / Railway / AWS / Docker |

---

## 2. Detailed Breakdown of Frontend Files (`frontend/`)

All files in `frontend/` execute entirely inside the user's browser.

### Root Config Files (Frontend)
- [`frontend/package.json`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/package.json): Frontend dependencies (`react`, `react-router-dom`, `lucide-react`, `tailwindcss`, `axios`).
- [`frontend/vite.config.ts`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/vite.config.ts): Vite build configuration with development proxy forwarding `/api` to port 5000.
- [`frontend/tailwind.config.js`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/tailwind.config.js): Dark theme design system colors, glow effects, and typography.
- [`frontend/index.html`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/index.html): HTML page template with Inter Google font and viewport metadata.
- [`frontend/vercel.json`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/vercel.json): SPA rewrite rules to route all paths to `index.html`.

### Source Files (`frontend/src/`)
- [`src/main.tsx`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/src/main.tsx): React root mounting into the DOM.
- [`src/App.tsx`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/src/App.tsx): Client-side route declarations for public and authenticated routes.
- [`src/index.css`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/src/index.css): Global styling, dark theme variables, custom scrollbars, and glassmorphic panels.
- [`src/types/index.ts`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/src/types/index.ts): Frontend data transfer objects (User, Workspace, DocumentItem, Citation).
- [`src/context/AuthContext.tsx`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/src/context/AuthContext.tsx): React context holding user login state, active workspace, and token session restoration.
- [`src/lib/api.ts`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/src/lib/api.ts): Axios HTTP client configured with automatic JWT refresh on 401.
- [`src/lib/utils.ts`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/src/lib/utils.ts): Helper functions for Tailwind class merging (`cn`), file size formatting, and date formatting.

### Component Files (`frontend/src/components/`)
- **UI System (`components/ui/`)**:
  - [`Button.tsx`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/src/components/ui/Button.tsx): Primary, secondary, outline, and danger buttons.
  - [`Input.tsx`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/src/components/ui/Input.tsx): Form input fields with error labels and icon slots.
  - [`Card.tsx`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/src/components/ui/Card.tsx): Glassmorphic cards with hover transitions.
  - [`Modal.tsx`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/src/components/ui/Modal.tsx): Accessible popup dialogs with backdrop blur.
  - [`Badge.tsx`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/src/components/ui/Badge.tsx): Color-coded badges for modalities and statuses.
- **Layout (`components/layout/`)**:
  - [`AppLayout.tsx`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/src/components/layout/AppLayout.tsx): Protected layout wrapping authenticated pages with navigation.
  - [`Sidebar.tsx`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/src/components/layout/Sidebar.tsx): Navigation sidebar with workspace dropdown and user logout.
  - [`TopNavigation.tsx`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/src/components/layout/TopNavigation.tsx): Top header bar with quick search, mobile drawer trigger, and upload button.
  - [`PublicNavbar.tsx`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/src/components/layout/PublicNavbar.tsx): Header for landing, login, and registration pages.
- **AI Chat (`components/chat/`)**:
  - [`ChatMessage.tsx`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/src/components/chat/ChatMessage.tsx): Markdown rendering, copy action, and citation chip list.
  - [`CitationCard.tsx`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/src/components/chat/CitationCard.tsx): Interactive evidence chip displaying source filename, page, timestamp, and quote.
  - [`SourceSelectorModal.tsx`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/src/components/chat/SourceSelectorModal.tsx): Dialog to select which workspace files ground the AI response.
- **Upload (`components/upload/`)**:
  - [`FileDropzone.tsx`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/src/components/upload/FileDropzone.tsx): Drag-and-drop file upload zone with file size validation and progress queue.

### Pages (`frontend/src/pages/`)
- **Public Views (`pages/public/`)**:
  - [`LandingPage.tsx`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/src/pages/public/LandingPage.tsx): Hero, modality grid, cross-modal comparison demo, security cards.
  - [`LoginPage.tsx`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/src/pages/public/LoginPage.tsx): Login form with "Instant Demo" 1-click access for reviewers.
  - [`RegisterPage.tsx`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/src/pages/public/RegisterPage.tsx): User signup with real-time password strength indicators.
  - [`ForgotPasswordPage.tsx`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/src/pages/public/ForgotPasswordPage.tsx): Password recovery request workflow.
- **Authenticated Views (`pages/app/`)**:
  - [`DashboardPage.tsx`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/src/pages/app/DashboardPage.tsx): Overview of files, ready/processing metrics, and recent chats.
  - [`WorkspacesPage.tsx`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/src/pages/app/WorkspacesPage.tsx): Create, switch, and delete workspaces.
  - [`WorkspaceDetailPage.tsx`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/src/pages/app/WorkspaceDetailPage.tsx): Detailed workspace file list filtered by modality.
  - [`UploadPage.tsx`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/src/pages/app/UploadPage.tsx): Dedicated ingestion center with pipeline explanation.
  - [`LibraryPage.tsx`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/src/pages/app/LibraryPage.tsx): Global searchable file library with retry and delete controls.
  - [`SearchPage.tsx`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/src/pages/app/SearchPage.tsx): Hybrid search interface (keyword + vector embeddings).
  - [`ChatPage.tsx`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/src/pages/app/ChatPage.tsx): Grounded multimodal assistant with conversation history.
  - [`DocumentDetailPage.tsx`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/src/pages/app/DocumentDetailPage.tsx): Media detail, extracted text, executive summary, and RAG chunks.
  - [`ReportsPage.tsx`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/src/pages/app/ReportsPage.tsx): Deliverables generator (Study guides, minutes, summaries) with Markdown/TXT export.
  - [`SettingsPage.tsx`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/frontend/src/pages/app/SettingsPage.tsx): Password updates, session information, and infrastructure readiness.

---

## 3. Detailed Breakdown of Backend Files (`backend/`)

All files in `backend/` execute strictly in the Node.js server environment and never leak into the browser bundle.

### Root Config Files (Backend)
- [`backend/package.json`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/backend/package.json): Server dependencies (`@google/genai`, `express`, `pg`, `bcryptjs`, `jsonwebtoken`, `multer`, `pdf-parse`, `mammoth`, `csv-parse`, `helmet`, `zod`).
- [`backend/tsconfig.json`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/backend/tsconfig.json): Server TypeScript setup with NodeNext ES2022 modules.

### Source Files (`backend/src/`)
- [`src/server.ts`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/backend/src/server.ts): Initializes database pool, starts Express HTTP listener on port 5000, and binds SIGTERM/SIGINT shutdown handlers.
- [`src/app.ts`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/backend/src/app.ts): Express application factory configuring Helmet security headers, CORS allowlist, JSON body parsing (25MB limit), cookie parsing, rate limiters, route mounting, and central error handling.
- [`src/types/index.ts`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/backend/src/types/index.ts): Database record types and augmented `AuthenticatedRequest` (`req.user`).

### Configuration (`backend/src/config/`)
- [`config/env.ts`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/backend/src/config/env.ts): Zod schema for environment variables (`GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `JWT_ACCESS_SECRET`, etc.).
- [`config/database.ts`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/backend/src/config/database.ts): PostgreSQL connection pool via `pg.Pool`, Supabase client initialization, and an in-memory fallback store ensuring zero-crash local development.

### Middleware (`backend/src/middleware/`)
- [`middleware/auth.middleware.ts`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/backend/src/middleware/auth.middleware.ts): Verifies JWT access tokens from Authorization Bearer headers or HTTP-only cookies, injecting `req.user`.
- [`middleware/error.middleware.ts`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/backend/src/middleware/error.middleware.ts): Formats all runtime errors, Zod validation errors, and Multer upload limits into standard JSON responses without leaking stack traces.
- [`middleware/rateLimit.middleware.ts`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/backend/src/middleware/rateLimit.middleware.ts): Independent rate limiters: General (120 req/min), Auth (30 req/15 min), and AI (30 req/min).

### Route Controllers (`backend/src/routes/`)
- [`routes/auth.routes.ts`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/backend/src/routes/auth.routes.ts): `/register`, `/login`, `/refresh`, `/logout`, `/me`, `/change-password`, `/forgot-password`.
- [`routes/workspaces.routes.ts`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/backend/src/routes/workspaces.routes.ts): Workspace CRUD operations with strict `user_id` ownership verification.
- [`routes/documents.routes.ts`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/backend/src/routes/documents.routes.ts): File upload handling via Multer, listing documents, fetching content, generating signed download URLs, retrying failed documents, and deletion.
- [`routes/search.routes.ts`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/backend/src/routes/search.routes.ts): `/search`, `/search/semantic`, and `/search/hybrid` endpoints.
- [`routes/ai.routes.ts`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/backend/src/routes/ai.routes.ts): `/chat` (grounded Q&A), `/compare` (cross-modal multi-file comparison), `/analyze`, `/generate` (artifacts), and `/capabilities`.
- [`routes/conversations.routes.ts`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/backend/src/routes/conversations.routes.ts): Conversation history threads and message listing.
- [`routes/artifacts.routes.ts`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/backend/src/routes/artifacts.routes.ts): Saved artifacts CRUD and `/export` endpoint (Markdown/TXT downloads).
- [`routes/health.routes.ts`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/backend/src/routes/health.routes.ts): `/health` (liveness) and `/ready` (dependency readiness).

### Core Services (`backend/src/services/`)
- [`services/gemini/gemini.service.ts`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/backend/src/services/gemini/gemini.service.ts): Server-side Google Gemini client (`@google/genai`), master system prompt, intent classification, grounded Q&A, cross-modal comparison, artifact generation, embedding generation, and backoff retry logic.
- [`services/retrieval/retrieval.service.ts`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/backend/src/services/retrieval/retrieval.service.ts): Text chunking with sliding window overlap and citation validation guard that rejects hallucinated citation IDs.
- [`services/storage/storage.service.ts`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/backend/src/services/storage/storage.service.ts): Private storage in Supabase Storage or local encrypted directory with HMAC-signed token URLs.
- [`services/extraction/extraction.service.ts`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/backend/src/services/extraction/extraction.service.ts): Text and metadata extraction for PDF, DOCX, CSV, JSON, TXT, images, audio, and video.
- [`services/ingestion/ingestion.service.ts`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/backend/src/services/ingestion/ingestion.service.ts): Ingestion pipeline worker: storage -> record creation -> text parsing -> chunking -> vector embeddings -> AI summary -> ready state.
- [`services/auth/auth.service.ts`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/backend/src/services/auth/auth.service.ts): bcrypt password hashing, token pair generation, refresh token hash storage, and session revocation.

### Automated Test Suite (`backend/src/tests/`)
- [`tests/api.test.ts`](file:///c:/Users/pydin/OneDrive/Desktop/Multimodel%20AI/backend/src/tests/api.test.ts): 11 automated Vitest tests covering health endpoints, user registration, duplicate prevention, password validation, token rotation, chunking, citation filtering, and intent classification.

---

## 4. Communication Boundary Between Frontend & Backend

The frontend and backend interact **only** through HTTP REST API requests.

```
+------------------------------------+          +--------------------------------------+
|       FRONTEND (frontend/)         |          |         BACKEND (backend/)           |
|                                    |  HTTPS   |                                      |
|  React UI Components & Pages       | -------> |  Express Router & Auth Middleware    |
|  Axios API Client (src/lib/api.ts) | <------- |  PostgreSQL Pool (Supabase)          |
|  Short-lived Access Token in Mem   |          |  Private Object Storage              |
|  HTTP-only Cookie (Refresh Token)  |          |  Google Gemini API (@google/genai)   |
+------------------------------------+          +--------------------------------------+
```
