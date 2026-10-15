import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error.middleware.js';
import { generalLimiter } from './middleware/rateLimit.middleware.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import workspacesRoutes from './routes/workspaces.routes.js';
import documentsRoutes from './routes/documents.routes.js';
import searchRoutes from './routes/search.routes.js';
import aiRoutes from './routes/ai.routes.js';
import conversationsRoutes from './routes/conversations.routes.js';
import artifactsRoutes from './routes/artifacts.routes.js';
import healthRoutes from './routes/health.routes.js';
import jobsRoutes from './routes/jobs.routes.js';

export function createApp(): Express {
  const app = express();

  // 1. Security Headers & CORS
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production',
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, postman, health probes)
        if (
          !origin ||
          allowedOrigins.includes(origin) ||
          allowedOrigins.includes('*') ||
          origin.endsWith('.vercel.app') ||
          origin.endsWith('.onrender.com') ||
          origin.includes('localhost')
        ) {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // 2. Parsers & Logger
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));
  app.use(cookieParser());

  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // 3. Operational Routes (Root Liveness & Readiness)
  app.use(healthRoutes);

  // 4. API v1 Versioned Router
  const apiV1 = express.Router();
  apiV1.use(generalLimiter);

  apiV1.use('/auth', authRoutes);
  apiV1.use('/workspaces', workspacesRoutes);
  apiV1.use('/documents', documentsRoutes);
  apiV1.use('/jobs', jobsRoutes);
  apiV1.use('/search', searchRoutes);
  apiV1.use('/ai', aiRoutes);
  // Alias /chat directly to ai routes
  apiV1.use('/chat', (req, res, next) => {
    req.url = '/chat';
    aiRoutes(req, res, next);
  });
  apiV1.use('/conversations', conversationsRoutes);
  apiV1.use('/artifacts', artifactsRoutes);
  apiV1.use('/', healthRoutes);

  app.use(env.API_BASE_URL, apiV1);
  if (env.API_BASE_URL !== '/api') {
    app.use('/api', apiV1);
  }

  // 5. 404 Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `The endpoint ${req.method} ${req.originalUrl} does not exist.`,
      },
    });
  });

  // 6. Centralized Error Handler
  app.use(errorHandler);

  return app;
}
