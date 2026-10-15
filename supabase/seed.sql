-- ============================================================================
-- OmniMind AI — Development Seed Data
-- User password for demo is: Password123!
-- ============================================================================

INSERT INTO app_users (id, email, password_hash, display_name, email_verified_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'demo@omnimind.ai',
    -- bcrypt hash for 'Password123!' (10 salt rounds)
    '$2b$10$EP0.kFhC7y0bWq.oZ7Uj1uG98bK95mO9xeq41wZ8d6hU75qY7a7sW',
    'Dr. Alex Vance',
    now()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, display_name, bio, preferences)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Dr. Alex Vance',
    'Lead Multimodal AI Researcher & Systems Architect',
    '{"theme": "dark", "defaultDetail": "balanced"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO workspaces (id, user_id, name, description, category)
VALUES (
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    'Multimodal Research Lab',
    'Core intelligence repository comparing architectural specs, audio lectures, and system diagrams.',
    'Research'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO workspaces (id, user_id, name, description, category)
VALUES (
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000001',
    'Quarterly Strategy & Recordings',
    'Executive meetings, financial charts, and product roadmaps.',
    'Business'
)
ON CONFLICT (id) DO NOTHING;
