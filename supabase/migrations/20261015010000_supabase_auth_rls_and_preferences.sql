-- ============================================================================
-- OmniMind AI — Supabase Auth, Row Level Security (RLS) & User Preferences
-- Migration: 20261015010000_supabase_auth_rls_and_preferences.sql
-- ============================================================================

-- 1. Create User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'system')),
    default_detail_level TEXT NOT NULL DEFAULT 'balanced' CHECK (default_detail_level IN ('concise', 'balanced', 'detailed')),
    guide_onboarding_completed BOOLEAN NOT NULL DEFAULT false,
    notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_preferences_user_id UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- 2. Trigger for Updated-At on user_preferences
DROP TRIGGER IF EXISTS trigger_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER trigger_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 3. Enable Row Level Security (RLS) on all user-owned tables
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies: Profiles
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" 
    ON profiles FOR SELECT 
    USING (auth.uid() = id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
    ON profiles FOR UPDATE 
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" 
    ON profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- 5. RLS Policies: Workspaces
DROP POLICY IF EXISTS "Users can manage own workspaces" ON workspaces;
CREATE POLICY "Users can manage own workspaces" 
    ON workspaces FOR ALL 
    USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- 6. RLS Policies: Documents
DROP POLICY IF EXISTS "Users can manage own documents" ON documents;
CREATE POLICY "Users can manage own documents" 
    ON documents FOR ALL 
    USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- 7. RLS Policies: Document Chunks
DROP POLICY IF EXISTS "Users can manage own chunks" ON document_chunks;
CREATE POLICY "Users can manage own chunks" 
    ON document_chunks FOR ALL 
    USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- 8. RLS Policies: Processing Jobs
DROP POLICY IF EXISTS "Users can manage own jobs" ON processing_jobs;
CREATE POLICY "Users can manage own jobs" 
    ON processing_jobs FOR ALL 
    USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- 9. RLS Policies: Conversations & Messages
DROP POLICY IF EXISTS "Users can manage own conversations" ON conversations;
CREATE POLICY "Users can manage own conversations" 
    ON conversations FOR ALL 
    USING (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Users can manage own messages" ON messages;
CREATE POLICY "Users can manage own messages" 
    ON messages FOR ALL 
    USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- 10. RLS Policies: Message Citations
DROP POLICY IF EXISTS "Users can view citations for their messages" ON message_citations;
CREATE POLICY "Users can view citations for their messages" 
    ON message_citations FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM messages m 
            WHERE m.id = message_citations.message_id 
              AND (m.user_id = auth.uid() OR auth.uid() IS NULL)
        )
    );

-- 11. RLS Policies: Generated Artifacts
DROP POLICY IF EXISTS "Users can manage own artifacts" ON generated_artifacts;
CREATE POLICY "Users can manage own artifacts" 
    ON generated_artifacts FOR ALL 
    USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- 12. RLS Policies: User Preferences
DROP POLICY IF EXISTS "Users can manage own preferences" ON user_preferences;
CREATE POLICY "Users can manage own preferences" 
    ON user_preferences FOR ALL 
    USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- 13. Automatic User Onboarding Function & Trigger for Supabase Auth
CREATE OR REPLACE FUNCTION handle_new_user_setup()
RETURNS TRIGGER AS $$
DECLARE
    new_user_id UUID := NEW.id;
    user_name TEXT := COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1));
    default_ws_id UUID := gen_random_uuid();
BEGIN
    -- Insert profile
    INSERT INTO profiles (id, display_name)
    VALUES (new_user_id, user_name)
    ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name;

    -- Insert default preferences
    INSERT INTO user_preferences (user_id)
    VALUES (new_user_id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Insert default workspace
    INSERT INTO workspaces (id, user_id, name, description, category)
    VALUES (default_ws_id, new_user_id, 'My Knowledge Workspace', 'Personal research and connected multimodal workspace', 'general')
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users if running in Supabase context
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        DROP TRIGGER IF EXISTS trigger_on_auth_user_created ON auth.users;
        CREATE TRIGGER trigger_on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION handle_new_user_setup();
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Skipping auth.users trigger (not in Supabase cloud context): %', SQLERRM;
END $$;
