/**
 * 📝 Registration Page
 * User registration with role assignment
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/useI18n';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase';
import { LanguageSwitcher, FormField, TextInput, LoadingSpinner } from '@/components';

export default function RegisterPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const supabase = createClient();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [success, setSuccess] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});
    
    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name
          }
        }
      });

      if (authError) {
        if (authError.message?.includes('User already registered')) {
          setErrors({ general: 'An account with this email already exists.' });
        } else {
          setErrors({ general: authError.message || 'Registration failed. Please try again.' });
        }
        return;
      }

      if (authData.user) {
        // Create manager record
        const { error: managerError } = await supabase
          .from('managers')
          .insert({
            user_id: authData.user.id,
            email: formData.email,
            name: formData.name,
            role: 'manager', // Default role
            preferred_language: 'en',
            is_active: true
          });

        if (managerError) {
          console.error('Error creating manager record:', managerError);
          // Don't show error to user as auth was successful
        }

        setSuccess(true);
        
        // Redirect after showing success message
        setTimeout(() => {
          router.push('/auth/login?message=registration-success');
        }, 3000);
      }
      
    } catch (error: any) {
      console.error('Registration error:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✅</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Registration Successful!</h2>
            <p className="text-gray-600 mb-6">
              Your account has been created successfully. Please check your email to confirm your account, then proceed to login.
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Continue to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-3 group mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:shadow-lg transition-all duration-200">
              <span className="text-white font-bold text-xl">⚡</span>
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TeleBots Pro
              </h1>
              <p className="text-xs text-gray-600">Sports Content Manager</p>
            </div>
          </Link>

          <div className="p-4 rounded-xl bg-green-50 border-2 border-green-500 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              📝 Create Account
            </h2>
            <p className="text-gray-600">
              Join the TeleBots Pro platform
            </p>
          </div>

          {/* Language Switcher */}
          <div className="flex justify-center mb-6">
            <LanguageSwitcher variant="compact" />
          </div>
        </div>

        {/* Registration Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{errors.general}</p>
              </div>
            )}

            <div className="space-y-4">
              <FormField
                label="Full Name"
                required
                error={errors.name}
              >
                <TextInput
                  type="text"
                  value={formData.name}
                  onChange={(value) => handleInputChange('name', value)}
                  placeholder="Enter your full name"
                  error={!!errors.name}
                  autoComplete="name"
                />
              </FormField>

              <FormField
                label="Email Address"
                required
                error={errors.email}
              >
                <TextInput
                  type="email"
                  value={formData.email}
                  onChange={(value) => handleInputChange('email', value)}
                  placeholder="Enter your email"
                  error={!!errors.email}
                  autoComplete="email"
                />
              </FormField>

              <FormField
                label="Password"
                required
                error={errors.password}
              >
                <TextInput
                  type="password"
                  value={formData.password}
                  onChange={(value) => handleInputChange('password', value)}
                  placeholder="Enter your password"
                  error={!!errors.password}
                  autoComplete="new-password"
                />
              </FormField>

              <FormField
                label="Confirm Password"
                required
                error={errors.confirmPassword}
              >
                <TextInput
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(value) => handleInputChange('confirmPassword', value)}
                  placeholder="Confirm your password"
                  error={!!errors.confirmPassword}
                  autoComplete="new-password"
                />
              </FormField>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white transition-all duration-200 bg-gradient-to-r from-green-500 to-teal-600 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>📝</span>
                    <span>Create Account</span>
                  </div>
                )}
              </button>
            </div>

            {/* Info */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">📋 Account Setup</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Default role: Bot Manager</p>
                <p>• Email verification required</p>
                <p>• Contact admin for elevated access</p>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
} 