-- הוספת טבלאות חסרות למערכת הקיימת

-- 1. טבלת organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  subscription_tier VARCHAR(50) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise')),
  max_bots INTEGER DEFAULT 3,
  max_channels INTEGER DEFAULT 10,
  super_admin_email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. טבלת users (להחליף את managers)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'manager' CHECK (role IN ('super_admin', 'admin', 'manager', 'editor')),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  preferred_language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. טבלת user_orgs (קישור משתמשים לארגונים)
CREATE TABLE IF NOT EXISTS user_orgs (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, org_id)
);

-- 4. טבלת content_queue
CREATE TABLE IF NOT EXISTS content_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  content_type VARCHAR(50) NOT NULL,
  source_data JSONB NOT NULL,
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processing_started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. טבלת automation_logs
CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('running', 'success', 'failed')),
  channels_updated INTEGER DEFAULT 0,
  content_generated INTEGER DEFAULT 0,
  duration_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. טבלת content_types (לניהול סוגי תוכן)
CREATE TABLE IF NOT EXISTS content_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  template JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. טבלת content_items (לאחסון תוכן מוכן)
CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500),
  content TEXT NOT NULL,
  content_type_id UUID REFERENCES content_types(id),
  language VARCHAR(10) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  priority INTEGER DEFAULT 5,
  metadata JSONB DEFAULT '{}',
  source_data JSONB DEFAULT '{}',
  scheduled_for TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. טבלת content_distribution (למעקב אחר הפצת תוכן)
CREATE TABLE IF NOT EXISTS content_distribution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  telegram_message_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  engagement_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. טבלת api_keys (לניהול מפתחות API)
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  service_name VARCHAR(100) NOT NULL,
  key_value TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_used TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, service_name)
);

-- 10. טבלת matches (למשחקים)
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(255) UNIQUE NOT NULL,
  home_team_id UUID REFERENCES teams(id),
  away_team_id UUID REFERENCES teams(id),
  league_id UUID REFERENCES leagues(id),
  kickoff_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled',
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  minute INTEGER,
  referee VARCHAR(255),
  venue VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. טבלת match_events (לאירועי משחק)
CREATE TABLE IF NOT EXISTS match_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  minute INTEGER,
  player_name VARCHAR(255),
  team VARCHAR(10), -- 'home' or 'away'
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. טבלת betting_odds (להימורים)
CREATE TABLE IF NOT EXISTS betting_odds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  bookmaker VARCHAR(100) NOT NULL,
  market_type VARCHAR(100) NOT NULL,
  odds JSONB NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- הוספת אינדקסים לביצועים
CREATE INDEX IF NOT EXISTS idx_content_queue_status_priority ON content_queue(status, priority, created_at);
CREATE INDEX IF NOT EXISTS idx_content_queue_channel ON content_queue(channel_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_created ON automation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_items_language ON content_items(language);
CREATE INDEX IF NOT EXISTS idx_content_items_status ON content_items(status);
CREATE INDEX IF NOT EXISTS idx_content_items_organization ON content_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_content_distribution_channel ON content_distribution(channel_id);
CREATE INDEX IF NOT EXISTS idx_content_distribution_status ON content_distribution(status);
CREATE INDEX IF NOT EXISTS idx_matches_kickoff ON matches(kickoff_time DESC);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

-- הוספת triggers לעדכון updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- החלת triggers על הטבלאות החדשות
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_queue_updated_at BEFORE UPDATE ON content_queue 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_items_updated_at BEFORE UPDATE ON content_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- הוספת RLS policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- מדיניות אבטחה בסיסית
CREATE POLICY "Users can access their organization" ON organizations
  FOR ALL USING (
    id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can access their org data" ON users
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- הוספת נתוני דוגמה לסוגי תוכן
INSERT INTO content_types (name, description, priority) VALUES
  ('live_update', 'Real-time match updates', 1),
  ('breaking_news', 'Breaking football news', 2),
  ('betting_tip', 'Betting tips and predictions', 3),
  ('match_preview', 'Pre-match analysis', 4),
  ('daily_summary', 'Daily football summary', 5),
  ('poll', 'Interactive polls', 6),
  ('coupon', 'Betting coupons and offers', 7),
  ('meme', 'Football memes and entertainment', 8)
ON CONFLICT (name) DO NOTHING;

-- יצירת ארגון ומשתמש ראשוניים
INSERT INTO organizations (id, name, super_admin_email, subscription_tier, max_bots, max_channels)
VALUES ('00000000-0000-0000-0000-000000000001', 'TriRoars Sports', 'triroars@gmail.com', 'enterprise', 100, 1000)
ON CONFLICT DO NOTHING;

INSERT INTO users (id, email, name, role, organization_id)
VALUES ('00000000-0000-0000-0000-000000000002', 'triroars@gmail.com', 'Super Admin', 'super_admin', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (email) DO NOTHING; 