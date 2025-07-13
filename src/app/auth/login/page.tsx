/**
 * TELEGRAM BOT MANAGER 2025 - Login Page
 * Simple email-based login with automatic role detection
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const languages = {
  en: 'English',
  am: 'አማርኛ',
  sw: 'Kiswahili'
};

const translations = {
  en: {
    title: 'Bot Management System',
    subtitle: 'Login to the advanced management platform',
    email: 'Email Address',
    password: 'Password',
    remember: 'Remember me',
    login: 'Login to System',
    forgot: 'Forgot password?',
    register: 'Create new account',
    loading: 'Logging in...',
    errorRequired: 'Please enter email and password',
    errorInvalid: 'Invalid email or password',
    errorGeneral: 'Login error. Please try again.',
    success: 'Login successful! Redirecting...',
    info: 'Enter your email and the system will automatically detect if you are an admin or bot manager'
  },
  am: {
    title: 'የቦት አስተዳደር ስርዓት',
    subtitle: 'ወደ የላቀ አስተዳደር መድረክ ግባ',
    email: 'የኢሜይል አድራሻ',
    password: 'የይለፍ ቃል',
    remember: 'አስታውሰኝ',
    login: 'ወደ ስርዓት ግባ',
    forgot: 'የይለፍ ቃል ረሳህ?',
    register: 'አዲስ መለያ ፍጠር',
    loading: 'በመግባት ላይ...',
    errorRequired: 'እባክዎ ኢሜይል እና የይለፍ ቃል ያስገቡ',
    errorInvalid: 'ልክ ያልሆነ ኢሜይል ወይም የይለፍ ቃል',
    errorGeneral: 'የመግቢያ ስህተት። እንደገና ይሞክሩ።',
    success: 'በተሳካ ሁኔታ ገብተዋል! በመንቀሳቀስ ላይ...',
    info: 'ኢሜይልዎን ያስገቡ እና ሲስተሙ እርስዎ አስተዳዳሪ ወይም የቦት አስተዳዳሪ መሆንዎን በራስ ሰር ይለያል'
  },
  sw: {
    title: 'Mfumo wa Usimamizi wa Bot',
    subtitle: 'Ingia kwenye jukwaa la usimamizi wa hali ya juu',
    email: 'Anwani ya Barua pepe',
    password: 'Nenosiri',
    remember: 'Nikumbuke',
    login: 'Ingia kwenye Mfumo',
    forgot: 'Umesahau nenosiri?',
    register: 'Unda akaunti mpya',
    loading: 'Binaingia...',
    errorRequired: 'Tafadhali ingiza barua pepe na nenosiri',
    errorInvalid: 'Barua pepe au nenosiri si sahihi',
    errorGeneral: 'Hitilafu ya kuingia. Tafadhali jaribu tena.',
    success: 'Umeingia kwa ufanisi! Unaelekea...',
    info: 'Ingiza barua pepe yako na mfumo utajua kiotomatiki kama wewe ni msimamizi au meneja wa bot'
  }
};

export default function LoginPage() {
  const { signIn, isAuthenticated, isSuperAdmin, manager } = useAuth();
  const router = useRouter();
  const [currentLang, setCurrentLang] = useState('en');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirectPath = isSuperAdmin ? '/super-admin' : '/dashboard';
      router.push(redirectPath);
    }
  }, [isAuthenticated, isSuperAdmin, router]);

  // Handle redirect after successful login when manager data is loaded
  useEffect(() => {
    if (shouldRedirect && manager && success) {
      // Check if user needs to set up password
      if (manager.password_reset_required) {
        console.log('🔄 Login: User needs to set up password, redirecting to setup page');
        setSuccess('Login successful! Please set up your password for security.');
        setTimeout(() => {
          router.push('/auth/setup-password');
        }, 2000);
        setShouldRedirect(false);
        return;
      }
      
      const isAdmin = manager.role === 'super_admin';
      const redirectPath = isAdmin ? '/super-admin' : '/dashboard';
      
      console.log('🔄 Login: Redirecting to:', redirectPath, 'based on manager role:', manager.role);
      
      setTimeout(() => {
        router.push(redirectPath);
      }, 1000);
      
      setShouldRedirect(false);
    }
  }, [shouldRedirect, manager, success, router]);

  const t = translations[currentLang as keyof typeof translations];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError(t.errorRequired);
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn(email, password);
      
      if (result.error) {
        setError(t.errorInvalid);
      } else {
        setSuccess(t.success);
        setShouldRedirect(true); // Trigger redirect when manager data loads
      }
    } catch (error) {
      setError(t.errorGeneral);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {t.title}
          </h1>
          <p className="text-white/80">
            {t.subtitle}
          </p>
        </div>

        {/* Language Switcher */}
        <div className="flex justify-center mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1 flex space-x-1">
            {Object.entries(languages).map(([code, name]) => (
              <button
                key={code}
                onClick={() => setCurrentLang(code)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  currentLang === code
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-white font-medium mb-2">
                {t.email}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder={`${t.email.toLowerCase()}...`}
                required
                dir="ltr"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-white font-medium mb-2">
                {t.password}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-white">
                {t.remember}
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-200 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
                <p className="text-green-200 text-sm text-center">{success}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t.loading}
                </div>
              ) : (
                t.login
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center space-y-2">
            <Link href="/auth/forgot-password" className="text-white/80 hover:text-white text-sm">
              {t.forgot}
            </Link>
            <div className="text-white/60">
              <Link href="/auth/register" className="text-white hover:underline">
                {t.register}
              </Link>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
          <p className="text-white/70 text-sm text-center">
            {t.info}
          </p>
        </div>
      </div>
    </div>
  );
}