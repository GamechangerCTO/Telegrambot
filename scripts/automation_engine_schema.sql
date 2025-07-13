-- 🤖 AUTOMATION ENGINE DATABASE SCHEMA
-- Run this in Supabase SQL Editor to create the automation tables

-- Table: automation_rules
-- Stores all automation scheduling rules
CREATE TABLE IF NOT EXISTS automation_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('live', 'betting', 'news', 'polls', 'analysis', 'coupons', 'memes', 'daily_summary', 'weekly_summary')),
    time_pattern TEXT NOT NULL, -- Cron-like pattern (e.g., "0 8 * * *")
    languages TEXT[] DEFAULT ARRAY['en'], -- Array of language codes
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    conditions JSONB DEFAULT '{}', -- Flexible conditions object
    next_run TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Table: automation_status  
-- Stores overall automation system status
CREATE TABLE IF NOT EXISTS automation_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    is_running BOOLEAN DEFAULT true,
    last_execution TIMESTAMPTZ DEFAULT NOW(),
    next_execution TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour',
    total_executions INTEGER DEFAULT 0,
    successful_executions INTEGER DEFAULT 0,
    failed_executions INTEGER DEFAULT 0,
    system_health JSONB DEFAULT '{"status": "healthy"}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: automation_executions
-- Stores history of all automation executions
CREATE TABLE IF NOT EXISTS automation_executions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rule_id UUID REFERENCES automation_rules(id),
    content_type TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'en',
    execution_status TEXT NOT NULL CHECK (execution_status IN ('success', 'failed', 'partial')),
    channels_processed INTEGER DEFAULT 0,
    content_generated INTEGER DEFAULT 0,
    execution_details JSONB DEFAULT '{}',
    execution_time INTERVAL,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_automation_rules_active ON automation_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_automation_rules_next_run ON automation_rules(next_run) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_automation_rules_content_type ON automation_rules(content_type);
CREATE INDEX IF NOT EXISTS idx_automation_executions_created_at ON automation_executions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_executions_rule_id ON automation_executions(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_executions_status ON automation_executions(execution_status);

-- Row Level Security (RLS)
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for automation_rules
CREATE POLICY "Users can view automation rules" ON automation_rules
    FOR SELECT USING (true); -- All authenticated users can view

CREATE POLICY "Super admins can manage automation rules" ON automation_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- RLS Policies for automation_status  
CREATE POLICY "Users can view automation status" ON automation_status
    FOR SELECT USING (true);

CREATE POLICY "Super admins can manage automation status" ON automation_status
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- RLS Policies for automation_executions
CREATE POLICY "Users can view automation executions" ON automation_executions
    FOR SELECT USING (true);

CREATE POLICY "System can insert automation executions" ON automation_executions
    FOR INSERT WITH CHECK (true); -- Allow system to log executions

-- Update trigger for automation_rules
CREATE OR REPLACE FUNCTION update_automation_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_automation_rules_updated_at
    BEFORE UPDATE ON automation_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_automation_rules_updated_at();

-- Insert initial automation status record
INSERT INTO automation_status (is_running, total_executions, successful_executions, failed_executions)
VALUES (true, 0, 0, 0)
ON CONFLICT DO NOTHING;

-- Insert sample automation rules
INSERT INTO automation_rules (name, content_type, time_pattern, languages, is_active, priority, next_run) VALUES
('Morning Football Digest', 'daily_summary', '0 8 * * *', ARRAY['en', 'am', 'sw'], true, 1, NOW() + INTERVAL '1 day'),
('Lunch Betting Tips', 'betting', '0 12 * * *', ARRAY['en'], true, 2, NOW() + INTERVAL '4 hours'),
('Evening Live Updates', 'live', '0 20 * * *', ARRAY['en', 'am', 'sw'], true, 1, NOW() + INTERVAL '8 hours'),
('Weekend Analysis', 'analysis', '0 15 * * 0,6', ARRAY['en'], true, 3, NOW() + INTERVAL '2 days'),
('Breaking News Alert', 'news', '0 */4 * * *', ARRAY['en', 'am', 'sw'], true, 4, NOW() + INTERVAL '4 hours')
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON automation_rules TO authenticated;
GRANT SELECT, UPDATE ON automation_status TO authenticated;  
GRANT SELECT, INSERT ON automation_executions TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Success message
SELECT 'Automation Engine database schema created successfully!' as message;