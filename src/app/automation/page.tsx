'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Settings, Clock, Zap, Calendar, Users, Globe, ToggleLeft, ToggleRight, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  type: 'full_auto' | 'manual_approval';
  automation_type: 'scheduled' | 'event_driven' | 'context_aware' | 'full_automation';
  content_type: string;
  config: any;
  next_run?: string;
  stats?: {
    totalRuns: number;
    successRate: number;
    contentGenerated: number;
  };
}

interface AutomationResult {
  rule_id: string;
  rule_name: string;
  type: string;
  content_type: string;
  status: 'triggered' | 'skipped' | 'error';
  trigger_reason?: string;
  timestamp: string;
  error?: string;
  channels_targeted?: string[];
}

interface CycleResults {
  timestamp: string;
  cycles_run: number;
  content_generated: number;
  actions_taken: AutomationResult[];
}

export default function AutomationPage() {
  const { isAuthenticated, isManager, isSuperAdmin, loading: authLoading } = useAuth();
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [isFullAutomationEnabled, setIsFullAutomationEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isRunningCycle, setIsRunningCycle] = useState(false);
  const [cycleProgress, setCycleProgress] = useState<string>('');
  const [cycleTimer, setCycleTimer] = useState(0);
  const [cycleResults, setCycleResults] = useState<CycleResults | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [automationLogs, setAutomationLogs] = useState<string[]>([]);
  const [activeChannels, setActiveChannels] = useState<any[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [executingRule, setExecutingRule] = useState<string | null>(null);

  // Smart Content Configuration
  const SMART_CONTENT_CONFIG = {
    // Event-Driven (Match-Based)
    'betting': {
      name: 'Pre-Match Betting Tips',
      emoji: '🎯',
      automation_type: 'event_driven',
      description: '2-3 hours before matches',
      trigger: 'upcoming_matches',
      timing: 'before_match',
      hours_before: 2,
      min_importance: 'medium'
    },
    'analysis': {
      name: 'Pre-Match Analysis',
      emoji: '📈',
      automation_type: 'event_driven',
      description: '2-3 hours before important matches',
      trigger: 'upcoming_matches',
      timing: 'before_match',
      hours_before: 2,
      min_importance: 'high'
    },
    'polls': {
      name: 'Pre-Match Polls',
      emoji: '📊',
      automation_type: 'event_driven',
      description: 'Before big matches',
      trigger: 'upcoming_matches',
      timing: 'before_match',
      hours_before: 4,
      min_importance: 'high'
    },
    'live': {
      name: 'Live Updates',
      emoji: '🔴',
      automation_type: 'event_driven',
      description: 'During live matches',
      trigger: 'live_matches',
      timing: 'during_match',
      update_frequency: 15 // minutes
    },
    
    // Scheduled (Time-Based)
    'news': {
      name: 'Football News',
      emoji: '📰',
      automation_type: 'scheduled',
      description: 'RSS check every 3 hours',
      schedule: 'every_3_hours',
      times: ['09:00', '12:00', '15:00', '18:00', '21:00']
    },
    'daily_summary': {
      name: 'Daily Summary',
      emoji: '📋',
      automation_type: 'scheduled',
      description: 'End of day summary',
      schedule: 'daily',
      times: ['23:00']
    },
    
    // Context-Aware
    'smart_push': {
      name: 'Smart Coupons',
      emoji: '🎫',
      automation_type: 'context_aware',
      description: 'After content delivery',
      trigger: 'after_content',
      probability: {
        'news': 0.3,
        'analysis': 0.6,
        'betting': 0.8
      }
    }
  };

  useEffect(() => {
    fetchRules();
    checkFullAutomationStatus();
    fetchSystemStatus();
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunningCycle) {
      interval = setInterval(() => {
        setCycleTimer(prev => prev + 1);
      }, 1000);
    } else {
      setCycleTimer(0);
    }
    return () => clearInterval(interval);
  }, [isRunningCycle]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/automation');
      const data = await response.json();
      
      if (data.success && data.rules) {
        setAutomationRules(data.rules);
        showNotification('Automation rules loaded successfully');
      } else {
        showNotification('Error loading rules', 'error');
      }
    } catch (error) {
      showNotification('Server connection error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const checkFullAutomationStatus = async () => {
    try {
      const response = await fetch('/api/automation/full-automation-status');
      const data = await response.json();
      if (data.success) {
        setIsFullAutomationEnabled(data.enabled);
      }
    } catch (error) {
      console.error('Error checking full automation status:', error);
    }
  };

  const toggleFullAutomation = async () => {
    try {
      const response = await fetch('/api/automation/toggle-full-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !isFullAutomationEnabled })
      });
      
      const data = await response.json();
      if (data.success) {
        setIsFullAutomationEnabled(!isFullAutomationEnabled);
        showNotification(
          `Full automation ${!isFullAutomationEnabled ? 'enabled' : 'disabled'} successfully!`
        );
      }
    } catch (error) {
      showNotification('Error toggling full automation', 'error');
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const createSmartRule = async (contentType: string, config: any) => {
    try {
      const response = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: config.name,
          enabled: true,
          type: 'full_auto',
          automation_type: config.automation_type,
          content_type: contentType,
          config: config
        })
      });

      const data = await response.json();
      if (data.success) {
        showNotification(`${config.name} automation created successfully!`);
        fetchRules();
      } else {
        showNotification('Error creating automation', 'error');
      }
    } catch (error) {
      showNotification('Error creating automation', 'error');
    }
  };

  const handleExecuteRule = async (ruleId: string) => {
    setExecutingRule(ruleId);
    try {
      const response = await fetch('/api/automation/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId })
      });

      const data = await response.json();
      if (data.success) {
        showNotification(`Rule executed successfully! Generated ${data.data.contentGenerated} content items`);
      } else {
        showNotification('Error executing rule', 'error');
      }
    } catch (error) {
      showNotification('Error executing rule', 'error');
    } finally {
      setExecutingRule(null);
    }
  };

  const runAutomationCycle = async () => {
    setIsRunningCycle(true);
    setCycleProgress('Starting automation cycle...');
    setCycleTimer(0);
    setCycleResults(null);
    setShowResults(false);
    setAutomationLogs([]);

    // Start timer
    const timerInterval = setInterval(() => {
      setCycleTimer(prev => prev + 1);
    }, 1000);

    try {
      // Step 1: Check automation status
      setCycleProgress('🔍 Checking automation settings...');
      addAutomationLog('Checking if full automation is enabled...');
      
      const statusResponse = await fetch('/api/automation/full-automation-status');
      const statusData = await statusResponse.json();
      addAutomationLog(`Full automation status: ${statusData.enabled ? 'ENABLED' : 'DISABLED'}`);

      if (!statusData.enabled) {
        addAutomationLog('❌ Full automation is disabled - stopping cycle');
        setCycleProgress('❌ Full automation is disabled');
        return;
      }

      // Step 2: Load automation rules
      setCycleProgress('📋 Loading automation rules...');
      addAutomationLog('Loading active automation rules...');
      
      await fetchRules();
      const activeRules = automationRules.filter(rule => rule.enabled);
      addAutomationLog(`Found ${activeRules.length} active automation rules`);

      // Step 3: Check system status
      setCycleProgress('🏥 Checking system health...');
      addAutomationLog('Checking system health and active channels...');
      
      if (activeChannels.length === 0) {
        addAutomationLog('⚠️ No active channels found - fetching channel list...');
        await fetchSystemStatus();
      }
      
      addAutomationLog(`System ready: ${activeChannels.length} active channels, ${systemStatus?.activeBots || 0} active bots`);

      // Step 4: Process automation rules
      setCycleProgress('⚙️ Processing automation rules...');
      addAutomationLog('Starting automation rule processing...');

      const executeResponse = await fetch('/api/automation/auto-scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!executeResponse.ok) {
        throw new Error(`Automation failed: ${executeResponse.statusText}`);
      }

      const results = await executeResponse.json();
      addAutomationLog(`Automation cycle completed successfully`);
      addAutomationLog(`Rules processed: ${results.results?.cycles_run || 0}`);
      addAutomationLog(`Content generated: ${results.results?.content_generated || 0}`);

      // Step 5: Display results
      setCycleProgress('✅ Automation cycle completed!');
      setCycleResults(results.results);
      setShowResults(true);

      // Add detailed results to logs
      if (results.results?.actions_taken) {
        results.results.actions_taken.forEach((action: any) => {
          const status = action.status === 'triggered' ? '✅' : action.status === 'skipped' ? '⏭️' : '❌';
          addAutomationLog(`${status} ${action.rule_name}: ${action.status}`);
          if (action.channels_targeted) {
            addAutomationLog(`   📺 Targeted channels: ${action.channels_targeted.join(', ')}`);
          }
        });
      }

    } catch (error) {
      console.error('Error running automation cycle:', error);
      setCycleProgress('❌ Automation cycle failed');
      addAutomationLog(`❌ Error: ${(error as Error).message}`);
    } finally {
      clearInterval(timerInterval);
      setIsRunningCycle(false);
    }
  };

  const triggerInstantContent = async (contentType: string) => {
    try {
      // Build URL with correct parameters - unified-content expects type in URL params  
      // Don't send target_channels to let API auto-detect active channels and their languages
      const response = await fetch(`/api/unified-content?action=send_now&type=${contentType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          max_posts_per_channel: 1,
          include_images: true
        })
      });
      
      const data = await response.json();
      if (data.success) {
        showNotification(`✅ ${contentType} content sent successfully!`);
      } else {
        showNotification(`❌ Error sending ${contentType} content: ${data.error || data.message}`, 'error');
      }
    } catch (error) {
      console.error('Error sending content:', error);
      showNotification(`❌ Network error sending ${contentType} content`, 'error');
    }
  };

  const addAutomationLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setAutomationLogs(prev => [...prev, logMessage]);
  };

  const fetchSystemStatus = async () => {
    try {
      // Fetch active channels and bots
      const response = await fetch('/api/dashboard/stats');
      if (response.ok) {
        const stats = await response.json();
        setSystemStatus(stats);
      }

      // Fetch channel details for automation display
      const channelResponse = await fetch('/api/channels');
      if (channelResponse.ok) {
        const channelData = await channelResponse.json();
        setActiveChannels(channelData.channels?.filter((c: any) => c.is_active) || []);
      }
    } catch (error) {
      console.error('Error fetching system status:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || (!isManager && !isSuperAdmin)) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">Access Denied</h1>
          <p className="text-gray-500">Manager permissions required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Smart Automation Center</h1>
          <p className="text-gray-600 mt-2">Intelligent content automation based on match events and schedules</p>
          {isSuperAdmin && (
            <Badge className="mt-2 bg-purple-100 text-purple-800">Super Admin</Badge>
          )}
        </div>
        
        {/* Full Automation Toggle */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Full Automation</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullAutomation}
              className={`p-1 ${isFullAutomationEnabled ? 'text-green-600' : 'text-gray-400'}`}
            >
              {isFullAutomationEnabled ? (
                <ToggleRight className="w-8 h-8" />
              ) : (
                <ToggleLeft className="w-8 h-8" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`mb-6 p-4 rounded-lg ${
          notification.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
            {notification}
        </div>
      )}
      
      {/* System Status Card */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🏥 System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{activeChannels.length}</div>
            <div className="text-sm text-blue-800">Active Channels</div>
            {activeChannels.length > 0 && (
              <div className="text-xs text-blue-600 mt-1">
                Languages: {[...new Set(activeChannels.map(c => c.language))].join(', ')}
              </div>
            )}
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{systemStatus?.activeBots || 0}</div>
            <div className="text-sm text-green-800">Active Bots</div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">{automationRules.filter(r => r.enabled).length}</div>
            <div className="text-sm text-purple-800">Active Rules</div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600">
              {isFullAutomationEnabled ? '✅' : '❌'}
            </div>
            <div className="text-sm text-orange-800">
              {isFullAutomationEnabled ? 'Auto Enabled' : 'Auto Disabled'}
            </div>
          </div>
        </div>
      </div>

      {/* Active Channels Display */}
      {activeChannels.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📺 Active Channels</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeChannels.map((channel, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="font-medium text-gray-900">{channel.name}</div>
                <div className="text-sm text-gray-600">{channel.telegram_channel_id}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Language: {channel.language?.toUpperCase() || 'EN'} • 
                  Bot: {channel.bot_name || 'Unknown'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Instant Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(SMART_CONTENT_CONFIG).map(([key, config]) => (
              <Button
                key={key}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => triggerInstantContent(key)}
              >
                <span className="text-2xl mb-1">{config.emoji}</span>
                <span className="text-xs text-center">{config.name}</span>
              </Button>
            ))}
            </div>
          </CardContent>
        </Card>

      {/* Smart Automation Setup */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Smart Automation Setup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            
            {/* Event-Driven Content */}
              <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Event-Driven Content (Match-Based)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(SMART_CONTENT_CONFIG)
                  .filter(([_, config]) => config.automation_type === 'event_driven')
                  .map(([key, config]) => (
                    <div key={key} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{config.emoji}</span>
                          <span className="font-medium">{config.name}</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => createSmartRule(key, config)}
                          disabled={automationRules.some(r => r.content_type === key)}
                        >
                          {automationRules.some(r => r.content_type === key) ? 'Active' : 'Enable'}
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{config.description}</p>
                      <div className="flex items-center gap-2">
                        <Info className="w-3 h-3 text-blue-500" />
                        <span className="text-xs text-blue-600">
                          {'timing' in config && config.timing === 'before_match' && 'hours_before' in config && 'min_importance' in config && `${config.hours_before} hours before ${config.min_importance} matches`}
                          {'timing' in config && config.timing === 'during_match' && 'update_frequency' in config && `Every ${config.update_frequency} minutes during live matches`}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Scheduled Content */}
              <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Scheduled Content (Time-Based)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(SMART_CONTENT_CONFIG)
                  .filter(([_, config]) => config.automation_type === 'scheduled')
                  .map(([key, config]) => (
                    <div key={key} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{config.emoji}</span>
                          <span className="font-medium">{config.name}</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => createSmartRule(key, config)}
                          disabled={automationRules.some(r => r.content_type === key)}
                        >
                          {automationRules.some(r => r.content_type === key) ? 'Active' : 'Enable'}
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{config.description}</p>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-600">
                          {'times' in config ? config.times?.join(', ') : ''}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Context-Aware Content */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Context-Aware Content
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {Object.entries(SMART_CONTENT_CONFIG)
                  .filter(([_, config]) => config.automation_type === 'context_aware')
                  .map(([key, config]) => (
                    <div key={key} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{config.emoji}</span>
                          <span className="font-medium">{config.name}</span>
      </div>
        <Button 
                          size="sm"
                          onClick={() => createSmartRule(key, config)}
                          disabled={automationRules.some(r => r.content_type === key)}
                        >
                          {automationRules.some(r => r.content_type === key) ? 'Active' : 'Enable'}
        </Button>
      </div>
                      <p className="text-sm text-gray-600 mb-2">{config.description}</p>
                      <div className="flex items-center gap-2">
                        <Users className="w-3 h-3 text-purple-500" />
                        <span className="text-xs text-purple-600">
                          {'probability' in config && config.probability 
                            ? `Probability: News ${(config.probability?.news || 0) * 100}%, Analysis ${(config.probability?.analysis || 0) * 100}%, Betting ${(config.probability?.betting || 0) * 100}%`
                            : 'Context-aware triggering'
                          }
                        </span>
                </div>
                    </div>
                  ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

      {/* Active Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Active Automation Rules ({automationRules.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
          {automationRules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No active automation rules</p>
              <p className="text-sm mt-2">Enable smart automation above to get started</p>
            </div>
          ) : (
              <div className="space-y-4">
              {automationRules.map((rule) => (
                <div 
                  key={rule.id} 
                  className={`border rounded-lg p-4 ${rule.enabled ? 'bg-green-50' : 'bg-gray-50'}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{rule.name}</h3>
                      <div className="flex gap-2 mt-2">
                        <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                          {rule.enabled ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">
                          {rule.automation_type?.replace('_', ' ')}
                      </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleExecuteRule(rule.id)}
                        disabled={executingRule === rule.id}
                      >
                        {executingRule === rule.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        Test Now
                      </Button>
                    </div>
                  </div>

                  {rule.next_run && (
                    <div className="mt-4 text-sm text-gray-600">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Next run: {new Date(rule.next_run).toLocaleString('en-US')}
        </div>
      )}

                  {rule.stats && (
                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold">{rule.stats.totalRuns}</div>
                        <div className="text-gray-600">Runs</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{rule.stats.successRate}%</div>
                        <div className="text-gray-600">Success</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{rule.stats.contentGenerated}</div>
                        <div className="text-gray-600">Content Generated</div>
                      </div>
                  </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Manual Testing */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🧪 Manual Testing & Execution</h2>
        
        <div className="space-y-4">
          <button
            onClick={runAutomationCycle}
            disabled={isRunningCycle}
            className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
              isRunningCycle
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isRunningCycle ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Running Automation Cycle...</span>
              </div>
            ) : (
              '🚀 Run Automation Cycle Now'
            )}
          </button>

          {/* Enhanced Progress Display with Real-time Logs */}
          {isRunningCycle && (
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="animate-pulse h-3 w-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-800 font-medium">{cycleProgress}</span>
                  <span className="text-blue-600 font-mono text-sm">{formatTime(cycleTimer)}</span>
            </div>
            
                {/* Real-time Logs */}
                {automationLogs.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-sm font-medium text-gray-700 mb-2">📋 Automation Logs:</div>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {automationLogs.slice(-10).map((log, index) => (
                        <div 
                          key={index} 
                          className="text-xs font-mono text-gray-600 bg-gray-50 rounded px-2 py-1 animate-fadeIn"
                        >
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Enhanced Results Display */}
          {showResults && cycleResults && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">🎯 Automation Results</h3>
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{cycleResults.cycles_run}</div>
                  <div className="text-xs text-green-700">Rules Processed</div>
                    </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{cycleResults.content_generated}</div>
                  <div className="text-xs text-green-700">Content Generated</div>
                    </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{cycleResults.actions_taken.length}</div>
                  <div className="text-xs text-green-700">Total Actions</div>
                  </div>
              </div>
              
              {/* Action Details */}
              {cycleResults.actions_taken.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-green-700">📋 Action Details:</div>
                  {cycleResults.actions_taken.map((action, index) => (
                    <div key={index} className="text-xs bg-white rounded p-2 border border-green-200">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{action.rule_name}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          action.status === 'triggered' ? 'bg-green-100 text-green-800' :
                          action.status === 'skipped' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {action.status}
                        </span>
                      </div>
                      {action.channels_targeted && (
                        <div className="text-gray-600 mt-1">
                          📺 Channels: {action.channels_targeted.join(', ')}
              </div>
                      )}
                      {action.trigger_reason && (
                        <div className="text-gray-500 mt-1">
                          💡 Reason: {action.trigger_reason}
        </div>
      )}
              </div>
                  ))}
              </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Automation Logs */}
      <div className="mt-8 bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="font-semibold text-gray-800 mb-3">Automation Logs</h4>
        <div className="max-h-60 overflow-y-auto pr-2">
          {automationLogs.map((log, index) => (
            <p key={index} className="text-sm text-gray-700 mb-1 last:mb-0">
              {log}
            </p>
          ))}
            </div>
          </div>
    </div>
  );
}