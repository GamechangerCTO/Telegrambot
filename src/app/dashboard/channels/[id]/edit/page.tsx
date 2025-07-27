'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';

const CONTENT_TYPES = [
  { id: 'news', label: 'News', description: 'Latest football news' },
  { id: 'betting', label: 'Betting', description: 'Betting tips and recommendations' },
  { id: 'analysis', label: 'Analysis', description: 'Professional game analysis' },
  { id: 'live', label: 'Live Updates', description: 'Live updates during games' },
  { id: 'polls', label: 'Polls', description: 'Interactive opinion polls' },
  { id: 'summary', label: 'Summaries', description: 'Game and period summaries' }
];

const LANGUAGES = [
  { code: 'he', name: 'Hebrew', flag: '🇮🇱' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'am', name: 'Amharic', flag: '🇪🇹' },
  { code: 'sw', name: 'Swahili', flag: '🇰🇪' }
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
    channel_id: '',
    language: 'he',
    content_types: [] as string[],
    automation_hours: [] as number[],
    is_active: true
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
          channel_id: data.channel_id || '',
          language: data.language || 'he',
          content_types: Array.isArray(data.content_types) ? data.content_types : [],
          automation_hours: Array.isArray(data.automation_hours) ? data.automation_hours : [],
          is_active: data.is_active || false
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
      if (!formData.name || !formData.channel_id) {
        alert('Please fill in all required fields');
        return;
      }

      if (formData.content_types.length === 0) {
        alert('Please select at least one content type');
        return;
      }

      if (formData.automation_hours.length === 0) {
        alert('Please select at least one automation hour');
        return;
      }

      const { error } = await supabase
        .from('channels')
        .update(formData)
        .eq('id', channelId);

      if (error) throw error;

      alert('Channel updated successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error updating channel:', error);
      alert('Error updating channel. Please try again.');
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
      const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', channelId);

      if (error) throw error;

      alert('Channel deleted successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error deleting channel:', error);
      alert('Error deleting channel. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleContentTypeChange = (typeId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        content_types: [...prev.content_types, typeId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        content_types: prev.content_types.filter(t => t !== typeId)
      }));
    }
  };

  const handleHourChange = (hour: number, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        automation_hours: [...prev.automation_hours, hour].sort((a, b) => a - b)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        automation_hours: prev.automation_hours.filter(h => h !== hour)
      }));
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading channel data...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard')}
        >
          <ArrowRight className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Edit Channel</h1>
          <p className="text-gray-600 mt-1">Update settings for {formData.name}</p>
        </div>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={deleting}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {deleting ? 'Deleting...' : 'Delete Channel'}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Active Status */}
        <Card>
          <CardHeader>
            <CardTitle>Channel Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked as boolean }))}
              />
              <Label htmlFor="is_active">
                Channel is active (receives automatic content)
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Channel Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Channel Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Israel Sports Channel"
                required
              />
            </div>

            <div>
              <Label htmlFor="channel_id">Channel ID</Label>
              <Input
                id="channel_id"
                type="text"
                value={formData.channel_id}
                onChange={(e) => setFormData(prev => ({ ...prev, channel_id: e.target.value }))}
                placeholder="e.g., @my_channel or -1001234567890"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                You can find this using @userinfobot or in channel settings
              </p>
            </div>

            <div>
              <Label htmlFor="language">Channel Language</Label>
              <select
                id="language"
                value={formData.language}
                onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                className="w-full p-2 border rounded-md"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Content Types */}
        <Card>
          <CardHeader>
            <CardTitle>Content Types</CardTitle>
            <p className="text-sm text-gray-600">Select which content types the channel will receive</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CONTENT_TYPES.map(type => (
                <div key={type.id} className="flex items-start space-x-3 space-x-reverse">
                  <Checkbox
                    id={type.id}
                    checked={Array.isArray(formData.content_types) && formData.content_types.includes(type.id)}
                    onCheckedChange={(checked) => handleContentTypeChange(type.id, checked as boolean)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor={type.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {type.label}
                    </Label>
                    <p className="text-xs text-gray-500">
                      {type.description}
                    </p>
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
            <p className="text-sm text-gray-600">Select which hours of the day to post automatic content</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 md:grid-cols-8 gap-2">
              {HOURS.map(hour => (
                <div key={hour} className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id={`hour-${hour}`}
                    checked={Array.isArray(formData.automation_hours) && formData.automation_hours.includes(hour)}
                    onCheckedChange={(checked) => handleHourChange(hour, checked as boolean)}
                  />
                  <Label htmlFor={`hour-${hour}`} className="text-sm">
                    {hour.toString().padStart(2, '0')}:00
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Selected hours currently: {Array.isArray(formData.automation_hours) ? formData.automation_hours.map(h => `${h.toString().padStart(2, '0')}:00`).join(', ') : 'Not set'}
            </p>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Updating...' : 'Update Channel'}
          </Button>
        </div>
      </form>
    </div>
  );
} 