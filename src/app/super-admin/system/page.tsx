/**
 * TELEGRAM BOT MANAGER 2025 - Super Admin System Monitoring
 * Real-time system health and performance monitoring dashboard
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SystemHealth {
  timestamp: string;
  healthScore: number;
  systemStats: {
    database: {
      status: string;
      latency: string;
      error?: any;
    };
    api: {
      status: string;
      uptime: string;
      responseTime: string;
    };
    bots: {
      total: number;
      active: number;
      healthyBots: number;
    };
    channels: {
      total: number;
      active: number;
      recentlyActive: number;
    };
    errors: {
      recentErrors: number;
      criticalErrors: number;
    };
  };
  performanceMetrics: {
    avgContentGenerationTime: number;
    contentGeneratedLast24h: number;
    contentByType: Record<string, number>;
    apiCallsLast24h: number;
    successRate: string;
  };
  resourceUsage: {
    cpuUsage: string;
    memoryUsage: string;
    diskUsage: string;
    networkUsage: string;
    databaseConnections: number;
    activeProcesses: number;
  };
  recentErrors: any[];
  alerts: Array<{
    type: string;
    message: string;
    action: string;
  }>;
  recommendations: Array<{
    type: string;
    message: string;
    action: string;
  }>;
}

export default function SuperAdminSystemPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    // Check if user is super admin
    if (!user || user.role !== 'super_admin') {
      router.push('/dashboard');
      return;
    }

    fetchSystemHealth();
  }, [user, router]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchSystemHealth, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchSystemHealth = async () => {
    try {
      const response = await fetch('/api/super-admin/system');
      if (!response.ok) {
        throw new Error('Failed to fetch system health');
      }
      const data = await response.json();
      setSystemHealth(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBg = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading system health data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">System Monitoring Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-4">
            <button
              onClick={fetchSystemHealth}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
            <Link
              href="/super-admin"
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
              <p className="mt-2 text-gray-600">Real-time system health and performance monitoring</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Auto-refresh</span>
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoRefresh ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoRefresh ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <button
                onClick={fetchSystemHealth}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                🔄 Refresh
              </button>
              <Link
                href="/super-admin"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Health Score */}
        <div className="mb-8">
          <div className={`bg-white rounded-lg shadow-lg p-6 ${getHealthBg(systemHealth?.healthScore || 0)}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Overall System Health</h2>
                <p className="text-gray-600">Last updated: {systemHealth?.timestamp ? new Date(systemHealth.timestamp).toLocaleTimeString() : 'N/A'}</p>
              </div>
              <div className={`text-6xl font-bold ${getHealthColor(systemHealth?.healthScore || 0)}`}>
                {systemHealth?.healthScore || 0}%
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${
                    (systemHealth?.healthScore || 0) >= 90
                      ? 'bg-green-500'
                      : (systemHealth?.healthScore || 0) >= 70
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${systemHealth?.healthScore || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* System Components Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Database Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Database</h3>
                <p className="text-sm text-gray-500">PostgreSQL</p>
              </div>
              <div className="text-2xl">🗄️</div>
            </div>
            <div className="mt-4">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(systemHealth?.systemStats?.database?.status || 'unknown')}`}>
                {systemHealth?.systemStats?.database?.status || 'Unknown'}
              </span>
              <p className="text-sm text-gray-600 mt-1">
                Latency: {systemHealth?.systemStats?.database?.latency || 'N/A'}
              </p>
            </div>
          </div>

          {/* API Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">API Services</h3>
                <p className="text-sm text-gray-500">REST APIs</p>
              </div>
              <div className="text-2xl">🔌</div>
            </div>
            <div className="mt-4">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(systemHealth?.systemStats?.api?.status || 'unknown')}`}>
                {systemHealth?.systemStats?.api?.status || 'Unknown'}
              </span>
              <p className="text-sm text-gray-600 mt-1">
                Uptime: {systemHealth?.systemStats?.api?.uptime || 'N/A'}
              </p>
            </div>
          </div>

          {/* Bots Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Telegram Bots</h3>
                <p className="text-sm text-gray-500">Active/Total</p>
              </div>
              <div className="text-2xl">🤖</div>
            </div>
            <div className="mt-4">
              <div className="text-lg font-semibold text-gray-900">
                {systemHealth?.systemStats?.bots?.active || 0} / {systemHealth?.systemStats?.bots?.total || 0}
              </div>
              <p className="text-sm text-gray-600">
                Healthy: {systemHealth?.systemStats?.bots?.healthyBots || 0}
              </p>
            </div>
          </div>

          {/* Channels Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Channels</h3>
                <p className="text-sm text-gray-500">Active/Total</p>
              </div>
              <div className="text-2xl">📢</div>
            </div>
            <div className="mt-4">
              <div className="text-lg font-semibold text-gray-900">
                {systemHealth?.systemStats?.channels?.active || 0} / {systemHealth?.systemStats?.channels?.total || 0}
              </div>
              <p className="text-sm text-gray-600">
                Recently Active: {systemHealth?.systemStats?.channels?.recentlyActive || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Content Generation Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Content Generation Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Average Generation Time</span>
                <span className="text-sm font-medium text-gray-900">
                  {systemHealth?.performanceMetrics?.avgContentGenerationTime || 0}s
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Content Generated (24h)</span>
                <span className="text-sm font-medium text-gray-900">
                  {systemHealth?.performanceMetrics?.contentGeneratedLast24h || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">API Calls (24h)</span>
                <span className="text-sm font-medium text-gray-900">
                  {systemHealth?.performanceMetrics?.apiCallsLast24h || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Success Rate</span>
                <span className="text-sm font-medium text-gray-900">
                  {systemHealth?.performanceMetrics?.successRate || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Resource Usage */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Resource Usage</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">CPU Usage</span>
                <span className="text-sm font-medium text-gray-900">
                  {systemHealth?.resourceUsage?.cpuUsage || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Memory Usage</span>
                <span className="text-sm font-medium text-gray-900">
                  {systemHealth?.resourceUsage?.memoryUsage || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Disk Usage</span>
                <span className="text-sm font-medium text-gray-900">
                  {systemHealth?.resourceUsage?.diskUsage || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">DB Connections</span>
                <span className="text-sm font-medium text-gray-900">
                  {systemHealth?.resourceUsage?.databaseConnections || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts and Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Alerts */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">System Alerts</h3>
            <div className="space-y-3">
              {systemHealth?.alerts?.length === 0 ? (
                <p className="text-sm text-gray-500">No alerts at this time</p>
              ) : (
                systemHealth?.alerts?.map((alert, index) => (
                  <div key={index} className={`p-3 rounded-md border ${getAlertColor(alert.type)}`}>
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs mt-1 opacity-75">{alert.action}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">System Recommendations</h3>
            <div className="space-y-3">
              {systemHealth?.recommendations?.length === 0 ? (
                <p className="text-sm text-gray-500">No recommendations at this time</p>
              ) : (
                systemHealth?.recommendations?.map((rec, index) => (
                  <div key={index} className="p-3 rounded-md border border-blue-200 bg-blue-50">
                    <p className="text-sm font-medium text-blue-800">{rec.message}</p>
                    <p className="text-xs mt-1 text-blue-600">{rec.action}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 