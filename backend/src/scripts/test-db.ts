import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const isPlaceholder = (val?: string) =>
  !val || val.trim() === '' || val.includes('your-project') || val.includes('your_supabase');

async function checkDatabaseConnection() {
  console.log('\n========================================');
  console.log('🔍 OmniMind AI — Supabase Database Check');
  console.log('========================================\n');

  const supabaseUrl = env.SUPABASE_URL;
  const anonKey = env.SUPABASE_ANON_KEY;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  const hasValidUrl = !isPlaceholder(supabaseUrl);
  const hasAnonKey = !isPlaceholder(anonKey);
  const hasServiceKey = !isPlaceholder(serviceKey);

  console.log('📋 Current Environment Configuration (backend/.env):');
  console.log(
    `   - SUPABASE_URL: ${
      hasValidUrl
        ? `✅ ${supabaseUrl}`
        : supabaseUrl
        ? `⚠️ (Placeholder: ${supabaseUrl})`
        : '❌ Not set'
    }`
  );
  console.log(
    `   - SUPABASE_ANON_KEY: ${
      hasAnonKey
        ? '✅ Configured (valid key)'
        : anonKey
        ? '⚠️ (Placeholder: your_supabase_anon_key)'
        : '⚪ Not set'
    }`
  );
  console.log(
    `   - SUPABASE_SERVICE_ROLE_KEY: ${
      hasServiceKey
        ? '✅ Configured (valid key)'
        : serviceKey
        ? '⚠️ (Placeholder: your_supabase_service_role_key)'
        : '⚪ Not set'
    }\n`
  );

  // Key detection summary
  console.log('🔑 Key Status:');
  if (hasAnonKey && hasServiceKey) {
    console.log('   ✅ Both keys added: SUPABASE_SERVICE_ROLE_KEY and SUPABASE_ANON_KEY.');
  } else if (hasServiceKey) {
    console.log('   ✅ Key added: SUPABASE_SERVICE_ROLE_KEY (active for admin & database operations).');
    console.log('   ℹ️ Remaining key: SUPABASE_ANON_KEY is not added (optional client key).');
  } else if (hasAnonKey) {
    console.log('   ✅ Key added: SUPABASE_ANON_KEY (active for standard client queries).');
    console.log('   ℹ️ Remaining key: SUPABASE_SERVICE_ROLE_KEY is not added (optional admin key for RLS bypass).');
  } else {
    console.log('   ❌ No valid key added yet.');
  }
  console.log('');

  // Validate that URL and at least one key are provided
  if (!hasValidUrl || (!hasAnonKey && !hasServiceKey)) {
    console.log('❌ STATUS: Supabase Database is NOT CONNECTED.');
    if (!hasValidUrl) {
      console.log('   👉 Please provide your real SUPABASE_URL in `backend/.env`');
    }
    if (!hasAnonKey && !hasServiceKey) {
      console.log('   👉 Please add at least one key (SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY) in `backend/.env`');
    }
    console.log('\n📌 Where to find these in Supabase:');
    console.log('   1. Open https://supabase.com/dashboard and select your project');
    console.log('   2. Go to Project Settings -> API');
    console.log('   3. Copy `Project URL` -> SUPABASE_URL');
    console.log('   4. Copy `anon public` key -> SUPABASE_ANON_KEY (or `service_role` -> SUPABASE_SERVICE_ROLE_KEY)\n');
    process.exit(1);
  }

  // Choose the active key (prefer service_role for backend operations, fallback to anon)
  const activeKey = hasServiceKey ? serviceKey : anonKey;
  const activeKeyName = hasServiceKey ? 'SUPABASE_SERVICE_ROLE_KEY' : 'SUPABASE_ANON_KEY';

  console.log(`🔄 Connecting to Supabase using ${activeKeyName}...`);

  const supabase = createClient(supabaseUrl, activeKey, {
    auth: { persistSession: false },
  });

  try {
    // 1. Test database table connectivity
    const { data, error } = await supabase.from('app_users').select('id').limit(1);

    if (error) {
      // Check if error is simply "table does not exist yet" (PostgREST 42P01 / PGRST204 / PGRST205)
      const isMissingTable =
        error.code === '42P01' ||
        error.code === 'PGRST204' ||
        error.code === 'PGRST205' ||
        error.message?.includes('relation') ||
        error.message?.includes('does not exist') ||
        error.message?.includes('Could not find the table');

      if (isMissingTable) {
        console.log('\n✅ Supabase API authentication SUCCESSFUL!');
        console.log('   ℹ️ Note: Table `app_users` does not exist yet in your Supabase database.');
        console.log('   👉 To create the database schema:');
        console.log('      Open Supabase SQL Editor and run `supabase/migrations/20261015000000_init_omnimind_schema.sql`\n');
      } else if (error.message?.toLowerCase().includes('jwt') || error.message?.toLowerCase().includes('apikey') || error.code === '401' || error.message?.includes('Invalid API key')) {
        console.log('\n❌ Supabase Authentication FAILED: Invalid API Key.');
        console.log(`   Message: ${error.message}\n`);
        process.exit(1);
      } else if (error.message?.includes('fetch failed') || error.message?.includes('ENOTFOUND')) {
        console.log('\n❌ Supabase Connection FAILED: Network fetch error (hostname not found or unreachable).');
        console.log(`   URL: ${supabaseUrl}`);
        console.log(`   Message: ${error.message}\n`);
        process.exit(1);
      } else {
        console.log(`\n❌ Supabase response error: ${error.message}\n`);
        process.exit(1);
      }
    } else {
      console.log('\n✅ Supabase Database Connection SUCCESSFUL!');
      console.log('   - Table `app_users` is queryable.');
      console.log(`   - Records returned in test query: ${Array.isArray(data) ? data.length : 0}`);
    }

    // 2. Test storage connectivity
    try {
      const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
      if (!storageError && buckets) {
        console.log(`\n📦 Supabase Storage Connection: ACTIVE (${buckets.length} bucket(s) found)`);
        const bucketNames = buckets.map((b) => b.name);
        if (bucketNames.length > 0) {
          console.log(`   - Buckets: ${bucketNames.join(', ')}`);
        }
        const hasOmnimindBucket = bucketNames.includes(env.STORAGE_BUCKET);
        if (!hasOmnimindBucket) {
          console.log(`   ℹ️ Recommended: Create private bucket '${env.STORAGE_BUCKET}' in Supabase Dashboard -> Storage.`);
        }
      }
    } catch {
      // Storage listing is optional
    }

    console.log('\n========================================');
    console.log('🎉 Supabase Database is CONNECTED & READY');
    console.log('========================================\n');
    process.exit(0);
  } catch (err: any) {
    console.log('\n❌ Supabase Connection FAILED');
    console.log(`   Error: ${err.message}\n`);
    process.exit(1);
  }
}

checkDatabaseConnection();
