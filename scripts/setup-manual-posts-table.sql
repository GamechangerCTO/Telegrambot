-- Manual Posts Table for Channel-Specific Content Scheduling
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_manual_posts_channel_id ON manual_posts(channel_id);
CREATE INDEX IF NOT EXISTS idx_manual_posts_scheduled_time ON manual_posts(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_manual_posts_status ON manual_posts(status);
CREATE INDEX IF NOT EXISTS idx_manual_posts_channel_scheduled ON manual_posts(channel_id, scheduled_time);

-- Add RLS policy for manual posts
ALTER TABLE manual_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage manual posts for their channels" ON manual_posts
FOR ALL USING (
  channel_id IN (
    SELECT c.id FROM channels c
    JOIN bots b ON c.bot_id = b.id
    JOIN managers m ON b.manager_id = m.id
    WHERE m.user_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_manual_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_manual_posts_updated_at
  BEFORE UPDATE ON manual_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_manual_posts_updated_at();

-- Add sample data for testing
INSERT INTO manual_posts (channel_id, content, post_type, scheduled_time) VALUES
(
  (SELECT id FROM channels LIMIT 1),
  'Special promotion! Get 50% bonus on your first deposit 🎉',
  'marketing',
  NOW() + INTERVAL '2 hours'
);

COMMENT ON TABLE manual_posts IS 'User-generated manual posts scheduled for specific channels';
COMMENT ON COLUMN manual_posts.recurrence IS 'Frequency: once, daily, weekly';
COMMENT ON COLUMN manual_posts.status IS 'Current status: scheduled, sent, failed, cancelled';