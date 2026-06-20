-- HubForge OS - Schema V2: Team Collaboration (Organizations)
-- Run this AFTER supabase-schema.sql in your Supabase SQL Editor.

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_by TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization memberships (who belongs to which org, with roles)
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner' | 'admin' | 'member' | 'viewer'
  invited_by TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(org_id);

-- Add org_id and user_id to existing tables (idempotent)
DO $$
BEGIN
  -- reasoning_sessions: add org_id + user_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reasoning_sessions' AND column_name='org_id') THEN
    ALTER TABLE reasoning_sessions ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reasoning_sessions' AND column_name='user_id') THEN
    ALTER TABLE reasoning_sessions ADD COLUMN user_id TEXT;
  END IF;

  -- user_profiles: add org_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='org_id') THEN
    ALTER TABLE user_profiles ADD COLUMN org_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_sessions_org ON reasoning_sessions(org_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON reasoning_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_org ON user_profiles(org_id);

-- RLS for new tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Policies: allow service role full access (same pattern as existing tables).
-- In production, tighten these to org membership checks.
CREATE POLICY "Allow all for service role" ON organizations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service role" ON organization_members FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
