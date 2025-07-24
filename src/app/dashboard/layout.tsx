/**
 * 📊 Dashboard Layout
 * Authentication-aware layout with real user data
 */

'use client'

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Header from '@/components/layout/Header';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, manager, loading, isAuthenticated } = useAuth();
  const [forceShow, setForceShow] = useState(false);

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      setForceShow(true);
    }, 2000); // Reduced from 3 seconds to 2 seconds

    return () => clearTimeout(timeout);
  }, []);

  // Show loading while checking authentication (with timeout)
  if (loading && !forceShow) {
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
    avatar: undefined,
    role: manager?.role || 'manager'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header Navigation */}
      <Header user={headerUser} />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
} 