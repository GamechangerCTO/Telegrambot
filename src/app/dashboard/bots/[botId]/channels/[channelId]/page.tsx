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
  description?: string;
  language: string;
  content_types: string[];
  auto_post_enabled: boolean;
  max_posts_per_day: number;
  post_frequency_hours: number;
  is_active: boolean;
  total_posts_sent: number;
  last_post_at?: string;
  member_count?: number;
  affiliate_code?: string;
  created_at: string;
  updated_at: string;
}

interface Language {
  code: string;
  name: string;
  native_name: string;
}

interface League {
  id: string;
  name: string;
  translations: { [key: string]: string };
}

interface Team {
  id: string;
  name: string;
  league_id: string;
  translations: { [key: string]: string };
}

interface Post {
  id: string;
  title: string;
  content: string;
  post_type: string;
  status: string;
  scheduled_at?: string;
  posted_at?: string;
  engagement_stats?: {
    views: number;
    reactions: number;
    shares: number;
  };
  created_at: string;
}

interface ChannelStats {
  postsToday: number;
  postsThisWeek: number;
  postsThisMonth: number;
  avgEngagement: number;
  memberGrowth: number;
  lastActivity: string;
}

const CONTENT_TYPES = [
  { value: 'news', label: 'News Articles', icon: '📰' },
  { value: 'polls', label: 'Polls & Surveys', icon: '📊' },
  { value: 'images', label: 'Images & Media', icon: '🖼️' },
  { value: 'coupons', label: 'Betting Coupons', icon: '🎫' },
  { value: 'live_scores', label: 'Live Scores', icon: '⚽' },
  { value: 'betting_tips', label: 'Betting Tips', icon: '💡' },
  { value: 'daily_summary', label: 'Daily Summary', icon: '📋' },
  { value: 'match_analysis', label: 'Match Analysis', icon: '🔍' }
];

