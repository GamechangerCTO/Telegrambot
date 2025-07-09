/**
 * TELEGRAM BOT MANAGER 2025 - Landing Page
 * Revolutionary bot management platform with automated revenue systems
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const languages = {
  en: 'English',
  am: 'አማርኛ',
  sw: 'Kiswahili'
};

const translations = {
  en: {
    title: 'Revolution in Bot Management',
    subtitle: 'Advanced platform for managing Telegram bots with automated revenue, AI content and deep analytics',
    features: {
      bots: {
        title: 'Advanced Bot System',
        description: 'Smart management of hundreds of bots with advanced AI'
      },
      revenue: {
        title: 'Automated Revenue',
        description: 'Smart coupon system for passive income'
      },
      multilang: {
        title: 'Multi-language Support',
        description: 'Content adapted to every language and culture'
      },
      analytics: {
        title: 'Deep Analytics',
        description: 'Advanced business insights and performance tracking'
      }
    },
    cta: {
      start: 'Start Now',
      learn: 'Learn More'
    },
    roles: {
      super_admin: {
        title: 'System Administrator',
        subtitle: 'Full control over all organizations',
        description: 'Access to the most advanced management tools',
        features: ['Organization Management', 'User Control', 'System Analytics', 'Security & Monitoring'],
        button: 'Login as System Admin'
      },
      manager: {
        title: 'Organization Manager',
        subtitle: 'Manage bots and channels in organization',
        description: 'Advanced tools for efficient organizational management',
        features: ['Bot Management', 'Channel Management', 'Automation', 'Organization Reports'],
        button: 'Login as Manager'
      },
      bot_manager: {
        title: 'Bot Manager',
        subtitle: 'Content creation and daily management',
        description: 'The most user-friendly interface for content creators',
        features: ['Content Creation', 'Smart Coupons', 'Statistics', 'Optimization'],
        button: 'Login as Bot Manager'
      }
    },
    stats: {
      bots: 'Active Bots',
      messages: 'Messages/Month',
      orgs: 'Organizations',
      uptime: 'Uptime'
    },
    nav: {
      login: 'Login',
      features: 'Choose Perfect Interface',
      advanced: 'Advanced Features',
      final: 'Ready to Start?'
    },
    footer: {
      description: 'The most advanced platform for managing Telegram bots with automated revenue',
      product: 'Product',
      support: 'Support',
      company: 'Company',
      copyright: '2025 Telegram Bot Manager. All rights reserved.'
    }
  },
  am: {
    title: 'በቦት አስተዳደር ላይ ተሀድሶ',
    subtitle: 'ራስ-ተከን ገቢዎች፣ AI ይዘት እና ጥልቅ ትንታኔዎች ላይ ለዴሞክራሲያዊ ቦቶች አስተዳደር የማጠናከሪያ ምስጋና',
    features: {
      bots: {
        title: 'የማስተዋል ቦት ስርዓት',
        description: 'በመጠበቂያ AI ጋር የመቶዎች ቦቶች ብልህ አስተዳደር'
      },
      revenue: {
        title: 'ራስ-ተከን ገቢ',
        description: 'ለምፃም ገቢ የማስተናገጃ ኩፖን ስርዓት'
      },
      multilang: {
        title: 'ብዙ-ቋንቋ ድጋፍ',
        description: 'ለእያንዳንዱ ቋንቋ እና ባህል የተሰጠ ይዘት'
      },
      analytics: {
        title: 'ጥልቅ ትንታኔዎች',
        description: 'የመጠበቂያ ፖሊሲ ማስተዋወቂያዎች እና አፈጻጸም መከታተያ'
      }
    },
    cta: {
      start: 'አሁን ይጀምሩ',
      learn: 'ይበልጥ ለማወቅ'
    },
    roles: {
      super_admin: {
        title: 'ስርዓት ተቆጣጣሪ',
        subtitle: 'በሁሉም ድርጅቶች ላይ ሙሉ ተቆጣጣሪነት',
        description: 'በጣም የተራቀቀ የአስተዳደር ማሳሪያዎች መዳረሻ',
        features: ['ድርጅት አስተዳደር', 'ተጠቃሚ ቁጥጥር', 'ስርዓት ትንታኔ', 'ደህንነት እና ክትትል'],
        button: 'እንደ ስርዓት አስተዳዳሪ ግባ'
      },
      manager: {
        title: 'ድርጅት ቀይ',
        subtitle: 'በድርጅት ውስጥ ቦቶችን እና ቻናሎችን ማስተዳደር',
        description: 'ለውጤታማ ድርጅታዊ አስተዳደር የተራቀቀ ማሳሪያዎች',
        features: ['ቦት አስተዳደር', 'ቻናል አስተዳደር', 'ራስ-ስርዓተ-ስራ', 'ድርጅታዊ ሪፖርቶች'],
        button: 'እንደ ቀይ ግባ'
      },
      bot_manager: {
        title: 'ቦት ቀይ',
        subtitle: 'ይዘት ፈጠራ እና ዕለታዊ አስተዳደር',
        description: 'ለይዘት ፈጣሪዎች በጣም ተጠቃሚ ታዳጊ በይነገጽ',
        features: ['ይዘት ፈጠራ', 'ብልህ ኩፖኖች', 'ስታቲስቲክስ', 'በማሻሻል'],
        button: 'እንደ ቦት ቀይ ግባ'
      }
    },
    stats: {
      bots: 'ንቁ ቦቶች',
      messages: 'መልዕክቶች/ወር',
      orgs: 'ድርጅቶች',
      uptime: 'የሰዓት ሁኔታ'
    },
    nav: {
      login: 'ግባ',
      features: 'ፍጹም በይነገጽ ይምረጡ',
      advanced: 'የተራቀቀ ባህርያት',
      final: 'ለመጀመር ዝግጁ ነህ?'
    },
    footer: {
      description: 'ቦንቦሮችን ተወላጅ ሀብትሰላይ ቦት አስተዳደር ሊኮንፎም',
      product: 'ምርት',
      support: 'ድጋፍ',
      company: 'ኩባንያ',
      copyright: '2025 ዴሞክራሲያዊ ቦት አስተዳዳሪ። ሁሉም መብቶች የተጠበቁ ናቸው።'
    }
  },
  sw: {
    title: 'Mapinduzi katika Usimamizi wa Bot',
    subtitle: 'Jukwaa la hali ya juu la kusimamia boti za Telegram na mapato otomatiki, maudhui ya AI na uchambuzi wa kina',
    features: {
      bots: {
        title: 'Mfumo wa Bot wa Hali ya Juu',
        description: 'Usimamizi wa akili wa mamia ya boti na AI ya hali ya juu'
      },
      revenue: {
        title: 'Mapato Otomatiki',
        description: 'Mfumo wa kuponi wa akili kwa mapato ya mazao'
      },
      multilang: {
        title: 'Msaada wa Lugha Nyingi',
        description: 'Maudhui yaliyorekebisha kwa kila lugha na utamaduni'
      },
      analytics: {
        title: 'Uchambuzi wa Kina',
        description: 'Maarifa ya biashara ya hali ya juu na ufuatiliaji wa utendaji'
      }
    },
    cta: {
      start: 'Anza Sasa',
      learn: 'Jifunze Zaidi'
    },
    roles: {
      super_admin: {
        title: 'Msimamizi wa Mfumo',
        subtitle: 'Udhibiti mkuu juu ya shirika zote',
        description: 'Ufikiaji wa vifaa vya usimamizi vya hali ya juu zaidi',
        features: ['Usimamizi wa Shirika', 'Udhibiti wa Watumiaji', 'Uchambuzi wa Mfumo', 'Usalama na Ufuatiliaji'],
        button: 'Ingia kama Msimamizi wa Mfumo'
      },
      manager: {
        title: 'Meneja wa Shirika',
        subtitle: 'Simamia boti na vituo katika shirika',
        description: 'Vifaa vya hali ya juu kwa usimamizi wa ufanisi wa kishirika',
        features: ['Usimamizi wa Bot', 'Usimamizi wa Kituo', 'Otomatiki', 'Ripoti za Kishirika'],
        button: 'Ingia kama Meneja'
      },
      bot_manager: {
        title: 'Meneja wa Bot',
        subtitle: 'Uundaji wa maudhui na usimamizi wa kila siku',
        description: 'Kiolesura cha utumiaji rahisi zaidi kwa waundaji wa maudhui',
        features: ['Uundaji wa Maudhui', 'Kuponi za Akili', 'Takwimu', 'Uboreshaji'],
        button: 'Ingia kama Meneja wa Bot'
      }
    },
    stats: {
      bots: 'Boti Zinazofanya Kazi',
      messages: 'Ujumbe/Mwezi',
      orgs: 'Mashirika',
      uptime: 'Muda wa Kufanya Kazi'
    },
    nav: {
      login: 'Ingia',
      features: 'Chagua Kiolesura Kamili',
      advanced: 'Vipengele vya Hali ya Juu',
      final: 'Uko Tayari Kuanza?'
    },
    footer: {
      description: 'Jukwaa la hali ya juu zaidi la kusimamia boti za Telegram na mapato otomatiki',
      product: 'Bidhaa',
      support: 'Msaada',
      company: 'Kampuni',
      copyright: '2025 Msimamizi wa Bot wa Telegram. Haki zote zimehifadhiwa.'
    }
  }
};

export default function HomePage() {
  const { isAuthenticated, isSuperAdmin } = useAuth();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  const [currentLang, setCurrentLang] = useState('en');

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirectPath = isSuperAdmin ? '/super-admin' : '/dashboard';
      router.push(redirectPath);
    }
  }, [isAuthenticated, isSuperAdmin, router]);

  // Auto-rotate features showcase
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const t = translations[currentLang as keyof typeof translations];

  const features = [
    {
      title: t.features.bots.title,
      description: t.features.bots.description,
      color: 'from-blue-400 to-indigo-500'
    },
    {
      title: t.features.revenue.title,
      description: t.features.revenue.description,
      color: 'from-green-400 to-emerald-500'
    },
    {
      title: t.features.multilang.title,
      description: t.features.multilang.description,
      color: 'from-purple-400 to-pink-500'
    },
    {
      title: t.features.analytics.title,
      description: t.features.analytics.description,
      color: 'from-orange-400 to-red-500'
    }
  ];

  const roleConfigs = [
    {
      role: 'super_admin',
      title: t.roles.super_admin.title,
      subtitle: t.roles.super_admin.subtitle,
      color: 'from-red-500 to-pink-600',
      bgColor: 'from-red-50 to-pink-50',
      features: t.roles.super_admin.features,
      description: t.roles.super_admin.description,
      button: t.roles.super_admin.button
    },
    {
      role: 'manager',
      title: t.roles.manager.title,
      subtitle: t.roles.manager.subtitle,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'from-blue-50 to-indigo-50',
      features: t.roles.manager.features,
      description: t.roles.manager.description,
      button: t.roles.manager.button
    },
    {
      role: 'bot_manager',
      title: t.roles.bot_manager.title,
      subtitle: t.roles.bot_manager.subtitle,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'from-green-50 to-emerald-50',
      features: t.roles.bot_manager.features,
      description: t.roles.bot_manager.description,
      button: t.roles.bot_manager.button
    }
  ];

  const stats = [
    { number: '500+', label: t.stats.bots },
    { number: '2M+', label: t.stats.messages },
    { number: '150+', label: t.stats.orgs },
    { number: '99.9%', label: t.stats.uptime }
  ];

  return (
    <div className={`min-h-screen transition-all duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'}`}>
      
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
              TB
              </div>
              <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Telegram Bot Manager
                </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Advanced Bot Management System</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <select 
              value={currentLang} 
              onChange={(e) => setCurrentLang(e.target.value)}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(languages).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
            
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
              <Link
                href="/auth/login"
              className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 font-medium"
            >
              {t.nav.login}
              </Link>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 space-y-20">

      {/* Hero Section */}
        <section className="text-center space-y-8">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
              {t.title}
          </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              {t.subtitle}
            </p>
          </div>

          {/* Feature Showcase */}
          <div className="relative">
            <div className={`bg-gradient-to-r ${features[currentFeature].color} rounded-3xl p-8 text-white shadow-2xl transform transition-all duration-1000`}>
              <h3 className="text-2xl font-bold mb-2">{features[currentFeature].title}</h3>
              <p className="text-lg text-white/90">{features[currentFeature].description}</p>
            </div>
            
            {/* Feature Dots */}
            <div className="flex justify-center space-x-2 mt-6">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentFeature(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentFeature ? 'bg-blue-500 scale-125' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/auth/login"
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold text-lg hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {t.cta.start}
            </Link>
            <Link
              href="#features"
              className="px-8 py-4 border-2 border-blue-500 text-blue-500 dark:text-blue-400 rounded-2xl font-bold text-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
            >
              {t.cta.learn}
            </Link>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
          <h2 className="text-3xl font-bold text-center mb-8">Platform Stats</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
                  {stat.number}
                </div>
                <div className="text-gray-600 dark:text-gray-300 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Role Selection Section */}
        <section id="features" className="space-y-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4">{t.nav.features}</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">Each role gets a customized interface with dedicated tools</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {roleConfigs.map((config, index) => (
              <div key={index} className={`bg-gradient-to-br ${config.bgColor} dark:from-gray-800 dark:to-gray-700 rounded-3xl p-8 border border-white/20 hover:shadow-2xl transition-all duration-300 group`}>
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2">{config.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{config.subtitle}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{config.description}</p>
                  
                  {/* Features List */}
                  <div className="space-y-2 mb-8">
                    {config.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center justify-center space-x-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                      </div>
                    ))}
                </div>
                  
                  <Link 
                    href={`/auth/login?role=${config.role}`}
                    className={`block w-full py-3 rounded-2xl font-bold text-white bg-gradient-to-r ${config.color} hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl`}
                  >
                    {config.button}
                  </Link>
                </div>
              </div>
            ))}
        </div>
      </section>

        {/* Advanced Features */}
        <section className="bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 rounded-3xl p-12 text-white">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">{t.nav.advanced}</h2>
            <p className="text-xl text-white/80">Latest technology in the market</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Advanced AI',
                description: 'Quality and adaptive content with GPT-4 and DALL-E',
                color: 'bg-blue-500/20'
              },
              {
                title: 'Automated Revenue',
                description: 'Smart coupon system with real-time optimization',
                color: 'bg-green-500/20'
              },
              {
                title: 'Multi-language Support',
                description: 'Native content in 50+ languages with cultural adaptation',
                color: 'bg-purple-500/20'
              },
              {
                title: 'Real-time Analytics',
                description: 'Advanced performance tracking with business insights',
                color: 'bg-orange-500/20'
              },
              {
                title: 'Fast Performance',
                description: 'Quality content in less than 20 seconds',
                color: 'bg-yellow-500/20'
              },
              {
                title: 'Advanced Security',
                description: 'Advanced encryption and multi-level access control',
                color: 'bg-red-500/20'
              }
            ].map((feature, index) => (
              <div key={index} className={`${feature.color} backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300`}>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-white/80">{feature.description}</p>
          </div>
            ))}
        </div>
      </section>

        {/* Final CTA */}
        <section className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-12 shadow-2xl">
          <h2 className="text-4xl font-bold mb-4">{t.nav.final}</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Join thousands of organizations already managing their bots with us
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/auth/login"
              className="px-10 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold text-xl hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Start Free Now
            </Link>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              No credit card • Instant setup • 24/7 support
            </div>
          </div>
        </section>
        </div>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
              TB
                </div>
            <span className="text-xl font-bold">Telegram Bot Manager</span>
              </div>
          
          <p className="text-gray-400 mb-6">
            {t.footer.description}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-3">{t.footer.product}</h4>
              <div className="space-y-2 text-gray-400">
                <p>Bot Management</p>
                <p>Automated Revenue</p>
                <p>Analytics</p>
                <p>Multi-language Support</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-3">{t.footer.support}</h4>
              <div className="space-y-2 text-gray-400">
                <p>Help Center</p>
                <p>Technical Documentation</p>
                <p>User Community</p>
                <p>Contact Us</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-3">{t.footer.company}</h4>
              <div className="space-y-2 text-gray-400">
                <p>About Us</p>
                <p>Blog</p>
                <p>Careers</p>
                <p>Privacy</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-6">
            <p className="text-gray-400">
              {t.footer.copyright}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}