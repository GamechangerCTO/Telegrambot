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
import { Plus, Settings, Power, PowerOff, Send, Newspaper, TrendingUp, Activity, Users, BarChart3, MessageSquare, Calendar, Clock, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface Channel {
  id: string;
  name: string;
  language: string;
  channel_id: string;
  description: string;
  is_active: boolean;
  auto_post_enabled: boolean;
  content_types: string[];
  automation_hours: number[];
  preferred_post_times: string[];
  smart_scheduling: boolean;
  max_posts_per_day: number;
  post_approval_required: boolean;
  push_notifications: boolean;
  total_posts_sent: number;
  last_content_sent: string;
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
}

export default function Dashboard() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [dailyMatches, setDailyMatches] = useState<DailyMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingContent, setSendingContent] = useState<{ [key: string]: boolean }>({});
  const router = useRouter();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const supabase = createClient();
      
      // Fetch channels with automation rules
      const { data: channelsData, error: channelsError } = await supabase
        .from('channels')
        .select(`
          *,
          automation_rules(
            id,
            name,
            content_types,
            is_active,
            priority
          )
        `)
        .order('name');

      if (channelsError) {
        console.error('Error fetching channels:', channelsError);
      } else {
        setChannels(Array.isArray(channelsData) ? channelsData : []);
      }

      // Fetch today's important matches
      const { data: matchesData, error: matchesError } = await supabase
        .from('daily_important_matches')
        .select(`
          *,
          scheduled_content:dynamic_content_schedule(count)
        `)
        .eq('discovery_date', new Date().toISOString().split('T')[0])
        .order('importance_score', { ascending: false });

      if (matchesError) {
        console.error('Error fetching daily matches:', matchesError);
      } else {
        setDailyMatches(Array.isArray(matchesData) ? matchesData : []);
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

  const getContentTypesDisplay = (types: string[]) => {
    if (!Array.isArray(types) || types.length === 0) return 'Not configured';
    return types.map(type => getContentTypeDisplay(type)).join(', ');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  const safeChannels = Array.isArray(channels) ? channels : [];
  const activeChannels = safeChannels.filter(c => c.is_active);
  const totalAutomationRules = safeChannels.reduce((sum, channel) => sum + (channel.automation_rules?.length || 0), 0);

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Channel Management Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage channels, automation rules, and daily match content
          </p>
        </div>
        <Button 
          onClick={() => router.push('/dashboard/channels/add')}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Channel
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Channels</p>
                <p className="text-2xl font-bold">{safeChannels.length}</p>
              </div>
              <Settings className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Channels</p>
                <p className="text-2xl font-bold text-green-600">
                  {activeChannels.length}
                </p>
              </div>
              <Power className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Automation Rules</p>
                <p className="text-2xl font-bold text-blue-600">
                  {totalAutomationRules}
                </p>
              </div>
              <Zap className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Matches</p>
                <p className="text-2xl font-bold text-purple-600">
                  {dailyMatches.length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Matches */}
      {dailyMatches.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Today's Important Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dailyMatches.map((match) => (
                <div key={match.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{match.home_team} vs {match.away_team}</h4>
                    <Badge variant="outline">Score: {match.importance_score}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{match.competition}</p>
                  <p className="text-sm text-gray-500">
                    <Clock className="w-4 h-4 inline mr-1" />
                    {new Date(match.kickoff_time).toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                  {match.scheduled_content_count && (
                    <p className="text-xs text-blue-600 mt-1">
                      {match.scheduled_content_count} content items scheduled
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Channels List */}
      <Card>
        <CardHeader>
          <CardTitle>Channels List</CardTitle>
        </CardHeader>
        <CardContent>
          {safeChannels.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No channels yet</p>
              <Button 
                onClick={() => router.push('/dashboard/channels/add')}
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Channel
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {safeChannels.map((channel) => (
                <div 
                  key={channel.id}
                  className="border rounded-lg p-6 hover:bg-gray-50"
                >
                  {/* Channel Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{channel.name}</h3>
                      <Badge variant={channel.is_active ? 'default' : 'secondary'}>
                        {channel.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">
                        {getLanguageDisplay(channel.language)}
                      </Badge>
                      {channel.smart_scheduling && (
                        <Badge variant="outline" className="bg-blue-50">
                          <Zap className="w-3 h-3 mr-1" />
                          Smart AI
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/channels/${channel.id}/edit`)}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant={channel.is_active ? "destructive" : "default"}
                        size="sm"
                        onClick={() => toggleChannelActive(channel.id, channel.is_active)}
                      >
                        {channel.is_active ? (
                          <PowerOff className="w-4 h-4" />
                        ) : (
                          <Power className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Channel Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Channel ID:</p>
                      <p className="font-mono text-sm">{channel.channel_id}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Posts Limit:</p>
                      <p className="text-sm">{channel.max_posts_per_day}/day</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Posts Sent:</p>
                      <p className="text-sm font-semibold">{channel.total_posts_sent || 0}</p>
                    </div>
                  </div>

                  {/* Automation Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Automation Hours:</p>
                      <p className="text-sm">{Array.isArray(channel.automation_hours) ? channel.automation_hours.join(', ') : 'Not configured'}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600 mb-1">Automation Rules:</p>
                      <p className="text-sm">{channel.automation_rules?.length || 0} active rules</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Content Types:</p>
                    <p className="text-sm">{getContentTypesDisplay(channel.content_types || [])}</p>
                  </div>

                  {/* Settings Badges */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {channel.auto_post_enabled && (
                      <Badge variant="outline" className="bg-green-50">Auto-Post</Badge>
                    )}
                    {channel.post_approval_required && (
                      <Badge variant="outline" className="bg-yellow-50">Approval Required</Badge>
                    )}
                    {channel.push_notifications && (
                      <Badge variant="outline" className="bg-blue-50">Notifications</Badge>
                    )}
                  </div>

                  {/* Manual Content Buttons */}
                  {channel.is_active && (
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium text-gray-700 mb-3">Send Manual Content:</p>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(channel.content_types) ? channel.content_types : []).map(contentType => {
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
                              className="flex items-center gap-2"
                            >
                              <Icon className="w-4 h-4" />
                              {isLoading ? 'Sending...' : getContentTypeDisplay(contentType)}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 