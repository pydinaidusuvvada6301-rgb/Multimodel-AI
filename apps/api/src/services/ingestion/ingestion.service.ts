import crypto from 'crypto';
import { inMemoryDb, pool, isPostgresConnected } from '../../config/database.js';
import { DocumentRecord, DocumentChunkRecord } from '../../types/index.js';
import { StorageService } from '../storage/storage.service.js';
import { ExtractionService } from '../extraction/extraction.service.js';
import { GeminiService } from '../gemini/gemini.service.js';
import { RetrievalService } from '../retrieval/retrieval.service.js';

export class IngestionService {
  /**
   * Process a file buffer into stored document and index chunks
   */
  public static async ingestFile(options: {
    userId: string;
    workspaceId: string;
    originalFilename: string;
    mimeType: string;
    buffer: Buffer;
    category?: string;
    tags?: string[];
  }): Promise<DocumentRecord> {
    const {
      userId,
      workspaceId,
      originalFilename,
      mimeType,
      buffer,
      category = 'general',
      tags = [],
    } = options;

    const documentId = crypto.randomUUID();
    const modality = ExtractionService.detectModality(mimeType, originalFilename);

    // 1. Upload to Storage
    const storageResult = await StorageService.uploadFile(
      userId,
      workspaceId,
      documentId,
      originalFilename,
      mimeType,
      buffer
    );

    // 2. Create Initial Document Record
    const now = new Date().toISOString();
    const docRecord: DocumentRecord = {
      id: documentId,
      user_id: userId,
      workspace_id: workspaceId,
      original_filename: originalFilename,
      display_name: originalFilename,
      mime_type: mimeType,
      modality,
      file_size_bytes: storageResult.fileSizeBytes,
      storage_bucket: storageResult.bucket,
      storage_path: storageResult.storagePath,
      sha256_hash: storageResult.sha256,
      status: 'queued',
      processing_error_code: null,
      processing_error_message: null,
      extracted_text: null,
      summary: null,
      page_count: null,
      duration_seconds: null,
      category,
      tags,
      metadata: {},
      created_at: now,
      updated_at: now,
      processed_at: null,
      deleted_at: null,
    };

    // Save in in-memory DB
    inMemoryDb.documents.set(documentId, docRecord);

    // Save in Postgres if connected
    if (isPostgresConnected && pool) {
      try {
        await pool.query(
          `INSERT INTO documents (
            id, user_id, workspace_id, original_filename, display_name, mime_type, modality,
            file_size_bytes, storage_bucket, storage_path, sha256_hash, status, category, tags
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            docRecord.id,
            docRecord.user_id,
            docRecord.workspace_id,
            docRecord.original_filename,
            docRecord.display_name,
            docRecord.mime_type,
            docRecord.modality,
            docRecord.file_size_bytes,
            docRecord.storage_bucket,
            docRecord.storage_path,
            docRecord.sha256_hash,
            docRecord.status,
            docRecord.category,
            docRecord.tags,
          ]
        );
      } catch (err: any) {
        console.warn('⚠️ Error inserting document into PostgreSQL:', err.message);
      }
    }

    // 3. Trigger Asynchronous Processing Job
    this.processDocumentAsync(documentId, buffer).catch((err) => {
      console.error(`💥 Background processing failed for ${documentId}:`, err);
    });

    return docRecord;
  }

  /**
   * Background Worker for Text Extraction, Chunking, Embedding, and AI Summarization
   */
  public static async processDocumentAsync(documentId: string, buffer?: Buffer): Promise<void> {
    const doc = inMemoryDb.documents.get(documentId);
    if (!doc) return;

    try {
      doc.status = 'processing';
      doc.updated_at = new Date().toISOString();

      let fileBuffer = buffer;
      if (!fileBuffer) {
        fileBuffer = await StorageService.getFileBuffer(doc.storage_bucket, doc.storage_path);
      }

      // Extract content
      const extracted = await ExtractionService.extractContent(
        fileBuffer,
        doc.mime_type,
        doc.original_filename,
        doc.modality
      );

      doc.extracted_text = extracted.text;
      doc.page_count = extracted.pageCount || null;
      doc.duration_seconds = extracted.durationSeconds || null;
      doc.metadata = { ...doc.metadata, ...extracted.metadata };

      // Generate AI Summary & Key Points
      if (doc.modality === 'audio' || doc.modality === 'video') {
        const mediaAnalysis = await GeminiService.analyzeMedia(
          doc.original_filename,
          doc.modality as any,
          extracted.text
        );
        doc.summary = mediaAnalysis.summary;
        doc.metadata.mediaAnalysis = mediaAnalysis;
      } else {
        const docAnalysis = await GeminiService.analyzeDocument(
          doc.original_filename,
          extracted.text,
          doc.modality
        );
        doc.summary = docAnalysis.summary;
        doc.metadata.analysis = docAnalysis;
      }

      // Chunk document for RAG retrieval
      const chunks = RetrievalService.chunkText(extracted.text, {
        modality: doc.modality,
        pageNumber: doc.page_count || 1,
      });

      // Clear any prior chunks for this document (e.g. on retry)
      for (const [chunkId, c] of inMemoryDb.document_chunks.entries()) {
        if (c.document_id === documentId) {
          inMemoryDb.document_chunks.delete(chunkId);
        }
      }

      // Store chunks and generate embeddings
      for (const ch of chunks) {
        const chunkId = crypto.randomUUID();
        const embedding = await GeminiService.generateEmbedding(ch.content);

        const chunkRecord: DocumentChunkRecord = {
          id: chunkId,
          document_id: doc.id,
          user_id: doc.user_id,
          workspace_id: doc.workspace_id,
          chunk_index: ch.chunk_index,
          content: ch.content,
          modality: doc.modality,
          page_number: ch.page_number || null,
          start_seconds: ch.start_seconds || null,
          end_seconds: ch.end_seconds || null,
          metadata: {},
          embedding: embedding || undefined,
          created_at: new Date().toISOString(),
        };

        inMemoryDb.document_chunks.set(chunkId, chunkRecord);

        if (isPostgresConnected && pool) {
          try {
            await pool.query(
              `INSERT INTO document_chunks (
                id, document_id, user_id, workspace_id, chunk_index, content, modality,
                page_number, start_seconds, end_seconds, metadata, embedding
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
              ON CONFLICT (document_id, chunk_index) DO UPDATE
              SET content = EXCLUDED.content, embedding = EXCLUDED.embedding`,
              [
                chunkRecord.id,
                chunkRecord.document_id,
                chunkRecord.user_id,
                chunkRecord.workspace_id,
                chunkRecord.chunk_index,
                chunkRecord.content,
                chunkRecord.modality,
                chunkRecord.page_number,
                chunkRecord.start_seconds,
                chunkRecord.end_seconds,
                chunkRecord.metadata,
                embedding ? `[${embedding.join(',')}]` : null,
              ]
            );
          } catch (err: any) {
            console.warn('⚠️ Error inserting chunk into PostgreSQL:', err.message);
          }
        }
      }

      // Finalize Ready Status
      doc.status = 'ready';
      doc.processed_at = new Date().toISOString();
      doc.updated_at = new Date().toISOString();

      if (isPostgresConnected && pool) {
        try {
          await pool.query(
            `UPDATE documents
             SET status = 'ready', extracted_text = $1, summary = $2, page_count = $3,
                 duration_seconds = $4, metadata = $5, processed_at = now(), updated_at = now()
             WHERE id = $6`,
            [
              doc.extracted_text,
              doc.summary,
              doc.page_count,
              doc.duration_seconds,
              doc.metadata,
              doc.id,
            ]
          );
        } catch (err: any) {
          console.warn('⚠️ Error updating document status in PostgreSQL:', err.message);
        }
      }

      console.log(`✅ Document "${doc.original_filename}" processed successfully (${chunks.length} chunks indexed)`);
    } catch (err: any) {
      console.error(`❌ Error processing document ${documentId}:`, err);
      doc.status = 'failed';
      doc.processing_error_code = 'PROCESSING_ERROR';
      doc.processing_error_message = err.message || 'An error occurred during extraction or indexing';
      doc.updated_at = new Date().toISOString();

      if (isPostgresConnected && pool) {
        try {
          await pool.query(
            `UPDATE documents
             SET status = 'failed', processing_error_code = $1, processing_error_message = $2, updated_at = now()
             WHERE id = $3`,
            [doc.processing_error_code, doc.processing_error_message, doc.id]
          );
        } catch {}
      }
    }
  }

  /**
   * Retry a failed document processing job
   */
  public static async retryDocument(documentId: string, userId: string): Promise<DocumentRecord> {
    const doc = inMemoryDb.documents.get(documentId);
    if (!doc || doc.user_id !== userId) {
      throw new Error('Document not found or unauthorized');
    }

    doc.status = 'queued';
    doc.processing_error_code = null;
    doc.processing_error_message = null;
    doc.updated_at = new Date().toISOString();

    this.processDocumentAsync(documentId).catch((err) => {
      console.error(`Retry processing failed for ${documentId}:`, err);
    });

    return doc;
  }
}
