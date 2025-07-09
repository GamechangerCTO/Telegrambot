'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Language {
  code: string;
  name: string;
  native_name: string;
}

interface BotInfo {
  id: number;
  first_name: string;
  username: string;
  can_join_groups: boolean;
  can_read_all_group_messages: boolean;
  supports_inline_queries: boolean;
  is_bot: boolean;
}

interface ValidationResult {
  issues: string[];
  fixes: string[];
  autoFixes: string[];
  isFullyFunctional: boolean;
}

export default function CreateBotPage() {
  const [token, setToken] = useState('');
  const [botInfo, setBotInfo] = useState<BotInfo | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  
  // ✨ NEW: Channel Information Fields
  const [channelName, setChannelName] = useState('');
  const [channelUsername, setChannelUsername] = useState('');
  const [channelId, setChannelId] = useState('');
  const [channelType, setChannelType] = useState<'username' | 'id'>('username');
  
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(false);
  const [validatingBot, setValidatingBot] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    try {
      const { data: languagesData, error } = await supabase
        .from('languages')
        .select('*')
        .in('code', ['en', 'am', 'sw'])
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setLanguages(languagesData || []);
    } catch (error) {
      console.error('Error loading languages:', error);
    }
  };

  const validateAndFetchBotInfo = async () => {
    if (!token.trim()) {
      setErrors({ token: 'Bot token is required' });
      return;
    }

    if (!token.includes(':')) {
      setErrors({ token: 'Invalid bot token format' });
      return;
    }

    setValidatingToken(true);
    setErrors({});

    try {
      const response = await fetch('/api/telegram-bot-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ token: data.error || 'Failed to validate bot token' });
        setBotInfo(null);
        return;
      }

      setBotInfo(data.botInfo);
      setErrors({});
    } catch (error) {
      console.error('Error validating bot token:', error);
      setErrors({ token: 'Failed to validate bot token' });
      setBotInfo(null);
    } finally {
      setValidatingToken(false);
    }
  };

  const validateBotAfterCreation = async (botId: string) => {
    setValidatingBot(true);
    try {
      const response = await fetch('/api/bot-validation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ botId }),
      });

      const data = await response.json();

      if (response.ok) {
        setValidation(data.validation);
      }
    } catch (error) {
      console.error('Error validating bot after creation:', error);
    } finally {
      setValidatingBot(false);
    }
  };

  // ✨ NEW: Validate Channel Information
  const validateChannelInfo = () => {
    const newErrors: { [key: string]: string } = {};

    if (!channelName.trim()) {
      newErrors.channelName = 'Channel name is required';
    }

    if (channelType === 'username') {
      if (!channelUsername.trim()) {
        newErrors.channelUsername = 'Channel username is required';
      } else if (!channelUsername.startsWith('@')) {
        newErrors.channelUsername = 'Channel username must start with @';
      }
    } else if (channelType === 'id') {
      if (!channelId.trim()) {
        newErrors.channelId = 'Channel ID is required';
      } else if (!channelId.startsWith('-100')) {
        newErrors.channelId = 'Channel ID must start with -100';
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!botInfo) {
      setErrors({ general: 'Please validate the bot token first' });
      return;
    }

    // ✨ NEW: Validate channel information
    const channelErrors = validateChannelInfo();
    if (Object.keys(channelErrors).length > 0) {
      setErrors(channelErrors);
      return;
    }

    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get manager info
      const { data: manager } = await supabase
        .from('managers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!manager) throw new Error('Manager not found');

      // Check if bot username already exists
      if (botInfo.username) {
        const { data: existingBot } = await supabase
          .from('bots')
          .select('id')
          .eq('telegram_bot_username', botInfo.username)
          .single();

        if (existingBot) {
          setErrors({ general: 'This bot is already registered in the system' });
          return;
        }
      }

      // ✨ NEW: Create the bot and channel together
      const { data: botData, error: botError } = await supabase
        .from('bots')
        .insert({
          name: botInfo.first_name,
          telegram_bot_username: botInfo.username,
          telegram_token_encrypted: token,
          language_code: selectedLanguage,
          auto_post_enabled: true,
          max_posts_per_day: 10,
          is_active: true,
          manager_id: manager.id,
          total_posts_sent: 0
        })
        .select()
        .single();

      if (botError) throw botError;

      // ✨ NEW: Create the channel immediately
      const channelIdentifier = channelType === 'username' ? channelUsername : channelId;
      
      const { data: channelData, error: channelError } = await supabase
        .from('channels')
        .insert({
          name: channelName,
          telegram_channel_id: channelIdentifier,
          language: selectedLanguage,
          bot_id: botData.id,
          is_active: true,
          auto_post_enabled: true,
          max_posts_per_day: 10,
          total_posts_sent: 0
        })
        .select()
        .single();

      if (channelError) {
        // If channel creation fails, delete the bot
        await supabase.from('bots').delete().eq('id', botData.id);
        throw new Error(`Failed to create channel: ${channelError.message}`);
      }

      // Validate bot after creation
      await validateBotAfterCreation(botData.id);

      // ✨ NEW: Redirect to the specific bot page (not channels page)
      setTimeout(() => {
        router.push(`/dashboard/bots`);
      }, 2000);

    } catch (error: any) {
      console.error('Error creating bot and channel:', error);
      setErrors({ general: error.message || 'Failed to create bot and channel' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setToken('');
    setBotInfo(null);
    setValidation(null);
    setChannelName('');
    setChannelUsername('');
    setChannelId('');
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link
                href="/dashboard/bots"
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                Bots
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-900 md:ml-2">
                  Create Bot & Channel
                </span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Bot & Channel</h1>
          <p className="text-gray-600">
            🚀 One bot manages one channel! Enter your bot information and the channel it will manage.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-800">{errors.general}</div>
            </div>
          )}

          {/* Bot Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              🤖 Bot Information
            </h2>

            {/* Bot Token Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telegram Bot Token *
              </label>
              <div className="flex gap-3">
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijk"
                  className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.token ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={validateAndFetchBotInfo}
                  disabled={validatingToken || !token.trim()}
                  className={`px-4 py-2 bg-blue-600 text-white rounded-lg font-medium transition-colors ${
                    validatingToken || !token.trim()
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-blue-700'
                  }`}
                >
                  {validatingToken ? 'Validating...' : 'Validate Token'}
                </button>
              </div>
              {errors.token && <p className="mt-1 text-sm text-red-600">{errors.token}</p>}
              <p className="mt-1 text-xs text-gray-500">Get this from @BotFather on Telegram</p>
            </div>

            {/* Bot Info Display */}
            {botInfo && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-lg font-medium text-green-800 mb-3">✅ Bot Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Name:</span>
                    <span className="ml-2 text-gray-900">{botInfo.first_name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Username:</span>
                    <span className="ml-2 text-gray-900">@{botInfo.username}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">ID:</span>
                    <span className="ml-2 text-gray-900">{botInfo.id}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Can join groups:</span>
                    <span className="ml-2 text-gray-900">{botInfo.can_join_groups ? 'Yes' : 'No'}</span>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={resetForm}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-800"
                >
                  Change token
                </button>
              </div>
            )}

            {/* Language Selection */}
            {botInfo && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Language *
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.native_name} ({lang.name})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* ✨ NEW: Channel Section */}
          {botInfo && (
            <div className="mb-8 border-t border-gray-200 pt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                📺 Channel Information
              </h2>

              {/* Channel Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Channel Name *
                </label>
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="e.g., Sports News Channel"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.channelName ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.channelName && <p className="mt-1 text-sm text-red-600">{errors.channelName}</p>}
              </div>

              {/* Channel Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Channel Identification Type *
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="username"
                      checked={channelType === 'username'}
                      onChange={(e) => setChannelType(e.target.value as 'username' | 'id')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Username (@channel)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="id"
                      checked={channelType === 'id'}
                      onChange={(e) => setChannelType(e.target.value as 'username' | 'id')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Channel ID (-100xxxxx)</span>
                  </label>
                </div>
              </div>

              {/* Channel Username */}
              {channelType === 'username' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Channel Username *
                  </label>
                  <input
                    type="text"
                    value={channelUsername}
                    onChange={(e) => setChannelUsername(e.target.value)}
                    placeholder="@yourchannel"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.channelUsername ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.channelUsername && <p className="mt-1 text-sm text-red-600">{errors.channelUsername}</p>}
                  <p className="mt-1 text-xs text-gray-500">Must start with @ (e.g., @mysportschannel)</p>
                </div>
              )}

              {/* Channel ID */}
              {channelType === 'id' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Channel ID *
                  </label>
                  <input
                    type="text"
                    value={channelId}
                    onChange={(e) => setChannelId(e.target.value)}
                    placeholder="-1001234567890"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.channelId ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.channelId && <p className="mt-1 text-sm text-red-600">{errors.channelId}</p>}
                  <p className="mt-1 text-xs text-gray-500">Must start with -100 (e.g., -1001234567890)</p>
                </div>
              )}

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Important:</strong> Make sure your bot is already added as an admin to this channel with posting permissions.
                </p>
              </div>
            </div>
          )}

          {/* Validation Results */}
          {validatingBot && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-blue-800">Validating bot configuration...</span>
              </div>
            </div>
          )}

          {validation && (
            <div className="mb-6">
              {validation.isFullyFunctional ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="text-lg font-medium text-green-800 mb-2">🎉 Bot & Channel Successfully Created!</h3>
                  <div className="text-green-700">
                    <p className="mb-2">Your bot and channel are fully configured and ready to use:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {validation.fixes.map((fix, index) => (
                        <li key={index} className="text-sm">✅ {fix}</li>
                      ))}
                    </ul>
                    {validation.autoFixes.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium">Auto-fixes applied:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {validation.autoFixes.map((fix, index) => (
                            <li key={index} className="text-sm">🔧 {fix}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p className="mt-3 text-sm">Redirecting to bots dashboard...</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="text-lg font-medium text-yellow-800 mb-2">⚠️ Bot Created with Issues</h3>
                  <div className="text-yellow-700">
                    <p className="mb-2">Your bot and channel were created but have some issues that need attention:</p>
                    <ul className="list-disc list-inside space-y-1 mb-3">
                      {validation.issues.map((issue, index) => (
                        <li key={index} className="text-sm">❌ {issue}</li>
                      ))}
                    </ul>
                    {validation.fixes.length > 0 && (
                      <div className="mb-3">
                        <p className="font-medium">Working correctly:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {validation.fixes.map((fix, index) => (
                            <li key={index} className="text-sm">✅ {fix}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <p className="text-sm">You can fix these issues later from the bot management page.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Link
              href="/dashboard/bots"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !botInfo}
              className={`px-6 py-2 bg-blue-600 text-white rounded-lg font-medium transition-colors ${
                loading || !botInfo
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-blue-700'
              }`}
            >
              {loading ? 'Creating Bot & Channel...' : 'Create Bot & Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 