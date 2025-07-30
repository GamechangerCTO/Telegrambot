'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Plus,
  Settings,
  BarChart3,
  Zap
} from 'lucide-react';

// Import components we'll create
import DailyTimeline from './components/DailyTimeline';
import ManualPostForm from './components/ManualPostForm';
import ManualPostsTable from './components/ManualPostsTable';
import CronJobViewer from './components/CronJobViewer';
import ExecutionLogsTable from './components/ExecutionLogsTable';
import RuleManager from './components/RuleManager';

interface ChannelAutomationData {
  channel: any;
  stats: {
    scheduled: number;
    executed: number;
    failed: number;
    manual: number;
  };
  timeline: any[];
  rules: any[];
  executions: any[];
  manualPosts: any[];
}

export default function ChannelAutomationPage() {
  const params = useParams();
  const router = useRouter();
  const channelId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ChannelAutomationData | null>(null);
  const [automationEnabled, setAutomationEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState('timeline');

  useEffect(() => {
    if (channelId) {
      loadAutomationData();
    }
  }, [channelId]);

  const loadAutomationData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/automation/channel/${channelId}?type=overview`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setAutomationEnabled(result.data.channel?.auto_post_enabled || false);
      } else {
        console.error('Error loading automation data:', result.error);
      }
    } catch (error) {
      console.error('Error loading automation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAutomation = async () => {
    try {
      const response = await fetch(`/api/automation/channel/${channelId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle-automation',
          enabled: !automationEnabled
        })
      });

      const result = await response.json();
      if (result.success) {
        setAutomationEnabled(!automationEnabled);
        loadAutomationData(); // Refresh data
      }
    } catch (error) {
      console.error('Error toggling automation:', error);
    }
  };

  const executeRule = async (ruleId: string) => {
    try {
      const response = await fetch(`/api/automation/channel/${channelId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute-rule',
          ruleId
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('Rule executed successfully!');
        loadAutomationData(); // Refresh data
      } else {
        alert('Failed to execute rule: ' + result.error);
      }
    } catch (error) {
      console.error('Error executing rule:', error);
      alert('Error executing rule');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading automation dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Data</h2>
          <p className="text-gray-600 mb-4">Unable to load automation data for this channel</p>
          <Button onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'timeline', label: 'Daily Timeline', icon: Clock },
    { id: 'manual', label: 'Manual Posts', icon: Plus },
    { id: 'rules', label: 'Automation Rules', icon: Settings },
    { id: 'logs', label: 'Execution Logs', icon: BarChart3 },
    { id: 'cron', label: 'Cron Status', icon: Zap }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold">Automation Dashboard</h1>
              <Badge variant={automationEnabled ? 'default' : 'secondary'}>
                {automationEnabled ? 'Active' : 'Disabled'}
              </Badge>
            </div>
            <p className="text-gray-600">
              {data.channel?.name} • {data.channel?.language?.toUpperCase() || 'EN'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={toggleAutomation}
              variant={automationEnabled ? "outline" : "default"}
              className={automationEnabled ? "text-red-600 border-red-300" : "text-green-600"}
            >
              {automationEnabled ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Disable Automation
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Enable Automation
                </>
              )}
            </Button>
            
            <Button onClick={loadAutomationData} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            
            <Button onClick={() => router.push('/dashboard')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Scheduled Today</p>
                  <p className="text-2xl font-bold text-blue-600">{data.stats.scheduled}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Executed</p>
                  <p className="text-2xl font-bold text-green-600">{data.stats.executed}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{data.stats.failed}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Manual Posts</p>
                  <p className="text-2xl font-bold text-purple-600">{data.stats.manual}</p>
                </div>
                <Plus className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Navigation */}
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

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'timeline' && (
            <DailyTimeline 
              timeline={data.timeline} 
              onRefresh={loadAutomationData}
            />
          )}

          {activeTab === 'manual' && (
            <div className="space-y-6">
              <ManualPostForm 
                channelId={channelId} 
                onPostCreated={loadAutomationData}
              />
              <ManualPostsTable 
                posts={data.manualPosts} 
                onRefresh={loadAutomationData}
              />
            </div>
          )}

          {activeTab === 'rules' && (
            <RuleManager 
              rules={data.rules} 
              channelId={channelId}
              onExecuteRule={executeRule}
              onRefresh={loadAutomationData}
            />
          )}

          {activeTab === 'logs' && (
            <ExecutionLogsTable 
              executions={data.executions}
              onRefresh={loadAutomationData}
            />
          )}

          {activeTab === 'cron' && (
            <CronJobViewer 
              channelId={channelId}
            />
          )}
        </div>
      </div>
    </div>
  );
}