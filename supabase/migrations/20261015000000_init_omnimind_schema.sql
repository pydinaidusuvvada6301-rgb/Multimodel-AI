-- ============================================================================
-- OmniMind AI — Production PostgreSQL Database Schema Migration
-- Migration: 20261015000000_init_omnimind_schema.sql
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Conditionally enable pgvector if available on target PostgreSQL instance
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS "vector";
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'pgvector extension not installed; skipping pgvector creation.';
END $$;

-- ============================================================================
-- 1. App Users (Authoritative Identity Store for Custom JWT Authentication)
-- ============================================================================
CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    email_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case-insensitive unique constraint on email
CREATE UNIQUE INDEX IF NOT EXISTS idx_app_users_email_lower ON app_users (LOWER(email));

-- ============================================================================
-- 2. Profiles (Public/Metadata details per user)
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    bio TEXT,
    preferences JSONB NOT NULL DEFAULT '{"theme": "dark", "defaultDetail": "balanced"}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 3. Refresh Sessions (Secure JWT Refresh Token Rotation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS refresh_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    user_agent TEXT,
    ip_address TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refresh_sessions_user_id ON refresh_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_sessions_token_hash ON refresh_sessions(token_hash);

-- ============================================================================
-- 4. Workspaces (Knowledge Collections)
-- ============================================================================
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON workspaces(user_id);

-- ============================================================================
-- 5. Documents (Multimodal Ingested Sources)
-- ============================================================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    original_filename TEXT NOT NULL,
    display_name TEXT,
    mime_type TEXT NOT NULL,
    modality TEXT NOT NULL CHECK (modality IN ('document', 'image', 'audio', 'video', 'structured', 'text')),
    file_size_bytes BIGINT NOT NULL,
    storage_bucket TEXT NOT NULL DEFAULT 'omnimind-private',
    storage_path TEXT NOT NULL,
    sha256_hash TEXT,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'uploading', 'processing', 'ready', 'failed', 'deleting')),
    processing_error_code TEXT,
    processing_error_message TEXT,
    extracted_text TEXT,
    summary TEXT,
    page_count INTEGER,
    duration_seconds NUMERIC,
    category TEXT DEFAULT 'general',
    tags TEXT[] DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_workspace_id ON documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_modality ON documents(modality);
CREATE INDEX IF NOT EXISTS idx_documents_deleted_at ON documents(deleted_at);

-- Full-text search index on extracted text and summary
ALTER TABLE documents ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(original_filename, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(extracted_text, ''))
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_documents_search_vector ON documents USING GIN (search_vector);

-- ============================================================================
-- 6. Document Chunks (RAG Knowledge Representation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    modality TEXT NOT NULL,
    page_number INTEGER,
    start_seconds NUMERIC,
    end_seconds NUMERIC,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_doc_chunk_index UNIQUE (document_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_chunks_user_workspace ON document_chunks(user_id, workspace_id);
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON document_chunks(document_id);

-- Full-text search index on chunk content
ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS chunk_search_vector tsvector
    GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;
CREATE INDEX IF NOT EXISTS idx_chunks_search_vector ON document_chunks USING GIN (chunk_search_vector);

-- Conditionally add vector column (e.g. 768 dimensions for Gemini text-embedding-004) if vector extension is active
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vector') THEN
        ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS embedding vector(768);
        -- Index for fast cosine similarity search
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON document_chunks USING hnsw (embedding vector_cosine_ops)';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Vector column or HNSW index creation skipped: %', SQLERRM;
END $$;

-- ============================================================================
-- 7. Processing Jobs (Resilient Ingestion Job Queue)
-- ============================================================================
CREATE TABLE IF NOT EXISTS processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
    attempt_count INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    error_code TEXT,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    next_attempt_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_doc_id ON processing_jobs(document_id);

-- ============================================================================
-- 8. Conversations & Messages (Contextual Multimodal AI Chat)
-- ============================================================================
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Conversation',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_workspace_id ON conversations(workspace_id);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'complete' CHECK (status IN ('pending', 'streaming', 'complete', 'error')),
    model_name TEXT,
    token_usage JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

-- ============================================================================
-- 9. Message Citations (Grounded Source References)
-- ============================================================================
CREATE TABLE IF NOT EXISTS message_citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_id UUID REFERENCES document_chunks(id) ON DELETE SET NULL,
    page_number INTEGER,
    start_seconds NUMERIC,
    end_seconds NUMERIC,
    quoted_text TEXT,
    relevance_score NUMERIC,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_citations_message_id ON message_citations(message_id);
CREATE INDEX IF NOT EXISTS idx_citations_document_id ON message_citations(document_id);

-- ============================================================================
-- 10. Generated Artifacts (Reports, Study Guides, Flashcards, Summaries)
-- ============================================================================
CREATE TABLE IF NOT EXISTS generated_artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    artifact_type TEXT NOT NULL CHECK (
        artifact_type IN (
            'study_guide',
            'meeting_minutes',
            'research_brief',
            'executive_summary',
            'flashcards',
            'faq',
            'action_items',
            'comparison',
            'custom_report'
        )
    ),
    content_markdown TEXT NOT NULL,
    source_document_ids UUID[] NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_artifacts_user_id ON generated_artifacts(user_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_workspace_id ON generated_artifacts(workspace_id);

-- ============================================================================
-- 11. Audit Events (Operational & Security Logging)
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_user_id ON audit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_type ON audit_events(event_type);

-- ============================================================================
-- 12. Updated-At Triggers
-- ============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_app_users_updated_at ON app_users;
CREATE TRIGGER trigger_app_users_updated_at BEFORE UPDATE ON app_users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_workspaces_updated_at ON workspaces;
CREATE TRIGGER trigger_workspaces_updated_at BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_documents_updated_at ON documents;
CREATE TRIGGER trigger_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_conversations_updated_at ON conversations;
CREATE TRIGGER trigger_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trigger_generated_artifacts_updated_at ON generated_artifacts;
CREATE TRIGGER trigger_generated_artifacts_updated_at BEFORE UPDATE ON generated_artifacts FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- 13. Semantic Vector Similarity Search RPC Function (pgvector)
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vector') THEN
        CREATE OR REPLACE FUNCTION match_document_chunks(
            query_embedding vector(768),
            match_threshold float,
            match_count int,
            p_user_id uuid,
            p_workspace_id uuid DEFAULT NULL,
            p_doc_ids uuid[] DEFAULT NULL
        )
        RETURNS TABLE (
            id uuid,
            document_id uuid,
            chunk_index int,
            content text,
            modality text,
            page_number int,
            start_seconds numeric,
            end_seconds numeric,
            metadata jsonb,
            similarity float
        )
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $func$
        BEGIN
            RETURN QUERY
            SELECT
                dc.id,
                dc.document_id,
                dc.chunk_index,
                dc.content,
                dc.modality,
                dc.page_number,
                dc.start_seconds,
                dc.end_seconds,
                dc.metadata,
                1 - (dc.embedding <=> query_embedding) AS similarity
            FROM document_chunks dc
            JOIN documents d ON d.id = dc.document_id
            WHERE dc.user_id = p_user_id
              AND d.deleted_at IS NULL
              AND (p_workspace_id IS NULL OR dc.workspace_id = p_workspace_id)
              AND (p_doc_ids IS NULL OR dc.document_id = ANY(p_doc_ids))
              AND (1 - (dc.embedding <=> query_embedding)) >= match_threshold
            ORDER BY dc.embedding <=> query_embedding
            LIMIT match_count;
        END;
        $func$;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Vector match function creation skipped: %', SQLERRM;
END $$;
