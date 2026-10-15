import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://feyopxllcgsjdwgcfjyx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export let supabaseClient: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey && !supabaseAnonKey.includes('your_supabase')) {
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
