'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { supabase } from '@/lib/supabase';

interface ButtonTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  language: string;
  template_config: {
    buttons: Array<{
      text: string;
      type: 'callback' | 'url' | 'copy';
      action: string;
    }>;
  };
  is_system: boolean;
}

interface ChannelButtonConfig {
  main_website?: string;
  betting_platform?: string;
  live_scores?: string;
  news_source?: string;
  social_media?: {
    telegram?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  affiliate_codes?: {
    betting?: string;
    bookmaker?: string;
    casino?: string;
  };
  channel_settings?: {
    enable_betting_links?: boolean;
    enable_affiliate_links?: boolean;
    enable_social_sharing?: boolean;
    enable_reaction_buttons?: boolean;
    enable_copy_buttons?: boolean;
    custom_website?: string;
  };
  custom_buttons?: Array<{
    text: string;
    type: string;
    action: string;
    url?: string;
  }>;
}

interface Channel {
  id: string;
  name: string;
  language: string;
  button_config: ChannelButtonConfig;
}

export default function ChannelButtonsPage() {
  const router = useRouter();
  const params = useParams();
  const channelId = params.id as string;

  const [channel, setChannel] = useState<Channel | null>(null);
  const [templates, setTemplates] = useState<ButtonTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [buttonConfig, setButtonConfig] = useState<ChannelButtonConfig>({});

  useEffect(() => {
    if (channelId) {
      fetchChannelData();
      fetchButtonTemplates();
    }
  }, [channelId]);

  const fetchChannelData = async () => {
    try {
      const { data: channelData, error } = await supabase
        .from('channels')
        .select('id, name, language, button_config')
        .eq('id', channelId)
        .single();

      if (error) throw error;

      setChannel(channelData);
      setButtonConfig(channelData.button_config || {});
    } catch (error) {
      console.error('Error fetching channel:', error);
    }
  };

  const fetchButtonTemplates = async () => {
    try {
      const { data: templatesData, error } = await supabase
        .from('button_templates')
        .select('*')
        .order('category, language, name');

      if (error) throw error;

      setTemplates(templatesData || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveButtonConfig = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/channels/${channelId}/button-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buttonConfig),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save configuration');
      }

      alert('Button configuration saved successfully!');
    } catch (error) {
      console.error('Error saving button config:', error);
      alert('Failed to save button configuration: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const applyTemplate = (template: ButtonTemplate) => {
    const updatedConfig = {
      ...buttonConfig,
      template_applied: template.id,
      template_name: template.name,
      template_buttons: template.template_config.buttons
    };
    setButtonConfig(updatedConfig);
  };

  const updateChannelSetting = (key: string, value: any) => {
    setButtonConfig(prev => ({
      ...prev,
      channel_settings: {
        ...prev.channel_settings,
        [key]: value
      }
    }));
  };

  const updateLink = (key: string, value: string) => {
    setButtonConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateSocialLink = (platform: string, url: string) => {
    setButtonConfig(prev => ({
      ...prev,
      social_media: {
        ...prev.social_media,
        [platform]: url
      }
    }));
  };

  const updateAffiliateCode = (type: string, code: string) => {
    setButtonConfig(prev => ({
      ...prev,
      affiliate_codes: {
        ...prev.affiliate_codes,
        [type]: code
      }
    }));
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="text-center py-8">Loading channel button settings...</div>
      </PageLayout>
    );
  }

  if (!channel) {
    return (
      <PageLayout>
        <div className="text-center py-8">Channel not found</div>
      </PageLayout>
    );
  }

  // Filter templates by channel language
  const relevantTemplates = templates.filter(
    template => template.language === channel.language || template.language === 'en'
  );

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Breadcrumb 
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Channels', href: '/dashboard' },
              { label: channel.name, href: `/dashboard/channels/${channel.id}` },
              { label: 'Button Settings', href: '#', current: true }
            ]} 
          />
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Button Configuration</h1>
              <p className="text-gray-600">Configure interactive buttons for {channel.name}</p>
              <div className="mt-2">
                <Badge variant="outline">Language: {channel.language.toUpperCase()}</Badge>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => router.back()}
                variant="outline"
              >
                Back
              </Button>
              <Button 
                onClick={saveButtonConfig}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Templates Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🎨 Button Templates
                <Badge variant="secondary">{relevantTemplates.length} available</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {relevantTemplates.map((template) => (
                <div key={template.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-gray-600">{template.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={template.category === 'betting' ? 'default' : 'secondary'}>
                        {template.category}
                      </Badge>
                      <Badge variant="outline">{template.language}</Badge>
                      {template.is_system && <Badge variant="secondary">System</Badge>}
                    </div>
                  </div>
                  
                  {/* Preview buttons */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-2">Preview buttons:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.template_config.buttons.slice(0, 4).map((btn, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {btn.text}
                        </span>
                      ))}
                      {template.template_config.buttons.length > 4 && (
                        <span className="text-xs text-gray-500">
                          +{template.template_config.buttons.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  <Button 
                    onClick={() => applyTemplate(template)}
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    Apply Template
                  </Button>
                </div>
              ))}
              
              {relevantTemplates.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No templates available for language: {channel.language}</p>
                  <p className="text-sm">System will use default English templates</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuration Section */}
          <div className="space-y-6">
            {/* Channel Settings */}
            <Card>
              <CardHeader>
                <CardTitle>⚙️ Button Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <label className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      checked={buttonConfig.channel_settings?.enable_reaction_buttons ?? true}
                      onChange={(e) => updateChannelSetting('enable_reaction_buttons', e.target.checked)}
                      className="rounded"
                    />
                    <span>Enable Reaction Buttons (👍, 🔥, 💬)</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      checked={buttonConfig.channel_settings?.enable_copy_buttons ?? true}
                      onChange={(e) => updateChannelSetting('enable_copy_buttons', e.target.checked)}
                      className="rounded"
                    />
                    <span>Enable Copy Buttons (📋)</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      checked={buttonConfig.channel_settings?.enable_betting_links ?? true}
                      onChange={(e) => updateChannelSetting('enable_betting_links', e.target.checked)}
                      className="rounded"
                    />
                    <span>Enable Betting Links</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      checked={buttonConfig.channel_settings?.enable_affiliate_links ?? true}
                      onChange={(e) => updateChannelSetting('enable_affiliate_links', e.target.checked)}
                      className="rounded"
                    />
                    <span>Enable Affiliate Links</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      checked={buttonConfig.channel_settings?.enable_social_sharing ?? true}
                      onChange={(e) => updateChannelSetting('enable_social_sharing', e.target.checked)}
                      className="rounded"
                    />
                    <span>Enable Social Sharing</span>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Website Links */}
            <Card>
              <CardHeader>
                <CardTitle>🔗 Website Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Main Website</label>
                  <input 
                    type="url"
                    value={buttonConfig.main_website || ''}
                    onChange={(e) => updateLink('main_website', e.target.value)}
                    placeholder="https://your-website.com"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Betting Platform</label>
                  <input 
                    type="url"
                    value={buttonConfig.betting_platform || ''}
                    onChange={(e) => updateLink('betting_platform', e.target.value)}
                    placeholder="https://betting-site.com"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Live Scores</label>
                  <input 
                    type="url"
                    value={buttonConfig.live_scores || ''}
                    onChange={(e) => updateLink('live_scores', e.target.value)}
                    placeholder="https://livescore.com"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Affiliate Codes */}
            <Card>
              <CardHeader>
                <CardTitle>💰 Affiliate Codes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Betting Code</label>
                  <input 
                    type="text"
                    value={buttonConfig.affiliate_codes?.betting || ''}
                    onChange={(e) => updateAffiliateCode('betting', e.target.value)}
                    placeholder="AFRICA2024"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Bookmaker Code</label>
                  <input 
                    type="text"
                    value={buttonConfig.affiliate_codes?.bookmaker || ''}
                    onChange={(e) => updateAffiliateCode('bookmaker', e.target.value)}
                    placeholder="SPORT123"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Current Configuration Preview */}
        {buttonConfig.template_applied && (
          <Card>
            <CardHeader>
              <CardTitle>✅ Current Template Applied</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-green-800">{buttonConfig.template_name}</h4>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {buttonConfig.template_buttons?.map((btn, idx) => (
                    <span key={idx} className="text-sm bg-white border border-green-200 px-3 py-1 rounded">
                      {btn.text}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}