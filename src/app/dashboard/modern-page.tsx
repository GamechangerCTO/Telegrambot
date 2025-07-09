/**
 * 🌟 REVOLUTIONARY DASHBOARD 2025 - Ultra Modern & User-Friendly
 * Based on latest 2025 UI/UX trends for maximum comfort and productivity
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ModernDashboardPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [personalizedView, setPersonalizedView] = useState('content_manager');
  const [quickStats, setQuickStats] = useState({
    todayRevenue: 2350,
    activeChannels: 8,
    contentGenerated: 23,
    engagement: 94
  });

  // AI-Powered Personalized Greeting
  const getPersonalizedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "🌅 בוקר טוב! בואו נתחיל את היום עם תוכן מנצח";
    if (hour < 17) return "☀️ יום טוב! המערכת עובדת בצורה מושלמת";
    return "🌙 ערב טוב! הסטטיסטיקות של היום נראות מעולה";
  };

  return (
    <div className={`min-h-screen transition-all duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'}`}>
      
      {/* 🎨 Smart Header with Personalization */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            
            {/* Logo & Brand */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                TB
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Telegram Bot Manager
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">מערכת ניהול מתקדמת</p>
              </div>
            </div>

            {/* Smart Controls */}
            <div className="flex items-center space-x-4">
              
              {/* User Role Selector */}
              <select 
                value={personalizedView} 
                onChange={(e) => setPersonalizedView(e.target.value)}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="content_manager">מנהל תוכן</option>
                <option value="business_owner">בעל עסק</option>
                <option value="marketer">משווק</option>
                <option value="analyst">אנליסט</option>
              </select>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
              >
                {darkMode ? '☀️' : '🌙'}
          </button>

              {/* Notifications */}
              <div className="relative">
                <button className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200">
                  🔔
          </button>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* 🎯 AI-Powered Personalized Welcome */}
        <section className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-2">{getPersonalizedGreeting()}</h2>
            <p className="text-blue-100 mb-6">המערכת זיהתה 3 הזדמנויות חדשות להגדלת ההכנסות</p>
            
            {/* Quick AI Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                <div className="text-2xl font-bold">↗️ +15%</div>
                <div className="text-sm">אחוז הצלחת קופונים</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                <div className="text-2xl font-bold">🎯 92%</div>
                <div className="text-sm">דיוק תחזיות AI</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                <div className="text-2xl font-bold">⚡ 0.8s</div>
                <div className="text-sm">זמן תגובת מערכת</div>
              </div>
            </div>
          </div>
        </section>

        {/* 📊 Smart Stats with Real-time Updates */}
        <section>
          <h3 className="text-2xl font-bold mb-6 flex items-center">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white mr-3">📈</span>
            סטטיסטיקות חכמות
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Revenue Card */}
            <div className="group hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center text-white text-xl">
                    💰
                  </div>
                  <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-600 font-medium">
                    +12% היום
                  </span>
                </div>
                <h4 className="text-gray-600 dark:text-gray-300 text-sm font-medium">הכנסות היום</h4>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">₪{quickStats.todayRevenue.toLocaleString()}</p>
                <div className="mt-3 flex items-center text-sm text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></span>
                  עדכון חי
                </div>
              </div>
            </div>

            {/* Active Channels */}
            <div className="group hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xl">
                    📺
                  </div>
                  <span className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-600 font-medium">
                    כולם פעילים
                  </span>
                </div>
                <h4 className="text-gray-600 dark:text-gray-300 text-sm font-medium">ערוצים פעילים</h4>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{quickStats.activeChannels}</p>
                <div className="mt-3 flex items-center text-sm text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-blue-400 mr-2 animate-pulse"></span>
                  פעילים עכשיו
                </div>
              </div>
            </div>

            {/* Content Generated */}
            <div className="group hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center text-white text-xl">
                    ✨
                  </div>
                  <span className="text-sm px-3 py-1 rounded-full bg-purple-100 text-purple-600 font-medium">
                    AI יצר
                  </span>
                </div>
                <h4 className="text-gray-600 dark:text-gray-300 text-sm font-medium">תוכן נוצר היום</h4>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{quickStats.contentGenerated}</p>
                <div className="mt-3 flex items-center text-sm text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-purple-400 mr-2 animate-pulse"></span>
                  באיכות גבוהה
                </div>
              </div>
            </div>

            {/* Engagement */}
            <div className="group hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center text-white text-xl">
                    🔥
                  </div>
                  <span className="text-sm px-3 py-1 rounded-full bg-orange-100 text-orange-600 font-medium">
                    מעולה
                  </span>
                </div>
                <h4 className="text-gray-600 dark:text-gray-300 text-sm font-medium">אחוז מעורבות</h4>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{quickStats.engagement}%</p>
                <div className="mt-3 flex items-center text-sm text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-orange-400 mr-2 animate-pulse"></span>
                  גבוה מהממוצע
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 🚀 One-Click Action Center */}
        <section>
          <h3 className="text-2xl font-bold mb-6 flex items-center">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center text-white mr-3">⚡</span>
            פעולות מהירות
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Quick Content Creation */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white text-2xl mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  🎯
                </div>
                <h4 className="text-lg font-bold mb-2">יצירת תוכן מיידי</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">AI יצור טיפים, חדשות וניתוחים תוך שניות</p>
                <button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl py-3 font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                  צור עכשיו ✨
                </button>
              </div>
            </div>

            {/* Smart Coupons */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center text-white text-2xl mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  🎟️
                </div>
                <h4 className="text-lg font-bold mb-2">קופונים חכמים</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">שליחה אוטומטית של קופונים מותאמים אישית</p>
                <Link href="/dashboard/coupons" className="block w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl py-3 font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl text-center">
                  נהל קופונים 🚀
                </Link>
              </div>
            </div>

            {/* Analytics & Insights */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 group">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center text-white text-2xl mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  📊
                </div>
                <h4 className="text-lg font-bold mb-2">תובנות חכמות</h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">ניתוח מתקדם של ביצועים והמלצות AI</p>
                <button className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl py-3 font-medium hover:from-purple-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                  צפה בתובנות 🧠
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 🎨 Smart Navigation Menu */}
        <section>
          <h3 className="text-2xl font-bold mb-6 flex items-center">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-400 to-purple-500 flex items-center justify-center text-white mr-3">🧭</span>
            ניווט חכם
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            
            {[
              { icon: '🤖', title: 'בוטים', href: '/dashboard/bots', color: 'from-blue-400 to-blue-600' },
              { icon: '📺', title: 'ערוצים', href: '/dashboard/channels', color: 'from-green-400 to-green-600' },
              { icon: '📝', title: 'תוכן', href: '/dashboard/content', color: 'from-purple-400 to-purple-600' },
              { icon: '🎟️', title: 'קופונים', href: '/dashboard/coupons', color: 'from-orange-400 to-orange-600' },
              { icon: '⚙️', title: 'הגדרות', href: '/dashboard/settings', color: 'from-gray-400 to-gray-600' },
              { icon: '📊', title: 'דוחות', href: '/dashboard/content/analytics', color: 'from-pink-400 to-pink-600' }
            ].map((item, index) => (
              <Link 
                key={index}
                href={item.href}
                className="group block"
              >
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 text-center group-hover:scale-105">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${item.color} flex items-center justify-center text-white text-xl mx-auto mb-3 group-hover:scale-110 transition-transform duration-300`}>
                    {item.icon}
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{item.title}</h4>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 🎯 AI-Powered Recommendations */}
        <section className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 rounded-3xl p-8">
          <h3 className="text-2xl font-bold mb-6 flex items-center">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-400 to-purple-500 flex items-center justify-center text-white mr-3">🧠</span>
            המלצות AI היום
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white dark:bg-gray-700 rounded-2xl p-6 border border-indigo-100 dark:border-gray-600">
              <div className="text-3xl mb-3">🎯</div>
              <h4 className="font-bold mb-2 text-indigo-600 dark:text-indigo-400">המלצה לתוכן</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">AI ממליץ ליצור טיפים לליגת האלופות - היסטורית 23% יותר אנגייגמנט</p>
              <button className="mt-4 text-indigo-600 dark:text-indigo-400 font-medium text-sm hover:underline">
                צור עכשיו →
              </button>
            </div>
            
            <div className="bg-white dark:bg-gray-700 rounded-2xl p-6 border border-green-100 dark:border-gray-600">
              <div className="text-3xl mb-3">💰</div>
              <h4 className="font-bold mb-2 text-green-600 dark:text-green-400">הזדמנות קופון</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">זמן אידיאלי לשלוח קופונים - 87% יותר לחיצות בשעות הערב</p>
              <button className="mt-4 text-green-600 dark:text-green-400 font-medium text-sm hover:underline">
                שלח עכשיו →
              </button>
            </div>
            
            <div className="bg-white dark:bg-gray-700 rounded-2xl p-6 border border-purple-100 dark:border-gray-600">
              <div className="text-3xl mb-3">📈</div>
              <h4 className="font-bold mb-2 text-purple-600 dark:text-purple-400">אופטימיזציה</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">שנה את זמן השליחה בערוץ "ספורט ישראל" ל-19:30 לתוצאות טובות יותר</p>
              <button className="mt-4 text-purple-600 dark:text-purple-400 font-medium text-sm hover:underline">
                החל שינוי →
              </button>
            </div>
          </div>
        </section>

        {/* 🔄 Real-time Activity Feed */}
        <section>
          <h3 className="text-2xl font-bold mb-6 flex items-center">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white mr-3">⚡</span>
            פעילות בזמן אמת
          </h3>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
              <div className="space-y-4">
              
              {[
                { icon: '🎯', text: 'AI יצר 5 טיפים חדשים לפרמייר ליג', time: 'לפני 2 דקות', color: 'text-blue-500' },
                { icon: '💰', text: 'קופון "GOAL20" נשלח ל-8 ערוצים', time: 'לפני 5 דקות', color: 'text-green-500' },
                { icon: '📰', text: 'חדשות ספורט עודכנו עם 12 כתבות חדשות', time: 'לפני 8 דקות', color: 'text-purple-500' },
                { icon: '📊', text: 'דוח ביצועים שבועי נוצר', time: 'לפני 15 דקות', color: 'text-orange-500' },
                { icon: '🔔', text: '23 משתמשים חדשים הצטרפו הערוצים', time: 'לפני 20 דקות', color: 'text-pink-500' }
                ].map((activity, index) => (
                <div key={index} className="flex items-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                  <div className="text-2xl mr-4">{activity.icon}</div>
                    <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{activity.text}</p>
                    <p className={`text-sm ${activity.color}`}>{activity.time}</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  </div>
                ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}