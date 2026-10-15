# OmniMind AI — 3–5 Minute Judge Demonstration Script

## Overview
This script provides a structured, minute-by-minute walkthrough to demonstrate OmniMind AI's connected multimodal intelligence capabilities to judges.

---

## Minute-by-Minute Breakdown

### 0:00 – 0:25: The Problem
- **Narrative:** "Today, knowledge workers, researchers, and engineers store related information across fragmented formats: technical reports in PDFs, system diagrams in screenshots, sprint decisions in meeting recordings, and tutorials in videos. Traditional tools search these silos separately. There is no unified system that can answer a question requiring evidence from both a diagram and an audio recording."
- **Action:** Show the OmniMind AI landing page highlighting the core mission statement: *One Workspace. Every Modality. Connected Intelligence.*

### 0:25 – 0:50: OmniMind AI Architecture
- **Narrative:** "OmniMind AI solves this with a full-stack multimodal architecture. Our frontend is built in React, TypeScript, and Tailwind CSS. The backend Express gateway handles secure JWT rotation, private object storage, and orchestrates with Google's official Gemini API and PostgreSQL with pgvector for hybrid semantic retrieval."
- **Action:** Click "Instant Demo" on the login screen to enter the authenticated workspace instantly.

### 0:50 – 1:30: Multimodal Upload & Ingestion
- **Narrative:** "Let's open our 'Multimodal Research Lab' workspace and visit the Upload Center. Here we drag and drop a PDF technical specification alongside an architecture diagram and an audio sync recording. Watch as our ingestion worker extracts text, chunks the knowledge, computes 768-dimensional embeddings, and indexes everything into our knowledge layer."
- **Action:** Show the upload queue transition from `queued` to `ready`, then click into the document detail page to show the AI-generated executive summary and extracted entities.

### 1:30 – 2:10: Grounded Cross-Modal Question Answering
- **Narrative:** "Now let's launch OmniMind Chat. This is our central capability. We ask: *'Compare the database architecture described in our PDF with the visual schema shown in our diagram.'*"
- **Action:** Submit the question.
- **Narrative:** "Notice what happened: OmniMind classified the query intent, retrieved the candidate chunks across both modalities, synthesized the answer, and verified every citation. When we click on the citation chip, it shows the exact source document, page number, and quote from the original source. Any fabricated citation ID is automatically rejected by our server-side citation guard."

### 2:10 – 2:45: Audio & Video Temporal Intelligence
- **Narrative:** "Next, let's examine audio and video understanding. In our recording analysis, OmniMind extracts scene breakdowns and timestamped segments. When we ask *'What decisions were made regarding deployment?'*, it cites the exact moment at 01:45 in the recording."
- **Action:** Show the audio/video tab with timestamped segments and action items.

### 2:45 – 3:20: Hybrid Search & Retrieval
- **Narrative:** "Under Hybrid Search, users can search across all files using vector similarity combined with full-text keyword ranking. Watch as entering 'vector dimensions' retrieves both the PDF chunks and diagram annotations with relevance scores."
- **Action:** Type query into the search page and inspect the highlighted result snippets.

### 3:20 – 3:50: Content & Artifact Generation
- **Narrative:** "In the Reports Center, users can generate deliverables directly from their workspace evidence. We can generate an Executive Summary, Study Guide, or Action Items checklist. Here is our generated study guide, fully formatted in Markdown, which we can export as a `.md` or `.txt` file."
- **Action:** Click "Export MD" to demonstrate downloadable artifacts.

### 3:50 – 4:15: Security & Multi-Tenant Isolation
- **Narrative:** "Security is built-in: passwords hashed with bcrypt, rotating refresh tokens in HTTP-only cookies, strict user-ownership scoping on every database query, and private object storage with expiring HMAC signed URLs."
- **Action:** Briefly show the Settings page displaying database connectivity, Gemini model status, and account security.

### 4:15 – 4:30: Conclusion
- **Narrative:** "OmniMind AI connects fragmented knowledge across all formats into one intelligent workspace. Thank you."
