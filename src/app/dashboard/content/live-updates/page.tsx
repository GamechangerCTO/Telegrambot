'use client';

import { useState, useEffect } from 'react';

interface LiveStats {
  totalMatches: number;
  liveMatches: number;
  eventsLast24h: number;
  isRunning: boolean;
}

interface LiveEvent {
  id: string;
  match_id: string;
  event_type: string;
  minute?: number;
  player_name?: string;
  team_side: 'home' | 'away';
  description: string;
  created_at: string;
}

interface LiveMatch {
  id: string;
  external_match_id: string;
  home_team: string;
  away_team: string;
  competition: string;
  current_status: string;
  home_score: number;
  away_score: number;
  last_updated: string;
}

export default function LiveUpdatesPage() {
  const [stats, setStats] = useState<LiveStats>({
    totalMatches: 0,
    liveMatches: 0,
    eventsLast24h: 0,
    isRunning: false
  });
  const [automationStatus, setAutomationStatus] = useState({
    isRunning: false,
    liveMonitoring: {
      isActive: false,
      activeMatches: 0,
      updatesGenerated: 0,
      lastUpdate: null
    }
  });
  const [recentEvents, setRecentEvents] = useState<LiveEvent[]>([]);
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [intervalSeconds, setIntervalSeconds] = useState(60);

  useEffect(() => {
    loadData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      // Load statistics from smart system
      const statsResponse = await fetch('/api/live-monitor?action=stats')
      const statsData = await statsResponse.json()
      if (statsData.success) {
        setStats(statsData.data)
      }

      // Load recent events
      const eventsResponse = await fetch('/api/live-monitor?type=recent_events');
      const eventsData = await eventsResponse.json();
      if (eventsData.success) {
        setRecentEvents(eventsData.data);
      }

      // Load live matches
      const matchesResponse = await fetch('/api/live-monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_live_matches' })
      });
      const matchesData = await matchesResponse.json();
      if (matchesData.success) {
        setLiveMatches(matchesData.data);
      }

      // Additional data from smart system  
      const healthResponse = await fetch('/api/live-monitor?action=health')
      const healthData = await healthResponse.json()
      if (healthData.success) {
        // Update additional system data
        console.log('🧠 Smart System Data:', healthData.data)
      }

      // Load automation and background scheduler status
      const automationResponse = await fetch('/api/automation/background-scheduler?action=status');
      const automationData = await automationResponse.json();
      if (automationData.success) {
        setAutomationStatus({
          isRunning: automationData.scheduler.isRunning,
          liveMonitoring: automationData.scheduler.liveUpdates || {
            isActive: false,
            activeMatches: 0,
            updatesGenerated: 0,
            lastUpdate: null
          }
        });
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartMonitoring = async () => {
    try {
      const response = await fetch('/api/live-monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'start_monitoring',
          intervalSeconds 
        })
      });
      
      const data = await response.json();
      if (data.success) {
        await loadData();
        alert('Live monitoring started successfully!');
      } else {
        alert('Error starting monitoring: ' + data.error);
      }
    } catch (error) {
      alert('Error starting monitoring');
    }
  };

  const handleStopMonitoring = async () => {
    try {
      const response = await fetch('/api/live-monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop_monitoring' })
      });
      
      const data = await response.json();
      if (data.success) {
        await loadData();
        alert('Live monitoring stopped successfully!');
      } else {
        alert('Error stopping monitoring: ' + data.error);
      }
    } catch (error) {
      alert('Error stopping monitoring');
    }
  };

  const getEventTypeEmoji = (eventType: string) => {
    switch (eventType) {
      case 'goal': return '⚽';
      case 'card': return '🟨';
      case 'substitution': return '🔄';
      case 'injury': return '🏥';
      case 'match_start': return '🎮';
      case 'match_end': return '🏁';
      default: return '📢';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'text-red-600 bg-red-100';
      case 'finished': return 'text-gray-600 bg-gray-100';
      case 'scheduled': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-6"></div>
            <div className="grid grid-cols-4 gap-6 mb-8">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-24 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔴 Live Football Match Updates
          </h1>
          <p className="text-gray-600 mb-4">
            Management system for automatic real-time updates for goals, cards and match events
          </p>
          
          {/* Smart System Indicator */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🧠</span>
              <div>
                <h3 className="text-sm font-semibold text-blue-900">Smart Selection System Active</h3>
                <p className="text-sm text-blue-700">
                  System monitors only interesting matches with 15+ score points • 
                  Includes top leagues (Premier League: 9pts, Champions League: 9pts) •
                  Popular teams (Manchester United: 9pts, Real Madrid: 10pts)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">Total Matches</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalMatches}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <span className="text-2xl">🔴</span>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">Live Matches</p>
                <p className="text-2xl font-bold text-red-600">{stats.liveMatches}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-2xl">⚡</span>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">Events 24h</p>
                <p className="text-2xl font-bold text-green-600">{stats.eventsLast24h}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${stats.isRunning ? 'bg-green-100' : 'bg-gray-100'}`}>
                <span className="text-2xl">{stats.isRunning ? '✅' : '⏸️'}</span>
              </div>
              <div className="mr-4">
                <p className="text-sm font-medium text-gray-600">System Status</p>
                <p className={`text-sm font-bold ${stats.isRunning ? 'text-green-600' : 'text-gray-600'}`}>
                  {stats.isRunning ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">System Control</h2>
          
          <div className="flex items-center gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check Frequency (seconds)
              </label>
              <input
                type="number"
                value={intervalSeconds}
                onChange={(e) => setIntervalSeconds(Number(e.target.value))}
                min="30"
                max="300"
                className="w-24 px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleStartMonitoring}
              disabled={stats.isRunning}
              className={`px-6 py-2 rounded-lg font-medium ${
                stats.isRunning 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              🚀 Start Monitoring
            </button>

            <button
              onClick={handleStopMonitoring}
              disabled={!stats.isRunning}
              className={`px-6 py-2 rounded-lg font-medium ${
                !stats.isRunning 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              🛑 Stop Monitoring
            </button>

            <button
              onClick={loadData}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              🔄 Refresh Data
            </button>
          </div>
        </div>

        {/* Automation Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🤖 Automation & GitHub Actions Status</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Background Scheduler Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className={`text-2xl mr-2 ${automationStatus.isRunning ? '🟢' : '🔴'}`}>
                  {automationStatus.isRunning ? '✅' : '❌'}
                </span>
                <h3 className="font-medium text-gray-900">Background Scheduler</h3>
              </div>
              <p className={`text-sm ${automationStatus.isRunning ? 'text-green-600' : 'text-red-600'}`}>
                {automationStatus.isRunning ? 'Active and monitoring live updates' : 'Inactive'}
              </p>
            </div>

            {/* Live Monitoring Integration */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className={`text-2xl mr-2 ${automationStatus.liveMonitoring.isActive ? '🔴' : '⏸️'}`}>
                  {automationStatus.liveMonitoring.isActive ? '🔴' : '⏸️'}
                </span>
                <h3 className="font-medium text-gray-900">Live Monitoring</h3>
              </div>
              <p className="text-sm text-gray-600">
                Active matches: {automationStatus.liveMonitoring.activeMatches}
              </p>
              <p className="text-sm text-gray-600">
                Updates generated: {automationStatus.liveMonitoring.updatesGenerated}
              </p>
            </div>

            {/* GitHub Actions Integration */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">⚙️</span>
                <h3 className="font-medium text-gray-900">GitHub Actions</h3>
              </div>
              <p className="text-sm text-gray-600">
                Live workflow runs every 2-3 minutes
              </p>
              <p className="text-sm text-gray-600">
                Automatic check for live matches
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-4">
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/automation/background-scheduler?action=start', { method: 'POST' });
                  const data = await response.json();
                  if (data.success) {
                    await loadData();
                    alert('Background Scheduler started successfully!');
                  }
                } catch (error) {
                  alert('Error starting scheduler');
                }
              }}
              disabled={automationStatus.isRunning}
              className={`px-4 py-2 rounded-lg font-medium ${
                automationStatus.isRunning 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              🚀 Start Background Scheduler
            </button>

            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/automation/background-scheduler?action=stop', { method: 'POST' });
                  const data = await response.json();
                  if (data.success) {
                    await loadData();
                    alert('Background Scheduler stopped successfully!');
                  }
                } catch (error) {
                  alert('Error stopping scheduler');
                }
              }}
              disabled={!automationStatus.isRunning}
              className={`px-4 py-2 rounded-lg font-medium ${
                !automationStatus.isRunning 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              🛑 Stop Background Scheduler
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Live Matches */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                📺 Live Matches ({liveMatches.length})
              </h2>
            </div>
            <div className="p-6">
              {liveMatches.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No live matches currently
                </p>
              ) : (
                <div className="space-y-4">
                  {liveMatches.map((match) => (
                    <div key={match.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {match.home_team} vs {match.away_team}
                          </h3>
                          <p className="text-sm text-gray-600">{match.competition}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(match.current_status)}`}>
                          {match.current_status}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {match.home_score} - {match.away_score}
                        </div>
                        <div className="text-sm text-gray-500">
                          Updated: {new Date(match.last_updated).toLocaleTimeString('en-US')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Events */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                ⚡ Recent Events ({recentEvents.length})
              </h2>
            </div>
            <div className="p-6">
              {recentEvents.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No recent events
                </p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {recentEvents.map((event) => (
                    <div key={event.id} className="border-r-4 border-blue-500 bg-gray-50 p-3 rounded">
                      <div className="flex items-start gap-3">
                        <span className="text-xl">
                          {getEventTypeEmoji(event.event_type)}
                        </span>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">
                                {event.description}
                              </p>
                              <p className="text-sm text-gray-600">
                                {event.event_type} • {event.team_side === 'home' ? 'Home' : 'Away'}
                                {event.minute && ` • Min ${event.minute}`}
                              </p>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(event.created_at).toLocaleTimeString('en-US')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 