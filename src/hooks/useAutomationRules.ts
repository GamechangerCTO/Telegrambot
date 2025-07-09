import { useState, useEffect, useCallback } from 'react'

export interface AutomationRule {
  id: string
  name: string
  enabled: boolean
  type: 'full_auto' | 'manual_approval'
  schedule: {
    frequency: 'hourly' | 'daily' | 'weekly' | 'custom'
    times: string[]
    days?: string[]
  }
  content_types: string[]
  languages: string[]
  channels: string[]
  conditions: {
    minMatchAvailability?: boolean
    weatherConditions?: string[]
    targetAudience?: string
  }
  lastRun?: string
  nextRun?: string
  stats: {
    totalRuns: number
    successRate: number
    contentGenerated: number
  }
  organization_id?: string
  created_at?: string
  updated_at?: string
}

interface UseAutomationRulesReturn {
  rules: AutomationRule[]
  loading: boolean
  error: string | null
  creating: boolean
  updating: boolean
  deleting: boolean
  
  // Actions
  fetchRules: () => Promise<void>
  createRule: (rule: Omit<AutomationRule, 'id' | 'stats' | 'created_at' | 'updated_at'>) => Promise<boolean>
  updateRule: (id: string, updates: Partial<AutomationRule>) => Promise<boolean>
  deleteRule: (id: string) => Promise<boolean>
  toggleRule: (id: string) => Promise<boolean>
  executeRule: (id: string) => Promise<boolean>
  
  // Statistics
  totalRules: number
  activeRules: number
  totalRuns: number
  averageSuccessRate: number
}

export function useAutomationRules(): UseAutomationRulesReturn {
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Fetch automation rules from API
  const fetchRules = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/automation')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch automation rules')
      }
      
      if (data.success && data.rules) {
        // Transform API response to match UI interface
        const transformedRules = data.rules.map((rule: any) => ({
          ...rule,
          contentTypes: rule.content_types || [], // Transform snake_case to camelCase
          stats: rule.stats || { totalRuns: 0, successRate: 0, contentGenerated: 0 }
        }))
        
        setRules(transformedRules)
      } else {
        setRules([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rules')
      console.error('❌ Error fetching automation rules:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Create new automation rule
  const createRule = useCallback(async (newRule: Omit<AutomationRule, 'id' | 'stats' | 'created_at' | 'updated_at'>) => {
    try {
      setCreating(true)
      setError(null)
      
      // Transform camelCase to snake_case for API
      const apiRule = {
        ...newRule,
        contentTypes: newRule.content_types
      }
      
      const response = await fetch('/api/automation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiRule)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create automation rule')
      }
      
      if (data.success && data.rule) {
        // Add new rule to state
        const transformedRule = {
          ...data.rule,
          contentTypes: data.rule.content_types || []
        }
        setRules(prev => [transformedRule, ...prev])
        return true
      }
      
      return false
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create rule')
      console.error('❌ Error creating automation rule:', err)
      return false
    } finally {
      setCreating(false)
    }
  }, [])

  // Update existing automation rule
  const updateRule = useCallback(async (id: string, updates: Partial<AutomationRule>) => {
    try {
      setUpdating(true)
      setError(null)
      
      // Transform camelCase to snake_case for API
      const apiUpdates = {
        ...updates,
        contentTypes: updates.content_types
      }
      
      const response = await fetch('/api/automation', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, ...apiUpdates })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update automation rule')
      }
      
      if (data.success && data.rule) {
        // Update rule in state
        const transformedRule = {
          ...data.rule,
          contentTypes: data.rule.content_types || []
        }
        setRules(prev => prev.map(rule => 
          rule.id === id ? { ...rule, ...transformedRule } : rule
        ))
        return true
      }
      
      return false
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update rule')
      console.error('❌ Error updating automation rule:', err)
      return false
    } finally {
      setUpdating(false)
    }
  }, [])

  // Delete automation rule
  const deleteRule = useCallback(async (id: string) => {
    try {
      setDeleting(true)
      setError(null)
      
      const response = await fetch(`/api/automation?id=${id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete automation rule')
      }
      
      if (data.success) {
        // Remove rule from state
        setRules(prev => prev.filter(rule => rule.id !== id))
        return true
      }
      
      return false
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete rule')
      console.error('❌ Error deleting automation rule:', err)
      return false
    } finally {
      setDeleting(false)
    }
  }, [])

  // Toggle rule enabled/disabled
  const toggleRule = useCallback(async (id: string) => {
    const rule = rules.find(r => r.id === id)
    if (!rule) return false
    
    return await updateRule(id, { enabled: !rule.enabled })
  }, [rules, updateRule])

  // Execute rule manually
  const executeRule = useCallback(async (id: string) => {
    try {
      setError(null)
      
      const response = await fetch('/api/automation/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ruleId: id })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to execute automation rule')
      }
      
      if (data.success) {
        // Refresh rules to get updated stats
        await fetchRules()
        return true
      }
      
      return false
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute rule')
      console.error('❌ Error executing automation rule:', err)
      return false
    }
  }, [fetchRules])

  // Load rules on mount
  useEffect(() => {
    fetchRules()
  }, [fetchRules])

  // Calculate statistics
  const totalRules = rules.length
  const activeRules = rules.filter(rule => rule.enabled).length
  const totalRuns = rules.reduce((sum, rule) => sum + (rule.stats?.totalRuns || 0), 0)
  const averageSuccessRate = rules.length > 0 
    ? rules.reduce((sum, rule) => sum + (rule.stats?.successRate || 0), 0) / rules.length
    : 0

  return {
    rules,
    loading,
    error,
    creating,
    updating,
    deleting,
    
    // Actions
    fetchRules,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    executeRule,
    
    // Statistics
    totalRules,
    activeRules,
    totalRuns,
    averageSuccessRate
  }
} 