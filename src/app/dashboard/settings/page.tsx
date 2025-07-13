'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PageLayout from '@/components/layout/PageLayout';
import { Card, LoadingSpinner } from '@/components';
import { Settings, User, Bot, Key, Bell, Shield, Palette, Globe, HelpCircle } from 'lucide-react';
import Link from 'next/link';

interface SettingsCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  path: string;
  isActive: boolean;
}

interface UserSettings {
  name: string;
  email: string;
  preferred_language: string;
  timezone: string;
  email_notifications: boolean;
  push_notifications: boolean;
  theme: string;
  role: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('personal');
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const categories: SettingsCategory[] = [
    {
      id: 'personal',
      name: 'Personal Settings',
      icon: <User className="w-5 h-5" />,
      description: 'Manage your account and personal preferences',
      path: '/dashboard/settings',
      isActive: activeCategory === 'personal'
    },
    {
      id: 'bot',
      name: 'Bot Settings',
      icon: <Bot className="w-5 h-5" />,
      description: 'Configure your bot behavior and automation',
      path: '/dashboard/settings/bot',
      isActive: activeCategory === 'bot'
    },
    {
      id: 'api-keys',
      name: 'API Keys',
      icon: <Key className="w-5 h-5" />,
      description: 'Manage your API keys and integrations',
      path: '/dashboard/settings/api-keys',
      isActive: activeCategory === 'api-keys'
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: <Bell className="w-5 h-5" />,
      description: 'Configure notification preferences',
      path: '/dashboard/settings/notifications',
      isActive: activeCategory === 'notifications'
    },
    {
      id: 'security',
      name: 'Security',
      icon: <Shield className="w-5 h-5" />,
      description: 'Security settings and password management',
      path: '/dashboard/settings/security',
      isActive: activeCategory === 'security'
    },
    {
      id: 'appearance',
      name: 'Appearance',
      icon: <Palette className="w-5 h-5" />,
      description: 'Customize the look and feel',
      path: '/dashboard/settings/appearance',
      isActive: activeCategory === 'appearance'
    }
  ];

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      if (!user) return;
      
      // For now, use user data from auth context
      // In real app, this would come from API
      setUserSettings({
        name: (user as any)?.name || user.email || '',
        email: user.email || '',
        preferred_language: (user as any)?.preferred_language || 'en',
        timezone: (user as any)?.timezone || 'UTC',
        email_notifications: (user as any)?.email_notifications ?? true,
        push_notifications: (user as any)?.push_notifications ?? true,
        theme: 'light',
        role: (user as any)?.role || 'manager'
      });
    } catch (error) {
      console.error('Error loading user settings:', error);
      setMessage('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalSettingsUpdate = async (field: string, value: any) => {
    if (!userSettings) return;
    
    setSaving(true);
    setMessage('');
    
    try {
      const updatedSettings = { ...userSettings, [field]: value };
      setUserSettings(updatedSettings);
      
      // Here you would make API call to update settings
      // await updateUserSettings(updatedSettings);
      
      setMessage('Settings updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating settings:', error);
      setMessage('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const renderPersonalSettings = () => (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={userSettings?.name || ''}
                onChange={(e) => handlePersonalSettingsUpdate('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your full name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={userSettings?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Language & Region</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Language
              </label>
              <select
                value={userSettings?.preferred_language || 'en'}
                onChange={(e) => handlePersonalSettingsUpdate('preferred_language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="he">עברית</option>
                <option value="am">አማርኛ</option>
                <option value="sw">Kiswahili</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <select
                value={userSettings?.timezone || 'UTC'}
                onChange={(e) => handlePersonalSettingsUpdate('timezone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="UTC">UTC</option>
                <option value="Asia/Jerusalem">Asia/Jerusalem</option>
                <option value="Africa/Addis_Ababa">Africa/Addis_Ababa</option>
                <option value="Africa/Nairobi">Africa/Nairobi</option>
                <option value="Europe/London">Europe/London</option>
                <option value="America/New_York">America/New_York</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Account Status</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Account Role</p>
                <p className="text-sm text-gray-500">Your current role in the system</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                userSettings?.role === 'super_admin' 
                  ? 'bg-red-100 text-red-800' 
                  : userSettings?.role === 'admin'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {userSettings?.role === 'super_admin' ? '👑 Super Admin' : 
                 userSettings?.role === 'admin' ? '👨‍💼 Admin' : '⚙️ Manager'}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Account Status</p>
                <p className="text-sm text-gray-500">Your account is active and fully functional</p>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-green-600 font-medium">Active</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeCategory) {
      case 'personal':
        return renderPersonalSettings();
      case 'api-keys':
        return (
          <div className="text-center py-12">
            <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">API Keys Management</h3>
            <p className="text-gray-500 mb-4">Configure your API keys and integrations</p>
            <Link 
              href="/dashboard/settings/api-keys" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Manage API Keys
            </Link>
          </div>
        );
      default:
        return (
          <div className="text-center py-12">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
            <p className="text-gray-500">This settings section is under development</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                    category.isActive
                      ? 'bg-blue-50 text-blue-700 border-2 border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="mr-3">{category.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{category.name}</p>
                    <p className="text-xs text-gray-500 truncate">{category.description}</p>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            {renderContent()}
          </div>
        </div>
      </div>
    </PageLayout>
  );
} 