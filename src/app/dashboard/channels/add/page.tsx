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
  { id: 'summary', label: 'Summaries', description: 'Game and period summaries' }
];

const LANGUAGES = [
  { code: 'he', name: 'Hebrew', flag: '🇮🇱' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'am', name: 'Amharic', flag: '🇪🇹' },
  { code: 'sw', name: 'Swahili', flag: '🇰🇪' }
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function AddChannel() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    channel_id: '',
    language: 'he',
    content_types: ['news'],
    automation_hours: [9, 15, 21], // Default hours: 9 AM, 3 PM, 9 PM
    is_active: true
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

      if (formData.automation_hours.length === 0) {
        alert('Please select at least one automation hour');
        return;
      }

      const { error } = await supabase
        .from('channels')
        .insert([formData]);

      if (error) throw error;

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
        <div>
          <h1 className="text-3xl font-bold">Add New Channel</h1>
          <p className="text-gray-600 mt-1">Add a new Telegram channel to the system</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
            <p className="text-sm text-gray-600">Select which types of content this channel will receive</p>
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

        {/* Automation Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Automation Hours</CardTitle>
            <p className="text-sm text-gray-600">Select which hours of the day to automatically publish content</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 md:grid-cols-8 gap-2">
              {HOURS.map(hour => (
                <div key={hour} className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id={`hour-${hour}`}
                    checked={formData.automation_hours.includes(hour)}
                    onCheckedChange={(checked) => handleHourChange(hour, checked as boolean)}
                  />
                  <Label htmlFor={`hour-${hour}`} className="text-sm">
                    {hour.toString().padStart(2, '0')}:00
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Selected hours: {formData.automation_hours.map(h => `${h.toString().padStart(2, '0')}:00`).join(', ')}
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
            {loading ? 'Adding...' : 'Add Channel'}
          </Button>
        </div>
      </form>
    </div>
  );
} 