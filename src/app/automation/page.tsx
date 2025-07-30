'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Settings, 
  Clock, 
  Zap, 
  Calendar, 
  Users, 
  Bot,
  Activity,
  TrendingUp,
  PlayCircle,
  ChevronRight,
  Globe
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

interface Channel {
  id: string;
  name: string;
  telegram_channel_id: string;
  language: string;
  is_active: boolean;
  auto_post_enabled?: boolean;
  total_posts_sent?: number;
  last_post_at?: string;
}

export default function AutomationOverview() {
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(process.env.NODE_ENV === 'production');
  const [stats, setStats] = useState({
    totalChannels: 0,
    activeChannels: 0,
    totalPosts: 0,
    automationRules: 0
  });

  useEffect(() => {
    loadChannels();
    loadStats();
  }, []);

  const loadChannels = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .order('name');

      if (!error && data) {
        setChannels(data);
      }
    } catch (error) {
      console.error('Error loading channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const supabase = createClient();
      
      // Count channels
      const { data: channelsData } = await supabase
        .from('channels')
        .select('id, is_active');
      
      // Count automation rules
      const { data: rulesData } = await supabase
        .from('automation_rules')
        .select('id');

      setStats({
        totalChannels: channelsData?.length || 0,
        activeChannels: channelsData?.filter(c => c.is_active)?.length || 0,
        totalPosts: 0, // TODO: Count from sent messages
        automationRules: rulesData?.length || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getLanguageFlag = (language: string) => {
    const flags: Record<string, string> = {
      'en': '🇺🇸',
      'he': '🇮🇱',
      'am': '🇪🇹',
      'sw': '🇰🇪',
      'fr': '🇫🇷',
      'ar': '🇸🇦'
    };
    return flags[language] || '🌐';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Automation Management</h1>
          <p className="text-gray-600">Manage automation settings for each channel</p>
        </div>
        <Button 
          onClick={() => router.push('/dashboard')}
          variant="outline"
        >
          Back to Dashboard
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
        <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Bot className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Channels</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalChannels}</p>
            </div>
          </div>
        </CardContent>
      </Card>

        <Card>
        <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Activity className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active Channels</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeChannels}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Zap className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Automation Rules</p>
                <p className="text-2xl font-bold text-gray-900">{stats.automationRules}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Posts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPosts}</p>
            </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channels List */}
          <Card>
            <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Channel Automation Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
          {channels.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Channels Found</h3>
              <p className="text-gray-600 mb-4">Add your first channel to start automation</p>
              <Button onClick={() => router.push('/dashboard/channels/add')}>
                Add Channel
                  </Button>
                </div>
              ) : (
            <div className="space-y-3">
              {channels.map((channel) => (
                <div 
                  key={channel.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{getLanguageFlag(channel.language)}</span>
                      <div>
                        <h3 className="font-medium text-gray-900">{channel.name}</h3>
                        <p className="text-sm text-gray-600">
                          ID: {channel.telegram_channel_id}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge variant={channel.is_active ? "default" : "secondary"}>
                        {channel.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      
                      {channel.auto_post_enabled && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          <Zap className="h-3 w-3 mr-1" />
                          Auto-Post
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/channels/${channel.id}/settings`)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={() => router.push(`/dashboard/channels/${channel.id}/automation`)}
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Automation
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push('/dashboard/channels/add')}>
          <CardContent className="p-6 text-center">
            <Bot className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">Add New Channel</h3>
            <p className="text-sm text-gray-600">Set up automation for a new Telegram channel</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push('/dashboard')}>
          <CardContent className="p-6 text-center">
            <Activity className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">Dashboard</h3>
            <p className="text-sm text-gray-600">View overall system status and analytics</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push('/dashboard/coupons')}>
          <CardContent className="p-6 text-center">
            <Calendar className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">Manage Coupons</h3>
            <p className="text-sm text-gray-600">Create and manage promotional coupons</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}