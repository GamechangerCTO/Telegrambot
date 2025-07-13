-- Enhanced automation_settings table with additional configuration fields
-- This script safely adds new columns to the existing automation_settings table

-- Add new columns for enhanced automation configuration
ALTER TABLE automation_settings 
ADD COLUMN IF NOT EXISTS content_generation_interval INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS max_daily_content INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS retry_failed_content BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_on_errors BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS active_content_types JSONB DEFAULT '["live", "betting", "news", "coupons"]';

-- Create automation_logs table for tracking automation execution
CREATE TABLE IF NOT EXISTS automation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    automation_rule_id UUID REFERENCES automation_rules(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'skipped')),
    message TEXT,
    content_generated INTEGER DEFAULT 0,
    execution_time_ms INTEGER,
    error_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    organization_id TEXT NOT NULL DEFAULT 'default'
);

-- Create generated_content table for tracking all generated content
CREATE TABLE IF NOT EXISTS generated_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'en',
    channel_id TEXT,
    automation_rule_id UUID REFERENCES automation_rules(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    organization_id TEXT NOT NULL DEFAULT 'default'
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_automation_logs_created_at ON automation_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_automation_logs_status ON automation_logs(status);
CREATE INDEX IF NOT EXISTS idx_automation_logs_rule_id ON automation_logs(automation_rule_id);

CREATE INDEX IF NOT EXISTS idx_generated_content_created_at ON generated_content(created_at);
CREATE INDEX IF NOT EXISTS idx_generated_content_type ON generated_content(content_type);
CREATE INDEX IF NOT EXISTS idx_generated_content_channel ON generated_content(channel_id);

-- Add success_count and error_count columns to automation_rules for quick stats
ALTER TABLE automation_rules 
ADD COLUMN IF NOT EXISTS success_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS error_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS organization_id TEXT DEFAULT 'default';

-- Enable RLS for new tables
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;

-- RLS policies for automation_logs
CREATE POLICY "Enable read access for managers and super admins on automation_logs" 
ON automation_logs FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.role IN ('manager', 'super_admin')
    )
);

CREATE POLICY "Enable write access for managers and super admins on automation_logs" 
ON automation_logs FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.role IN ('manager', 'super_admin')
    )
);

-- RLS policies for generated_content
CREATE POLICY "Enable read access for managers and super admins on generated_content" 
ON generated_content FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.role IN ('manager', 'super_admin')
    )
);

CREATE POLICY "Enable write access for managers and super admins on generated_content" 
ON generated_content FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.role IN ('manager', 'super_admin')
    )
);

-- Insert some sample automation rules if none exist
INSERT INTO automation_rules (name, automation_type, content_type, enabled, config, organization_id)
VALUES 
    ('Live Match Updates', 'event_driven', 'live', true, '{"match_threshold": "high", "update_frequency": 15}', 'default'),
    ('Daily News Summary', 'scheduled', 'news', true, '{"schedule": "daily", "time": "09:00"}', 'default'),
    ('Betting Tips Generator', 'event_driven', 'betting', false, '{"confidence_threshold": 0.7, "leagues": ["Premier League", "La Liga"]}', 'default'),
    ('Smart Promotional Coupons', 'context_aware', 'smart_push', true, '{"trigger_events": ["after_content", "user_engagement"], "frequency": "moderate"}', 'default')
ON CONFLICT (name) DO NOTHING;

-- Update the content_type constraint to include new types
ALTER TABLE automation_rules DROP CONSTRAINT IF EXISTS check_content_type;
ALTER TABLE automation_rules 
ADD CONSTRAINT check_content_type 
CHECK (content_type IN ('news', 'betting', 'analysis', 'live', 'daily_summary', 'polls', 'smart_push', 'coupons'));

-- Insert default enhanced settings
INSERT INTO automation_settings (
    organization_id, 
    full_automation_enabled,
    content_generation_interval,
    max_daily_content,
    retry_failed_content,
    notify_on_errors,
    active_content_types
)
VALUES (
    'default', 
    false,
    30,
    50,
    true,
    true,
    '["live", "betting", "news", "coupons"]'
)
ON CONFLICT (organization_id) DO UPDATE SET
    content_generation_interval = COALESCE(automation_settings.content_generation_interval, 30),
    max_daily_content = COALESCE(automation_settings.max_daily_content, 50),
    retry_failed_content = COALESCE(automation_settings.retry_failed_content, true),
    notify_on_errors = COALESCE(automation_settings.notify_on_errors, true),
    active_content_types = COALESCE(automation_settings.active_content_types, '["live", "betting", "news", "coupons"]');

-- Create a function to update rule statistics
CREATE OR REPLACE FUNCTION update_automation_rule_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'success' THEN
        UPDATE automation_rules 
        SET success_count = success_count + 1,
            last_run = NEW.created_at
        WHERE id = NEW.automation_rule_id;
    ELSIF NEW.status = 'error' THEN
        UPDATE automation_rules 
        SET error_count = error_count + 1,
            last_run = NEW.created_at
        WHERE id = NEW.automation_rule_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update rule statistics
DROP TRIGGER IF EXISTS trigger_update_automation_rule_stats ON automation_logs;
CREATE TRIGGER trigger_update_automation_rule_stats
    AFTER INSERT ON automation_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_automation_rule_stats();