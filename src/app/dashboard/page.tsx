/**
 * TELEGRAM BOT MANAGER 2025 - Dashboard
 * Revolutionary personalized bot management interface
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const languages = {
  en: 'English',
  am: 'አማርኛ',
  sw: 'Kiswahili'
};

const translations = {
  en: {
    greeting: {
      morning: 'Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening'
    },
    welcome: 'Welcome to your advanced management center',
    role: 'Your Role',
    quickActions: {
      title: 'Quick Actions',
      content: 'Create Content',
      contentDesc: 'Generate content for all channels',
      coupons: 'Smart Coupons',
      couponsDesc: 'Manage automated revenue',
      analysis: 'Match Analysis',
      analysisDesc: 'Create professional analysis',
      automation: 'Automation Rules',
      automationDesc: 'Configure smart automation'
    },
    stats: {
      title: 'Real-time Statistics',
      bots: 'Active Bots',
      channels: 'Total Channels',
      revenue: 'Monthly Revenue',
      performance: 'Performance'
    },
    ai: {
      title: 'AI Recommendations',
      recommendation1: 'Now is the perfect time to send betting tips - high user activity',
      recommendation2: 'Your Amharic channel shows excellent engagement - consider more content',
      recommendation3: 'Revenue can be increased by 23% with smart coupon optimization',
      recommendation4: 'Live match analysis generates 40% more engagement than regular content'
    },
    activity: {
      title: 'Recent Activity',
      item1: 'Real Madrid vs Barcelona analysis sent successfully',
      item2: 'Smart coupon triggered for Premier League',
      item3: 'Automation rule activated for evening content',
      item4: 'Revenue increased by 15% this week'
    },
    nav: {
      bots: 'Bots',
      channels: 'Channels',
      content: 'Content',
      coupons: 'Coupons',
      automation: 'Automation',
      analytics: 'Analytics',
      settings: 'Settings'
    },
    roles: {
      content_manager: 'Content Manager',
      business_owner: 'Business Owner',
      marketer: 'Marketer',
      analyst: 'Analyst'
    }
  },
  am: {
    greeting: {
      morning: 'እንደምን አደሩ',
      afternoon: 'እንደምን ወትሩ',
      evening: 'እንደምን አመሸሽ'
    },
    welcome: 'ወደ የእርስዎ የላቀ አስተዳደር ማዕከል እንኳን ደህና መጡ',
    role: 'የእርስዎ ሚና',
    quickActions: {
      title: 'ቀልጣፋ ድርጊቶች',
      content: 'ይዘት ፍጠር',
      contentDesc: 'ለሁሉም ቻናሎች ይዘት ፍጠር',
      coupons: 'ብልህ ኩፖኖች',
      couponsDesc: 'ራስ-ተሰላ ገቢ ያስተዳድሩ',
      analysis: 'የጨዋታ ትንታኔ',
      analysisDesc: 'ሙያዊ ትንታኔ ፍጠር',
      automation: 'ራስ-ስርዓተ-ስራ ደንቦች',
      automationDesc: 'ብልህ ራስ-ስርዓተ-ስራ ይዋቀሩ'
    },
    stats: {
      title: 'በጊዜ ሂደት ስታቲስቲክስ',
      bots: 'ንቁ ቦቶች',
      channels: 'ጠቅላላ ቻናሎች',
      revenue: 'ወራዊ ገቢ',
      performance: 'አፈጻጸም'
    },
    ai: {
      title: 'AI ምክሮች',
      recommendation1: 'አሁን የመወደድ ምክሮች ለመላክ ምቹ ጊዜ ነው - ከፍተኛ የተጠቃሚ እንቅስቃሴ',
      recommendation2: 'የእርስዎ የአማርኛ ቻናል ممتاز ተሳትፎ ያሳያል - ተጨማሪ ይዘት ያስቡ',
      recommendation3: 'ገቢ በብልህ ኩፖን ማሻሻል በ23% ሊጨምር ይችላል',
      recommendation4: 'የቀጥታ ጨዋታ ትንታኔ ከመደበኛ ይዘት በ40% ተሳትፎ ያመጣል'
    },
    activity: {
      title: 'የቅርብ ጊዜ እንቅስቃሴ',
      item1: 'ሪያል ማድሪድ ከባርሴሎና ትንታኔ በተሳካ ሁኔታ ተልኳል',
      item2: 'ለፕሪሚየር ሊግ ብልህ ኩፖን ተነቃ',
      item3: 'ለምሽት ይዘት ራስ-ስርዓተ-ስራ ደንብ ተነቃ',
      item4: 'ገቢ በዚህ ሳምንት በ15% ጨመረ'
    },
    nav: {
      bots: 'ቦቶች',
      channels: 'ቻናሎች',
      content: 'ይዘት',
      coupons: 'ኩፖኖች',
      automation: 'ራስ-ስርዓተ-ስራ',
      analytics: 'ትንታኔዎች',
      settings: 'ቅንጅቶች'
    },
    roles: {
      content_manager: 'ይዘት አስተዳዳሪ',
      business_owner: 'የንግድ ባለቤት',
      marketer: 'ገበያ ሰሪ',
      analyst: 'ተንታኚ'
    }
  },
  sw: {
    greeting: {
      morning: 'Habari za asubuhi',
      afternoon: 'Habari za mchana',
      evening: 'Habari za jioni'
    },
    welcome: 'Karibu kwenye kituo chako cha usimamizi wa hali ya juu',
    role: 'Jukumu Lako',
    quickActions: {
      title: 'Vitendo vya Haraka',
      content: 'Unda Maudhui',
      contentDesc: 'Tengeneza maudhui kwa vituo vyote',
      coupons: 'Kuponi za Akili',
      couponsDesc: 'Simamia mapato otomatiki',
      analysis: 'Uchambuzi wa Mechi',
      analysisDesc: 'Unda uchambuzi wa kitaalamu',
      automation: 'Kanuni za Otomatiki',
      automationDesc: 'Sanidi otomatiki ya akili'
    },
    stats: {
      title: 'Takwimu za Wakati Halisi',
      bots: 'Boti Zinazofanya Kazi',
      channels: 'Jumla ya Vituo',
      revenue: 'Mapato ya Kila Mwezi',
      performance: 'Utendaji'
    },
    ai: {
      title: 'Mapendekezo ya AI',
      recommendation1: 'Sasa ni wakati mzuri wa kutuma vidokezo vya kubeti - shughuli nyingi za watumiaji',
      recommendation2: 'Kituo chako cha Kiswahili kinaonyesha kushiriki kwa hali ya juu - fikiria maudhui zaidi',
      recommendation3: 'Mapato yanaweza kuongezeka kwa 23% kwa uboreshaji wa kuponi za akili',
      recommendation4: 'Uchambuzi wa mechi za moja kwa moja unazalisha kushiriki kwa 40% zaidi kuliko maudhui ya kawaida'
    },
    activity: {
      title: 'Shughuli za Hivi Karibuni',
      item1: 'Uchambuzi wa Real Madrid dhidi ya Barcelona umetumwa kwa ufanisi',
      item2: 'Kuponi ya akili imeamilishwa kwa Premier League',
      item3: 'Kanuni ya otomatiki imeamilishwa kwa maudhui ya jioni',
      item4: 'Mapato yameongezeka kwa 15% wiki hii'
    },
    nav: {
      bots: 'Boti',
      channels: 'Vituo',
      content: 'Maudhui',
      coupons: 'Kuponi',
      automation: 'Otomatiki',
      analytics: 'Uchambuzi',
      settings: 'Mipangilio'
    },
    roles: {
      content_manager: 'Meneja wa Maudhui',
      business_owner: 'Mmiliki wa Biashara',
      marketer: 'Mfanya Masoko',
      analyst: 'Mchambuzi'
    }
  }
};

interface DashboardStats {
  activeBots: number;
  totalChannels: number;
  activeChannels: number;
  totalPosts: number;
  totalMembers: number;
  monthlyRevenue: string;
  performance: string;
  averageResponseTime: number;
  growth: {
    botsThisMonth: number;
    channelsThisMonth: number;
    revenueGrowth: string;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    timestamp: string;
    status: string;
    time: number;
  }>;
  systemHealth: {
    status: string;
    score: number;
    lastCheck: string;
  };
  quickStats: {
    contentGenerated24h: number;
    successRate: string;
    avgGenerationTime: string;
    activeNow: number;
  };
}

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [currentLang, setCurrentLang] = useState('en');
  const [darkMode, setDarkMode] = useState(false);
  const [userRole, setUserRole] = useState('content_manager');
  const [stats, setStats] = useState<DashboardStats>({
    activeBots: 0,
    totalChannels: 0,
    activeChannels: 0,
    totalPosts: 0,
    totalMembers: 0,
    monthlyRevenue: '$0',
    performance: '0%',
    averageResponseTime: 0,
    growth: {
      botsThisMonth: 0,
      channelsThisMonth: 0,
      revenueGrowth: '0%'
    },
    recentActivity: [],
    systemHealth: {
      status: 'loading',
      score: 0,
      lastCheck: new Date().toISOString()
    },
    quickStats: {
      contentGenerated24h: 0,
      successRate: '0%',
      avgGenerationTime: '0s',
      activeNow: 0
    }
  });

  // Auto-redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  // Load dashboard stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        console.log('📊 Loading dashboard stats...');
        const response = await fetch('/api/dashboard/stats');
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard stats');
        }
        
        const data = await response.json();
        setStats(data);
        console.log('✅ Dashboard stats loaded successfully');
      } catch (error) {
        console.error('❌ Error loading dashboard stats:', error);
        // Keep default values on error
      }
    };

    loadStats();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isAuthenticated) {
    return null;
  }

  const t = translations[currentLang as keyof typeof translations];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t.greeting.morning;
    if (hour < 17) return t.greeting.afternoon;
    return t.greeting.evening;
  };

  const quickActions = [
    {
      title: t.quickActions.content,
      description: t.quickActions.contentDesc,
      href: '/dashboard/content',
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: t.quickActions.coupons,
      description: t.quickActions.couponsDesc,
      href: '/dashboard/coupons',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: t.quickActions.analysis,
      description: t.quickActions.analysisDesc,
      href: '/dashboard/content/analytics',
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: t.quickActions.automation,
      description: t.quickActions.automationDesc,
      href: '/automation',
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    }
  ];

  const navigationItems = [
    { name: t.nav.bots, href: '/dashboard/bots', active: false },
    { name: t.nav.channels, href: '/dashboard/channels', active: false },
    { name: t.nav.content, href: '/dashboard/content', active: false },
    { name: t.nav.coupons, href: '/dashboard/coupons', active: false },
    { name: t.nav.automation, href: '/automation', active: false },
    { name: t.nav.analytics, href: '/dashboard/content/analytics', active: false },
    { name: t.nav.settings, href: '/dashboard/settings', active: false }
  ];

  const aiRecommendations = [
    t.ai.recommendation1,
    t.ai.recommendation2,
    t.ai.recommendation3,
    t.ai.recommendation4
  ];

  const recentActivityItems = stats.recentActivity.length > 0 
    ? stats.recentActivity.map((activity: any) => {
        const timeAgo = new Date(activity.timestamp).toLocaleTimeString();
        return `${activity.type} - ${activity.status} (${timeAgo})`;
      })
    : [
        t.activity.item1,
        t.activity.item2,
        t.activity.item3,
        t.activity.item4
      ];

  return (
    <div className={`${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'} px-4 sm:px-6 lg:px-8 py-4`}>
      
      {/* Welcome Section */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-6 mb-4 sm:mb-6">
          <div className="w-full lg:w-auto">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {getGreeting()}, {user?.email?.split('@')[0]}!
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
              {t.welcome}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full lg:w-auto">
            {/* Language Switcher */}
            <select 
              value={currentLang} 
              onChange={(e) => setCurrentLang(e.target.value)}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
            >
              {Object.entries(languages).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
            
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 sm:self-auto"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            
            <div className="text-left sm:text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.role}</p>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
              >
                <option value="content_manager">{t.roles.content_manager}</option>
                <option value="business_owner">{t.roles.business_owner}</option>
                <option value="marketer">{t.roles.marketer}</option>
                <option value="analyst">{t.roles.analyst}</option>
              </select>
            </div>
            
            {/* Admin Navigation - Show for super_admin and admin */}
            {(user?.role === 'super_admin' || user?.role === 'admin') && (
              <div className="flex gap-2 w-full sm:w-auto">
                <Link 
                  href="/dashboard/admin/managers"
                  className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex-1 sm:flex-initial"
                >
                  <span className="text-sm">👥</span>
                  <span className="text-sm font-medium">Manage Users</span>
                </Link>
                
                {user?.role === 'super_admin' && (
                  <Link 
                    href="/super-admin"
                    className="flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex-1 sm:flex-initial"
                  >
                    <span className="text-sm">⚡</span>
                    <span className="text-sm font-medium">Super Admin</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          
          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              {t.quickActions.title}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  href={action.href}
                  className={`${action.bgColor} rounded-2xl p-4 sm:p-6 border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-300 group`}
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center text-white mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-lg sm:text-xl">⚡</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {action.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {action.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              {t.stats.title}
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">{stats.activeBots}</div>
                <div className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">{t.stats.bots}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">+{stats.growth.botsThisMonth} this month</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">{stats.totalChannels}</div>
                <div className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">{t.stats.channels}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{stats.activeChannels} active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-2">{stats.monthlyRevenue}</div>
                <div className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">{t.stats.revenue}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{stats.growth.revenueGrowth}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-orange-600 mb-2">{stats.performance}</div>
                <div className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">{t.stats.performance}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{stats.quickStats.avgGenerationTime} avg</div>
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              System Performance
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-indigo-600 mb-2">{stats.totalPosts.toLocaleString()}</div>
                <div className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">Total Posts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-emerald-600 mb-2">{stats.totalMembers.toLocaleString()}</div>
                <div className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">Total Members</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-pink-600 mb-2">{stats.quickStats.contentGenerated24h}</div>
                <div className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">Content Today</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl sm:text-3xl font-bold mb-2 ${
                  stats.systemHealth.score >= 90 ? 'text-green-600' : 
                  stats.systemHealth.score >= 70 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {stats.systemHealth.score}%
                </div>
                <div className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">System Health</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{stats.systemHealth.status}</div>
              </div>
            </div>
          </div>

          {/* Smart Navigation */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 sm:p-6 lg:p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              Smart Navigation
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {navigationItems.map((item, index) => (
                <Link
                  key={index} 
                  href={item.href}
                  className="flex items-center space-x-3 p-3 sm:p-4 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 group"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm group-hover:scale-110 transition-transform duration-300">
                    ⚡
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium text-sm sm:text-base">
                    {item.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 sm:space-y-8">
          
          {/* AI Recommendations */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">
              {t.ai.title}
            </h3>
            <div className="space-y-4">
              {aiRecommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs sm:text-sm flex-shrink-0">
                    AI
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">
              {t.activity.title}
            </h3>
            <div className="space-y-4">
              {recentActivityItems.map((activity: any, index: number) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {activity}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-4 sm:p-6 text-white">
            <h3 className="text-lg sm:text-xl font-bold mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm sm:text-base">API Response</span>
                <span className="text-green-300 text-sm sm:text-base">Fast</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm sm:text-base">Bot Status</span>
                <span className="text-green-300 text-sm sm:text-base">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm sm:text-base">Revenue System</span>
                <span className="text-green-300 text-sm sm:text-base">Optimal</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm sm:text-base">Content Quality</span>
                <span className="text-green-300 text-sm sm:text-base">High</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 