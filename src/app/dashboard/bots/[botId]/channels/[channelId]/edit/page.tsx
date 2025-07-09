'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Bot {
  id: string;
  name: string;
  language_code: string;
}

interface Channel {
  id: string;
  name: string;
  telegram_channel_username?: string;
  description?: string;
  language: string;
  content_types: string[];
  auto_post_enabled: boolean;
  max_posts_per_day: number;
  post_frequency_hours: number;
  is_active: boolean;
  affiliate_code?: string;
  notification_settings?: {
    new_post: boolean;
    engagement_alerts: boolean;
    error_notifications: boolean;
  };
  advanced_settings?: {
    emoji_enabled: boolean;
    hashtags_enabled: boolean;
    preview_enabled: boolean;
    duplicate_check: boolean;
  };
}

interface Language {
  code: string;
  name: string;
  native_name: string;
}

const CONTENT_TYPES = [
  { value: 'news', label: 'News Articles', icon: '📰', description: 'Latest sports news and updates' },
  { value: 'polls', label: 'Polls & Surveys', icon: '📊', description: 'Interactive polls for audience engagement' },
  { value: 'images', label: 'Images & Media', icon: '🖼️', description: 'Photo galleries and visual content' },
  { value: 'coupons', label: 'Betting Coupons', icon: '🎫', description: 'Curated betting combinations' },
  { value: 'live_scores', label: 'Live Scores', icon: '⚽', description: 'Real-time match results' },
  { value: 'betting_tips', label: 'Betting Tips', icon: '💡', description: 'Expert predictions and tips' },
  { value: 'daily_summary', label: 'Daily Summary', icon: '📋', description: 'End-of-day recap' },
  { value: 'match_analysis', label: 'Match Analysis', icon: '🔍', description: 'In-depth match breakdowns' }
];

