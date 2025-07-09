-- 🔴 Live Updates System - Database Tables
-- Script to create tables for real-time football updates

-- ⚡ Live Events Table - storing individual match events  
CREATE TABLE IF NOT EXISTS live_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL, -- 'goal', 'card', 'substitution', 'injury', 'match_start', 'match_end'
  minute INTEGER,
  player_name VARCHAR(255),
  team_side VARCHAR(10), -- 'home' or 'away'
  description TEXT,
  raw_data JSONB,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 📊 Live Matches Table - current status of live matches
CREATE TABLE IF NOT EXISTS live_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_match_id VARCHAR(255) UNIQUE NOT NULL,
  home_team VARCHAR(255) NOT NULL,
  away_team VARCHAR(255) NOT NULL,
  competition VARCHAR(255),
  kickoff_time TIMESTAMP WITH TIME ZONE,
  current_status VARCHAR(50), -- 'scheduled', 'live', 'finished', 'postponed'
  current_minute INTEGER DEFAULT 0,
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  api_source VARCHAR(50), -- which API provided this data
  monitoring_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ⚙️ Channel Live Settings Table - channel-specific live update preferences
CREATE TABLE IF NOT EXISTS channel_live_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  live_updates_enabled BOOLEAN DEFAULT false,
  update_frequency_seconds INTEGER DEFAULT 60, -- how often to check for updates
  enabled_event_types TEXT[] DEFAULT ARRAY['goal', 'card', 'match_start', 'match_end'], -- which events to report
  selected_leagues TEXT[], -- which leagues to monitor  
  selected_teams TEXT[], -- which teams to monitor (optional)
  minimum_score_threshold INTEGER DEFAULT 0, -- only report goals if score is above threshold
  delay_seconds INTEGER DEFAULT 30, -- delay before sending update (to avoid spam)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(channel_id)
);

-- 📨 Live Update Notifications Table - log of sent notifications to avoid duplicates
CREATE TABLE IF NOT EXISTS live_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  live_event_id UUID REFERENCES live_events(id) ON DELETE CASCADE,
  match_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  telegram_message_id BIGINT, -- Telegram message ID if sent successfully
  content TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'skipped'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 🔍 Indexes for performance
CREATE INDEX IF NOT EXISTS idx_live_events_match_id ON live_events(match_id);
CREATE INDEX IF NOT EXISTS idx_live_events_created_at ON live_events(created_at);
CREATE INDEX IF NOT EXISTS idx_live_events_processed_at ON live_events(processed_at);

CREATE INDEX IF NOT EXISTS idx_live_matches_status ON live_matches(current_status);
CREATE INDEX IF NOT EXISTS idx_live_matches_updated ON live_matches(last_updated);
CREATE INDEX IF NOT EXISTS idx_live_matches_external_id ON live_matches(external_match_id);

CREATE INDEX IF NOT EXISTS idx_channel_live_settings_enabled ON channel_live_settings(live_updates_enabled);
CREATE INDEX IF NOT EXISTS idx_live_notifications_channel ON live_notifications(channel_id);
CREATE INDEX IF NOT EXISTS idx_live_notifications_status ON live_notifications(status);

-- 🔐 Row Level Security (RLS) policies
ALTER TABLE live_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_live_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_notifications ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be expanded based on user management needs)
CREATE POLICY "Enable read access for all users" ON live_events FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON live_matches FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON channel_live_settings FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON live_notifications FOR SELECT USING (true);

-- 🎯 Sample data for testing (optional)
INSERT INTO channel_live_settings (channel_id, live_updates_enabled, enabled_event_types, selected_leagues)
SELECT 
  id,
  false, -- disabled by default
  ARRAY['goal', 'card', 'match_start', 'match_end'],
  ARRAY['Premier League', 'Champions League', 'La Liga']
FROM channels 
WHERE NOT EXISTS (
  SELECT 1 FROM channel_live_settings WHERE channel_id = channels.id
); 