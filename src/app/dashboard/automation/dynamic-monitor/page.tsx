'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusBadge from '@/components/ui/StatusBadge';

interface SpamStats {
  totalToday: number;
  maxDaily: number;
  emergencyBrake: number;
  byType: Record<string, number>;
  limits: Record<string, number>;
  status: 'NORMAL' | 'DAILY_LIMIT_REACHED' | 'EMERGENCY_STOP';
}

interface AutomationStatus {
  lastDiscovery: string;
  todayMatches: number;
  pendingContent: number;
  executedToday: number;
  nextScheduled: string;
}

export default function DynamicMonitorPage() {
  const [spamStats, setSpamStats] = useState<SpamStats | null>(null);
  const [automationStatus, setAutomationStatus] = useState<AutomationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      
      // Fetch spam prevention stats
      const spamResponse = await fetch('/api/automation/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-spam-stats',
          timestamp: new Date().toISOString()
        })
      });
      
      if (spamResponse.ok) {
        const spamData = await spamResponse.json();
        setSpamStats(spamData.result);
      }

      // Fetch automation status
      const statusResponse = await fetch('/api/automation/stats');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setAutomationStatus(statusData);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const triggerManualDiscovery = async () => {
    try {
      const response = await fetch('/api/automation/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'discover-matches',
          timestamp: new Date().toISOString(),
          force: true
        })
      });

      if (response.ok) {
        fetchData(); // Refresh data
      }
    } catch (err) {
      console.error('Error triggering discovery:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🎯 Dynamic Automation Monitor</h1>
          <p className="text-gray-600 mt-2">Monitor GitHub Actions, spam prevention, and scheduled content</p>
        </div>
        <button
          onClick={triggerManualDiscovery}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          🔍 Manual Discovery
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">❌ Error: {error}</p>
        </div>
      )}

      {/* Spam Prevention Stats */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            🛡️ Spam Prevention Status
            {spamStats && (
                             <StatusBadge 
                 status={spamStats.status === 'NORMAL' ? 'active' : 'inactive'} 
                 activeText={spamStats.status}
                 className="ml-2"
               />
            )}
          </h2>
          
          {spamStats ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600">Today's Usage</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {spamStats.totalToday} / {spamStats.maxDaily}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(spamStats.totalToday / spamStats.maxDaily) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600">Emergency Brake</h3>
                <p className="text-2xl font-bold text-red-600">
                  {spamStats.emergencyBrake}
                </p>
                <p className="text-sm text-gray-500">messages limit</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600">Status</h3>
                <p className={`text-lg font-semibold ${
                  spamStats.status === 'NORMAL' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {spamStats.status.replace('_', ' ')}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">No spam stats available</div>
          )}

          {/* Content Type Breakdown */}
          {spamStats?.byType && Object.keys(spamStats.byType).length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">Content Type Usage Today</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(spamStats.byType).map(([type, count]) => (
                  <div key={type} className="bg-white border rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-600 capitalize">{type}</p>
                    <p className="text-xl font-bold text-gray-900">
                      {count} / {spamStats.limits[type] || '∞'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Automation Status */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            ⚡ Automation Status
          </h2>
          
          {automationStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-600">Today's Matches</h3>
                <p className="text-2xl font-bold text-blue-900">{automationStatus.todayMatches}</p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-600">Executed Today</h3>
                <p className="text-2xl font-bold text-green-900">{automationStatus.executedToday}</p>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-yellow-600">Pending Content</h3>
                <p className="text-2xl font-bold text-yellow-900">{automationStatus.pendingContent}</p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-purple-600">Next Scheduled</h3>
                <p className="text-sm font-bold text-purple-900">
                  {automationStatus.nextScheduled || 'None'}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">No automation status available</div>
          )}
        </div>
      </Card>

      {/* GitHub Actions Status */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            🔄 GitHub Actions Status
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium">🌅 Morning Discovery</h3>
                <p className="text-sm text-gray-600">Runs daily at 09:00 Israel time</p>
              </div>
                             <StatusBadge status="active" activeText="Active" />
             </div>

             <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
               <div>
                 <h3 className="font-medium">⏰ Fixed Schedule</h3>
                 <p className="text-sm text-gray-600">News at 09:00, 15:00, 21:00</p>
               </div>
               <StatusBadge status="active" activeText="Active" />
             </div>

             <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
               <div>
                 <h3 className="font-medium">🎯 Dynamic Content</h3>
                 <p className="text-sm text-gray-600">Checks every 30 minutes during active hours</p>
               </div>
               <StatusBadge status="active" activeText="Active" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 