export default function EditChannelPage() {
  const [bot, setBot] = useState<Bot | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('basic');
  const [formData, setFormData] = useState({
    name: '',
    telegram_channel_username: '',
    description: '',
    content_types: [] as string[],
    auto_post_enabled: true,
    max_posts_per_day: 5,
    post_frequency_hours: 6,
    is_active: true,
    affiliate_code: '',
    notification_settings: {
      new_post: true,
      engagement_alerts: true,
      error_notifications: true
    },
    advanced_settings: {
      emoji_enabled: true,
      hashtags_enabled: true,
      preview_enabled: true,
      duplicate_check: true
    }
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const botId = params.botId as string;
  const channelId = params.channelId as string;

  useEffect(() => {
    loadData();
  }, [botId, channelId]);

  const loadData = async () => {
    try {
      // Get current user's role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: manager } = await supabase
        .from('managers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!manager) return;

      // Load bot details
      let botQuery = supabase
        .from('bots')
        .select('*')
        .eq('id', botId);

      if (manager.role !== 'super_admin') {
        botQuery = botQuery.eq('manager_id', manager.id);
      }

      const { data: botData, error: botError } = await botQuery.single();
      if (botError) throw botError;

      if (!botData) {
        router.push('/dashboard/bots');
        return;
      }

      // Load channel details
      const { data: channelData, error: channelError } = await supabase
        .from('channels')
        .select('*')
        .eq('id', channelId)
        .eq('bot_id', botId)
        .single();

      if (channelError) throw channelError;

      if (!channelData) {
        router.push(`/dashboard/bots/${botId}/channels`);
        return;
      }

      // Load languages
      const { data: languagesData, error: languagesError } = await supabase
        .from('languages')
        .select('*')
        .in('code', ['en', 'am', 'sw'])
        .eq('is_active', true)
        .order('name');

      if (languagesError) throw languagesError;

      setBot(botData);
      setChannel(channelData);
      setLanguages(languagesData || []);

      // Set form data
      setFormData({
        name: channelData.name,
        telegram_channel_username: channelData.telegram_channel_username || '',
        description: channelData.description || '',
        content_types: Array.isArray(channelData.content_types) 
          ? channelData.content_types 
          : Object.keys(channelData.content_types || {}).filter(key => channelData.content_types[key]),
        auto_post_enabled: channelData.auto_post_enabled || false,
        max_posts_per_day: channelData.max_posts_per_day || 5,
        post_frequency_hours: channelData.post_frequency_hours || 6,
        is_active: channelData.is_active !== false,
        affiliate_code: channelData.affiliate_code || '',
        notification_settings: channelData.notification_settings || {
          new_post: true,
          engagement_alerts: true,
          error_notifications: true
        },
        advanced_settings: channelData.advanced_settings || {
          emoji_enabled: true,
          hashtags_enabled: true,
          preview_enabled: true,
          duplicate_check: true
        }
      });
    } catch (error) {
      console.error('Error loading data:', error);
      setErrors({ general: 'Failed to load channel data' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleNestedInputChange = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev as any)[parent],
        [field]: value
      }
    }));
  };

  const handleContentTypeToggle = (contentType: string) => {
    const newContentTypes = formData.content_types.includes(contentType)
      ? formData.content_types.filter(type => type !== contentType)
      : [...formData.content_types, contentType];
    
    handleInputChange('content_types', newContentTypes);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Channel name is required';
    }

    if (formData.content_types.length === 0) {
      newErrors.content_types = 'At least one content type must be selected';
    }

    if (formData.max_posts_per_day < 1 || formData.max_posts_per_day > 50) {
      newErrors.max_posts_per_day = 'Max posts per day must be between 1 and 50';
    }

    if (formData.post_frequency_hours < 1 || formData.post_frequency_hours > 24) {
      newErrors.post_frequency_hours = 'Post frequency must be between 1 and 24 hours';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('channels')
        .update({
          name: formData.name,
          telegram_channel_username: formData.telegram_channel_username || null,
          description: formData.description || null,
          content_types: formData.content_types,
          auto_post_enabled: formData.auto_post_enabled,
          max_posts_per_day: formData.max_posts_per_day,
          post_frequency_hours: formData.post_frequency_hours,
          is_active: formData.is_active,
          affiliate_code: formData.affiliate_code || null,
          notification_settings: formData.notification_settings,
          advanced_settings: formData.advanced_settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', channelId);

      if (error) throw error;

      // Show success message and redirect
      router.push(`/dashboard/bots/${botId}/channels`);
    } catch (error) {
      console.error('Error updating channel:', error);
      setErrors({ general: 'Failed to save changes' });
    } finally {
      setSaving(false);
    }
  };

  const getLanguageDisplay = (code: string) => {
    const language = languages.find(l => l.code === code);
    return language ? language.native_name : code;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!bot || !channel) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Channel Not Found</h1>
          <Link
            href="/dashboard/bots"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Return to Bots
          </Link>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'basic', label: 'Basic Settings', icon: '⚙️' },
    { id: 'content', label: 'Content Types', icon: '📝' },
    { id: 'automation', label: 'Automation', icon: '🤖' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'advanced', label: 'Advanced', icon: '🛠️' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link href="/dashboard/bots" className="text-sm font-medium text-gray-700 hover:text-blue-600">
                Bots
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">{bot.name}</span>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
                <Link href={`/dashboard/bots/${botId}/channels`} className="ml-1 text-sm font-medium text-gray-500 hover:text-blue-600 md:ml-2">
                  Channels
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-900 md:ml-2">Edit {channel.name}</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Channel: {channel.name}</h1>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  {getLanguageDisplay(channel.language)}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  channel.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {channel.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <nav className="space-y-2">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-2">{section.icon}</span>
                    {section.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {errors.general && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-red-800">{errors.general}</div>
                </div>
              )}

              {/* Basic Settings */}
              {activeSection === 'basic' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Channel Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.name ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter channel name"
                      />
                      {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telegram Username
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">@</span>
                        <input
                          type="text"
                          value={formData.telegram_channel_username}
                          onChange={(e) => handleInputChange('telegram_channel_username', e.target.value)}
                          className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="channel_username"
                        />
                      </div>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Channel description..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language
                      </label>
                      <div className="py-2 text-gray-900 bg-gray-50 px-3 rounded-md">
                        {getLanguageDisplay(channel.language)}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Language cannot be changed after creation</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Affiliate Code
                      </label>
                      <input
                        type="text"
                        value={formData.affiliate_code}
                        onChange={(e) => handleInputChange('affiliate_code', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter affiliate code"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => handleInputChange('is_active', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">
                        Channel is active
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Content Types */}
              {activeSection === 'content' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Content Types</h3>
                    <p className="text-gray-600 mt-2">Select the types of content this channel should publish. The system will automatically select relevant leagues and teams based on your preferences.</p>
                  </div>
                  
                  {errors.content_types && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 text-sm">{errors.content_types}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {CONTENT_TYPES.map(contentType => (
                      <div
                        key={contentType.value}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          formData.content_types.includes(contentType.value)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleContentTypeToggle(contentType.value)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="text-2xl">{contentType.icon}</div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{contentType.label}</h4>
                            <p className="text-sm text-gray-500 mt-1">{contentType.description}</p>
                          </div>
                          <div className={`w-5 h-5 rounded border-2 ${
                            formData.content_types.includes(contentType.value)
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {formData.content_types.includes(contentType.value) && (
                              <svg className="w-3 h-3 text-white ml-0.5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Automation */}
              {activeSection === 'automation' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Automation Settings</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Posts Per Day *
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
                        Post Frequency (hours) *
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
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.auto_post_enabled}
                      onChange={(e) => handleInputChange('auto_post_enabled', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Enable automatic posting
                    </label>
                  </div>
                </div>
              )}

              {/* Notifications */}
              {activeSection === 'notifications' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.notification_settings.new_post}
                        onChange={(e) => handleNestedInputChange('notification_settings', 'new_post', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">
                        Notify when new posts are published
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.notification_settings.engagement_alerts}
                        onChange={(e) => handleNestedInputChange('notification_settings', 'engagement_alerts', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">
                        Alert on high engagement posts
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.notification_settings.error_notifications}
                        onChange={(e) => handleNestedInputChange('notification_settings', 'error_notifications', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">
                        Notify about posting errors
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced */}
              {activeSection === 'advanced' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Advanced Settings</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.advanced_settings.emoji_enabled}
                        onChange={(e) => handleNestedInputChange('advanced_settings', 'emoji_enabled', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">
                        Include emojis in posts
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.advanced_settings.hashtags_enabled}
                        onChange={(e) => handleNestedInputChange('advanced_settings', 'hashtags_enabled', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">
                        Add hashtags to posts
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.advanced_settings.preview_enabled}
                        onChange={(e) => handleNestedInputChange('advanced_settings', 'preview_enabled', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">
                        Generate link previews
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.advanced_settings.duplicate_check}
                        onChange={(e) => handleNestedInputChange('advanced_settings', 'duplicate_check', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">
                        Check for duplicate content
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Smart Content Notice */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
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
                  This channel uses intelligent content selection. The system automatically chooses relevant leagues, teams, and matches based on your content preferences and channel language, ensuring optimal content without manual configuration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 