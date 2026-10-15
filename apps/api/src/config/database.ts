import pg from 'pg';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';

const { Pool } = pg;

export let pool: pg.Pool | null = null;
export let supabase: SupabaseClient | null = null;
export let isPostgresConnected = false;

// Initialize Supabase Client if URL and Key are provided
if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
  try {
    supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
    console.log('✅ Supabase client initialized for storage and admin operations');
  } catch (err) {
    console.warn('⚠️ Supabase client initialization warning:', err);
  }
}

// In-Memory Fallback Store for Local Development & Testing when live PostgreSQL is pending
export interface InMemoryDb {
  app_users: Map<string, any>;
  profiles: Map<string, any>;
  refresh_sessions: Map<string, any>;
  workspaces: Map<string, any>;
  documents: Map<string, any>;
  document_chunks: Map<string, any>;
  processing_jobs: Map<string, any>;
  conversations: Map<string, any>;
  messages: Map<string, any>;
  message_citations: Map<string, any>;
  generated_artifacts: Map<string, any>;
  audit_events: any[];
}

export const inMemoryDb: InMemoryDb = {
  app_users: new Map(),
  profiles: new Map(),
  refresh_sessions: new Map(),
  workspaces: new Map(),
  documents: new Map(),
  document_chunks: new Map(),
  processing_jobs: new Map(),
  conversations: new Map(),
  messages: new Map(),
  message_citations: new Map(),
  generated_artifacts: new Map(),
  audit_events: [],
};

// Seed in-memory store with default demo user so demo works out of the box
import bcrypt from 'bcryptjs';

const defaultPasswordHash = bcrypt.hashSync('Password123!', 10);
const demoUserId = '00000000-0000-0000-0000-000000000001';
const demoWorkspaceId = '00000000-0000-0000-0000-000000000010';

inMemoryDb.app_users.set(demoUserId, {
  id: demoUserId,
  email: 'demo@omnimind.ai',
  password_hash: defaultPasswordHash,
  display_name: 'Dr. Alex Vance',
  avatar_url: null,
  email_verified_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

inMemoryDb.profiles.set(demoUserId, {
  id: demoUserId,
  display_name: 'Dr. Alex Vance',
  bio: 'Lead Multimodal AI Researcher & Systems Architect',
  preferences: { theme: 'dark', defaultDetail: 'balanced' },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

inMemoryDb.workspaces.set(demoWorkspaceId, {
  id: demoWorkspaceId,
  user_id: demoUserId,
  name: 'Multimodal Research Lab',
  description: 'Core intelligence repository comparing architectural specs, audio lectures, and system diagrams.',
  category: 'Research',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export async function initDatabase(): Promise<void> {
  if (env.SUPABASE_DB_URL) {
    try {
      pool = new Pool({
        connectionString: env.SUPABASE_DB_URL,
        ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      const res = await pool.query('SELECT NOW()');
      isPostgresConnected = true;
      console.log('✅ PostgreSQL connected successfully at', res.rows[0].now);
    } catch (err: any) {
      console.warn('⚠️ Could not connect to PostgreSQL database:', err.message);
      console.warn('ℹ️ Falling back to resilient in-memory persistent store for development/testing.');
      isPostgresConnected = false;
    }
  } else {
    console.log('ℹ️ SUPABASE_DB_URL not configured. Running with resilient in-memory persistent store.');
  }
}

export async function query(sql: string, params: any[] = []): Promise<any> {
  if (isPostgresConnected && pool) {
    return pool.query(sql, params);
  }
  // Return empty result set fallback for raw queries if disconnected
  return { rows: [], rowCount: 0 };
}
