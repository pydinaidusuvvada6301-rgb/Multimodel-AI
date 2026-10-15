import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';
import { RetrievalService } from '../services/retrieval/retrieval.service.js';

const router = Router();
router.use(authenticate);

const SearchQuerySchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty.').max(1000),
  workspaceId: z.string().uuid().optional(),
  documentIds: z.array(z.string().uuid()).optional(),
  limit: z.number().int().min(1).max(50).optional().default(10),
  threshold: z.number().min(0).max(1).optional().default(0.15),
});

// POST /api/v1/search (Universal search)
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const validated = SearchQuerySchema.parse(req.body);

    const results = await RetrievalService.searchChunks({
      userId,
      workspaceId: validated.workspaceId,
      documentIds: validated.documentIds,
      queryText: validated.query,
      limit: validated.limit,
      threshold: validated.threshold,
    });

    res.json({
      success: true,
      data: results,
      meta: {
        total: results.length,
        query: validated.query,
        mode: 'hybrid',
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/search/semantic
router.post('/semantic', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const validated = SearchQuerySchema.parse(req.body);

    const results = await RetrievalService.searchChunks({
      userId,
      workspaceId: validated.workspaceId,
      documentIds: validated.documentIds,
      queryText: validated.query,
      limit: validated.limit,
      threshold: validated.threshold,
    });

    res.json({
      success: true,
      data: results,
      meta: {
        total: results.length,
        query: validated.query,
        mode: 'semantic',
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/search/hybrid
router.post('/hybrid', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const validated = SearchQuerySchema.parse(req.body);

    const results = await RetrievalService.searchChunks({
      userId,
      workspaceId: validated.workspaceId,
      documentIds: validated.documentIds,
      queryText: validated.query,
      limit: validated.limit,
      threshold: validated.threshold,
    });

    res.json({
      success: true,
      data: results,
      meta: {
        total: results.length,
        query: validated.query,
        mode: 'hybrid_ranked',
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
