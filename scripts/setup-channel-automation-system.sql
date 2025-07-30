-- =============================================
-- Channel Automation System - Complete Database Setup
-- =============================================

-- 1. Manual Posts Table (NEW)
-- =============================================
CREATE TABLE IF NOT EXISTS manual_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  post_type VARCHAR(50) DEFAULT 'custom', -- 'custom', 'marketing', 'coupon', 'announcement'
  link_url TEXT,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  recurrence VARCHAR(20) DEFAULT 'once', -- 'once', 'daily', 'weekly'
  status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'sent', 'failed', 'cancelled'
  sent_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for manual_posts
CREATE INDEX IF NOT EXISTS idx_manual_posts_channel_id ON manual_posts(channel_id);
CREATE INDEX IF NOT EXISTS idx_manual_posts_scheduled_time ON manual_posts(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_manual_posts_status ON manual_posts(status);
CREATE INDEX IF NOT EXISTS idx_manual_posts_channel_scheduled ON manual_posts(channel_id, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_manual_posts_status_scheduled ON manual_posts(status, scheduled_time);

-- 2. Enhanced Automation Logs Table
-- =============================================
-- Check if automation_logs exists and enhance it
DO $$
BEGIN
    -- Add channel_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'automation_logs' AND column_name = 'channel_id') THEN
        ALTER TABLE automation_logs ADD COLUMN channel_id UUID REFERENCES channels(id);
    END IF;
    
    -- Add execution_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'automation_logs' AND column_name = 'execution_type') THEN
        ALTER TABLE automation_logs ADD COLUMN execution_type VARCHAR(20) DEFAULT 'automated';
    END IF;
    
    -- Add content_data column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'automation_logs' AND column_name = 'content_data') THEN
        ALTER TABLE automation_logs ADD COLUMN content_data JSONB DEFAULT '{}';
    END IF;
    
    -- Add success_details column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'automation_logs' AND column_name = 'success_details') THEN
        ALTER TABLE automation_logs ADD COLUMN success_details JSONB DEFAULT '{}';
    END IF;
END $$;

-- Additional indexes for automation_logs
CREATE INDEX IF NOT EXISTS idx_automation_logs_channel_id ON automation_logs(channel_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_execution_type ON automation_logs(execution_type);
CREATE INDEX IF NOT EXISTS idx_automation_logs_channel_date ON automation_logs(channel_id, created_at);
CREATE INDEX IF NOT EXISTS idx_automation_logs_status_date ON automation_logs(status, created_at);

-- 3. Channel Automation Settings Table (NEW)
-- =============================================
CREATE TABLE IF NOT EXISTS channel_automation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE UNIQUE,
  auto_post_enabled BOOLEAN DEFAULT true,
  max_posts_per_day INTEGER DEFAULT 10,
  smart_scheduling BOOLEAN DEFAULT true,
  post_approval_required BOOLEAN DEFAULT false,
  content_cooldowns JSONB DEFAULT '{
    "news": 180,
    "betting": 120,
    "analysis": 120,
    "live": 30,
    "polls": 240,
    "coupons": 360,
    "summary": 480
  }', -- Cooldown periods in minutes
  preferred_times JSONB DEFAULT '[]', -- Array of preferred posting times
  blackout_periods JSONB DEFAULT '[]', -- Array of time periods to avoid
  automation_rules JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for channel_automation_settings
CREATE INDEX IF NOT EXISTS idx_channel_automation_settings_channel_id ON channel_automation_settings(channel_id);

