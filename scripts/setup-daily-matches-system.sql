-- 🏆 DYNAMIC MATCH-BASED CONTENT SYSTEM
-- Database schema for intelligent daily match discovery and content scheduling

-- ======================================================================
-- 1. DAILY IMPORTANT MATCHES TABLE
-- Stores matches discovered each morning with importance scores
-- ======================================================================

CREATE TABLE IF NOT EXISTS daily_important_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Match identification
  external_match_id VARCHAR(255) NOT NULL,
  home_team VARCHAR(255) NOT NULL,
  away_team VARCHAR(255) NOT NULL,
  home_team_id VARCHAR(255), -- API team ID if available
  away_team_id VARCHAR(255), -- API team ID if available
  
  -- Match details
  competition VARCHAR(255) NOT NULL,
  kickoff_time TIMESTAMP WITH TIME ZONE NOT NULL,
  venue VARCHAR(255),
  match_status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'live', 'finished', 'postponed'
  
  -- Importance scoring (from FootballMatchScorer)
  importance_score INTEGER NOT NULL, -- Total score from scorer
  score_breakdown JSONB, -- Detailed scoring breakdown
  content_opportunities JSONB, -- Which content types are suitable
  
  -- Discovery metadata
  discovery_date DATE NOT NULL, -- Which day this was discovered for
  api_source VARCHAR(50), -- Which API provided the data
  raw_match_data JSONB, -- Original API response for debugging
  
  -- Content generation tracking
  content_generated JSONB DEFAULT '{}', -- Track what content was created
  content_scheduled JSONB DEFAULT '{}', -- Track what content is scheduled
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================================================
-- 2. DYNAMIC CONTENT SCHEDULE TABLE  
-- Manages when content should be generated for each match
-- ======================================================================

CREATE TABLE IF NOT EXISTS dynamic_content_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Match reference
  match_id UUID REFERENCES daily_important_matches(id) ON DELETE CASCADE,
  
  -- Content details
  content_type VARCHAR(50) NOT NULL, -- 'poll', 'betting', 'analysis', 'live_updates', 'summary'
  content_subtype VARCHAR(50), -- 'prediction', 'tactical', 'player_focus', etc.
  
  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  priority INTEGER DEFAULT 5, -- 1-10, higher = more important
  
  -- Target channels
  target_channels JSONB NOT NULL DEFAULT '[]', -- Channel IDs to send to
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  
  -- Execution tracking
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'executing', 'completed', 'failed', 'cancelled'
  executed_at TIMESTAMP WITH TIME ZONE,
  execution_duration INTEGER, -- Seconds taken to execute
  
  -- Results tracking
  content_generated JSONB, -- Generated content details
  telegram_message_ids JSONB, -- Message IDs if sent to Telegram
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Smart scheduling metadata
  timing_reason TEXT, -- Why this timing was chosen
  auto_scheduled BOOLEAN DEFAULT true, -- vs manually scheduled
  can_reschedule BOOLEAN DEFAULT true, -- Can this be moved if needed
  
  -- Performance tracking
  engagement_score INTEGER, -- Expected engagement 1-100
  actual_engagement JSONB, -- Actual performance metrics
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================================================
-- 3. MATCH CONTENT ANALYTICS TABLE
-- Track content performance per match for optimization
-- ======================================================================

CREATE TABLE IF NOT EXISTS match_content_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  match_id UUID REFERENCES daily_important_matches(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES dynamic_content_schedule(id) ON DELETE CASCADE,
  
  -- Content metrics
  content_type VARCHAR(50) NOT NULL,
  channels_sent INTEGER DEFAULT 0,
  total_reach INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2), -- Percentage
  
  -- Timing analysis
  content_timing VARCHAR(50), -- 'pre_match', 'live', 'post_match'
  hours_before_kickoff INTEGER, -- For pre-match content
  
  -- Performance scores
  virality_score INTEGER, -- 1-100
  accuracy_score INTEGER, -- For predictions, 1-100
  user_feedback JSONB, -- Comments, reactions, etc.
  
  -- ROI tracking
  api_calls_used INTEGER DEFAULT 0,
  generation_cost DECIMAL(10,4), -- In USD
  revenue_generated DECIMAL(10,4), -- From coupons/affiliates
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================================================
-- 4. CONTENT TIMING TEMPLATES
-- Reusable timing patterns for different match types
-- ======================================================================

