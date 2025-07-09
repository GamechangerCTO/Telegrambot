-- 🏆 TEAM MAPPINGS TABLE - Store dynamic team discoveries
-- Saves team IDs across multiple APIs to avoid repeated searches

CREATE TABLE IF NOT EXISTS team_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Team identification
  universal_name TEXT NOT NULL, -- Original search name
  normalized_name TEXT NOT NULL UNIQUE, -- Normalized for matching
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.0, -- Overall confidence score
  
  -- API mappings (JSON for flexibility)
  api_mappings JSONB NOT NULL DEFAULT '{}', -- {"football-data": {"id": "86", "name": "Real Madrid"}}
  aliases TEXT[] DEFAULT '{}', -- Alternative names for this team
  
  -- Metadata
  country TEXT,
  league TEXT,
  sport TEXT DEFAULT 'football',
  tier TEXT DEFAULT 'unknown', -- top, mid, lower
  
  -- Discovery tracking
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usage_count INTEGER DEFAULT 0,
  
  -- Quality assurance
  is_verified BOOLEAN DEFAULT FALSE, -- Manual verification flag
  notes TEXT, -- Admin notes
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_mappings_normalized_name ON team_mappings(normalized_name);
CREATE INDEX IF NOT EXISTS idx_team_mappings_universal_name ON team_mappings(universal_name);
CREATE INDEX IF NOT EXISTS idx_team_mappings_aliases ON team_mappings USING GIN(aliases);
CREATE INDEX IF NOT EXISTS idx_team_mappings_api_mappings ON team_mappings USING GIN(api_mappings);
CREATE INDEX IF NOT EXISTS idx_team_mappings_country ON team_mappings(country);
CREATE INDEX IF NOT EXISTS idx_team_mappings_league ON team_mappings(league);
CREATE INDEX IF NOT EXISTS idx_team_mappings_last_used ON team_mappings(last_used);
CREATE INDEX IF NOT EXISTS idx_team_mappings_usage_count ON team_mappings(usage_count);

-- RLS Policies (if needed)
ALTER TABLE team_mappings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to read team mappings
CREATE POLICY "team_mappings_read_all" ON team_mappings
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow service role to manage team mappings
CREATE POLICY "team_mappings_service_manage" ON team_mappings
  FOR ALL
  TO service_role
  USING (true);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_team_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER team_mappings_updated_at
  BEFORE UPDATE ON team_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_team_mappings_updated_at();

-- Sample data for testing
INSERT INTO team_mappings (
  universal_name, 
  normalized_name, 
  confidence,
  api_mappings,
  aliases,
  country,
  league,
  tier,
  is_verified
) VALUES 
(
  'Real Madrid',
  'real madrid',
  0.95,
  '{
    "football-data": {"id": "86", "name": "Real Madrid CF"},
    "api-football": {"id": "541", "name": "Real Madrid"},
    "apifootball": {"id": "188", "name": "Real Madrid"},
    "thesportsdb": {"id": "134577", "name": "Real Madrid"}
  }'::jsonb,
  ARRAY['Real Madrid CF', 'Real Madrid Club de Fútbol', 'Los Blancos', 'Madrid'],
  'Spain',
  'La Liga',
  'top',
  true
),
(
  'Barcelona',
  'barcelona',
  0.95,
  '{
    "football-data": {"id": "81", "name": "FC Barcelona"},
    "api-football": {"id": "529", "name": "Barcelona"},
    "thesportsdb": {"id": "133602", "name": "Barcelona"}
  }'::jsonb,
  ARRAY['FC Barcelona', 'Futbol Club Barcelona', 'Barca', 'Blaugrana'],
  'Spain',
  'La Liga',
  'top',
  true
),
(
  'Manchester City',
  'manchester city',
  0.93,
  '{
    "football-data": {"id": "65", "name": "Manchester City FC"},
    "api-football": {"id": "50", "name": "Manchester City"},
    "thesportsdb": {"id": "133613", "name": "Manchester City"}
  }'::jsonb,
  ARRAY['Manchester City FC', 'Man City', 'City', 'Citizens'],
  'England',
  'Premier League',
  'top',
  true
);

-- Comments for documentation
COMMENT ON TABLE team_mappings IS 'Stores discovered team mappings across multiple football APIs';
COMMENT ON COLUMN team_mappings.universal_name IS 'Original team name as searched';
COMMENT ON COLUMN team_mappings.normalized_name IS 'Normalized name for matching (lowercase, cleaned)';
COMMENT ON COLUMN team_mappings.api_mappings IS 'JSON object mapping API names to team IDs and names';
COMMENT ON COLUMN team_mappings.confidence IS 'Overall confidence score (0.0-1.0) for this mapping';
COMMENT ON COLUMN team_mappings.aliases IS 'Array of alternative names for this team';
COMMENT ON COLUMN team_mappings.usage_count IS 'Number of times this mapping has been used';
COMMENT ON COLUMN team_mappings.is_verified IS 'Whether this mapping has been manually verified';

-- Helper function to search teams
CREATE OR REPLACE FUNCTION search_team_mappings(search_term TEXT)
RETURNS SETOF team_mappings AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM team_mappings 
  WHERE 
    normalized_name = LOWER(TRIM(search_term))
    OR universal_name ILIKE '%' || search_term || '%'
    OR search_term = ANY(aliases)
  ORDER BY 
    CASE 
      WHEN normalized_name = LOWER(TRIM(search_term)) THEN 1
      WHEN universal_name ILIKE search_term || '%' THEN 2
      WHEN search_term = ANY(aliases) THEN 3
      ELSE 4
    END,
    confidence DESC,
    usage_count DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Function to update usage stats
CREATE OR REPLACE FUNCTION use_team_mapping(team_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE team_mappings 
  SET 
    usage_count = usage_count + 1,
    last_used = NOW()
  WHERE id = team_id;
END;
$$ LANGUAGE plpgsql; 