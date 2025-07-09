/**
 * 📊 Dashboard Layout
 * Authentication-aware layout with real user data
 */

'use client'

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components';
import Header from '@/components/layout/Header'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, manager, loading, isAuthenticated } = useAuth();
  const [forceShow, setForceShow] = useState(false);

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    console.log('🔄 DashboardLayout: Starting timeout...');
    const timeout = setTimeout(() => {
      console.log('⚠️ DashboardLayout: Timeout reached, forcing dashboard display');
      setForceShow(true);
    }, 3000); // 3 second timeout

    return () => clearTimeout(timeout);
  }, []);

  // Show loading while checking authentication (with timeout)
  if (loading && !forceShow) {
    console.log('🔄 DashboardLayout: Still loading...');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // This shouldn't happen due to middleware, but safety check
  if (!isAuthenticated && !forceShow) {
    console.log('❌ DashboardLayout: Not authenticated');
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please log in to access the dashboard.</p>
          <a 
            href="/auth/login" 
            className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  // Prepare user data for header with fallbacks
  const headerUser = {
    name: manager?.name || user?.email?.split('@')[0] || 'User',
    email: user?.email || 'user@example.com',
    avatar: undefined, // Can be extended to include avatar from user metadata
    role: manager?.role || 'manager'
  };

  console.log('✅ DashboardLayout: Rendering dashboard with user:', headerUser);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header Navigation */}
      <Header user={headerUser} />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
} 