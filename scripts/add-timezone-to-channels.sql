-- 🌍 Add timezone support to channels table
-- This allows each channel to have its own timezone setting

-- Add timezone column to channels table
ALTER TABLE channels 
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Africa/Addis_Ababa';

-- Add comment to explain the column
COMMENT ON COLUMN channels.timezone IS 'Timezone for this channel (e.g., Africa/Addis_Ababa, Asia/Jerusalem, Europe/London)';

-- Update existing channels with appropriate timezones
-- For now, set all to Ethiopia timezone since that's what we're fixing
UPDATE channels 
SET timezone = 'Africa/Addis_Ababa' 
WHERE timezone IS NULL;

-- You can manually update specific channels later like this:
-- UPDATE channels SET timezone = 'Asia/Jerusalem' WHERE name = 'IsraeliChannel';
-- UPDATE channels SET timezone = 'Europe/London' WHERE name = 'UKChannel';

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_channels_timezone ON channels(timezone);

-- Show current channels and their timezones
SELECT id, name, language, timezone, telegram_channel_id 
FROM channels 
WHERE is_active = true 
ORDER BY name;