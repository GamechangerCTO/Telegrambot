'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Settings, Play, Pause, Edit, Save, X } from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  language: string;
  is_active: boolean;
}

interface AutomationSettings {
  id: string;
  channel_id: string;
  cron_schedule: string;
  timezone: string;
  enabled_content_types: string[];
  disabled_content_types: string[];
  max_posts_per_day: number;
  max_posts_per_hour: number;
  min_interval_minutes: number;
  min_content_quality: number;
  auto_approve_high_quality: boolean;
  priority_level: number;
  is_active: boolean;
  last_execution: string | null;
  next_scheduled_execution: string | null;
  channels: Channel;
}

export default function ChannelAutomationPage() {
  const [automationSettings, setAutomationSettings] = useState<AutomationSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AutomationSettings>>({});

  useEffect(() => {
    fetchAutomationSettings();
  }, []);

  const fetchAutomationSettings = async () => {
    try {
      const response = await fetch('/api/channels/automation');
      const result = await response.json();
      
      if (result.success) {
        setAutomationSettings(result.data);
      }
    } catch (error) {
      console.error('Error fetching automation settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/channels/automation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          is_active: !currentStatus
        })
      });
      
      if (response.ok) {
        fetchAutomationSettings();
      }
    } catch (error) {
      console.error('Error toggling automation:', error);
    }
  };

  const startEdit = (setting: AutomationSettings) => {
    setEditingId(setting.id);
    setEditForm({
      cron_schedule: setting.cron_schedule,
      max_posts_per_day: setting.max_posts_per_day,
      max_posts_per_hour: setting.max_posts_per_hour,
      min_interval_minutes: setting.min_interval_minutes
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    
    try {
      const response = await fetch('/api/channels/automation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          ...editForm
        })
      });
      
      if (response.ok) {
        setEditingId(null);
        setEditForm({});
        fetchAutomationSettings();
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const getLanguageDisplay = (lang: string) => {
    const languages = {
      'en': '🇺🇸 English',
      'am': '🇪🇹 አማርኛ',
      'sw': '🇹🇿 Kiswahili',
      'fr': '🇫🇷 Français',
      'ar': '🇸🇦 العربية'
    };
    return languages[lang as keyof typeof languages] || lang;
  };

  const getCronDescription = (cron: string) => {
    if (cron === '0 */2 * * *') return 'Every 2 hours';
    if (cron === '0 9,15,21 * * *') return 'Daily at 9AM, 3PM, 9PM';
    if (cron === '0 8 * * *') return 'Daily at 8AM';
    return cron;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="text-lg">Loading automation settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">📅 Channel Automation Settings</h1>
        <p className="text-gray-600">Manage individual automation settings for each channel</p>
      </div>

      <div className="grid gap-6">
        {automationSettings.map((setting) => (
          <Card key={setting.id} className="shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {setting.channels.name}
                  </CardTitle>
                  <p className="text-gray-600 text-sm">
                    {getLanguageDisplay(setting.channels.language)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={setting.is_active ? "default" : "secondary"}>
                    {setting.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(setting.id, setting.is_active)}
                  >
                    {setting.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {editingId === setting.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Cron Schedule</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={editForm.cron_schedule || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, cron_schedule: e.target.value }))}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Max Posts/Day</label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded"
                        value={editForm.max_posts_per_day || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, max_posts_per_day: parseInt(e.target.value) }))}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Max Posts/Hour</label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded"
                        value={editForm.max_posts_per_hour || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, max_posts_per_hour: parseInt(e.target.value) }))}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Min Interval (min)</label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded"
                        value={editForm.min_interval_minutes || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, min_interval_minutes: parseInt(e.target.value) }))}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={saveEdit} size="sm">
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button variant="outline" onClick={cancelEdit} size="sm">
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Schedule</div>
                      <div className="text-lg">{getCronDescription(setting.cron_schedule)}</div>
                      <div className="text-sm text-gray-400">{setting.cron_schedule}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-gray-500">Limits</div>
                      <div className="text-sm">
                        {setting.max_posts_per_day} posts/day • {setting.max_posts_per_hour} posts/hour
                      </div>
                      <div className="text-sm text-gray-400">Min interval: {setting.min_interval_minutes}min</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-2">Enabled Content Types</div>
                    <div className="flex flex-wrap gap-1">
                      {setting.enabled_content_types.map((type) => (
                        <Badge key={type} variant="outline" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="text-sm text-gray-500">
                      Quality: {setting.min_content_quality}/10 • Priority: {setting.priority_level}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(setting)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {automationSettings.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">No automation settings found.</p>
            <p className="text-sm text-gray-400">Automation settings will be created automatically for new channels.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 