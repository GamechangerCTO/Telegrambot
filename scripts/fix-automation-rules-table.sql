-- Fix automation_rules table for production
-- Add missing columns and ensure proper structure

-- Add organization_id column if it doesn't exist
ALTER TABLE automation_rules 
ADD COLUMN IF NOT EXISTS organization_id UUID DEFAULT '00000000-0000-0000-0000-000000000001';

-- Add missing columns that might be needed
ALTER TABLE automation_rules 
ADD COLUMN IF NOT EXISTS content_types JSONB DEFAULT '["news"]';

ALTER TABLE automation_rules 
ADD COLUMN IF NOT EXISTS schedule JSONB DEFAULT '{"frequency": "daily", "times": ["09:00"]}';

ALTER TABLE automation_rules 
ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '["en"]';

ALTER TABLE automation_rules 
ADD COLUMN IF NOT EXISTS channels JSONB DEFAULT '[]';

ALTER TABLE automation_rules 
ADD COLUMN IF NOT EXISTS conditions JSONB DEFAULT '{}';

ALTER TABLE automation_rules 
ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;

ALTER TABLE automation_rules 
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'manual_approval';

-- Update existing records to have proper structure
UPDATE automation_rules 
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE organization_id IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_automation_rules_org_id ON automation_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_enabled ON automation_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_automation_rules_type ON automation_rules(type);

-- Insert default automation rules if table is empty
INSERT INTO automation_rules (
  name, enabled, type, schedule, content_types, languages, channels, conditions, organization_id
) 
SELECT 
  'חדשות בוקר יומיות',
  true,
  'manual_approval',
  '{"frequency": "daily", "times": ["08:00"]}',
  '["news"]',
  '["en", "am", "sw"]',
  '[]',
  '{}',
  '00000000-0000-0000-0000-000000000001'
WHERE NOT EXISTS (SELECT 1 FROM automation_rules WHERE name = 'חדשות בוקר יומיות');

INSERT INTO automation_rules (
  name, enabled, type, schedule, content_types, languages, channels, conditions, organization_id
) 
SELECT 
  'טיפים להימורים ערב',
  true,
  'manual_approval',
  '{"frequency": "daily", "times": ["20:00"]}',
  '["betting"]',
  '["en", "am", "sw"]',
  '[]',
  '{}',
  '00000000-0000-0000-0000-000000000001'
WHERE NOT EXISTS (SELECT 1 FROM automation_rules WHERE name = 'טיפים להימורים ערב');

-- Grant proper permissions
GRANT ALL ON automation_rules TO postgres;
GRANT ALL ON automation_rules TO anon;
GRANT ALL ON automation_rules TO authenticated; 