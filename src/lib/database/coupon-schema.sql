-- SMART COUPONS DATABASE SCHEMA
-- Create tables for managing promotional coupons with intelligent contextual posting

-- Main coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    offer_text TEXT NOT NULL,
    
    -- Coupon details
    coupon_code TEXT,
    discount_percentage INTEGER,
    discount_amount DECIMAL(10,2),
    min_spend DECIMAL(10,2),
    max_discount DECIMAL(10,2),
    
    -- Validity
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Targeting
    target_audience TEXT[] NOT NULL DEFAULT '{}',
    languages TEXT[] NOT NULL DEFAULT '{}',
    
    -- Branding
    brand_name TEXT NOT NULL,
    brand_logo TEXT,
    brand_colors JSONB NOT NULL DEFAULT '{"primary": "#007bff", "secondary": "#6c757d"}',
    
    -- Links
    affiliate_link TEXT NOT NULL,
    terms_url TEXT,
    
    -- Metadata
    type TEXT NOT NULL CHECK (type IN (
        'betting_bonus',
        'odds_boost', 
        'cashback',
        'free_bet',
        'deposit_bonus',
        'risk_free',
        'accumulator_boost',
        'merchandise',
        'streaming',
        'fantasy',
        'general_promo'
    )),
    priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
    max_usage INTEGER,
    current_usage INTEGER NOT NULL DEFAULT 0,
    
    -- Contextual triggers
    trigger_contexts TEXT[] NOT NULL DEFAULT '{}',
    trigger_conditions JSONB NOT NULL DEFAULT '{}',
    
    -- Performance tracking
    impressions INTEGER NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    conversions INTEGER NOT NULL DEFAULT 0,
    
    -- Audit fields
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Coupon events tracking table
CREATE TABLE IF NOT EXISTS coupon_events (
    id SERIAL PRIMARY KEY,
    coupon_id TEXT NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'click', 'conversion')),
    
    -- Context information
    channel_id TEXT NOT NULL,
    content_type TEXT,
    language TEXT,
    
    -- Event metadata
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    
    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contextual placement tracking
