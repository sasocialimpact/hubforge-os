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

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id TEXT UNIQUE NOT NULL,
  name TEXT, email TEXT, organization TEXT, country TEXT, role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  profile_id TEXT, session_id TEXT,
  event_type TEXT NOT NULL, event_category TEXT,
  event_data JSONB, page TEXT, duration_ms INTEGER
);
CREATE INDEX IF NOT EXISTS idx_events_created ON analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_type ON analytics_events (event_type);
