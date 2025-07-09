-- Create automation_settings table for full automation configuration
CREATE TABLE IF NOT EXISTS automation_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL DEFAULT 'default',
    full_automation_enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_automation_settings_organization_id 
ON automation_settings(organization_id);

-- Add RLS policy for automation_settings
ALTER TABLE automation_settings ENABLE ROW LEVEL SECURITY;

-- Policy for automation_settings (managers and super admins can read/write)
CREATE POLICY "Enable read access for managers and super admins on automation_settings" 
ON automation_settings FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.role IN ('manager', 'super_admin')
    )
);

CREATE POLICY "Enable write access for managers and super admins on automation_settings" 
ON automation_settings FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_profiles.user_id = auth.uid() 
        AND user_profiles.role IN ('manager', 'super_admin')
    )
);

-- Insert default settings if not exists
INSERT INTO automation_settings (organization_id, full_automation_enabled)
VALUES ('default', false)
ON CONFLICT (organization_id) DO NOTHING;

-- Update automation_rules table to support new fields
ALTER TABLE automation_rules 
ADD COLUMN IF NOT EXISTS automation_type TEXT DEFAULT 'scheduled',
ADD COLUMN IF NOT EXISTS content_type TEXT,
ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}';

-- Add index on automation_type
CREATE INDEX IF NOT EXISTS idx_automation_rules_automation_type 
ON automation_rules(automation_type);

-- Add index on content_type
CREATE INDEX IF NOT EXISTS idx_automation_rules_content_type 
ON automation_rules(content_type);

-- Add check constraint for automation_type
ALTER TABLE automation_rules 
ADD CONSTRAINT check_automation_type 
CHECK (automation_type IN ('scheduled', 'event_driven', 'context_aware', 'full_automation'));

-- Add check constraint for content_type
ALTER TABLE automation_rules 
ADD CONSTRAINT check_content_type 
CHECK (content_type IN ('news', 'betting', 'analysis', 'live', 'daily_summary', 'polls', 'smart_push')); 