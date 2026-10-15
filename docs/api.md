# OmniMind AI — REST API Documentation

Base URL: `/api/v1`

All protected endpoints require an `Authorization: Bearer <token>` header or an authenticated `accessToken` cookie.

---

## 1. Authentication Endpoints

### Register User
- **POST** `/auth/register`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!",
    "displayName": "Alex Vance"
  }
  ```
- **Response (201):**
  ```json
  {
    "success": true,
    "data": {
      "user": { "id": "uuid", "email": "user@example.com", "displayName": "Alex Vance" },
      "accessToken": "jwt_token_string"
    }
  }
  ```

### Login
- **POST** `/auth/login`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!"
  }
  ```

### Refresh Token
- **POST** `/auth/refresh`
- Uses HTTP-only cookie `refreshToken` or `{ "refreshToken": "..." }` in payload.
- Issues a new short-lived access token and rotates the refresh token.

### Current User
- **GET** `/auth/me`
- Returns authenticated identity.

---

## 2. Workspace Endpoints

### List Workspaces
- **GET** `/workspaces`
- Returns all workspaces owned by the authenticated user with document counts.

### Create Workspace
- **POST** `/workspaces`
- **Body:** `{ "name": "Research Lab", "description": "Notes", "category": "Research" }`

### Get Workspace Details
- **GET** `/workspaces/:workspaceId`
- Returns workspace metadata and associated documents list.

### Delete Workspace
- **DELETE** `/workspaces/:workspaceId`
- Removes workspace, all indexed chunks, and deletes files from storage.

---

## 3. Document Endpoints

### Upload Documents
- **POST** `/documents/upload`
- **Content-Type:** `multipart/form-data`
- **Fields:**
  - `workspaceId`: Target workspace UUID
  - `files`: One or more files (max 25MB each)
  - `category`: Optional category string
- **Response (201):** List of created document records in `queued` status.

### List Documents
- **GET** `/documents?workspaceId=&modality=&status=&search=`
- Filters documents by workspace, modality, status, or search query.

### Document Detail & Content
- **GET** `/documents/:documentId`: Metadata, status, chunk count.
- **GET** `/documents/:documentId/status`: Fast polling check (`queued`, `processing`, `ready`, `failed`).
- **GET** `/documents/:documentId/content`: Raw extracted text and chunk previews.
- **GET** `/documents/:documentId/download-url`: Generates signed download URL with 1-hour expiration.
- **POST** `/documents/:documentId/retry`: Retries failed extraction job.
- **DELETE** `/documents/:documentId`: Deletes file from storage and cleans up chunks.

---

## 4. AI & Knowledge Endpoints

### Contextual OmniMind Grounded Chat
- **POST** `/ai/chat`
- **Body:**
  ```json
  {
    "question": "What architecture decisions are outlined in these documents?",
    "conversationId": "optional-uuid",
    "workspaceId": "optional-uuid",
    "documentIds": ["uuid-1", "uuid-2"],
    "detailLevel": "concise" | "balanced" | "detailed"
  }
  ```
- **Response (200):**
  ```json
  {
    "success": true,
    "data": {
      "conversationId": "uuid",
      "messageId": "uuid",
      "answer": "Markdown answer grounded in verified evidence...",
      "confidence": "high",
      "keyFindings": ["Finding 1", "Finding 2"],
      "citations": [
        {
          "document_id": "uuid",
          "document_name": "architecture.pdf",
          "page_number": 3,
          "quoted_text": "...",
          "relevance_score": 0.94
        }
      ]
    }
  }
  ```

### Cross-Modal Comparison
- **POST** `/ai/compare`
- **Body:**
  ```json
  {
    "documentIds": ["uuid-pdf", "uuid-diagram"],
    "objective": "Compare deployment steps between document and diagram"
  }
  ```

### Generate Artifact
- **POST** `/ai/generate`
- **Body:**
  ```json
  {
    "artifactType": "study_guide" | "executive_summary" | "meeting_minutes" | "flashcards" | "action_items",
    "title": "Systems Review Guide",
    "workspaceId": "uuid",
    "prompt": "Focus on database scaling"
  }
  ```

---

## 5. Search Endpoints

### Hybrid Search
- **POST** `/search/hybrid`
- **Body:**
  ```json
  {
    "query": "vector similarity and pgvector indexing",
    "workspaceId": "uuid",
    "limit": 10
  }
  ```

---

## 6. Operational Endpoints

### Liveness Probe
- **GET** `/health`
- Returns: `{ "status": "healthy", "service": "omnimind-api" }`

### Readiness Probe
- **GET** `/ready`
- Returns status of database, storage, and AI engine dependencies.
