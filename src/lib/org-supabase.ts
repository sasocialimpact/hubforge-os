// Org Supabase Config - lets each organization connect their OWN Supabase.
// Data stays in their database. HubForge platform doesn't store anything.
// Like connecting your own Google Drive instead of using shared storage.

export interface OrgSupabaseConfig {
  url: string
  anonKey: string
  // We use anon key (not service key) for security.
  // RLS policies on their Supabase control access.
}

const STORAGE_KEY = 'hubforge.orgSupabase'

export function getOrgSupabase(): OrgSupabaseConfig | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.url && parsed?.anonKey) return parsed
    }
  } catch {}
  return null
}

export function storeOrgSupabase(config: OrgSupabaseConfig): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch {}
}

export function clearOrgSupabase(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

export function hasOrgSupabase(): boolean {
  return getOrgSupabase() !== null
}

// The SQL the user runs in their own Supabase to create tables
export const ORG_SUPABASE_SQL = `-- HubForge OS - Organization Database Setup
-- Run this in YOUR Supabase SQL editor (Dashboard -> SQL -> New Query)
-- This creates the tables HubForge needs to store your programs and data.

-- Programs table - stores your program strategies, ToC, logframes
CREATE TABLE IF NOT EXISTS programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id TEXT UNIQUE NOT NULL,
  title TEXT,
  status TEXT DEFAULT 'draft',
  problem TEXT,
  draft TEXT,
  evaluation JSONB,
  structured_outputs JSONB,
  output_types JSONB,
  feedback_history JSONB DEFAULT '[]',
  tags JSONB DEFAULT '{}',
  provider TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table - stores reasoning session history  
CREATE TABLE IF NOT EXISTS reasoning_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  problem TEXT NOT NULL,
  iterations INTEGER DEFAULT 0,
  final_score INTEGER DEFAULT 0,
  threshold_met BOOLEAN DEFAULT FALSE,
  final_draft TEXT,
  structured_outputs JSONB,
  provider TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Context blocks - reusable knowledge (geography, donor, sector)
CREATE TABLE IF NOT EXISTS context_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  block_type TEXT NOT NULL,
  name TEXT NOT NULL,
  content TEXT,
  tags JSONB DEFAULT '[]',
  auto_saved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lessons log - what worked, what didn't
CREATE TABLE IF NOT EXISTS lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id TEXT,
  what_worked TEXT,
  what_didnt_work TEXT,
  category TEXT,
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_programs_status ON programs (status);
CREATE INDEX IF NOT EXISTS idx_programs_updated ON programs (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON reasoning_sessions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blocks_type ON context_blocks (block_type);

-- Enable Row Level Security (RLS)
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reasoning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Allow anon key to read/write (you can restrict further if needed)
CREATE POLICY "Allow all for anon" ON programs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON reasoning_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON context_blocks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON lessons FOR ALL USING (true) WITH CHECK (true);`
