'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import TextInput from '@/components/forms/TextInput';
import { ArrowLeft, Save, CreditCard } from 'lucide-react';
import { createClient } from '@/lib/supabase';

const BETTING_SITES = [
  'Bet365', 'William Hill', 'Betfair', 'Unibet', 'Betway', 
  '888sport', 'Ladbrokes', 'Coral', 'Paddy Power', 'Sky Bet'
];

const COUPON_TYPES = [
  { id: 'welcome_bonus', label: 'Welcome Bonus', description: 'New user registration bonus' },
  { id: 'deposit_match', label: 'Deposit Match', description: 'Percentage match on deposits' },
  { id: 'free_bet', label: 'Free Bet', description: 'Risk-free betting credits' },
  { id: 'cashback', label: 'Cashback', description: 'Loss recovery bonus' },
  { id: 'enhanced_odds', label: 'Enhanced Odds', description: 'Boosted betting odds' },
  { id: 'loyalty_reward', label: 'Loyalty Reward', description: 'Rewards for existing users' }
];

export default function AddCoupon() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    affiliate_code: '',
    affiliate_url: '',
    betting_site: '',
    bonus_amount: '',
    currency: 'USD',
    language: 'en',
    type: 'welcome_bonus',
    offer_text: '',
    terms_url: '',
    expiry_date: '',
    max_usage: '',
    target_audience: [] as string[],
    is_active: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      
      // Validate required fields
      if (!formData.title || !formData.affiliate_code || !formData.affiliate_url) {
        alert('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Get the current bot (assuming africasportbot is the main one)
      const { data: botsData } = await supabase
        .from('bots')
        .select('id')
        .eq('name', 'africasportbot')
        .single();

      if (!botsData) {
        alert('Bot not found. Please contact support.');
        setLoading(false);
        return;
      }

      // Insert coupon
      const { error } = await supabase
        .from('coupons')
        .insert({
          bot_id: botsData.id,
          title: formData.title,
          description: formData.description,
          affiliate_code: formData.affiliate_code,
          affiliate_url: formData.affiliate_url,
          betting_site: formData.betting_site,
          bonus_amount: formData.bonus_amount,
          currency: formData.currency,
          language: formData.language,
          type: formData.type,
          offer_text: formData.offer_text,
          terms_url: formData.terms_url,
          expiry_date: formData.expiry_date ? new Date(formData.expiry_date).toISOString() : null,
          max_usage: formData.max_usage ? parseInt(formData.max_usage) : null,
          target_audience: formData.target_audience,
          is_active: formData.is_active
        });

      if (error) throw error;

      alert('Coupon added successfully!');
      router.push('/dashboard/coupons');
    } catch (error) {
      console.error('Error adding coupon:', error);
      alert('Error adding coupon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CreditCard className="w-6 h-6" />
              Add New Coupon
            </h1>
            <p className="text-gray-600">
              Create a new promotional coupon for your channels
            </p>
          </div>
          <Button 
            onClick={() => router.push('/dashboard')}
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Title *</label>
                  <TextInput
                    value={formData.title}
                    onChange={(value) => setFormData(prev => ({ ...prev, title: value }))}
                    placeholder="e.g., Welcome Bonus 100%"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Betting Site</label>
                  <select
                    value={formData.betting_site}
                    onChange={(e) => setFormData(prev => ({ ...prev, betting_site: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select betting site</option>
                    {BETTING_SITES.map(site => (
                      <option key={site} value={site}>{site}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {COUPON_TYPES.map(type => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bonus Amount</label>
                  <TextInput
                    value={formData.bonus_amount}
                    onChange={(value) => setFormData(prev => ({ ...prev, bonus_amount: value }))}
                    placeholder="e.g., $100, 100%, 50 Free Spins"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of the coupon offer"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Offer Text</label>
                <textarea
                  value={formData.offer_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, offer_text: e.target.value }))}
                  placeholder="Marketing text that will appear with the coupon"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </CardContent>
          </Card>

          {/* Affiliate Information */}
          <Card>
            <CardHeader>
              <CardTitle>Affiliate Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Affiliate Code *</label>
                  <TextInput
                    value={formData.affiliate_code}
                    onChange={(value) => setFormData(prev => ({ ...prev, affiliate_code: value }))}
                    placeholder="Your affiliate/promo code"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="ETB">ETB (Birr)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Affiliate URL *</label>
                <TextInput
                  value={formData.affiliate_url}
                  onChange={(value) => setFormData(prev => ({ ...prev, affiliate_url: value }))}
                  placeholder="https://affiliate-link.com/your-code"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions URL</label>
                <TextInput
                  value={formData.terms_url}
                  onChange={(value) => setFormData(prev => ({ ...prev, terms_url: value }))}
                  placeholder="https://site.com/terms"
                />
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Coupon Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Usage (optional)</label>
                  <TextInput
                    type="number"
                    value={formData.max_usage}
                    onChange={(value) => setFormData(prev => ({ ...prev, max_usage: value }))}
                    placeholder="e.g., 1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en">🇺🇸 English</option>
                    <option value="am">🇪🇹 Amharic</option>
                    <option value="sw">🇰🇪 Swahili</option>
                    <option value="he">🇮🇱 Hebrew</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active Coupon</label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Adding...' : 'Add Coupon'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}