CREATE TABLE IF NOT EXISTS coupon_placements (
    id SERIAL PRIMARY KEY,
    coupon_id TEXT NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    
    -- Placement context
    content_type TEXT NOT NULL,
    match_importance TEXT,
    channel_id TEXT NOT NULL,
    language TEXT NOT NULL,
    
    -- Placement decision
    placement_reason TEXT,
    confidence_score INTEGER,
    
    -- Performance
    was_shown BOOLEAN NOT NULL DEFAULT false,
    was_clicked BOOLEAN NOT NULL DEFAULT false,
    was_converted BOOLEAN NOT NULL DEFAULT false,
    
    -- Timing
    shown_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    converted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- A/B testing for coupons
CREATE TABLE IF NOT EXISTS coupon_ab_tests (
    id SERIAL PRIMARY KEY,
    test_name TEXT NOT NULL,
    coupon_a_id TEXT NOT NULL REFERENCES coupons(id),
    coupon_b_id TEXT NOT NULL REFERENCES coupons(id),
    
    -- Test configuration
    traffic_split INTEGER NOT NULL DEFAULT 50, -- Percentage for variant A
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    
    -- Test criteria
    target_channels TEXT[],
    target_languages TEXT[],
    target_content_types TEXT[],
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    winner_coupon_id TEXT REFERENCES coupons(id),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Coupon performance summary view
CREATE OR REPLACE VIEW coupon_performance AS
SELECT 
    c.id,
    c.title,
    c.type,
    c.brand_name,
    c.priority,
    c.is_active,
    
    -- Performance metrics
    c.impressions,
    c.clicks,
    c.conversions,
    
    -- Calculated metrics
    CASE 
        WHEN c.impressions > 0 THEN ROUND((c.clicks::DECIMAL / c.impressions) * 100, 2)
        ELSE 0 
    END as click_through_rate,
    
    CASE 
        WHEN c.clicks > 0 THEN ROUND((c.conversions::DECIMAL / c.clicks) * 100, 2)
        ELSE 0 
    END as conversion_rate,
    
    -- Time metrics
    c.valid_from,
    c.valid_until,
    DATE_PART('day', c.valid_until - NOW()) as days_remaining,
    
    -- Usage metrics
    c.current_usage,
    c.max_usage,
    CASE 
        WHEN c.max_usage IS NOT NULL THEN ROUND((c.current_usage::DECIMAL / c.max_usage) * 100, 2)
        ELSE NULL 
    END as usage_percentage,
    
    c.created_at,
    c.updated_at
FROM coupons c
WHERE c.is_active = true;

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_coupons_valid_dates ON coupons(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_coupons_type ON coupons(type);
CREATE INDEX IF NOT EXISTS idx_coupons_priority ON coupons(priority);
CREATE INDEX IF NOT EXISTS idx_coupons_created_by ON coupons(created_by);
CREATE INDEX IF NOT EXISTS idx_coupons_trigger_contexts ON coupons USING GIN(trigger_contexts);
CREATE INDEX IF NOT EXISTS idx_coupons_languages ON coupons USING GIN(languages);

CREATE INDEX IF NOT EXISTS idx_coupon_events_coupon_id ON coupon_events(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_events_type ON coupon_events(event_type);
CREATE INDEX IF NOT EXISTS idx_coupon_events_channel ON coupon_events(channel_id);
CREATE INDEX IF NOT EXISTS idx_coupon_events_created_at ON coupon_events(created_at);

CREATE INDEX IF NOT EXISTS idx_coupon_placements_coupon_id ON coupon_placements(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_placements_content_type ON coupon_placements(content_type);
CREATE INDEX IF NOT EXISTS idx_coupon_placements_channel ON coupon_placements(channel_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_coupons_updated_at 
    BEFORE UPDATE ON coupons 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupon_ab_tests_updated_at 
    BEFORE UPDATE ON coupon_ab_tests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security policies (if using Supabase)
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_ab_tests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own coupons
CREATE POLICY "Users can view their own coupons" ON coupons
    FOR SELECT USING (created_by = auth.uid()::text);

CREATE POLICY "Users can create coupons" ON coupons
    FOR INSERT WITH CHECK (created_by = auth.uid()::text);

CREATE POLICY "Users can update their own coupons" ON coupons
    FOR UPDATE USING (created_by = auth.uid()::text);

CREATE POLICY "Users can delete their own coupons" ON coupons
    FOR DELETE USING (created_by = auth.uid()::text);

-- Policy: Allow reading coupon events for analytics
CREATE POLICY "Allow reading coupon events" ON coupon_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM coupons 
            WHERE coupons.id = coupon_events.coupon_id 
            AND coupons.created_by = auth.uid()::text
        )
    );

-- Policy: Allow inserting coupon events (for tracking)
CREATE POLICY "Allow inserting coupon events" ON coupon_events
    FOR INSERT WITH CHECK (true); -- Events can be inserted by system

-- Function to get contextually relevant coupons
CREATE OR REPLACE FUNCTION get_contextual_coupons(
    p_content_type TEXT,
    p_language TEXT,
    p_channel_id TEXT,
    p_match_importance TEXT DEFAULT NULL
)
RETURNS TABLE (
    coupon_id TEXT,
    title TEXT,
    type TEXT,
    priority TEXT,
    relevance_score INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.title,
        c.type,
        c.priority,
        -- Calculate relevance score
        (
            CASE 
                WHEN c.priority = 'HIGH' THEN 40
                WHEN c.priority = 'MEDIUM' THEN 25
                ELSE 10
            END +
            CASE 
                WHEN p_content_type = ANY(
                    CASE 
                        WHEN 'after_betting_tips' = ANY(c.trigger_contexts) AND p_content_type = 'betting_tip' THEN ARRAY['betting_tip']
                        WHEN 'after_analysis' = ANY(c.trigger_contexts) AND p_content_type = 'analysis' THEN ARRAY['analysis']
                        WHEN 'after_news' = ANY(c.trigger_contexts) AND p_content_type = 'news' THEN ARRAY['news']
                        WHEN 'after_polls' = ANY(c.trigger_contexts) AND p_content_type = 'poll' THEN ARRAY['poll']
                        ELSE ARRAY[]::TEXT[]
                    END
                ) THEN 30
                ELSE 0
            END +
            CASE 
                WHEN p_language = ANY(c.languages) THEN 20
                ELSE -20
            END +
            CASE 
                WHEN c.impressions > 0 THEN 
                    LEAST(GREATEST((c.clicks::DECIMAL / c.impressions * 100 * 0.5)::INTEGER, 0), 15)
                ELSE 0
            END
        ) as relevance_score
    FROM coupons c
    WHERE 
        c.is_active = true
        AND c.valid_until > NOW()
        AND p_language = ANY(c.languages)
        AND (c.max_usage IS NULL OR c.current_usage < c.max_usage)
    ORDER BY relevance_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to track coupon performance
CREATE OR REPLACE FUNCTION track_coupon_event(
    p_coupon_id TEXT,
    p_event_type TEXT,
    p_channel_id TEXT,
    p_content_type TEXT DEFAULT NULL,
    p_language TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    coupon_exists BOOLEAN;
BEGIN
    -- Check if coupon exists and is active
    SELECT EXISTS(
        SELECT 1 FROM coupons 
        WHERE id = p_coupon_id AND is_active = true
    ) INTO coupon_exists;
    
    IF NOT coupon_exists THEN
        RETURN FALSE;
    END IF;
    
    -- Insert event record
    INSERT INTO coupon_events (
        coupon_id, 
        event_type, 
        channel_id, 
        content_type, 
        language
    ) VALUES (
        p_coupon_id, 
        p_event_type, 
        p_channel_id, 
        p_content_type, 
        p_language
    );
    
    -- Update coupon counters
    IF p_event_type = 'impression' THEN
        UPDATE coupons SET impressions = impressions + 1 WHERE id = p_coupon_id;
    ELSIF p_event_type = 'click' THEN
        UPDATE coupons SET clicks = clicks + 1 WHERE id = p_coupon_id;
    ELSIF p_event_type = 'conversion' THEN
        UPDATE coupons SET 
            conversions = conversions + 1,
            current_usage = current_usage + 1
        WHERE id = p_coupon_id;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Sample data (optional)
INSERT INTO coupons (
    id, title, description, offer_text, coupon_code, discount_percentage,
    valid_until, brand_name, affiliate_link, type, priority,
    trigger_contexts, languages, target_audience, created_by
) VALUES 
(
    'coupon_sample_betting_bonus',
    '50% Welcome Bonus',
    'Get 50% bonus on your first deposit up to $100',
    'Welcome bonus: 50% up to $100',
    'WELCOME50',
    50,
    NOW() + INTERVAL '30 days',
    'BetMaster',
    'https://betmaster.com/promo/welcome50',
    'betting_bonus',
    'HIGH',
    ARRAY['after_betting_tips', 'after_analysis'],
    ARRAY['en', 'am', 'sw'],
    ARRAY['new_users', 'football_fans'],
    'system'
),
(
    'coupon_sample_odds_boost',
    'Weekend Odds Boost',
    'Get enhanced odds on weekend football matches',
    'Boosted odds on Premier League matches',
    'WEEKEND',
    0,
    NOW() + INTERVAL '7 days',
    'SportsBoost',
    'https://sportsboost.com/weekend-special',
    'odds_boost',
    'MEDIUM',
    ARRAY['before_matches', 'weekend_specials'],
    ARRAY['en'],
    ARRAY['existing_users', 'football_fans'],
    'system'
);

-- Create comment on tables for documentation
COMMENT ON TABLE coupons IS 'Main table for storing promotional coupons with intelligent contextual triggering';
COMMENT ON TABLE coupon_events IS 'Tracks all coupon interaction events (impressions, clicks, conversions)';
COMMENT ON TABLE coupon_placements IS 'Records contextual placement decisions and outcomes';
COMMENT ON TABLE coupon_ab_tests IS 'Manages A/B testing of different coupon variations';

COMMENT ON COLUMN coupons.trigger_contexts IS 'Array of contexts when this coupon should be shown (e.g., after_betting_tips)';
COMMENT ON COLUMN coupons.trigger_conditions IS 'JSONB object with additional conditions (time, match importance, etc.)';
COMMENT ON COLUMN coupons.brand_colors IS 'JSONB object with primary and secondary brand colors for theming';