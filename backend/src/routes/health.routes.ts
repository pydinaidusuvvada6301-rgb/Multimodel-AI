import { Router, Request, Response } from 'express';
import { isPostgresConnected, isSupabaseConnected } from '../config/database.js';
import { GeminiService } from '../services/gemini/gemini.service.js';
import { ModelRegistry } from '../services/gemini/model-registry.js';

const router = Router();

// GET / (Root health & service info for Render default health check)
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'omnimind-api',
    message: 'OmniMind AI Backend API is online and operational.',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

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

// GET /health/ai, /api/health/ai, /api/v1/health/ai
router.get(['/health/ai', '/api/health/ai', '/api/v1/health/ai'], (req: Request, res: Response) => {
  const isAiConfigured = GeminiService.isConfigured();
  res.json({
    status: isAiConfigured ? 'healthy' : 'fallback_mode',
    service: 'gemini-ai-orchestrator',
    isConfigured: isAiConfigured,
    model: ModelRegistry.getModel().id,
    provider: 'Google Gemini',
    supportedModalities: ['text', 'document', 'image', 'audio', 'video'],
    timestamp: new Date().toISOString(),
  });
});

// GET /models, /api/models, /api/v1/models
router.get(['/models', '/api/models', '/api/v1/models'], (req: Request, res: Response) => {
  res.json({
    success: true,
    data: ModelRegistry.getAllModels(),
  });
});

export default router;
