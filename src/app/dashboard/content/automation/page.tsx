'use client'

import { useState } from 'react'
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
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { useAutomationRules } from '@/hooks/useAutomationRules'
import { usePendingApprovals } from '@/hooks/usePendingApprovals'

export default function AutomationPage() {
  const [activeTab, setActiveTab] = useState<'rules' | 'pending' | 'analytics'>('rules')
  const [isCreatingRule, setIsCreatingRule] = useState(false)

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Automation System</h1>
            <p className="text-gray-600 mt-2">
              Advanced automation management with full control or manual approval
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