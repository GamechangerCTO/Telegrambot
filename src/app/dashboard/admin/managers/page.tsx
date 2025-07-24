'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface Manager {
  id: string
  name: string
  email: string
  role: string
  preferred_language: string
  is_active: boolean
  approval_status: string
  approval_date: string
  notes: string
  created_at: string
  user: { id: string; name: string; email: string; role: string }
  created_by_user: { id: string; name: string; email: string }
  approved_by_user: { id: string; name: string; email: string } | null
  bots: { id: string; name: string; language_code: string; is_active: boolean; approval_status: string }[]
}

interface User {
  id: string
  name: string
  email: string
  role: string
  organization_id: string
}

export default function AdminManagersPage() {
  const searchParams = useSearchParams()
  const [managers, setManagers] = useState<Manager[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'create'>(() => {
    const tabParam = searchParams.get('tab')
    return tabParam === 'create' ? 'create' : 'pending'
  })
  const [currentUser] = useState<User>({
    id: '00000000-0000-0000-0000-000000000002', // Super Admin ID
    name: 'Super Admin',
    email: 'triroars@gmail.com',
    role: 'super_admin',
    organization_id: '00000000-0000-0000-0000-000000000001'
  })

  // New manager form state
  const [newManager, setNewManager] = useState({
    email: '',
    name: '',
    phone: '',
    preferred_language: 'en',
    notes: '',
    password: '',
    generate_password: true
  })
  
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    // Check for tab parameter in URL
    const tabParam = searchParams.get('tab')
    if (tabParam === 'create') {
      setActiveTab('create')
    }
    fetchData()
  }, [activeTab, searchParams])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch managers
      const managersResponse = await fetch(
        `/api/admin/managers?user_id=${currentUser.id}&organization_id=${currentUser.organization_id}${
          activeTab !== 'all' && activeTab !== 'create' ? `&status=${activeTab}` : ''
        }`
      )
      const managersData = await managersResponse.json()
      
      if (managersData.success) {
        setManagers(managersData.managers || [])
      }
      
      // Fetch users for creating new managers (only if on create tab)
      if (activeTab === 'create') {
        // This would need to be implemented - fetch users who aren't managers yet
        // For now, we'll use mock data
        setUsers([
          { 
            id: 'user-1', 
            name: 'John Doe', 
            email: 'john@example.com', 
            role: 'user',
            organization_id: currentUser.organization_id
          },
          { 
            id: 'user-2', 
            name: 'Jane Smith', 
            email: 'jane@example.com', 
            role: 'user',
            organization_id: currentUser.organization_id
          }
        ])
      }
      
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveManager = async (managerId: string, notes?: string) => {
    try {
      const response = await fetch('/api/admin/managers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: managerId,
          approval_status: 'approved',
          notes,
          approved_by_user_id: currentUser.id,
          organization_id: currentUser.organization_id
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchData() // Refresh data
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error approving manager:', error)
      alert('Error approving manager')
    }
  }

  const handleRejectManager = async (managerId: string, notes?: string) => {
    try {
      const response = await fetch('/api/admin/managers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: managerId,
          approval_status: 'rejected',
          notes,
          approved_by_user_id: currentUser.id,
          organization_id: currentUser.organization_id
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchData() // Refresh data
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error rejecting manager:', error)
      alert('Error rejecting manager')
    }
  }

  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newManager.name || !newManager.email) {
      alert('Please fill in all required fields')
      return
    }
    
    try {
      const response = await fetch('/api/admin/managers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newManager,
          organization_id: currentUser.organization_id,
          created_by_user_id: currentUser.id
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        let message = data.message
        
        // If password was generated, show it to the admin
        if (data.password) {
          setGeneratedPassword(data.password)
          setShowPassword(true)
          message += `\n\nGenerated Password: ${data.password}\n\nPlease save this password and share it securely with the manager.`
        }
        
        alert(message)
        setNewManager({ 
          email: '', 
          name: '', 
          phone: '', 
          preferred_language: 'en', 
          notes: '', 
          password: '',
          generate_password: true 
        })
        setActiveTab('pending') // Switch to pending tab to see the new manager
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error creating manager:', error)
      alert('Error creating manager')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  const pendingCount = managers.filter(m => m.approval_status === 'pending').length
  const approvedCount = managers.filter(m => m.approval_status === 'approved').length

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bot Managers Administration
        </h1>
        <p className="text-gray-600">
          Manage bot managers - approve, reject, or create new manager accounts
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'pending'
              ? 'text-orange-600 border-orange-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          Pending Approval ({pendingCount})
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'approved'
              ? 'text-green-600 border-green-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          Approved ({approvedCount})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'all'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          All Managers ({managers.length})
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'create'
              ? 'text-purple-600 border-purple-600'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          Create New Manager
        </button>
      </div>

      {/* Create Manager Form */}
      {activeTab === 'create' && (
        <Card className="p-6 mb-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Create New Bot Manager Account</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                    💡
                  </span>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">Creating a New Bot Manager</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    This will create a complete new account for a bot manager. They will receive login credentials 
                    and can immediately start creating and managing their own bots and channels.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleCreateManager} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manager Name *
                </label>
                <input
                  type="text"
                  value={newManager.name}
                  onChange={(e) => setNewManager({ ...newManager, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={newManager.email}
                  onChange={(e) => setNewManager({ ...newManager, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Language
                </label>
                <select
                  value={newManager.preferred_language}
                  onChange={(e) => setNewManager({ ...newManager, preferred_language: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">English</option>
                  <option value="am">Amharic</option>
                  <option value="sw">Swahili</option>
                  <option value="he">Hebrew</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={newManager.phone || ''}
                  onChange={(e) => setNewManager({ ...newManager, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter phone number (optional)"
                />
              </div>
            </div>

              {/* Password Configuration */}
              <div className="col-span-2">
                <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <h4 className="text-md font-medium text-gray-700">Password Configuration</h4>
                  
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="passwordOption"
                        checked={newManager.generate_password}
                        onChange={() => setNewManager({ ...newManager, generate_password: true, password: '' })}
                        className="mr-2"
                      />
                      <span className="text-sm">Generate secure password automatically</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="passwordOption"
                        checked={!newManager.generate_password}
                        onChange={() => setNewManager({ ...newManager, generate_password: false })}
                        className="mr-2"
                      />
                      <span className="text-sm">Set custom password</span>
                    </label>
                  </div>
                  
                  {!newManager.generate_password && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Custom Password *
                      </label>
                      <input
                        type="password"
                        value={newManager.password}
                        onChange={(e) => setNewManager({ ...newManager, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter secure password (min 8 chars, must include: A-Z, a-z, 0-9, special char)"
                        required={!newManager.generate_password}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Password must be at least 8 characters and include uppercase, lowercase, number, and special character
                      </p>
                    </div>
                  )}
                  
                  {newManager.generate_password && (
                    <div className="text-sm text-green-600">
                      ✓ A secure 12-character password will be generated automatically
                    </div>
                  )}
                </div>
              </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={newManager.notes}
                onChange={(e) => setNewManager({ ...newManager, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add any notes about this manager's role, responsibilities, or special permissions..."
              />
              <p className="text-xs text-gray-500 mt-1">
                These notes will help you remember why this manager was created and their specific role.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setActiveTab('pending')}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <Button 
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
              >
                <span className="flex items-center">
                  <span className="mr-2">👤</span>
                  Create Bot Manager Account
                </span>
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Generated Password Display */}
      {showPassword && generatedPassword && (
        <Card className="p-6 mb-6 border-green-200 bg-green-50">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">Manager Created Successfully!</h3>
              <p className="text-green-700 mb-4">
                The manager account has been created. Here is the generated password:
              </p>
              <div className="bg-white p-4 rounded border border-green-200 font-mono text-lg">
                <div className="flex items-center justify-between">
                  <span className="text-gray-800">{generatedPassword}</span>
                  <Button
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedPassword)
                      alert('Password copied to clipboard!')
                    }}
                    className="ml-4 bg-green-600 hover:bg-green-700"
                  >
                    Copy
                  </Button>
                </div>
              </div>
              <p className="text-sm text-green-600 mt-2">
                ⚠️ Please save this password securely and share it with the manager. 
                This password will not be shown again.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowPassword(false)
                setGeneratedPassword('')
              }}
              className="text-green-600 border-green-600"
            >
              ✕ Close
            </Button>
          </div>
        </Card>
      )}

      {/* Managers List */}
      {activeTab !== 'create' && (
        <div className="space-y-6">
          {managers.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500 text-lg">
                {activeTab === 'pending' 
                  ? 'No managers pending approval' 
                  : activeTab === 'approved'
                  ? 'No approved managers'
                  : 'No managers found'
                }
              </p>
            </Card>
          ) : (
            managers.map((manager) => (
              <Card key={manager.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {manager.name}
                    </h3>
                    <p className="text-gray-600 mb-2">
                      {manager.email}
                    </p>
                    <div className="flex items-center space-x-4 mb-2">
                      <StatusBadge 
                        status={manager.approval_status === 'approved'} 
                        activeText="Approved"
                        inactiveText={manager.approval_status === 'pending' ? 'Pending' : 'Rejected'}
                        variant={manager.approval_status === 'approved' ? 'success' : 
                                manager.approval_status === 'pending' ? 'warning' : 'error'}
                      />
                      <span className="text-sm text-gray-500">
                        Language: {manager.preferred_language.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">
                        Role: {manager.role}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(manager.created_at).toLocaleDateString()} by {manager.created_by_user?.name}
                    </p>
                    {manager.approved_by_user && (
                      <p className="text-sm text-gray-500">
                        Approved: {new Date(manager.approval_date).toLocaleDateString()} by {manager.approved_by_user.name}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-1">
                      Bots: {manager.bots.length}
                    </div>
                    <div className="text-sm text-gray-500">
                      Active: {manager.bots.filter(b => b.is_active).length}
                    </div>
                  </div>
                </div>

                {manager.notes && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Notes:</span> {manager.notes}
                    </p>
                  </div>
                )}

                {manager.bots.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Associated Bots:</h4>
                    <div className="flex flex-wrap gap-2">
                      {manager.bots.map(bot => (
                        <span
                          key={bot.id}
                          className={`px-2 py-1 rounded-full text-xs ${
                            bot.is_active 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {bot.name} ({bot.language_code.toUpperCase()})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {manager.approval_status === 'pending' && (
                  <div className="flex space-x-3">
                    <Button
                      onClick={() => handleApproveManager(manager.id)}
                      className="bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleRejectManager(manager.id, 'Rejected by admin')}
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      size="sm"
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
} 