'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import TextInput from '@/components/forms/TextInput';
import { ArrowRight, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';

const CONTENT_TYPES = [
  { id: 'news', label: 'News', description: 'Latest football news' },
  { id: 'betting', label: 'Betting', description: 'Betting tips and recommendations' },
  { id: 'analysis', label: 'Analysis', description: 'Professional game analysis' },
  { id: 'live', label: 'Live Updates', description: 'Live updates during games' },
  { id: 'polls', label: 'Polls', description: 'Interactive opinion polls' },
  { id: 'coupons', label: 'Coupons', description: 'Promotional coupons and offers' },
  { id: 'summary', label: 'Summaries', description: 'Game and period summaries' }
];

const LANGUAGES = [
  { code: 'he', name: 'Hebrew', flag: '🇮🇱' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'am', name: 'Amharic', flag: '🇪🇹' },
  { code: 'sw', name: 'Swahili', flag: '🇰🇪' },
  { code: 'fr', name: 'French', flag: '🇫🇷' }
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function EditChannel() {
  const router = useRouter();
  const params = useParams();
  const channelId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    telegram_channel_id: '',
    telegram_channel_username: '',
    language: 'en',
    content_types: [] as string[],
    automation_hours: [] as number[],
    is_active: true,
    description: '',
    auto_post_enabled: true,
    max_posts_per_day: 10
  });

  useEffect(() => {
    if (channelId) {
      fetchChannel();
    }
  }, [channelId]);

  const fetchChannel = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('id', channelId)
        .single();

      if (error) throw error;
      
      if (data) {
        setFormData({
          name: data.name || '',
          telegram_channel_id: data.telegram_channel_id || '',
          telegram_channel_username: data.telegram_channel_username || '',
          language: data.language || 'en',
          content_types: Array.isArray(data.content_types) ? data.content_types : [],
          automation_hours: Array.isArray(data.automation_hours) ? data.automation_hours : [],
          is_active: data.is_active || false,
          description: data.description || '',
          auto_post_enabled: data.auto_post_enabled !== false,
          max_posts_per_day: data.max_posts_per_day || 10
        });
      }
    } catch (error) {
      console.error('Error fetching channel:', error);
      alert('Error loading channel data');
      router.push('/dashboard');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      
      // Validate required fields
      if (!formData.name || !formData.telegram_channel_id) {
        alert('Please fill in name and telegram channel ID');
        setLoading(false);
        return;
      }

      if (formData.content_types.length === 0) {
        alert('Please select at least one content type');
        setLoading(false);
        return;
      }

      // Update channel
      const { error } = await supabase
        .from('channels')
        .update({
          name: formData.name,
          telegram_channel_id: formData.telegram_channel_id,
          telegram_channel_username: formData.telegram_channel_username,
          language: formData.language,
          content_types: formData.content_types,
          automation_hours: formData.automation_hours,
          is_active: formData.is_active,
          description: formData.description,
          auto_post_enabled: formData.auto_post_enabled,
          max_posts_per_day: formData.max_posts_per_day,
          updated_at: new Date().toISOString()
        })
        .eq('id', channelId);

      if (error) throw error;

      alert('Channel updated successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error updating channel:', error);
      alert('Error updating channel');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this channel? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);

    try {
      const supabase = createClient();
      
      // Delete automation rules first
      await supabase
        .from('automation_rules')
        .delete()
        .eq('channel_id', channelId);

      // Delete channel
      const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', channelId);

      if (error) throw error;

      alert('Channel deleted successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error deleting channel:', error);
      alert('Error deleting channel');
    } finally {
      setDeleting(false);
    }
  };

  const handleContentTypeChange = (contentType: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      content_types: checked 
        ? [...prev.content_types, contentType]
        : prev.content_types.filter(type => type !== contentType)
    }));
  };

  const handleHourChange = (hour: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      automation_hours: checked 
        ? [...prev.automation_hours, hour].sort((a, b) => a - b)
        : prev.automation_hours.filter(h => h !== hour)
    }));
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading channel data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Edit Channel</h1>
            <p className="text-gray-600">
              Update channel settings and automation preferences
            </p>
          </div>
          <Button 
            onClick={() => router.push('/dashboard')}
            variant="outline"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Channel Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter channel name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="telegram_channel_id">Telegram Channel ID *</Label>
                  <Input
                    id="telegram_channel_id"
                    value={formData.telegram_channel_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, telegram_channel_id: e.target.value }))}
                    placeholder="-1001234567890"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="telegram_channel_username">Channel Username</Label>
                  <Input
                    id="telegram_channel_username"
                    value={formData.telegram_channel_username}
                    onChange={(e) => setFormData(prev => ({ ...prev, telegram_channel_username: e.target.value }))}
                    placeholder="@channelname"
                  />
                </div>

                <div>
                  <Label htmlFor="language">Language</Label>
                  <select
                    id="language"
                    value={formData.language}
                    onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Channel description (optional)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_posts">Max Posts Per Day</Label>
                  <Input
                    id="max_posts"
                    type="number"
                    min="1"
                    max="50"
                    value={formData.max_posts_per_day}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_posts_per_day: parseInt(e.target.value) || 10 }))}
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: !!checked }))}
                    />
                    <Label htmlFor="is_active">Channel Active</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="auto_post_enabled"
                      checked={formData.auto_post_enabled}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_post_enabled: !!checked }))}
                    />
                    <Label htmlFor="auto_post_enabled">Auto Posting</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Types */}
          <Card>
            <CardHeader>
              <CardTitle>Content Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {CONTENT_TYPES.map(type => (
                  <div key={type.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={type.id}
                      checked={formData.content_types.includes(type.id)}
                      onCheckedChange={(checked) => handleContentTypeChange(type.id, !!checked)}
                    />
                    <div className="flex-1">
                      <Label htmlFor={type.id} className="font-medium">{type.label}</Label>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Automation Hours */}
          <Card>
            <CardHeader>
              <CardTitle>Automation Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
                {HOURS.map(hour => (
                  <div key={hour} className="flex items-center space-x-2">
                    <Checkbox
                      id={`hour-${hour}`}
                      checked={formData.automation_hours.includes(hour)}
                      onCheckedChange={(checked) => handleHourChange(hour, !!checked)}
                    />
                    <Label htmlFor={`hour-${hour}`} className="text-sm">
                      {hour.toString().padStart(2, '0')}:00
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="order-2 sm:order-1"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleting ? 'Deleting...' : 'Delete Channel'}
            </Button>

            <div className="flex gap-4 order-1 sm:order-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Channel'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 