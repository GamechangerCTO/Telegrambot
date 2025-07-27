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
  const [channels, setChannels] = useState<Channel[]>([]);
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

      if (error) throw error;
      setChannels(data || []);
    } catch (error) {
      console.error('Error fetching channels:', error);
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
      alert('שגיאה בשינוי סטטוס הערוץ');
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
        alert(`תוכן ${getContentTypeDisplay(contentType)} נשלח בהצלחה לערוץ ${channelName}!`);
        fetchChannels(); // Refresh to update last_content_sent
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error sending content:', error);
      alert(`שגיאה בשליחת תוכן לערוץ ${channelName}`);
    } finally {
      setSendingContent(prev => ({ ...prev, [key]: false }));
    }
  };

  const getLanguageDisplay = (language: string) => {
    const languages = {
      'en': 'English',
      'he': 'עברית',
      'am': 'አማርኛ',
      'sw': 'Kiswahili'
    };
    return languages[language as keyof typeof languages] || language;
  };

  const getContentTypesDisplay = (types: string[]) => {
    const typeNames = {
      'news': 'חדשות',
      'betting': 'הימורים',
      'analysis': 'ניתוח',
      'live': 'עדכונים חיים',
      'polls': 'סקרים',
      'summary': 'סיכומים'
    };
    
    return types.map(type => typeNames[type as keyof typeof typeNames] || type).join(', ');
  };

  const getContentTypeDisplay = (type: string) => {
    const typeNames = {
      'news': 'חדשות',
      'betting': 'הימורים',
      'analysis': 'ניתוח',
      'live': 'עדכונים חיים',
      'polls': 'סקרים',
      'summary': 'סיכומים'
    };
    return typeNames[type as keyof typeof typeNames] || type;
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
        <div className="text-lg">טוען ערוצים...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">ניהול ערוצים</h1>
          <p className="text-gray-600 mt-2">
            נהל את כל הערוצים והגדרות האוטומציה במקום אחד
          </p>
        </div>
        <Button 
          onClick={() => router.push('/dashboard/channels/add')}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          הוסף ערוץ חדש
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">סה"כ ערוצים</p>
                <p className="text-2xl font-bold">{channels.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ערוצים פעילים</p>
                <p className="text-2xl font-bold text-green-600">
                  {channels.filter(c => c.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ערוצים כבויים</p>
                <p className="text-2xl font-bold text-red-600">
                  {channels.filter(c => !c.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">שפות</p>
                <p className="text-2xl font-bold">
                  {new Set(channels.map(c => c.language)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channels List */}
      <Card>
        <CardHeader>
          <CardTitle>רשימת ערוצים</CardTitle>
        </CardHeader>
        <CardContent>
          {channels.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">אין ערוצים עדיין</p>
              <Button 
                onClick={() => router.push('/dashboard/channels/add')}
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                הוסף ערוץ ראשון
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {channels.map((channel) => (
                <div 
                  key={channel.id}
                  className="border rounded-lg p-6 hover:bg-gray-50"
                >
                  {/* Channel Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{channel.name}</h3>
                      <Badge variant={channel.is_active ? 'default' : 'secondary'}>
                        {channel.is_active ? 'פעיל' : 'כבוי'}
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
                      <p className="text-sm text-gray-600 mb-1">ID ערוץ:</p>
                      <p className="font-mono text-sm">{channel.channel_id}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 mb-1">שעות אוטומציה:</p>
                      <p className="text-sm">{channel.automation_hours?.join(', ') || 'לא הוגדר'}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">סוגי תוכן:</p>
                    <p className="text-sm">{getContentTypesDisplay(channel.content_types || [])}</p>
                  </div>

                  {/* Manual Content Buttons */}
                  {channel.is_active && (
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium text-gray-700 mb-3">שלח תוכן ידני:</p>
                      <div className="flex flex-wrap gap-2">
                        {(channel.content_types || []).map(contentType => {
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
                              {isLoading ? 'שולח...' : getContentTypeDisplay(contentType)}
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