export default function ChannelManagementPage() {
  const [bot, setBot] = useState<Bot | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<ChannelStats>({
    postsToday: 0,
    postsThisWeek: 0,
    postsThisMonth: 0,
    avgEngagement: 0,
    memberGrowth: 0,
    lastActivity: ''
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content_types: [] as string[],
    auto_post_enabled: true,
    max_posts_per_day: 5,
    post_frequency_hours: 6,
    is_active: true,
    affiliate_code: ''
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
      let manager = null;
      
      if (user) {
        const { data: managerData } = await supabase
          .from('managers')
          .select('*')
          .eq('user_id', user.id)
          .single();
        manager = managerData;
      }

      // Load bot details - allow fallback for development
      let botQuery = supabase
        .from('bots')
        .select('*')
        .eq('id', botId);

      if (manager && manager.role !== 'super_admin') {
        botQuery = botQuery.eq('manager_id', manager.id);
      }

      const { data: botData, error: botError } = await botQuery.single();
      
      // Use real data only
      if (botError || !botData) {
        console.error('Bot not found in database:', botError);
        return;
      }

      // Load channel details
      const { data: channelData, error: channelError } = await supabase
        .from('channels')
        .select('*')
        .eq('id', channelId)
        .eq('bot_id', botId)
        .single();

      // Use real data only
      if (channelError || !channelData) {
        console.error('Channel not found in database:', channelError);
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

      // Load leagues
      const { data: leaguesData, error: leaguesError } = await supabase
        .from('leagues')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (leaguesError) throw leaguesError;

      // Load teams (no is_active column in teams table)
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .order('name');

      if (teamsError) {
        console.warn('Teams loading error:', teamsError);
      }

      // Load real posts data from database (when posts table exists)
      // For now, use actual channel data for stats
      const realStats = {
        postsToday: 0, // Will be calculated from posts table when it exists
        postsThisWeek: 0, // Will be calculated from posts table when it exists
        postsThisMonth: channelData.total_posts_sent || 0,
        avgEngagement: 0, // Will be calculated from engagement metrics when available
        memberGrowth: 0, // Will be calculated from member history when available
        lastActivity: channelData.last_post_at || channelData.updated_at
      };

      setBot(botData);
      setChannel(channelData);
      setLanguages(languagesData || []);
      setLeagues(leaguesData || []);
      setTeams(teamsData || []);
      setRecentPosts([]); // Will load from posts table when it exists
      setStats(realStats);

      // Set form data for editing
      setFormData({
        name: channelData.name,
        description: channelData.description || '',
        content_types: channelData.content_types || [],
        auto_post_enabled: channelData.auto_post_enabled,
        max_posts_per_day: channelData.max_posts_per_day,
        post_frequency_hours: channelData.post_frequency_hours,
        is_active: channelData.is_active,
        affiliate_code: channelData.affiliate_code || ''
      });

    } catch (error) {
      console.error('Error loading data:', error);
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
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('channels')
        .update({
          name: formData.name,
          description: formData.description,
          content_types: formData.content_types,
          auto_post_enabled: formData.auto_post_enabled,
          max_posts_per_day: formData.max_posts_per_day,
          post_frequency_hours: formData.post_frequency_hours,
          is_active: formData.is_active,
          affiliate_code: formData.affiliate_code || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', channelId);

      if (error) throw error;

      setChannel(prev => prev ? {
        ...prev,
        name: formData.name,
        description: formData.description,
        content_types: formData.content_types,
        auto_post_enabled: formData.auto_post_enabled,
        max_posts_per_day: formData.max_posts_per_day,
        post_frequency_hours: formData.post_frequency_hours,
        is_active: formData.is_active,
        affiliate_code: formData.affiliate_code
      } : null);

      setEditing(false);
    } catch (error: any) {
      console.error('Error updating channel:', error);
      setErrors({ general: error.message || 'Failed to update channel' });
    } finally {
      setLoading(false);
    }
  };

  // New content management functions
  const handleCreateContent = (contentType: string) => {
    // Set the content type and switch to create tab
    setActiveTab('create');
  };

  const handleEditPost = async (postId: string) => {
    // For now, just show an alert - in the future this would open an edit dialog
    alert(`Edit post ${postId} - Coming soon!`);
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      // Refresh posts
      setRecentPosts(prev => prev.filter(post => post.id !== postId));
      
      // Reload data to get updated stats
      loadData();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  const getLanguageDisplay = (code: string) => {
    const language = languages.find(l => l.code === code);
    return language ? language.native_name : code;
  };

  const getContentTypesDisplay = (types: string[]) => {
    return CONTENT_TYPES
      .filter(ct => types.includes(ct.value))
      .map(ct => `${ct.icon} ${ct.label}`)
      .join(', ');
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  // Simple CreatePostForm component
  const CreatePostForm = ({ channel, onSuccess, onCancel }: {
    channel: Channel | null;
    onSuccess: () => void;
    onCancel: () => void;
  }) => {
    const [postData, setPostData] = useState({
      title: '',
      content: '',
      post_type: 'news',
      status: 'draft'
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      try {
        const { error } = await supabase
          .from('posts')
          .insert({
            title: postData.title,
            content: postData.content,
            post_type: postData.post_type,
            status: postData.status,
            channel_id: channel?.id,
            bot_id: botId,
            created_at: new Date().toISOString()
          });

        if (error) throw error;
        
        onSuccess();
      } catch (error) {
        console.error('Error creating post:', error);
        alert('Failed to create post');
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Post Type
          </label>
          <select
            value={postData.post_type}
            onChange={(e) => setPostData(prev => ({ ...prev, post_type: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CONTENT_TYPES.filter(ct => channel?.content_types.includes(ct.value)).map(contentType => (
              <option key={contentType.value} value={contentType.value}>
                {contentType.icon} {contentType.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            type="text"
            value={postData.title}
            onChange={(e) => setPostData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter post title"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content
          </label>
          <textarea
            value={postData.content}
            onChange={(e) => setPostData(prev => ({ ...prev, content: e.target.value }))}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Write your post content here..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={postData.status}
            onChange={(e) => setPostData(prev => ({ ...prev, status: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="draft">Draft</option>
            <option value="published">Publish Now</option>
            <option value="scheduled">Schedule for Later</option>
          </select>
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Create Post
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!bot || !channel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Channel not found</h2>
          <Link
            href={`/dashboard/bots/${botId}/channels`}
            className="text-blue-600 hover:text-blue-700"
          >
            Return to Channels
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
                <Link
                  href={`/dashboard/bots/${botId}`}
                  className="ml-1 text-sm font-medium text-gray-500 hover:text-blue-600 md:ml-2"
                >
                  {bot.name}
                </Link>
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
                  {channel.name}
                </span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <h1 className="text-3xl font-bold text-gray-900">{channel.name}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  channel.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {channel.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {getLanguageDisplay(channel.language)}
                </span>
                {channel.auto_post_enabled && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    Auto-Post
                  </span>
                )}
              </div>
              
              <div className="space-y-2 text-gray-600">
                {channel.telegram_channel_username && (
                  <p className="text-sm">
                    <span className="font-medium">Username:</span> @{channel.telegram_channel_username}
                  </p>
                )}
                {channel.description && (
                  <p className="text-sm">
                    <span className="font-medium">Description:</span> {channel.description}
                  </p>
                )}
                <p className="text-sm">
                  <span className="font-medium">Bot:</span> {bot.name}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Members:</span> {channel.member_count || 0}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Created:</span> {new Date(channel.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setEditing(!editing)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
              >
                {editing ? 'Cancel' : 'Edit Channel'}
              </button>
              <Link
                href={`/dashboard/content?channel=${channelId}`}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors inline-flex items-center"
              >
                📊 Content Management
              </Link>
              <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">
                Create Post
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{stats.postsToday}</div>
            <div className="text-sm text-gray-500">Posts Today</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-green-600">{stats.postsThisWeek}</div>
            <div className="text-sm text-gray-500">This Week</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-purple-600">{stats.postsThisMonth}</div>
            <div className="text-sm text-gray-500">This Month</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-orange-600">{channel.member_count || 0}</div>
            <div className="text-sm text-gray-500">Members</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-indigo-600">{stats.avgEngagement}</div>
            <div className="text-sm text-gray-500">Avg Engagement</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-pink-600">+{stats.memberGrowth}%</div>
            <div className="text-sm text-gray-500">Growth Rate</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'posts', label: 'Content & Posts', icon: '📝' },
                { id: 'settings', label: 'Settings', icon: '⚙️' },
                { id: 'analytics', label: 'Analytics', icon: '📈' },

                { id: 'create', label: 'Create Content', icon: '📝' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Channel Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Channel Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Content Types:</span>
                        <span className="text-gray-900 text-sm">{getContentTypesDisplay(channel.content_types)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Post Frequency:</span>
                        <span className="text-gray-900">Every {channel.post_frequency_hours} hours</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Daily Limit:</span>
                        <span className="text-gray-900">{channel.max_posts_per_day} posts</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Auto-Post:</span>
                        <span className={`text-sm font-medium ${channel.auto_post_enabled ? 'text-green-600' : 'text-red-600'}`}>
                          {channel.auto_post_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      {channel.affiliate_code && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Affiliate Code:</span>
                          <span className="text-gray-900 font-mono text-sm">{channel.affiliate_code}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="font-medium text-gray-900">📝 Create New Post</div>
                        <div className="text-sm text-gray-500">Manually create and publish content</div>
                      </button>
                      <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="font-medium text-gray-900">📅 Schedule Post</div>
                        <div className="text-sm text-gray-500">Plan content for later publication</div>
                      </button>
                      <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="font-medium text-gray-900">📊 View Analytics</div>
                        <div className="text-sm text-gray-500">Check performance metrics</div>
                      </button>
                      <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="font-medium text-gray-900">👥 Manage Subscribers</div>
                        <div className="text-sm text-gray-500">View and manage channel members</div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Content Management - Main Functionality */}
            {activeTab === 'content' && (
              <div className="space-y-6">
                {/* Create New Post */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Create New Content</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {CONTENT_TYPES.filter(ct => channel?.content_types.includes(ct.value)).map(contentType => (
                      <button
                        key={contentType.value}
                        onClick={() => handleCreateContent(contentType.value)}
                        className="p-4 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-center"
                      >
                        <div className="text-2xl mb-2">{contentType.icon}</div>
                        <div className="text-sm font-medium text-blue-900">{contentType.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-2xl font-bold text-gray-900">{stats.postsToday}</div>
                    <div className="text-sm text-gray-500">Posts Today</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-2xl font-bold text-gray-900">{stats.postsThisWeek}</div>
                    <div className="text-sm text-gray-500">This Week</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-2xl font-bold text-gray-900">{channel?.total_posts_sent || 0}</div>
                    <div className="text-sm text-gray-500">Total Posts</div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-2xl font-bold text-gray-900">{channel?.member_count || 0}</div>
                    <div className="text-sm text-gray-500">Members</div>
                  </div>
                </div>

                {/* Recent Posts */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Posts</h3>
                    <button
                      onClick={() => setActiveTab('create')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      + Create Post
                    </button>
                  </div>

                  <div className="space-y-4">
                    {recentPosts.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <div className="text-gray-400 text-4xl mb-2">📝</div>
                        <p className="text-gray-500">No posts yet. Create your first post!</p>
                      </div>
                    ) : (
                      recentPosts.map(post => (
                        <div key={post.id} className="border border-gray-200 rounded-lg p-6">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">{post.title}</h4>
                              <p className="text-gray-600 text-sm mb-2">{post.content}</p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span className="flex items-center">
                                  {CONTENT_TYPES.find(ct => ct.value === post.post_type)?.icon} {post.post_type}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  post.status === 'published' ? 'bg-green-100 text-green-700' :
                                  post.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {post.status}
                                </span>
                                <span>{getTimeAgo(post.posted_at || post.created_at)}</span>
                              </div>
                            </div>
                            <div className="flex space-x-2 ml-4">
                              <button 
                                onClick={() => handleEditPost(post.id)}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeletePost(post.id)}
                                className="text-red-600 hover:text-red-700 text-sm font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          {post.engagement_stats && (
                            <div className="flex items-center space-x-4 text-sm text-gray-500 pt-3 border-t border-gray-100">
                              <span>👁️ {post.engagement_stats.views}</span>
                              <span>❤️ {post.engagement_stats.reactions}</span>
                              <span>📤 {post.engagement_stats.shares}</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Create Content Tab */}
            {activeTab === 'create' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Create New Post</h3>
                <CreatePostForm 
                  channel={channel} 
                  onSuccess={() => {
                    setActiveTab('content')
                    loadData() // Refresh posts
                  }}
                  onCancel={() => setActiveTab('content')}
                />
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Channel Settings</h3>
                
                {errors.general && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-red-800">{errors.general}</div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Channel Name
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="py-2 text-gray-900">{channel.name}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language
                    </label>
                    <div className="py-2 text-gray-900">{getLanguageDisplay(channel.language)}</div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    {editing ? (
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="py-2 text-gray-900">{channel.description || 'No description provided'}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Posts Per Day
                    </label>
                    {editing ? (
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={formData.max_posts_per_day}
                        onChange={(e) => handleInputChange('max_posts_per_day', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="py-2 text-gray-900">{channel.max_posts_per_day}</div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Post Frequency (hours)
                    </label>
                    {editing ? (
                      <input
                        type="number"
                        min="1"
                        max="24"
                        value={formData.post_frequency_hours}
                        onChange={(e) => handleInputChange('post_frequency_hours', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="py-2 text-gray-900">{channel.post_frequency_hours}</div>
                    )}
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Affiliate Code
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.affiliate_code}
                        onChange={(e) => handleInputChange('affiliate_code', e.target.value)}
                        placeholder="Enter affiliate code"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="py-2 text-gray-900 font-mono">
                        {channel.affiliate_code || 'No affiliate code set'}
                      </div>
                    )}
                  </div>

                  <div className="col-span-2 space-y-3">
                    <div className="flex items-center">
                      {editing ? (
                        <input
                          type="checkbox"
                          checked={formData.auto_post_enabled}
                          onChange={(e) => handleInputChange('auto_post_enabled', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      ) : (
                        <div className={`w-4 h-4 rounded ${channel.auto_post_enabled ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                      )}
                      <label className="ml-2 text-sm text-gray-700">
                        Enable automatic posting
                      </label>
                    </div>

                    <div className="flex items-center">
                      {editing ? (
                        <input
                          type="checkbox"
                          checked={formData.is_active}
                          onChange={(e) => handleInputChange('is_active', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      ) : (
                        <div className={`w-4 h-4 rounded ${channel.is_active ? 'bg-green-600' : 'bg-red-600'}`}></div>
                      )}
                      <label className="ml-2 text-sm text-gray-700">
                        Channel is active
                      </label>
                    </div>
                  </div>
                </div>

                {editing && (
                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <button
                      onClick={() => setEditing(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className={`px-4 py-2 bg-blue-600 text-white rounded-lg font-medium transition-colors ${
                        loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                      }`}
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Analytics & Performance</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-4">Engagement Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Average Views per Post:</span>
                        <span className="font-semibold">1,413</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Average Reactions:</span>
                        <span className="font-semibold">52</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Average Shares:</span>
                        <span className="font-semibold">18</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Engagement Rate:</span>
                        <span className="font-semibold text-green-600">4.9%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-4">Growth Statistics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Member Growth (30d):</span>
                        <span className="font-semibold text-green-600">+{stats.memberGrowth}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">New Members This Week:</span>
                        <span className="font-semibold">127</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Retention Rate:</span>
                        <span className="font-semibold">87.3%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Active Members:</span>
                        <span className="font-semibold">2,341</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-4">Content Performance</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {CONTENT_TYPES.filter(ct => channel.content_types.includes(ct.value)).map(type => (
                      <div key={type.value} className="text-center">
                        <div className="text-2xl mb-1">{type.icon}</div>
                        <div className="text-sm font-medium text-gray-900">{type.label}</div>
                        <div className="text-xs text-gray-500">
                          {Math.floor(Math.random() * 50) + 10} posts
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-gray-400 mb-2">
                    📊
                  </div>
                  <p className="text-gray-500">Detailed analytics charts will be displayed here</p>
                  <p className="text-sm text-gray-400">Charts showing views, engagement, and growth over time</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 