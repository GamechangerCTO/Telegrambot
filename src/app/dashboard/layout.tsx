/**
 * 📊 Dashboard Layout
 * Authentication-aware layout with real user data
 */

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Plus, Menu, X, LogOut, User, Bot, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAuthenticated, loading, signOut } = useAuth();

  // For development: Allow bypass of auth
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Redirect to login if not authenticated (unless in development)
  useEffect(() => {
    if (!loading && !isAuthenticated && !isDevelopment) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, loading, router, isDevelopment]);

  // Show loading spinner while checking authentication (bypass in development)
  if (loading && !isDevelopment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show nothing if not authenticated (will redirect) unless in development
  if (!isAuthenticated && !isDevelopment) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Automation Center', href: '/automation', icon: Bot },
    { name: 'Add Channel', href: '/dashboard/channels/add', icon: Plus },
    { name: 'Manage Coupons', href: '/dashboard/coupons', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        <div className="flex h-16 items-center justify-between px-6 border-b">
          <h1 className="text-xl font-bold text-gray-900">TeleBots Pro</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="mt-6 px-3 flex flex-col h-full">
          <div className="space-y-1 flex-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${isActive 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon 
                    className={`
                      ml-3 h-5 w-5 flex-shrink-0
                      ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                    `}
                  />
                  <span className="mr-3">{item.name}</span>
                </Link>
              );
            })}
          </div>
          
          {/* User Info & Logout */}
          <div className="border-t pt-4 pb-4">
            <div className="px-3 py-2 text-xs text-gray-500 flex items-center">
              <User className="w-4 h-4 mr-2" />
              <span className="truncate">{user?.email}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors group"
            >
              <LogOut className="ml-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-red-500" />
              <span className="mr-3">Sign Out</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header with hamburger */}
        <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">TeleBots Pro</h1>
          <button
            onClick={handleSignOut}
            className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
} 