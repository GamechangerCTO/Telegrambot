-- 🔗 CHANNEL BUTTONS CONFIGURATION SETUP
-- Add button configuration fields to channels table

-- Add button configuration columns to channels table
ALTER TABLE channels 
ADD COLUMN IF NOT EXISTS button_config JSONB DEFAULT '{
  "main_website": "https://africasportscenter.com",
  "betting_platform": "https://1xbet.com",
  "live_scores": "https://livescore.com",
  "news_source": "https://bbc.com/sport/football",
  "social_media": {
    "telegram": "https://t.me/africansportdata",
    "twitter": "https://twitter.com/africasports",
    "facebook": "https://facebook.com/africasportscenter",
    "instagram": "https://instagram.com/africasportscenter"
  },
  "affiliate_codes": {
    "betting": "AFRICA2024",
    "bookmaker": "SPORT123",
    "casino": "LUCKY777"
  },
  "channel_settings": {
    "enable_betting_links": true,
    "enable_affiliate_links": true,
    "enable_social_sharing": true,
    "enable_reaction_buttons": true,
    "enable_copy_buttons": true,
    "custom_website": null
  },
  "custom_buttons": []
}'::jsonb;

-- Add custom buttons templates table
CREATE TABLE IF NOT EXISTS button_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- 'betting', 'news', 'live', 'general', 'custom'
  language VARCHAR(5) NOT NULL DEFAULT 'en',
  template_config JSONB NOT NULL,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default button templates
INSERT INTO button_templates (name, description, category, language, template_config, is_system) VALUES
('Default Betting Buttons', 'Standard betting content buttons', 'betting', 'en', '{
  "buttons": [
    {"text": "👍 Like Tip", "type": "callback", "action": "like_tip"},
    {"text": "📊 Stats", "type": "callback", "action": "tip_stats"},
    {"text": "📋 Copy Tip", "type": "copy", "action": "copy_tip"},
    {"text": "⭐ Save", "type": "callback", "action": "save_tip"},
    {"text": "🌐 More Tips", "type": "url", "action": "website_link"},
    {"text": "📈 Live Odds", "type": "url", "action": "betting_platform"},
    {"text": "📤 Share", "type": "url", "action": "share_tip"}
  ]
}', true),

('Default News Buttons', 'Standard news content buttons', 'news', 'en', '{
  "buttons": [
    {"text": "👍 Like", "type": "callback", "action": "like_news"},
    {"text": "💬 Comment", "type": "callback", "action": "comment"},
    {"text": "📖 Read More", "type": "url", "action": "source_link"},
    {"text": "🌐 Website", "type": "url", "action": "website_link"},
    {"text": "📤 Share", "type": "url", "action": "share_news"},
    {"text": "📰 More News", "type": "url", "action": "news_source"}
  ]
}', true),

('Live Updates Buttons', 'Live match update buttons', 'live', 'en', '{
  "buttons": [
    {"text": "🔥 Hot Match", "type": "callback", "action": "hot_match"},
    {"text": "📊 Live Stats", "type": "url", "action": "live_scores"},
    {"text": "⚽ Follow Live", "type": "callback", "action": "follow_live"},
    {"text": "🌐 Full Coverage", "type": "url", "action": "website_link"},
    {"text": "📺 Watch Live", "type": "url", "action": "live_stream"}
  ]
}', true),

('Hebrew Betting Buttons', 'כפתורי תוכן הימורים בעברית', 'betting', 'he', '{
  "buttons": [
    {"text": "👍 אוהב את הטיפ", "type": "callback", "action": "like_tip"},
    {"text": "📊 סטטיסטיקות", "type": "callback", "action": "tip_stats"},
    {"text": "📋 העתק טיפ", "type": "copy", "action": "copy_tip"},
    {"text": "⭐ שמור", "type": "callback", "action": "save_tip"},
    {"text": "🌐 עוד טיפים", "type": "url", "action": "website_link"},
    {"text": "📈 הסיכויים החיים", "type": "url", "action": "betting_platform"},
    {"text": "📤 שתף", "type": "url", "action": "share_tip"}
  ]
}', true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_button_templates_category ON button_templates(category);
CREATE INDEX IF NOT EXISTS idx_button_templates_language ON button_templates(language);
CREATE INDEX IF NOT EXISTS idx_channels_button_config ON channels USING GIN (button_config);

-- Add RLS policies for button templates
ALTER TABLE button_templates ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read button templates
CREATE POLICY "Allow read button templates" ON button_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to manage non-system templates
CREATE POLICY "Allow manage custom templates" ON button_templates
  FOR ALL
  TO authenticated
  USING (NOT is_system OR auth.uid() IN (
    SELECT user_id FROM user_profiles WHERE role = 'super_admin'
  ));

COMMENT ON TABLE button_templates IS 'Button templates for different content types and languages';
COMMENT ON COLUMN channels.button_config IS 'Channel-specific button configuration including links, affiliate codes, and settings';