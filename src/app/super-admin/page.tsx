/**
 * TELEGRAM BOT MANAGER 2025 - Super Admin Dashboard
 * Revolutionary system-wide management interface with REAL DATA
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
    errors: number;
    healthScore: number;
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
  systemHealth: {
    status: string;
    score: number;
    issues: any[];
  };
  recentActivity: any[];
}

interface OpenAICosts {
  currentMonth: {
    cost: number;
    tokens: number;
    requests: number;
    averageDailyCost: number;
  };
  growth: {
    cost: number;
    usage: number;
  };
  projections: {
    monthlyCost: number;
    dailyAverage: number;
    daysRemaining: number;
  };
  summary: {
    status: string;
    budgetUsed: number;
    efficiency: number;
  };
}

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
    systemAdmin: 'System Administrator',
    lastUpdated: 'Last updated',
    refreshData: 'Refresh Data',
    systemStatus: 'System Status',
    healthy: 'Healthy',
    warning: 'Warning',
    critical: 'Critical',
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
        apiCalls: 'API Calls/Day',
        errors: 'Error Rate',
        health: 'Health Score'
      },
      openai: {
        title: 'OpenAI Costs',
        description: 'AI usage and cost monitoring',
        currentCost: 'Current Month',
        projectedCost: 'Projected Cost',
        efficiency: 'Efficiency',
        status: 'Budget Status'
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
    navigation: {
      switchToBotManager: 'Switch to Bot Manager',
      superAdminMode: 'Super Admin Mode',
      botManagerMode: 'Bot Manager Mode'
    },
    actions: {
      title: 'Quick Actions',
      createOrg: 'Create Organization',
      createOrgDesc: 'Add new organization to platform',
      createBotManager: 'Create Bot Manager',
      createBotManagerDesc: 'Add new bot manager to system',
      manageUsers: 'Manage Users',
      manageUsersDesc: 'User management and permissions',
      systemSettings: 'System Settings',
      systemSettingsDesc: 'Global platform configuration',
      viewLogs: 'View Logs',
      viewLogsDesc: 'System logs and monitoring',
      backup: 'Backup System',
      backupDesc: 'Create system backup',
      maintenance: 'Maintenance Mode',
      maintenanceDesc: 'Enable/disable maintenance mode'
    },
    loading: 'Loading system data...',
    error: 'Error loading data',
    refresh: 'Refresh Data'
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
    systemAdmin: 'የስርዓት አስተዳዳሪ',
    lastUpdated: 'በመጨረሻ',
    refreshData: 'አርዝ አስተዳደር',
    systemStatus: 'የስርዓት ሁኔታ',
    healthy: 'ንቁ',
    warning: 'ማስጠንቀቂያ',
    critical: 'ስህተት',
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
        errors: 'የስህተት መጠን',
        health: 'የስርዓት ጤንነት'
      },
      openai: {
        title: 'የኦፕአይ ኮስቶች',
        description: 'AI የመደበኛ እና ኮስቶች መመለስ',
        currentCost: 'የመሰረት ወር',
        projectedCost: 'መረዳት ኮስቶች',
        efficiency: 'አመልካች',
        status: 'መጠን ሁኔታ'
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
    navigation: {
      switchToBotManager: 'የቦት ማናጀሮ መረዳት',
      superAdminMode: 'የስርዓት አስተዳዳሪ መረዳት',
      botManagerMode: 'የቦት ማናጀሮ መረዳት'
    },
    actions: {
      title: 'ቀልጣፋ ድርጊቶች',
      createOrg: 'ድርጅት ፍጠር',
      createOrgDesc: 'ወደ መድረኩ አዲስ ድርጅት ጨምር',
      createBotManager: 'የቦት ማናጀሮ ፍጠር',
      createBotManagerDesc: 'ወደ መድረኩ አዲስ የቦት ማናጀሮ ጨምር',
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
    },
    loading: 'Loading system data...',
    error: 'Error loading data',
    refresh: 'Refresh Data'
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
    systemAdmin: 'Msimamizi wa Mfumo',
    lastUpdated: 'Imefanyika mwisho',
    refreshData: 'Kufanya kazi tena',
    systemStatus: 'Hali ya Mfumo',
    healthy: 'Tayari',
    warning: 'Ujumbe',
    critical: 'Kosa',
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
        errors: 'Kiwango cha Makosa',
        health: 'Afya ya Mfumo'
      },
      openai: {
        title: 'Maombi ya OpenAI',
        description: 'Ufuatiliaji wa maombi na maombi ya OpenAI',
        currentCost: 'Mwezi wa sasa',
        projectedCost: 'Maombi yafuatayo',
        efficiency: 'Ufuatiliaji',
        status: 'Hali ya Budjet'
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
    navigation: {
      switchToBotManager: 'Tumia Msimamizi wa Bot',
      superAdminMode: 'Hali ya Msimamizi wa Super',
      botManagerMode: 'Hali ya Msimamizi wa Bot'
    },
    actions: {
      title: 'Vitendo vya Haraka',
      createOrg: 'Unda Shirika',
      createOrgDesc: 'Ongeza shirika jipya kwenye jukwaa',
      createBotManager: 'Unda Msimamizi wa Bot',
      createBotManagerDesc: 'Ongeza msimamizi wa bot jipya kwenye jukwaa',
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
    },
    loading: 'Loading system data...',
    error: 'Error loading data',
    refresh: 'Refresh Data'
  }
};

export default function SuperAdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SystemStats>({
    organizations: { total: 0, active: 0, pending: 0 },
    users: { total: 0, admins: 0, managers: 0, botManagers: 0 },
    system: { uptime: '0h 0m', performance: 'Good', apiCalls: 0, errors: 0, healthScore: 100 },
    revenue: { total: '$0', monthlyGrowth: '0%', activeSubscriptions: 0, conversionRate: '0%' },
    security: { activeThreats: 0, blockedAttempts: 0, securityScore: 'A', compliance: 'Compliant' },
    analytics: { totalBots: 0, totalChannels: 0, messagesSent: 0, engagement: '0%' },
    systemHealth: { status: 'healthy', score: 100, issues: [] },
    recentActivity: []
  });
  const [openaiCosts, setOpenaiCosts] = useState<OpenAICosts>({
    currentMonth: { cost: 0, tokens: 0, requests: 0, averageDailyCost: 0 },
    growth: { cost: 0, usage: 0 },
    projections: { monthlyCost: 0, dailyAverage: 0, daysRemaining: 0 },
    summary: { status: 'within_budget', budgetUsed: 0, efficiency: 0 }
  });
  const [language] = useState<'en'>('en');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const t = translations[language];

  // Load real data from APIs
  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Fetch both APIs in parallel
      const [statsResponse, openaiResponse] = await Promise.all([
        fetch('/api/super-admin/stats'),
        fetch('/api/super-admin/openai-costs')
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (openaiResponse.ok) {
        const openaiData = await openaiResponse.json();
        setOpenaiCosts(openaiData);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const refreshData = () => {
    setLastUpdated(new Date());
    loadStats();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t.greeting.morning;
    if (hour < 17) return t.greeting.afternoon;
    return t.greeting.evening;
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'within_budget':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy':
        return t.healthy;
      case 'warning':
        return t.warning;
      case 'critical':
        return t.critical;
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mb-4"></div>
          <p className="text-white text-lg">Loading system data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">⚠️</div>
          <p className="text-white text-lg">{error}</p>
          <button 
            onClick={refreshData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
      {/* Header */}
        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-6xl">👑</div>
              <div>
                <h1 className="text-3xl font-bold text-white">System Administrator Dashboard</h1>
                <p className="text-gray-300">Advanced management of the entire platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard" 
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Switch to Bot Manager
              </Link>
              <div className="px-3 py-2 bg-black/20 text-white border border-white/20 rounded-lg">
                🌐 English Interface
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <span className="text-gray-300">{getGreeting()}, </span>
              <span className="text-white font-semibold">System Administrator</span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
              <button
                onClick={refreshData}
                className="p-2 text-gray-300 hover:text-white transition-colors"
                title="Refresh Data"
              >
                🔄
              </button>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">System Status</h2>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(stats.systemHealth.status)}`}>
              {getStatusText(stats.systemHealth.status)}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getHealthColor(stats.systemHealth.score)}`}>
                {stats.systemHealth.score}%
              </div>
              <div className="text-gray-400">Health Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">
                {stats.system.apiCalls}
              </div>
              <div className="text-gray-400">API Calls Today</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">
                {stats.system.uptime}
              </div>
              <div className="text-gray-400">System Uptime</div>
            </div>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Organizations */}
                    <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Organizations</h3>
              <span className="text-2xl">🏢</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Total Organizations:</span>
                <span className="text-white font-bold">{stats.organizations.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Active:</span>
                <span className="text-green-400 font-bold">{stats.organizations.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Pending Approval:</span>
                <span className="text-yellow-400 font-bold">{stats.organizations.pending}</span>
              </div>
            </div>
          </div>

          {/* Users */}
          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Users</h3>
              <span className="text-2xl">👥</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Total Users:</span>
                <span className="text-white font-bold">{stats.users.total}</span>
                  </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Admins:</span>
                <span className="text-purple-400 font-bold">{stats.users.admins}</span>
                  </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Bot Managers:</span>
                <span className="text-blue-400 font-bold">{stats.users.botManagers}</span>
                  </div>
                </div>
              </div>

          {/* OpenAI Costs */}
          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">OpenAI Costs</h3>
              <span className="text-2xl">🤖</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Current Month:</span>
                <span className="text-white font-bold">${openaiCosts.currentMonth.cost}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Projected Cost:</span>
                <span className="text-yellow-400 font-bold">${openaiCosts.projections.monthlyCost}</span>
                  </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Efficiency:</span>
                <span className="text-green-400 font-bold">{openaiCosts.summary.efficiency}%</span>
                  </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Budget Status:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(openaiCosts.summary.status)}`}>
                  {openaiCosts.summary.status.replace('_', ' ').toUpperCase()}
                </span>
                  </div>
                  </div>
                </div>
              </div>

        {/* Revenue and Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Revenue */}
          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Revenue Management</h3>
              <span className="text-2xl">💰</span>
                  </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Total Revenue:</span>
                <span className="text-green-400 font-bold">{stats.revenue.total}</span>
                  </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Monthly Growth:</span>
                <span className="text-green-400 font-bold">{stats.revenue.monthlyGrowth}</span>
                  </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Active Subscriptions:</span>
                <span className="text-blue-400 font-bold">{stats.revenue.activeSubscriptions}</span>
                  </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Conversion Rate:</span>
                <span className="text-white font-bold">{stats.revenue.conversionRate}</span>
              </div>
            </div>
          </div>

          {/* Analytics */}
          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Advanced Analytics</h3>
              <span className="text-2xl">📊</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Total Bots:</span>
                <span className="text-white font-bold">{stats.analytics.totalBots}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Total Channels:</span>
                <span className="text-blue-400 font-bold">{stats.analytics.totalChannels}</span>
                    </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Messages Sent Today:</span>
                <span className="text-green-400 font-bold">{stats.analytics.messagesSent}</span>
                  </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Engagement Rate:</span>
                <span className="text-purple-400 font-bold">{stats.analytics.engagement}</span>
              </div>
            </div>
              </div>
            </div>

        {/* Quick Actions */}
        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8">
                      <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Create Bot Manager */}
            <Link href="/dashboard/admin/managers?tab=create">
              <button className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg transition-colors text-left w-full">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">👤</span>
                  <div>
                    <h4 className="font-medium">Create Bot Manager</h4>
                    <p className="text-sm text-purple-200">Add new bot manager to system</p>
                  </div>
                </div>
              </button>
            </Link>
            
            {/* Manage Users */}
            <Link href="/dashboard/admin/managers">
              <button className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors text-left w-full">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">👥</span>
                  <div>
                    <h4 className="font-medium">Manage Users</h4>
                    <p className="text-sm text-blue-200">User management and permissions</p>
                  </div>
                </div>
              </button>
            </Link>
            
            {/* System Settings */}
            <Link href="/dashboard/settings">
              <button className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg transition-colors text-left w-full">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">⚙️</span>
                  <div>
                    <h4 className="font-medium">System Settings</h4>
                    <p className="text-sm text-green-200">Global platform configuration</p>
                  </div>
                </div>
              </button>
            </Link>
            
            {/* System Monitoring */}
            <Link href="/super-admin/system">
              <button className="bg-yellow-600 hover:bg-yellow-700 text-white p-4 rounded-lg transition-colors text-left w-full">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📊</span>
                  <div>
                    <h4 className="font-medium">System Monitoring</h4>
                    <p className="text-sm text-yellow-200">Real-time system health and performance</p>
                  </div>
                </div>
              </button>
            </Link>
            
            {/* Organizations Management */}
            <Link href="/dashboard/multi-org">
              <button className="bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-lg transition-colors text-left w-full">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🏢</span>
                  <div>
                    <h4 className="font-medium">Organizations</h4>
                    <p className="text-sm text-orange-200">Manage multi-organization setup</p>
                  </div>
                </div>
              </button>
            </Link>
            
            {/* Content Management */}
            <Link href="/dashboard/content">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-lg transition-colors text-left w-full">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📝</span>
                  <div>
                    <h4 className="font-medium">Content Management</h4>
                    <p className="text-sm text-indigo-200">Manage content generation and distribution</p>
                  </div>
                </div>
              </button>
            </Link>
            
            {/* Revenue Management */}
            <Link href="/dashboard/coupons">
              <button className="bg-pink-600 hover:bg-pink-700 text-white p-4 rounded-lg transition-colors text-left w-full">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">💰</span>
                  <div>
                    <h4 className="font-medium">Revenue Management</h4>
                    <p className="text-sm text-pink-200">Smart coupons and revenue optimization</p>
                  </div>
                </div>
              </button>
            </Link>
            
            {/* Automation Control */}
            <Link href="/automation">
              <button className="bg-teal-600 hover:bg-teal-700 text-white p-4 rounded-lg transition-colors text-left w-full">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <h4 className="font-medium">Automation Control</h4>
                    <p className="text-sm text-teal-200">Manage automated workflows and rules</p>
                  </div>
                </div>
              </button>
            </Link>
            
            {/* Channels Management */}
            <Link href="/dashboard/channels">
              <button className="bg-cyan-600 hover:bg-cyan-700 text-white p-4 rounded-lg transition-colors text-left w-full">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📺</span>
                  <div>
                    <h4 className="font-medium">Channels Management</h4>
                    <p className="text-sm text-cyan-200">Manage Telegram channels and settings</p>
                  </div>
                </div>
              </button>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {stats.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">
                    {activity.type === 'user_login' ? '👤' : 
                     activity.type === 'content_generated' ? '📝' : 
                     activity.type === 'revenue_generated' ? '💰' : 
                     activity.type === 'system_alert' ? '⚠️' : '📊'}
                  </span>
                  <div>
                    <p className="text-white font-medium">{activity.description || activity.message || 'System activity'}</p>
                    <p className="text-gray-400 text-sm">{new Date(activity.timestamp).toLocaleString()}</p>
                </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  activity.status === 'success' ? 'bg-green-100 text-green-800' : 
                  activity.status === 'warning' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  {(activity.status || 'info').toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 