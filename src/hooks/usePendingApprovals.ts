import { useState, useEffect, useCallback } from 'react'

export interface PendingApproval {
  id: string
  rule_id: string
  rule_name: string
  content_type: string
  language: string
  channels: string[]
  content: {
    text: string
    imageUrl?: string
    preview: string
    metadata?: any
  }
  generated_at: string
  ai_confidence: number
  estimated_engagement: string
  status: 'pending' | 'approved' | 'rejected' | 'editing'
  organization_id?: string
}

interface UsePendingApprovalsReturn {
  approvals: PendingApproval[]
  loading: boolean
  error: string | null
  processing: boolean
  
  // Actions
  fetchApprovals: () => Promise<void>
  approveContent: (id: string) => Promise<boolean>
  rejectContent: (id: string, reason?: string) => Promise<boolean>
  editContent: (id: string, newContent: Partial<PendingApproval['content']>) => Promise<boolean>
  bulkApprove: (ids: string[]) => Promise<boolean>
  bulkReject: (ids: string[]) => Promise<boolean>
  
  // Statistics
  totalPending: number
  highConfidenceCount: number
  averageConfidence: number
  pendingByLanguage: Record<string, number>
}

export function usePendingApprovals(): UsePendingApprovalsReturn {
  const [approvals, setApprovals] = useState<PendingApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  // Fetch pending approvals from API
  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/automation/approvals')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch pending approvals')
      }
      
      if (data.success && data.approvals) {
        setApprovals(data.approvals)
      } else {
        setApprovals([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch approvals')
      console.error('❌ Error fetching pending approvals:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Approve content and send to Telegram
  const approveContent = useCallback(async (id: string) => {
    try {
      setProcessing(true)
      setError(null)
      
      const response = await fetch('/api/automation/approvals/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve content')
      }
      
      if (data.success) {
        // Remove approved content from pending list
        setApprovals(prev => prev.filter(approval => approval.id !== id))
        return true
      }
      
      return false
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve content')
      console.error('❌ Error approving content:', err)
      return false
    } finally {
      setProcessing(false)
    }
  }, [])

  // Reject content
  const rejectContent = useCallback(async (id: string, reason?: string) => {
    try {
      setProcessing(true)
      setError(null)
      
      const response = await fetch('/api/automation/approvals/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, reason })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject content')
      }
      
      if (data.success) {
        // Remove rejected content from pending list
        setApprovals(prev => prev.filter(approval => approval.id !== id))
        return true
      }
      
      return false
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject content')
      console.error('❌ Error rejecting content:', err)
      return false
    } finally {
      setProcessing(false)
    }
  }, [])

  // Edit content before approval
  const editContent = useCallback(async (id: string, newContent: Partial<PendingApproval['content']>) => {
    try {
      setProcessing(true)
      setError(null)
      
      const response = await fetch('/api/automation/approvals/edit', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, content: newContent })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to edit content')
      }
      
      if (data.success && data.approval) {
        // Update content in state
        setApprovals(prev => prev.map(approval => 
          approval.id === id 
            ? { ...approval, content: { ...approval.content, ...newContent } }
            : approval
        ))
        return true
      }
      
      return false
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit content')
      console.error('❌ Error editing content:', err)
      return false
    } finally {
      setProcessing(false)
    }
  }, [])

  // Bulk approve multiple items
  const bulkApprove = useCallback(async (ids: string[]) => {
    try {
      setProcessing(true)
      setError(null)
      
      const response = await fetch('/api/automation/approvals/bulk-approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to bulk approve content')
      }
      
      if (data.success) {
        // Remove approved items from pending list
        setApprovals(prev => prev.filter(approval => !ids.includes(approval.id)))
        return true
      }
      
      return false
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bulk approve content')
      console.error('❌ Error bulk approving content:', err)
      return false
    } finally {
      setProcessing(false)
    }
  }, [])

  // Bulk reject multiple items
  const bulkReject = useCallback(async (ids: string[]) => {
    try {
      setProcessing(true)
      setError(null)
      
      const response = await fetch('/api/automation/approvals/bulk-reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to bulk reject content')
      }
      
      if (data.success) {
        // Remove rejected items from pending list
        setApprovals(prev => prev.filter(approval => !ids.includes(approval.id)))
        return true
      }
      
      return false
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bulk reject content')
      console.error('❌ Error bulk rejecting content:', err)
      return false
    } finally {
      setProcessing(false)
    }
  }, [])

  // Load approvals on mount
  useEffect(() => {
    fetchApprovals()
  }, [fetchApprovals])

  // Calculate statistics
  const totalPending = approvals.length
  const highConfidenceCount = approvals.filter(approval => approval.ai_confidence >= 80).length
  const averageConfidence = approvals.length > 0 
    ? approvals.reduce((sum, approval) => sum + approval.ai_confidence, 0) / approvals.length
    : 0

  const pendingByLanguage = approvals.reduce((acc, approval) => {
    acc[approval.language] = (acc[approval.language] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return {
    approvals,
    loading,
    error,
    processing,
    
    // Actions
    fetchApprovals,
    approveContent,
    rejectContent,
    editContent,
    bulkApprove,
    bulkReject,
    
    // Statistics
    totalPending,
    highConfidenceCount,
    averageConfidence,
    pendingByLanguage
  }
} 