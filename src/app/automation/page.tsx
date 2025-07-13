'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Settings, 
  Clock, 
  Zap, 
  Calendar, 
  Users, 
  Globe, 
  ToggleLeft, 
  ToggleRight, 
  Info, 
  Timer, 
  Loader2, 
  Square, 
  RefreshCw,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Bell,
  BarChart3,
  TrendingUp,
  Eye,
  MessageSquare,
  Target,
  Workflow
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Types
interface SystemHealth {
  status: 'healthy' | 'warning' | 'error';
  message: string;
  details?: string;
}

interface AutomationStats {
  totalRules: number;
  activeRules: number;
  contentGenerated24h: number;
  successRate: number;
  lastRun?: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  disabled?: boolean;
  loading?: boolean;
}

interface ContentType {
  id: string;
  name: string;
  emoji: string;
  description: string;
  enabled: boolean;
  lastGenerated?: string;
  performance: 'excellent' | 'good' | 'fair' | 'poor';
}

export default function AutomationPage() {
  const { isAuthenticated, isManager, isSuperAdmin, loading: authLoading } = useAuth();
  
  // Core State
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({ status: 'healthy', message: 'All systems operational' });
  const [automationStats, setAutomationStats] = useState<AutomationStats>({
    totalRules: 0,
    activeRules: 0,
    contentGenerated24h: 0,
    successRate: 0
  });
  const [isFullAutomationEnabled, setIsFullAutomationEnabled] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'settings' | 'logs'>('overview');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  
  // Content Types Configuration
  const [contentTypes, setContentTypes] = useState<ContentType[]>([
    { id: 'live', name: 'Live Updates', emoji: '🔴', description: 'Real-time match updates', enabled: true, performance: 'excellent' },
    { id: 'betting', name: 'Betting Tips', emoji: '🎯', description: 'AI-powered predictions', enabled: true, performance: 'good' },
    { id: 'news', name: 'Football News', emoji: '📰', description: 'Latest news summaries', enabled: true, performance: 'good' },
    { id: 'analysis', name: 'Match Analysis', emoji: '📈', description: 'Deep match insights', enabled: false, performance: 'fair' },
    { id: 'polls', name: 'Fan Polls', emoji: '📊', description: 'Interactive engagement', enabled: false, performance: 'poor' },
    { id: 'coupons', name: 'Smart Coupons', emoji: '🎫', description: 'Promotional content', enabled: true, performance: 'excellent' }
  ]);

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize data
  useEffect(() => {
    if (isAuthenticated && (isManager || isSuperAdmin)) {
      initializeAutomation();
    }
  }, [isAuthenticated, isManager, isSuperAdmin]);

  // Load content types from API
  const loadContentTypes = async () => {
    try {
      const response = await fetch('/api/automation/content-types');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.contentTypes) {
          setContentTypes(data.contentTypes);
        }
      }
    } catch (error) {
      console.error('Error loading content types:', error);
    }
  };

  // Save content types to API
  const saveContentTypes = async (updatedContentTypes: ContentType[]) => {
    try {
      const response = await fetch('/api/automation/content-types', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentTypes: updatedContentTypes })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showNotification('Content types updated successfully!', 'success');
          await fetchAutomationStats(); // Refresh stats
        }
      }
    } catch (error) {
      console.error('Error saving content types:', error);
      showNotification('Error saving content types', 'error');
    }
  };

  // Load activity logs
  const loadActivityLogs = async () => {
    setLogsLoading(true);
    try {
      const response = await fetch('/api/automation/logs?limit=50&days=7');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setActivityLogs(data.logs || []);
        }
      }
    } catch (error) {
      console.error('Error loading activity logs:', error);
      showNotification('Could not load activity logs', 'error');
    } finally {
      setLogsLoading(false);
    }
  };

  const initializeAutomation = async () => {
    setLoading(true);
    try {
      await Promise.all([
        checkSystemHealth(),
        fetchAutomationStats(),
        checkFullAutomationStatus(),
        loadContentTypes()
      ]);
      setSystemHealth({ status: 'healthy', message: 'Automation system ready' });
    } catch (error) {
      setSystemHealth({ 
        status: 'error', 
        message: 'System initialization failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const checkSystemHealth = async () => {
    try {
      // Check API connectivity
      const response = await fetch('/api/api-football-showcase?feature=overview');
      if (!response.ok) throw new Error('API connectivity issue');
      
      // Check database
      const dbResponse = await fetch('/api/automation/rules');
      if (!dbResponse.ok) throw new Error('Database connectivity issue');
      
      setSystemHealth({ status: 'healthy', message: 'All systems operational' });
    } catch (error) {
      setSystemHealth({ 
        status: 'warning', 
        message: 'Some systems need attention',
        details: error instanceof Error ? error.message : 'Check system logs'
      });
    }
  };

  const fetchAutomationStats = async () => {
    try {
      const response = await fetch('/api/automation/stats');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAutomationStats({
            totalRules: data.totalRules || 0,
            activeRules: data.activeRules || 0,
            contentGenerated24h: data.contentGenerated24h || 0,
            successRate: data.successRate || 0,
            lastRun: data.lastRun
          });
        }
      } else {
        console.warn('Stats API returned non-OK status, using fallback data');
      }
    } catch (error) {
      console.error('Error fetching automation stats:', error);
      showNotification('Could not load stats - using default values', 'info');
    }
  };

  const checkFullAutomationStatus = async () => {
    try {
      const response = await fetch('/api/automation/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsFullAutomationEnabled(data.full_automation_enabled || false);
        }
      } else {
        console.warn('Settings API returned non-OK status');
      }
    } catch (error) {
      console.error('Error checking automation status:', error);
      showNotification('Could not load settings - using defaults', 'info');
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const toggleFullAutomation = async () => {
    try {
      const newStatus = !isFullAutomationEnabled;
      const response = await fetch('/api/automation/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_automation_enabled: newStatus })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsFullAutomationEnabled(newStatus);
          showNotification(
            `Full automation ${newStatus ? 'enabled' : 'disabled'} successfully!`,
            'success'
          );
          // Refresh stats after toggle
          await fetchAutomationStats();
        } else {
          throw new Error(data.error || 'Failed to update settings');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error toggling automation:', error);
      showNotification(`Error toggling automation: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const runAutomationCycle = async () => {
    try {
      showNotification('Starting automation cycle...', 'info');
      const response = await fetch('/api/automation/auto-scheduler', { method: 'POST' });
      
      if (response.ok) {
        const data = await response.json();
        showNotification(
          `Automation cycle completed! Generated ${data.content_generated || 0} pieces of content.`,
          'success'
        );
        await fetchAutomationStats();
      } else {
        throw new Error('Automation cycle failed');
      }
    } catch (error) {
      showNotification('Automation cycle failed', 'error');
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: 'run-cycle',
      title: 'Run Automation Cycle',
      description: 'Execute all active automation rules',
      icon: <Play className="w-5 h-5" />,
      action: runAutomationCycle
    },
    {
      id: 'generate-content',
      title: 'Generate Content Now',
      description: 'Create content for all active channels',
      icon: <Zap className="w-5 h-5" />,
      action: () => showNotification('Content generation started', 'info')
    },
    {
      id: 'check-matches',
      title: 'Check Live Matches',
      description: 'Scan for ongoing matches to cover',
      icon: <Activity className="w-5 h-5" />,
      action: () => showNotification('Scanning for live matches...', 'info')
    },
    {
      id: 'refresh-data',
      title: 'Refresh All Data',
      description: 'Update fixtures, news, and stats',
      icon: <RefreshCw className="w-5 h-5" />,
      action: initializeAutomation
    }
  ];

  const getHealthIcon = () => {
    switch (systemHealth.status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getHealthColor = () => {
    switch (systemHealth.status) {
      case 'healthy': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'error': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading automation dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (!isManager && !isSuperAdmin)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
          <p className="text-gray-600">Manager or Super Admin access required for automation controls.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Automation Dashboard</h1>
          <p className="text-gray-600 mt-2">Intelligent content automation for your Telegram channels</p>
          {isSuperAdmin && (
            <Badge className="mt-2 bg-purple-100 text-purple-800">Super Admin</Badge>
          )}
        </div>
        
        {/* Live Clock & Status */}
        <div className="text-right">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Clock className="w-4 h-4" />
            <span>System Time</span>
          </div>
          <div className="text-xl font-mono font-bold text-blue-600">
            {currentTime.toLocaleTimeString('en-US', { 
              hour12: false, 
              hour: '2-digit', 
              minute: '2-digit', 
              second: '2-digit' 
            })}
          </div>
          <div className="text-sm text-gray-400">
            {currentTime.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>

      {/* Notification Bar */}
      {notification && (
        <div className={`mb-6 p-4 rounded-lg border ${
          notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
          notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* System Health Card */}
      <Card className={`mb-6 ${getHealthColor()}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getHealthIcon()}
              <div>
                <h3 className="font-semibold text-lg">{systemHealth.message}</h3>
                {systemHealth.details && (
                  <p className="text-sm text-gray-600">{systemHealth.details}</p>
                )}
              </div>
            </div>
            
            {/* Full Automation Toggle */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">Full Automation</div>
                <div className={`text-lg font-semibold ${isFullAutomationEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                  {isFullAutomationEnabled ? 'ENABLED' : 'DISABLED'}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullAutomation}
                className={`p-2 ${isFullAutomationEnabled ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}
              >
                {isFullAutomationEnabled ? (
                  <ToggleRight className="w-8 h-8" />
                ) : (
                  <ToggleLeft className="w-8 h-8" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 text-center">
            <Workflow className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{automationStats.activeRules}</div>
            <div className="text-sm text-gray-600">Active Rules</div>
            <div className="text-xs text-gray-400 mt-1">of {automationStats.totalRules} total</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <MessageSquare className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{automationStats.contentGenerated24h}</div>
            <div className="text-sm text-gray-600">Content Generated</div>
            <div className="text-xs text-gray-400 mt-1">last 24 hours</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">{automationStats.successRate}%</div>
            <div className="text-sm text-gray-600">Success Rate</div>
            <div className="text-xs text-gray-400 mt-1">automation cycles</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-600">
              {automationStats.lastRun ? new Date(automationStats.lastRun).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </div>
            <div className="text-sm text-gray-600">Last Run</div>
            <div className="text-xs text-gray-400 mt-1">
              {automationStats.lastRun ? new Date(automationStats.lastRun).toLocaleDateString() : 'Never'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'content', label: 'Content Types', icon: Target },
          { id: 'settings', label: 'Settings', icon: Settings },
          { id: 'logs', label: 'Activity Logs', icon: Eye }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              if (tab.id === 'logs' && activityLogs.length === 0) {
                loadActivityLogs();
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action) => (
                  <Button
                    key={action.id}
                    onClick={action.action}
                    disabled={action.disabled || action.loading}
                    className="h-20 flex flex-col items-center justify-center space-y-2 text-center"
                    variant="outline"
                  >
                    {action.loading ? <Loader2 className="w-5 h-5 animate-spin" /> : action.icon}
                    <div>
                      <div className="font-medium">{action.title}</div>
                      <div className="text-xs text-gray-500">{action.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="font-medium">Live update generated</div>
                    <div className="text-sm text-gray-600">Real Madrid vs Barcelona • 2 minutes ago</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Info className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="font-medium">Betting tips published</div>
                    <div className="text-sm text-gray-600">Premier League predictions • 15 minutes ago</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="font-medium">News summary created</div>
                    <div className="text-sm text-gray-600">Daily football digest • 1 hour ago</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'content' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Content Types Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contentTypes.map((contentType) => (
                <div
                  key={contentType.id}
                  className={`border rounded-lg p-4 ${contentType.enabled ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{contentType.emoji}</span>
                      <div>
                        <div className="font-medium">{contentType.name}</div>
                        <div className="text-sm text-gray-600">{contentType.description}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPerformanceColor(contentType.performance)}>
                        {contentType.performance}
                      </Badge>
                      <Button
                        size="sm"
                        variant={contentType.enabled ? "default" : "outline"}
                        onClick={async () => {
                          const updatedContentTypes = contentTypes.map(ct => 
                            ct.id === contentType.id 
                              ? { ...ct, enabled: !ct.enabled }
                              : ct
                          );
                          setContentTypes(updatedContentTypes);
                          await saveContentTypes(updatedContentTypes);
                        }}
                      >
                        {contentType.enabled ? 'Enabled' : 'Enable'}
                      </Button>
                    </div>
                  </div>
                  {contentType.lastGenerated && (
                    <div className="text-xs text-gray-500">
                      Last generated: {new Date(contentType.lastGenerated).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Automation Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Global Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Full Automation Mode</div>
                      <div className="text-sm text-gray-600">Enable automatic content generation and posting</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleFullAutomation}
                      className={isFullAutomationEnabled ? 'text-green-600' : 'text-gray-400'}
                    >
                      {isFullAutomationEnabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'logs' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Activity Logs
              </div>
              <Button
                onClick={loadActivityLogs}
                disabled={logsLoading}
                size="sm"
                variant="outline"
              >
                {logsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Loading activity logs...</span>
              </div>
            ) : activityLogs.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      log.status === 'success' || log.type === 'content_generated'
                        ? 'bg-green-50 border-green-200'
                        : log.status === 'error'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {log.status === 'success' || log.type === 'content_generated' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : log.status === 'error' ? (
                        <XCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <Info className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-grow">
                      <div className="font-medium text-sm">{log.message}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(log.timestamp).toLocaleString()} 
                        {log.rule && ` • ${log.rule.name}`}
                        {log.contentGenerated > 0 && ` • Generated ${log.contentGenerated} items`}
                        {log.executionTime && ` • ${log.executionTime}ms`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="mb-2">No activity logs found</p>
                <p className="text-sm text-gray-400 mb-4">
                  Activity will appear here as automation rules run and content is generated
                </p>
                <div className="flex justify-center gap-2">
                  <Button onClick={runAutomationCycle} size="sm">
                    Run Automation Cycle
                  </Button>
                  <Button onClick={loadActivityLogs} variant="outline" size="sm">
                    Refresh Logs
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}