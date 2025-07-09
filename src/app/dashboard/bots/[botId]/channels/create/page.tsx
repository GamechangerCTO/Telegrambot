'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Bot {
  id: string;
  name: string;
  telegram_bot_username?: string;
  telegram_bot_token?: string;
  language_code: string;
  is_active: boolean;
}

interface Language {
  code: string;
  name: string;
  native_name: string;
}

const CONTENT_TYPES = [
  { value: 'news', label: 'News Articles' },
  { value: 'polls', label: 'Polls & Surveys' },
  { value: 'images', label: 'Images & Media' },
  { value: 'coupons', label: 'Betting Coupons' },
  { value: 'live_scores', label: 'Live Scores' },
  { value: 'betting_tips', label: 'Betting Tips' },
  { value: 'daily_summary', label: 'Daily Summary' },
  { value: 'match_analysis', label: 'Match Analysis' }
];

export default function CreateChannelPage() {
  const [bot, setBot] = useState<Bot | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    telegram_channel_username: '',
    description: '',
    language: 'en',
    content_types: ['news'] as string[],
    auto_post: true,
    max_posts_per_day: 5,
    post_frequency_hours: 6,
    affiliate_code: '',
    is_active: true
  });

  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const botId = params.botId as string;

  useEffect(() => {
    loadData();
  }, [botId]);

  const loadData = async () => {
    try {
      let botData = null;
      
      // Try to load bot details
      try {
        const { data, error } = await supabase
          .from('bots')
          .select('*')
          .eq('id', botId)
          .single();

        if (error) {
          console.warn('Bots table may not exist:', error);
        } else {
          botData = data;
        }
      } catch (err) {
        console.warn('Could not access bots table:', err);
      }

      // If no bot found, create a fallback bot object
      if (!botData) {
        botData = {
          id: botId,
          name: 'Test Bot',
          telegram_bot_username: 'test_bot',
          language_code: 'en',
          is_active: true,
          description: 'A test bot for development',
          created_at: new Date().toISOString()
        };
        console.log('Using fallback bot data for development');
      }

      setBot(botData);

      // Load languages (essential for the form)
      try {
        const { data: languagesData, error: languagesError } = await supabase
          .from('languages')
          .select('*')
          .in('code', ['en', 'am', 'sw'])
          .eq('is_active', true)
          .order('name');

        if (languagesError) {
          console.warn('Languages error:', languagesError);
          throw languagesError;
        } else {
          setLanguages(languagesData || []);
        }
      } catch (err) {
        console.warn('Languages table not available, using defaults');
        // Set default languages if table doesn't exist
        setLanguages([
          { code: 'en', name: 'English', native_name: 'English' },
          { code: 'am', name: 'Amharic', native_name: 'አማርኛ' },
          { code: 'sw', name: 'Swahili', native_name: 'Kiswahili' }
        ]);
      }

      // Set default language to bot's language
      setFormData(prev => ({
        ...prev,
        language: botData.language_code
      }));
    } catch (error) {
      console.error('Error loading data:', error);
      // Don't let the error break the component completely
      setBot({
        id: botId,
        name: 'Unknown Bot',
        telegram_bot_username: 'unknown_bot',
        language_code: 'en',
        is_active: true
      });
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleContentTypeChange = (contentType: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        content_types: [...prev.content_types, contentType]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        content_types: prev.content_types.filter(type => type !== contentType)
      }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Channel name is required';
    }

    if (!formData.telegram_channel_username.trim()) {
      newErrors.telegram_channel_username = 'Telegram channel username is required';
    } else if (formData.telegram_channel_username.startsWith('@')) {
      newErrors.telegram_channel_username = 'Do not include @ symbol';
    }

    if (formData.content_types.length === 0) {
      newErrors.content_types = 'Select at least one content type';
    }

    if (formData.auto_post) {
      if (!formData.max_posts_per_day || formData.max_posts_per_day < 1 || formData.max_posts_per_day > 50) {
        newErrors.max_posts_per_day = 'Max posts per day must be between 1 and 50';
      }

      if (!formData.post_frequency_hours || formData.post_frequency_hours < 1 || formData.post_frequency_hours > 24) {
        newErrors.post_frequency_hours = 'Post frequency must be between 1 and 24 hours';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data: manager } = await supabase
        .from('managers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!manager) {
        throw new Error('Manager not found');
      }

      // Create channel
      const { data, error } = await supabase
        .from('channels')
        .insert({
          bot_id: botId,
          name: formData.name,
          telegram_channel_username: formData.telegram_channel_username,
          description: formData.description,
          language: formData.language,
          content_types: formData.content_types,
          auto_post: formData.auto_post,
          max_posts_per_day: formData.max_posts_per_day,
          post_frequency_hours: formData.post_frequency_hours,
          affiliate_code: formData.affiliate_code || null,
          is_active: formData.is_active,
          member_count: 0,
          total_posts_sent: 0
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Redirect to channel page or channels list
      router.push(`/dashboard/bots/${botId}/channels`);
    } catch (error: any) {
      console.error('Error creating channel:', error);
      setErrors({ general: error.message || 'Failed to create channel. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const getLanguageDisplay = (code: string) => {
    const language = languages.find(l => l.code === code);
    return language ? language.native_name : code;
  };

  if (!bot) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
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
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                  {bot.name}
                </span>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
                <Link
                  href={`/dashboard/bots/${botId}/channels`}
                  className="ml-1 text-sm font-medium text-gray-500 hover:text-blue-600 md:ml-2"
                >
                  Channels
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-900 md:ml-2">
                  Connect Channel
                </span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Connect Telegram Channel to {bot.name}</h1>
          <div className="flex items-center space-x-2">
            {bot.telegram_bot_username && (
              <span className="text-sm text-blue-600">@{bot.telegram_bot_username}</span>
            )}
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              {getLanguageDisplay(bot.language_code)}
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">📋 How to connect your Telegram channel:</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 mb-4">
            <li>Create a Telegram channel or use an existing one</li>
            <li>Add your bot <strong>@{bot?.telegram_bot_username || 'your_bot'}</strong> as an administrator to the channel</li>
            <li>Give the bot permission to post messages and edit channel info</li>
            <li>Enter the channel username below to connect it to your bot</li>
          </ol>
          <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
            <p className="text-yellow-800 text-sm">
              <strong>⚠️ Important:</strong> The bot must be added as an admin to your channel before connecting. 
              Without admin permissions, the bot cannot post content to your channel.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-800">{errors.general}</div>
            </div>
          )}

          <div className="space-y-8">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Channel Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Premier League News"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telegram Channel Username *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">@</span>
                    <input
                      type="text"
                      value={formData.telegram_channel_username}
                      onChange={(e) => handleInputChange('telegram_channel_username', e.target.value)}
                      placeholder="existing_channel_name"
                      className={`w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.telegram_channel_username ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Enter the username of your existing Telegram channel (the bot must be added as admin)
                  </p>
                  {errors.telegram_channel_username && <p className="mt-1 text-sm text-red-600">{errors.telegram_channel_username}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {languages.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.native_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe what this channel will post about..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Content Types */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Content Types *</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {CONTENT_TYPES.map(type => (
                  <div key={type.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.content_types.includes(type.value)}
                      onChange={(e) => handleContentTypeChange(type.value, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      {type.label}
                    </label>
                  </div>
                ))}
              </div>
              {errors.content_types && <p className="mt-1 text-sm text-red-600">{errors.content_types}</p>}
            </div>

            {/* Posting Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Posting Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      checked={formData.auto_post}
                      onChange={(e) => handleInputChange('auto_post', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Enable automatic posting
                    </label>
                  </div>
                </div>

                {formData.auto_post && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Posts Per Day
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={formData.max_posts_per_day}
                        onChange={(e) => handleInputChange('max_posts_per_day', parseInt(e.target.value))}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.max_posts_per_day ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.max_posts_per_day && <p className="mt-1 text-sm text-red-600">{errors.max_posts_per_day}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Post Frequency (hours)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="24"
                        value={formData.post_frequency_hours}
                        onChange={(e) => handleInputChange('post_frequency_hours', parseInt(e.target.value))}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.post_frequency_hours ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.post_frequency_hours && <p className="mt-1 text-sm text-red-600">{errors.post_frequency_hours}</p>}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Affiliate Code */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Affiliate Settings (Optional)</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Affiliate Code
                </label>
                <input
                  type="text"
                  value={formData.affiliate_code}
                  onChange={(e) => handleInputChange('affiliate_code', e.target.value)}
                  placeholder="e.g., FOOTBALL2024"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  This code will be included in betting coupons and promotional content
                </p>
              </div>
            </div>

            {/* Smart Content Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Smart Content Selection</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      The system will automatically select relevant leagues, teams, and matches based on your content preferences and channel language. 
                      This ensures your channel receives the most appropriate content without manual configuration.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <Link
              href={`/dashboard/bots/${botId}/channels`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Connecting...' : 'Connect Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 