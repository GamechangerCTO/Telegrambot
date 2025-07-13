/**
 * TELEGRAM BOT MANAGER 2025 - Setup Password Page
 * First-time password setup for new users
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function SetupPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Check if user came from password reset link
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    
    if (token && type === 'recovery') {
      console.log('🔄 Password setup: Processing recovery token');
      
      // Verify the token with Supabase
      supabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery',
      }).then(({ data, error }: any) => {
        if (error) {
          console.error('Token verification failed:', error);
          setError('Invalid or expired reset link. Please request a new one.');
        } else {
          console.log('✅ Token verified successfully');
          if (data.user) {
            setUserEmail(data.user.email || '');
          }
        }
      }).catch((err: any) => {
        console.error('Token verification error:', err);
        setError('Failed to verify reset link. Please try again.');
      });
    }
  }, [searchParams]);

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Update user password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        throw updateError;
      }

      // Update user profile to mark password as no longer requiring reset
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        const { error: profileError } = await supabase
          .from('managers')
          .update({
            password_reset_required: false,
            last_login: new Date().toISOString()
          })
          .eq('user_id', user.user.id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
        }
      }

      setSuccess('Password updated successfully! You will be redirected to login.');
      
      // Redirect to login after success
      setTimeout(() => {
        router.push('/auth/login?message=password-updated');
      }, 3000);

    } catch (error: any) {
      console.error('Password update error:', error);
      setError(error.message || 'Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">🔐</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Set Up Your Password
          </h1>
          <p className="text-gray-600">
            Welcome! Please create a secure password for your account.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your new password"
              required
            />
            <div className="mt-2 text-sm text-gray-500">
              <p>Password must contain:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>At least 8 characters</li>
                <li>One uppercase letter</li>
                <li>One lowercase letter</li>
                <li>One number</li>
              </ul>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Confirm your new password"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-500">
              Back to Login
            </Link>
          </p>
        </div>

        {/* Security Note */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-2">🔒 Security Tips</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Use a unique password for this account</p>
            <p>• Don't share your password with anyone</p>
            <p>• Consider using a password manager</p>
          </div>
        </div>
      </div>
    </div>
  );
} 