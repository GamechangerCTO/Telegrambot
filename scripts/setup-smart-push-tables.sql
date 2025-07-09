-- Smart Push System Tables
-- נוצר ב: דצמבר 30, 2025
-- מטרה: מערכת דחיפה חכמה לקופונים

-- טבלת תורים לדחיפה חכמה
CREATE TABLE IF NOT EXISTS smart_push_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- מזהי התוכן הראשי
  primary_content_id TEXT NOT NULL,
  primary_content_type TEXT NOT NULL, -- 'betting', 'analysis', 'news'
  
  -- מידע על הערוצים
  channel_ids TEXT[] NOT NULL,
  language TEXT NOT NULL,
  
  -- הגדרות העיכוב
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  delay_minutes INTEGER DEFAULT 3,
  
  -- סטטוס העיבוד
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  processed_at TIMESTAMP WITH TIME ZONE,
  
  -- תוצאות
  selected_coupon_id UUID REFERENCES coupons(id),
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  error_message TEXT,
  
  -- מטאדטה
  context_data JSONB, -- שמירת הקשר התוכן הראשי
  retry_count INTEGER DEFAULT 0,
  
  -- זמנים
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- אינדקסים לביצועים
  INDEX idx_smart_push_scheduled (scheduled_at, status),
  INDEX idx_smart_push_status (status, created_at)
);

-- טבלת הגדרות דחיפה חכמה לכל ערוץ
CREATE TABLE IF NOT EXISTS smart_push_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- מזהה ערוץ
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  
  -- הגדרות כלליות
  is_enabled BOOLEAN DEFAULT true,
  
  -- הגדרות עיתוי
  min_delay_minutes INTEGER DEFAULT 2,
  max_delay_minutes INTEGER DEFAULT 5,
  
  -- מגבלות ספאם
  max_coupons_per_day INTEGER DEFAULT 3,
  min_gap_hours INTEGER DEFAULT 2,
  
  -- טריגרים
  trigger_on_betting BOOLEAN DEFAULT true,
  trigger_on_analysis BOOLEAN DEFAULT true,
  trigger_on_news BOOLEAN DEFAULT false,
  
  -- הגדרות מתקדמות
  preferred_betting_sites TEXT[], -- אתרי הימורים מועדפים
  blackout_hours JSONB, -- שעות חסימה {"start": "23:00", "end": "06:00"}
  
  -- זמנים
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- אילוץ ייחודיות
  UNIQUE(channel_id)
);

-- טבלת מעקב שליחות קופונים חכמות
CREATE TABLE IF NOT EXISTS smart_push_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- קישור לתור
  queue_id UUID REFERENCES smart_push_queue(id),
  
  -- פרטי השליחה
  channel_id UUID REFERENCES channels(id),
  coupon_id UUID REFERENCES coupons(id),
  telegram_message_id BIGINT,
  
  -- תוצאות
  delivery_status TEXT NOT NULL, -- 'sent', 'failed', 'clicked'
  clicked_at TIMESTAMP WITH TIME ZONE,
  conversion_value DECIMAL(10,2),
  
  -- מעקב ביצועים
  engagement_score INTEGER, -- 1-10 באמת איך זה עבד
  user_feedback TEXT,
  
  -- זמנים
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- אינדקסים
  INDEX idx_smart_deliveries_channel (channel_id, sent_at),
  INDEX idx_smart_deliveries_coupon (coupon_id, sent_at)
);

-- טבלת אנליטיקס יומית
CREATE TABLE IF NOT EXISTS smart_push_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- זמן ומיקום
  date DATE NOT NULL,
  channel_id UUID REFERENCES channels(id),
  
  -- מדדי ביצועים
  total_triggers INTEGER DEFAULT 0,
  successful_pushes INTEGER DEFAULT 0,
  failed_pushes INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  
  -- מדדים כלכליים
  revenue_generated DECIMAL(10,2) DEFAULT 0,
  cost_per_acquisition DECIMAL(10,2),
  
  -- מדדי איכות
  average_engagement_score DECIMAL(3,2),
  click_through_rate DECIMAL(5,4),
  conversion_rate DECIMAL(5,4),
  
  -- נתונים גולמיים
  raw_data JSONB,
  
  -- זמנים
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- אילוץ ייחודיות
  UNIQUE(date, channel_id)
);

-- טריגר לעדכון אוטומטי של updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- הוספת טריגרים לכל הטבלאות
CREATE TRIGGER update_smart_push_queue_updated_at BEFORE UPDATE ON smart_push_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_smart_push_settings_updated_at BEFORE UPDATE ON smart_push_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_smart_push_analytics_updated_at BEFORE UPDATE ON smart_push_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- הוספת הגדרות ברירת מחדל לערוצים קיימים
INSERT INTO smart_push_settings (channel_id, is_enabled)
SELECT id, true FROM channels 
WHERE id NOT IN (SELECT channel_id FROM smart_push_settings WHERE channel_id IS NOT NULL)
ON CONFLICT (channel_id) DO NOTHING;

-- הוספת הרשאות RLS (Row Level Security)
ALTER TABLE smart_push_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_push_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_push_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_push_analytics ENABLE ROW LEVEL SECURITY;

-- מדיניות גישה (זמנית - לכל המשתמשים המאומתים)
CREATE POLICY "Enable all for authenticated users" ON smart_push_queue FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON smart_push_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON smart_push_deliveries FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON smart_push_analytics FOR ALL USING (auth.role() = 'authenticated');

COMMENT ON TABLE smart_push_queue IS 'תור לדחיפות חכמות של קופונים אחרי תוכן ראשי';
COMMENT ON TABLE smart_push_settings IS 'הגדרות דחיפה חכמה לכל ערוץ';
COMMENT ON TABLE smart_push_deliveries IS 'מעקב שליחות וביצועים של קופונים חכמים';
COMMENT ON TABLE smart_push_analytics IS 'אנליטיקס יומית למערכת הדחיפה החכמה'; 