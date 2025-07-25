'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

interface APIKeyInfo {
  name: string
  api_url: string
  is_active: boolean
  priority: number
  daily_calls_used: number
  daily_calls_limit: number
  rate_limit_per_hour: number
  last_called_at?: string
  has_key: boolean
}

export default function APIKeysManagementPage() {
  const [apis, setApis] = useState<APIKeyInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadAPIKeys()
  }, [])

  const loadAPIKeys = async () => {
    try {
      const response = await fetch('/api/settings/api-keys')
      const data = await response.json()
      
      if (data.success) {
        setApis(data.apis)
      } else {
        setMessage('Error loading API keys')
      }
    } catch (error) {
      console.error('Error loading API keys:', error)
      setMessage('Error loading API keys')
    } finally {
      setLoading(false)
    }
  }

  const toggleAPIStatus = async (apiName: string, currentStatus: boolean) => {
    setSaving(apiName)
    try {
      const response = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiName,
          isActive: !currentStatus
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setMessage(`${apiName} API status updated successfully`)
        await loadAPIKeys() // Refresh data
      } else {
        setMessage(`Error updating ${apiName}`)
      }
    } catch (error) {
      console.error('Error updating API status:', error)
      setMessage(`Error updating ${apiName}`)
    } finally {
      setSaving('')
    }
  }

  const resetDailyCalls = async () => {
    setSaving('reset')
    try {
      const response = await fetch('/api/settings/api-keys', {
        method: 'PUT'
      })

      const data = await response.json()
      
      if (data.success) {
        setMessage('Daily calls counter reset successfully')
        await loadAPIKeys()
      } else {
        setMessage('Error resetting daily calls')
      }
    } catch (error) {
      console.error('Error resetting daily calls:', error)
      setMessage('Error resetting daily calls')
    } finally {
      setSaving('')
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
  }

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.round((used / limit) * 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500'
    if (percentage < 80) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading API keys...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">API Keys Management</h1>
        <p className="text-gray-600">
          Manage API keys for different data sources in the system. Keys are stored encrypted in the database.
        </p>
      </div>

      {message && (
        <div className="mb-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          {message}
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={resetDailyCalls}
          disabled={saving === 'reset'}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving === 'reset' ? 'Resetting...' : 'Reset Daily Calls Counter'}
        </button>
      </div>

      <div className="grid gap-6">
        {apis.map((api) => {
          const usagePercentage = getUsagePercentage(api.daily_calls_used, api.daily_calls_limit)
          
          return (
            <div key={api.name} className="bg-white rounded-lg shadow-md p-6 border">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {api.name}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {api.api_url}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(api.is_active)}`}>
                    {api.is_active ? 'Active' : 'Inactive'}
                  </span>
                  
                  <button
                    onClick={() => toggleAPIStatus(api.name, api.is_active)}
                    disabled={saving === api.name}
                    className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 disabled:opacity-50"
                  >
                    {saving === api.name ? 'Saving...' : (api.is_active ? 'Disable' : 'Enable')}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Priority</div>
                  <div className="font-semibold">{api.priority}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-1">Key Available</div>
                  <div className={`font-semibold ${api.has_key ? 'text-green-600' : 'text-red-600'}`}>
                    {api.has_key ? '✓ Yes' : '✗ Missing'}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-1">Hourly Limit</div>
                  <div className="font-semibold">{api.rate_limit_per_hour.toLocaleString()}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-1">Last Called</div>
                  <div className="font-semibold text-sm">
                    {api.last_called_at 
                      ? new Date(api.last_called_at).toLocaleDateString('en-US')
                      : 'Never called'
                    }
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Daily Usage</span>
                  <span className="text-sm font-semibold">
                    {api.daily_calls_used.toLocaleString()} / {api.daily_calls_limit.toLocaleString()} ({usagePercentage}%)
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(usagePercentage)}`}
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Important Notes:</h3>
        <ul className="list-disc list-inside text-yellow-700 space-y-1">
          <li>Keys are encrypted in the database</li>
          <li>The system will automatically use the API with the highest priority available</li>
          <li>When an API reaches its call limit, the system will automatically move to the next available one</li>
          <li>The daily call counter resets automatically</li>
        </ul>
      </div>

      <div className="mt-6 p-4 bg-gray-50 border rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-2">Environment Variables (Not in use):</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• FOOTBALL_DATA_API_KEY → Currently in sports_apis table</li>
          <li>• API_FOOTBALL_KEY → Currently in sports_apis table</li>
          <li>• SOCCERSAPI_TOKEN → Currently in sports_apis table</li>
          <li>• TELEGRAM_BOT_TOKEN → Still in environment variables (will be moved to bots table in the future)</li>
        </ul>
      </div>
    </div>
  )
} 