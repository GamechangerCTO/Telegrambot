'use client';

import { useState, useEffect } from 'react';

interface Channel {
  id: string;
  name: string;
  telegram_channel_id: string;
  language: string;
  is_active: boolean;
  bots: {
    id: string;
    name: string;
    telegram_token_encrypted: string;
    is_active: boolean;
  };
}

export default function ChannelManagerPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [manualMessage, setManualMessage] = useState('');
  const [automationStatus, setAutomationStatus] = useState<any>(null);

  useEffect(() => {
    loadChannels();
    loadAutomationStatus();
  }, []);

  const loadChannels = async () => {
    setLoading(true);
    try {
      // This would normally fetch from Supabase
      // For now, using mock data since we need to setup the query
      const mockChannels: Channel[] = [
        {
          id: '1',
          name: 'Premier League Updates',
          telegram_channel_id: '@premier_league_updates',
          language: 'en',
          is_active: true,
          bots: {
            id: 'bot1',
            name: 'Sportbot',
            telegram_token_encrypted: 'NzY0NDA2OTUzMzpBQUVEXzZWOTZ2dTRXaE9VWGtEeTlNUlp3bTNqRmZXZHhpTQ==',
            is_active: true
          }
        }
      ];
      setChannels(mockChannels);
    } catch (error) {
      console.error('Error loading channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAutomationStatus = async () => {
    try {
      const response = await fetch('/api/automation/cron?action=status', {
        method: 'POST'
      });
      const data = await response.json();
      setAutomationStatus(data);
    } catch (error) {
      console.error('Error loading automation status:', error);
    }
  };

  const runAutomation = async () => {
    setLoading(true);
    try {
      // Use unified content system for automation
      const response = await fetch('/api/unified-content?automation=standard', {
        method: 'PUT'
      });
      const data = await response.json();
      
      if (data.success) {
        const automationMsg = `🧠 AI-Enhanced Automation Complete!\n\n` +
          `📊 Results:\n` +
          `• ${data.statistics?.channels_processed || 0} channels processed\n` +
          `• ${data.statistics?.total_content_sent || 0} AI-selected content pieces\n` +
          `• ${data.statistics?.ai_recommendations_generated || 0} AI-enhanced deliveries\n` +
          `• Average AI Score: ${data.statistics?.average_ai_score || 0}/100\n` +
          `• Content Types Used: ${data.statistics?.content_types_used?.join(', ') || 'N/A'}\n\n` +
          `🕐 Duration: ${Math.round((data.statistics?.processing_time_ms || 0) / 1000)}s\n` +
          `⏰ Next Run: ${data.next_automation_estimated ? new Date(data.next_automation_estimated).toLocaleString('he-IL') : 'Unknown'}\n\n` +
          `✨ All content was intelligently selected by AI using the unified system!`
        
        alert(automationMsg);
        loadAutomationStatus();
      } else {
        alert(`AI-Enhanced Automation failed: ${data.error || data.message}`);
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const generateAndSendContent = async (channelId: string) => {
    setSendingTo(channelId);
    try {
      // Use unified content system for AI-enhanced content generation
      const contentResponse = await fetch('/api/unified-content?action=send_now&mode=ai_enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_channels: [channelId],
          max_posts_per_channel: 1,
          force_send: false
        })
      });
      const contentData = await contentResponse.json();
      
      if (!contentData.success) {
        throw new Error('Failed to generate AI-enhanced content');
      }

      const successMsg = `🧠 AI-Enhanced Content Delivered!\n\n` +
        `📊 AI Analysis:\n` +
        `• Channels Processed: ${contentData.statistics?.channels_processed || 0}\n` +
        `• Content Generated: ${contentData.statistics?.total_content_sent || 0}\n` +
        `• AI Recommendations: ${contentData.statistics?.ai_recommendations_generated || 0}\n` +
        `• AI Score: ${contentData.statistics?.average_ai_score || 0}/100\n` +
        `• Processing Time: ${Math.round((contentData.statistics?.processing_time_ms || 0) / 1000)}s\n\n` +
        `✨ Content was intelligently selected and optimized by the unified AI system!`

      alert(successMsg);
      
    } catch (error) {
      alert(`Failed to generate AI-enhanced content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSendingTo(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          📺 Channel Manager & Content Control
        </h1>

        {/* AI-Enhanced Automation Control Panel */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-xl font-semibold mb-4">🧠 AI-Enhanced Automation Control</h2>
          <p className="text-sm text-gray-600 mb-4">
            Intelligent content selection using AI to analyze RSS feeds and football data for optimal engagement
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800">Status</h3>
              <p className="text-blue-600">
                {automationStatus?.status?.is_running ? '🟢 Running' : '🔴 Idle'}
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800">Last Run</h3>
              <p className="text-green-600 text-sm">
                {automationStatus?.status?.last_successful_run ? 
                  new Date(automationStatus.status.last_successful_run).toLocaleString('he-IL') : 
                  'Never'
                }
              </p>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-orange-800">Today's Runs</h3>
              <p className="text-orange-600">
                {automationStatus?.status?.total_runs_today || 0}
              </p>
            </div>
          </div>

          <button
            onClick={runAutomation}
            disabled={loading}
            className="bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-600 hover:to-purple-700 text-white px-6 py-3 rounded disabled:opacity-50 relative"
          >
            {loading ? '🔄 Running AI Pipeline...' : '🧠 Run AI-Enhanced Automation'}
            <div className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs px-1 rounded-full">
              AI
            </div>
          </button>
        </div>

        {/* Manual Message Composer */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-xl font-semibold mb-4">✍️ Manual Message Composer</h2>
          
          <textarea
            value={manualMessage}
            onChange={(e) => setManualMessage(e.target.value)}
            placeholder="Write your message here... (supports Markdown)"
            className="w-full p-3 border rounded-lg mb-4 h-32 resize-none"
          />
          
          <div className="text-sm text-gray-600 mb-4">
            <strong>Markdown Examples:</strong> **bold**, *italic*, `code`, [link](url)
          </div>
        </div>

        {/* Channels List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">📺 Channels ({channels.length})</h2>
          
          <div className="space-y-4">
            {channels.map((channel) => (
              <div key={channel.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{channel.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        channel.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {channel.is_active ? '🟢 Active' : '🔴 Inactive'}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {channel.language.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-600">
                      <p><strong>Channel ID:</strong> {channel.telegram_channel_id}</p>
                      <p><strong>Bot:</strong> {channel.bots.name} 
                        <span className={`ml-2 ${channel.bots.is_active ? 'text-green-600' : 'text-red-600'}`}>
                          ({channel.bots.is_active ? 'Active' : 'Inactive'})
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => generateAndSendContent(channel.id)}
                      disabled={!channel.is_active || !channel.bots.is_active || sendingTo === channel.id}
                      className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white px-4 py-2 rounded disabled:opacity-50 text-sm relative"
                    >
                      {sendingTo === channel.id ? '🔄 AI Processing...' : '🧠 AI Generate & Send'}
                      <div className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs px-1 rounded-full">
                        AI
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/dashboard/channels"
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center hover:bg-blue-100 transition-colors"
          >
            <h3 className="font-semibold text-blue-800">📺 Manage Channels</h3>
            <p className="text-blue-600 text-sm">Add, edit, or configure channels</p>
          </a>

          <a
            href="/real-content"
            className="bg-green-50 border border-green-200 rounded-lg p-4 text-center hover:bg-green-100 transition-colors"
          >
            <h3 className="font-semibold text-green-800">🧪 Test Content Pipeline</h3>
            <p className="text-green-600 text-sm">Test RSS, GPT, and Telegram</p>
          </a>

          <a
            href="/dashboard/settings"
            className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center hover:bg-orange-100 transition-colors"
          >
            <h3 className="font-semibold text-orange-800">⚙️ API Settings</h3>
            <p className="text-orange-600 text-sm">Configure API keys and settings</p>
          </a>
        </div>
      </div>
    </div>
  );
} 