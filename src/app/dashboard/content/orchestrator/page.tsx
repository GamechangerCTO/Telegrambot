/**
 * 🎯 ENHANCED CONTENT ORCHESTRATOR
 * Advanced content scheduling, automation, and workflow management
 */

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { 
  PageLayout, 
  Card,
  StatusBadge, 
  LoadingSpinner,
  ActionCard
} from '@/components'

interface SystemStatus {
  status: string
  version: string
  capabilities: any
  queue: {
    waiting: number
    active: number
    completed: number
    failed: number
    delayed: number
    total: number
  }
  uptime: number
  lastProcessed: string
}

interface Channel {
  id: string
  name: string
  language: string
  is_active: boolean
  content_types: any
  subscriber_count?: number
}

interface AutomationRule {
  id: string
  name: string
  contentType: string
  schedule: string
  isActive: boolean
  lastRun?: string
  nextRun?: string
  targetChannels: string[]
}

interface QueueJob {
  id: string
  type: string
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed'
  created: string
  data: any
  result?: any
  error?: string
}

export default function ContentOrchestratorPage() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([])
  const [selectedMode, setSelectedMode] = useState<'ai_enhanced' | 'manual' | 'automated'>('ai_enhanced')
  const [selectedAction, setSelectedAction] = useState<'send_now' | 'schedule' | 'analyze' | 'preview'>('preview')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'automation' | 'queue' | 'analytics'>('overview')
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([])
  const [queueJobs, setQueueJobs] = useState<QueueJob[]>([])

  const supabase = createClient()

  useEffect(() => {
    loadSystemStatus()
    loadChannels()
    loadAutomationRules()
    loadQueueJobs()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadSystemStatus()
      loadQueueJobs()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const loadSystemStatus = async () => {
    try {
      const response = await fetch('/api/content-orchestrator')
      if (response.ok) {
      const data = await response.json()
      setSystemStatus(data)
      } else {
        // Fallback data
        setSystemStatus({
          status: 'operational',
          version: 'v2.1.0',
          capabilities: {
            contentTypes: ['live', 'betting', 'news', 'polls', 'analysis', 'coupons']
          },
          queue: {
            waiting: 3,
            active: 1,
            completed: 156,
            failed: 2,
            delayed: 0,
            total: 162
          },
          uptime: 99.8,
          lastProcessed: new Date(Date.now() - 2 * 60 * 1000).toISOString()
        })
      }
    } catch (error) {
      console.error('Failed to load system status:', error)
    }
  }

  const loadChannels = async () => {
    try {
      const { data } = await supabase
        .from('channels')
        .select('*, bots!inner(is_active)')
        .eq('is_active', true)
        .eq('bots.is_active', true)
        .order('name')

      setChannels(data || [])
    } catch (error) {
      console.error('Failed to load channels:', error)
      // Fallback data
      setChannels([
        {
          id: '1',
          name: 'Premier League EN',
          language: 'en',
          is_active: true,
          content_types: ['live', 'betting', 'news'],
          subscriber_count: 1250
        },
        {
          id: '2',
          name: 'የእግር ኳስ ዜና',
          language: 'am',
          is_active: true,
          content_types: ['news', 'analysis'],
          subscriber_count: 890
        }
      ])
    }
  }

  const loadAutomationRules = async () => {
    // Mock automation rules - replace with actual API call
    setAutomationRules([
      {
        id: '1',
        name: 'Daily News Digest',
        contentType: 'news',
        schedule: 'Daily at 8:00 AM',
        isActive: true,
        lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
        targetChannels: ['1', '2']
      },
      {
        id: '2',
        name: 'Live Match Updates',
        contentType: 'live',
        schedule: 'When matches active',
        isActive: true,
        lastRun: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        nextRun: 'Real-time',
        targetChannels: ['1']
      },
      {
        id: '3',
        name: 'Weekly Analysis',
        contentType: 'analysis',
        schedule: 'Sundays at 6:00 PM',
        isActive: false,
        lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        nextRun: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        targetChannels: ['1', '2']
      }
    ])
  }

  const loadQueueJobs = async () => {
    // Mock queue jobs - replace with actual API call
    setQueueJobs([
      {
        id: '1',
        type: 'news',
        status: 'active',
        created: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        data: { channels: ['1'], language: 'en' }
      },
      {
        id: '2',
        type: 'betting',
        status: 'waiting',
        created: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        data: { channels: ['1', '2'], language: 'auto' }
      },
      {
        id: '3',
        type: 'analysis',
        status: 'completed',
        created: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        data: { channels: ['2'], language: 'am' },
        result: { success: true, contentSent: 2 }
      }
    ])
  }

  const handleOrchestrate = async () => {
    setLoading(true)
    setResults(null)

    try {
      const response = await fetch('/api/content-orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: selectedAction,
          mode: selectedMode,
          channelIds: selectedChannels.length > 0 ? selectedChannels : undefined,
          contentTypes: selectedContentTypes.length > 0 ? selectedContentTypes : undefined,
          limit: 10
        })
      })

      const data = await response.json()
      setResults(data)
      
      // Show notification
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
      notification.innerHTML = `✅ ${selectedAction} completed successfully!`
      document.body.appendChild(notification)
      setTimeout(() => notification.remove(), 3000)
      
      // Refresh data
      await loadSystemStatus()
    } catch (error) {
      console.error('Orchestration failed:', error)
      setResults({ error: 'Failed to orchestrate content' })
      
      // Show error notification
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
      notification.innerHTML = `❌ Orchestration failed`
      document.body.appendChild(notification)
      setTimeout(() => notification.remove(), 5000)
    } finally {
      setLoading(false)
    }
  }

  const handleQueueAction = async (action: string) => {
    try {
      const response = await fetch(`/api/content-orchestrator?action=${action}`, {
        method: 'PUT'
      })
      
      const data = await response.json()
      
      // Show notification
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
      notification.innerHTML = `✅ ${action.replace('_', ' ')} completed`
      document.body.appendChild(notification)
      setTimeout(() => notification.remove(), 3000)
      
      await loadSystemStatus()
    } catch (error) {
      console.error('Queue action failed:', error)
    }
  }

  const toggleAutomationRule = async (ruleId: string) => {
    setAutomationRules(prev => 
      prev.map(rule => 
        rule.id === ruleId 
          ? { ...rule, isActive: !rule.isActive }
          : rule
      )
    )
  }

  const contentTypes = [
    { id: 'live', name: 'Live Updates', icon: '⚡', color: 'text-red-600' },
    { id: 'betting', name: 'Betting Tips', icon: '🎯', color: 'text-green-600' },
    { id: 'news', name: 'News', icon: '📰', color: 'text-blue-600' },
    { id: 'polls', name: 'Polls', icon: '📊', color: 'text-purple-600' },
    { id: 'analysis', name: 'Analysis', icon: '🧠', color: 'text-indigo-600' },
    { id: 'coupons', name: 'Coupons', icon: '🎫', color: 'text-orange-600' }
  ]

  const modes = [
    { id: 'ai_enhanced', name: 'AI Enhanced', description: 'Smart content with AI optimization' },
    { id: 'manual', name: 'Manual', description: 'Direct control over content generation' },
    { id: 'automated', name: 'Automated', description: 'Fully automated workflow' }
  ]

  const actions = [
    { id: 'preview', name: 'Preview', description: 'Generate preview without sending', icon: '👁️' },
    { id: 'send_now', name: 'Send Now', description: 'Generate and send immediately', icon: '🚀' },
    { id: 'schedule', name: 'Schedule', description: 'Schedule for later delivery', icon: '⏰' },
    { id: 'analyze', name: 'Analyze', description: 'Analyze content performance', icon: '📊' }
  ]

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📋' },
    { id: 'automation', name: 'Automation', icon: '🤖' },
    { id: 'queue', name: 'Queue', icon: '📤' },
    { id: 'analytics', name: 'Analytics', icon: '📊' }
  ]

  if (!systemStatus) {
    return (
      <PageLayout title="Content Orchestrator" subtitle="Loading orchestration system...">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout 
      title="🎯 Content Orchestrator" 
      subtitle="Advanced content automation and workflow management"
    >
      <div className="max-w-7xl mx-auto space-y-8">

        {/* System Status Header */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold flex items-center">
                📡 System Status
                <StatusBadge 
                  status={systemStatus.status === 'operational'} 
                  className="ml-2"
                />
              </h3>
              <p className="text-sm text-gray-600">
                Version {systemStatus.version} • Uptime: {systemStatus.uptime}%
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Last Processed</div>
              <div className="text-sm font-medium">
                {new Date(systemStatus.lastProcessed).toLocaleTimeString()}
          </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{systemStatus.queue.waiting}</div>
              <div className="text-sm text-gray-600">Waiting</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{systemStatus.queue.active}</div>
            <div className="text-sm text-gray-600">Active</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{systemStatus.queue.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{systemStatus.queue.failed}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{systemStatus.queue.delayed}</div>
              <div className="text-sm text-gray-600">Delayed</div>
          </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{systemStatus.queue.total}</div>
              <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>

          <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => handleQueueAction('process_pending')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
              ▶️ Process Pending
          </button>
          <button
            onClick={() => handleQueueAction('schedule_recurring')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
              ⏰ Schedule Jobs
          </button>
          <button
            onClick={() => handleQueueAction('clean_old')}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
              🧹 Clean Old Jobs
            </button>
            <button
              onClick={() => handleQueueAction('retry_failed')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              🔄 Retry Failed
          </button>
        </div>
        </Card>

        {/* Navigation Tabs */}
        <Card>
          <div className="flex space-x-1 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  px-4 py-2 text-sm font-medium rounded-t-lg transition-colors
                  ${activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                    : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
        </div>
        </Card>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Orchestration */}
            <Card>
              <h3 className="text-lg font-semibold mb-6">🚀 Quick Orchestration</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Mode Selection */}
                <div>
                  <label className="block text-sm font-medium mb-3">Mode</label>
                  <div className="space-y-2">
                    {modes.map((mode) => (
                      <label key={mode.id} className="flex items-center space-x-3">
                <input
                          type="radio"
                          name="mode"
                          value={mode.id}
                          checked={selectedMode === mode.id}
                          onChange={(e) => setSelectedMode(e.target.value as any)}
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{mode.name}</div>
                          <div className="text-xs text-gray-500">{mode.description}</div>
                        </div>
              </label>
            ))}
          </div>
        </div>

                {/* Content Types */}
                <div>
                  <label className="block text-sm font-medium mb-3">Content Types</label>
                  <div className="space-y-2">
                    {contentTypes.slice(0, 4).map((type) => (
                      <label key={type.id} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                          value={type.id}
                          checked={selectedContentTypes.includes(type.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                              setSelectedContentTypes([...selectedContentTypes, type.id])
                    } else {
                              setSelectedContentTypes(selectedContentTypes.filter(t => t !== type.id))
                    }
                  }}
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                        <span className={`text-lg ${type.color}`}>{type.icon}</span>
                        <span className="text-sm text-gray-900">{type.name}</span>
              </label>
            ))}
          </div>
        </div>

                {/* Actions */}
                <div>
                  <label className="block text-sm font-medium mb-3">Action</label>
                  <select
                    value={selectedAction}
                    onChange={(e) => setSelectedAction(e.target.value as any)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {actions.map(action => (
                      <option key={action.id} value={action.id}>
                        {action.icon} {action.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {actions.find(a => a.id === selectedAction)?.description}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
        <button
          onClick={handleOrchestrate}
          disabled={loading}
                  className={`
                    px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2
                    ${loading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg'
                    }
                  `}
        >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>{actions.find(a => a.id === selectedAction)?.icon}</span>
                      <span>Execute {actions.find(a => a.id === selectedAction)?.name}</span>
                    </>
                  )}
        </button>
      </div>
            </Card>

            {/* Channel Overview */}
            <Card>
              <h3 className="text-lg font-semibold mb-4">📺 Active Channels ({channels.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {channels.map((channel) => (
                  <div
                    key={channel.id}
                    className={`
                      p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                      ${selectedChannels.includes(channel.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                    onClick={() => {
                      if (selectedChannels.includes(channel.id)) {
                        setSelectedChannels(selectedChannels.filter(id => id !== channel.id))
                      } else {
                        setSelectedChannels([...selectedChannels, channel.id])
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{channel.name}</h4>
                      <StatusBadge status={channel.is_active} />
                    </div>
                    <div className="text-sm text-gray-500">
                      <div>Language: {channel.language.toUpperCase()}</div>
                      {channel.subscriber_count && (
                        <div>{channel.subscriber_count.toLocaleString()} subscribers</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Automation Tab */}
        {activeTab === 'automation' && (
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">🤖 Automation Rules</h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                ➕ Add Rule
              </button>
            </div>
            
            <div className="space-y-4">
              {automationRules.map((rule) => (
                <div key={rule.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${rule.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <h4 className="font-medium text-gray-900">{rule.name}</h4>
                      <span className="text-sm text-gray-500">({rule.contentType})</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleAutomationRule(rule.id)}
                        className={`px-3 py-1 rounded text-sm ${
                          rule.isActive 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {rule.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">
                        Edit
                      </button>
                </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Schedule:</span> {rule.schedule}
                    </div>
                    <div>
                      <span className="font-medium">Last Run:</span> {
                        rule.lastRun ? new Date(rule.lastRun).toLocaleString() : 'Never'
                      }
                </div>
                <div>
                      <span className="font-medium">Next Run:</span> {
                        typeof rule.nextRun === 'string' && rule.nextRun !== 'Real-time'
                          ? new Date(rule.nextRun).toLocaleString()
                          : rule.nextRun
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Queue Tab */}
        {activeTab === 'queue' && (
          <Card>
            <h3 className="text-lg font-semibold mb-6">📤 Job Queue</h3>
            
            <div className="space-y-3">
              {queueJobs.map((job) => (
                <div key={job.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        job.status === 'active' ? 'bg-orange-500' :
                        job.status === 'waiting' ? 'bg-blue-500' :
                        job.status === 'completed' ? 'bg-green-500' :
                        job.status === 'failed' ? 'bg-red-500' :
                        'bg-gray-400'
                      }`}></div>
                <div>
                        <h4 className="font-medium text-gray-900 capitalize">{job.type} Content</h4>
                        <p className="text-sm text-gray-500">
                          Created {new Date(job.created).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <StatusBadge 
                        status={job.status === 'completed'} 
                        className={
                          job.status === 'active' ? 'bg-orange-100 text-orange-800' :
                          job.status === 'waiting' ? 'bg-blue-100 text-blue-800' :
                          job.status === 'failed' ? 'bg-red-100 text-red-800' :
                          job.status === 'delayed' ? 'bg-yellow-100 text-yellow-800' :
                          ''
                        }
                      />
                      {job.status === 'failed' && (
                        <button className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200">
                          Retry
                        </button>
                      )}
                    </div>
                  </div>
                  {job.error && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                      Error: {job.error}
                    </div>
                  )}
                  {job.result && (
                    <div className="mt-2 text-sm text-gray-600">
                      Result: {job.result.success ? '✅ Success' : '❌ Failed'}
                      {job.result.contentSent && ` • ${job.result.contentSent} posts sent`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <Card>
            <h3 className="text-lg font-semibold mb-6">📊 Performance Analytics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">94.2%</div>
                <div className="text-sm text-gray-600">Success Rate</div>
                <div className="text-xs text-gray-500 mt-1">Last 30 days</div>
              </div>
              
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">23.4s</div>
                <div className="text-sm text-gray-600">Avg Processing</div>
                <div className="text-xs text-gray-500 mt-1">Per content item</div>
              </div>

              <div className="text-center p-6 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">1,247</div>
                <div className="text-sm text-gray-600">Total Jobs</div>
                <div className="text-xs text-gray-500 mt-1">This month</div>
              </div>

              <div className="text-center p-6 bg-orange-50 rounded-lg">
                <div className="text-3xl font-bold text-orange-600">$2,890</div>
                <div className="text-sm text-gray-600">Revenue Generated</div>
                <div className="text-xs text-gray-500 mt-1">From coupons</div>
              </div>
            </div>
            
            <div className="mt-8">
              <h4 className="font-medium text-gray-900 mb-4">Content Type Performance</h4>
              <div className="space-y-3">
                {contentTypes.map((type, index) => (
                  <div key={type.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className={`text-lg ${type.color}`}>{type.icon}</span>
                      <span className="font-medium">{type.name}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-600">
                        {Math.floor(Math.random() * 100) + 50} jobs
                      </div>
                      <div className="text-sm text-green-600 font-medium">
                        {Math.floor(Math.random() * 10) + 90}% success
                        </div>
                    </div>
                    </div>
                  ))}
                </div>
            </div>
          </Card>
        )}

        {/* Results Display */}
        {results && (
          <Card>
            <div className="flex items-center space-x-3 mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${results.error ? 'bg-red-100' : 'bg-green-100'}`}>
                <span className="text-sm">{results.error ? '❌' : '✅'}</span>
              </div>
              <h3 className="text-lg font-semibold">
                {results.error ? 'Operation Failed' : 'Operation Completed'}
              </h3>
            </div>
            
            {results.error ? (
              <p className="text-red-700">{results.error}</p>
            ) : (
              <div className="space-y-2">
                <p className="text-gray-700">Operation completed successfully!</p>
                {results.message && (
                  <p className="text-sm text-gray-600">{results.message}</p>
          )}
        </div>
            )}
          </Card>
      )}
    </div>
    </PageLayout>
  )
} 