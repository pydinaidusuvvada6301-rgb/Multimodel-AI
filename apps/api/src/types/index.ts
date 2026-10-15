import { Request } from 'express';

export type ModalityType = 'document' | 'image' | 'audio' | 'video' | 'structured' | 'text';

export type ProcessingStatus = 'queued' | 'uploading' | 'processing' | 'ready' | 'failed' | 'deleting';

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export interface WorkspaceRecord {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentRecord {
  id: string;
  user_id: string;
  workspace_id: string;
  original_filename: string;
  display_name: string | null;
  mime_type: string;
  modality: ModalityType;
  file_size_bytes: number;
  storage_bucket: string;
  storage_path: string;
  sha256_hash: string | null;
  status: ProcessingStatus;
  processing_error_code: string | null;
  processing_error_message: string | null;
  extracted_text: string | null;
  summary: string | null;
  page_count: number | null;
  duration_seconds: number | null;
  category: string;
  tags: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
  deleted_at: string | null;
}

export interface DocumentChunkRecord {
  id: string;
  document_id: string;
  user_id: string;
  workspace_id: string;
  chunk_index: number;
  content: string;
  modality: ModalityType;
  page_number: number | null;
  start_seconds: number | null;
  end_seconds: number | null;
  metadata: Record<string, any>;
  embedding?: number[];
  similarity?: number;
  created_at: string;
}

export interface ConversationRecord {
  id: string;
  user_id: string;
  workspace_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface MessageRecord {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  status: 'pending' | 'streaming' | 'complete' | 'error';
  model_name: string | null;
  token_usage: Record<string, any>;
  created_at: string;
  citations?: CitationRecord[];
}

export interface CitationRecord {
  id?: string;
  message_id?: string;
  document_id: string;
  document_name?: string;
  chunk_id?: string;
  page_number?: number;
  start_seconds?: number;
  end_seconds?: number;
  quoted_text?: string;
  relevance_score?: number;
}

export interface ArtifactRecord {
  id: string;
  user_id: string;
  workspace_id: string | null;
  title: string;
  artifact_type: string;
  content_markdown: string;
  source_document_ids: string[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}
