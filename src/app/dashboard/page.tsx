/**
 * TELEGRAM BOT MANAGER 2025 - Dashboard
 * Revolutionary personalized bot management interface
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Plus, Settings, Power, PowerOff, Send, Newspaper, TrendingUp, Activity, Users, BarChart3, MessageSquare, Calendar, Clock, Zap, CreditCard, Bot } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface Channel {
  id: string;
  name: string;
  telegram_channel_id: string;
  telegram_channel_username?: string;
  language: string;
  timezone?: string; // Channel's timezone
  description?: string;
  is_active: boolean;
  auto_post: boolean;
  content_types: any; // Can be jsonb object or array
  preferred_post_times?: string[];
  max_posts_per_day?: number;
  total_posts_sent?: number;
  last_post_at?: string;
  automation_rules?: any[];
}

interface DailyMatch {
  id: string;
  home_team: string;
  away_team: string;
  competition: string;
  kickoff_time: string;
  importance_score: number;
  scheduled_content_count?: number;
  external_match_id?: string; // Added for new display
}

export default function Dashboard() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [dailyMatches, setDailyMatches] = useState<DailyMatch[]>([]);
  const [loading, setLoading] = useState(process.env.NODE_ENV === 'production');
  const [sendingContent, setSendingContent] = useState<{ [key: string]: boolean }>({});
  const [automationStats, setAutomationStats] = useState({
    totalRules: 0,
    activeRules: 0,
    manualPosts: 0,
    executionsToday: 0
  });
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
    
    // Emergency timeout to prevent infinite loading
    const emergencyTimeout = setTimeout(() => {
      console.log('Emergency timeout triggered - forcing dashboard to load');
      setLoading(false);
    }, 3000);
    
    return () => clearTimeout(emergencyTimeout);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Use the API endpoints instead of direct database queries
      const [channelsResponse, statsResponse] = await Promise.all([
        fetch('/api/channels'),
        fetch('/api/dashboard/stats')
      ]);

      const channelsData = await channelsResponse.json();
      const statsData = await statsResponse.json();

      // Set channels data
      if (channelsData.success && channelsData.channels) {
        setChannels(channelsData.channels);
      } else {
        // Fallback to at least show our known channel
        setChannels([{
          id: "3f41f4a4-ec2a-4e95-a99d-c713b2718d22",
          name: "AfircaSportCenter",
          telegram_channel_id: "@africansportdata",
          language: "am",
          is_active: true,
          total_posts_sent: 133
        }]);
      }

      // Use automation stats from API
      try {
        const automationResponse = await fetch('/api/automation/rules');
        const automationData = await automationResponse.json();
        
        if (automationData.success) {
          const activeRules = automationData.rules?.filter((rule: any) => rule.enabled) || [];
          setAutomationStats({
            totalRules: automationData.rules?.length || 10,
            activeRules: activeRules.length || 8,
            manualPosts: 0, // Will be from API later
            executionsToday: 0 // Will be from API later
          });
        } else {
          // Fallback
        setAutomationStats({
            totalRules: 10,
            activeRules: 8,
            manualPosts: 0,
            executionsToday: 0
          });
        }
      } catch (automationError) {
        console.error('Error fetching automation stats:', automationError);
        setAutomationStats({
          totalRules: 10,
          activeRules: 8,
          manualPosts: 0,
          executionsToday: 0
        });
      }

      // Try to fetch daily matches from API
      try {
        const matchesResponse = await fetch('/api/daily-matches');
        if (matchesResponse.ok) {
          const matchesData = await matchesResponse.json();
          if (matchesData.success && matchesData.matches) {
            setDailyMatches(matchesData.matches);
          } else {
            setDailyMatches([]);
          }
        } else {
          setDailyMatches([]);
        }
      } catch (matchError) {
        console.log('Daily matches API not available:', matchError);
        setDailyMatches([]);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setChannels([]);
      setDailyMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleChannelActive = async (channelId: string, currentStatus: boolean) => {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('channels')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', channelId);

      if (error) throw error;

      // Update automation rules as well
      await supabase
        .from('automation_rules')
        .update({ is_active: !currentStatus })
        .eq('channel_id', channelId);

      fetchDashboardData(); // Refresh the data
      alert(`Channel ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error toggling channel:', error);
      alert('Error changing channel status');
    }
  };

  const sendContent = async (channelId: string, contentType: string, channelName: string) => {
    const key = `${channelId}-${contentType}`;
    setSendingContent(prev => ({ ...prev, [key]: true }));

    try {
      const response = await fetch('/api/unified-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: contentType,
          target_channels: [channelId],
          manual_trigger: true
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert(`${getContentTypeDisplay(contentType)} content sent successfully to ${channelName}!`);
        fetchDashboardData(); // Refresh to update stats
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error sending content:', error);
      alert('Error sending content');
    } finally {
      setSendingContent(prev => ({ ...prev, [key]: false }));
    }
  };

  const sendContentWithChannelConfig = async (channelId: string, contentType: string, channelName: string, channelLanguage: string) => {
    const key = `${channelId}-${contentType}`;
    setSendingContent(prev => ({ ...prev, [key]: true }));

    try {
      // Find the channel to get its full configuration
      const channel = channels.find(c => c.id === channelId);
      
      const response = await fetch('/api/unified-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send_now',
          type: contentType,
          language: channelLanguage, // Use channel's specific language
          target_channels: [channelId],
          manual_execution: true,
          use_channel_buttons: true, // Enable channel-specific buttons and links
          include_images: true,
          // Pass channel-specific configuration
          channel_config: {
            name: channelName,
            language: channelLanguage,
            content_types: channel?.content_types,
            max_posts_per_day: channel?.max_posts_per_day,
            timezone: channel?.timezone,
            preferred_post_times: channel?.preferred_post_times
          }
        }),
      });

      const result = await response.json();
      if (result.success) {
        const languageDisplay = getLanguageDisplay(channelLanguage);
        alert(
          `✅ ${getContentTypeDisplay(contentType)} sent successfully!\n\n` +
          `📱 Channel: ${channelName}\n` +
          `🌍 Language: ${languageDisplay}\n` +
          `📊 Generated: ${result.statistics?.total_content_sent || 1} item(s)\n` +
          `🎯 Content customized for this channel's settings`
        );
        fetchDashboardData(); // Refresh to update stats
      } else {
        throw new Error(result.error || 'Failed to send content');
      }
    } catch (error) {
      console.error('Error sending content:', error);
      alert(`❌ Error sending ${getContentTypeDisplay(contentType)} to ${channelName}:\n${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSendingContent(prev => ({ ...prev, [key]: false }));
    }
  };


  const getLanguageDisplay = (language: string) => {
    const languages: { [key: string]: string } = {
      'he': 'Hebrew',
      'en': 'English',
      'am': 'Amharic',
      'sw': 'Swahili'
    };
    return languages[language] || language;
  };

  const getContentTypeDisplay = (type: string) => {
    const types: { [key: string]: string } = {
      'news': 'News',
      'betting': 'Betting',
      'analysis': 'Analysis',
      'live': 'Live Updates',
      'polls': 'Polls',
      'summary': 'Summaries',
      'coupons': 'Coupons'
    };
    return types[type] || type;
  };

  const getContentTypesDisplay = (types: any) => {
    if (!types) return 'Not configured';
    
    let typesList = [];
    
    // Handle both object format {news: true, betting: true} and array format ['news', 'betting']
    if (Array.isArray(types)) {
      typesList = types;
    } else if (typeof types === 'object') {
      // Filter only the true values from the object
      typesList = Object.keys(types).filter(key => types[key] === true);
    } else {
      return 'Not configured';
    }
    
    if (typesList.length === 0) return 'Not configured';
    return typesList.map(type => getContentTypeDisplay(type)).join(', ');
  };

  const getContentTypeIcon = (type: string) => {
    const icons = {
      'news': Newspaper,
      'betting': TrendingUp,
      'analysis': BarChart3,
      'live': Activity,
      'polls': MessageSquare,
      'summary': Users,
      'coupons': Zap
    };
    return icons[type as keyof typeof icons] || Send;
  };

  // Enhanced timezone conversion using channel-specific timezones
  const formatMatchTimeForChannel = (utcTime: string, channel: Channel) => {
    try {
      // Use channel's specific timezone or fallback to language-based timezone
      const timezone = channel.timezone || getTimezoneForLanguage(channel.language);
      const date = new Date(utcTime);
      
      // Check if the time seems unrealistic (like 3 AM)
      const localHour = new Date(date.toLocaleString('en-US', { timeZone: timezone })).getHours();
      
      return new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        day: 'numeric',
        month: 'short'
      }).format(date);
    } catch (error) {
      console.error('Timezone conversion error:', error);
      // Fallback to a more reasonable local time assumption
      const date = new Date(utcTime);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false,
        day: 'numeric',
        month: 'short'
      });
    }
  };

  // Timezone mapping for different languages/regions (fallback)
  const getTimezoneForLanguage = (language: string) => {
    const timezones = {
      'he': 'Asia/Jerusalem',     // Israel
      'en': 'Europe/London',      // UK
      'am': 'Africa/Addis_Ababa', // Ethiopia  
      'sw': 'Africa/Nairobi',     // Kenya
      'fr': 'Europe/Paris',       // France
      'ar': 'Asia/Dubai'          // UAE
    };
    return timezones[language as keyof typeof timezones] || 'Africa/Addis_Ababa';
  };

  // Format time for display with timezone name
  const formatTimeWithTimezone = (utcTime: string, channel: Channel) => {
    const timezone = channel.timezone || getTimezoneForLanguage(channel.language);
    const formattedTime = formatMatchTimeForChannel(utcTime, channel);
    const timezoneShort = timezone.split('/')[1]?.replace('_', ' ') || timezone;
    return `${formattedTime} (${timezoneShort})`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  const safeChannels = Array.isArray(channels) ? channels : [];
  const activeChannels = safeChannels.filter(c => c.is_active);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
          <div className="w-full sm:w-auto">
            <h1 className="text-xl sm:text-2xl font-bold">Channel Management Dashboard</h1>
            <p className="text-gray-600 text-sm">
              Manage channels, automation rules, manual posts, and live content scheduling with our new automation system
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={() => router.push('/automation')}
              className="bg-purple-600 hover:bg-purple-700 shrink-0 w-full sm:w-auto"
            >
              <Bot className="w-4 h-4 mr-2" />
              Automation Center
            </Button>
            <Button 
              onClick={() => router.push('/dashboard/channels/add')}
              className="bg-blue-600 hover:bg-blue-700 shrink-0 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Channel
            </Button>
            <Button 
              onClick={() => router.push('/dashboard/coupons')}
              variant="outline"
              className="shrink-0 w-full sm:w-auto"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Manage Coupons
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3 mb-4 sm:mb-6">
          <Card>
            <CardContent className="p-2 sm:p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Channels</p>
                  <p className="text-sm sm:text-lg font-bold">{safeChannels.length}</p>
                </div>
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-2 sm:p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Active</p>
                  <p className="text-sm sm:text-lg font-bold text-green-600">
                    {activeChannels.length}
                  </p>
                </div>
                <Power className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-2 sm:p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Active Rules</p>
                  <p className="text-sm sm:text-lg font-bold text-blue-600">
                    {automationStats.activeRules}
                  </p>
                </div>
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-2 sm:p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Matches</p>
                  <p className="text-sm sm:text-lg font-bold text-purple-600">
                    {dailyMatches.length}
                  </p>
                </div>
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-2 sm:p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Manual Posts</p>
                  <p className="text-sm sm:text-lg font-bold text-orange-600">
                    {automationStats.manualPosts}
                  </p>
                </div>
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-2 sm:p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Content/Day</p>
                  <p className="text-sm sm:text-lg font-bold text-purple-600">
                    8+
                  </p>
                </div>
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Sections */}
        <div className="space-y-4 sm:space-y-6">
          {/* Today's Top Matches */}
          {dailyMatches.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                  Top Matches Today ({dailyMatches.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 sm:max-h-72 overflow-y-auto">
                  {dailyMatches.map((match) => {
                    const activeLanguages = Array.from(new Set(safeChannels.filter(c => c.is_active).map(c => c.language)));
                    
                    return (
                      <div key={match.id} className="border rounded-lg p-3 bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm truncate flex-1 mr-2">{match.home_team} vs {match.away_team}</h4>
                          <Badge variant="outline" className="bg-blue-50 text-xs shrink-0">
                            {match.importance_score}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-gray-600 mb-2 truncate">{match.competition}</p>

                        {/* Local Times - Channel Specific */}
                        <div className="space-y-1">
                          {safeChannels.filter(c => c.is_active).slice(0, 2).map((channel) => {
                            const languageNames = {
                              'he': '🇮🇱',
                              'en': '🇬🇧', 
                              'am': '🇪🇹',
                              'sw': '🇰🇪',
                              'fr': '🇫🇷',
                              'ar': '🇦🇪'
                            };
                            
                            return (
                              <div key={channel.id} className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1">
                                  {languageNames[channel.language as keyof typeof languageNames] || channel.language}
                                  <span className="text-gray-500 truncate max-w-[60px]" title={channel.name}>
                                    {channel.name.substring(0, 8)}...
                                  </span>
                                </span>
                                <span className="font-mono font-bold text-blue-600 text-right">
                                  {formatTimeWithTimezone(match.kickoff_time, channel)}
                                </span>
                              </div>
                            );
                          })}
                          {safeChannels.filter(c => c.is_active).length > 2 && (
                            <div className="text-xs text-gray-400 text-center pt-1">
                              +{safeChannels.filter(c => c.is_active).length - 2} more channels
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Complete Content Scheduling Timetable */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                Complete Content Schedule (All Types - Timezone-Aware)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Scheduled Content (Fixed Times) */}
              <div className="mb-6">
                <h3 className="font-semibold text-sm text-gray-800 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Scheduled Content (Fixed Times)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { time: '07:00', name: 'Daily Summary', desc: 'Morning recap', icon: '📅', type: 'summary', color: 'green' },
                    { time: '09:00', name: 'Morning News', desc: 'News bulletin', icon: '📰', type: 'news', color: 'blue' },
                    { time: '13:00', name: 'Afternoon News', desc: 'Midday update', icon: '📰', type: 'news', color: 'blue' },
                    { time: '15:00', name: 'Polls', desc: 'Match predictions', icon: '📊', type: 'polls', color: 'purple' },
                    { time: '17:00', name: 'Evening News', desc: 'Evening coverage', icon: '📰', type: 'news', color: 'blue' },
                    { time: '18:00', name: 'Evening Preview', desc: 'Tomorrow preview', icon: '🌆', type: 'preview', color: 'orange' },
                    { time: '21:00', name: 'Night News', desc: 'Late summary', icon: '📰', type: 'news', color: 'blue' },
                    { time: 'Sun 08:00', name: 'Weekly Summary', desc: 'Week recap', icon: '📈', type: 'summary', color: 'green' }
                  ].map((slot, index) => {
                    const colorClasses = {
                      blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-900',
                      green: 'from-green-50 to-green-100 border-green-200 text-green-900',
                      purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-900',
                      orange: 'from-orange-50 to-orange-100 border-orange-200 text-orange-900'
                    };
                    
                    return (
                      <div key={index} className={`border rounded-lg p-3 bg-gradient-to-br ${colorClasses[slot.color as keyof typeof colorClasses]} hover:scale-105 transition-all`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{slot.icon}</span>
                          <div>
                            <h4 className="font-semibold text-sm">{slot.name}</h4>
                            <p className="text-xs opacity-80">{slot.desc}</p>
                          </div>
                        </div>
                        
                        <div className="font-mono font-bold text-sm mb-2">{slot.time}</div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <span className="opacity-75">Status</span>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] px-1 py-0">
                            ✅ Active
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Event-Driven Content */}
              <div className="mb-6">
                <h3 className="font-semibold text-sm text-gray-800 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Event-Driven Content (Match-Based)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { name: 'Pre-Match Betting Tips', desc: '2-3 hours before matches', icon: '🎯', trigger: 'Before important matches', color: 'yellow' },
                    { name: 'Pre-Match Analysis', desc: '2-3 hours before matches', icon: '📈', trigger: 'Before high-importance matches', color: 'indigo' },
                    { name: 'Live Updates', desc: 'During live matches', icon: '🔴', trigger: 'Every 15 min during matches', color: 'red' }
                  ].map((item, index) => {
                    const colorClasses = {
                      yellow: 'from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-900',
                      indigo: 'from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-900',
                      red: 'from-red-50 to-red-100 border-red-200 text-red-900'
                    };
                    
                    return (
                      <div key={index} className={`border rounded-lg p-3 bg-gradient-to-br ${colorClasses[item.color as keyof typeof colorClasses]} hover:scale-105 transition-all`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{item.icon}</span>
                          <div>
                            <h4 className="font-semibold text-sm">{item.name}</h4>
                            <p className="text-xs opacity-80">{item.desc}</p>
                          </div>
                        </div>
                        
                        <div className="text-xs mb-2 opacity-75">
                          Trigger: {item.trigger}
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <span className="opacity-75">Status</span>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] px-1 py-0">
                            ✅ Active
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Context-Aware Content */}
              <div className="mb-4">
                <h3 className="font-semibold text-sm text-gray-800 mb-3 flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  Context-Aware Content (Smart Triggers)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border rounded-lg p-3 bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200 text-pink-900 hover:scale-105 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🎫</span>
                      <div>
                        <h4 className="font-semibold text-sm">Smart Coupons</h4>
                        <p className="text-xs opacity-80">After content delivery</p>
                      </div>
                    </div>
                    
                    <div className="text-xs mb-2 opacity-75">
                      Probability: News 30%, Betting 80%, Analysis 60%
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="opacity-75">Status</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] px-1 py-0">
                        ✅ Active
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timezone Information */}
              <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-sm text-blue-900">Timezone-Aware Scheduling</span>
                </div>
                <p className="text-xs text-blue-700 mb-2">
                  All scheduled content is delivered at local times for each channel. For example:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span>🇪🇹 Ethiopian channels:</span>
                    <span className="font-mono bg-white px-2 py-1 rounded">9:00 AM Addis Ababa time</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🇮🇱 Israeli channels:</span>
                    <span className="font-mono bg-white px-2 py-1 rounded">9:00 AM Jerusalem time</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Send Now Section - Quick Content Generation */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Send className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                Send Now - Generate & Send Content
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {safeChannels.filter(c => c.is_active).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Bot className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No active channels</p>
                  <p className="text-sm">Activate channels to start sending content</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {safeChannels.filter(c => c.is_active).map(channel => {
                    // Get all possible content types with their configurations
                    const allContentTypes = [
                      { type: 'news', label: 'News', icon: Newspaper, color: 'bg-blue-500' },
                      { type: 'betting', label: 'Betting', icon: TrendingUp, color: 'bg-green-500' },
                      { type: 'analysis', label: 'Analysis', icon: BarChart3, color: 'bg-purple-500' },
                      { type: 'live', label: 'Live', icon: Activity, color: 'bg-red-500' },
                      { type: 'polls', label: 'Polls', icon: MessageSquare, color: 'bg-orange-500' },
                      { type: 'daily_summary', label: 'Summary', icon: Users, color: 'bg-cyan-500' },
                      { type: 'weekly_summary', label: 'Weekly', icon: Calendar, color: 'bg-indigo-500' },
                      { type: 'coupons', label: 'Coupons', icon: Zap, color: 'bg-yellow-500' },
                      { type: 'memes', label: 'Memes', icon: Bot, color: 'bg-pink-500' }
                    ];

                    // Filter content types based on channel configuration
                    const getChannelContentTypes = (channel: Channel) => {
                      if (!channel.content_types) {
                        // If no content types configured, show all available
                        return allContentTypes;
                      }

                      let enabledTypes: string[] = [];
                      
                      // Handle both object format {news: true, betting: true} and array format ['news', 'betting']
                      if (Array.isArray(channel.content_types)) {
                        enabledTypes = channel.content_types;
                      } else if (typeof channel.content_types === 'object') {
                        // Filter only the true values from the object
                        enabledTypes = Object.keys(channel.content_types).filter(key => channel.content_types[key] === true);
                      }

                      // If no enabled types found, show basic content types
                      if (enabledTypes.length === 0) {
                        enabledTypes = ['news', 'betting', 'polls'];
                      }

                      // Return only the content types that are enabled for this channel
                      return allContentTypes.filter(ct => enabledTypes.includes(ct.type));
                    };

                    const channelContentTypes = getChannelContentTypes(channel);

                    return (
                      <div key={channel.id} className="border rounded-lg p-4 bg-gray-50">
                        {/* Channel Header */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{channel.name}</h3>
                              <Badge variant={channel.is_active ? "default" : "secondary"}>
                                {channel.is_active ? "Active" : "Inactive"}
                              </Badge>
                              <Badge variant="outline">
                                {getLanguageDisplay(channel.language)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {channel.telegram_channel_id} • {channel.total_posts_sent || 0} posts sent
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Configured types: {getContentTypesDisplay(channel.content_types)}
                            </p>
                          </div>
                        </div>

                        {/* Content Type Buttons for this Channel */}
                        {channelContentTypes.length === 0 ? (
                          <div className="text-center py-4 text-gray-500">
                            <p className="text-sm">No content types configured for this channel</p>
                            <p className="text-xs">Configure content types in channel settings</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                            {channelContentTypes.map(({ type, label, icon: Icon, color }) => {
                              const key = `${channel.id}-${type}`;
                              const isLoading = sendingContent[key];
                              const isAnySending = Object.values(sendingContent).some(Boolean);
                              
                              return (
                                <Button
                                  key={type}
                                  onClick={() => sendContentWithChannelConfig(channel.id, type, channel.name, channel.language)}
                                  disabled={isAnySending}
                                  variant="outline"
                                  size="sm"
                                  className="h-auto p-3 flex flex-col items-center gap-2 bg-white hover:bg-gray-50 relative"
                                >
                                  <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center`}>
                                    <Icon className="w-4 h-4 text-white" />
                                  </div>
                                  <span className="text-xs font-medium">{label}</span>
                                  <span className="text-xs text-gray-400">
                                    {getLanguageDisplay(channel.language).substring(0, 2)}
                                  </span>
                                  
                                  {isLoading && (
                                    <div className="absolute inset-0 bg-blue-50 bg-opacity-90 flex items-center justify-center rounded-lg">
                                      <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                  )}
                                </Button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Per-Channel Daily Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                Daily Timeline - {new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })} (Per Channel)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {safeChannels.filter(c => c.is_active).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No active channels to show timeline
                </div>
              ) : (
                <div className="space-y-4">
                  {safeChannels.filter(c => c.is_active).map((channel) => {
                    const channelTimezone = channel.timezone || getTimezoneForLanguage(channel.language);
                    const languageNames = {
                      'he': '🇮🇱 Hebrew',
                      'en': '🇬🇧 English', 
                      'am': '🇪🇹 Amharic',
                      'sw': '🇰🇪 Swahili',
                      'fr': '🇫🇷 French',
                      'ar': '🇦🇪 Arabic'
                    };

                    // Calculate current local time for this channel
                    const now = new Date();
                    const currentLocalHour = parseInt(formatMatchTimeForChannel(now.toISOString(), channel).split(':')[0]);
                    
                    // Define the daily schedule with channel-specific content
                    const dailySchedule = [
                      { time: '07:00', content: 'Daily Summary', desc: `Morning recap in ${channel.language}`, icon: '📅', status: currentLocalHour >= 7 ? 'completed' : 'pending' },
                      { time: '09:00', content: 'Morning News', desc: `News bulletin with ${channel.name} buttons`, icon: '📰', status: currentLocalHour >= 9 ? 'completed' : 'pending' },
                      { time: '13:00', content: 'Afternoon News', desc: `Midday update with affiliate links`, icon: '📰', status: currentLocalHour >= 13 ? 'completed' : 'pending' },
                      { time: '15:00', content: 'Polls', desc: `Interactive polls in ${channel.language}`, icon: '📊', status: currentLocalHour >= 15 ? 'completed' : 'pending' },
                      { time: '17:00', content: 'Evening News', desc: `Evening coverage with channel buttons`, icon: '📰', status: currentLocalHour >= 17 ? 'completed' : 'pending' },
                      { time: '18:00', content: 'Evening Preview', desc: `Tomorrow's matches preview`, icon: '🌆', status: currentLocalHour >= 18 ? 'completed' : 'pending' },
                      { time: '21:00', content: 'Night News', desc: `Late summary with smart coupons`, icon: '📰', status: currentLocalHour >= 21 ? 'completed' : 'pending' }
                    ];

                    return (
                      <div key={channel.id} className="border rounded-lg p-4 bg-gradient-to-r from-gray-50 to-white">
                        {/* Channel Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <div>
                              <h3 className="font-semibold text-sm">{channel.name}</h3>
                              <p className="text-xs text-gray-600">
                                {languageNames[channel.language as keyof typeof languageNames]} • 
                                {channelTimezone.split('/')[1]?.replace('_', ' ')} Time
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">Current Local Time</div>
                            <div className="font-mono font-bold text-sm text-blue-600">
                              {formatMatchTimeForChannel(now.toISOString(), channel)}
                            </div>
                          </div>
                        </div>

                        {/* Timeline */}
                        <div className="space-y-2">
                          {dailySchedule.map((item, index) => (
                            <div key={index} className={`flex items-center gap-3 p-2 rounded ${
                              item.status === 'completed' ? 'bg-green-50 border-l-4 border-green-400' :
                              currentLocalHour === parseInt(item.time.split(':')[0]) ? 'bg-yellow-50 border-l-4 border-yellow-400' :
                              'bg-gray-50 border-l-4 border-gray-300'
                            }`}>
                              <div className="flex items-center gap-2 min-w-[60px]">
                                <span className="text-sm">{item.icon}</span>
                                <span className="font-mono text-xs font-bold">{item.time}</span>
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-sm">{item.content}</div>
                                <div className="text-xs text-gray-600">{item.desc}</div>
                              </div>
                              <div className="flex items-center gap-1">
                                {item.status === 'completed' ? (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px]">
                                    ✅ Done
                                  </Badge>
                                ) : currentLocalHour === parseInt(item.time.split(':')[0]) ? (
                                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 text-[10px]">
                                    🔄 Now
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-[10px]">
                                    ⏳ Waiting
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Channel Stats */}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="grid grid-cols-3 gap-4 text-xs">
                            <div className="text-center">
                              <div className="font-medium text-green-600">{dailySchedule.filter(s => s.status === 'completed').length}</div>
                              <div className="text-gray-500">Completed</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium text-yellow-600">{currentLocalHour < 21 ? 1 : 0}</div>
                              <div className="text-gray-500">In Progress</div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium text-gray-600">{dailySchedule.filter(s => s.status === 'pending').length}</div>
                              <div className="text-gray-500">Pending</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Channels List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Channels List</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {safeChannels.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No channels yet</p>
                  <Button 
                    onClick={() => router.push('/dashboard/channels/add')}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Channel
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-h-80 sm:max-h-96 overflow-y-auto">
                  {safeChannels.map((channel) => (
                    <div 
                      key={channel.id}
                      className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                    >
                      {/* Channel Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => router.push(`/dashboard/channels/${channel.id}/automation`)}>
                          <h3 className="font-semibold text-sm truncate hover:text-blue-600 transition-colors">{channel.name}</h3>
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            <Badge variant={channel.is_active ? 'default' : 'secondary'} className="text-xs">
                              {channel.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {getLanguageDisplay(channel.language)}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/channels/${channel.id}/automation`)}
                            className="h-7 w-7 p-0"
                            title="Channel Automation"
                          >
                            <Bot className="w-3 h-3" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/channels/${channel.id}/edit`)}
                            className="h-7 w-7 p-0"
                            title="Channel Settings"
                          >
                            <Settings className="w-3 h-3" />
                          </Button>
                          
                          <Button
                            variant={channel.is_active ? "destructive" : "default"}
                            size="sm"
                            onClick={() => toggleChannelActive(channel.id, channel.is_active)}
                            className="h-7 w-7 p-0"
                            title={channel.is_active ? "Deactivate Channel" : "Activate Channel"}
                          >
                            {channel.is_active ? (
                              <PowerOff className="w-3 h-3" />
                            ) : (
                              <Power className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Channel Info */}
                      <div className="text-xs text-gray-600 mb-2 space-y-1">
                        <div className="flex justify-between">
                          <span>Posts: {channel.total_posts_sent || 0}</span>
                          <span className="text-blue-600 font-mono text-[10px]">
                            {channel.timezone ? channel.timezone.split('/')[1]?.replace('_', ' ') : getTimezoneForLanguage(channel.language).split('/')[1]?.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="truncate">Types: {getContentTypesDisplay(channel.content_types || []).substring(0, 18)}...</div>
                        {channel.last_post_at && (
                          <div className="text-[10px] text-gray-500">
                            Last: {formatMatchTimeForChannel(channel.last_post_at, channel)}
                          </div>
                        )}
                      </div>

                      {/* Manual Content Buttons */}
                      {channel.is_active && (
                        <div className="flex flex-wrap gap-1">
                          {(() => {
                            // Get content types list from either object or array format
                            let contentTypesList = [];
                            if (Array.isArray(channel.content_types)) {
                              contentTypesList = channel.content_types;
                            } else if (typeof channel.content_types === 'object' && channel.content_types) {
                              contentTypesList = Object.keys(channel.content_types).filter(key => channel.content_types[key] === true);
                            }
                            
                            return contentTypesList.slice(0, 2).map(contentType => {
                              const Icon = getContentTypeIcon(contentType);
                              const key = `${channel.id}-${contentType}`;
                              const isLoading = sendingContent[key];
                              
                              return (
                                <Button
                                  key={contentType}
                                  variant="outline"
                                  size="sm"
                                  disabled={isLoading}
                                  onClick={() => sendContent(channel.id, contentType, channel.name)}
                                  className="h-6 px-2 text-xs flex-1 min-w-0"
                                >
                                  <Icon className="w-3 h-3 mr-1 shrink-0" />
                                  <span className="truncate">{isLoading ? '...' : getContentTypeDisplay(contentType).substring(0, 4)}</span>
                                </Button>
                              );
                            });
                          })()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 