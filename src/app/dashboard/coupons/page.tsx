'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Plus, Settings, Eye, EyeOff, ExternalLink, TrendingUp, Users, DollarSign } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface Coupon {
  id: string;
  title: string;
  description?: string;
  affiliate_code: string;
  affiliate_url: string;
  betting_site?: string;
  bonus_amount?: string;
  currency: string;
  language: string;
  type: string;
  is_active: boolean;
  created_at: string;
  impressions: number;
  clicks: number;
  conversions: number;
  current_usage: number;
  max_usage?: number;
}

export default function CouponsPage() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCoupons: 0,
    activeCoupons: 0,
    totalClicks: 0,
    totalConversions: 0
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setCoupons(data);
        
        // Calculate stats
        const totalClicks = data.reduce((sum, coupon) => sum + (coupon.clicks || 0), 0);
        const totalConversions = data.reduce((sum, coupon) => sum + (coupon.conversions || 0), 0);
        
        setStats({
          totalCoupons: data.length,
          activeCoupons: data.filter(c => c.is_active).length,
          totalClicks,
          totalConversions
        });
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
      alert('Error loading coupons');
    } finally {
      setLoading(false);
    }
  };

  const toggleCouponStatus = async (couponId: string, currentStatus: boolean) => {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !currentStatus })
        .eq('id', couponId);

      if (error) throw error;

      // Update local state
      setCoupons(prev => prev.map(coupon => 
        coupon.id === couponId 
          ? { ...coupon, is_active: !currentStatus }
          : coupon
      ));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        activeCoupons: currentStatus ? prev.activeCoupons - 1 : prev.activeCoupons + 1
      }));
      
    } catch (error) {
      console.error('Error updating coupon status:', error);
      alert('Error updating coupon status');
    }
  };

  const getCTR = (clicks: number, impressions: number) => {
    if (impressions === 0) return '0%';
    return ((clicks / impressions) * 100).toFixed(1) + '%';
  };

  const getConversionRate = (conversions: number, clicks: number) => {
    if (clicks === 0) return '0%';
    return ((conversions / clicks) * 100).toFixed(1) + '%';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading coupons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Coupons Management</h1>
            <p className="text-gray-600">Manage promotional coupons and track performance</p>
          </div>
          <Button onClick={() => router.push('/dashboard/coupons/add')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Coupon
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Coupons</p>
                  <p className="text-2xl font-bold">{stats.totalCoupons}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Settings className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Coupons</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeCoupons}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <Eye className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Clicks</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalClicks}</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversions</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.totalConversions}</p>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coupons List */}
        {coupons.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <Settings className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No coupons yet</h3>
              <p className="text-gray-500 mb-4">Create your first promotional coupon to get started</p>
              <Button onClick={() => router.push('/dashboard/coupons/add')}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Coupon
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {coupons.map((coupon) => (
              <Card key={coupon.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{coupon.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                          {coupon.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">
                          {coupon.betting_site || 'General'}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleCouponStatus(coupon.id, coupon.is_active)}
                    >
                      {coupon.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Coupon Details */}
                  <div className="space-y-2">
                    {coupon.description && (
                      <p className="text-sm text-gray-600">{coupon.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Bonus:</span>
                      <span className="font-medium">{coupon.bonus_amount || 'N/A'}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Code:</span>
                      <span className="font-mono text-blue-600">{coupon.affiliate_code}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Language:</span>
                      <span className="uppercase">{coupon.language}</span>
                    </div>
                  </div>

                  {/* Performance Stats */}
                  <div className="border-t pt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Performance</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Impressions:</span>
                        <div className="font-medium">{coupon.impressions || 0}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Clicks:</span>
                        <div className="font-medium">{coupon.clicks || 0}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">CTR:</span>
                        <div className="font-medium">{getCTR(coupon.clicks || 0, coupon.impressions || 0)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Conversions:</span>
                        <div className="font-medium">{coupon.conversions || 0}</div>
                      </div>
                    </div>
                  </div>

                  {/* Usage */}
                  {coupon.max_usage && (
                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Usage:</span>
                        <span className="font-medium">
                          {coupon.current_usage || 0}/{coupon.max_usage}
                        </span>
                      </div>
                      <div className="mt-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ 
                            width: `${Math.min(((coupon.current_usage || 0) / coupon.max_usage) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(coupon.affiliate_url, '_blank')}
                      className="flex-1"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Visit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/coupons/${coupon.id}/edit`)}
                      className="flex-1"
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}