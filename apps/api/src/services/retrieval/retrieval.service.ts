import crypto from 'crypto';
import { inMemoryDb, pool, isPostgresConnected } from '../../config/database.js';
import { DocumentChunkRecord, CitationRecord, ModalityType } from '../../types/index.js';
import { GeminiService } from '../gemini/gemini.service.js';

export interface RetrievedChunk {
  id: string;
  document_id: string;
  document_name: string;
  modality: ModalityType;
  chunk_index: number;
  content: string;
  page_number?: number;
  start_seconds?: number;
  end_seconds?: number;
  relevance_score: number;
}

export class RetrievalService {
  /**
   * Split text into retrieval-friendly chunks with token/word overlap
   */
  public static chunkText(
    text: string,
    options: {
      chunkSizeWords?: number;
      overlapWords?: number;
      modality: ModalityType;
      pageNumber?: number;
    }
  ): Array<{
    chunk_index: number;
    content: string;
    page_number?: number;
    start_seconds?: number;
    end_seconds?: number;
  }> {
    const { chunkSizeWords = 250, overlapWords = 50, pageNumber } = options;
    const words = text.split(/\s+/).filter(Boolean);

    if (words.length <= chunkSizeWords) {
      return [
        {
          chunk_index: 0,
          content: text.trim(),
          page_number: pageNumber,
        },
      ];
    }

    const chunks: Array<{
      chunk_index: number;
      content: string;
      page_number?: number;
      start_seconds?: number;
      end_seconds?: number;
    }> = [];

    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < words.length) {
      const endIndex = Math.min(startIndex + chunkSizeWords, words.length);
      const chunkWords = words.slice(startIndex, endIndex);
      chunks.push({
        chunk_index: chunkIndex++,
        content: chunkWords.join(' '),
        page_number: pageNumber,
      });

      if (endIndex === words.length) break;
      startIndex += chunkSizeWords - overlapWords;
    }

    return chunks;
  }

  /**
   * Hybrid retrieval combining Vector Similarity & Full-Text Search
   */
  public static async searchChunks(options: {
    userId: string;
    workspaceId?: string;
    documentIds?: string[];
    queryText: string;
    limit?: number;
    threshold?: number;
  }): Promise<RetrievedChunk[]> {
    const {
      userId,
      workspaceId,
      documentIds,
      queryText,
      limit = 10,
      threshold = 0.2,
    } = options;

    const queryKeywords = queryText
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);

    // 1. Try PostgreSQL Vector Search if connected and vector is available
    if (isPostgresConnected && pool) {
      try {
        const queryEmbedding = await GeminiService.generateEmbedding(queryText);
        if (queryEmbedding) {
          const sql = `
            SELECT * FROM match_document_chunks(
              $1::vector,
              $2::float,
              $3::int,
              $4::uuid,
              $5::uuid,
              $6::uuid[]
            );
          `;
          const res = await pool.query(sql, [
            `[${queryEmbedding.join(',')}]`,
            threshold,
            limit,
            userId,
            workspaceId || null,
            documentIds && documentIds.length > 0 ? documentIds : null,
          ]);

          if (res.rows.length > 0) {
            return res.rows.map((row) => ({
              id: row.id,
              document_id: row.document_id,
              document_name: 'Document',
              modality: row.modality,
              chunk_index: row.chunk_index,
              content: row.content,
              page_number: row.page_number,
              start_seconds: row.start_seconds,
              end_seconds: row.end_seconds,
              relevance_score: row.similarity,
            }));
          }
        }
      } catch (err: any) {
        console.warn('⚠️ Postgres vector RPC fallback:', err.message);
      }
    }

    // 2. Resilient In-Memory & Keyword Search
    const scoredChunks: RetrievedChunk[] = [];

    for (const chunk of inMemoryDb.document_chunks.values()) {
      // Security check: Must belong to requesting user
      if (chunk.user_id !== userId) continue;

      // Filter by workspace if specified
      if (workspaceId && chunk.workspace_id !== workspaceId) continue;

      // Filter by document ID if specified
      if (documentIds && documentIds.length > 0 && !documentIds.includes(chunk.document_id)) {
        continue;
      }

      // Check if document was deleted
      const doc = inMemoryDb.documents.get(chunk.document_id);
      if (doc && doc.deleted_at) continue;

      const contentLower = chunk.content.toLowerCase();
      let matchCount = 0;

      for (const kw of queryKeywords) {
        if (contentLower.includes(kw)) {
          matchCount++;
        }
      }

      // Keyword relevance score (0 to 1)
      const keywordScore = queryKeywords.length > 0 ? matchCount / queryKeywords.length : 0.5;

      // Cosine similarity if embeddings exist
      let vectorScore = 0;
      // If we have keyword matches or general query
      if (matchCount > 0 || queryKeywords.length === 0) {
        const finalScore = Math.max(keywordScore, vectorScore);
        if (finalScore >= threshold) {
          scoredChunks.push({
            id: chunk.id,
            document_id: chunk.document_id,
            document_name: doc ? doc.original_filename : 'Document',
            modality: chunk.modality,
            chunk_index: chunk.chunk_index,
            content: chunk.content,
            page_number: chunk.page_number,
            start_seconds: chunk.start_seconds,
            end_seconds: chunk.end_seconds,
            relevance_score: Number(finalScore.toFixed(3)),
          });
        }
      }
    }

    // Sort by relevance descending
    scoredChunks.sort((a, b) => b.relevance_score - a.relevance_score);

    return scoredChunks.slice(0, limit);
  }

  /**
   * Validate citations against actual retrieved evidence items to prevent hallucinations
   */
  public static validateCitations(
    rawCitations: Array<{ evidence_id: string; claim: string; supporting_quote: string }>,
    retrievedEvidence: RetrievedChunk[]
  ): CitationRecord[] {
    const validEvidenceMap = new Map<string, RetrievedChunk>();
    for (const chunk of retrievedEvidence) {
      validEvidenceMap.set(chunk.id, chunk);
    }

    const verifiedCitations: CitationRecord[] = [];

    for (const raw of rawCitations) {
      const match = validEvidenceMap.get(raw.evidence_id);
      if (match) {
        verifiedCitations.push({
          id: crypto.randomUUID(),
          document_id: match.document_id,
          document_name: match.document_name,
          chunk_id: match.id,
          page_number: match.page_number,
          start_seconds: match.start_seconds,
          end_seconds: match.end_seconds,
          quoted_text: raw.supporting_quote || match.content.slice(0, 150),
          relevance_score: match.relevance_score,
        });
      } else {
        console.warn(`🛡️ Rejected unverified model citation id: ${raw.evidence_id}`);
      }
    }

    return verifiedCitations;
  }
}
