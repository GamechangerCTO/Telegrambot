'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import TextInput from '@/components/forms/TextInput';
import { ArrowLeft, Save, Trash2, Globe, Settings, MessageSquare, CreditCard, Eye, EyeOff, Plus, X, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface ChannelCoupon {
  id: string;
  title: string;
  affiliate_code: string;
  affiliate_url: string;
  description?: string;
  bonus_amount?: string;
  betting_site?: string;
  is_active: boolean;
}

interface ChannelWebsite {
  name: string;
  url: string;
  description?: string;
}

const CONTENT_TYPES = [
  { id: 'news', label: 'News', description: 'Latest football news and updates', icon: '📰' },
  { id: 'betting', label: 'Betting Tips', description: 'Professional betting recommendations', icon: '🎲' },
  { id: 'analysis', label: 'Match Analysis', description: 'In-depth game analysis', icon: '📊' },
  { id: 'live', label: 'Live Updates', description: 'Real-time match updates', icon: '⚡' },
  { id: 'polls', label: 'Polls', description: 'Interactive fan polls', icon: '🗳️' },
  { id: 'coupons', label: 'Coupons', description: 'Promotional offers', icon: '🎫' },
  { id: 'summary', label: 'Summaries', description: 'Daily and weekly summaries', icon: '📋' }
];

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸', native: 'English' },
  { code: 'am', name: 'Amharic', flag: '🇪🇹', native: 'አማርኛ' },
  { code: 'sw', name: 'Swahili', flag: '🇰🇪', native: 'Kiswahili' },
  { code: 'he', name: 'Hebrew', flag: '🇮🇱', native: 'עברית' },
  { code: 'fr', name: 'French', flag: '🇫🇷', native: 'Français' }
];

const POPULAR_LEAGUES = [
  { id: 'premier-league', name: 'Premier League', country: 'England' },
  { id: 'la-liga', name: 'La Liga', country: 'Spain' },
  { id: 'bundesliga', name: 'Bundesliga', country: 'Germany' },
  { id: 'serie-a', name: 'Serie A', country: 'Italy' },
  { id: 'ligue-1', name: 'Ligue 1', country: 'France' },
  { id: 'champions-league', name: 'Champions League', country: 'Europe' },
  { id: 'europa-league', name: 'Europa League', country: 'Europe' },
  { id: 'world-cup', name: 'World Cup', country: 'International' }
];

