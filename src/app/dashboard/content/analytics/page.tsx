'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

interface Analytics {
  totalPosts: number;
  postsToday: number;
  postsThisWeek: number;
  postsThisMonth: number;
  successRate: number;
  averageEngagement: number;
  topContentType: string;
  activeChannels: number;
  automationRuns: number;
  contentByType: { [key: string]: number };
  contentByLanguage: { [key: string]: number };
  dailyActivity: { date: string; posts: number }[];
  channelPerformance: { 
    channelName: string; 
    posts: number; 
    successRate: number; 
    language: string;
  }[];
}

interface AutomationLog {
  id: string;
  run_type: string;
  status: string;
  channels_updated: number;
  content_generated: number;
  duration_ms: number;
  error_message?: string;
  created_at: string;
}

export default function ContentAnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [automationLogs, setAutomationLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  // const [selectedMetric, setSelectedMetric] = useState<'posts' | 'engagement' | 'automation'>('posts');

  const supabase = createClient();

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      const now = new Date();
      const startDate = new Date(now);
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
      }

      // Get posts data
      const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .gte('created_at', startDate.toISOString());

      // Get channels data
      const { data: channels } = await supabase
        .from('channels')
        .select('id, name, language, total_posts_sent')
        .eq('is_active', true);

      // Get automation logs
      const { data: logs } = await supabase
        .from('automation_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      // Calculate analytics
      const today = new Date().toISOString().split('T')[0];
      const thisWeekStart = new Date(now.setDate(now.getDate() - now.getDay())).toISOString().split('T')[0];
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

      const postsToday = posts?.filter(p => p.created_at.startsWith(today)).length || 0;
      const postsThisWeek = posts?.filter(p => p.created_at >= thisWeekStart).length || 0;
      const postsThisMonth = posts?.filter(p => p.created_at >= thisMonthStart).length || 0;

      const sentPosts = posts?.filter(p => p.status === 'sent').length || 0;
      const successRate = posts?.length ? (sentPosts / posts.length) * 100 : 0;

      // Content by type
      const contentByType: { [key: string]: number } = {};
      posts?.forEach(post => {
        const type = post.type || 'unknown';
        contentByType[type] = (contentByType[type] || 0) + 1;
      });

      // Content by language
      const contentByLanguage: { [key: string]: number } = {};
      posts?.forEach(post => {
        const lang = post.language || 'unknown';
        contentByLanguage[lang] = (contentByLanguage[lang] || 0) + 1;
      });

      // Daily activity
      const dailyActivity: { date: string; posts: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const postsOnDate = posts?.filter(p => p.created_at.startsWith(dateStr)).length || 0;
        dailyActivity.push({ date: dateStr, posts: postsOnDate });
      }

      // Channel performance
      const channelPerformance = channels?.map(channel => {
        const channelPosts = posts?.filter(p => p.channel_id === channel.id) || [];
        const channelSentPosts = channelPosts.filter(p => p.status === 'sent').length;
        const channelSuccessRate = channelPosts.length ? (channelSentPosts / channelPosts.length) * 100 : 0;
        
        return {
          channelName: channel.name,
          posts: channelPosts.length,
          successRate: channelSuccessRate,
          language: channel.language
        };
      }) || [];

      const topContentType = Object.keys(contentByType).reduce((a, b) => 
        contentByType[a] > contentByType[b] ? a : b, 'none'
      );

      setAnalytics({
        totalPosts: posts?.length || 0,
        postsToday,
        postsThisWeek,
        postsThisMonth,
        successRate,
        averageEngagement: 0, // TODO: Calculate from engagement_stats
        topContentType,
        activeChannels: channels?.length || 0,
        automationRuns: logs?.length || 0,
        contentByType,
        contentByLanguage,
        dailyActivity,
        channelPerformance: channelPerformance.sort((a, b) => b.posts - a.posts)
      });

      setAutomationLogs(logs || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLanguageFlag = (language: string) => {
    switch (language) {
      case 'en': return '🇬🇧';
      case 'am': return '🇪🇹';
      case 'sw': return '🇹🇿';
      default: return '🌍';
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'live_update': return '⚽';
      case 'news': return '📰';
      case 'summary': return '📊';
      case 'betting_tip': return '🎯';
      case 'poll': return '📊';
      case 'coupon': return '🎟️';
      case 'lineup': return '👥';
      case 'trend': return '📈';
      default: return '📝';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Content Analytics & Performance</h1>
            <p className="text-purple-100">Track automation efficiency and content performance across channels</p>
          </div>
          <div className="flex space-x-3">
            {[
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: '90d', label: '90 Days' }
            ].map((range) => (
              <button
                key={range.id}
                onClick={() => setTimeRange(range.id as any)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  timeRange === range.id
                    ? 'bg-white text-purple-600'
                    : 'bg-purple-500 text-white hover:bg-purple-400'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Total Posts',
            value: analytics.totalPosts.toLocaleString(),
            change: `+${analytics.postsToday} today`,
            icon: '📝',
            color: 'bg-blue-50 text-blue-600'
          },
          {
            title: 'Success Rate',
            value: `${analytics.successRate.toFixed(1)}%`,
            change: analytics.successRate >= 90 ? 'Excellent' : analytics.successRate >= 75 ? 'Good' : 'Needs improvement',
            icon: '✅',
            color: analytics.successRate >= 90 ? 'bg-green-50 text-green-600' : analytics.successRate >= 75 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'
          },
          {
            title: 'Active Channels',
            value: analytics.activeChannels.toString(),
            change: 'Multi-language',
            icon: '📺',
            color: 'bg-purple-50 text-purple-600'
          },
          {
            title: 'Automation Runs',
            value: analytics.automationRuns.toString(),
            change: `${timeRange} period`,
            icon: '🤖',
            color: 'bg-indigo-50 text-indigo-600'
          }
        ].map((metric, index) => (
          <div key={index} className={`rounded-lg p-6 ${metric.color}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">{metric.title}</p>
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="text-sm opacity-70">{metric.change}</p>
              </div>
              <div className="text-2xl">{metric.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Daily Post Activity</h3>
          <div className="space-y-3">
            {analytics.dailyActivity.map((day, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{
                        width: `${Math.max((day.posts / Math.max(...analytics.dailyActivity.map(d => d.posts))) * 100, 5)}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{day.posts}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Types Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Content Types Distribution</h3>
          <div className="space-y-3">
                    {Object.entries(analytics.contentByType)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getContentTypeIcon(type)}</span>
                    <span className="text-sm text-gray-700 capitalize">
                      {type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{
                          width: `${(count / analytics.totalPosts) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Channel Performance */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Channel Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Channel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Posts Generated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Success Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.channelPerformance.map((channel, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span>{getLanguageFlag(channel.language)}</span>
                      <span className="text-sm font-medium text-gray-900">{channel.channelName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{channel.posts} posts</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{channel.successRate.toFixed(1)}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            channel.successRate >= 90 ? 'bg-green-500' :
                            channel.successRate >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                          }`} 
                          style={{
                            width: `${Math.max(channel.successRate, 5)}%`
                          }}
                        ></div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        channel.successRate >= 90 ? 'bg-green-100 text-green-800' :
                        channel.successRate >= 75 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {channel.successRate >= 90 ? 'Excellent' :
                         channel.successRate >= 75 ? 'Good' : 'Poor'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Automation Logs */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Recent Automation Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Results
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {automationLogs.slice(0, 10).map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {log.run_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.channels_updated} channels, {log.content_generated} posts
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDuration(log.duration_ms)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      log.status === 'success' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {log.status}
                    </span>
                    {log.error_message && (
                      <div className="text-xs text-red-600 mt-1 max-w-xs truncate">
                        {log.error_message}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {automationLogs.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-2">📊</div>
              <p className="text-gray-500">No automation logs in selected period</p>
            </div>
          )}
        </div>
      </div>

      {/* Content Languages */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Content by Language</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(analytics.contentByLanguage).map(([language, count]) => (
            <div key={language} className="text-center p-4 border rounded-lg">
              <div className="text-3xl mb-2">{getLanguageFlag(language)}</div>
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-sm text-gray-500">
                {language.toUpperCase()} Posts
              </div>
              <div className="text-xs text-gray-400">
                {((count / analytics.totalPosts) * 100).toFixed(1)}% of total
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 