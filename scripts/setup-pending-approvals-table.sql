-- Pending Approvals Table for Automation System
-- נוצר בתאריך: דצמבר 30, 2025
-- מטרה: טבלה לניהול תוכן הממתין לאישור ידני

CREATE TABLE IF NOT EXISTS pending_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- קישור לחוק האוטומציה
  rule_id UUID REFERENCES automation_rules(id) ON DELETE CASCADE,
  rule_name VARCHAR(255) NOT NULL,
  
  -- מידע על התוכן
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN (
    'live_update',    -- עדכונים חיים
    'breaking_news',  -- חדשות דחופות
    'betting_tip',    -- טיפים להימורים
    'match_preview',  -- תצוגה מקדימה
    'daily_summary',  -- סיכום יומי
    'weekly_summary', -- סיכום שבועי
    'poll',          -- סקר
    'coupon',        -- קופון
    'analysis',      -- ניתוח מתקדם
    'news',          -- חדשות כלליות
    'meme'           -- ממים
  )),
  
  -- הגדרות שפה וערוצים
  language VARCHAR(10) NOT NULL,
  channels TEXT[] NOT NULL,
  
  -- התוכן עצמו
  content JSONB NOT NULL, -- { text, imageUrl?, preview, metadata? }
  
  -- מדדי איכות AI
  ai_confidence INTEGER NOT NULL CHECK (ai_confidence BETWEEN 0 AND 100),
  estimated_engagement VARCHAR(20) DEFAULT 'Medium',
  quality_score DECIMAL(3,2),
  
  -- סטטוס האישור
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending',   -- ממתין לאישור
    'approved',  -- אושר ונשלח
    'rejected',  -- נדחה
    'editing'    -- בעריכה
  )),
  
  -- מידע נוסף
  rejection_reason TEXT,
  edited_content JSONB, -- תוכן ערוך אם נעשה שינוי
  
  -- מטאדטה
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- זמנים
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  telegram_message_id BIGINT,
  
  -- מעקב שליחה
  delivery_status VARCHAR(20) DEFAULT 'pending',
  delivery_error TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- אינדקסים לביצועים
CREATE INDEX IF NOT EXISTS idx_pending_approvals_status ON pending_approvals(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pending_approvals_rule ON pending_approvals(rule_id);
CREATE INDEX IF NOT EXISTS idx_pending_approvals_language ON pending_approvals(language);
CREATE INDEX IF NOT EXISTS idx_pending_approvals_org ON pending_approvals(organization_id);
CREATE INDEX IF NOT EXISTS idx_pending_approvals_confidence ON pending_approvals(ai_confidence DESC);
CREATE INDEX IF NOT EXISTS idx_pending_approvals_generated ON pending_approvals(generated_at DESC);

-- טריגר לעדכון אוטומטי של updated_at
CREATE OR REPLACE FUNCTION update_pending_approvals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pending_approvals_updated_at_trigger 
BEFORE UPDATE ON pending_approvals 
FOR EACH ROW EXECUTE FUNCTION update_pending_approvals_updated_at();

-- הגדרות RLS (Row Level Security)
ALTER TABLE pending_approvals ENABLE ROW LEVEL SECURITY;

-- Policy לאורגניזציה - משתמשים רואים רק את התוכן של הארגון שלהם
CREATE POLICY pending_approvals_org_policy ON pending_approvals
  USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- מתן הרשאות לטבלה
GRANT ALL ON pending_approvals TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON pending_approvals TO service_role;

-- הוספת נתוני דמו (אם נדרש)
-- INSERT INTO pending_approvals (rule_name, content_type, language, channels, content, ai_confidence, estimated_engagement, organization_id)
-- VALUES 
-- ('Daily News Summary', 'news', 'en', ARRAY['news-en'], 
--  '{"text": "🚨 TRANSFER ALERT: Manchester United in talks for Harry Kane!", "preview": "🚨 TRANSFER ALERT: Manchester United..."}', 
--  87, 'High', '00000000-0000-0000-0000-000000000001');

-- סטטיסטיקות לטבלה
CREATE OR REPLACE VIEW pending_approvals_stats AS
SELECT 
  COUNT(*) as total_pending,
  COUNT(*) FILTER (WHERE ai_confidence >= 80) as high_confidence_count,
  AVG(ai_confidence) as average_confidence,
  COUNT(*) FILTER (WHERE status = 'pending') as currently_pending,
  COUNT(*) FILTER (WHERE status = 'approved') as total_approved,
  COUNT(*) FILTER (WHERE status = 'rejected') as total_rejected,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as pending_last_24h,
  language,
  organization_id
FROM pending_approvals 
GROUP BY language, organization_id; 