'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase';

const CONTENT_TYPES = [
  { id: 'news', label: 'News', description: 'Latest football news' },
  { id: 'betting', label: 'Betting', description: 'Betting tips and recommendations' },
  { id: 'analysis', label: 'Analysis', description: 'Professional game analysis' },
  { id: 'live', label: 'Live Updates', description: 'Live updates during games' },
  { id: 'polls', label: 'Polls', description: 'Interactive opinion polls' },
  { id: 'summary', label: 'Summaries', description: 'Game and period summaries' },
  { id: 'coupons', label: 'Coupons', description: 'Promotional coupons' }
];

const LANGUAGES = [
  { code: 'he', name: 'Hebrew', flag: '🇮🇱' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'am', name: 'Amharic', flag: '🇪🇹' },
  { code: 'sw', name: 'Swahili', flag: '🇰🇪' }
];

export default function AddChannel() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Basic Channel Info
    name: '',
    channel_id: '',
    language: 'en',
    description: '',
    
    // Content Settings
    content_types: ['news'] as string[],
    
    // Automation Settings
    is_active: true,
    auto_post_enabled: true,
    smart_scheduling: true,
    
    // Posting Limits
    max_posts_per_day: 10,
    
    // Approval & Notifications
    post_approval_required: false,
    push_notifications: true
  });

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

      // Create channel with advanced settings
      const { data: channel, error } = await supabase
        .from('channels')
        .insert([{
          name: formData.name,
          telegram_channel_id: formData.channel_id,
          language: formData.language,
          description: formData.description,
          content_types: formData.content_types,
          is_active: formData.is_active,
          auto_post_enabled: formData.auto_post_enabled,
          smart_scheduling: formData.smart_scheduling,
          max_posts_per_day: formData.max_posts_per_day,
          post_approval_required: formData.post_approval_required,
          push_notifications: formData.push_notifications,
          total_posts_sent: 0,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Note: Automation rules are handled by external cron jobs for dynamic content scheduling
      // No need to create automation rules as content is posted dynamically

      alert('Channel added successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error adding channel:', error);
      alert('Error adding channel. Please try again.');
    } finally {
      setLoading(false);
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



  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard')}
        >
          <ArrowRight className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add New Channel</h1>
          <p className="text-gray-600 mt-1">Configure a new Telegram channel with advanced automation</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Channel Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div>
                <Label htmlFor="max_posts_per_day">Max Posts Per Day</Label>
                <Input
                  id="max_posts_per_day"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.max_posts_per_day}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_posts_per_day: parseInt(e.target.value) }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the channel purpose"
              />
            </div>
          </CardContent>
        </Card>

        {/* Content Types */}
        <Card>
          <CardHeader>
            <CardTitle>Content Types</CardTitle>
            <p className="text-sm text-gray-600">Select which types of content this channel will receive automatically</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CONTENT_TYPES.map(type => (
                <div key={type.id} className="flex items-start space-x-3 space-x-reverse">
                  <Checkbox
                    id={type.id}
                    checked={formData.content_types.includes(type.id)}
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

        {/* Automation Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Automation Settings</CardTitle>
            <p className="text-sm text-gray-600">Configure how content will be automatically posted</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked as boolean }))}
                  />
                  <Label htmlFor="is_active">Channel is active</Label>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="auto_post_enabled"
                    checked={formData.auto_post_enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_post_enabled: checked as boolean }))}
                  />
                  <Label htmlFor="auto_post_enabled">Enable automatic posting</Label>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="smart_scheduling"
                    checked={formData.smart_scheduling}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, smart_scheduling: checked as boolean }))}
                  />
                  <Label htmlFor="smart_scheduling">Smart scheduling (AI-powered timing)</Label>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="post_approval_required"
                    checked={formData.post_approval_required}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, post_approval_required: checked as boolean }))}
                  />
                  <Label htmlFor="post_approval_required">Require manual approval</Label>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="push_notifications"
                    checked={formData.push_notifications}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, push_notifications: checked as boolean }))}
                  />
                  <Label htmlFor="push_notifications">Push notifications</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Posting Info */}
        <Card>
          <CardHeader>
            <CardTitle>🤖 Dynamic Posting</CardTitle>
            <p className="text-sm text-gray-600">Content is posted dynamically based on cron jobs and real-time events</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2">✅ Automated Content Scheduling</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Content is sent automatically based on match schedules</li>
                <li>• Real-time live updates during active games</li>
                <li>• Smart timing based on team rankings and importance</li>
                <li>• No manual scheduling required</li>
              </ul>
            </div>
            <p className="text-xs text-gray-500">
              ℹ️ The system uses intelligent cron jobs and event triggers to determine optimal posting times automatically.
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
            {loading ? 'Creating Channel...' : 'Create Channel'}
          </Button>
        </div>
      </form>
    </div>
  );
} 