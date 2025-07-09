/**
 * TELEGRAM BOT MANAGER 2025 - Coupons Management
 * Revolutionary automated revenue management system
 */

'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
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
    title: 'Smart Coupons Management',
    subtitle: 'Automated revenue system with intelligent optimization',
    stats: {
      total: 'Total Coupons',
      active: 'Active Coupons',
      revenue: 'Monthly Revenue',
      performance: 'Performance'
    },
    actions: {
      create: 'Create New Coupon',
      test: 'Test Coupon',
      refresh: 'Refresh Data',
      export: 'Export Data'
    },
    filters: {
      all: 'All Coupons',
      active: 'Active',
      inactive: 'Inactive',
      expired: 'Expired'
    },
    table: {
      id: 'ID',
      title: 'Title',
      code: 'Code',
      discount: 'Discount',
      status: 'Status',
      clicks: 'Clicks',
      conversions: 'Conversions',
      ctr: 'CTR',
      revenue: 'Revenue',
      actions: 'Actions'
    },
    form: {
      title: 'Title',
      titlePlaceholder: 'Enter coupon title',
      code: 'Coupon Code',
      codePlaceholder: 'Enter coupon code',
      discount: 'Discount Percentage',
      discountPlaceholder: 'Enter discount percentage',
      description: 'Description',
      descriptionPlaceholder: 'Enter coupon description',
      url: 'Coupon URL',
      urlPlaceholder: 'Enter coupon URL',
      create: 'Create Coupon',
      update: 'Update Coupon',
      cancel: 'Cancel'
    },
    status: {
      active: 'Active',
      inactive: 'Inactive',
      expired: 'Expired'
    },
    actions_menu: {
      edit: 'Edit',
      delete: 'Delete',
      toggle: 'Toggle Status',
      test: 'Test Send'
    },
    messages: {
      created: 'Coupon created successfully!',
      updated: 'Coupon updated successfully!',
      deleted: 'Coupon deleted successfully!',
      toggled: 'Coupon status updated successfully!',
      testSent: 'Test coupon sent successfully!',
      error: 'An error occurred. Please try again.'
    },
    confirmDelete: 'Are you sure you want to delete this coupon?',
    nav: {
      dashboard: 'Dashboard',
      coupons: 'Coupons',
      analytics: 'Analytics'
    }
  },
  am: {
    title: 'ብልህ ኩፖኖች አስተዳደር',
    subtitle: 'ራስ-ተሰላ ገቢ ስርዓት ከብልህ ማሻሻያ ጋር',
    stats: {
      total: 'ጠቅላላ ኩፖኖች',
      active: 'ንቁ ኩፖኖች',
      revenue: 'ወራዊ ገቢ',
      performance: 'አፈጻጸም'
    },
    actions: {
      create: 'አዲስ ኩፖን ፍጠር',
      test: 'ኩፖን ሞክር',
      refresh: 'መረጃ እዘምን',
      export: 'መረጃ ወጣ'
    },
    filters: {
      all: 'ሁሉም ኩፖኖች',
      active: 'ንቁ',
      inactive: 'ንቁ ያልሆነ',
      expired: 'ጊዜው ያለፈ'
    },
    table: {
      id: 'መለያ',
      title: 'ርዕስ',
      code: 'ኮድ',
      discount: 'ቅናሽ',
      status: 'ሁኔታ',
      clicks: 'ጠቅታዎች',
      conversions: 'ልወጣዎች',
      ctr: 'CTR',
      revenue: 'ገቢ',
      actions: 'ድርጊቶች'
    },
    form: {
      title: 'ርዕስ',
      titlePlaceholder: 'የኩፖን ርዕስ ያስገቡ',
      code: 'የኩፖን ኮድ',
      codePlaceholder: 'የኩፖን ኮድ ያስገቡ',
      discount: 'የቅናሽ መጠን',
      discountPlaceholder: 'የቅናሽ መጠን ያስገቡ',
      description: 'መግለጫ',
      descriptionPlaceholder: 'የኩፖን መግለጫ ያስገቡ',
      url: 'የኩፖን URL',
      urlPlaceholder: 'የኩፖን URL ያስገቡ',
      create: 'ኩፖን ፍጠር',
      update: 'ኩፖን አዘምን',
      cancel: 'ተወው'
    },
    status: {
      active: 'ንቁ',
      inactive: 'ንቁ ያልሆነ',
      expired: 'ጊዜው ያለፈ'
    },
    actions_menu: {
      edit: 'አርም',
      delete: 'ሰርዝ',
      toggle: 'ሁኔታ ቀይር',
      test: 'ሞክሮ ላክ'
    },
    messages: {
      created: 'ኩፖን በተሳካ ሁኔታ ተፈጠረ!',
      updated: 'ኩፖን በተሳካ ሁኔታ ተዘምኗል!',
      deleted: 'ኩፖን በተሳካ ሁኔታ ተሰርዟል!',
      toggled: 'የኩፖን ሁኔታ በተሳካ ሁኔታ ተዘምኗል!',
      testSent: 'ሙከራ ኩፖን በተሳካ ሁኔታ ተልኳል!',
      error: 'ስህተት ተከሰተ። እንደገና ይሞክሩ።'
    },
    confirmDelete: 'ይህን ኩፖን መሰረዝ እንደሚፈልጉ እርግጠኛ ነዎት?',
    nav: {
      dashboard: 'ዳሽቦርድ',
      coupons: 'ኩፖኖች',
      analytics: 'Uchambuzi'
    }
  },
  sw: {
    title: 'Usimamizi wa Kuponi za Akili',
    subtitle: 'Mfumo wa mapato otomatiki na uboreshaji wa akili',
    stats: {
      total: 'Jumla ya Kuponi',
      active: 'Kuponi Zinazofanya Kazi',
      revenue: 'Mapato ya Kila Mwezi',
      performance: 'Utendaji'
    },
    actions: {
      create: 'Unda Kuponi Mpya',
      test: 'Jaribu Kuponi',
      refresh: 'Onyesha Data',
      export: 'Hamisha Data'
    },
    filters: {
      all: 'Kuponi Zote',
      active: 'Zinazofanya Kazi',
      inactive: 'Hazifanyi Kazi',
      expired: 'Zimeisha'
    },
    table: {
      id: 'Kitambulisho',
      title: 'Kichwa',
      code: 'Nambari',
      discount: 'Punguzo',
      status: 'Hali',
      clicks: 'Mibofyo',
      conversions: 'Mabadiliko',
      ctr: 'CTR',
      revenue: 'Mapato',
      actions: 'Vitendo'
    },
    form: {
      title: 'Kichwa',
      titlePlaceholder: 'Ingiza kichwa cha kuponi',
      code: 'Nambari ya Kuponi',
      codePlaceholder: 'Ingiza nambari ya kuponi',
      discount: 'Asilimia ya Punguzo',
      discountPlaceholder: 'Ingiza asilimia ya punguzo',
      description: 'Maelezo',
      descriptionPlaceholder: 'Ingiza maelezo ya kuponi',
      url: 'URL ya Kuponi',
      urlPlaceholder: 'Ingiza URL ya kuponi',
      create: 'Unda Kuponi',
      update: 'Sasisha Kuponi',
      cancel: 'Ghairi'
    },
    status: {
      active: 'Inafanya Kazi',
      inactive: 'Haifanyi Kazi',
      expired: 'Imeisha'
    },
    actions_menu: {
      edit: 'Hariri',
      delete: 'Futa',
      toggle: 'Badilisha Hali',
      test: 'Jaribu Kutuma'
    },
    messages: {
      created: 'Kuponi imeundwa kwa ufanisi!',
      updated: 'Kuponi imesashwa kwa ufanisi!',
      deleted: 'Kuponi imefutwa kwa ufanisi!',
      toggled: 'Hali ya kuponi imesashwa kwa ufanisi!',
      testSent: 'Kuponi ya majaribio imetumwa kwa ufanisi!',
      error: 'Hitilafu imetokea. Jaribu tena.'
    },
    confirmDelete: 'Una uhakika unataka kufuta kuponi hii?',
    nav: {
      dashboard: 'Dashibodi',
      coupons: 'Kuponi',
      analytics: 'Uchambuzi'
    }
  }
};