CREATE TABLE IF NOT EXISTS content_timing_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template identification
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  
  -- Match criteria
  min_importance_score INTEGER NOT NULL,
  max_importance_score INTEGER,
  competition_patterns TEXT[], -- Competition name patterns
  
  -- Content schedule (JSONB array of timing rules)
  content_schedule JSONB NOT NULL,
  /* Example structure:
  [
    {
      "content_type": "poll",
      "hours_before_kickoff": 4,
      "priority": 8,
      "conditions": ["importance_score > 20"]
    },
    {
      "content_type": "betting",
      "hours_before_kickoff": 3,
      "priority": 9
    }
  ]
  */
  
  -- Usage tracking
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2), -- Percentage of successful content
  
  -- Template metadata
  is_active BOOLEAN DEFAULT true,
  created_by UUID, -- User who created this template
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================================================
-- INDEXES FOR PERFORMANCE
-- ======================================================================

-- Daily matches indexes
CREATE INDEX IF NOT EXISTS idx_daily_matches_discovery_date ON daily_important_matches(discovery_date);
CREATE INDEX IF NOT EXISTS idx_daily_matches_kickoff ON daily_important_matches(kickoff_time);
CREATE INDEX IF NOT EXISTS idx_daily_matches_importance ON daily_important_matches(importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_daily_matches_status ON daily_important_matches(match_status);
CREATE INDEX IF NOT EXISTS idx_daily_matches_external_id ON daily_important_matches(external_match_id);

-- Content schedule indexes
CREATE INDEX IF NOT EXISTS idx_content_schedule_match ON dynamic_content_schedule(match_id);
CREATE INDEX IF NOT EXISTS idx_content_schedule_scheduled_for ON dynamic_content_schedule(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_content_schedule_status ON dynamic_content_schedule(status);
CREATE INDEX IF NOT EXISTS idx_content_schedule_type ON dynamic_content_schedule(content_type);
CREATE INDEX IF NOT EXISTS idx_content_schedule_priority ON dynamic_content_schedule(priority DESC);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_match ON match_content_analytics(match_id);
CREATE INDEX IF NOT EXISTS idx_analytics_content_type ON match_content_analytics(content_type);
CREATE INDEX IF NOT EXISTS idx_analytics_timing ON match_content_analytics(content_timing);

-- Templates indexes
CREATE INDEX IF NOT EXISTS idx_templates_active ON content_timing_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_templates_importance ON content_timing_templates(min_importance_score, max_importance_score);

-- ======================================================================
-- DEFAULT TIMING TEMPLATES
-- ======================================================================

-- High importance matches (25+ score)
INSERT INTO content_timing_templates (name, description, min_importance_score, max_importance_score, content_schedule) VALUES 
(
  'High Importance Match',
  'Premium content schedule for top-tier matches',
  25, 100,
  '[
    {"content_type": "poll", "hours_before_kickoff": 6, "priority": 7, "subtype": "prediction"},
    {"content_type": "betting", "hours_before_kickoff": 4, "priority": 9, "subtype": "comprehensive"},
    {"content_type": "analysis", "hours_before_kickoff": 2, "priority": 8, "subtype": "detailed"},
    {"content_type": "poll", "hours_before_kickoff": 1, "priority": 6, "subtype": "last_minute"},
    {"content_type": "live_updates", "hours_before_kickoff": 0, "priority": 10, "subtype": "full_coverage"},
    {"content_type": "summary", "hours_after_kickoff": 2, "priority": 7, "subtype": "comprehensive"}
  ]'::jsonb
);

-- Medium importance matches (15-24 score)
INSERT INTO content_timing_templates (name, description, min_importance_score, max_importance_score, content_schedule) VALUES 
(
  'Medium Importance Match',
  'Standard content schedule for important matches',
  15, 24,
  '[
    {"content_type": "betting", "hours_before_kickoff": 3, "priority": 8, "subtype": "standard"},
    {"content_type": "analysis", "hours_before_kickoff": 2, "priority": 7, "subtype": "focused"},
    {"content_type": "live_updates", "hours_before_kickoff": 0, "priority": 9, "subtype": "key_events"},
    {"content_type": "summary", "hours_after_kickoff": 3, "priority": 6, "subtype": "brief"}
  ]'::jsonb
);

