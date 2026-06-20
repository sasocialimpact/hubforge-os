-- HubForge OS - Platform Database Schema
-- Run this in your Supabase SQL Editor to create all required tables.

-- Reasoning sessions (strategy generation history)
CREATE TABLE IF NOT EXISTS reasoning_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  problem TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  iterations INTEGER DEFAULT 0,
  final_score INTEGER DEFAULT 0,
  threshold_met BOOLEAN DEFAULT FALSE,
  final_draft TEXT,
  structured_outputs JSONB,
  provider TEXT,
  -- Quality Console enrichment (added in Task 19-a)
  critique JSONB,                 -- critique engine output: { issues: [...], summary }
  evaluation_breakdown JSONB,     -- per-criterion scores: { scores: [...], overall, thresholdMet, notes }
  feedback_history JSONB,         -- user feedback revisions: [{ feedback, addressed: [] }]
  output_types JSONB              -- requested output types: ['strategy','toc',...]
);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON reasoning_sessions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_score ON reasoning_sessions (final_score);
CREATE INDEX IF NOT EXISTS idx_sessions_provider ON reasoning_sessions (provider);

-- Add the new columns to existing reasoning_sessions tables (idempotent).
-- Safe to re-run; columns that already exist are skipped.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reasoning_sessions' AND column_name='critique') THEN
    ALTER TABLE reasoning_sessions ADD COLUMN critique JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reasoning_sessions' AND column_name='evaluation_breakdown') THEN
    ALTER TABLE reasoning_sessions ADD COLUMN evaluation_breakdown JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reasoning_sessions' AND column_name='feedback_history') THEN
    ALTER TABLE reasoning_sessions ADD COLUMN feedback_history JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reasoning_sessions' AND column_name='output_types') THEN
    ALTER TABLE reasoning_sessions ADD COLUMN output_types JSONB;
  END IF;
END$$;

-- User profiles (identity + org-level details for platform improvement)
-- This is what the admin dashboard reads to know who's using HubForge.
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,          -- matches Supabase Auth user.id
  email TEXT NOT NULL,
  name TEXT,
  country TEXT,
  role TEXT,                              -- Program Officer, M&E Specialist, etc.
  organization TEXT,                      -- NGO name
  org_type TEXT,                          -- NGO (National), INGO, CBO, etc.
  sectors TEXT[],                         -- Education, Health, etc.
  operating_countries TEXT[],             -- where they work
  team_size TEXT,
  consent_version TEXT,
  analytics_opt_in BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  usage_count INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON user_profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_country ON user_profiles (country);

-- Analytics events (how people use HubForge - for product improvement)
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT,
  session_id TEXT,
  event_type TEXT NOT NULL,
  event_category TEXT,
  event_data JSONB,
  page TEXT,
  duration_ms INTEGER
);
CREATE INDEX IF NOT EXISTS idx_events_created ON analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_type ON analytics_events (event_type);
CREATE INDEX IF NOT EXISTS idx_events_user ON analytics_events (user_id);

-- Enable Row Level Security
ALTER TABLE reasoning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Policies: allow anon key (used by the app with service_role) full access.
-- In production, tighten these to auth.uid() = user_id for user-owned rows.
CREATE POLICY "Allow all for service role" ON reasoning_sessions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON user_profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON analytics_events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Knowledge Graph overrides (added in Task 19-b)
-- Stores admin-defined custom items that are merged with the built-in Social
-- Impact Pack at runtime. The admin Knowledge Editor writes here; the
-- retrieval engine and evaluation engine read from here via
-- src/lib/knowledge-overrides.ts.
CREATE TABLE IF NOT EXISTS knowledge_overrides (
  id TEXT PRIMARY KEY,                       -- ko_<timestamp>_<random>
  type TEXT NOT NULL,                        -- evidence | cases | frameworks | heuristics | rubric
  item JSONB NOT NULL,                       -- the custom item shape (varies by type)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT                            -- 'admin' or admin-key identifier
);
CREATE INDEX IF NOT EXISTS idx_knowledge_overrides_type ON knowledge_overrides (type);
CREATE INDEX IF NOT EXISTS idx_knowledge_overrides_created ON knowledge_overrides (created_at DESC);
ALTER TABLE knowledge_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for service role" ON knowledge_overrides FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Prompt versions (added in Task 19-c)
-- Stores admin-saved prompt versions for A/B testing. Each engine can have
-- many versions, but only ONE may be active per engine at a time (enforced
-- by the application layer in src/lib/server/prompt-store.ts). The admin
-- Prompt Manager writes here; the A/B Test endpoint reads from here.
CREATE TABLE IF NOT EXISTS prompt_versions (
  id TEXT PRIMARY KEY,                       -- pv_<timestamp>_<random> or pv_builtin_<engineId>
  engine_id TEXT NOT NULL,                   -- supervisor | reasoning | critique | etc.
  label TEXT NOT NULL,                       -- admin-provided label, e.g. "v2.1 - sustainability emphasis"
  system_prompt TEXT NOT NULL,               -- the system prompt override
  user_prompt_template TEXT NOT NULL,        -- user prompt template with placeholders ([USER PROBLEM], etc.)
  active BOOLEAN NOT NULL DEFAULT FALSE,     -- only one version per engine_id may be active
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,                           -- 'admin' | 'system'
  avg_score DOUBLE PRECISION,                -- rolling average of evaluation.overall across runs
  run_count INTEGER NOT NULL DEFAULT 0       -- number of A/B test runs that used this version
);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_engine ON prompt_versions (engine_id);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_active ON prompt_versions (engine_id, active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_prompt_versions_created ON prompt_versions (created_at DESC);
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for service role" ON prompt_versions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
