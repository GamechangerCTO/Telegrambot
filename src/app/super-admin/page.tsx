/**
 * TELEGRAM BOT MANAGER 2025 - Super Admin Dashboard
 * Revolutionary system-wide management interface
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
    title: 'System Administrator Dashboard',
    subtitle: 'Advanced management of the entire platform',
    greeting: {
      morning: 'Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening'
    },
    welcome: 'Welcome to the central control center',
    sections: {
      organizations: {
        title: 'Organizations',
        description: 'Manage all organizations in the system',
        total: 'Total Organizations',
        active: 'Active',
        pending: 'Pending Approval'
      },
      users: {
        title: 'Users',
        description: 'System-wide user management',
        total: 'Total Users',
        admins: 'Admins',
        managers: 'Managers',
        botManagers: 'Bot Managers'
      },
      system: {
        title: 'System Health',
        description: 'Platform performance monitoring',
        uptime: 'System Uptime',
        performance: 'Performance',
        apiCalls: 'API Calls/Hour',
        errors: 'Error Rate'
      },
      revenue: {
        title: 'Revenue Management',
        description: 'Global revenue tracking and optimization',
        totalRevenue: 'Total Revenue',
        monthlyGrowth: 'Monthly Growth',
        activeSubscriptions: 'Active Subscriptions',
        conversionRate: 'Conversion Rate'
      },
      security: {
        title: 'Security & Monitoring',
        description: 'Advanced security and monitoring tools',
        activeThreats: 'Active Threats',
        blockedAttempts: 'Blocked Attempts',
        securityScore: 'Security Score',
        compliance: 'Compliance Status'
      },
      analytics: {
        title: 'Advanced Analytics',
        description: 'Deep business intelligence',
        totalBots: 'Total Bots',
        totalChannels: 'Total Channels',
        messagesSent: 'Messages Sent Today',
        engagement: 'Engagement Rate'
      }
    },
    actions: {
      title: 'Quick Actions',
      createOrg: 'Create Organization',
      createOrgDesc: 'Add new organization to platform',
      manageUsers: 'Manage Users',
      manageUsersDesc: 'User administration and permissions',
      systemSettings: 'System Settings',
      systemSettingsDesc: 'Global platform configuration',
      viewLogs: 'View Logs',
      viewLogsDesc: 'System logs and monitoring',
      backup: 'Backup System',
      backupDesc: 'Create system backup',
      maintenance: 'Maintenance Mode',
      maintenanceDesc: 'Enable/disable maintenance mode'
    },
    alerts: {
      title: 'System Alerts',
      warning: 'Warning',
      info: 'Info',
      error: 'Error',
      success: 'Success'
    },
    nav: {
      dashboard: 'Dashboard',
      organizations: 'Organizations',
      users: 'Users',
      system: 'System',
      revenue: 'Revenue',
      security: 'Security',
      analytics: 'Analytics',
      settings: 'Settings'
    }
  },
  am: {
    title: 'የስርዓት አስተዳዳሪ ዳሽቦርድ',
    subtitle: 'የመላው መድረክ የተራቀቀ አስተዳደር',
    greeting: {
      morning: 'እንደምን አደሩ',
      afternoon: 'እንደምን ወትሩ',
      evening: 'እንደምን አመሸሽ'
    },
    welcome: 'ወደ ማእከላዊ ቁጥጥር ማዕከል እንኳን ደህና መጡ',
    sections: {
      organizations: {
        title: 'ድርጅቶች',
        description: 'በስርዓቱ ውስጥ ያሉ ሁሉንም ድርጅቶች ያስተዳድሩ',
        total: 'ጠቅላላ ድርጅቶች',
        active: 'ንቁ',
        pending: 'ፈቃድ በመጠበቅ ላይ'
      },
      users: {
        title: 'ተጠቃሚዎች',
        description: 'በስርዓት ደረጃ ያሉ ተጠቃሚዎች አስተዳደር',
        total: 'ጠቅላላ ተጠቃሚዎች',
        admins: 'አስተዳዳሪዎች',
        managers: 'ማናጀሮች',
        botManagers: 'ቦት ማናጀሮች'
      },
      system: {
        title: 'የስርዓት ጤንነት',
        description: 'የመድረክ አፈጻጸም ክትትል',
        uptime: 'የስርዓት ሰዓታዊ ሁኔታ',
        performance: 'አፈጻጸም',
        apiCalls: 'API ጥሪዎች/ሰዓት',
        errors: 'የስህተት መጠን'
      },
      revenue: {
        title: 'የገቢ አስተዳደር',
        description: 'ዓለም አቀፍ ገቢ ክትትል እና ማሻሻያ',
        totalRevenue: 'ጠቅላላ ገቢ',
        monthlyGrowth: 'ወራዊ እድገት',
        activeSubscriptions: 'ንቁ ምዝገባዎች',
        conversionRate: 'የልወጣ መጠን'
      },
      security: {
        title: 'ደህንነት እና ክትትል',
        description: 'የተራቀቀ ደህንነት እና ክትትል መሳሪያዎች',
        activeThreats: 'ንቁ ስጋቶች',
        blockedAttempts: 'የተዘጉ ሙከራዎች',
        securityScore: 'የደህንነት ነጥብ',
        compliance: 'የማክበር ሁኔታ'
      },
      analytics: {
        title: 'የተራቀቀ ትንታኔ',
        description: 'ጥልቅ የንግድ አይምሮ',
        totalBots: 'ጠቅላላ ቦቶች',
        totalChannels: 'ጠቅላላ ቻናሎች',
        messagesSent: 'ዛሬ የተላኩ መልዕክቶች',
        engagement: 'የተሳትፎ መጠን'
      }
    },
    actions: {
      title: 'ቀልጣፋ ድርጊቶች',
      createOrg: 'ድርጅት ፍጠር',
      createOrgDesc: 'ወደ መድረኩ አዲስ ድርጅት ጨምር',
      manageUsers: 'ተጠቃሚዎችን አስተዳድር',
      manageUsersDesc: 'የተጠቃሚ አስተዳደር እና ፈቃዶች',
      systemSettings: 'የስርዓት ቅንጅቶች',
      systemSettingsDesc: 'ዓለም አቀፍ የመድረክ ውቅር',
      viewLogs: 'ሎጎችን ተመልከት',
      viewLogsDesc: 'የስርዓት ሎጎች እና ክትትል',
      backup: 'ስርዓቱን ተሸኝ',
      backupDesc: 'የስርዓት ተሸኝ ፍጠር',
      maintenance: 'የጥገና ሁኔታ',
      maintenanceDesc: 'የጥገና ሁኔታን አንቃ/አቦዝን'
    },
    alerts: {
      title: 'የስርዓት ማስታወቂያዎች',
      warning: 'ማስጠንቀቂያ',
      info: 'መረጃ',
      error: 'ስህተት',
      success: 'ስኬት'
    },
    nav: {
      dashboard: 'ዳሽቦርድ',
      organizations: 'ድርጅቶች',
      users: 'ተጠቃሚዎች',
      system: 'ስርዓት',
      revenue: 'ገቢ',
      security: 'ደህንነት',
      analytics: 'ትንታኔ',
      settings: 'ቅንጅቶች'
    }
  },
  sw: {
    title: 'Dashibodi ya Msimamizi wa Mfumo',
    subtitle: 'Usimamizi wa hali ya juu wa jukwaa lote',
    greeting: {
      morning: 'Habari za asubuhi',
      afternoon: 'Habari za mchana',
      evening: 'Habari za jioni'
    },
    welcome: 'Karibu kwenye kituo cha udhibiti wa kati',
    sections: {
      organizations: {
        title: 'Mashirika',
        description: 'Simamia mashirika yote katika mfumo',
        total: 'Jumla ya Mashirika',
        active: 'Yanayofanya Kazi',
        pending: 'Yasubiri Idhini'
      },
      users: {
        title: 'Watumiaji',
        description: 'Usimamizi wa watumiaji wa mfumo mzima',
        total: 'Jumla ya Watumiaji',
        admins: 'Wasimamizi',
        managers: 'Mameneja',
        botManagers: 'Mameneja wa Bot'
      },
      system: {
        title: 'Afya ya Mfumo',
        description: 'Ufuatiliaji wa utendaji wa jukwaa',
        uptime: 'Muda wa Kufanya Kazi wa Mfumo',
        performance: 'Utendaji',
        apiCalls: 'Simu za API/Saa',
        errors: 'Kiwango cha Makosa'
      },
      revenue: {
        title: 'Usimamizi wa Mapato',
        description: 'Ufuatiliaji wa mapato ya kimataifa na uboreshaji',
        totalRevenue: 'Jumla ya Mapato',
        monthlyGrowth: 'Ukuaji wa Kila Mwezi',
        activeSubscriptions: 'Michango Inayofanya Kazi',
        conversionRate: 'Kiwango cha Ubadilishaji'
      },
      security: {
        title: 'Usalama na Ufuatiliaji',
        description: 'Vifaa vya usalama na ufuatiliaji vya hali ya juu',
        activeThreats: 'Vitisho Vinavyofanya Kazi',
        blockedAttempts: 'Majaribio Yaliyozuiliwa',
        securityScore: 'Alama ya Usalama',
        compliance: 'Hali ya Kufuata'
      },
      analytics: {
        title: 'Uchambuzi wa Hali ya Juu',
        description: 'Akili ya biashara ya kina',
        totalBots: 'Jumla ya Boti',
        totalChannels: 'Jumla ya Vituo',
        messagesSent: 'Ujumbe Uliotumwa Leo',
        engagement: 'Kiwango cha Kushiriki'
      }
    },
    actions: {
      title: 'Vitendo vya Haraka',
      createOrg: 'Unda Shirika',
      createOrgDesc: 'Ongeza shirika jipya kwenye jukwaa',
      manageUsers: 'Simamia Watumiaji',
      manageUsersDesc: 'Usimamizi wa watumiaji na ruhusa',
      systemSettings: 'Mipangilio ya Mfumo',
      systemSettingsDesc: 'Usanidi wa jukwaa la kimataifa',
      viewLogs: 'Ona Kumbukumbu',
      viewLogsDesc: 'Kumbukumbu za mfumo na ufuatiliaji',
      backup: 'Hifadhi ya Mfumo',
      backupDesc: 'Unda nakala rudufu ya mfumo',
      maintenance: 'Hali ya Matengenezo',
      maintenanceDesc: 'Washa/zima hali ya matengenezo'
    },
    alerts: {
      title: 'Arifa za Mfumo',
      warning: 'Onyo',
      info: 'Taarifa',
      error: 'Kosa',
      success: 'Mafanikio'
    },
    nav: {
      dashboard: 'Dashibodi',
      organizations: 'Mashirika',
      users: 'Watumiaji',
      system: 'Mfumo',
      revenue: 'Mapato',
      security: 'Usalama',
      analytics: 'Uchambuzi',
      settings: 'Mipangilio'
    }
  }
};

interface SystemStats {
  organizations: {
    total: number;
    active: number;
    pending: number;
  };
  users: {
    total: number;
    admins: number;
    managers: number;
    botManagers: number;
  };
  system: {
    uptime: string;
    performance: string;
    apiCalls: number;
    errors: string;
  };
  revenue: {
    total: string;
    monthlyGrowth: string;
    activeSubscriptions: number;
    conversionRate: string;
  };
  security: {
    activeThreats: number;
    blockedAttempts: number;
    securityScore: string;
    compliance: string;
  };
  analytics: {
    totalBots: number;
    totalChannels: number;
    messagesSent: number;
    engagement: string;
  };
}

export default function SuperAdminPage() {
  const { user, isAuthenticated, isSuperAdmin } = useAuth();
  const router = useRouter();
  const [currentLang, setCurrentLang] = useState('en');
  const [darkMode, setDarkMode] = useState(false);
  const [stats, setStats] = useState<SystemStats>({
    organizations: {
      total: 0,
      active: 0,
      pending: 0
    },
    users: {
      total: 0,
      admins: 0,
      managers: 0,
      botManagers: 0
    },
    system: {
      uptime: '0%',
      performance: '0%',
      apiCalls: 0,
      errors: '0%'
    },
    revenue: {
      total: '$0',
      monthlyGrowth: '0%',
      activeSubscriptions: 0,
      conversionRate: '0%'
    },
    security: {
      activeThreats: 0,
      blockedAttempts: 0,
      securityScore: '0%',
      compliance: 'Unknown'
    },
    analytics: {
      totalBots: 0,
      totalChannels: 0,
      messagesSent: 0,
      engagement: '0%'
    }
  });

  // Auto-redirect if not authenticated or not super admin
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    } else if (!isSuperAdmin) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isSuperAdmin, router]);

  // Load system stats
  useEffect(() => {
    const loadStats = async () => {
      // Simulate API call
      setTimeout(() => {
        setStats({
          organizations: {
            total: 156,
            active: 142,
            pending: 14
          },
          users: {
            total: 1847,
            admins: 12,
            managers: 234,
            botManagers: 1601
          },
          system: {
            uptime: '99.9%',
            performance: '94%',
            apiCalls: 15420,
            errors: '0.1%'
          },
          revenue: {
            total: '$284,520',
            monthlyGrowth: '+18.5%',
            activeSubscriptions: 1234,
            conversionRate: '12.3%'
          },
          security: {
            activeThreats: 0,
            blockedAttempts: 47,
            securityScore: '98%',
            compliance: 'Excellent'
          },
          analytics: {
            totalBots: 3421,
            totalChannels: 8934,
            messagesSent: 124567,
            engagement: '87.3%'
          }
        });
      }, 1000);
    };

    loadStats();
  }, []);

  if (!isAuthenticated || !isSuperAdmin) {
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
      title: t.actions.createOrg,
      description: t.actions.createOrgDesc,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: t.actions.manageUsers,
      description: t.actions.manageUsersDesc,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: t.actions.systemSettings,
      description: t.actions.systemSettingsDesc,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: t.actions.viewLogs,
      description: t.actions.viewLogsDesc,
      color: 'from-orange-500 to-red-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    },
    {
      title: t.actions.backup,
      description: t.actions.backupDesc,
      color: 'from-teal-500 to-cyan-600',
      bgColor: 'bg-teal-50 dark:bg-teal-900/20'
    },
    {
      title: t.actions.maintenance,
      description: t.actions.maintenanceDesc,
      color: 'from-red-500 to-pink-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    }
  ];

  const navigationItems = [
    { name: t.nav.dashboard, active: true },
    { name: t.nav.organizations, active: false },
    { name: t.nav.users, active: false },
    { name: t.nav.system, active: false },
    { name: t.nav.revenue, active: false },
    { name: t.nav.security, active: false },
    { name: t.nav.analytics, active: false },
    { name: t.nav.settings, active: false }
  ];

  const systemAlerts = [
    { type: 'success', message: 'All systems operating normally' },
    { type: 'info', message: 'Scheduled maintenance in 3 days' },
    { type: 'warning', message: 'High API usage detected' },
    { type: 'error', message: 'No critical errors' }
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-red-500 to-pink-600 flex items-center justify-center text-white font-bold text-xl">
                SA
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t.title}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {getGreeting()}, {user?.email}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Language Switcher */}
              <select 
                value={currentLang} 
                onChange={(e) => setCurrentLang(e.target.value)}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(languages).map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
              
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
              
              <Link 
                href="/dashboard"
                className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 font-medium"
              >
                Bot Manager
              </Link>
              
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-pink-600 flex items-center justify-center text-white font-bold">
                {user?.email?.[0]?.toUpperCase() || 'S'}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-3xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                {getGreeting()}, Super Admin!
              </h2>
              <p className="text-red-100">
                {t.welcome}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">System Status</div>
              <div className="text-red-100">All Systems Operational</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 mb-8 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-4">
            {navigationItems.map((item, index) => (
              <button
                key={index}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  item.active
                    ? 'bg-red-500 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {t.actions.title}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quickActions.map((action, index) => (
                  <div
                    key={index}
                    className={`${action.bgColor} rounded-2xl p-6 border-2 border-transparent hover:border-red-200 dark:hover:border-red-700 transition-all duration-300 group cursor-pointer`}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <span className="text-xl">⚡</span>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {action.title}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {action.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* System Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Organizations */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {t.sections.organizations.title}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">{t.sections.organizations.total}</span>
                    <span className="text-2xl font-bold text-blue-600">{stats.organizations.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">{t.sections.organizations.active}</span>
                    <span className="text-lg font-semibold text-green-600">{stats.organizations.active}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">{t.sections.organizations.pending}</span>
                    <span className="text-lg font-semibold text-orange-600">{stats.organizations.pending}</span>
                  </div>
                </div>
              </div>

              {/* Users */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {t.sections.users.title}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">{t.sections.users.total}</span>
                    <span className="text-2xl font-bold text-purple-600">{stats.users.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">{t.sections.users.admins}</span>
                    <span className="text-lg font-semibold text-red-600">{stats.users.admins}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">{t.sections.users.managers}</span>
                    <span className="text-lg font-semibold text-blue-600">{stats.users.managers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">{t.sections.users.botManagers}</span>
                    <span className="text-lg font-semibold text-green-600">{stats.users.botManagers}</span>
                  </div>
                </div>
              </div>

              {/* System Health */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  {t.sections.system.title}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">{t.sections.system.uptime}</span>
                    <span className="text-2xl font-bold text-green-600">{stats.system.uptime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">{t.sections.system.performance}</span>
                    <span className="text-lg font-semibold text-blue-600">{stats.system.performance}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">{t.sections.system.apiCalls}</span>
                    <span className="text-lg font-semibold text-purple-600">{stats.system.apiCalls}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">{t.sections.system.errors}</span>
                    <span className="text-lg font-semibold text-green-600">{stats.system.errors}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            
            {/* System Alerts */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {t.alerts.title}
              </h3>
              <div className="space-y-4">
                {systemAlerts.map((alert, index) => (
                  <div key={index} className={`p-4 rounded-xl border-l-4 ${
                    alert.type === 'success' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                    alert.type === 'info' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' :
                    alert.type === 'warning' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                    'border-red-500 bg-red-50 dark:bg-red-900/20'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${
                        alert.type === 'success' ? 'text-green-700 dark:text-green-300' :
                        alert.type === 'info' ? 'text-blue-700 dark:text-blue-300' :
                        alert.type === 'warning' ? 'text-yellow-700 dark:text-yellow-300' :
                        'text-red-700 dark:text-red-300'
                      }`}>
                        {alert.type === 'success' ? t.alerts.success :
                         alert.type === 'info' ? t.alerts.info :
                         alert.type === 'warning' ? t.alerts.warning :
                         t.alerts.error}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {alert.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Overview */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl p-6 text-white">
              <h3 className="text-xl font-bold mb-4">{t.sections.revenue.title}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>{t.sections.revenue.totalRevenue}</span>
                  <span className="text-2xl font-bold">{stats.revenue.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t.sections.revenue.monthlyGrowth}</span>
                  <span className="text-green-200">{stats.revenue.monthlyGrowth}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t.sections.revenue.activeSubscriptions}</span>
                  <span className="text-green-200">{stats.revenue.activeSubscriptions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t.sections.revenue.conversionRate}</span>
                  <span className="text-green-200">{stats.revenue.conversionRate}</span>
                </div>
              </div>
            </div>

            {/* Analytics Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {t.sections.analytics.title}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">{t.sections.analytics.totalBots}</span>
                  <span className="text-2xl font-bold text-blue-600">{stats.analytics.totalBots}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">{t.sections.analytics.totalChannels}</span>
                  <span className="text-lg font-semibold text-green-600">{stats.analytics.totalChannels}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">{t.sections.analytics.messagesSent}</span>
                  <span className="text-lg font-semibold text-purple-600">{stats.analytics.messagesSent}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">{t.sections.analytics.engagement}</span>
                  <span className="text-lg font-semibold text-orange-600">{stats.analytics.engagement}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 