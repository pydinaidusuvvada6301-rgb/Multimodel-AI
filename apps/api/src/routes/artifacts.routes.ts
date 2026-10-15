import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { authenticate } from '../middleware/auth.middleware.js';
import { AuthenticatedRequest, ArtifactRecord } from '../types/index.js';
import { inMemoryDb } from '../config/database.js';

const router = Router();
router.use(authenticate);

const ArtifactSchema = z.object({
  title: z.string().min(1, 'Title is required.').max(200),
  artifact_type: z.string().min(1),
  content_markdown: z.string().min(1, 'Content cannot be empty.'),
  workspace_id: z.string().uuid().optional().nullable(),
  source_document_ids: z.array(z.string().uuid()).optional().default([]),
  metadata: z.record(z.any()).optional().default({}),
});

// GET /api/v1/artifacts
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { workspaceId, artifactType } = req.query as Record<string, string>;

    const list: ArtifactRecord[] = [];
    for (const art of inMemoryDb.generated_artifacts.values()) {
      if (art.user_id !== userId) continue;
      if (workspaceId && art.workspace_id !== workspaceId) continue;
      if (artifactType && art.artifact_type !== artifactType) continue;
      list.push(art);
    }

    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json({
      success: true,
      data: list,
      meta: { total: list.length },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/artifacts
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const validated = ArtifactSchema.parse(req.body);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const record: ArtifactRecord = {
      id,
      user_id: userId,
      workspace_id: validated.workspace_id || null,
      title: validated.title.trim(),
      artifact_type: validated.artifact_type,
      content_markdown: validated.content_markdown,
      source_document_ids: validated.source_document_ids,
      metadata: validated.metadata,
      created_at: now,
      updated_at: now,
    };

    inMemoryDb.generated_artifacts.set(id, record);

    res.status(201).json({
      success: true,
      data: record,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/artifacts/:artifactId
router.get('/:artifactId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const artifactId = req.params.artifactId as string;

    const record = inMemoryDb.generated_artifacts.get(artifactId);
    if (!record || record.user_id !== userId) {
      res.status(404).json({
        success: false,
        error: { code: 'ARTIFACT_NOT_FOUND', message: 'Artifact not found or unauthorized.' },
      });
      return;
    }

    res.json({
      success: true,
      data: record,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/artifacts/:artifactId/export
router.get('/:artifactId/export', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const artifactId = req.params.artifactId as string;
    const format = (req.query.format as string) || 'markdown';

    const record = inMemoryDb.generated_artifacts.get(artifactId);
    if (!record || record.user_id !== userId) {
      res.status(404).json({
        success: false,
        error: { code: 'ARTIFACT_NOT_FOUND', message: 'Artifact not found or unauthorized.' },
      });
      return;
    }

    const safeFilename = record.title.replace(/[^a-zA-Z0-9_-]/g, '_');

    if (format === 'txt') {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.txt"`);
      res.send(record.content_markdown);
      return;
    }

    // Default to markdown export
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.md"`);
    res.send(record.content_markdown);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/artifacts/:artifactId
router.delete('/:artifactId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const artifactId = req.params.artifactId as string;

    const record = inMemoryDb.generated_artifacts.get(artifactId);
    if (!record || record.user_id !== userId) {
      res.status(404).json({
        success: false,
        error: { code: 'ARTIFACT_NOT_FOUND', message: 'Artifact not found or unauthorized.' },
      });
      return;
    }

    inMemoryDb.generated_artifacts.delete(artifactId);

    res.json({
      success: true,
      data: { deleted: true },
      meta: { message: 'Artifact deleted successfully.' },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
