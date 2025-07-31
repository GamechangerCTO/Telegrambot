-- 📊 OpenAI Usage Tracking Table
-- Track all OpenAI API calls for cost monitoring and duplicate prevention

-- Create openai_usage_logs table
CREATE TABLE IF NOT EXISTS openai_usage_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  call_type text NOT NULL, -- 'news-generation', 'betting-analysis', etc.
  language text NOT NULL, -- 'en', 'am', 'sw', 'fr', 'ar'
  content_title text, -- Title or description of content
  timestamp timestamptz DEFAULT now() NOT NULL,
  estimated_tokens integer DEFAULT 0, -- Estimated token usage
  actual_tokens integer, -- Actual tokens used (if available)
  status text DEFAULT 'initiated', -- 'initiated', 'completed', 'failed'
  cost_usd decimal(10,6), -- Estimated cost in USD
  model_used text DEFAULT 'gpt-4o-mini', -- Model used for the call
  response_time_ms integer, -- Response time in milliseconds
  error_message text, -- Error message if failed
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_openai_usage_timestamp ON openai_usage_logs (timestamp);
CREATE INDEX IF NOT EXISTS idx_openai_usage_call_type ON openai_usage_logs (call_type);
CREATE INDEX IF NOT EXISTS idx_openai_usage_language ON openai_usage_logs (language);
CREATE INDEX IF NOT EXISTS idx_openai_usage_status ON openai_usage_logs (status);
CREATE INDEX IF NOT EXISTS idx_openai_usage_daily ON openai_usage_logs (date_trunc('day', timestamp));

-- Enable RLS
ALTER TABLE openai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON openai_usage_logs
  FOR ALL USING (true);

-- Create a view for daily usage statistics
CREATE OR REPLACE VIEW daily_openai_usage AS
SELECT 
  date_trunc('day', timestamp) as usage_date,
  call_type,
  language,
  COUNT(*) as total_calls,
  SUM(estimated_tokens) as total_estimated_tokens,
  SUM(actual_tokens) as total_actual_tokens,
  SUM(cost_usd) as total_cost_usd,
  COUNT(*) FILTER (WHERE status = 'completed') as successful_calls,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_calls,
  AVG(response_time_ms) as avg_response_time_ms
FROM openai_usage_logs
GROUP BY date_trunc('day', timestamp), call_type, language
ORDER BY usage_date DESC, call_type, language;

-- Create function to get hourly usage stats
CREATE OR REPLACE FUNCTION get_openai_hourly_usage(hours_back integer DEFAULT 24)
RETURNS TABLE (
  hour_period timestamptz,
  total_calls bigint,
  estimated_tokens bigint,
  successful_calls bigint,
  failed_calls bigint
) 
LANGUAGE sql
AS $$
  SELECT 
    date_trunc('hour', timestamp) as hour_period,
    COUNT(*) as total_calls,
    SUM(estimated_tokens) as estimated_tokens,
    COUNT(*) FILTER (WHERE status = 'completed') as successful_calls,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_calls
  FROM openai_usage_logs
  WHERE timestamp >= now() - interval '1 hour' * hours_back
  GROUP BY date_trunc('hour', timestamp)
  ORDER BY hour_period DESC;
$$;

-- Insert initial data for testing (optional)
INSERT INTO openai_usage_logs (call_type, language, content_title, estimated_tokens, status, model_used) VALUES
('news-generation', 'am', 'Test Amharic news generation', 150, 'completed', 'gpt-4o-mini'),
('news-generation', 'en', 'Test English news generation', 120, 'completed', 'gpt-4o-mini'),
('betting-analysis', 'sw', 'Test Swahili betting analysis', 200, 'completed', 'gpt-4o-mini');

-- Grant permissions
GRANT ALL ON openai_usage_logs TO anon, authenticated;
GRANT ALL ON daily_openai_usage TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_openai_hourly_usage TO anon, authenticated;

-- Success message
SELECT 'OpenAI usage tracking setup completed successfully! 📊' as message;