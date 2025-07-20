'use client'

import { useState, useEffect } from 'react'
import {
  PlusIcon,
  CogIcon,
  ClockIcon,
  DocumentTextIcon,
  LightBulbIcon,
  EyeIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  PlayIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { useAutomationRules } from '@/hooks/useAutomationRules'
import { usePendingApprovals } from '@/hooks/usePendingApprovals'

interface CronJob {
  id: string;
  name: string;
  description: string;
  schedule: string;
  nextExecution: Date;
  lastExecution?: Date;
  status: 'active' | 'inactive' | 'running' | 'error';
  type: 'news' | 'dynamic' | 'live' | 'smart-push' | 'daily' | 'morning' | 'system';
  frequency: string;
  estimatedDuration: string;
  lastResult?: {
    success: boolean;
    itemsProcessed: number;
    channelsSent: number;
    error?: string;
  };
}

export default function AutomationPage() {
  const [activeTab, setActiveTab] = useState<'rules' | 'pending' | 'analytics' | 'schedule'>('schedule')
  const [isCreatingRule, setIsCreatingRule] = useState(false)
  const [cronJobs, setCronJobs] = useState<CronJob[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())

  // Real hooks instead of mock data
  const {
    rules: automationRules,
    loading: rulesLoading,
    error: rulesError,
    toggleRule,
    executeRule,
    totalRules,
    activeRules,
    totalRuns,
    averageSuccessRate
  } = useAutomationRules()

  const {
    approvals: pendingApprovals,
    loading: approvalsLoading,
    error: approvalsError,
    processing,
    approveContent,
    rejectContent,
    editContent,
    totalPending,
    highConfidenceCount,
    averageConfidence
  } = usePendingApprovals()

  // Update current time every second for real-time countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Initialize CRON jobs schedule
  useEffect(() => {
    initializeCronSchedule()
  }, [])

  const initializeCronSchedule = () => {
    const now = new Date()
    
    const jobs: CronJob[] = [
      {
        id: 'morning-discovery',
        name: '🌅 Morning Discovery',
        description: 'Discover today\'s important matches and schedule content',
        schedule: '0 6 * * *',
        nextExecution: getNextExecution(6, 0), // 6:00 AM daily
        lastExecution: getLastExecution(6, 0),
        status: 'active',
        type: 'morning',
        frequency: 'Daily at 6:00 AM',
        estimatedDuration: '2-5 minutes',
        lastResult: {
          success: true,
          itemsProcessed: 8,
          channelsSent: 0,
        }
      },
      {
        id: 'news-morning',
        name: '📰 Morning News',
        description: 'RSS news content for morning audience',
        schedule: '0 8 * * *',
        nextExecution: getNextExecution(8, 0), // 8:00 AM daily
        lastExecution: getLastExecution(8, 0),
        status: 'active',
        type: 'news',
        frequency: 'Daily at 8:00 AM',
        estimatedDuration: '1-3 minutes',
        lastResult: {
          success: true,
          itemsProcessed: 3,
          channelsSent: 15,
        }
      },
      {
        id: 'news-afternoon',
        name: '📰 Afternoon News',
        description: 'RSS news content for afternoon audience',
        schedule: '0 14 * * *',
        nextExecution: getNextExecution(14, 0), // 2:00 PM daily
        lastExecution: getLastExecution(14, 0),
        status: 'active',
        type: 'news',
        frequency: 'Daily at 2:00 PM',
        estimatedDuration: '1-3 minutes',
        lastResult: {
          success: true,
          itemsProcessed: 2,
          channelsSent: 12,
        }
      },
      {
        id: 'news-evening',
        name: '📰 Evening News',
        description: 'RSS news content for evening audience',
        schedule: '0 20 * * *',
        nextExecution: getNextExecution(20, 0), // 8:00 PM daily
        lastExecution: getLastExecution(20, 0),
        status: 'active',
        type: 'news',
        frequency: 'Daily at 8:00 PM',
        estimatedDuration: '1-3 minutes',
        lastResult: {
          success: true,
          itemsProcessed: 4,
          channelsSent: 18,
        }
      },
      {
        id: 'dynamic-content',
        name: '⚡ Dynamic Content',
        description: 'Scheduled match content (betting, analysis, polls)',
        schedule: '*/10 * * * *',
        nextExecution: getNextMinutes(10), // Every 10 minutes
        lastExecution: getLastMinutes(10),
        status: 'active',
        type: 'dynamic',
        frequency: 'Every 10 minutes',
        estimatedDuration: '30s - 2 minutes',
        lastResult: {
          success: true,
          itemsProcessed: 5,
          channelsSent: 25,
        }
      },
      {
        id: 'live-updates',
        name: '🔴 Live Updates',
        description: 'Real-time match updates during active games',
        schedule: '*/3 * * * *',
        nextExecution: getNextMinutes(3), // Every 3 minutes
        lastExecution: getLastMinutes(3),
        status: now.getHours() >= 6 && now.getHours() <= 23 ? 'active' : 'inactive',
        type: 'live',
        frequency: 'Every 3 minutes (6 AM - 11 PM)',
        estimatedDuration: '15-45 seconds',
        lastResult: {
          success: true,
          itemsProcessed: 2,
          channelsSent: 8,
        }
      },
      {
        id: 'smart-push',
        name: '💰 Smart Push (Coupons)',
        description: 'Intelligent coupon delivery during peak hours',
        schedule: '0 */2 * * *',
        nextExecution: getNextHours(2), // Every 2 hours
        lastExecution: getLastHours(2),
        status: (now.getHours() >= 10 && now.getHours() <= 22) ? 'active' : 'inactive',
        type: 'smart-push',
        frequency: 'Every 2 hours (10 AM - 10 PM)',
        estimatedDuration: '1-2 minutes',
        lastResult: {
          success: true,
          itemsProcessed: 1,
          channelsSent: 3,
        }
      },
      {
        id: 'daily-summary',
        name: '📅 Daily Summary',
        description: 'End of day match summaries and statistics',
        schedule: '0 23 * * *',
        nextExecution: getNextExecution(23, 0), // 11:00 PM daily
        lastExecution: getLastExecution(23, 0),
        status: 'active',
        type: 'daily',
        frequency: 'Daily at 11:00 PM',
        estimatedDuration: '2-4 minutes',
        lastResult: {
          success: true,
          itemsProcessed: 6,
          channelsSent: 20,
        }
      }
    ]

    setCronJobs(jobs)
  }

  // Helper functions for time calculations
  function getNextExecution(hour: number, minute: number): Date {
    const now = new Date()
    const next = new Date()
    next.setHours(hour, minute, 0, 0)
    
    if (next <= now) {
      next.setDate(next.getDate() + 1)
    }
    
    return next
  }

  function getLastExecution(hour: number, minute: number): Date {
    const now = new Date()
    const last = new Date()
    last.setHours(hour, minute, 0, 0)
    
    if (last > now) {
      last.setDate(last.getDate() - 1)
    }
    
    return last
  }

  function getNextMinutes(minutes: number): Date {
    const now = new Date()
    const next = new Date(now)
    const currentMinute = now.getMinutes()
    const nextInterval = Math.ceil(currentMinute / minutes) * minutes
    
    if (nextInterval >= 60) {
      next.setHours(next.getHours() + 1, nextInterval - 60, 0, 0)
    } else {
      next.setMinutes(nextInterval, 0, 0)
    }
    
    return next
  }

  function getLastMinutes(minutes: number): Date {
    const now = new Date()
    const last = new Date(now)
    const currentMinute = now.getMinutes()
    const lastInterval = Math.floor(currentMinute / minutes) * minutes
    
    last.setMinutes(lastInterval, 0, 0)
    return last
  }

  function getNextHours(hours: number): Date {
    const now = new Date()
    const next = new Date(now)
    const currentHour = now.getHours()
    const nextInterval = Math.ceil(currentHour / hours) * hours
    
    if (nextInterval >= 24) {
      next.setDate(next.getDate() + 1)
      next.setHours(nextInterval - 24, 0, 0, 0)
    } else {
      next.setHours(nextInterval, 0, 0, 0)
    }
    
    return next
  }

  function getLastHours(hours: number): Date {
    const now = new Date()
    const last = new Date(now)
    const currentHour = now.getHours()
    const lastInterval = Math.floor(currentHour / hours) * hours
    
    last.setHours(lastInterval, 0, 0, 0)
    return last
  }

  const getTimeUntilExecution = (nextExecution: Date): string => {
    const now = currentTime
    const diff = nextExecution.getTime() - now.getTime()
    
    if (diff <= 0) return 'NOW'
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days}d ${hours % 24}h`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m`
    
    return 'NOW'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'running': return 'bg-blue-100 text-blue-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    const colors = {
      'news': 'bg-purple-100 text-purple-800',
      'dynamic': 'bg-blue-100 text-blue-800',
      'live': 'bg-red-100 text-red-800',
      'smart-push': 'bg-green-100 text-green-800',
      'daily': 'bg-orange-100 text-orange-800',
      'morning': 'bg-yellow-100 text-yellow-800',
      'system': 'bg-gray-100 text-gray-800'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  // Handle approval actions
  const handleApprove = async (approvalId: string) => {
    const success = await approveContent(approvalId)
    if (success) {
      console.log('✅ Content approved and sent')
    }
  }

  const handleReject = async (approvalId: string) => {
    const success = await rejectContent(approvalId, 'Manual rejection')
    if (success) {
      console.log('❌ Content rejected')
    }
  }

  const handleEdit = async (approvalId: string) => {
    // TODO: Open edit modal
    console.log('✏️ Edit content:', approvalId)
  }

  const handleExecuteRule = async (ruleId: string) => {
    const success = await executeRule(ruleId)
    if (success) {
      console.log('⚡ Rule executed successfully')
    }
  }

  const triggerCronJob = async (jobId: string) => {
    try {
      const job = cronJobs.find(j => j.id === jobId)
      if (!job) return

      // Update status to running
      setCronJobs(prev => prev.map(j => 
        j.id === jobId ? { ...j, status: 'running' } : j
      ))

      let endpoint = ''
      switch (jobId) {
        case 'morning-discovery':
          endpoint = '/api/automation/cron/morning-discovery'
          break
        case 'news-morning':
        case 'news-afternoon':
        case 'news-evening':
          endpoint = '/api/automation/cron/news-only'
          break
        case 'dynamic-content':
          endpoint = '/api/automation/cron/dynamic-content'
          break
        case 'live-updates':
          endpoint = '/api/automation/cron/live-updates'
          break
        case 'smart-push':
          endpoint = '/api/automation/cron/smart-push'
          break
        case 'daily-summary':
          endpoint = '/api/automation/cron/daily'
          break
        default:
          throw new Error('Unknown job type')
      }

      const response = await fetch(endpoint, {
        method: jobId === 'morning-discovery' ? 'GET' : 'POST'
      })

      if (!response.ok) {
        throw new Error(`Failed to execute ${job.name}`)
      }

      const result = await response.json()
      
      // Update with success
      setCronJobs(prev => prev.map(j => 
        j.id === jobId ? { 
          ...j, 
          status: 'active',
          lastExecution: new Date(),
          lastResult: {
            success: true,
            itemsProcessed: result.executed || result.tasks?.length || 1,
            channelsSent: result.channels || result.success || 0
          }
        } : j
      ))

      console.log(`✅ ${job.name} executed successfully`)

    } catch (error) {
      console.error('❌ Error executing CRON job:', error)
      
      // Update with error
      setCronJobs(prev => prev.map(j => 
        j.id === jobId ? { 
          ...j, 
          status: 'error',
          lastResult: {
            success: false,
            itemsProcessed: 0,
            channelsSent: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        } : j
      ))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Automation System</h1>
            <p className="text-gray-600 mt-2">
              Real-time automation management with transparent scheduling
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">System Active</span>
            </div>
            <button
              onClick={() => setIsCreatingRule(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5 inline mr-2" />
              New Rule
            </button>
          </div>
        </div>

        {/* Real-time Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Rules</p>
                <p className="text-2xl font-bold text-blue-900">{totalRules}</p>
              </div>
              <CogIcon className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Active Rules</p>
                <p className="text-2xl font-bold text-green-900">{activeRules}</p>
              </div>
              <PlayIcon className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Total Runs</p>
                <p className="text-2xl font-bold text-purple-900">{totalRuns}</p>
              </div>
              <ChartBarIcon className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Success Rate</p>
                <p className="text-2xl font-bold text-orange-900">{averageSuccessRate.toFixed(1)}%</p>
              </div>
              <CheckIcon className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mt-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'schedule'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CalendarIcon className="w-4 h-4 inline mr-2" />
            Schedule
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'rules'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CogIcon className="w-4 h-4 inline mr-2" />
            Automation Rules
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
              activeTab === 'pending'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ClockIcon className="w-4 h-4 inline mr-2" />
            Pending Approval
            {totalPending > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {totalPending}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <DocumentTextIcon className="w-4 h-4 inline mr-2" />
            Analytics
          </button>
        </div>
      </div>

      {/* Error Display */}
      {(rulesError || approvalsError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-2" />
            <p className="text-red-800">
              {rulesError || approvalsError}
            </p>
          </div>
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">⏰ Content Schedule</h2>
              <p className="text-gray-600 mt-1">
                Real-time view of when content will be sent - even on days without matches
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Current time: {currentTime.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Next content delivery</p>
              <p className="text-lg font-bold text-blue-600">
                {cronJobs
                  .filter(job => job.status === 'active')
                  .sort((a, b) => a.nextExecution.getTime() - b.nextExecution.getTime())[0]
                  ?.nextExecution.toLocaleTimeString() || 'N/A'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {cronJobs
              .sort((a, b) => a.nextExecution.getTime() - b.nextExecution.getTime())
              .map((job) => (
              <div key={job.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                {/* Job Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-900">{job.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                      {job.status.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(job.type)}`}>
                      {job.type}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Next execution</p>
                      <p className="font-bold text-blue-600">{getTimeUntilExecution(job.nextExecution)}</p>
                    </div>
                    <button
                      onClick={() => triggerCronJob(job.id)}
                      disabled={job.status === 'running'}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                    >
                      {job.status === 'running' ? 'Running...' : 'Run Now'}
                    </button>
                  </div>
                </div>

                {/* Job Details */}
                <p className="text-gray-600 text-sm mb-3">{job.description}</p>

                {/* Timing Information */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Frequency</p>
                    <p className="text-sm font-medium">{job.frequency}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Next Run</p>
                    <p className="text-sm font-medium">{job.nextExecution.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="text-sm font-medium">{job.estimatedDuration}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Last Run</p>
                    <p className="text-sm font-medium">
                      {job.lastExecution ? job.lastExecution.toLocaleString() : 'Never'}
                    </p>
                  </div>
                </div>

                {/* Last Result */}
                {job.lastResult && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${
                          job.lastResult.success ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <span className="text-sm font-medium">
                          Last execution: {job.lastResult.success ? 'Success' : 'Failed'}
                        </span>
                      </div>
                      <div className="flex space-x-4 text-sm text-gray-600">
                        <span>📊 {job.lastResult.itemsProcessed} items</span>
                        <span>📤 {job.lastResult.channelsSent} channels</span>
                      </div>
                    </div>
                    {job.lastResult.error && (
                      <p className="text-red-600 text-sm mt-2">❌ {job.lastResult.error}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Schedule Summary */}
          <div className="mt-8 bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">📋 Today's Schedule Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-blue-600 font-medium">News Deliveries</p>
                <p className="text-xl font-bold text-blue-900">
                  {cronJobs.filter(j => j.type === 'news').length} times/day
                </p>
                <p className="text-xs text-blue-600">8 AM, 2 PM, 8 PM</p>
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Match Content</p>
                <p className="text-xl font-bold text-blue-900">
                  Every 10m
                </p>
                <p className="text-xs text-blue-600">When matches scheduled</p>
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Live Updates</p>
                <p className="text-xl font-bold text-blue-900">
                  Every 3m
                </p>
                <p className="text-xs text-blue-600">During active hours</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Automation Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          {rulesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : automationRules.length === 0 ? (
            <div className="text-center py-12">
              <CogIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No automation rules yet</h3>
              <p className="text-gray-600 mb-4">Create your first automation rule to get started</p>
              <button
                onClick={() => setIsCreatingRule(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create First Rule
              </button>
            </div>
          ) : (
            automationRules.map((rule) => (
              <div key={rule.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      rule.type === 'full_auto' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {rule.type === 'full_auto' ? (
                        <LightBulbIcon className="w-6 h-6" />
                      ) : (
                        <EyeIcon className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          rule.type === 'full_auto'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {rule.type === 'full_auto' ? 'Full Auto' : 'Manual Approval'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {rule.content_types?.join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleExecuteRule(rule.id)}
                      className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50"
                      title="Execute Rule Now"
                    >
                      <PlayIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        rule.enabled ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          rule.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <button className="text-gray-400 hover:text-gray-600">
                      <PencilIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Rule Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Schedule</h4>
                    <p className="text-sm text-gray-600">
                      {rule.schedule?.frequency} at {rule.schedule?.times?.join(', ')}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Channels & Languages</h4>
                    <p className="text-sm text-gray-600">
                      {rule.channels?.length || 0} channels • {rule.languages?.join(', ')}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Performance</h4>
                    <p className="text-sm text-gray-600">
                      {rule.stats?.totalRuns || 0} runs • {rule.stats?.successRate || 0}% success
                    </p>
                  </div>
                </div>

                {/* Next Run Info */}
                {rule.enabled && rule.nextRun && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Next run: {new Date(rule.nextRun).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Pending Approval Tab */}
      {activeTab === 'pending' && (
        <div className="space-y-6">
          {approvalsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : pendingApprovals.length === 0 ? (
            <div className="text-center py-12">
              <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pending approvals</h3>
              <p className="text-gray-600">All automation content has been processed</p>
            </div>
          ) : (
            <>
              {/* Pending Statistics */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{totalPending}</p>
                    <p className="text-sm text-gray-600">Total Pending</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{highConfidenceCount}</p>
                    <p className="text-sm text-gray-600">High Confidence (80%+)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{averageConfidence.toFixed(1)}%</p>
                    <p className="text-sm text-gray-600">Average AI Confidence</p>
                  </div>
                </div>
              </div>

              {/* Pending Content List */}
              {pendingApprovals.map((approval) => (
                <div key={approval.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{approval.rule_name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          approval.content_type === 'betting_tip' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : approval.content_type === 'news'
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {approval.content_type}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {approval.language}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        Generated: {new Date(approval.generated_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">AI Confidence</p>
                        <p className={`text-lg font-bold ${
                          approval.ai_confidence >= 80 
                            ? 'text-green-600' 
                            : approval.ai_confidence >= 60 
                            ? 'text-yellow-600' 
                            : 'text-red-600'
                        }`}>
                          {approval.ai_confidence}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Content Preview */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Content Preview</h4>
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {approval.content.preview || approval.content.text}
                    </p>
                    {approval.content.imageUrl && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">📸 Image attached</p>
                      </div>
                    )}
                  </div>

                  {/* Channel Info */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Target Channels</h4>
                    <p className="text-sm text-gray-600">
                      {approval.channels.join(', ')} • Estimated Engagement: {approval.estimated_engagement}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleApprove(approval.id)}
                        disabled={processing}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center"
                      >
                        <CheckIcon className="w-4 h-4 mr-2" />
                        Approve & Send
                      </button>
                      <button
                        onClick={() => handleEdit(approval.id)}
                        disabled={processing}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
                      >
                        <PencilIcon className="w-4 h-4 mr-2" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleReject(approval.id)}
                        disabled={processing}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center"
                      >
                        <XMarkIcon className="w-4 h-4 mr-2" />
                        Reject
                      </button>
                    </div>
                    {processing && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Automation Analytics</h3>
          <div className="text-center py-12">
            <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Analytics dashboard coming soon...</p>
          </div>
        </div>
      )}
    </div>
  )
} 