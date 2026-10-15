import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://feyopxllcgsjdwgcfjyx.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY && !import.meta.env.VITE_SUPABASE_ANON_KEY.includes('your_supabase')
    ? import.meta.env.VITE_SUPABASE_ANON_KEY
    : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZleW9weGxsY2dzamR3Z2Nmanl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNDMzMDQsImV4cCI6MjEwNzYxOTMwNH0.2p5qXNKAimUp2sHgr-2GjJjTMtcsIyEtPyaZbWVZkLU';

export let supabaseClient: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.warn('Could not initialize client-side Supabase client:', err);
  }
}