-- Weekend special template
INSERT INTO content_timing_templates (name, description, min_importance_score, max_importance_score, content_schedule) VALUES 
(
  'Weekend Special',
  'Enhanced weekend content with extra polls and engagement',
  18, 100,
  '[
    {"content_type": "poll", "hours_before_kickoff": 8, "priority": 6, "subtype": "weekend_warmup"},
    {"content_type": "poll", "hours_before_kickoff": 4, "priority": 7, "subtype": "prediction"},
    {"content_type": "betting", "hours_before_kickoff": 3, "priority": 9, "subtype": "weekend_special"},
    {"content_type": "analysis", "hours_before_kickoff": 1, "priority": 8, "subtype": "tactical"},
    {"content_type": "live_updates", "hours_before_kickoff": 0, "priority": 10, "subtype": "premium"}
  ]'::jsonb
);

-- ======================================================================
-- HELPER FUNCTIONS
-- ======================================================================

-- Function to get today's important matches
CREATE OR REPLACE FUNCTION get_todays_important_matches()
RETURNS TABLE (
  match_id UUID,
  home_team VARCHAR,
  away_team VARCHAR,
  competition VARCHAR,
  kickoff_time TIMESTAMP WITH TIME ZONE,
  importance_score INTEGER,
  content_opportunities JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dim.id,
    dim.home_team,
    dim.away_team,
    dim.competition,
    dim.kickoff_time,
    dim.importance_score,
    dim.content_opportunities
  FROM daily_important_matches dim
  WHERE dim.discovery_date = CURRENT_DATE
  ORDER BY dim.importance_score DESC, dim.kickoff_time ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get upcoming scheduled content
CREATE OR REPLACE FUNCTION get_upcoming_scheduled_content(hours_ahead INTEGER DEFAULT 24)
RETURNS TABLE (
  schedule_id UUID,
  match_info TEXT,
  content_type VARCHAR,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  status VARCHAR,
  priority INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dcs.id,
    CONCAT(dim.home_team, ' vs ', dim.away_team),
    dcs.content_type,
    dcs.scheduled_for,
    dcs.status,
    dcs.priority
  FROM dynamic_content_schedule dcs
  JOIN daily_important_matches dim ON dcs.match_id = dim.id
  WHERE dcs.scheduled_for BETWEEN NOW() AND NOW() + INTERVAL '1 hour' * hours_ahead
    AND dcs.status IN ('pending', 'executing')
  ORDER BY dcs.scheduled_for ASC, dcs.priority DESC;
END;
$$ LANGUAGE plpgsql;

-- ======================================================================
-- SUCCESS MESSAGE
-- ======================================================================

-- Add success log
DO $$
BEGIN
  RAISE NOTICE '✅ Dynamic Match-Based Content System created successfully!';
  RAISE NOTICE '📊 Tables: daily_important_matches, dynamic_content_schedule, match_content_analytics, content_timing_templates';
  RAISE NOTICE '🔧 Functions: get_todays_important_matches(), get_upcoming_scheduled_content()';
  RAISE NOTICE '📋 Default templates: High/Medium importance + Weekend special';
END $$; 