'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Bot {
  id: string;
  name: string;
  telegram_bot_username?: string;
  language_code: string;
  is_active: boolean;
}

interface Channel {
  id: string;
  name: string;
  telegram_channel_username?: string;
  language: string;
  is_active: boolean;
  content_types: string[];
  auto_post_enabled: boolean;
  max_posts_per_day: number;
  post_frequency_hours: number;
  total_posts_sent: number;
  last_post_at?: string;
  member_count?: number;
  created_at: string;
}

interface Language {
  code: string;
  name: string;
  native_name: string;
}

export default function BotChannelsPage() {
  const [bot, setBot] = useState<Bot | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
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
      let hasManagerAccess = true;

      // Try to get current user's role (optional for development)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: manager } = await supabase
            .from('managers')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (manager) {
            // Load bot details with manager filtering
            let botQuery = supabase
              .from('bots')
              .select('*')
              .eq('id', botId);

            // If not super admin, filter by manager
            if (manager.role !== 'super_admin') {
              botQuery = botQuery.eq('manager_id', manager.id);
            }

            const { data, error: botError } = await botQuery.single();
            if (botError) {
              console.warn('Bot query error:', botError);
            } else {
              botData = data;
            }
          }
        }
      } catch (authError) {
        console.warn('Authentication/manager check failed, using fallback mode:', authError);
        hasManagerAccess = false;
      }

      // If no bot data from manager system, try direct access or use fallback
      if (!botData) {
        try {
          const { data, error: botError } = await supabase
            .from('bots')
            .select('*')
            .eq('id', botId)
            .single();

          if (botError) {
            console.warn('Direct bot query error:', botError);
          } else {
            botData = data;
          }
        } catch (err) {
          console.warn('Could not access bots table, using fallback');
        }
      }

      // Create fallback bot data for development if still no data
      if (!botData) {
        botData = {
          id: botId,
          name: 'Test Bot',
          telegram_bot_username: 'test_bot',
          language_code: 'en',
          is_active: true
        };
        console.log('Using fallback bot data for development');
      }

      setBot(botData);

      // Try to load channels for this bot
      try {
        const { data: channelsData, error: channelsError } = await supabase
          .from('channels')
          .select('*')
          .eq('bot_id', botId)
          .order('created_at', { ascending: false });

        if (channelsError) {
          console.warn('Channels error:', channelsError);
          setChannels([]);
        } else {
          setChannels(channelsData || []);
        }
      } catch (err) {
        console.warn('Channels table not available:', err);
        setChannels([]);
      }

      // Try to load languages
      try {
        const { data: languagesData, error: languagesError } = await supabase
          .from('languages')
          .select('*')
          .in('code', ['en', 'am', 'sw'])
          .eq('is_active', true)
          .order('name');

        if (languagesError) {
          throw languagesError;
        } else {
          setLanguages(languagesData || []);
        }
      } catch (err) {
        console.warn('Languages table not available, using defaults');
        setLanguages([
          { code: 'en', name: 'English', native_name: 'English' },
          { code: 'am', name: 'Amharic', native_name: 'አማርኛ' },
          { code: 'sw', name: 'Swahili', native_name: 'Kiswahili' }
        ]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Don't break the component completely
      setBot({
        id: botId,
        name: 'Unknown Bot',
        telegram_bot_username: 'unknown_bot',
        language_code: 'en',
        is_active: true
      });
      setChannels([]);
      setLanguages([
        { code: 'en', name: 'English', native_name: 'English' },
        { code: 'am', name: 'Amharic', native_name: 'አማרኛ' },
        { code: 'sw', name: 'Swahili', native_name: 'Kiswahili' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredChannels = channels.filter(channel => {
    const matchesSearch = channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         channel.telegram_channel_username?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && channel.is_active) ||
                         (statusFilter === 'inactive' && !channel.is_active);

    return matchesSearch && matchesStatus;
  });

  const getLanguageDisplay = (code: string) => {
    const language = languages.find(l => l.code === code);
    return language ? language.native_name : code;
  };

  const toggleChannelStatus = async (channelId: string, currentStatus: boolean) => {
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
    }
  };

  const getContentTypesDisplay = (types: string[]) => {
    const typeNames: { [key: string]: string } = {
      news: 'News',
      polls: 'Polls',
      images: 'Images',
      coupons: 'Coupons',
      live_scores: 'Live Scores',
      betting_tips: 'Betting Tips',
      daily_summary: 'Daily Summary',
      match_analysis: 'Match Analysis'
    };

    return types.map(type => typeNames[type] || type).join(', ');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Bot not found</h2>
          <Link
            href="/dashboard/bots"
            className="text-blue-600 hover:text-blue-700"
          >
            Return to Bots
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
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
                <span className="ml-1 text-sm font-medium text-gray-900 md:ml-2">
                  Channels
                </span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Channels for {bot.name}
              </h1>
              <div className="flex items-center space-x-2 mt-2">
                {bot.telegram_bot_username && (
                  <span className="text-sm text-blue-600">@{bot.telegram_bot_username}</span>
                )}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  bot.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {bot.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  {getLanguageDisplay(bot.language_code)}
                </span>
              </div>
            </div>
            <Link
              href={`/dashboard/bots/${botId}/channels/create`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
                              + Connect Channel
            </Link>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Channels
              </label>
              <input
                type="text"
                placeholder="Search by name or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-end">
              <div className="text-sm text-gray-500">
                Showing {filteredChannels.length} of {channels.length} channels
              </div>
            </div>
          </div>
        </div>

        {/* Channels Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredChannels.map(channel => (
            <div key={channel.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Channel Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {channel.name}
                    </h3>
                    {channel.telegram_channel_username && (
                      <p className="text-sm text-blue-600 mb-2">
                        @{channel.telegram_channel_username}
                      </p>
                    )}
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        channel.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {channel.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {getLanguageDisplay(channel.language)}
                      </span>
                      {channel.auto_post_enabled && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                          Auto-Post
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Channel Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-xl font-bold text-gray-900">
                      {channel.total_posts_sent}
                    </div>
                    <div className="text-sm text-gray-500">Posts Sent</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-xl font-bold text-gray-900">
                      {channel.max_posts_per_day}
                    </div>
                    <div className="text-sm text-gray-500">Daily Limit</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-xl font-bold text-gray-900">
                      {channel.member_count || 0}
                    </div>
                    <div className="text-sm text-gray-500">Members</div>
                  </div>
                </div>

                {/* Content Types */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Content Types</h4>
                  <div className="text-sm text-gray-600">
                    {getContentTypesDisplay(channel.content_types)}
                  </div>
                </div>

                {/* Settings */}
                <div className="mb-4 text-sm text-gray-500">
                  <div>Frequency: Every {channel.post_frequency_hours} hours</div>
                  {channel.last_post_at && (
                    <div>Last post: {new Date(channel.last_post_at).toLocaleDateString()}</div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Link
                    href={`/dashboard/bots/${botId}/channels/${channel.id}`}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors text-center"
                  >
                    Manage Content
                  </Link>
                  <Link
                    href={`/dashboard/bots/${botId}/channels/${channel.id}/edit`}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => toggleChannelStatus(channel.id, channel.is_active)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      channel.is_active
                        ? 'bg-red-100 hover:bg-red-200 text-red-700'
                        : 'bg-green-100 hover:bg-green-200 text-green-700'
                    }`}
                  >
                    {channel.is_active ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredChannels.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4V2a1 1 0 011-1h4a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4zM6 6v12h8V6H6zM8 8v8h2V8H8zm4 0v8h2V8h-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No channels found</h3>
            <p className="text-gray-500 mb-6">
              {channels.length === 0 
                ? "Get started by creating your first channel for this bot"
                : "Try adjusting your filters to see more channels"
              }
            </p>
            {channels.length === 0 && (
              <Link
                href={`/dashboard/bots/${botId}/channels/create`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Create First Channel
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 