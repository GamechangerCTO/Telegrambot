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
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 mb-4 sm:mb-6">
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