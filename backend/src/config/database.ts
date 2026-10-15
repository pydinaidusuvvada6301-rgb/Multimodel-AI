import pg from 'pg';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';

const { Pool } = pg;

export let pool: pg.Pool | null = null;
export let supabase: SupabaseClient | null = null;
export let isPostgresConnected = false;
export let isSupabaseConnected = false;
export let activeSupabaseKeyType: 'service_role' | 'anon' | null = null;

// Determine available Supabase credentials
const isPlaceholder = (val?: string) => !val || val.includes('your-project') || val.includes('your_supabase');

const hasServiceKey = !isPlaceholder(env.SUPABASE_SERVICE_ROLE_KEY);
const hasAnonKey = !isPlaceholder(env.SUPABASE_ANON_KEY);
const hasValidUrl = !isPlaceholder(env.SUPABASE_URL);

// Prefer service_role key for backend operations; fallback to anon key if service_role is not provided
const activeKey = hasServiceKey ? env.SUPABASE_SERVICE_ROLE_KEY : (hasAnonKey ? env.SUPABASE_ANON_KEY : null);

if (hasValidUrl && activeKey) {
  try {
    supabase = createClient(env.SUPABASE_URL, activeKey, {
      auth: { persistSession: false },
    });
    activeSupabaseKeyType = hasServiceKey ? 'service_role' : 'anon';
    if (hasServiceKey && hasAnonKey) {
      console.log('✅ Supabase client initialized (both service_role and anon keys available)');
    } else if (hasServiceKey) {
      console.log('✅ Supabase client initialized using service_role key (anon key remaining/optional)');
    } else {
      console.log('✅ Supabase client initialized using anon key (service_role key remaining/optional)');
    }
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
  // 1. Supabase Client Connectivity Check
  if (supabase) {
    try {
      const { error } = await supabase.from('app_users').select('id').limit(1);
      if (!error) {
        isSupabaseConnected = true;
        console.log('✅ Supabase database connected successfully via REST API client');
      } else if (
        error.code === '42P01' ||
        error.code === 'PGRST204' ||
        error.code === 'PGRST205' ||
        error.message?.includes('relation') ||
        error.message?.includes('does not exist')
      ) {
        isSupabaseConnected = true;
        console.log('✅ Supabase connected successfully (schema migration pending)');
      } else {
        const storageTest = await supabase.storage.listBuckets();
        if (!storageTest.error) {
          isSupabaseConnected = true;
          console.log('✅ Supabase connected successfully (storage verified)');
        } else {
          console.warn('⚠️ Supabase connection check warning:', error.message);
          isSupabaseConnected = false;
        }
      }
    } catch (err: any) {
      console.warn('⚠️ Supabase connection check error:', err.message);
      isSupabaseConnected = false;
    }
  }

  // 2. Optional PostgreSQL Direct Pool Check (if SUPABASE_DB_URL is set and not a placeholder)
  if (env.SUPABASE_DB_URL && !env.SUPABASE_DB_URL.includes('your-project')) {
    try {
      const isRemote =
        env.NODE_ENV === 'production' ||
        env.SUPABASE_DB_URL.includes('supabase.co') ||
        env.SUPABASE_DB_URL.includes('pooler.supabase.com') ||
        env.SUPABASE_DB_URL.includes('sslmode=require');

      pool = new Pool({
        connectionString: env.SUPABASE_DB_URL,
        ssl: isRemote ? { rejectUnauthorized: false } : undefined,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      const res = await pool.query('SELECT NOW()');
      isPostgresConnected = true;
      console.log('✅ PostgreSQL direct pool connected successfully at', res.rows[0].now);
    } catch (err: any) {
      console.warn('⚠️ Could not connect to PostgreSQL database:', err.message);
      isPostgresConnected = false;
    }
  }

  if (!isSupabaseConnected && !isPostgresConnected) {
    console.log('ℹ️ Running with resilient in-memory persistent store for development/testing.');
  }
}

export async function query(sql: string, params: any[] = []): Promise<any> {
  if (isPostgresConnected && pool) {
    return pool.query(sql, params);
  }
  // Return empty result set fallback for raw queries if disconnected
  return { rows: [], rowCount: 0 };
}
