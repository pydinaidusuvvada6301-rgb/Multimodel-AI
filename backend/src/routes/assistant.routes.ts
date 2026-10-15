import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.middleware.js';
import { aiLimiter } from '../middleware/rateLimit.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';
import { GuideService } from '../services/assistant/guide.service.js';

const router = Router();
router.use(authenticate);
router.use(aiLimiter);

const GuideChatRequestSchema = z.object({
  message: z.string().max(4000).optional().default(''),
  conversationId: z.string().uuid().optional(),
  selectedDocumentIds: z.array(z.string().uuid()).optional().default([]),
  action: z
    .enum([
      'open_upload',
      'select_sources',
      'check_processing_status',
      'summarize_sources',
      'ask_about_sources',
      'compare_sources',
      'open_settings',
      'show_supported_formats',
    ])
    .optional(),
  isGuideMode: z.boolean().optional().default(false),
});

// GET /capabilities
router.get('/capabilities', (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: GuideService.getSystemCapabilities(),
  });
});

// POST /chat
router.post('/chat', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = GuideChatRequestSchema.parse(req.body);
    const userId = req.user!.id;
    const userDisplayName = req.user!.displayName;

    const result = await GuideService.handleChat({
      userId,
      userDisplayName,
      message: validated.message,
      conversationId: validated.conversationId,
      selectedDocumentIds: validated.selectedDocumentIds,
      action: validated.action,
      isGuideMode: validated.isGuideMode,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
