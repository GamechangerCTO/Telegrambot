'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface Partnership {
  id: string
  organization: { id: string; name: string }
  partner_organization: { id: string; name: string }
  network: { id: string; name: string; network_type: string }
  partnership_type: string
  status: string
  daily_share_limit: number
  priority_level: number
  can_modify_content: boolean
  requires_attribution: boolean
  requires_manual_approval: boolean
  created_at: string
}

interface ContentDistribution {
  id: string
  source_organization: { id: string; name: string }
  target_organization: { id: string; name: string }
  source_bot: { id: string; name: string }
  target_bot: { id: string; name: string }
  source_channel: { id: string; name: string }
  target_channel: { id: string; name: string }
  content_type: string
  original_language: string
  shared_language: string
  approval_status: string
  modification_level: string
  content_quality_score: number
  shared_at: string
  created_at: string
}

export default function MultiOrgManagement() {
  const [partnerships, setPartnerships] = useState<Partnership[]>([])
  const [distributions, setDistributions] = useState<ContentDistribution[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'partnerships' | 'distributions'>('partnerships')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch partnerships
      const partnershipsResponse = await fetch('/api/multi-org/partnerships')
      const partnershipsData = await partnershipsResponse.json()
      
      if (partnershipsData.success) {
        setPartnerships(partnershipsData.partnerships)
      }
      
      // Fetch content distributions
      const distributionsResponse = await fetch('/api/multi-org/content-sharing')
      const distributionsData = await distributionsResponse.json()
      
      if (distributionsData.success) {
        setDistributions(distributionsData.distributions)
      }
      
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveContent = async (distributionId: string) => {
    try {
      const response = await fetch('/api/multi-org/content-sharing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: distributionId,
          approval_status: 'approved',
          approved_by: 'current-user-id' // Replace with actual user ID
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchData() // Refresh data
      }
    } catch (error) {
      console.error('Error approving content:', error)
    }
  }

  const handleRejectContent = async (distributionId: string) => {
    try {
      const response = await fetch('/api/multi-org/content-sharing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: distributionId,
          approval_status: 'rejected',
          approved_by: 'current-user-id' // Replace with actual user ID
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchData() // Refresh data
      }
    } catch (error) {
      console.error('Error rejecting content:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Multi-Organization Management
        </h1>
        <p className="text-gray-600">
          Manage partnerships and content sharing between organizations
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('partnerships')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'partnerships'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Partnerships ({partnerships.length})
        </button>
        <button
          onClick={() => setActiveTab('distributions')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'distributions'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Content Sharing ({distributions.length})
        </button>
      </div>

      {/* Partnerships Tab */}
      {activeTab === 'partnerships' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Active Partnerships</h2>
            <Button className="bg-green-600 hover:bg-green-700">
              + Create Partnership
            </Button>
          </div>

          <div className="grid gap-6">
            {partnerships.map((partnership) => (
              <Card key={partnership.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {partnership.organization.name} ↔ {partnership.partner_organization.name}
                    </h3>
                    <p className="text-gray-600 mb-2">
                      Network: {partnership.network.name} ({partnership.network.network_type})
                    </p>
                    <div className="flex items-center space-x-4">
                      <StatusBadge status={partnership.status} />
                      <span className="text-sm text-gray-500">
                        Type: {partnership.partnership_type}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-1">
                      Daily Limit: {partnership.daily_share_limit}
                    </div>
                    <div className="text-sm text-gray-500">
                      Priority: {partnership.priority_level}/10
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Can Modify:</span>
                    <div className={partnership.can_modify_content ? 'text-green-600' : 'text-red-600'}>
                      {partnership.can_modify_content ? 'Yes' : 'No'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Attribution:</span>
                    <div className={partnership.requires_attribution ? 'text-orange-600' : 'text-gray-600'}>
                      {partnership.requires_attribution ? 'Required' : 'Optional'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Approval:</span>
                    <div className={partnership.requires_manual_approval ? 'text-red-600' : 'text-green-600'}>
                      {partnership.requires_manual_approval ? 'Manual' : 'Auto'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <div className="text-gray-600">
                      {new Date(partnership.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Content Sharing Tab */}
      {activeTab === 'distributions' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Content Distribution</h2>
            <div className="flex space-x-2">
              <select className="px-3 py-2 border rounded-lg">
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="auto_approved">Auto Approved</option>
              </select>
              <select className="px-3 py-2 border rounded-lg">
                <option value="">All Types</option>
                <option value="news">News</option>
                <option value="analysis">Analysis</option>
                <option value="live_update">Live Update</option>
              </select>
            </div>
          </div>

          <div className="grid gap-6">
            {distributions.map((distribution) => (
              <Card key={distribution.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {distribution.source_organization.name} → {distribution.target_organization.name}
                    </h3>
                    <p className="text-gray-600 mb-2">
                      {distribution.source_bot.name} → {distribution.target_bot.name}
                    </p>
                    <p className="text-sm text-gray-500 mb-2">
                      {distribution.source_channel.name} → {distribution.target_channel.name}
                    </p>
                    <div className="flex items-center space-x-4">
                      <StatusBadge status={distribution.approval_status} />
                      <span className="text-sm text-gray-500 capitalize">
                        {distribution.content_type}
                      </span>
                      <span className="text-sm text-gray-500">
                        Quality: {distribution.content_quality_score}/10
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-1">
                      {distribution.original_language} → {distribution.shared_language}
                    </div>
                    <div className="text-sm text-gray-500 capitalize">
                      {distribution.modification_level}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {distribution.shared_at 
                      ? `Shared: ${new Date(distribution.shared_at).toLocaleString()}`
                      : `Created: ${new Date(distribution.created_at).toLocaleString()}`
                    }
                  </div>
                  
                  {distribution.approval_status === 'pending' && (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleApproveContent(distribution.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => handleRejectContent(distribution.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 