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
  provider TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON reasoning_sessions (created_at DESC);

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
