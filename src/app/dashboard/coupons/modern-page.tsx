/**
 * 🎟️ REVOLUTIONARY COUPONS MANAGER 2025 - Ultra User-Friendly
 * Based on latest 2025 UI/UX trends for maximum productivity and comfort
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ModernCouponsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // cards | table | kanban
  const [filterActive, setFilterActive] = useState('all'); // all | active | inactive
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Mock data - replace with real data
  const [coupons, setCoupons] = useState([
    {
      id: '1',
      title: 'קופון כדורגל חם',
      description: 'הנחה מיוחדת לחברי הערוץ על טיפי פרמייר ליג',
      code: 'GOAL20',
      discount: 20,
      type: 'percentage',
      status: 'active',
      uses: 156,
      maxUses: 500,
      revenue: 3240,
      expiresAt: '2025-01-15',
      performance: 87,
      category: 'football'
    },
    {
      id: '2',
      title: 'בונוס מכה ניצחון',
      description: 'קופון בונוס למי שתומך בטיפים המנצחים',
      code: 'WINNER50',
      discount: 50,
      type: 'amount',
      status: 'active',
      uses: 89,
      maxUses: 200,
      revenue: 4450,
      expiresAt: '2025-01-20',
      performance: 92,
      category: 'bonus'
    },
    {
      id: '3',
      title: 'חדש בערוץ',
      description: 'הנחה לחברים חדשים בערוץ הספורט',
      code: 'NEWBIE15',
      discount: 15,
      type: 'percentage',
      status: 'inactive',
      uses: 34,
      maxUses: 100,
      revenue: 510,
      expiresAt: '2025-01-10',
      performance: 64,
      category: 'welcome'
    }
  ]);

  const [stats, setStats] = useState({
    totalRevenue: 8200,
    activeCoupons: 12,
    totalUses: 279,
    conversionRate: 23.5
  });

  // Filter coupons based on active filter and search
  const filteredCoupons = coupons.filter(coupon => {
    const matchesFilter = filterActive === 'all' || coupon.status === filterActive;
    const matchesSearch = coupon.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coupon.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { bg: 'bg-green-100', text: 'text-green-700', label: 'פעיל' },
      inactive: { bg: 'bg-red-100', text: 'text-red-700', label: 'לא פעיל' },
      expired: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'פג תוקף' }
    };
    const config = statusConfig[status] || statusConfig.inactive;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      football: '⚽',
      bonus: '🎁',
      welcome: '👋',
      special: '✨'
    };
    return icons[category] || '🎟️';
  };

  return (
    <div className={`min-h-screen transition-all duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-green-50 via-white to-blue-50'}`}>
      
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            
            {/* Title & Breadcrumbs */}
            <div>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                <Link href="/dashboard" className="hover:text-blue-600 transition-colors">דשבורד</Link>
                <span>→</span>
                <span>ניהול קופונים</span>
              </div>
              <h1 className="text-2xl font-bold flex items-center">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white mr-3">🎟️</span>
                ניהול קופונים חכם
              </h1>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
              
              <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:from-green-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <span>➕</span>
                <span>קופון חדש</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* Smart Analytics Cards */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center text-white text-xl">
                  💰
                </div>
                <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-600 font-medium">
                  +24% השבוע
                </span>
              </div>
              <h4 className="text-gray-600 dark:text-gray-300 text-sm font-medium">סך הכנסות מקופונים</h4>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">₪{stats.totalRevenue.toLocaleString()}</p>
              <div className="mt-3 flex items-center text-sm text-gray-500">
                <span className="w-2 h-2 rounded-full bg-green-400 mr-2"></span>
                תוצאות מעולות
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xl">
                  🎟️
                </div>
                <span className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-600 font-medium">
                  פעילים
                </span>
              </div>
              <h4 className="text-gray-600 dark:text-gray-300 text-sm font-medium">קופונים פעילים</h4>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.activeCoupons}</p>
              <div className="mt-3 flex items-center text-sm text-gray-500">
                <span className="w-2 h-2 rounded-full bg-blue-400 mr-2"></span>
                כולם יעילים
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center text-white text-xl">
                  📊
                </div>
                <span className="text-sm px-3 py-1 rounded-full bg-purple-100 text-purple-600 font-medium">
                  השבוע
                </span>
              </div>
              <h4 className="text-gray-600 dark:text-gray-300 text-sm font-medium">סך שימושים</h4>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalUses}</p>
              <div className="mt-3 flex items-center text-sm text-gray-500">
                <span className="w-2 h-2 rounded-full bg-purple-400 mr-2"></span>
                ביקושים גבוהים
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center text-white text-xl">
                  🔥
                </div>
                <span className="text-sm px-3 py-1 rounded-full bg-orange-100 text-orange-600 font-medium">
                  מעולה
                </span>
              </div>
              <h4 className="text-gray-600 dark:text-gray-300 text-sm font-medium">אחוז המרה</h4>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.conversionRate}%</p>
              <div className="mt-3 flex items-center text-sm text-gray-500">
                <span className="w-2 h-2 rounded-full bg-orange-400 mr-2"></span>
                גבוה מהממוצע
              </div>
            </div>
          </div>
        </section>

        {/* Smart Filters & Search */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="חפש קופונים..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-3">
              
              {/* Status Filter */}
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                {[
                  { key: 'all', label: 'הכל' },
                  { key: 'active', label: 'פעילים' },
                  { key: 'inactive', label: 'לא פעילים' }
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => setFilterActive(filter.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      filterActive === filter.key
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* View Mode */}
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                {[
                  { key: 'cards', icon: '🎯' },
                  { key: 'table', icon: '📊' },
                  { key: 'kanban', icon: '📋' }
                ].map((mode) => (
                  <button
                    key={mode.key}
                    onClick={() => setViewMode(mode.key)}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      viewMode === mode.key
                        ? 'bg-white dark:bg-gray-600 shadow-sm'
                        : 'hover:bg-white/50 dark:hover:bg-gray-600/50'
                    }`}
                  >
                    {mode.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Coupons Display */}
        <section>
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCoupons.map((coupon) => (
                <div key={coupon.id} className="group bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white text-lg">
                        {getCategoryIcon(coupon.category)}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">{coupon.title}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{coupon.code}</p>
                      </div>
                    </div>
                    {getStatusBadge(coupon.status)}
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">{coupon.description}</p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {coupon.type === 'percentage' ? `${coupon.discount}%` : `₪${coupon.discount}`}
                      </div>
                      <div className="text-xs text-gray-500">הנחה</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{coupon.uses}</div>
                      <div className="text-xs text-gray-500">שימושים</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
                      <span>ביצועים</span>
                      <span>{coupon.performance}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${coupon.performance}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Revenue */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600 dark:text-gray-300">הכנסות</span>
                    <span className="text-lg font-bold text-green-600">₪{coupon.revenue.toLocaleString()}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 text-sm">
                      ערוך
                    </button>
                    <button className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 text-sm">
                      שלח עכשיו
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'table' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-700 dark:text-gray-300">קופון</th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-700 dark:text-gray-300">סטטוס</th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-700 dark:text-gray-300">שימושים</th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-700 dark:text-gray-300">הכנסות</th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-700 dark:text-gray-300">ביצועים</th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-700 dark:text-gray-300">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredCoupons.map((coupon) => (
                      <tr key={coupon.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white text-sm">
                              {getCategoryIcon(coupon.category)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">{coupon.title}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{coupon.code}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(coupon.status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-900 dark:text-white">{coupon.uses} / {coupon.maxUses}</div>
                          <div className="text-sm text-gray-500">{Math.round((coupon.uses / coupon.maxUses) * 100)}% נוצל</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-green-600 font-semibold">₪{coupon.revenue.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full"
                                style={{ width: `${coupon.performance}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-300">{coupon.performance}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">ערוך</button>
                            <button className="text-green-600 hover:text-green-700 text-sm font-medium">שלח</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {viewMode === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['active', 'inactive', 'expired'].map((status) => (
                <div key={status} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                      <span>{status === 'active' ? '🟢' : status === 'inactive' ? '🔴' : '⚫'}</span>
                      <span>{status === 'active' ? 'פעילים' : status === 'inactive' ? 'לא פעילים' : 'פג תוקף'}</span>
                      <span className="text-sm text-gray-500">({filteredCoupons.filter(c => c.status === status).length})</span>
                    </h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {filteredCoupons.filter(c => c.status === status).map((coupon) => (
                      <div key={coupon.id} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-100 dark:border-gray-600">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">{coupon.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{coupon.code}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">שימושים: {coupon.uses}</span>
                          <span className="text-green-600 font-medium">₪{coupon.revenue}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* AI Insights */}
        <section className="bg-gradient-to-r from-purple-50 via-blue-50 to-green-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 rounded-3xl p-8">
          <h3 className="text-2xl font-bold mb-6 flex items-center">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-400 to-blue-500 flex items-center justify-center text-white mr-3">🧠</span>
            תובנות AI לקופונים
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white dark:bg-gray-700 rounded-2xl p-6 border border-purple-100 dark:border-gray-600">
              <div className="text-3xl mb-3">📈</div>
              <h4 className="font-bold mb-2 text-purple-600 dark:text-purple-400">המלצת אופטימיזציה</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">שנה את זמן שליחת "GOAL20" ל-20:30 - צפוי עלייה של 18% בלחיצות</p>
              <button className="mt-4 text-purple-600 dark:text-purple-400 font-medium text-sm hover:underline">
                החל שינוי →
              </button>
            </div>
            
            <div className="bg-white dark:bg-gray-700 rounded-2xl p-6 border border-green-100 dark:border-gray-600">
              <div className="text-3xl mb-3">🎯</div>
              <h4 className="font-bold mb-2 text-green-600 dark:text-green-400">הזדמנות חדשה</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">צור קופון לליגת האלופות - AI מזהה ביקוש גבוה של 34% השבוע</p>
              <button className="mt-4 text-green-600 dark:text-green-400 font-medium text-sm hover:underline">
                צור עכשיו →
              </button>
            </div>
            
            <div className="bg-white dark:bg-gray-700 rounded-2xl p-6 border border-blue-100 dark:border-gray-600">
              <div className="text-3xl mb-3">💡</div>
              <h4 className="font-bold mb-2 text-blue-600 dark:text-blue-400">שיפור תוצאות</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">הוסף מגבלת זמן של 24 שעות לקופון "WINNER50" לעידוד מהיר יותר</p>
              <button className="mt-4 text-blue-600 dark:text-blue-400 font-medium text-sm hover:underline">
                יישם הצעה →
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Create Modal (Simple placeholder) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center text-white mr-3">✨</span>
              צור קופון חדש
            </h3>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="שם הקופון"
                className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="קוד הקופון (לדוגמה: GOAL20)"
                className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="אחוז הנחה"
                className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex space-x-4 mt-8">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
              >
                ביטול
              </button>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 rounded-xl font-medium hover:from-green-600 hover:to-blue-700 transition-all duration-200"
              >
                צור קופון ✨
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 