interface Coupon {
  id: number;
  title: string;
  code: string;
  discount_percentage: number;
  description: string;
  url: string;
  is_active: boolean;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  created_at: string;
  updated_at: string;
}

interface CouponFormData {
  title: string;
  code: string;
  discount_percentage: number;
  description: string;
  url: string;
}

export default function CouponsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [currentLang, setCurrentLang] = useState('en');
  const [darkMode, setDarkMode] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [filteredCoupons, setFilteredCoupons] = useState<Coupon[]>([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const [formData, setFormData] = useState<CouponFormData>({
    title: '',
    code: '',
    discount_percentage: 0,
    description: '',
    url: ''
  });

  // Auto-redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  // Load coupons
  useEffect(() => {
    if (isAuthenticated) {
    loadCoupons();
    }
  }, [isAuthenticated]);

  // Filter coupons
  useEffect(() => {
    filterCoupons();
  }, [coupons, filter]);

  if (!isAuthenticated) {
    return null;
  }

  const t = translations[currentLang as keyof typeof translations];

  const loadCoupons = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading coupons:', error);
        showMessage(t.messages.error, 'error');
      } else {
        setCoupons(data || []);
      }
    } catch (error) {
      console.error('Error loading coupons:', error);
      showMessage(t.messages.error, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filterCoupons = () => {
    let filtered = coupons;
    
    switch (filter) {
      case 'active':
        filtered = coupons.filter(coupon => coupon.is_active);
        break;
      case 'inactive':
        filtered = coupons.filter(coupon => !coupon.is_active);
        break;
      case 'expired':
        // For now, we'll just show inactive coupons as expired
        filtered = coupons.filter(coupon => !coupon.is_active);
        break;
      default:
        filtered = coupons;
    }
    
    setFilteredCoupons(filtered);
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCoupon) {
        // Update existing coupon
        const { error } = await supabase
          .from('coupons')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCoupon.id);

        if (error) {
          showMessage(t.messages.error, 'error');
        } else {
          showMessage(t.messages.updated, 'success');
          resetForm();
          loadCoupons();
        }
      } else {
        // Create new coupon
        const { error } = await supabase
          .from('coupons')
          .insert([{
            ...formData,
            is_active: true,
            impressions: 0,
            clicks: 0,
            conversions: 0,
            revenue: 0
          }]);

        if (error) {
          showMessage(t.messages.error, 'error');
        } else {
          showMessage(t.messages.created, 'success');
          resetForm();
          loadCoupons();
        }
      }
    } catch (error) {
      console.error('Error submitting coupon:', error);
      showMessage(t.messages.error, 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      code: '',
      discount_percentage: 0,
      description: '',
      url: ''
    });
    setShowForm(false);
    setEditingCoupon(null);
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      title: coupon.title,
      code: coupon.code,
      discount_percentage: coupon.discount_percentage,
      description: coupon.description,
      url: coupon.url
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm(t.confirmDelete)) {
      try {
        const { error } = await supabase
          .from('coupons')
          .delete()
          .eq('id', id);

        if (error) {
          showMessage(t.messages.error, 'error');
        } else {
          showMessage(t.messages.deleted, 'success');
          loadCoupons();
        }
      } catch (error) {
        console.error('Error deleting coupon:', error);
        showMessage(t.messages.error, 'error');
      }
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        showMessage(t.messages.error, 'error');
      } else {
        showMessage(t.messages.toggled, 'success');
        loadCoupons();
      }
    } catch (error) {
      console.error('Error toggling coupon status:', error);
      showMessage(t.messages.error, 'error');
    }
  };

  const handleTestSend = async (coupon: Coupon) => {
    try {
      const response = await fetch('/api/smart-push/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trigger_type: 'manual',
          coupon_id: coupon.id
        }),
      });

      if (response.ok) {
        showMessage(t.messages.testSent, 'success');
      } else {
        showMessage(t.messages.error, 'error');
      }
    } catch (error) {
      console.error('Error sending test coupon:', error);
      showMessage(t.messages.error, 'error');
    }
  };

  const calculateCTR = (clicks: number, impressions: number) => {
    if (impressions === 0) return '0%';
    return ((clicks / impressions) * 100).toFixed(1) + '%';
  };

  const stats = {
    total: coupons.length,
    active: coupons.filter(c => c.is_active).length,
    revenue: coupons.reduce((sum, c) => sum + c.revenue, 0),
    performance: coupons.length > 0 ? 
      (coupons.filter(c => c.clicks > 0).length / coupons.length * 100).toFixed(1) + '%' : 
      '0%'
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
      
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xl">
                C
              </div>
        <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t.title}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t.subtitle}
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
                {t.nav.dashboard}
              </Link>
              
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold">
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
            </div>
          </div>
      </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-3xl font-bold text-blue-600 mb-2">{stats.total}</div>
            <div className="text-gray-600 dark:text-gray-300">{t.stats.total}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-3xl font-bold text-green-600 mb-2">{stats.active}</div>
            <div className="text-gray-600 dark:text-gray-300">{t.stats.active}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-3xl font-bold text-purple-600 mb-2">${stats.revenue}</div>
            <div className="text-gray-600 dark:text-gray-300">{t.stats.revenue}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-3xl font-bold text-orange-600 mb-2">{stats.performance}</div>
            <div className="text-gray-600 dark:text-gray-300">{t.stats.performance}</div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-8 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:scale-105 transition-all duration-200 shadow-lg"
              >
                {t.actions.create}
              </button>
              <button
                onClick={loadCoupons}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-all duration-200"
              >
                {t.actions.refresh}
              </button>
            </div>
            
            {/* Filter Buttons */}
            <div className="flex items-center space-x-2">
              {(['all', 'active', 'inactive', 'expired'] as const).map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    filter === filterType
                      ? 'bg-green-500 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {t.filters[filterType]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl ${
            messageType === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
          }`}>
            {message}
          </div>
        )}

        {/* Create/Edit Form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              {editingCoupon ? t.form.update : t.form.create}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t.form.title}
                  </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                    placeholder={t.form.titlePlaceholder}
                      required
                    />
                  </div>

                  <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t.form.code}
                  </label>
                    <input
                      type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                    placeholder={t.form.codePlaceholder}
                      required
                    />
                  </div>

                  <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t.form.discount}
                  </label>
                      <input
                        type="number"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({...formData, discount_percentage: Number(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                    placeholder={t.form.discountPlaceholder}
                        min="0"
                        max="100"
                    required
                    />
                  </div>

                  <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t.form.url}
                  </label>
                    <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({...formData, url: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                    placeholder={t.form.urlPlaceholder}
                      required
                    />
                </div>
              </div>
                
                <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.form.description}
                      </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                  placeholder={t.form.descriptionPlaceholder}
                  rows={3}
                      required
                    />
              </div>

              <div className="flex items-center space-x-4">
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  {editingCoupon ? t.form.update : t.form.create}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-500 text-white rounded-xl font-medium hover:bg-gray-600 transition-all duration-200"
                >
                  {t.form.cancel}
                </button>
              </div>
            </form>
        </div>
      )}

        {/* Coupons Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">{t.table.id}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">{t.table.title}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">{t.table.code}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">{t.table.discount}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">{t.table.status}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">{t.table.clicks}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">{t.table.ctr}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">{t.table.revenue}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">{t.table.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      Loading...
                    </td>
                  </tr>
                ) : filteredCoupons.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No coupons found
                    </td>
                  </tr>
                ) : (
                  filteredCoupons.map((coupon) => (
                    <tr key={coupon.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">#{coupon.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{coupon.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{coupon.code}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{coupon.discount_percentage}%</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          coupon.is_active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {coupon.is_active ? t.status.active : t.status.inactive}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{coupon.clicks}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{calculateCTR(coupon.clicks, coupon.impressions)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">${coupon.revenue}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(coupon)}
                            className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                          >
                            {t.actions_menu.edit}
                          </button>
                          <button
                            onClick={() => handleToggleStatus(coupon.id, coupon.is_active)}
                            className={`px-3 py-1 rounded-lg transition-colors text-sm ${
                              coupon.is_active
                                ? 'bg-orange-500 text-white hover:bg-orange-600'
                                : 'bg-green-500 text-white hover:bg-green-600'
                            }`}
                          >
                            {t.actions_menu.toggle}
                          </button>
            <button
                            onClick={() => handleTestSend(coupon)}
                            className="px-3 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
            >
                            {t.actions_menu.test}
            </button>
                    <button
                            onClick={() => handleDelete(coupon.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                    >
                            {t.actions_menu.delete}
                    </button>
                  </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}