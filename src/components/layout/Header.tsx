/**
 * 🎨 Modern Header Component
 * Colorful, professional header with language switching and navigation
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n/useI18n';
import { useAuth } from '@/contexts/AuthContext';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

interface HeaderProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const { t } = useI18n();
  const pathname = usePathname();
  const { signOut, isSuperAdmin, isManager } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Function to check if a navigation item is active
  const isNavActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    setIsProfileOpen(false);
    await signOut();
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:shadow-lg transform group-hover:scale-105 transition-all duration-200">
                <span className="text-white font-bold text-lg">⚡</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  TeleBots Pro
                </h1>
                <p className="text-xs text-gray-500">Sports Content Manager</p>
              </div>
            </Link>
          </div>

          {/* Center Navigation */}
          <nav className="hidden md:flex space-x-1">
            <Link
              href="/dashboard"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isNavActive('/dashboard') && pathname === '/dashboard'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              🏠 {t.nav.dashboard}
            </Link>
            <Link
              href="/dashboard/bots"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isNavActive('/dashboard/bots')
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              🤖 {t.nav.bots}
            </Link>
            <Link
              href="/dashboard/content"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isNavActive('/dashboard/content')
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              📝 {t.nav.content}
            </Link>
            <Link
              href="/automation"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isNavActive('/automation')
                  ? 'bg-orange-100 text-orange-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              🤖 Automation
            </Link>
            {isSuperAdmin && (
              <Link
                href="/super-admin"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isNavActive('/super-admin')
                    ? 'bg-red-100 text-red-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                👑 Super Admin
              </Link>
            )}
          </nav>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200">
              <span className="text-xl">🔔</span>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>

            {/* Language Switcher */}
            <LanguageSwitcher variant="compact" />

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <div className="flex items-center space-x-2">
                    <div className="text-sm font-medium text-gray-900">
                      {user?.name || 'User'}
                    </div>
                    {user?.role && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.role === 'super_admin' 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {user.role === 'super_admin' ? '👑 Admin' : '⚙️ Manager'}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user?.email || 'user@example.com'}
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                    <div className="text-xs text-gray-500">{user?.email}</div>
                    {user?.role && (
                      <div className={`text-xs mt-1 ${
                        user.role === 'super_admin' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {user.role === 'super_admin' ? '👑 Super Administrator' : '⚙️ Bot Manager'}
                      </div>
                    )}
                  </div>
                  <Link 
                    href="/dashboard/settings" 
                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <span className="mr-3">⚙️</span>
                    {t.nav.settings}
                  </Link>
                  <Link 
                    href="/help" 
                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <span className="mr-3">❓</span>
                    {t.nav.help}
                  </Link>
                  <hr className="my-2" />
                  <button 
                    onClick={handleSignOut}
                    className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                  >
                    <span className="mr-3">🚪</span>
                    {t.nav.logout}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;