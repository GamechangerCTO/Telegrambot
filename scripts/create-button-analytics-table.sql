-- Button Analytics Table for Telegram Button Tracking
-- This table tracks button clicks and interactions for analytics

CREATE TABLE IF NOT EXISTS button_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Channel and user information
  channel_id TEXT NOT NULL,
  user_id TEXT,
  
  -- Button details
  button_type TEXT NOT NULL, -- 'betting', 'news', 'live', 'poll', etc.
  button_text TEXT,
  analytics_tag TEXT, -- Specific button identifier
  
  -- URL and action tracking
  url_clicked TEXT,
  callback_data TEXT,
  copy_text TEXT,
  
  -- Content context
  content_type TEXT, -- 'betting_tips', 'news_article', 'live_match', etc.
  content_id TEXT,
  match_info JSONB, -- For sports-related content
  
  -- Tracking metadata
  utm_source TEXT DEFAULT 'telegram',
  utm_medium TEXT DEFAULT 'bot',
  utm_campaign TEXT,
  utm_content TEXT,
  
  -- Timing
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id TEXT,
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}',
  
  -- Constraints and indexes
  CONSTRAINT button_analytics_channel_fk 
    FOREIGN KEY (channel_id) 
    REFERENCES channels(id) 
    ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_button_analytics_channel_id ON button_analytics(channel_id);
CREATE INDEX IF NOT EXISTS idx_button_analytics_button_type ON button_analytics(button_type);
CREATE INDEX IF NOT EXISTS idx_button_analytics_analytics_tag ON button_analytics(analytics_tag);
CREATE INDEX IF NOT EXISTS idx_button_analytics_clicked_at ON button_analytics(clicked_at);
CREATE INDEX IF NOT EXISTS idx_button_analytics_content_type ON button_analytics(content_type);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_button_analytics_channel_type_date 
  ON button_analytics(channel_id, button_type, clicked_at);
CREATE INDEX IF NOT EXISTS idx_button_analytics_tag_date 
  ON button_analytics(analytics_tag, clicked_at);

-- Row Level Security (RLS) policies
ALTER TABLE button_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see analytics for their channels
CREATE POLICY button_analytics_channel_access ON button_analytics
  FOR ALL USING (
    channel_id IN (
      SELECT c.id 
      FROM channels c 
      JOIN managers m ON c.manager_id = m.id 
      WHERE m.auth_user_id = auth.uid()
    )
  );

-- Add comments for documentation
COMMENT ON TABLE button_analytics IS 'Tracks Telegram button clicks and interactions for analytics';
COMMENT ON COLUMN button_analytics.analytics_tag IS 'Specific identifier for button analytics (e.g., betting_like, news_share)';
COMMENT ON COLUMN button_analytics.match_info IS 'JSON data containing match information for sports-related buttons';
COMMENT ON COLUMN button_analytics.metadata IS 'Additional tracking data and context';

-- Sample data for testing (optional)
INSERT INTO button_analytics (
  channel_id, 
  button_type, 
  button_text, 
  analytics_tag, 
  url_clicked,
  content_type,
  utm_campaign,
  metadata
) VALUES 
(
  '3f41f4a4-ec2a-4e95-a99d-c713b2718d22', -- Example channel ID
  'betting', 
  'More Tips', 
  'betting_website',
  'https://africasportscenter.com?utm_source=telegram&utm_medium=bot',
  'betting_tips',
  'betting_more_tips',
  '{"button_position": 1, "content_language": "en"}'
);

-- Create function to get button analytics summary
CREATE OR REPLACE FUNCTION get_button_analytics_summary(
  p_channel_id TEXT DEFAULT NULL,
  p_days_back INTEGER DEFAULT 7
)
RETURNS TABLE (
  button_type TEXT,
  analytics_tag TEXT,
  click_count BIGINT,
  unique_users BIGINT,
  most_popular_url TEXT,
  last_clicked TIMESTAMP WITH TIME ZONE
) 
LANGUAGE SQL
AS $$
  SELECT 
    ba.button_type,
    ba.analytics_tag,
    COUNT(*) as click_count,
    COUNT(DISTINCT ba.user_id) as unique_users,
    MODE() WITHIN GROUP (ORDER BY ba.url_clicked) as most_popular_url,
    MAX(ba.clicked_at) as last_clicked
  FROM button_analytics ba
  WHERE 
    (p_channel_id IS NULL OR ba.channel_id = p_channel_id)
    AND ba.clicked_at >= NOW() - INTERVAL '%s days'
  GROUP BY ba.button_type, ba.analytics_tag
  ORDER BY click_count DESC;
$$;

-- Create function to track button performance over time
CREATE OR REPLACE FUNCTION get_button_performance_over_time(
  p_channel_id TEXT DEFAULT NULL,
  p_button_type TEXT DEFAULT NULL,
  p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  date_clicked DATE,
  button_type TEXT,
  click_count BIGINT,
  unique_users BIGINT
) 
LANGUAGE SQL
AS $$
  SELECT 
    DATE(ba.clicked_at) as date_clicked,
    ba.button_type,
    COUNT(*) as click_count,
    COUNT(DISTINCT ba.user_id) as unique_users
  FROM button_analytics ba
  WHERE 
    (p_channel_id IS NULL OR ba.channel_id = p_channel_id)
    AND (p_button_type IS NULL OR ba.button_type = p_button_type)
    AND ba.clicked_at >= NOW() - INTERVAL '%s days'
  GROUP BY DATE(ba.clicked_at), ba.button_type
  ORDER BY date_clicked DESC, click_count DESC;
$$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Button analytics table and functions created successfully!';
  RAISE NOTICE '📊 Use get_button_analytics_summary() to get button performance stats';
  RAISE NOTICE '📈 Use get_button_performance_over_time() to get trends over time';
END $$;