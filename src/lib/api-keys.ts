import { supabase } from './supabase';
import CryptoJS from 'crypto-js';
import OpenAI from 'openai';

interface SportsAPI {
  id: string;
  name: string;
  api_key: string;
  api_url: string;
  is_active: boolean;
  priority: number;
  rate_limit_per_hour: number;
  daily_calls_used: number;
  daily_calls_limit: number;
  last_called_at?: string;
  created_at?: string;
}

interface ApiKeys {
  sports: Record<string, SportsAPI>;
  openai: string;
  claude: string;
}

// Secret key for decryption - in production this should be from environment
const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET || 'fallback-secret-key';

/**
 * Decrypt encrypted API key from database
 */
function decryptApiKey(encryptedKey: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedKey, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Failed to decrypt API key:', error);
    return '';
  }
}

/**
 * Extract plain API key from encrypted format
 * Format: "api_key:encrypted_data"
 */
function extractApiKey(apiKeyData: string): string {
  if (!apiKeyData) return '';
  
  // Split by first colon to separate api_key from encrypted_data
  const colonIndex = apiKeyData.indexOf(':');
  if (colonIndex === -1) return apiKeyData; // Not encrypted format
  
  return apiKeyData.substring(0, colonIndex);
}

/**
 * Get sports API keys from environment first, then database fallback
 */
export async function getSportsApiKeys(): Promise<Record<string, SportsAPI>> {
  try {
    let result: Record<string, SportsAPI> = {};

    // First, try environment variables (priority)
    const envMappings = {
      'football-data-org': {
        key: process.env.FOOTBALL_DATA_API_KEY,
        url: 'https://api.football-data.org/v4'
      },
      'api-football': {
        key: process.env.API_FOOTBALL_KEY,
        url: 'https://v3.football.api-sports.io'
      },
      'apifootball': {
        key: process.env.APIFOOTBALL_KEY,
        url: 'https://apiv3.apifootball.com'
      },
      'soccersapi': {
        key: process.env.SOCCERSAPI_TOKEN,
        url: 'https://api.soccersapi.com/v2.2'
      }
    };

    // Add environment APIs first (highest priority)
    Object.entries(envMappings).forEach(([name, config]) => {
      if (config.key) {
        result[name] = {
          id: name,
          name,
          api_key: config.key,
          api_url: config.url,
          is_active: true,
          priority: 1, // High priority for environment keys
          rate_limit_per_hour: 100,
          daily_calls_used: 0,
          daily_calls_limit: 1000
        };
        console.log(`✅ Added ${name} from environment (key length: ${config.key.length})`);
      } else {
        console.log(`❌ No environment key for ${name}`);
      }
    });

    // Add free APIs that don't require keys
    const freeApis = {
      'thesportsdb': {
        id: 'thesportsdb',
        name: 'thesportsdb',
        api_key: '123', // Free User key as requested
        api_url: 'https://www.thesportsdb.com/api/v1/json/123',
        is_active: true,
        priority: 2, // Higher priority for reliable free source
        rate_limit_per_hour: 1000,
        daily_calls_used: 0,
        daily_calls_limit: 5000
      }
    };

    Object.values(freeApis).forEach(api => {
      result[api.name] = api;
      console.log(`✅ Added free API: ${api.name}`);
    });

    // Then try database (as fallback for any missing keys)
    try {
      const { data, error } = await supabase
        .from('sports_apis')
        .select('*')
        .eq('is_active', true)
        .order('priority');

      if (!error && data) {
        data.forEach(api => {
          const extractedKey = extractApiKey(api.api_key || '');
          // Only use database key if no environment key exists
          if (extractedKey && !result[api.name]) {
            result[api.name] = {
              ...api,
              api_key: extractedKey,
              priority: api.priority + 100 // Lower priority than environment
            };
            console.log(`✅ Added ${api.name} from database (fallback)`);
          } else if (result[api.name]) {
            console.log(`🔄 Skipped ${api.name} from database (environment key takes priority)`);
          }
        });
      }
    } catch (dbError) {
      console.log('⚠️ Database fallback failed:', dbError);
    }
    
    console.log('🔑 Final API keys available:', Object.keys(result));
    console.log('📊 Environment keys used:', Object.values(result).filter(api => api.priority < 100).length);
    console.log('📊 Database keys used:', Object.values(result).filter(api => api.priority >= 100).length);

    return result;
  } catch (error) {
    console.error('Failed to fetch sports API keys:', error);
    
    // Emergency fallback - environment only
    const envResult: Record<string, SportsAPI> = {};
    
    if (process.env.FOOTBALL_DATA_API_KEY) {
      envResult['football-data-org'] = {
        id: 'football-data-org',
        name: 'football-data-org',
        api_key: process.env.FOOTBALL_DATA_API_KEY,
        api_url: 'https://api.football-data.org/v4',
        is_active: true,
        priority: 1,
        rate_limit_per_hour: 100,
        daily_calls_used: 0,
        daily_calls_limit: 1000
      };
    }
    
    if (process.env.API_FOOTBALL_KEY) {
      envResult['api-football'] = {
        id: 'api-football',
        name: 'api-football',
        api_key: process.env.API_FOOTBALL_KEY,
        api_url: 'https://v3.football.api-sports.io',
        is_active: true,
        priority: 2,
        rate_limit_per_hour: 100,
        daily_calls_used: 0,
        daily_calls_limit: 1000
      };
    }
    
    return envResult;
  }
}

