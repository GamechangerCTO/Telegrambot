'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PageLayout from '@/components/layout/PageLayout';
import { Card, LoadingSpinner } from '@/components';
import { Bot, Clock, MessageSquare, Settings, Zap, Target, Calendar, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface BotSettings {
  id: string;
  name: string;
  auto_post_enabled: boolean;
  max_posts_per_day: number;
  post_frequency_hours: number;
  preferred_post_times: string[];
  content_types: {
    news: boolean;
    betting_tips: boolean;
    match_analysis: boolean;
    live_updates: boolean;
    polls: boolean;
    coupons: boolean;
    daily_summary: boolean;
    weekly_summary: boolean;
  };
  language_settings: {
    primary_language: string;
    auto_translate: boolean;
    supported_languages: string[];
  };
  automation_settings: {
    smart_scheduling: boolean;
    audience_optimization: boolean;
    content_quality_check: boolean;
    duplicate_prevention: boolean;
  };
  notification_settings: {
    success_notifications: boolean;
    error_notifications: boolean;
    performance_reports: boolean;
    daily_summary: boolean;
  };
  advanced_settings: {
    rate_limiting: boolean;
    api_retry_attempts: number;
    content_cache_duration: number;
    image_generation: boolean;
    custom_prompts: boolean;
  };
}

interface Channel {
  id: string;
  name: string;
  language: string;
  is_active: boolean;
  member_count: number;
  last_post_at: string;
  total_posts_sent: number;
}

export default function BotSettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [botSettings, setBotSettings] = useState<BotSettings | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const tabs = [
    { id: 'general', name: 'General', icon: <Settings className="w-4 h-4" /> },
    { id: 'content', name: 'Content Types', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'schedule', name: 'Scheduling', icon: <Clock className="w-4 h-4" /> },
    { id: 'automation', name: 'Automation', icon: <Zap className="w-4 h-4" /> },
    { id: 'channels', name: 'Channels', icon: <Target className="w-4 h-4" /> },
    { id: 'advanced', name: 'Advanced', icon: <TrendingUp className="w-4 h-4" /> },
  ];

  const contentTypes = [
    { id: 'news', name: 'News Articles', description: 'RSS feeds and sports news' },
    { id: 'betting_tips', name: 'Betting Tips', description: 'AI-generated betting analysis' },
    { id: 'match_analysis', name: 'Match Analysis', description: 'Detailed match breakdowns' },
    { id: 'live_updates', name: 'Live Updates', description: 'Real-time match events' },
    { id: 'polls', name: 'Polls & Surveys', description: 'Interactive user engagement' },
    { id: 'coupons', name: 'Promotional Coupons', description: 'Affiliate marketing content' },
    { id: 'daily_summary', name: 'Daily Summary', description: 'End-of-day match summaries' },
    { id: 'weekly_summary', name: 'Weekly Summary', description: 'Weekly performance reviews' },
  ];

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'he', name: 'עברית', flag: '🇮🇱' },
    { code: 'am', name: 'አማርኛ', flag: '🇪🇹' },
    { code: 'sw', name: 'Kiswahili', flag: '🇰🇪' },
  ];

  useEffect(() => {
    loadBotSettings();
    loadChannels();
  }, []);

  const loadBotSettings = async () => {
    try {
      // Mock data for now - in real app, this would come from API
      setBotSettings({
        id: 'bot_1',
        name: 'Sports Bot Pro',
        auto_post_enabled: true,
        max_posts_per_day: 10,
        post_frequency_hours: 2,
        preferred_post_times: ['09:00', '13:00', '17:00', '21:00'],
        content_types: {
          news: true,
          betting_tips: true,
          match_analysis: true,
          live_updates: false,
          polls: true,
          coupons: true,
          daily_summary: true,
          weekly_summary: false,
        },
        language_settings: {
          primary_language: 'en',
          auto_translate: true,
          supported_languages: ['en', 'he', 'am'],
        },
        automation_settings: {
          smart_scheduling: true,
          audience_optimization: false,
          content_quality_check: true,
          duplicate_prevention: true,
        },
        notification_settings: {
          success_notifications: true,
          error_notifications: true,
          performance_reports: false,
          daily_summary: true,
        },
        advanced_settings: {
          rate_limiting: true,
          api_retry_attempts: 3,
          content_cache_duration: 30,
          image_generation: true,
          custom_prompts: false,
        },
      });
    } catch (error) {
      console.error('Error loading bot settings:', error);
      setMessage('Failed to load bot settings');
    } finally {
      setLoading(false);
    }
  };

  const loadChannels = async () => {
    try {
      // Mock data for now
      setChannels([
        {
          id: 'channel_1',
          name: 'AfricaSportCenter',
          language: 'am',
          is_active: true,
          member_count: 2500,
          last_post_at: '2025-01-09T10:30:00Z',
          total_posts_sent: 245,
        },
        {
          id: 'channel_2',
          name: 'Sports English',
          language: 'en',
          is_active: true,
          member_count: 1200,
          last_post_at: '2025-01-09T09:15:00Z',
          total_posts_sent: 123,
        },
      ]);
    } catch (error) {
      console.error('Error loading channels:', error);
    }
  };

  const handleSettingUpdate = async (category: string, field: string, value: any) => {
    if (!botSettings) return;
    
    setSaving(true);
    setMessage('');
    
    try {
      const currentCategoryValue = botSettings[category as keyof BotSettings] as any;
      const updatedSettings = {
        ...botSettings,
        [category]: {
          ...currentCategoryValue,
          [field]: value,
        },
      };
      setBotSettings(updatedSettings);
      
      // Here you would make API call to update settings
      // await updateBotSettings(updatedSettings);
      
      setMessage('Settings updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating settings:', error);
      setMessage('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDirectUpdate = async (field: string, value: any) => {
    if (!botSettings) return;
    
    setSaving(true);
    setMessage('');
    
    try {
      const updatedSettings = { ...botSettings, [field]: value };
      setBotSettings(updatedSettings);
      
      setMessage('Settings updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating settings:', error);
      setMessage('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Configuration</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bot Name
              </label>
              <input
                type="text"
                value={botSettings?.name || ''}
                onChange={(e) => handleDirectUpdate('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter bot name"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Auto Posting</p>
                <p className="text-sm text-gray-500">Enable automatic content posting</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={botSettings?.auto_post_enabled || false}
                  onChange={(e) => handleDirectUpdate('auto_post_enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Posts Per Day
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={botSettings?.max_posts_per_day || 10}
                onChange={(e) => handleDirectUpdate('max_posts_per_day', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Post Frequency (hours)
              </label>
              <select
                value={botSettings?.post_frequency_hours || 2}
                onChange={(e) => handleDirectUpdate('post_frequency_hours', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>Every hour</option>
                <option value={2}>Every 2 hours</option>
                <option value={3}>Every 3 hours</option>
                <option value={4}>Every 4 hours</option>
                <option value={6}>Every 6 hours</option>
                <option value={8}>Every 8 hours</option>
                <option value={12}>Every 12 hours</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Language Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Language
              </label>
              <select
                value={botSettings?.language_settings.primary_language || 'en'}
                onChange={(e) => handleSettingUpdate('language_settings', 'primary_language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Auto Translate</p>
                <p className="text-sm text-gray-500">Automatically translate content to channel language</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={botSettings?.language_settings.auto_translate || false}
                  onChange={(e) => handleSettingUpdate('language_settings', 'auto_translate', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderContentSettings = () => (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Content Types</h3>
        <p className="text-sm text-gray-500 mb-6">Select which types of content your bot should generate</p>
        
        <div className="space-y-4">
          {contentTypes.map((type) => (
            <div key={type.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{type.name}</h4>
                <p className="text-sm text-gray-500">{type.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={botSettings?.content_types[type.id as keyof typeof botSettings.content_types] || false}
                  onChange={(e) => handleSettingUpdate('content_types', type.id, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );

  const renderScheduleSettings = () => (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Posting Schedule</h3>
        <p className="text-sm text-gray-500 mb-6">Configure when your bot should post content</p>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Posting Times
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['09:00', '13:00', '17:00', '21:00'].map((time) => (
                <div key={time} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`time-${time}`}
                    checked={botSettings?.preferred_post_times.includes(time) || false}
                    onChange={(e) => {
                      const currentTimes = botSettings?.preferred_post_times || [];
                      const newTimes = e.target.checked
                        ? [...currentTimes, time]
                        : currentTimes.filter(t => t !== time);
                      handleDirectUpdate('preferred_post_times', newTimes);
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`time-${time}`} className="ml-2 block text-sm text-gray-900">
                    {time}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">📅 Smart Scheduling</h4>
            <p className="text-sm text-blue-800">
              Enable smart scheduling in automation settings to automatically optimize posting times based on audience engagement.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );

  const renderAutomationSettings = () => (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Automation Features</h3>
        <p className="text-sm text-gray-500 mb-6">Configure advanced automation features</p>
        
        <div className="space-y-6">
          {[
            {
              key: 'smart_scheduling',
              title: 'Smart Scheduling',
              description: 'Automatically optimize posting times based on engagement data',
            },
            {
              key: 'audience_optimization',
              title: 'Audience Optimization',
              description: 'Tailor content based on audience preferences and behavior',
            },
            {
              key: 'content_quality_check',
              title: 'Content Quality Check',
              description: 'Automatically review content quality before posting',
            },
            {
              key: 'duplicate_prevention',
              title: 'Duplicate Prevention',
              description: 'Prevent posting duplicate or very similar content',
            },
          ].map((feature) => (
            <div key={feature.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{feature.title}</h4>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={botSettings?.automation_settings[feature.key as keyof typeof botSettings.automation_settings] || false}
                  onChange={(e) => handleSettingUpdate('automation_settings', feature.key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );

  const renderChannelsSettings = () => (
    <Card>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Connected Channels</h3>
          <Link 
            href="/dashboard/channels/create"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Channel
          </Link>
        </div>
        
        <div className="space-y-4">
          {channels.map((channel) => (
            <div key={channel.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center">
                  <h4 className="font-medium text-gray-900">{channel.name}</h4>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    channel.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {channel.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Language: {languages.find(l => l.code === channel.language)?.flag} {languages.find(l => l.code === channel.language)?.name} • 
                  Members: {channel.member_count.toLocaleString()} • 
                  Posts: {channel.total_posts_sent}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Link
                  href={`/dashboard/channels/${channel.id}/edit`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Edit
                </Link>
                <button className="text-red-600 hover:text-red-800">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );

  const renderAdvancedSettings = () => (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Configuration</h3>
        <p className="text-sm text-gray-500 mb-6">Fine-tune performance and behavior settings</p>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Retry Attempts
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={botSettings?.advanced_settings.api_retry_attempts || 3}
              onChange={(e) => handleSettingUpdate('advanced_settings', 'api_retry_attempts', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content Cache Duration (minutes)
            </label>
            <input
              type="number"
              min="5"
              max="120"
              value={botSettings?.advanced_settings.content_cache_duration || 30}
              onChange={(e) => handleSettingUpdate('advanced_settings', 'content_cache_duration', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {[
            {
              key: 'rate_limiting',
              title: 'Rate Limiting',
              description: 'Enable rate limiting to prevent API throttling',
            },
            {
              key: 'image_generation',
              title: 'Image Generation',
              description: 'Generate images for posts automatically',
            },
            {
              key: 'custom_prompts',
              title: 'Custom Prompts',
              description: 'Use custom AI prompts for content generation',
            },
          ].map((feature) => (
            <div key={feature.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{feature.title}</h4>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(botSettings?.advanced_settings[feature.key as keyof typeof botSettings.advanced_settings]) || false}
                  onChange={(e) => handleSettingUpdate('advanced_settings', feature.key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'content':
        return renderContentSettings();
      case 'schedule':
        return renderScheduleSettings();
      case 'automation':
        return renderAutomationSettings();
      case 'channels':
        return renderChannelsSettings();
      case 'advanced':
        return renderAdvancedSettings();
      default:
        return renderGeneralSettings();
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center">
            <Link href="/dashboard/settings" className="text-gray-600 hover:text-gray-900 mr-4">
              ← Back to Settings
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Bot Settings</h1>
              <p className="text-gray-600">Configure your bot behavior and automation</p>
            </div>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border-2 border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="mr-3">{tab.icon}</div>
                  <span className="text-sm font-medium">{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </PageLayout>
  );
} 