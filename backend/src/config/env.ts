import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load environment variables from .env if present
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  API_BASE_URL: z.string().default('/api/v1'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),

  // Supabase Configuration
  SUPABASE_URL: z.string().optional().default(''),
  SUPABASE_ANON_KEY: z.string().optional().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(''),
  SUPABASE_DB_URL: z.string().optional().default(''),

  // JWT & Auth
  JWT_ACCESS_SECRET: z.string().default('dev_insecure_jwt_secret_please_change_in_production_32char_minimum'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_ISSUER: z.string().default('omnimind-api'),
  JWT_AUDIENCE: z.string().default('omnimind-client'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(30),

  // Google Gemini AI
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  GEMINI_EMBEDDING_MODEL: z.string().default('text-embedding-004'),

  // Storage & Limits
  STORAGE_BUCKET: z.string().default('omnimind-private'),
  MAX_FILE_SIZE_MB: z.coerce.number().default(25),
  MAX_FILES_PER_UPLOAD: z.coerce.number().default(10),
  MAX_RETRIEVAL_CHUNKS: z.coerce.number().default(12),

  // AI Resilience
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().default(60000),
  AI_MAX_RETRIES: z.coerce.number().default(3),
  AI_MAX_CONCURRENT_REQUESTS: z.coerce.number().default(5),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(120),

  LOG_LEVEL: z.string().default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:', parsed.error.format());
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

export const env = parsed.success ? parsed.data : envSchema.parse({});
