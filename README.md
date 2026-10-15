# OmniMind AI
### One Workspace. Every Modality. Connected Intelligence.

[![OmniMind CI](https://github.com/omnimind-ai/omnimind-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/omnimind-ai/omnimind-ai/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Powered by: Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini%202.5%20Flash-06b6d4)](https://ai.google.dev/)

---

## 1. Problem Statement
Modern users store related knowledge across PDFs, images, audio recordings, videos, and text files, making it difficult to search and connect information across formats. Traditional applications process these materials in isolation, forcing users to manually correlate facts across separate viewers and transcription tools. OmniMind AI solves this fragmentation by providing a secure multimodal workspace that extracts, indexes, analyzes, and connects information across different media, enabling users to ask contextual questions, compare sources, and generate evidence-grounded insights from one unified interface.

---

## 2. Solution Description
OmniMind AI is a production-grade full-stack multimodal intelligence platform built with React, Vite, Express, Supabase PostgreSQL with pgvector, private object storage, and Google's official Gemini API SDK (`@google/genai`). It combines multimodal ingestion, document extraction, audio and video understanding, hybrid search, contextual AI conversations, cross-source comparison, and evidence-linked answers. A secure backend manages authentication, file processing, retrieval, and AI orchestration, while a responsive dark-mode interface allows users to explore and generate insights from their knowledge collections.

---

## 3. Clear Differentiation: Frontend vs Backend Files

OmniMind AI is organized as a clean monorepo with strict separation of concerns between client and server:

```
omnimind-ai/
├── apps/
│   ├── web/                    <--- [FRONTEND APPLICATION]
│   │   ├── src/
│   │   │   ├── components/     # UI, Chat, Layout, Upload components
│   │   │   ├── pages/          # React Router pages (Landing, Login, Dashboard, Chat, etc.)
│   │   │   ├── context/        # AuthContext & Session management
│   │   │   ├── lib/            # Axios API client, utils, formatters
│   │   │   ├── types/          # Frontend TypeScript contracts
│   │   │   ├── App.tsx         # Route registry
│   │   │   └── main.tsx        # React entrypoint
│   │   ├── index.html          # HTML5 shell with Inter typography
│   │   ├── tailwind.config.js  # Styling & design system tokens
│   │   ├── vite.config.ts      # Vite bundler & API proxy config
│   │   └── package.json        # Frontend dependencies
│   │
│   └── api/                    <--- [BACKEND API & AI GATEWAY]
│       ├── src/
│       │   ├── config/         # Zod validated env & database connections
│       │   ├── middleware/     # Auth (JWT), Rate limiting, Central error handler
│       │   ├── routes/         # REST API routes (/auth, /workspaces, /documents, /ai, etc.)
│       │   ├── services/
│       │   │   ├── gemini/     # Official @google/genai orchestration & prompts
│       │   │   ├── retrieval/  # RAG chunking & citation verification guard
│       │   │   ├── storage/    # Private storage & HMAC signed download URLs
│       │   │   ├── extraction/ # PDF, DOCX, CSV, JSON, Audio/Video parsers
│       │   │   └── ingestion/  # End-to-end background ingestion pipeline
│       │   ├── types/          # Domain types & Express request augmentation
│       │   ├── tests/          # Automated Vitest test suite
│       │   ├── app.ts          # Express application configuration
│       │   └── server.ts       # Server bootstrap & graceful shutdown
│       ├── tsconfig.json       # Backend TypeScript configuration
│       └── package.json        # Backend dependencies
│
├── supabase/
│   ├── migrations/             # Version-controlled PostgreSQL SQL migrations
│   └── seed.sql                # Development & judge demo seed data
├── docs/                       # Architecture, API, Security, Deployment & Demo script
├── postman/                    # Postman collection for manual API testing
└── .github/workflows/          # GitHub Actions CI workflow
```

---

## 4. Key Features & Capabilities

- **Multimodal Ingestion:** Native extraction for PDFs, Word DOCX, TXT, CSV, JSON, PNG/JPG/WEBP images, MP3/WAV/M4A audio, and MP4/WEBM video.
- **Evidence-Grounded Question Answering:** Every factual claim cites an authorized evidence item with page numbers, timestamps, or quotes.
- **Citation Integrity Guard:** Model-hallucinated citation IDs that do not exist in the retrieved evidence set are rejected before reaching the user.
- **Cross-Modal Comparison:** Compare multiple files of different modalities (e.g., comparing an architectural PDF specification with an uploaded screenshot diagram).
- **Hybrid Semantic Search:** Combines pgvector cosine similarity embeddings with full-text keyword ranking.
- **Content Generation:** Generates Study Guides, Executive Summaries, Meeting Minutes, Flashcards, and Action Items with Markdown & TXT export.
- **Multi-Tenant Security:** Password hashing with bcrypt, rotating refresh tokens in HTTP-only cookies, and strict per-user ownership scoping.

---

## 5. Quickstart & Local Setup

### Prerequisites
- Node.js v18+ (tested on v24.21.0)
- npm v9+

### 1. Clone & Install
```bash
git clone https://github.com/your-username/omnimind-ai.git
cd omnimind-ai
npm install
```

### 2. Configure Environment
Copy `.env.example` to root or configure `apps/api/.env`:
```bash
cp .env.example apps/api/.env
```
Key variables:
- `GEMINI_API_KEY`: Your Google Gemini API Key from Google AI Studio.
- `JWT_ACCESS_SECRET`: Minimum 32-character secure secret string.
- `SUPABASE_DB_URL` (optional): PostgreSQL connection string. If omitted, OmniMind AI automatically uses an in-memory database store so you can explore immediately without external database dependencies.

### 3. Run Locally
Run both backend and frontend concurrently:
```bash
# Terminal 1: Start Backend API (Port 5000)
npm run dev:api

# Terminal 2: Start Frontend Web App (Port 5173)
npm run dev:web
```

Access the application in your browser at `http://localhost:5173`.

---

## 6. Demo Account Credentials (Judge Access)

For judges and reviewers, a pre-seeded account is available directly on the login screen via the **Instant Demo** button, or by entering:
- **Email:** `demo@omnimind.ai`
- **Password:** `Password123!`

---

## 7. Running Tests & Builds

```bash
# Run backend test suite (11 passing tests)
npm test

# Build backend TypeScript
npm run build:api

# Build frontend Vite application
npm run build:web
```

---

## 8. Deployment Guide Summary

- **Supabase:** Apply migrations in `supabase/migrations/20261015000000_init_omnimind_schema.sql` and create a private bucket named `omnimind-private`.
- **Render:** Deploy `apps/api` as a Node web service with `npm install && npm run build` and start command `npm start`.
- **Vercel:** Deploy `apps/web` with Vite preset and set `VITE_API_BASE_URL` to your Render API URL.
- Detailed step-by-step instructions are documented in [docs/deployment.md](docs/deployment.md).

---

## 9. Submission Deliverables & Documentation

- [Architecture & Diagrams](docs/architecture.md)
- [REST API Specification](docs/api.md)
- [Security & Isolation Policy](docs/security.md)
- [Deployment Instructions](docs/deployment.md)
- [3–5 Minute Judge Demo Script](docs/demo-script.md)
- [Postman Collection](postman/omnimind-api.postman_collection.json)
