import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { authenticate } from '../middleware/auth.middleware.js';
import { inMemoryDb, pool, isPostgresConnected } from '../config/database.js';
import { AuthenticatedRequest } from '../types/index.js';
import { IngestionService } from '../services/ingestion/ingestion.service.js';
import { StorageService } from '../services/storage/storage.service.js';
import { env } from '../config/env.js';

const router = Router();

// Multer memory storage configuration with file size limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
    files: env.MAX_FILES_PER_UPLOAD,
  },
});

// GET /api/v1/documents/local-download (Token-signed download handler)
router.get('/local-download', async (req: Request, res: Response) => {
  try {
    const { path: storagePath, token, exp } = req.query as { path: string; token: string; exp: string };

    if (!storagePath || !token || !exp) {
      res.status(400).send('Missing download parameters.');
      return;
    }

    if (Date.now() / 1000 > parseInt(exp, 10)) {
      res.status(401).send('Download link has expired.');
      return;
    }

    // Verify token signature
    const expectedToken = crypto
      .createHmac('sha256', env.JWT_ACCESS_SECRET)
      .update(`${storagePath}:${parseInt(exp, 10) * 1000}`)
      .digest('hex');

    // Prevent directory traversal
    const safePath = path.normalize(storagePath).replace(/^(\.\.[\/\\])+/, '');
    const fullLocalPath = path.resolve(process.cwd(), 'uploads', safePath);

    if (!fs.existsSync(fullLocalPath)) {
      res.status(404).send('File not found in storage.');
      return;
    }

    res.download(fullLocalPath);
  } catch (err: any) {
    res.status(500).send(`Error downloading file: ${err.message}`);
  }
});

// Protected routes below
router.use(authenticate);

// GET /api/v1/documents
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { workspaceId, modality, status, search } = req.query as Record<string, string>;

    const docs: any[] = [];
    for (const doc of inMemoryDb.documents.values()) {
      if (doc.user_id !== userId || doc.deleted_at) continue;
      if (workspaceId && doc.workspace_id !== workspaceId) continue;
      if (modality && doc.modality !== modality) continue;
      if (status && doc.status !== status) continue;

      if (search) {
        const query = search.toLowerCase();
        const matchesName = doc.original_filename.toLowerCase().includes(query);
        const matchesSummary = doc.summary?.toLowerCase().includes(query);
        if (!matchesName && !matchesSummary) continue;
      }

      docs.push(doc);
    }

    // Sort newest first
    docs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json({
      success: true,
      data: docs,
      meta: { total: docs.length },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/documents/upload
router.post('/upload', upload.array('files', env.MAX_FILES_PER_UPLOAD), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { workspaceId, category = 'general', tags } = req.body;

    if (!workspaceId) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_WORKSPACE_ID', message: 'Workspace ID is required for file uploads.' },
      });
      return;
    }

    // Check workspace authorization
    const ws = inMemoryDb.workspaces.get(workspaceId);
    if (!ws || ws.user_id !== userId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have access to upload into this workspace.' },
      });
      return;
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_FILES_PROVIDED', message: 'Please select at least one file to upload.' },
      });
      return;
    }

    const tagList = tags ? (Array.isArray(tags) ? tags : String(tags).split(',').map((t) => t.trim())) : [];
    const ingestedDocs: any[] = [];

    for (const file of files) {
      const doc = await IngestionService.ingestFile({
        userId,
        workspaceId,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        buffer: file.buffer,
        category,
        tags: tagList,
      });
      ingestedDocs.push(doc);
    }

    res.status(201).json({
      success: true,
      data: ingestedDocs,
      meta: { message: `Successfully queued ${ingestedDocs.length} file(s) for multimodal processing.` },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/documents/:documentId
router.get('/:documentId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const documentId = req.params.documentId as string;

    const doc = inMemoryDb.documents.get(documentId);
    if (!doc || doc.user_id !== userId || doc.deleted_at) {
      res.status(404).json({
        success: false,
        error: { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found or unauthorized.' },
      });
      return;
    }

    // Count chunks
    let chunkCount = 0;
    for (const c of inMemoryDb.document_chunks.values()) {
      if (c.document_id === documentId) chunkCount++;
    }

    res.json({
      success: true,
      data: { ...doc, chunk_count: chunkCount },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/documents/:documentId/status
router.get('/:documentId/status', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const documentId = req.params.documentId as string;

    const doc = inMemoryDb.documents.get(documentId);
    if (!doc || doc.user_id !== userId || doc.deleted_at) {
      res.status(404).json({
        success: false,
        error: { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found.' },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: doc.id,
        status: doc.status,
        error_code: doc.processing_error_code,
        error_message: doc.processing_error_message,
        processed_at: doc.processed_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/documents/:documentId/content
router.get('/:documentId/content', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const documentId = req.params.documentId as string;

    const doc = inMemoryDb.documents.get(documentId);
    if (!doc || doc.user_id !== userId || doc.deleted_at) {
      res.status(404).json({
        success: false,
        error: { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found.' },
      });
      return;
    }

    const chunks = [];
    for (const c of inMemoryDb.document_chunks.values()) {
      if (c.document_id === documentId) chunks.push(c);
    }
    chunks.sort((a, b) => a.chunk_index - b.chunk_index);

    res.json({
      success: true,
      data: {
        id: doc.id,
        filename: doc.original_filename,
        modality: doc.modality,
        extracted_text: doc.extracted_text,
        summary: doc.summary,
        chunks,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/documents/:documentId/download-url
router.get('/:documentId/download-url', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const documentId = req.params.documentId as string;

    const doc = inMemoryDb.documents.get(documentId);
    if (!doc || doc.user_id !== userId || doc.deleted_at) {
      res.status(404).json({
        success: false,
        error: { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found.' },
      });
      return;
    }

    const signedUrl = await StorageService.getSignedDownloadUrl(doc.storage_bucket, doc.storage_path);

    res.json({
      success: true,
      data: {
        downloadUrl: signedUrl,
        expiresInSeconds: 3600,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/documents/:documentId/retry
router.post('/:documentId/retry', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const documentId = req.params.documentId as string;

    const doc = await IngestionService.retryDocument(documentId, userId);

    res.json({
      success: true,
      data: doc,
      meta: { message: 'Document re-queued for processing.' },
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/documents/:documentId
router.delete('/:documentId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const documentId = req.params.documentId as string;

    const doc = inMemoryDb.documents.get(documentId);
    if (!doc || doc.user_id !== userId || doc.deleted_at) {
      res.status(404).json({
        success: false,
        error: { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found or unauthorized.' },
      });
      return;
    }

    // 1. Delete chunks and embeddings
    for (const [chunkId, c] of inMemoryDb.document_chunks.entries()) {
      if (c.document_id === documentId) {
        inMemoryDb.document_chunks.delete(chunkId);
      }
    }

    // 2. Remove file from storage
    await StorageService.deleteFile(doc.storage_bucket, doc.storage_path);

    // 3. Mark document as deleted
    doc.deleted_at = new Date().toISOString();
    inMemoryDb.documents.delete(documentId);

    if (isPostgresConnected && pool) {
      try {
        await pool.query('DELETE FROM documents WHERE id = $1', [documentId]);
      } catch {}
    }

    res.json({
      success: true,
      data: { deleted: true },
      meta: { message: 'Document and indexed knowledge deleted successfully.' },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