export default function ChannelSettings() {
  const router = useRouter();
  const params = useParams();
  const channelId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('basic');

  const [formData, setFormData] = useState({
    name: '',
    telegram_channel_id: '',
    telegram_channel_username: '',
    language: 'en',
    content_types: {} as Record<string, boolean>,
    selected_leagues: [] as string[],
    selected_teams: [] as string[],
    affiliate_code: '',
    is_active: true,
    description: '',
    auto_post_enabled: true,
    max_posts_per_day: 10,
    smart_scheduling: true,
    post_approval_required: false
  });

  const [coupons, setCoupons] = useState<ChannelCoupon[]>([]);
  const [websites, setWebsites] = useState<ChannelWebsite[]>([]);
  const [newWebsite, setNewWebsite] = useState({ name: '', url: '', description: '' });
  const [showAddWebsite, setShowAddWebsite] = useState(false);

  useEffect(() => {
    if (channelId) {
      fetchChannelData();
    }
  }, [channelId]);

  const fetchChannelData = async () => {
    try {
      console.log('🔄 Fetching channel data for ID:', channelId);
      const supabase = createClient();
      
      // Fetch channel data
      const { data: channelData, error: channelError } = await supabase
        .from('channels')
        .select('*')
        .eq('id', channelId)
        .single();

      console.log('📊 Channel data response:', { channelData, channelError });

      if (channelError) throw channelError;
      
      if (channelData) {
        // Convert content_types array to object
        let contentTypesObj: Record<string, boolean> = {};
        if (Array.isArray(channelData.content_types)) {
          channelData.content_types.forEach((type: string) => {
            contentTypesObj[type] = true;
          });
        } else if (typeof channelData.content_types === 'object' && channelData.content_types) {
          contentTypesObj = channelData.content_types;
        }

        setFormData({
          name: channelData.name || '',
          telegram_channel_id: channelData.telegram_channel_id || '',
          telegram_channel_username: channelData.telegram_channel_username || '',
          language: channelData.language || 'en',
          content_types: contentTypesObj,
          selected_leagues: Array.isArray(channelData.selected_leagues) ? channelData.selected_leagues : [],
          selected_teams: Array.isArray(channelData.selected_teams) ? channelData.selected_teams : [],
          affiliate_code: channelData.affiliate_code || '',
          is_active: channelData.is_active || false,
          description: channelData.description || '',
          auto_post_enabled: channelData.auto_post_enabled !== false,
          max_posts_per_day: channelData.max_posts_per_day || 10,
          smart_scheduling: channelData.smart_scheduling !== false,
          post_approval_required: channelData.post_approval_required || false
        });

        // Parse websites from description or other field
        try {
          const websitesData = channelData.websites ? JSON.parse(channelData.websites) : [];
          setWebsites(Array.isArray(websitesData) ? websitesData : []);
        } catch {
          setWebsites([]);
        }
      }
      
      // Fetch channel coupons
      const { data: couponsData, error: couponsError } = await supabase
        .from('coupons')
        .select('*')
        .eq('bot_id', channelData?.bot_id)
        .order('created_at', { ascending: false });

      if (!couponsError && couponsData) {
        setCoupons(couponsData);
      }

    } catch (error) {
      console.error('Error fetching channel data:', error);
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

      // Convert content_types object back to array for compatibility
      const contentTypesArray = Object.keys(formData.content_types).filter(key => formData.content_types[key]);

      if (contentTypesArray.length === 0) {
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
          content_types: contentTypesArray,
          selected_leagues: formData.selected_leagues,
          selected_teams: formData.selected_teams,
          affiliate_code: formData.affiliate_code,
          is_active: formData.is_active,
          description: formData.description,
          auto_post_enabled: formData.auto_post_enabled,
          max_posts_per_day: formData.max_posts_per_day,
          smart_scheduling: formData.smart_scheduling,
          post_approval_required: formData.post_approval_required,
          websites: JSON.stringify(websites),
          updated_at: new Date().toISOString()
        })
        .eq('id', channelId);

      if (error) throw error;

      alert('Channel settings updated successfully!');
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
      
      // Delete related data first
      await supabase.from('automation_rules').delete().eq('channels', `@>${channelId}`);
      await supabase.from('posts').delete().eq('channel_id', channelId);
      await supabase.from('logs').delete().eq('channel_id', channelId);

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

  const addWebsite = () => {
    if (!newWebsite.name || !newWebsite.url) {
      alert('Please fill in website name and URL');
      return;
    }
    
    setWebsites(prev => [...prev, { ...newWebsite }]);
    setNewWebsite({ name: '', url: '', description: '' });
    setShowAddWebsite(false);
  };

  const removeWebsite = (index: number) => {
    setWebsites(prev => prev.filter((_, i) => i !== index));
  };

  const toggleLeague = (leagueId: string) => {
    setFormData(prev => ({
      ...prev,
      selected_leagues: prev.selected_leagues.includes(leagueId)
        ? prev.selected_leagues.filter(id => id !== leagueId)
        : [...prev.selected_leagues, leagueId]
    }));
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading channel settings...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'basic', label: 'Basic Settings', icon: Settings },
    { id: 'content', label: 'Content & Types', icon: MessageSquare },
    { id: 'monetization', label: 'Monetization', icon: CreditCard },
    { id: 'websites', label: 'Websites & Links', icon: Globe }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Channel Settings
            </h1>
            <p className="text-gray-600">
              Manage {formData.name} channel configuration and preferences
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => router.push(`/dashboard/channels/${channelId}/automation`)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Settings className="w-4 h-4 mr-2" />
              View Automation
            </Button>
            <Button 
              onClick={() => router.push('/dashboard')}
              variant="outline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Settings Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Channel Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Channel Name *</label>
                      <TextInput
                        value={formData.name}
                        onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
                        placeholder="Enter channel name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telegram Channel ID *</label>
                      <TextInput
                        value={formData.telegram_channel_id}
                        onChange={(value) => setFormData(prev => ({ ...prev, telegram_channel_id: value }))}
                        placeholder="-1001234567890"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Channel Username</label>
                      <TextInput
                        value={formData.telegram_channel_username}
                        onChange={(value) => setFormData(prev => ({ ...prev, telegram_channel_username: value }))}
                        placeholder="@channelname"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                      <select
                        value={formData.language}
                        onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {LANGUAGES.map(lang => (
                          <option key={lang.code} value={lang.code}>
                            {lang.flag} {lang.name} ({lang.native})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Channel description (optional)"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Channel Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Posts Per Day</label>
                      <TextInput
                        type="number"
                        value={formData.max_posts_per_day.toString()}
                        onChange={(value) => setFormData(prev => ({ ...prev, max_posts_per_day: parseInt(value) || 10 }))}
                        placeholder="10"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Affiliate Code</label>
                      <TextInput
                        value={formData.affiliate_code}
                        onChange={(value) => setFormData(prev => ({ ...prev, affiliate_code: value }))}
                        placeholder="Your affiliate/referral code"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600"
                      />
                      <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Channel Active</label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="auto_post_enabled"
                        checked={formData.auto_post_enabled}
                        onChange={(e) => setFormData(prev => ({ ...prev, auto_post_enabled: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600"
                      />
                      <label htmlFor="auto_post_enabled" className="text-sm font-medium text-gray-700">Auto Posting</label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="smart_scheduling"
                        checked={formData.smart_scheduling}
                        onChange={(e) => setFormData(prev => ({ ...prev, smart_scheduling: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600"
                      />
                      <label htmlFor="smart_scheduling" className="text-sm font-medium text-gray-700">Smart Scheduling</label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="post_approval_required"
                        checked={formData.post_approval_required}
                        onChange={(e) => setFormData(prev => ({ ...prev, post_approval_required: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600"
                      />
                      <label htmlFor="post_approval_required" className="text-sm font-medium text-gray-700">Require Approval</label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Content & Types Tab */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Content Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {CONTENT_TYPES.map(type => (
                      <div key={type.id} className={`border rounded-lg p-4 transition-colors ${
                        formData.content_types[type.id] ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}>
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            id={type.id}
                            checked={formData.content_types[type.id] || false}
                            onChange={(e) => setFormData(prev => ({ 
                              ...prev, 
                              content_types: { ...prev.content_types, [type.id]: e.target.checked }
                            }))}
                            className="mt-1 rounded border-gray-300 text-blue-600"
                          />
                          <div className="flex-1">
                            <label htmlFor={type.id} className="font-medium text-gray-900 cursor-pointer flex items-center gap-2">
                              <span className="text-lg">{type.icon}</span>
                              {type.label}
                            </label>
                            <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Preferred Leagues</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {POPULAR_LEAGUES.map(league => (
                      <div key={league.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={league.id}
                          checked={formData.selected_leagues.includes(league.id)}
                          onChange={() => toggleLeague(league.id)}
                          className="rounded border-gray-300 text-blue-600"
                        />
                        <label htmlFor={league.id} className="text-sm font-medium text-gray-700 cursor-pointer">
                          {league.name} ({league.country})
                        </label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Monetization Tab */}
          {activeTab === 'monetization' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Channel Coupons</CardTitle>
                </CardHeader>
                <CardContent>
                  {coupons.length === 0 ? (
                    <div className="text-center py-8">
                      <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500 mb-4">No coupons configured for this channel</p>
                      <Button
                        type="button"
                        onClick={() => router.push('/dashboard/coupons/add')}
                        variant="outline"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Coupon
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {coupons.map((coupon) => (
                        <div key={coupon.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{coupon.title}</h3>
                                <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                                  {coupon.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{coupon.description}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>Site: {coupon.betting_site}</span>
                                <span>Bonus: {coupon.bonus_amount}</span>
                                <span>Code: {coupon.affiliate_code}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(coupon.affiliate_url, '_blank')}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                              >
                                <Settings className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        onClick={() => router.push('/dashboard/coupons/add')}
                        variant="outline"
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Coupon
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Websites Tab */}
          {activeTab === 'websites' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Managed Websites & Links</CardTitle>
                </CardHeader>
                <CardContent>
                  {websites.length === 0 ? (
                    <div className="text-center py-8">
                      <Globe className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500 mb-4">No websites configured</p>
                      <Button
                        type="button"
                        onClick={() => setShowAddWebsite(true)}
                        variant="outline"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Website
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {websites.map((website, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold">{website.name}</h3>
                              <p className="text-sm text-blue-600 break-all">{website.url}</p>
                              {website.description && (
                                <p className="text-sm text-gray-600 mt-1">{website.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(website.url, '_blank')}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeWebsite(index)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {!showAddWebsite && (
                        <Button
                          type="button"
                          onClick={() => setShowAddWebsite(true)}
                          variant="outline"
                          className="w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Website
                        </Button>
                      )}
                    </div>
                  )}

                  {showAddWebsite && (
                    <div className="border rounded-lg p-4 bg-gray-50 mt-4">
                      <h4 className="font-medium mb-3">Add New Website</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Website Name *</label>
                          <TextInput
                            value={newWebsite.name}
                            onChange={(value) => setNewWebsite(prev => ({ ...prev, name: value }))}
                            placeholder="e.g., Main Betting Site"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
                          <TextInput
                            value={newWebsite.url}
                            onChange={(value) => setNewWebsite(prev => ({ ...prev, url: value }))}
                            placeholder="https://example.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <TextInput
                            value={newWebsite.description}
                            onChange={(value) => setNewWebsite(prev => ({ ...prev, description: value }))}
                            placeholder="Brief description"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" onClick={addWebsite} size="sm">
                            Add Website
                          </Button>
                          <Button 
                            type="button" 
                            onClick={() => setShowAddWebsite(false)} 
                            variant="outline" 
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between pt-6 border-t">
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
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}