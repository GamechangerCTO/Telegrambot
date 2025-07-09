/**
 * 🤖 Bots Management - Modern Professional UI
 * Comprehensive bot management with advanced features
 * ✨ One Bot = One Channel Architecture
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
  Modal,
  EmptyState
} from '@/components';

interface Bot {
  id: string;
  name: string;
  telegram_bot_username?: string;
  language_code: string;
  auto_post_enabled: boolean;
  is_active: boolean;
  max_posts_per_day: number;
  total_posts_sent: number;
  last_post_at?: string;
  created_at: string;
  channels?: Channel[];
}

interface Channel {
  id: string;
  name: string;
  telegram_channel_id: string;
  telegram_channel_username?: string;
  language: string;
  is_active: boolean;
  total_posts_sent: number;
  member_count?: number;
}

interface Language {
  code: string;
  name: string;
  native_name: string;
}

export default function BotsPage() {
  const { t } = useI18n();
  const [bots, setBots] = useState<Bot[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, bot: Bot | null}>({
    isOpen: false,
    bot: null
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: manager } = await supabase
        .from('managers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!manager) return;

      let botsQuery = supabase
        .from('bots')
        .select(`
          *,
          channels (
            id,
            name,
            telegram_channel_id,
            telegram_channel_username,
            language,
            is_active,
            total_posts_sent,
            member_count
          )
        `)
        .order('created_at', { ascending: false });

      if (manager.role !== 'super_admin') {
        botsQuery = botsQuery.eq('manager_id', manager.id);
      }

      const { data: botsData, error: botsError } = await botsQuery;
      if (botsError) throw botsError;

      const { data: languagesData, error: languagesError } = await supabase
        .from('languages')
        .select('*')
        .in('code', ['en', 'am', 'sw'])
        .eq('is_active', true)
        .order('name');

      if (languagesError) throw languagesError;

      setBots(botsData || []);
      setLanguages(languagesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBots = bots.filter(bot => {
    const matchesSearch = bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bot.telegram_bot_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bot.channels?.[0]?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLanguage = languageFilter === 'all' || bot.language_code === languageFilter;
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && bot.is_active) ||
                         (statusFilter === 'inactive' && !bot.is_active);

    return matchesSearch && matchesLanguage && matchesStatus;
  });

  const getLanguageDisplay = (code: string) => {
    const language = languages.find(l => l.code === code);
    return language ? language.native_name : code;
  };

  // ✨ NEW: Toggle both bot and its channel status together
  const toggleBotStatus = async (botId: string, currentStatus: boolean) => {
    setActionLoading(botId);
    try {
      const bot = bots.find(b => b.id === botId);
      const newStatus = !currentStatus;

      // Update bot status
      const { error: botError } = await supabase
        .from('bots')
        .update({ is_active: newStatus })
        .eq('id', botId);

      if (botError) throw botError;

      // Update channel status if exists
      if (bot?.channels?.[0]) {
        const { error: channelError } = await supabase
          .from('channels')
          .update({ is_active: newStatus })
          .eq('bot_id', botId);

        if (channelError) console.warn('Warning: Could not update channel status:', channelError);
      }

      setBots(prev => 
        prev.map(bot => 
          bot.id === botId 
            ? { 
                ...bot, 
                is_active: newStatus,
                channels: bot.channels?.map(channel => ({ ...channel, is_active: newStatus }))
              }
            : bot
        )
      );
    } catch (error) {
      console.error('Error updating bot status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteBot = async (bot: Bot) => {
    setActionLoading(bot.id);
    try {
      const response = await fetch(`/api/bots/${bot.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete bot');
      }

      setBots(prev => prev.filter(b => b.id !== bot.id));
      setDeleteModal({ isOpen: false, bot: null });

    } catch (error) {
      console.error('Error deleting bot:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'green' : 'red';
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? t.status.active : t.status.inactive;
  };

  // ✨ NEW: Get channel display text
  const getChannelDisplay = (channel: Channel) => {
    if (channel.telegram_channel_username) {
      return channel.telegram_channel_username.startsWith('@') 
        ? channel.telegram_channel_username 
        : `@${channel.telegram_channel_username}`;
    }
    return channel.telegram_channel_id || 'No identifier';
  };

  if (loading) {
    return (
      <PageLayout title={t.bots.title}>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="🤖 Bot & Channel Management"
      subtitle="Each bot manages one channel - create, configure, and monitor your automation"
      breadcrumbs={[
        { label: t.nav.dashboard, href: '/dashboard' },
        { label: t.nav.bots, current: true }
      ]}
      actions={
        <Link
          href="/dashboard/bots/create"
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
        >
          <span>🚀</span>
          <span>Create Bot & Channel</span>
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Filters */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.actions.search}
              </label>
              <input
                type="text"
                placeholder="Search bots or channels..."
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

        {/* Bots Grid */}
        {filteredBots.length === 0 ? (
          <EmptyState
            icon="🤖"
            title="No Bot & Channel Pairs Found"
            description="Create your first bot and channel combination to start managing your Telegram automation"
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredBots.map((bot) => {
              const channel = bot.channels?.[0]; // ✨ Get the single channel
              
              return (
                <Card key={bot.id} variant="elevated" className="p-6 hover:shadow-lg transition-shadow duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{bot.name}</h3>
                        <StatusBadge 
                          status={bot.is_active ? "active" : "inactive"}
                        />
                      </div>
                      
                      {bot.telegram_bot_username && (
                        <p className="text-gray-600 mb-2">🤖 @{bot.telegram_bot_username}</p>
                      )}
                      
                      {/* ✨ NEW: Channel Information */}
                      {channel ? (
                        <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-blue-900">📺 {channel.name}</span>
                            <StatusBadge 
                              status={channel.is_active ? "active" : "inactive"}
                            />
                          </div>
                          <p className="text-blue-700 text-sm">{getChannelDisplay(channel)}</p>
                          <p className="text-blue-600 text-xs mt-1">
                            📊 {channel.total_posts_sent} posts sent
                            {channel.member_count && (
                              <span className="ml-2">👥 {channel.member_count} members</span>
                            )}
                          </p>
                        </div>
                      ) : (
                        <div className="mb-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <p className="text-yellow-800 text-sm">⚠️ No channel connected</p>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>🌐 {getLanguageDisplay(bot.language_code)}</span>
                        <span>📈 {bot.total_posts_sent} total posts</span>
                      </div>
                    </div>
                  </div>

                  {/* Bot Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{bot.max_posts_per_day}</div>
                      <div className="text-xs text-gray-500">Max/day</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{channel ? 1 : 0}</div>
                      <div className="text-xs text-gray-500">Channel</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">
                        {bot.is_active && channel?.is_active ? '🟢' : '🔴'}
                      </div>
                      <div className="text-xs text-gray-500">Status</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <Link
                        href={`/dashboard/bots/${bot.id}`}
                        className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200"
                      >
                        ✏️ Edit Bot
                      </Link>
                      
                      {/* ✨ NEW: Channel edit link instead of channels list */}
                      {channel && (
                        <Link
                          href={`/dashboard/bots/${bot.id}/channels/${channel.id}/edit`}
                          className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors duration-200"
                        >
                          📺 Edit Channel
                        </Link>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleBotStatus(bot.id, bot.is_active)}
                        disabled={actionLoading === bot.id}
                        className={`
                          px-3 py-1.5 text-sm rounded-lg transition-colors duration-200 flex items-center space-x-1
                          ${bot.is_active 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }
                          ${actionLoading === bot.id ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        {actionLoading === bot.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <span>{bot.is_active ? '⏸️' : '▶️'}</span>
                            <span>{bot.is_active ? 'Disable' : 'Enable'}</span>
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, bot })}
                        disabled={actionLoading === bot.id}
                        className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200 disabled:opacity-50"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, bot: null })}
        title="🗑️ Confirm Bot & Channel Deletion"
      >
        {deleteModal.bot && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete the bot <strong>"{deleteModal.bot.name}"</strong>? 
            </p>
            {deleteModal.bot.channels?.[0] && (
              <p className="text-gray-600">
                This will also delete the connected channel <strong>"{deleteModal.bot.channels[0].name}"</strong> and all its posts.
              </p>
            )}
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm font-medium">⚠️ This action cannot be undone!</p>
            </div>
            
            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => deleteBot(deleteModal.bot!)}
                disabled={actionLoading === deleteModal.bot.id}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {actionLoading === deleteModal.bot.id ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <span>🗑️</span>
                    <span>Delete Bot & Channel</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => setDeleteModal({ isOpen: false, bot: null })}
                disabled={actionLoading === deleteModal.bot.id}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
              >
                {t.actions.cancel}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </PageLayout>
  );
} 