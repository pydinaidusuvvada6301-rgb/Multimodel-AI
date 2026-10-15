import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { authenticate } from '../middleware/auth.middleware.js';
import { inMemoryDb, pool, isPostgresConnected } from '../config/database.js';
import { AuthenticatedRequest, WorkspaceRecord } from '../types/index.js';
import { StorageService } from '../services/storage/storage.service.js';

const router = Router();
router.use(authenticate);

const WorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required.').max(100),
  description: z.string().max(500).optional().nullable(),
  category: z.string().max(50).optional().default('general'),
});

// GET /api/v1/workspaces
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const userWorkspaces: Array<WorkspaceRecord & { documentCount: number }> = [];

    for (const ws of inMemoryDb.workspaces.values()) {
      if (ws.user_id === userId) {
        // Count documents
        let docCount = 0;
        for (const doc of inMemoryDb.documents.values()) {
          if (doc.workspace_id === ws.id && !doc.deleted_at) {
            docCount++;
          }
        }
        userWorkspaces.push({ ...ws, documentCount: docCount });
      }
    }

    res.json({
      success: true,
      data: userWorkspaces,
      meta: { total: userWorkspaces.length },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/workspaces
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const validated = WorkspaceSchema.parse(req.body);

    const workspaceId = crypto.randomUUID();
    const now = new Date().toISOString();

    const record: WorkspaceRecord = {
      id: workspaceId,
      user_id: userId,
      name: validated.name.trim(),
      description: validated.description?.trim() || null,
      category: validated.category || 'general',
      created_at: now,
      updated_at: now,
    };

    inMemoryDb.workspaces.set(workspaceId, record);

    if (isPostgresConnected && pool) {
      try {
        await pool.query(
          `INSERT INTO workspaces (id, user_id, name, description, category) VALUES ($1, $2, $3, $4, $5)`,
          [record.id, record.user_id, record.name, record.description, record.category]
        );
      } catch (err: any) {
        console.warn('⚠️ Error inserting workspace into PostgreSQL:', err.message);
      }
    }

    res.status(201).json({
      success: true,
      data: record,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/workspaces/:workspaceId
router.get('/:workspaceId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const workspaceId = req.params.workspaceId as string;

    const ws = inMemoryDb.workspaces.get(workspaceId);
    if (!ws || ws.user_id !== userId) {
      res.status(404).json({
        success: false,
        error: { code: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found or unauthorized.' },
      });
      return;
    }

    const docs: any[] = [];
    for (const doc of inMemoryDb.documents.values()) {
      if (doc.workspace_id === workspaceId && !doc.deleted_at) {
        docs.push(doc);
      }
    }

    res.json({
      success: true,
      data: {
        workspace: ws,
        documents: docs,
        metrics: {
          totalDocuments: docs.length,
          ready: docs.filter((d) => d.status === 'ready').length,
          processing: docs.filter((d) => d.status === 'processing').length,
          failed: docs.filter((d) => d.status === 'failed').length,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/workspaces/:workspaceId
router.patch('/:workspaceId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const workspaceId = req.params.workspaceId as string;
    const validated = WorkspaceSchema.partial().parse(req.body);

    const ws = inMemoryDb.workspaces.get(workspaceId);
    if (!ws || ws.user_id !== userId) {
      res.status(404).json({
        success: false,
        error: { code: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found or unauthorized.' },
      });
      return;
    }

    if (validated.name !== undefined) ws.name = validated.name.trim();
    if (validated.description !== undefined) ws.description = validated.description?.trim() || null;
    if (validated.category !== undefined) ws.category = validated.category;
    ws.updated_at = new Date().toISOString();

    if (isPostgresConnected && pool) {
      try {
        await pool.query(
          `UPDATE workspaces SET name = $1, description = $2, category = $3, updated_at = now() WHERE id = $4`,
          [ws.name, ws.description, ws.category, ws.id]
        );
      } catch {}
    }

    res.json({
      success: true,
      data: ws,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/workspaces/:workspaceId
router.delete('/:workspaceId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const workspaceId = req.params.workspaceId as string;

    const ws = inMemoryDb.workspaces.get(workspaceId);
    if (!ws || ws.user_id !== userId) {
      res.status(404).json({
        success: false,
        error: { code: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found or unauthorized.' },
      });
      return;
    }

    // Clean up related documents, chunks, and storage objects
    for (const [docId, doc] of inMemoryDb.documents.entries()) {
      if (doc.workspace_id === workspaceId) {
        StorageService.deleteFile(doc.storage_bucket, doc.storage_path).catch(() => {});
        inMemoryDb.documents.delete(docId);
      }
    }

    for (const [chunkId, chunk] of inMemoryDb.document_chunks.entries()) {
      if (chunk.workspace_id === workspaceId) {
        inMemoryDb.document_chunks.delete(chunkId);
      }
    }

    inMemoryDb.workspaces.delete(workspaceId);

    if (isPostgresConnected && pool) {
      try {
        await pool.query('DELETE FROM workspaces WHERE id = $1', [workspaceId]);
      } catch {}
    }

    res.json({
      success: true,
      data: { deleted: true },
      meta: { message: 'Workspace and all associated documents deleted successfully.' },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
