import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';
import { inMemoryDb } from '../config/database.js';

const router = Router();
router.use(authenticate);

// GET /api/v1/jobs/:id (or /api/jobs/:id)
router.get('/:jobId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const jobId = req.params.jobId as string;

    // Check processing_jobs map first
    const job = inMemoryDb.processing_jobs.get(jobId);
    if (job && job.user_id === userId) {
      res.json({
        success: true,
        data: job,
      });
      return;
    }

    // Also check documents map by documentId (jobId alias)
    const doc = inMemoryDb.documents.get(jobId);
    if (doc && doc.user_id === userId && !doc.deleted_at) {
      res.json({
        success: true,
        data: {
          id: doc.id,
          document_id: doc.id,
          status: doc.status,
          error_code: doc.processing_error_code,
          error_message: doc.processing_error_message,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
          processed_at: doc.processed_at,
        },
      });
      return;
    }

    res.status(404).json({
      success: false,
      error: { code: 'JOB_NOT_FOUND', message: 'Processing job not found or unauthorized.' },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
