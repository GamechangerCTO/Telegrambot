'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, PlayCircle, Settings, Calendar, Zap, Target, Clock } from 'lucide-react';

interface SmartPushSettings {
  id: string;
  channel_id: string;
  is_enabled: boolean;
  min_delay_minutes: number;
  max_delay_minutes: number;
  max_coupons_per_day: number;
  min_gap_hours: number;
  trigger_on_betting: boolean;
  trigger_on_analysis: boolean;
  trigger_on_news: boolean;
  channels: {
    id: string;
    name: string;
    language: string;
    is_active: boolean;
  };
}

interface ScheduleItem {
  id: string;
  primary_content_type: string;
  scheduled_at: string;
  status: string;
  channel_ids: string[];
  language: string;
  channels: {
    name: string;
    language: string;
  };
}

export default function SmartPushPage() {
  const [status, setStatus] = useState<any>(null);
  const [settings, setSettings] = useState<SmartPushSettings[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'schedule'>('overview');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch status, settings, and schedule in parallel
      const [statusRes, settingsRes, scheduleRes] = await Promise.all([
        fetch('/api/smart-push/trigger?action=status'),
        fetch('/api/smart-push/schedule?action=channel_settings'),
        fetch('/api/smart-push/schedule?action=today_schedule')
      ]);

      const [statusData, settingsData, scheduleData] = await Promise.all([
        statusRes.json(),
        settingsRes.json(),
        scheduleRes.json()
      ]);

      if (statusData.success) setStatus(statusData);
      if (settingsData.success) setSettings(settingsData.channel_settings || []);
      if (scheduleData.success) setTodaySchedule(scheduleData.today_schedule || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const createDailySchedule = async () => {
    try {
      setProcessing(true);
      
      const response = await fetch('/api/smart-push/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_schedule' })
      });

      const result = await response.json();
      
      if (result.success) {
        showNotification(`Daily schedule created with ${result.scheduled_count} coupons!`, 'success');
        fetchData();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error creating daily schedule:', error);
      showNotification('Error creating daily schedule', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const triggerRandomCoupon = async () => {
    try {
      setProcessing(true);
      
      const response = await fetch('/api/smart-push/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'trigger_random' })
      });
      
      const result = await response.json();
      
      if (result.success) {
        showNotification('🎫 Random coupon sent successfully!', 'success');
        fetchData();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error triggering random coupon:', error);
      showNotification('Error sending random coupon', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const updateChannelSettings = async (channelId: string, newSettings: Partial<SmartPushSettings>) => {
    try {
      const response = await fetch('/api/smart-push/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'update_settings',
          channel_id: channelId,
          settings: newSettings
        })
      });

      const result = await response.json();
      
      if (result.success) {
        showNotification('Channel settings updated successfully!', 'success');
        fetchData();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      showNotification('Error updating settings', 'error');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🧠 Smart Coupons Management System</h1>
          <p className="text-gray-600 mt-2">Automatic sending of coupons after content and at random times</p>
        </div>
        <div className="flex space-x-3 rtl:space-x-reverse">
          <button 
            onClick={fetchData} 
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2 rtl:space-x-reverse disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button 
            onClick={triggerRandomCoupon} 
            disabled={processing}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 rtl:space-x-reverse disabled:opacity-50"
          >
            <Zap className={`h-4 w-4 ${processing ? 'animate-pulse' : ''}`} />
            <span>Send Coupon Now</span>
          </button>
          <button 
            onClick={createDailySchedule} 
            disabled={processing}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center space-x-2 rtl:space-x-reverse disabled:opacity-50"
          >
            <Calendar className={`h-4 w-4 ${processing ? 'animate-pulse' : ''}`} />
            <span>Create Daily Schedule</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 rtl:space-x-reverse">
          {[
            { id: 'overview', label: 'Overview', icon: Target },
            { id: 'settings', label: 'Channel Settings', icon: Settings },
            { id: 'schedule', label: 'Daily Schedule', icon: Clock }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 rtl:space-x-reverse ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
        </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-900">{status?.queue?.pending || 0}</div>
              <div className="text-blue-600">Pending in Queue</div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-900">{status?.today_deliveries?.successful || 0}</div>
              <div className="text-green-600">Sent Today</div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-900">{todaySchedule.filter(s => s.status === 'pending').length}</div>
              <div className="text-purple-600">Scheduled Today</div>
            </div>
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-900">{settings.filter(s => s.is_enabled).length}</div>
              <div className="text-orange-600">Active Channels</div>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">How the System Works:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-blue-900 mb-2">🎯 Automatic Sending After Content</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• After betting tips - 80% chance</li>
                  <li>• After match analysis - 60% chance</li>
                  <li>• After sports news - 30% chance</li>
                  <li>• Random delay of 3-10 minutes</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-purple-900 mb-2">📅 Random Sending During the Day</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Up to 3 random coupons per day per channel</li>
                  <li>• Minimum 2-hour interval between coupons</li>
                  <li>• Only active hours (6:00-23:00)</li>
                  <li>• Language adaptation</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Recent Queue Items */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            {status?.queue?.recent_items?.length > 0 ? (
              <div className="space-y-3">
                {status.queue.recent_items.slice(0, 5).map((item: any, index: number) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{item.primary_content_type}</span>
                      <span className="text-gray-500 mr-2">- {item.language}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.status === 'completed' ? 'bg-green-100 text-green-800' :
                        item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        item.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(item.scheduled_at).toLocaleString('en-US')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No recent activity</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Channel Settings</h3>
            {settings.length > 0 ? (
              <div className="space-y-4">
                {settings.map((setting) => (
                  <div key={setting.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-medium text-gray-900">{setting.channels.name}</h4>
                        <p className="text-sm text-gray-500">Language: {setting.channels.language}</p>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={setting.is_enabled}
                          onChange={(e) => updateChannelSettings(setting.channel_id, { is_enabled: e.target.checked })}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="mr-2 text-sm text-gray-700">Active</label>
                      </div>
                    </div>

                    {setting.is_enabled && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <label className="block text-gray-700 mb-1">Max Coupons per Day</label>
                          <input
                            type="number"
                            value={setting.max_coupons_per_day}
                            onChange={(e) => updateChannelSettings(setting.channel_id, { max_coupons_per_day: parseInt(e.target.value) })}
                            className="w-full border rounded px-2 py-1"
                            min="1"
                            max="10"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 mb-1">Minimum Gap (hours)</label>
                          <input
                            type="number"
                            value={setting.min_gap_hours}
                            onChange={(e) => updateChannelSettings(setting.channel_id, { min_gap_hours: parseInt(e.target.value) })}
                            className="w-full border rounded px-2 py-1"
                            min="1"
                            max="12"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-gray-700 mb-2">Triggers</label>
                          <div className="flex space-x-4 rtl:space-x-reverse">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={setting.trigger_on_betting}
                                onChange={(e) => updateChannelSettings(setting.channel_id, { trigger_on_betting: e.target.checked })}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="mr-2 text-xs">Betting</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={setting.trigger_on_analysis}
                                onChange={(e) => updateChannelSettings(setting.channel_id, { trigger_on_analysis: e.target.checked })}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="mr-2 text-xs">Analysis</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={setting.trigger_on_news}
                                onChange={(e) => updateChannelSettings(setting.channel_id, { trigger_on_news: e.target.checked })}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="mr-2 text-xs">News</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No channel settings defined</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Daily Schedule</h3>
            {todaySchedule.length > 0 ? (
          <div className="space-y-3">
                {todaySchedule.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className={`w-3 h-3 rounded-full ${
                        item.status === 'completed' ? 'bg-green-500' :
                        item.status === 'pending' ? 'bg-yellow-500' :
                        item.status === 'failed' ? 'bg-red-500' :
                        'bg-blue-500'
                      }`}></div>
                      <div>
                        <span className="font-medium">{item.channels?.name || 'Unknown Channel'}</span>
                        <span className="text-gray-500 mr-2">({item.language})</span>
            </div>
            </div>
                    <div className="text-sm text-gray-600">
                      {new Date(item.scheduled_at).toLocaleTimeString('he-IL', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
            </div>
          </div>
                ))}
        </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No daily schedule for today</p>
                <button
                  onClick={createDailySchedule}
                  disabled={processing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Create Automatic Schedule
                </button>
          </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 