/**
 * Get setting value from database (with optional decryption)
 */
export async function getSetting(key: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('value, is_secret')
      .eq('key', key)
      .single();

    if (error) throw error;
    if (!data) return '';

    if (data.is_secret && data.value) {
      return decryptApiKey(data.value);
    }

    return data.value || '';
  } catch (error) {
    console.error(`Failed to fetch setting ${key}:`, error);
    return '';
  }
}

/**
 * Get OpenAI API key from database, fallback to environment
 */
export async function getOpenAiApiKey(): Promise<string> {
  try {
    const dbKey = await getSetting('openai_api_key');
    if (dbKey) {
      console.log('✅ Using OpenAI key from database');
      return dbKey;
    }
    
    // Fallback to environment
    const envKey = process.env.OPENAI_API_KEY;
    if (envKey) {
      console.log('✅ Using OpenAI key from environment (fallback)');
      return envKey;
    }
    
    console.log('❌ No OpenAI key found in database or environment');
    return '';
  } catch (error) {
    console.error('Error fetching OpenAI API key:', error);
    // Fallback to environment on error
    const envKey = process.env.OPENAI_API_KEY;
    if (envKey) {
      console.log('✅ Using OpenAI key from environment (error fallback)');
      return envKey;
    }
    return '';
  }
}

/**
 * Get Claude API key from database, fallback to environment
 */
export async function getClaudeApiKey(): Promise<string> {
  try {
    const dbKey = await getSetting('claude_api_key');
    if (dbKey) {
      console.log('✅ Using Claude key from database');
      return dbKey;
    }
    
    // Fallback to environment
    const envKey = process.env.CLAUDE_API_KEY;
    if (envKey) {
      console.log('✅ Using Claude key from environment (fallback)');
      return envKey;
    }
    
    console.log('❌ No Claude key found in database or environment');
    return '';
  } catch (error) {
    console.error('Error fetching Claude API key:', error);
    // Fallback to environment on error
    const envKey = process.env.CLAUDE_API_KEY;
    if (envKey) {
      console.log('✅ Using Claude key from environment (error fallback)');
      return envKey;
    }
    return '';
  }
}

/**
 * Get all API keys needed for the application
 */
