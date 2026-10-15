import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { parse as parseCsv } from 'csv-parse/sync';
import { ModalityType } from '../../types/index.js';
import { GeminiService } from '../gemini/gemini.service.js';

export interface ExtractionResult {
  text: string;
  pageCount?: number;
  durationSeconds?: number;
  metadata: Record<string, any>;
}

export class ExtractionService {
  /**
   * Determine modality from MIME type and filename extension
   */
  public static detectModality(mimeType: string, filename: string): ModalityType {
    const ext = filename.split('.').pop()?.toLowerCase() || '';

    if (mimeType.includes('pdf') || ext === 'pdf') {
      return 'document';
    }
    if (
      mimeType.includes('word') ||
      mimeType.includes('officedocument') ||
      ext === 'docx' ||
      ext === 'doc'
    ) {
      return 'document';
    }
    if (mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
      return 'image';
    }
    if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'm4a', 'ogg', 'aac'].includes(ext)) {
      return 'audio';
    }
    if (mimeType.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) {
      return 'video';
    }
    if (mimeType === 'application/json' || mimeType === 'text/csv' || ext === 'json' || ext === 'csv') {
      return 'structured';
    }
    return 'text';
  }

  /**
   * Extract text content and metadata from buffer
   */
  public static async extractContent(
    buffer: Buffer,
    mimeType: string,
    filename: string,
    modality: ModalityType
  ): Promise<ExtractionResult> {
    const ext = filename.split('.').pop()?.toLowerCase() || '';

    try {
      // 1. PDF Documents
      if (mimeType.includes('pdf') || ext === 'pdf') {
        const pdfData = await pdfParse(buffer);
        return {
          text: pdfData.text.trim(),
          pageCount: pdfData.numpages || 1,
          metadata: {
            info: pdfData.info || {},
            pageCount: pdfData.numpages,
          },
        };
      }

      // 2. DOCX Word Documents
      if (
        mimeType.includes('word') ||
        mimeType.includes('officedocument') ||
        ext === 'docx'
      ) {
        const docResult = await mammoth.extractRawText({ buffer });
        return {
          text: docResult.value.trim(),
          metadata: {
            messages: docResult.messages,
          },
        };
      }

      // 3. Structured Data: CSV
      if (mimeType.includes('csv') || ext === 'csv') {
        const raw = buffer.toString('utf-8');
        try {
          const records = parseCsv(raw, { columns: true, skip_empty_lines: true });
          const textSummary = `CSV Data (${records.length} rows):\n` +
            JSON.stringify(records.slice(0, 50), null, 2);
          return {
            text: textSummary,
            metadata: {
              rowCount: records.length,
              columns: records.length > 0 ? Object.keys(records[0]) : [],
            },
          };
        } catch {
          return {
            text: raw.slice(0, 100000),
            metadata: { format: 'csv_raw' },
          };
        }
      }

      // 4. Structured Data: JSON
      if (mimeType.includes('json') || ext === 'json') {
        const raw = buffer.toString('utf-8');
        try {
          const parsed = JSON.parse(raw);
          return {
            text: JSON.stringify(parsed, null, 2).slice(0, 100000),
            metadata: {
              isJson: true,
              type: Array.isArray(parsed) ? 'array' : typeof parsed,
            },
          };
        } catch {
          return { text: raw, metadata: { parseError: true } };
        }
      }

      // 5. Plain Text / Markdown / Code
      if (modality === 'text' || ext === 'txt' || ext === 'md' || ext === 'markdown') {
        return {
          text: buffer.toString('utf-8'),
          metadata: { encoding: 'utf-8' },
        };
      }

      // 6. Images (Gemini Multimodal Vision Analysis)
      if (modality === 'image') {
        const visionResult = await GeminiService.extractVisionContent(buffer, mimeType, filename);
        return {
          text: visionResult.text,
          metadata: {
            ...visionResult.metadata,
            filename,
          },
        };
      }

      // 7. Audio & Video (Gemini Multimodal Temporal & Audio Analysis)
      if (modality === 'audio' || modality === 'video') {
        const mediaResult = await GeminiService.extractMediaContent(buffer, mimeType, filename, modality);
        return {
          text: mediaResult.text,
          durationSeconds: mediaResult.durationSeconds,
          metadata: {
            ...mediaResult.metadata,
            transcriptExcerpt: mediaResult.transcript.slice(0, 500),
            filename,
          },
        };
      }

      // Fallback
      return {
        text: buffer.toString('utf-8').slice(0, 50000),
        metadata: { defaultFallback: true },
      };
    } catch (err: any) {
      console.warn(`Extraction error for ${filename}:`, err.message);
      return {
        text: `Error extracting content: ${err.message}`,
        metadata: { extractionError: err.message },
      };
    }
  }
}
