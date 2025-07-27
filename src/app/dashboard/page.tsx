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
import { Plus, Settings, Power, PowerOff, Send, Newspaper, TrendingUp, Activity, Users, BarChart3, MessageSquare } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface Channel {
  id: string;
  name: string;
  language: string;
  channel_id: string;
  is_active: boolean;
  content_types: string[];
  automation_hours: number[];
  last_content_sent: string;
}

export default function Dashboard() {
  const [channels, setChannels] = useState<Channel[]>([]); // ערך התחלתי: array ריק
  const [loading, setLoading] = useState(true);
  const [sendingContent, setSendingContent] = useState<{ [key: string]: boolean }>({});
  const router = useRouter();

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching channels:', error);
        setChannels([]); // וידוא שזה array ריק בשגיאה
      } else {
        setChannels(Array.isArray(data) ? data : []); // וידוא שזה array
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
      setChannels([]); // וידוא שזה array ריק בשגיאה
    } finally {
      setLoading(false);
    }
  };

  const toggleChannelActive = async (channelId: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/simple-automation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'toggle_automation',
          channelId: channelId
        }),
      });

      const result = await response.json();
      if (result.success) {
        fetchChannels(); // Refresh the list
        alert(result.message);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error toggling channel:', error);
      alert('Error changing channel status');
    }
  };

  const sendContent = async (channelId: string, contentType: string, channelName: string) => {
    const key = `${channelId}-${contentType}`;
    setSendingContent(prev => ({ ...prev, [key]: true }));

    try {
      const response = await fetch('/api/simple-automation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send_content',
          channelId: channelId,
          contentType: contentType
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert(`${getContentTypeDisplay(contentType)} content sent successfully to ${channelName}!`);
        fetchChannels(); // Refresh to update last_content_sent
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
      'summary': 'Summaries'
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
      'summary': Users
    };
    return icons[type as keyof typeof icons] || Send;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading channels...</div>
      </div>
    );
  }

  // וידוא נוסף שchannels הוא array
  const safeChannels = Array.isArray(channels) ? channels : [];

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Channel Management</h1>
          <p className="text-gray-600 mt-2">
            Manage all channels and automation settings in one place
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
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Channels</p>
                <p className="text-2xl font-bold text-green-600">
                  {safeChannels.filter(c => c.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive Channels</p>
                <p className="text-2xl font-bold text-red-600">
                  {safeChannels.filter(c => !c.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Languages</p>
                <p className="text-2xl font-bold">
                  {new Set(safeChannels.map(c => c.language)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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

                  {/* Channel Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Channel ID:</p>
                      <p className="font-mono text-sm">{channel.channel_id}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Automation Hours:</p>
                      <p className="text-sm">{Array.isArray(channel.automation_hours) ? channel.automation_hours.join(', ') : 'Not configured'}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Content Types:</p>
                    <p className="text-sm">{getContentTypesDisplay(channel.content_types || [])}</p>
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