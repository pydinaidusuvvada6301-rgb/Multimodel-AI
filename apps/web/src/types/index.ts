export type ModalityType = 'document' | 'image' | 'audio' | 'video' | 'structured' | 'text';

export type ProcessingStatus = 'queued' | 'uploading' | 'processing' | 'ready' | 'failed' | 'deleting';

export interface User {
  id: string;
  email: string;
  displayName: string;
}

export interface Workspace {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string;
  documentCount?: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentItem {
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
  chunk_count?: number;
  created_at: string;
  updated_at: string;
  processed_at: string | null;
}

export interface Citation {
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

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  status: 'pending' | 'streaming' | 'complete' | 'error';
  model_name?: string | null;
  created_at: string;
  citations?: Citation[];
  confidence?: 'high' | 'medium' | 'low';
  keyFindings?: string[];
  intent?: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  workspace_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface GeneratedArtifact {
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