export async function getAllApiKeys(): Promise<ApiKeys> {
  try {
    const [sportsApis, openaiKey, claudeKey] = await Promise.all([
      getSportsApiKeys(),
      getOpenAiApiKey(),
      getClaudeApiKey()
    ]);

    return {
      sports: sportsApis,
      openai: openaiKey,
      claude: claudeKey
    };
  } catch (error) {
    console.error('Failed to fetch all API keys:', error);
    return {
      sports: {},
      openai: '',
      claude: ''
    };
  }
}

/**
 * Get primary football API (highest priority active API)
 */
export async function getPrimaryFootballAPI(): Promise<{ key: string; url: string; name: string }> {
  try {
    const { data, error } = await supabase
      .from('sports_apis')
      .select('*')
      .eq('is_active', true)
      .order('priority')
      .limit(1)
      .single();

    if (error || !data) {
      return { key: '', url: '', name: '' };
  }
  
  return {
      key: extractApiKey(data.api_key || ''),
      url: data.api_url || '',
      name: data.name || ''
    };
  } catch (error) {
    console.error('Failed to fetch primary football API:', error);
    return { key: '', url: '', name: '' };
  }
}

/**
 * Update API call count
 */
export async function updateAPICallCount(apiName: string, callsUsed: number): Promise<void> {
  try {
  await supabase
    .from('sports_apis')
    .update({ 
      daily_calls_used: callsUsed,
      last_called_at: new Date().toISOString()
    })
      .eq('name', apiName);
  } catch (error) {
    console.error(`Failed to update API call count for ${apiName}:`, error);
  }
}

/**
 * Check if API limit is reached
 */
export async function isAPILimitReached(apiName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('sports_apis')
      .select('daily_calls_used, daily_calls_limit')
      .eq('name', apiName)
      .single();

    if (error || !data) return true;

    return data.daily_calls_used >= data.daily_calls_limit;
  } catch (error) {
    console.error(`Failed to check API limit for ${apiName}:`, error);
    return true;
  }
}

/**
 * Get active sports APIs (for specific API name queries)
 */
export async function getActiveSportsAPIs(): Promise<SportsAPI[]> {
  try {
    const { data, error } = await supabase
      .from('sports_apis')
      .select('*')
      .eq('is_active', true)
      .order('priority');

    if (error || !data) return [];

    return data.map(api => ({
      ...api,
      api_key: extractApiKey(api.api_key || '')
    }));
  } catch (error) {
    console.error('Failed to fetch active sports APIs:', error);
    return [];
  }
}

/**
 * Get specific API key by service name (generic getter)
 */
export async function getAPIKey(serviceName: string): Promise<string> {
  try {
    // First try from sports APIs
    if (serviceName.toLowerCase().includes('football') || 
        serviceName.toLowerCase().includes('soccer') ||
        serviceName.toLowerCase().includes('sport')) {
      const sportsApis = await getSportsApiKeys();
      const api = sportsApis[serviceName];
      if (api) return api.api_key;
    }

    // Then try from settings
    const settingKey = await getSetting(`${serviceName}_api_key`);
    if (settingKey) return settingKey;

    // Environment fallback
    const envKey = process.env[`${serviceName.toUpperCase()}_API_KEY`] || 
                   process.env[`${serviceName.toUpperCase()}_KEY`];
    if (envKey) return envKey;

    console.log(`❌ No API key found for service: ${serviceName}`);
    return '';
  } catch (error) {
    console.error(`Failed to get API key for ${serviceName}:`, error);
    return '';
  }
}

/**
 * Get configured OpenAI client
 */
export let openai: OpenAI | null = null;

export async function getOpenAIClient(): Promise<OpenAI | null> {
  try {
    if (openai) return openai;
    
    const apiKey = await getOpenAiApiKey();
    if (!apiKey) {
      console.log('❌ No OpenAI API key available');
      return null;
    }
    
    openai = new OpenAI({
      apiKey: apiKey
    });
    
    console.log('✅ OpenAI client initialized');
    return openai;
  } catch (error) {
    console.error('Failed to initialize OpenAI client:', error);
    return null;
  }
} 