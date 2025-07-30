'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, ArrowLeft, Bot, Plus, Globe } from 'lucide-react';
import { createClient } from '@/lib/supabase';

const CONTENT_TYPES = [
  { id: 'news', label: 'News', description: 'Latest football news', icon: '📰' },
  { id: 'betting', label: 'Betting Tips', description: 'Professional betting recommendations', icon: '🎯' },
  { id: 'analysis', label: 'Match Analysis', description: 'In-depth game analysis', icon: '📊' },
  { id: 'live', label: 'Live Updates', description: 'Real-time match updates', icon: '🔴' },
  { id: 'polls', label: 'Polls', description: 'Interactive fan polls', icon: '📊' },
  { id: 'coupons', label: 'Coupons', description: 'Promotional offers', icon: '🎫' }
];

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸', native: 'English' },
  { code: 'he', name: 'Hebrew', flag: '🇮🇱', native: 'עברית' },
  { code: 'am', name: 'Amharic', flag: '🇪🇹', native: 'አማርኛ' },
  { code: 'sw', name: 'Swahili', flag: '🇰🇪', native: 'Kiswahili' },
  { code: 'fr', name: 'French', flag: '🇫🇷', native: 'Français' }
];

export default function AddChannel() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [botId, setBotId] = useState<string>('');

  const [formData, setFormData] = useState({
    // Essential fields only
    name: '',
    telegram_channel_id: '',
    language: 'en',
    content_types: ['news', 'betting'] as string[]
  });

  // Load the single bot automatically
  useEffect(() => {
    const loadBot = async () => {
      try {
        const supabase = createClient();
        const { data: bots, error } = await supabase
          .from('bots')
          .select('id, name, is_active')
          .eq('is_active', true)
          .limit(1)
          .single();

        if (!error && bots) {
          setBotId(bots.id);
        } else {
          console.error('Error loading bot:', error);
          alert('שגיאה: לא נמצא בוט פעיל במערכת. יש להגדיר בוט ראשית.');
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error loading bot:', error);
        alert('שגיאה בטעינת פרטי הבוט');
        router.push('/dashboard');
      }
    };

    loadBot();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!botId) {
      alert('שגיאה: לא נמצא בוט פעיל');
      return;
    }

    // Validate required fields
    if (!formData.name.trim()) {
      alert('שם הערוץ חובה');
      return;
    }

    if (!formData.telegram_channel_id.trim()) {
      alert('מזהה טלגרם חובה (למשל: @mychannel או -100123456789)');
      return;
    }

    if (formData.content_types.length === 0) {
      alert('יש לבחור לפחות סוג תוכן אחד');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      
      // Clean the telegram channel ID
      let cleanChannelId = formData.telegram_channel_id.trim();
      if (cleanChannelId.startsWith('@')) {
        cleanChannelId = cleanChannelId.substring(1);
      }

      const { data, error } = await supabase
        .from('channels')
        .insert([{
          name: formData.name.trim(),
          telegram_channel_id: cleanChannelId,
          language: formData.language,
          content_types: formData.content_types,
          bot_id: botId,
          is_active: true,
          auto_post_enabled: true,
          max_posts_per_day: 10,
          description: `${formData.language.toUpperCase()} channel for ${formData.content_types.join(', ')} content`,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating channel:', error);
        alert(`שגיאה ביצירת הערוץ: ${error.message}`);
        return;
      }

      alert('✅ הערוץ נוצר בהצלחה!');
      router.push(`/dashboard/channels/${data.id}/settings`);

    } catch (error) {
      console.error('Error creating channel:', error);
      alert('שגיאה ביצירת הערוץ');
    } finally {
      setLoading(false);
    }
  };

  const toggleContentType = (contentType: string) => {
    setFormData(prev => ({
      ...prev,
      content_types: prev.content_types.includes(contentType)
        ? prev.content_types.filter(type => type !== contentType)
        : [...prev.content_types, contentType]
    }));
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard')}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Channel</h1>
          <p className="text-gray-600">Create a new Telegram channel for automated content</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <span>Basic Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Channel Name */}
            <div>
              <Label htmlFor="name">Channel Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="מיי פוטבול ערוץ"
                required
              />
              <p className="text-sm text-gray-500 mt-1">Choose a friendly name for your channel</p>
            </div>

            {/* Telegram Channel ID */}
            <div>
              <Label htmlFor="telegram_channel_id">Telegram Channel ID *</Label>
              <Input
                id="telegram_channel_id"
                value={formData.telegram_channel_id}
                onChange={(e) => setFormData(prev => ({ ...prev, telegram_channel_id: e.target.value }))}
                placeholder="@mychannel או -100123456789"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                The channel username (@mychannel) or channel ID (-100xxxxx)
              </p>
            </div>

            {/* Language */}
            <div>
              <Label htmlFor="language">Language *</Label>
              <select
                id="language"
                value={formData.language}
                onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name} ({lang.native})
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Content Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>Content Types</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CONTENT_TYPES.map((contentType) => (
                <div
                  key={contentType.id}
                  className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.content_types.includes(contentType.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleContentType(contentType.id)}
                >
                  <Checkbox
                    checked={formData.content_types.includes(contentType.id)}
                    onChange={() => toggleContentType(contentType.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{contentType.icon}</span>
                      <span className="font-medium">{contentType.label}</span>
                    </div>
                    <p className="text-sm text-gray-600">{contentType.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Select the types of content you want to publish automatically to this channel
            </p>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard')}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Create Channel</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}