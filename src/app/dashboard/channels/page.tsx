/**
 * 📺 Channels Management - Modern Professional UI
 * Comprehensive channel management with advanced features
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useI18n } from '@/lib/i18n/useI18n';
import { 
  PageLayout, 
  Card,
  StatusBadge, 
  LoadingSpinner,
  EmptyState
} from '@/components';

interface Channel {
  id: string;
  name: string;
  telegram_channel_id: string;
  telegram_channel_username?: string;
  description?: string;
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
  affiliate_code?: string;
  auto_post: boolean;
  post_frequency_hours: number;
  is_active: boolean;
  member_count?: number;
  total_posts_sent: number;
  last_post_at?: string;
  created_at: string;
}

interface Language {
  code: string;
  name: string;
  native_name: string;
}

interface Stats {
  totalChannels: number;
  activeChannels: number;
  totalMembers: number;
  totalPosts: number;
}

export default function ChannelsPage() {
  const { t } = useI18n();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: channelsData, error: channelsError } = await supabase
        .from('channels')
        .select('*')
        .order('created_at', { ascending: false });

      if (channelsError) throw channelsError;

      const { data: languagesData, error: languagesError } = await supabase
        .from('languages')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (languagesError) throw languagesError;

      setChannels(channelsData || []);
      setLanguages(languagesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChannels = channels.filter(channel => {
    const matchesSearch = channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         channel.telegram_channel_username?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLanguage = languageFilter === 'all' || channel.language === languageFilter;
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && channel.is_active) ||
                         (statusFilter === 'inactive' && !channel.is_active);

    return matchesSearch && matchesLanguage && matchesStatus;
  });

  const getLanguageDisplay = (code: string) => {
    const language = languages.find(l => l.code === code);
    return language ? language.native_name : code;
  };

  const getContentTypesCount = (contentTypes: any) => {
    if (!contentTypes) return 0;
    return Object.values(contentTypes).filter(Boolean).length;
  };

  const getActiveContentTypes = (contentTypes: any) => {
    if (!contentTypes) return [];
    return Object.entries(contentTypes)
      .filter(([_, enabled]) => enabled)
      .map(([type, _]) => type);
  };

  const toggleChannelStatus = async (channelId: string, currentStatus: boolean) => {
    setActionLoading(channelId);
    try {
      const { error } = await supabase
        .from('channels')
        .update({ is_active: !currentStatus })
        .eq('id', channelId);

      if (error) throw error;

      setChannels(prev => 
        prev.map(channel => 
          channel.id === channelId 
            ? { ...channel, is_active: !currentStatus }
            : channel
        )
      );
    } catch (error) {
      console.error('Error updating channel status:', error);
    } finally {
      setActionLoading(null);
    }
  };



  const stats: Stats = {
    totalChannels: channels.length,
    activeChannels: channels.filter(c => c.is_active).length,
    totalMembers: channels.reduce((sum, c) => sum + (c.member_count || 0), 0),
    totalPosts: channels.reduce((sum, c) => sum + c.total_posts_sent, 0)
  };

  if (loading) {
    return (
      <PageLayout title={t.channels.title}>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={t.channels.title}
      subtitle="Manage your Telegram channels and their content settings"
      breadcrumbs={[
        { label: t.nav.dashboard, href: '/dashboard' },
        { label: t.nav.channels, current: true }
      ]}
      actions={
        <div className="flex space-x-3">
          <Link
            href="/dashboard/content"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2"
          >
            <span>📊</span>
            <span>Content Queue</span>
          </Link>
          <Link
            href="/dashboard/channels/create"
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
          >
            <span>📺</span>
            <span>{t.channels.createChannel}</span>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card variant="gradient" color="blue" className="p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Total Channels</h3>
              <span className="text-2xl">📺</span>
            </div>
            <div className="text-3xl font-bold">{stats.totalChannels}</div>
          </Card>
          
          <Card variant="gradient" color="green" className="p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Active Channels</h3>
              <span className="text-2xl">✅</span>
            </div>
            <div className="text-3xl font-bold">{stats.activeChannels}</div>
          </Card>
          
          <Card variant="gradient" color="purple" className="p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Total Members</h3>
              <span className="text-2xl">👥</span>
            </div>
            <div className="text-3xl font-bold">{stats.totalMembers.toLocaleString()}</div>
          </Card>
          
          <Card variant="gradient" color="orange" className="p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Posts Sent</h3>
              <span className="text-2xl">📨</span>
            </div>
            <div className="text-3xl font-bold">{stats.totalPosts.toLocaleString()}</div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.actions.search}
              </label>
              <input
                type="text"
                placeholder="Search channels..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.forms.language}
              </label>
              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Languages</option>
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.native_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.status.active}
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Channels Grid */}
        {filteredChannels.length === 0 ? (
          <EmptyState
            icon="📺"
            title={t.channels.noChannels}
            description="Create your first channel to start broadcasting sports content"
            action={{
              label: t.channels.createChannel,
              onClick: () => router.push('/dashboard/channels/create')
            }}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredChannels.map((channel) => (
              <Card key={channel.id} variant="elevated" className="p-6 hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{channel.name}</h3>
                      <StatusBadge 
                        status={channel.is_active}
                      />
                    </div>
                    
                    {channel.telegram_channel_username && (
                      <p className="text-gray-600 mb-2">@{channel.telegram_channel_username}</p>
                    )}
                    
                    {channel.description && (
                      <p className="text-gray-500 text-sm mb-3 line-clamp-2">{channel.description}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>🌐 {getLanguageDisplay(channel.language)}</span>
                      <span>👥 {(channel.member_count || 0).toLocaleString()} members</span>
                      <span>📊 {channel.total_posts_sent} posts</span>
                    </div>
                  </div>
                </div>

                {/* Content Types */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Content Types ({getContentTypesCount(channel.content_types)})</h4>
                  <div className="flex flex-wrap gap-2">
                    {getActiveContentTypes(channel.content_types).slice(0, 4).map((type) => (
                      <span key={type} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {type.replace('_', ' ')}
                      </span>
                    ))}
                    {getActiveContentTypes(channel.content_types).length > 4 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                        +{getActiveContentTypes(channel.content_types).length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Channel Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{channel.post_frequency_hours}h</div>
                    <div className="text-xs text-gray-500">Post frequency</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{channel.auto_post ? 'ON' : 'OFF'}</div>
                    <div className="text-xs text-gray-500">Auto posting</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <Link
                      href={`/dashboard/channels/${channel.id}/edit`}
                      className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200"
                    >
                      {t.actions.edit}
                    </Link>
                    
                    <Link
                      href={`/dashboard/content?channel=${channel.id}`}
                      className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors duration-200"
                    >
                      Content
                    </Link>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleChannelStatus(channel.id, channel.is_active)}
                      disabled={actionLoading === channel.id}
                      className={`
                        px-3 py-1.5 text-sm rounded-lg transition-colors duration-200 flex items-center space-x-1
                        ${channel.is_active 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }
                        ${actionLoading === channel.id ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      {actionLoading === channel.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <span>{channel.is_active ? '⏸️' : '▶️'}</span>
                          <span>{channel.is_active ? 'Disable' : 'Enable'}</span>
                        </>
                      )}
                    </button>
                    
                    <Link
                      href={`https://t.me/${channel.telegram_channel_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200"
                    >
                      View Channel
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
} 