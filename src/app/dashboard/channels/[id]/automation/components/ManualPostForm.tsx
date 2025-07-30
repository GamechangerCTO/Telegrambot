'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import TextInput from '@/components/forms/TextInput';
import { Plus, Clock, Link, MessageSquare } from 'lucide-react';

interface ManualPostFormProps {
  channelId: string;
  onPostCreated: () => void;
}

const POST_TYPES = [
  { value: 'custom', label: '📝 Custom Message', description: 'Free-form content' },
  { value: 'marketing', label: '📢 Marketing', description: 'Promotional content' },
  { value: 'coupon', label: '🎫 Coupon', description: 'Discount offers' },
  { value: 'announcement', label: '📣 Announcement', description: 'Important updates' }
];

const RECURRENCE_OPTIONS = [
  { value: 'once', label: 'One-time only' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' }
];

export default function ManualPostForm({ channelId, onPostCreated }: ManualPostFormProps) {
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    content: '',
    post_type: 'custom',
    link_url: '',
    scheduled_time: '',
    recurrence: 'once'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content.trim() || !formData.scheduled_time) {
      alert('Please fill in content and scheduled time');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`/api/automation/channel/${channelId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-manual-post',
          ...formData
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Manual post scheduled successfully!');
        setFormData({
          content: '',
          post_type: 'custom',
          link_url: '',
          scheduled_time: '',
          recurrence: 'once'
        });
        setShowForm(false);
        onPostCreated();
      } else {
        alert('Error scheduling post: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating manual post:', error);
      alert('Error scheduling post');
    } finally {
      setLoading(false);
    }
  };

  // Generate default time (next hour)
  const getDefaultTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1, 0, 0, 0);
    return now.toISOString().slice(0, 16); // Format for datetime-local input
  };

  if (!showForm) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Add Manual Content</h3>
            <p className="text-gray-600 mb-4">
              Schedule custom messages, marketing content, or promotional offers
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Manual Post
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Schedule Manual Post
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Post Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Post Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {POST_TYPES.map(type => (
                <div
                  key={type.value}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    formData.post_type === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, post_type: type.value }))}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      name="post_type"
                      value={type.value}
                      checked={formData.post_type === type.value}
                      onChange={() => {}}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{type.label}</p>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message Content *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Enter your message content here..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.content.length}/1000 characters
            </p>
          </div>

          {/* Scheduling */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Scheduled Time *
              </label>
              <input
                type="datetime-local"
                value={formData.scheduled_time || getDefaultTime()}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recurrence
              </label>
              <select
                value={formData.recurrence}
                onChange={(e) => setFormData(prev => ({ ...prev, recurrence: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {RECURRENCE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Link className="w-4 h-4 inline mr-1" />
              Attached Link (Optional)
            </label>
            <TextInput
              value={formData.link_url}
              onChange={(value) => setFormData(prev => ({ ...prev, link_url: value }))}
              placeholder="https://example.com"
              type="url"
            />
            <p className="text-xs text-gray-500 mt-1">
              Add a link to include with the post (e.g., landing page, offer link)
            </p>
          </div>

          {/* Preview */}
          {formData.content && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
              <div className="bg-white border rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-500">
                    {POST_TYPES.find(t => t.value === formData.post_type)?.label}
                  </span>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-500">
                    {formData.scheduled_time ? 
                      new Date(formData.scheduled_time).toLocaleString() : 
                      'No time set'
                    }
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{formData.content}</p>
                {formData.link_url && (
                  <div className="mt-2">
                    <a 
                      href={formData.link_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      🔗 {formData.link_url}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowForm(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Scheduling...' : 'Schedule Post'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}