/**
 * 🎨 ENHANCED CONTENT MANAGEMENT HUB
 * Modern, intuitive content generation and distribution system
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n/useI18n';
import { 
  PageLayout, 
  Card,
  StatusBadge, 
  LoadingSpinner,
  EmptyState,
  ActionCard
} from '@/components';

interface ContentTypeConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  priority: number;
  estimatedTime: string;
  features: string[];
}

interface Channel {
  id: string;
  name: string;
  language: string;
  is_active: boolean;
  telegram_channel_username?: string;
  subscriber_count?: number;
  last_message?: string;
}

interface GenerationResult {
  success: boolean;
  message: string;
  statistics?: {
    channels_processed: number;
    total_content_sent: number;
    images_generated: number;
    processing_time_seconds: number;
  };
}

export default function ContentManagementPage() {
  const { t } = useI18n();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<GenerationResult | null>(null);
  
  // Form states
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [selectedContentType, setSelectedContentType] = useState<string>('news');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('send_now');
  const [maxPostsPerChannel, setMaxPostsPerChannel] = useState<number>(2);
  const [includeImages, setIncludeImages] = useState<boolean>(true);
  
  const supabase = createClient();

  // Enhanced content types with more details
  const contentTypes: ContentTypeConfig[] = [
    { 
      id: 'live', 
      name: 'Live Updates', 
      description: 'Real-time match updates and scores', 
      icon: '⚡', 
      color: 'from-red-500 to-red-600', 
      priority: 1,
      estimatedTime: '30-45s',
      features: ['Real-time scores', 'Live commentary', 'Match events']
    },
    { 
      id: 'betting', 
      name: 'Betting Tips', 
      description: 'AI-powered betting recommendations', 
      icon: '🎯', 
      color: 'from-green-500 to-green-600', 
      priority: 2,
      estimatedTime: '20-30s',
      features: ['Statistical analysis', 'Odds comparison', 'AI predictions']
    },
    { 
      id: 'news', 
      name: 'News Content', 
      description: 'Latest football news and updates', 
      icon: '📰', 
      color: 'from-blue-500 to-blue-600', 
      priority: 3,
      estimatedTime: '15-25s',
      features: ['RSS feeds', 'AI summarization', 'Multi-language']
    },
    { 
      id: 'analysis', 
      name: 'Match Analysis', 
      description: 'Deep tactical and statistical analysis', 
      icon: '🧠', 
      color: 'from-purple-500 to-purple-600', 
      priority: 4,
      estimatedTime: '25-40s',
      features: ['Tactical breakdown', 'Statistics', 'Team form']
    },
    { 
      id: 'polls', 
      name: 'Interactive Polls', 
      description: 'Fan engagement and voting', 
      icon: '📊', 
      color: 'from-indigo-500 to-indigo-600', 
      priority: 5,
      estimatedTime: '10-20s',
      features: ['Fan voting', 'Interactive buttons', 'Real-time results']
    },
    { 
      id: 'coupons', 
      name: 'Smart Coupons', 
      description: 'Contextual promotions and offers', 
      icon: '🎫', 
      color: 'from-orange-500 to-orange-600', 
      priority: 6,
      estimatedTime: '15-25s',
      features: ['Contextual offers', 'Smart targeting', 'Revenue generation']
    },
    { 
      id: 'memes', 
      name: 'Entertainment', 
      description: 'Fun content and memes', 
      icon: '🎪', 
      color: 'from-pink-500 to-pink-600', 
      priority: 7,
      estimatedTime: '20-30s',
      features: ['AI-generated memes', 'Viral content', 'Fan entertainment']
    },
    { 
      id: 'daily_summary', 
      name: 'Daily Summary', 
      description: 'Comprehensive daily recap', 
      icon: '📋', 
      color: 'from-teal-500 to-teal-600', 
      priority: 8,
      estimatedTime: '30-45s',
      features: ['Day highlights', 'Match summaries', 'Key statistics']
    }
  ];

  // Enhanced languages with more info
  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧', native: 'English' },
    { code: 'am', name: 'Amharic', flag: '🇪🇹', native: 'አማርኛ' },
    { code: 'sw', name: 'Swahili', flag: '🇹🇿', native: 'Kiswahili' },
    { code: '', name: 'Auto-Detect', flag: '🌐', native: 'Auto' }
  ];

  // Action types
  const actionTypes = [
    { id: 'send_now', name: 'Send Now', description: 'Send immediately to selected channels', icon: '🚀' },
    { id: 'preview', name: 'Preview', description: 'Generate preview without sending', icon: '👁️' },
    { id: 'schedule', name: 'Schedule', description: 'Schedule for later delivery', icon: '⏰' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: channelsData } = await supabase
        .from('channels')
        .select(`
          id, 
          name, 
          language, 
          is_active, 
          telegram_channel_username,
          subscriber_count,
          last_message
        `)
        .eq('is_active', true)
        .order('name');

      setChannels(channelsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      // Enhanced fallback data
      setChannels([
        { 
          id: '1', 
          name: 'Premier League EN', 
          language: 'en', 
          is_active: true, 
          telegram_channel_username: '@premier_en',
          subscriber_count: 1250,
          last_message: '2 hours ago'
        },
        { 
          id: '2', 
          name: 'የእግር ኳስ ዜና', 
          language: 'am', 
          is_active: true, 
          telegram_channel_username: '@football_am',
          subscriber_count: 890,
          last_message: '1 hour ago'
        },
        { 
          id: '3', 
          name: 'Habari za Mpira', 
          language: 'sw', 
          is_active: true, 
          telegram_channel_username: '@football_sw',
          subscriber_count: 650,
          last_message: '30 minutes ago'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const generateContent = async () => {
    if (selectedChannels.length === 0) {
      showNotification('Please select at least one channel', 'error');
      return;
    }

    setProcessing(selectedContentType);
    setLastResult(null);
    
    try {
      const response = await fetch(`/api/unified-content?action=${selectedAction}&type=${selectedContentType}&language=${selectedLanguage}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_channels: selectedChannels,
          max_posts_per_channel: maxPostsPerChannel,
          include_images: includeImages
        })
      });

      const result = await response.json();
      
      if (result.success) {
        const stats = result.statistics || {};
        const actionText = selectedAction === 'send_now' ? 'sent' : selectedAction === 'preview' ? 'previewed' : 'scheduled';
        
        const successResult = {
          success: true,
          message: `Content ${actionText} successfully!`,
          statistics: stats
        };
        
        setLastResult(successResult);
        showNotification(successResult.message, 'success');
        
        // Reset form after successful send
        if (selectedAction === 'send_now') {
          setSelectedChannels([]);
        }
      } else {
        const errorResult = {
          success: false,
          message: result.error || result.message || 'Unknown error occurred'
        };
        setLastResult(errorResult);
        showNotification(errorResult.message, 'error');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      const errorResult = {
        success: false,
        message: error instanceof Error ? error.message : 'Network error occurred'
      };
      setLastResult(errorResult);
      showNotification(errorResult.message, 'error');
    } finally {
      setProcessing(null);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md`;
    notification.innerHTML = `${type === 'success' ? '✅' : '❌'} ${message}`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), type === 'success' ? 3000 : 5000);
  };

  const handleChannelToggle = (channelId: string) => {
    setSelectedChannels(prev => 
      prev.includes(channelId) 
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    );
  };

  const handleSelectAllChannels = () => {
    setSelectedChannels(channels.map(c => c.id));
  };

  const handleClearSelection = () => {
    setSelectedChannels([]);
  };

  const getChannelsByLanguage = (langCode: string) => {
    return channels.filter(channel => channel.language === langCode);
  };

  const getSelectedContentType = () => {
    return contentTypes.find(ct => ct.id === selectedContentType) || contentTypes[0];
  };

  if (loading) {
    return (
      <PageLayout title="Content Management" subtitle="Loading your content hub...">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </PageLayout>
    );
  }

  const selectedContentTypeConfig = getSelectedContentType();

  return (
    <PageLayout
      title="🎨 Content Management Hub" 
      subtitle="AI-powered content generation and distribution"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Content Type Selection */}
        <Card>
          <h3 className="text-lg font-semibold mb-6">📝 Select Content Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {contentTypes.map((type) => (
              <div
                key={type.id}
                className={`
                  relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                  ${selectedContentType === type.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
                onClick={() => setSelectedContentType(type.id)}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${type.color} flex items-center justify-center text-white text-sm`}>
                    {type.icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{type.name}</h4>
                    <p className="text-xs text-gray-500">{type.estimatedTime}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{type.description}</p>
                <div className="flex flex-wrap gap-1">
                  {type.features.slice(0, 2).map((feature, index) => (
                    <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {feature}
                    </span>
                  ))}
                </div>
                {selectedContentType === type.id && (
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Configuration Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Channel Selection */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">📺 Select Channels</h3>
            <div className="flex space-x-2">
              <button
                onClick={handleSelectAllChannels}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Select All
              </button>
              <button
                onClick={handleClearSelection}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Clear
              </button>
            </div>
          </div>

            {channels.length > 0 ? (
              <div className="space-y-3">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className={`
                      p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                    ${selectedChannels.includes(channel.id)
                        ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                    onClick={() => handleChannelToggle(channel.id)}
                >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">
                            {languages.find(l => l.code === channel.language)?.flag || '🌐'}
                          </span>
                          <div>
                            <h4 className="font-medium text-gray-900">{channel.name}</h4>
                            <p className="text-sm text-gray-500">{channel.telegram_channel_username}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {channel.subscriber_count && (
                          <div className="text-sm text-gray-500">
                            {channel.subscriber_count.toLocaleString()} subscribers
                  </div>
                    )}
                        {channel.last_message && (
                          <div className="text-xs text-gray-400">
                            {channel.last_message}
                  </div>
                        )}
                  {selectedChannels.includes(channel.id) && (
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                      </div>
                    </div>
                </div>
              ))}
            </div>
            ) : (
                             <EmptyState
                 title="No Active Channels"
                 description="Add channels to start creating content"
                 action={{
                   label: "Add Channel",
                   onClick: () => window.location.href = '/dashboard/channels/create'
                 }}
               />
          )}
        </Card>

          {/* Settings Panel */}
          <Card>
            <h3 className="text-lg font-semibold mb-6">⚙️ Settings</h3>
          
            <div className="space-y-4">
              {/* Language Selection */}
            <div>
                <label className="block text-sm font-medium mb-2">Language</label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name} ({lang.native})
                  </option>
                ))}
              </select>
            </div>
            
              {/* Action Type */}
            <div>
                <label className="block text-sm font-medium mb-2">Action</label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                  {actionTypes.map(action => (
                    <option key={action.id} value={action.id}>
                      {action.icon} {action.name}
                    </option>
                  ))}
              </select>
                <p className="text-xs text-gray-500 mt-1">
                  {actionTypes.find(a => a.id === selectedAction)?.description}
                </p>
              </div>

              {/* Posts per Channel */}
              <div>
                <label className="block text-sm font-medium mb-2">Posts per Channel</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={maxPostsPerChannel}
                  onChange={(e) => setMaxPostsPerChannel(Number(e.target.value))}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Include Images */}
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={includeImages}
                    onChange={(e) => setIncludeImages(e.target.checked)}
                    className="rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">Include AI-generated images</span>
                </label>
              </div>
            </div>
          </Card>
            </div>
            
        {/* Generation Panel */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">🚀 Content Generation</h3>
              <p className="text-sm text-gray-600">
                Generate {selectedContentTypeConfig.name} for {selectedChannels.length} selected channels
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Estimated time</div>
              <div className="text-lg font-medium text-blue-600">
                {selectedContentTypeConfig.estimatedTime}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${selectedContentTypeConfig.color} flex items-center justify-center text-white text-xl`}>
                {selectedContentTypeConfig.icon}
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{selectedContentTypeConfig.name}</h4>
                <p className="text-sm text-gray-600">{selectedContentTypeConfig.description}</p>
              </div>
            </div>
            
            <button
              onClick={generateContent}
              disabled={processing !== null || selectedChannels.length === 0}
                className={`
                px-6 py-3 rounded-lg font-medium transition-all duration-200
                ${processing !== null || selectedChannels.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg'
                  }
                `}
            >
              {processing ? (
                <span className="flex items-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span>Processing...</span>
                </span>
              ) : (
                `${actionTypes.find(a => a.id === selectedAction)?.icon} ${actionTypes.find(a => a.id === selectedAction)?.name}`
              )}
            </button>
          </div>
        </Card>

        {/* Results Panel */}
        {lastResult && (
          <Card>
            <div className="flex items-center space-x-3 mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${lastResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
                <span className="text-sm">{lastResult.success ? '✅' : '❌'}</span>
              </div>
              <h3 className="text-lg font-semibold">
                {lastResult.success ? 'Success!' : 'Error'}
              </h3>
            </div>
            
            <p className="text-gray-700 mb-4">{lastResult.message}</p>
            
            {lastResult.statistics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{lastResult.statistics.channels_processed}</div>
                  <div className="text-sm text-gray-600">Channels</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{lastResult.statistics.total_content_sent}</div>
                  <div className="text-sm text-gray-600">Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{lastResult.statistics.images_generated}</div>
                  <div className="text-sm text-gray-600">Images</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{lastResult.statistics.processing_time_seconds}s</div>
                  <div className="text-sm text-gray-600">Time</div>
                </div>
              </div>
            )}
        </Card>
        )}
      </div>
    </PageLayout>
  );
} 