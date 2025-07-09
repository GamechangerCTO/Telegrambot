'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

interface Coupon {
  id: string;
  title: string;
  affiliate_code: string;
  affiliate_url: string;
  betting_site: string;
  bonus_amount: string;
  currency: string;
  description: string;
  expiry_date: string;
  max_usage: number;
  usage_count: number;
  is_active: boolean;
  language: string;
  bot_id: string;
  created_at: string;
  updated_at: string;
}

interface Bot {
  id: string;
  name: string;
  language_code: string;
}

export default function CouponsManagementPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    affiliate_code: '',
    affiliate_url: '',
    betting_site: '',
    bonus_amount: '',
    currency: 'USD',
    description: '',
    expiry_date: '',
    max_usage: 1000,
    language: 'en',
    bot_id: ''
  });

  const supabase = createClient();

  const BETTING_SITES = [
    'Bet365', 'William Hill', 'Betway', 'Ladbrokes', 'Paddy Power',
    'Unibet', 'Bwin', 'SportingBet', '888Sport', 'Betfair',
    'SkyBet', 'Coral', 'BetVictor', 'Betfred', 'Marathon Bet'
  ];

  const CURRENCIES = ['USD', 'EUR', 'GBP', 'ETB', 'KES', 'TZS', 'UGX'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load coupons
      const { data: couponsData } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      // Load bots
      const { data: botsData } = await supabase
        .from('bots')
        .select('id, name, language_code')
        .eq('is_active', true)
        .order('name');

      setCoupons(couponsData || []);
      setBots(botsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
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

        if (error) throw error;
      } else {
        // Create new coupon
        const { error } = await supabase
          .from('coupons')
          .insert({
            ...formData,
            is_active: true,
            usage_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      // Reset form and reload data
      setFormData({
        title: '',
        affiliate_code: '',
        affiliate_url: '',
        betting_site: '',
        bonus_amount: '',
        currency: 'USD',
        description: '',
        expiry_date: '',
        max_usage: 1000,
        language: 'en',
        bot_id: ''
      });
      setShowCreateForm(false);
      setEditingCoupon(null);
      await loadData();

    } catch (error) {
      console.error('Error saving coupon:', error);
      alert('Error saving coupon');
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setFormData({
      title: coupon.title,
      affiliate_code: coupon.affiliate_code,
      affiliate_url: coupon.affiliate_url,
      betting_site: coupon.betting_site || '',
      bonus_amount: coupon.bonus_amount || '',
      currency: coupon.currency || 'USD',
      description: coupon.description || '',
      expiry_date: coupon.expiry_date ? coupon.expiry_date.split('T')[0] : '',
      max_usage: coupon.max_usage || 1000,
      language: coupon.language || 'en',
      bot_id: coupon.bot_id || ''
    });
    setEditingCoupon(coupon);
    setShowCreateForm(true);
  };

  const handleDelete = async (couponId: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', couponId);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      alert('Error deleting coupon');
    }
  };

  const toggleActive = async (couponId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ 
          is_active: !isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', couponId);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error updating coupon status:', error);
    }
  };

  const generateCouponContent = async (coupon: Coupon) => {
    try {
      const response = await fetch('/api/real-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: 'coupon',
          couponData: {
            title: coupon.title,
            code: coupon.affiliate_code,
            url: coupon.affiliate_url,
            site: coupon.betting_site,
            bonus: coupon.bonus_amount,
            currency: coupon.currency,
            description: coupon.description,
            language: coupon.language
          }
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('✅ Coupon content generated and sent successfully!');
      } else {
        alert('❌ Failed to generate content: ' + result.error);
      }
    } catch (error) {
      console.error('Error generating content:', error);
      alert('Error generating content');
    }
  };

  const getLanguageFlag = (language: string) => {
    switch (language) {
      case 'en': return '🇬🇧';
      case 'am': return '🇪🇹';
      case 'sw': return '🇹🇿';
      default: return '🌍';
    }
  };

  const isExpired = (expiryDate: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading coupons...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Affiliate Coupons & Promotions</h1>
            <p className="text-green-100">Manage betting site affiliate codes and promotional content</p>
          </div>
          <button
            onClick={() => {
              setShowCreateForm(true);
              setEditingCoupon(null);
              setFormData({
                title: '',
                affiliate_code: '',
                affiliate_url: '',
                betting_site: '',
                bonus_amount: '',
                currency: 'USD',
                description: '',
                expiry_date: '',
                max_usage: 1000,
                language: 'en',
                bot_id: ''
              });
            }}
            className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 flex items-center space-x-2"
          >
            <span>🎟️</span>
            <span>Create New Coupon</span>
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { 
            title: 'Total Coupons', 
            value: coupons.length.toString(), 
            icon: '🎟️',
            color: 'bg-blue-50 text-blue-600'
          },
          { 
            title: 'Active Coupons', 
            value: coupons.filter(c => c.is_active && !isExpired(c.expiry_date)).length.toString(),
            icon: '✅',
            color: 'bg-green-50 text-green-600'
          },
          { 
            title: 'Total Usage', 
            value: coupons.reduce((sum, c) => sum + (c.usage_count || 0), 0).toString(),
            icon: '👥',
            color: 'bg-purple-50 text-purple-600'
          },
          { 
            title: 'Expired', 
            value: coupons.filter(c => isExpired(c.expiry_date)).length.toString(),
            icon: '⏰',
            color: 'bg-red-50 text-red-600'
          }
        ].map((stat, index) => (
          <div key={index} className={`rounded-lg p-6 ${stat.color}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <div className="text-2xl">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
            </h2>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setEditingCoupon(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coupon Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="100% Welcome Bonus"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Affiliate Code
              </label>
              <input
                type="text"
                value={formData.affiliate_code}
                onChange={(e) => setFormData({ ...formData, affiliate_code: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="SPORT100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Affiliate URL
              </label>
              <input
                type="url"
                value={formData.affiliate_url}
                onChange={(e) => setFormData({ ...formData, affiliate_url: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://partner.site.com/register?code=SPORT100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Betting Site
              </label>
              <select
                value={formData.betting_site}
                onChange={(e) => setFormData({ ...formData, betting_site: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select betting site</option>
                {BETTING_SITES.map(site => (
                  <option key={site} value={site}>{site}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bonus Amount
              </label>
              <input
                type="text"
                value={formData.bonus_amount}
                onChange={(e) => setFormData({ ...formData, bonus_amount: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {CURRENCIES.map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date
              </label>
              <input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Usage
              </label>
              <input
                type="number"
                value={formData.max_usage}
                onChange={(e) => setFormData({ ...formData, max_usage: parseInt(e.target.value) || 0 })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="en">English 🇬🇧</option>
                <option value="am">Amharic 🇪🇹</option>
                <option value="sw">Swahili 🇹🇿</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bot
              </label>
              <select
                value={formData.bot_id}
                onChange={(e) => setFormData({ ...formData, bot_id: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select bot (optional)</option>
                {bots.map(bot => (
                  <option key={bot.id} value={bot.id}>
                    {bot.name} ({bot.language_code})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Get 100% welcome bonus up to $200. New customers only. T&Cs apply."
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <span>💾</span>
                <span>{editingCoupon ? 'Update Coupon' : 'Create Coupon'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Active Coupons</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coupon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Site & Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bonus
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="mr-2">{getLanguageFlag(coupon.language)}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{coupon.title}</div>
                        {coupon.description && (
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {coupon.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{coupon.betting_site}</div>
                    <div className="text-sm text-blue-600 font-mono">{coupon.affiliate_code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {coupon.bonus_amount} {coupon.currency}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {coupon.usage_count || 0} / {coupon.max_usage || '∞'}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{
                          width: `${Math.min(((coupon.usage_count || 0) / (coupon.max_usage || 1)) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        coupon.is_active && !isExpired(coupon.expiry_date)
                          ? 'bg-green-100 text-green-800'
                          : isExpired(coupon.expiry_date)
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {isExpired(coupon.expiry_date) ? 'Expired' : coupon.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {coupon.expiry_date && (
                        <div className="text-xs text-gray-500">
                          Expires: {new Date(coupon.expiry_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => generateCouponContent(coupon)}
                      className="text-blue-600 hover:text-blue-900 bg-blue-50 px-2 py-1 rounded"
                      title="Generate and send content"
                    >
                      🚀
                    </button>
                    <button
                      onClick={() => handleEdit(coupon)}
                      className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-2 py-1 rounded"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => toggleActive(coupon.id, coupon.is_active)}
                      className={`${
                        coupon.is_active ? 'text-red-600 hover:text-red-900 bg-red-50' : 'text-green-600 hover:text-green-900 bg-green-50'
                      } px-2 py-1 rounded`}
                      title={coupon.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {coupon.is_active ? '⏸️' : '▶️'}
                    </button>
                    <button
                      onClick={() => handleDelete(coupon.id)}
                      className="text-red-600 hover:text-red-900 bg-red-50 px-2 py-1 rounded"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {coupons.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🎟️</div>
              <p className="text-gray-500 text-lg">No coupons created yet</p>
              <p className="text-gray-400">Create your first affiliate coupon to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 