-- 4. Content Execution Queue Table (NEW)
-- =============================================
CREATE TABLE IF NOT EXISTS content_execution_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  automation_rule_id UUID REFERENCES automation_rules(id) ON DELETE CASCADE,
  manual_post_id UUID REFERENCES manual_posts(id) ON DELETE CASCADE,
  content_type VARCHAR(50) NOT NULL,
  execution_type VARCHAR(20) DEFAULT 'automated', -- 'automated', 'manual', 'triggered'
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  priority INTEGER DEFAULT 5, -- 1-10, lower is higher priority
  status VARCHAR(20) DEFAULT 'queued', -- 'queued', 'processing', 'completed', 'failed', 'cancelled'
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  content_data JSONB DEFAULT '{}',
  execution_result JSONB DEFAULT '{}',
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for content_execution_queue
CREATE INDEX IF NOT EXISTS idx_content_execution_queue_channel_id ON content_execution_queue(channel_id);
CREATE INDEX IF NOT EXISTS idx_content_execution_queue_scheduled_time ON content_execution_queue(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_content_execution_queue_status ON content_execution_queue(status);
CREATE INDEX IF NOT EXISTS idx_content_execution_queue_priority ON content_execution_queue(priority, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_content_execution_queue_channel_status ON content_execution_queue(channel_id, status);

-- 5. Automation Performance Metrics Table (NEW)
-- =============================================
CREATE TABLE IF NOT EXISTS automation_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  failed_executions INTEGER DEFAULT 0,
  average_execution_time_ms INTEGER DEFAULT 0,
  content_types_executed JSONB DEFAULT '{}', -- Count by content type
  peak_execution_hour INTEGER, -- Hour with most executions
  automation_efficiency_score DECIMAL(5,2) DEFAULT 0.0,
  user_engagement_score DECIMAL(5,2) DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(channel_id, metric_date)
);

-- Index for automation_performance_metrics
CREATE INDEX IF NOT EXISTS idx_automation_performance_metrics_channel_date ON automation_performance_metrics(channel_id, metric_date);

-- 6. RLS Policies for Security
-- =============================================

-- Enable RLS on all new tables
ALTER TABLE manual_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_automation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_execution_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policy for manual_posts
CREATE POLICY "Users can manage manual posts for their channels" ON manual_posts
FOR ALL USING (
  channel_id IN (
    SELECT c.id FROM channels c
    JOIN bots b ON c.bot_id = b.id
    JOIN managers m ON b.manager_id = m.id
    WHERE m.user_id = auth.uid()
  )
);

-- RLS Policy for channel_automation_settings
CREATE POLICY "Users can manage automation settings for their channels" ON channel_automation_settings
FOR ALL USING (
  channel_id IN (
    SELECT c.id FROM channels c
    JOIN bots b ON c.bot_id = b.id
    JOIN managers m ON b.manager_id = m.id
    WHERE m.user_id = auth.uid()
  )
);

-- RLS Policy for content_execution_queue
CREATE POLICY "Users can view execution queue for their channels" ON content_execution_queue
FOR ALL USING (
  channel_id IN (
    SELECT c.id FROM channels c
    JOIN bots b ON c.bot_id = b.id
    JOIN managers m ON b.manager_id = m.id
    WHERE m.user_id = auth.uid()
  )
);

-- RLS Policy for automation_performance_metrics
CREATE POLICY "Users can view performance metrics for their channels" ON automation_performance_metrics
FOR ALL USING (
  channel_id IN (
    SELECT c.id FROM channels c
    JOIN bots b ON c.bot_id = b.id
    JOIN managers m ON b.manager_id = m.id
    WHERE m.user_id = auth.uid()
  )
);

-- 7. Triggers for auto-updating timestamps
-- =============================================

-- Trigger function for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_manual_posts_updated_at
  BEFORE UPDATE ON manual_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channel_automation_settings_updated_at
  BEFORE UPDATE ON channel_automation_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_execution_queue_updated_at
  BEFORE UPDATE ON content_execution_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automation_performance_metrics_updated_at
  BEFORE UPDATE ON automation_performance_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Sample Data for Testing
-- =============================================

-- Insert default automation settings for existing channels
INSERT INTO channel_automation_settings (channel_id)
SELECT id FROM channels 
WHERE id NOT IN (SELECT channel_id FROM channel_automation_settings)
ON CONFLICT (channel_id) DO NOTHING;

-- Sample manual post for testing (if channels exist)
DO $$
DECLARE
    sample_channel_id UUID;
BEGIN
    -- Get first available channel
    SELECT id INTO sample_channel_id FROM channels LIMIT 1;
    
    IF sample_channel_id IS NOT NULL THEN
        INSERT INTO manual_posts (
            channel_id, 
            content, 
            post_type, 
            scheduled_time
        ) VALUES (
            sample_channel_id,
            'Welcome to our enhanced automation system! 🚀 Now you have full control over your content scheduling.',
            'announcement',
            NOW() + INTERVAL '1 hour'
        ) ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 9. Views for Easy Data Access
-- =============================================

-- View for channel automation overview
CREATE OR REPLACE VIEW channel_automation_overview AS
SELECT 
    c.id as channel_id,
    c.name as channel_name,
    c.language,
    cas.auto_post_enabled,
    cas.max_posts_per_day,
    cas.smart_scheduling,
    cas.post_approval_required,
    
    -- Manual posts stats
    COALESCE(mp_stats.total_manual_posts, 0) as total_manual_posts,
    COALESCE(mp_stats.scheduled_posts, 0) as scheduled_manual_posts,
    COALESCE(mp_stats.sent_posts, 0) as sent_manual_posts,
    
    -- Automation stats (last 7 days)
    COALESCE(al_stats.total_executions, 0) as total_executions_7d,
    COALESCE(al_stats.successful_executions, 0) as successful_executions_7d,
    COALESCE(al_stats.failed_executions, 0) as failed_executions_7d,
    
    -- Active automation rules
    COALESCE(ar_stats.active_rules, 0) as active_automation_rules
    
FROM channels c
LEFT JOIN channel_automation_settings cas ON c.id = cas.channel_id
LEFT JOIN (
    SELECT 
        channel_id,
        COUNT(*) as total_manual_posts,
        COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled_posts,
        COUNT(*) FILTER (WHERE status = 'sent') as sent_posts
    FROM manual_posts 
    GROUP BY channel_id
) mp_stats ON c.id = mp_stats.channel_id
LEFT JOIN (
    SELECT 
        channel_id,
        COUNT(*) as total_executions,
        COUNT(*) FILTER (WHERE status = 'success') as successful_executions,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_executions
    FROM automation_logs 
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY channel_id
) al_stats ON c.id = al_stats.channel_id
LEFT JOIN (
    SELECT 
        UNNEST(COALESCE(channels, ARRAY[]::text[])) as channel_id,
        COUNT(*) as active_rules
    FROM automation_rules 
    WHERE enabled = true
    GROUP BY channel_id
) ar_stats ON c.id::text = ar_stats.channel_id;

-- 10. Functions for Automation Logic
-- =============================================

-- Function to get today's timeline for a channel
CREATE OR REPLACE FUNCTION get_channel_daily_timeline(p_channel_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    id UUID,
    type TEXT,
    time TIMESTAMP WITH TIME ZONE,
    content_type TEXT,
    rule_name TEXT,
    content TEXT,
    status TEXT,
    source TEXT,
    link_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    -- Automation rules (scheduled for today)
    SELECT 
        ar.id,
        'automated'::TEXT as type,
        (p_date + (schedule_time.value)::TIME)::TIMESTAMP WITH TIME ZONE as time,
        ar.content_type,
        ar.name as rule_name,
        NULL::TEXT as content,
        CASE 
            WHEN al.id IS NOT NULL THEN 
                CASE WHEN al.status = 'success' THEN 'executed' ELSE 'failed' END
            ELSE 'pending'
        END as status,
        'automation'::TEXT as source,
        NULL::TEXT as link_url
    FROM automation_rules ar
    CROSS JOIN LATERAL jsonb_array_elements_text(
        CASE 
            WHEN ar.schedule ? 'times' THEN ar.schedule->'times'
            ELSE '[]'::jsonb
        END
    ) AS schedule_time(value)
    LEFT JOIN automation_logs al ON (
        al.automation_rule_id = ar.id AND 
        DATE(al.created_at) = p_date AND
        EXTRACT(HOUR FROM al.created_at) = EXTRACT(HOUR FROM (schedule_time.value)::TIME)
    )
    WHERE ar.enabled = true
    AND (ar.channels IS NULL OR ar.channels @> ARRAY[p_channel_id::TEXT])
    
    UNION ALL
    
    -- Manual posts (scheduled for today)
    SELECT 
        mp.id,
        'manual'::TEXT as type,
        mp.scheduled_time as time,
        mp.post_type as content_type,
        NULL::TEXT as rule_name,
        mp.content,
        mp.status,
        'manual'::TEXT as source,
        mp.link_url
    FROM manual_posts mp
    WHERE mp.channel_id = p_channel_id
    AND DATE(mp.scheduled_time) = p_date
    
    ORDER BY time;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Comments and Documentation
-- =============================================

COMMENT ON TABLE manual_posts IS 'User-created manual posts scheduled for specific channels with marketing content support';
COMMENT ON TABLE channel_automation_settings IS 'Channel-specific automation configuration and preferences';
COMMENT ON TABLE content_execution_queue IS 'Queue system for managing automated and manual content execution';
COMMENT ON TABLE automation_performance_metrics IS 'Daily performance metrics and analytics for channel automation';

COMMENT ON COLUMN manual_posts.post_type IS 'Type of manual post: custom, marketing, coupon, announcement';
COMMENT ON COLUMN manual_posts.recurrence IS 'Frequency: once, daily, weekly';
COMMENT ON COLUMN manual_posts.status IS 'Current status: scheduled, sent, failed, cancelled';

COMMENT ON COLUMN channel_automation_settings.content_cooldowns IS 'Cooldown periods in minutes between content types';
COMMENT ON COLUMN channel_automation_settings.preferred_times IS 'Array of preferred posting times in HH:MM format';
COMMENT ON COLUMN channel_automation_settings.blackout_periods IS 'Array of time periods to avoid posting';

COMMENT ON FUNCTION get_channel_daily_timeline IS 'Returns the complete daily timeline for a channel including automated rules and manual posts';

-- Final success message
DO $$
BEGIN
    RAISE NOTICE 'Channel Automation System setup completed successfully!';
    RAISE NOTICE 'Created tables: manual_posts, channel_automation_settings, content_execution_queue, automation_performance_metrics';
    RAISE NOTICE 'Enhanced automation_logs table with new columns';
    RAISE NOTICE 'Added RLS policies, triggers, views, and helper functions';
    RAISE NOTICE 'System ready for production use!';
END $$;