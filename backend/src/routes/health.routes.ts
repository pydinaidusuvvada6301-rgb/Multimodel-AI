import { Router, Request, Response } from 'express';
import { isPostgresConnected, isSupabaseConnected } from '../config/database.js';
import { GeminiService } from '../services/gemini/gemini.service.js';

const router = Router();

// GET /health
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'omnimind-api',
  });
});

// GET /ready
router.get('/ready', (req: Request, res: Response) => {
  const isAiReady = GeminiService.isConfigured();

  res.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
    checks: {
      database: isSupabaseConnected || isPostgresConnected ? 'connected' : 'in-memory-fallback',
      aiEngine: isAiReady ? 'configured' : 'offline-rule-fallback',
      storage: 'operational',
    },
  });
});

export default router;
