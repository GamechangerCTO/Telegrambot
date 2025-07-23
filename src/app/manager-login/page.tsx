'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function ManagerLoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [authMethod, setAuthMethod] = useState<'supabase' | 'custom'>('supabase') // Default to Supabase Auth
  const router = useRouter()

  // Check if already logged in
  useEffect(() => {
    checkExistingSession()
  }, [])

  const checkExistingSession = async () => {
    try {
      // Check Supabase Auth session first
      const supabaseResponse = await fetch('/api/auth/supabase-auth?action=session')
      const supabaseData = await supabaseResponse.json()
      
      if (supabaseData.valid) {
        router.push('/manager-dashboard')
        return
      }
      
      // Check custom session
      const customResponse = await fetch('/api/auth/manager-session')
      const customData = await customResponse.json()
      
      if (customData.valid) {
        router.push('/manager-dashboard')
      }
    } catch (error) {
      // Not logged in, stay on login page
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let response, data
      
      if (authMethod === 'supabase') {
        // Use Supabase Auth
        response = await fetch('/api/auth/supabase-auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...formData,
            action: 'signin'
          })
        })
        data = await response.json()
        
        if (data.success) {
          router.push('/manager-dashboard')
        } else {
          setError(data.error)
        }
        
      } else {
        // Use custom authentication
        response = await fetch('/api/auth/manager-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        })
        data = await response.json()

        if (data.success) {
          // Check if password change is required
          if (data.manager.force_password_change) {
            router.push('/manager-dashboard/change-password?force=true')
          } else {
            router.push('/manager-dashboard')
          }
        } else {
          setError(data.error)
          
          // Show specific error information
          if (data.attempts_remaining !== undefined) {
            setError(`${data.error} (${data.attempts_remaining} attempts remaining)`)
          } else if (data.minutes_left) {
            setError(`${data.error} (${data.minutes_left} minutes remaining)`)
          }
        }
      }
      
    } catch (error) {
      console.error('Login error:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Bot Manager Login
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to manage your Telegram bots
          </p>
        </div>

        {/* Authentication Method Selection */}
        <Card className="p-4">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Login Method:</h3>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="authMethod"
                  value="supabase"
                  checked={authMethod === 'supabase'}
                  onChange={(e) => setAuthMethod(e.target.value as 'supabase' | 'custom')}
                  className="mr-2"
                />
                <span className="text-sm">Supabase Auth (Recommended)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="authMethod"
                  value="custom"
                  checked={authMethod === 'custom'}
                  onChange={(e) => setAuthMethod(e.target.value as 'supabase' | 'custom')}
                  className="mr-2"
                />
                <span className="text-sm">Custom Auth</span>
              </label>
            </div>
            <p className="text-xs text-gray-500">
              {authMethod === 'supabase' 
                ? 'Standard Supabase authentication with built-in security features'
                : 'Custom authentication system with enhanced bot manager features'
              }
            </p>
          </div>
        </Card>

        {/* Login Form */}
        <Card className="p-8">
          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="your-email@example.com"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                  disabled={loading}
                >
                  {showPassword ? (
                    <span className="text-gray-500">🙈</span>
                  ) : (
                    <span className="text-gray-500">👁️</span>
                  )}
                </button>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner />
                    <span className="ml-2">Signing in...</span>
                  </div>
                ) : (
                  `Sign In via ${authMethod === 'supabase' ? 'Supabase Auth' : 'Custom Auth'}`
                )}
              </Button>
            </div>
          </form>

          {/* Additional Information */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-xs text-gray-500">
              Don't have an account? Contact your administrator.
            </p>
            {authMethod === 'supabase' && (
              <p className="text-xs text-gray-500">
                <a href="/auth/reset-password" className="text-blue-600 hover:text-blue-500">
                  Forgot your password? Reset it here.
                </a>
              </p>
            )}
            {authMethod === 'custom' && (
              <p className="text-xs text-gray-500">
                Forgot your password? Contact your administrator for a reset.
              </p>
            )}
          </div>
        </Card>

        {/* Security Notice */}
        <div className="text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-yellow-400">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Security Notice
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  {authMethod === 'supabase' ? (
                    <p>
                      Using Supabase's secure authentication system with built-in protections.
                      Sessions are managed automatically with security best practices.
                    </p>
                  ) : (
                    <p>
                      For security, your account will be locked for 30 minutes after 5 failed login attempts.
                      If you're having trouble logging in, contact your administrator.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 