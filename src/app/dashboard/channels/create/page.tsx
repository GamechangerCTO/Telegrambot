'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Language {
  code: string;
  name: string;
  native_name: string;
}

interface ChannelFormData {
  name: string;
  telegram_channel_id: string;
  telegram_channel_username: string;
  description: string;
  language: string;
  content_types: {
    news: boolean;
    polls: boolean;
    images: boolean;
    coupons: boolean;
    live_scores: boolean;
    betting_tips: boolean;
    daily_summary: boolean;
    match_analysis: boolean;
  };
  affiliate_code: string;
  auto_post: boolean;
  post_frequency_hours: number;
  preferred_post_times: string[];
}

export default function CreateChannelPage() {
  const [formData, setFormData] = useState<ChannelFormData>({
    name: '',
    telegram_channel_id: '',
    telegram_channel_username: '',
    description: '',
    language: 'en',
    content_types: {
      news: true,
      polls: false,
      images: false,
      coupons: true,
      live_scores: true,
      betting_tips: true,
      daily_summary: true,
      match_analysis: true,
    },
    affiliate_code: '',
    auto_post: true,
    post_frequency_hours: 6,
    preferred_post_times: ['09:00', '15:00', '21:00'],
  });

  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load languages (English, Amharic, Swahili)
      const { data: languagesData, error: languagesError } = await supabase
        .from('languages')
        .select('*')
        .in('code', ['en', 'am', 'sw'])
        .eq('is_active', true)
        .order('name');

      if (languagesError) throw languagesError;

      setLanguages(languagesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Get current user's bot
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: manager } = await supabase
        .from('managers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!manager) throw new Error('Manager not found');

      const { data: bot } = await supabase
        .from('bots')
        .select('id')
        .eq('manager_id', manager.id)
        .single();

      if (!bot) throw new Error('Bot not found');

      // Create channel
      const { error } = await supabase
        .from('channels')
        .insert({
          bot_id: bot.id,
          name: formData.name,
          telegram_channel_id: formData.telegram_channel_id,
          telegram_channel_username: formData.telegram_channel_username,
          description: formData.description,
          language: formData.language,
          content_types: formData.content_types,
          affiliate_code: formData.affiliate_code || null,
          auto_post: formData.auto_post,
          post_frequency_hours: formData.post_frequency_hours,
          preferred_post_times: formData.preferred_post_times,
        });

      if (error) throw error;

      router.push('/dashboard/channels');
    } catch (error) {
      console.error('Error creating channel:', error);
      alert('Error creating channel. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleContentTypeToggle = (type: keyof typeof formData.content_types) => {
    setFormData(prev => ({
      ...prev,
      content_types: {
        ...prev.content_types,
        [type]: !prev.content_types[type],
      },
    }));
  };

  const getLanguageDisplay = (code: string) => {
    const language = languages.find(l => l.code === code);
    return language ? language.native_name : code;
  };

  // Filter functions for search
  const filteredLeagues = [];
  const filteredTeams = [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Channel</h1>
          <p className="text-gray-600">
            Set up a new Telegram channel for your bot to post content automatically.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Channel Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Premier League News"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language *
                </label>
                <select
                  required
                  value={formData.language}
                  onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.native_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telegram Channel ID *
                </label>
                <input
                  type="text"
                  required
                  value={formData.telegram_channel_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, telegram_channel_id: e.target.value }))}
                  placeholder="e.g., -1001234567890"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get this from @userinfobot in your Telegram channel
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Channel Username
                </label>
                <input
                  type="text"
                  value={formData.telegram_channel_username}
                  onChange={(e) => setFormData(prev => ({ ...prev, telegram_channel_username: e.target.value }))}
                  placeholder="e.g., footballnewsethiopia"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this channel's purpose and audience..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Content Types */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Content Types</h2>
            <p className="text-gray-600 mb-4">
              Choose what types of content should be posted to this channel. The system will automatically select relevant leagues and teams based on your content preferences.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(formData.content_types).map(([type, enabled]) => (
                <label
                  key={type}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                    enabled
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => handleContentTypeToggle(type as keyof typeof formData.content_types)}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 capitalize">
                      {type.replace('_', ' ')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {type === 'news' && 'Latest football news and updates'}
                      {type === 'polls' && 'Interactive polls and questions'}
                      {type === 'images' && 'AI-generated images and graphics'}
                      {type === 'coupons' && 'Betting coupons and promotions'}
                      {type === 'live_scores' && 'Real-time match scores'}
                      {type === 'betting_tips' && 'Expert betting predictions'}
                      {type === 'daily_summary' && 'Daily football summaries'}
                      {type === 'match_analysis' && 'Match previews and analysis'}
                    </div>
                  </div>
                  {enabled && (
                    <div className="text-blue-600">✓</div>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Automation Settings */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Automation Settings</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Auto-posting</div>
                  <div className="text-sm text-gray-500">
                    Automatically post generated content
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.auto_post}
                    onChange={(e) => setFormData(prev => ({ ...prev, auto_post: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {formData.auto_post && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Post Frequency (hours)
                    </label>
                    <select
                      value={formData.post_frequency_hours}
                      onChange={(e) => setFormData(prev => ({ ...prev, post_frequency_hours: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={1}>Every hour</option>
                      <option value={2}>Every 2 hours</option>
                      <option value={3}>Every 3 hours</option>
                      <option value={6}>Every 6 hours</option>
                      <option value={12}>Every 12 hours</option>
                      <option value={24}>Once a day</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Affiliate Code
                    </label>
                    <input
                      type="text"
                      value={formData.affiliate_code}
                      onChange={(e) => setFormData(prev => ({ ...prev, affiliate_code: e.target.value }))}
                      placeholder="e.g., FOOTBALL2024"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
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

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 