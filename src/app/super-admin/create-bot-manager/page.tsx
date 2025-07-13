/**
 * TELEGRAM BOT MANAGER 2025 - Super Admin: Create Bot Manager
 * Create new bot manager from super admin interface
 */

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface CreateBotManagerForm {
  name: string;
  email: string;
  phone: string;
  language: string;
  timezone: string;
  description: string;
}

export default function CreateBotManagerPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState<CreateBotManagerForm>({
    name: '',
    email: '',
    phone: '',
    language: 'en',
    timezone: 'UTC',
    description: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Create bot manager in user_profiles table
      const { error: dbError } = await supabase
        .from('user_profiles')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            phone: formData.phone || null,
            role: 'bot_manager',
            language: formData.language,
            timezone: formData.timezone,
            description: formData.description || null,
            created_by: user?.id,
            created_at: new Date().toISOString()
          }
        ]);

      if (dbError) throw dbError;

      setSuccess(true);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/super-admin/users');
      }, 2000);
      
    } catch (error: any) {
      console.error('Error creating bot manager:', error);
      setError(error.message || 'Failed to create bot manager');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Bot Manager Created Successfully!</h2>
            <p className="text-green-600 mb-4">
              New bot manager has been created and will receive login credentials via email.
            </p>
            <p className="text-sm text-green-500">Redirecting to users management...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/super-admin" className="inline-flex items-center text-purple-300 hover:text-white mb-4">
            <span className="mr-2">←</span>
            Back to Admin Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Create Bot Manager</h1>
          <p className="text-purple-200">Add a new bot manager to the system</p>
        </div>

        {/* Form */}
        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-8 border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter full name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter email address"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter phone number"
              />
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Preferred Language *
              </label>
              <select
                name="language"
                required
                value={formData.language}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="en">English</option>
                <option value="am">አማርኛ (Amharic)</option>
                <option value="sw">Kiswahili</option>
              </select>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Timezone *
              </label>
              <select
                name="timezone"
                required
                value={formData.timezone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="UTC">UTC</option>
                <option value="Africa/Addis_Ababa">Africa/Addis_Ababa</option>
                <option value="Africa/Nairobi">Africa/Nairobi</option>
                <option value="Europe/London">Europe/London</option>
                <option value="America/New_York">America/New_York</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Brief description of the bot manager's role"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Role Information */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h3 className="text-blue-400 font-medium mb-2">🤖 Bot Manager Role</h3>
              <p className="text-blue-300 text-sm">
                Bot managers can create and manage bots, configure channels, generate content, 
                and access all bot-related features. They cannot manage other users or system settings.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? 'Creating Bot Manager...' : 'Create Bot Manager'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 