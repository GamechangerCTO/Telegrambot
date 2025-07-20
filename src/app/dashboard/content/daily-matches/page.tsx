'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DailyMatch {
  id: string;
  home_team: string;
  away_team: string;
  home_team_id?: string;
  away_team_id?: string;
  competition: string;
  kickoff_time: string;
  venue?: string;
  importance_score: number;
  match_status: string;
  content_opportunities: any;
  discovery_date: string;
  external_match_id: string;
  scheduled_content_count?: number;
  completed_content_count?: number;
}

interface ScheduledContent {
  id: string;
  content_type: string;
  content_subtype?: string;
  scheduled_for: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  priority: number;
  language: string;
  target_channels: string[];
  execution_started_at?: string;
  execution_completed_at?: string;
  execution_result?: any;
  created_at: string;
}

interface DiscoveryStats {
  lastDiscoveryTime?: string;
  totalMatches: number;
  highPriorityMatches: number;
  scheduledContentItems: number;
  completedContentItems: number;
  pendingContentItems: number;
  failedContentItems: number;
}

export default function DailyMatchesPage() {
  const [matches, setMatches] = useState<DailyMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<DailyMatch | null>(null);
  const [scheduledContent, setScheduledContent] = useState<ScheduledContent[]>([]);
  const [discoveryStats, setDiscoveryStats] = useState<DiscoveryStats>({
    totalMatches: 0,
    highPriorityMatches: 0,
    scheduledContentItems: 0,
    completedContentItems: 0,
    pendingContentItems: 0,
    failedContentItems: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh every 30 seconds when enabled
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadTodaysMatches();
        if (selectedMatch) {
          loadScheduledContent(selectedMatch.id);
        }
      }, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, selectedMatch]);

  // Load today's important matches and stats
  useEffect(() => {
    loadTodaysMatches();
  }, []);

  const loadTodaysMatches = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/daily-matches');
      if (!response.ok) {
        throw new Error('Failed to load daily matches');
      }

      const data = await response.json();
      setMatches(data.matches || []);
      
      // Calculate stats
      const matches = data.matches || [];
      const stats: DiscoveryStats = {
        lastDiscoveryTime: data.lastDiscoveryTime,
        totalMatches: matches.length,
        highPriorityMatches: matches.filter((m: DailyMatch) => m.importance_score >= 25).length,
        scheduledContentItems: matches.reduce((sum: number, m: DailyMatch) => sum + (m.scheduled_content_count || 0), 0),
        completedContentItems: matches.reduce((sum: number, m: DailyMatch) => sum + (m.completed_content_count || 0), 0),
        pendingContentItems: 0,
        failedContentItems: 0
      };
      
      setDiscoveryStats(stats);

    } catch (err) {
      console.error('Error loading daily matches:', err);
      setError(err instanceof Error ? err.message : 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const loadScheduledContent = async (matchId: string) => {
    try {
      const response = await fetch(`/api/daily-matches/${matchId}/schedule`);
      if (!response.ok) {
        throw new Error('Failed to load scheduled content');
      }

      const data = await response.json();
      setScheduledContent(data.schedule || []);

    } catch (err) {
      console.error('Error loading scheduled content:', err);
      setScheduledContent([]);
    }
  };

  const triggerMorningDiscovery = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      const response = await fetch('/api/automation/cron/morning-discovery', {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error('Failed to trigger morning discovery');
      }

      const result = await response.json();
      console.log('Discovery result:', result);
      
      // Reload data after discovery
      await loadTodaysMatches();
      
    } catch (err) {
      console.error('Error triggering discovery:', err);
      setError(err instanceof Error ? err.message : 'Failed to trigger discovery');
    } finally {
      setRefreshing(false);
    }
  };

  const scheduleContentForMatch = async (matchId: string) => {
    try {
      const response = await fetch(`/api/daily-matches/${matchId}/schedule-content`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to schedule content');
      }

      await loadTodaysMatches();
      if (selectedMatch?.id === matchId) {
        await loadScheduledContent(matchId);
      }

    } catch (err) {
      console.error('Error scheduling content:', err);
      setError(err instanceof Error ? err.message : 'Failed to schedule content');
    }
  };

  const getImportanceColor = (score: number) => {
    if (score >= 25) return 'bg-red-500 text-white';
    if (score >= 20) return 'bg-orange-500 text-white';
    if (score >= 15) return 'bg-yellow-500 text-black';
    return 'bg-gray-500 text-white';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'executing': return 'blue';
      case 'completed': return 'green';
      case 'failed': return 'red';
      case 'scheduled': return 'blue';
      case 'live': return 'green';
      case 'finished': return 'gray';
      case 'postponed': return 'yellow';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const getContentTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'betting': 'bg-green-100 text-green-800',
      'analysis': 'bg-blue-100 text-blue-800',
      'news': 'bg-purple-100 text-purple-800',
      'polls': 'bg-yellow-100 text-yellow-800',
      'live': 'bg-red-100 text-red-800',
      'coupons': 'bg-pink-100 text-pink-800',
      'summary': 'bg-indigo-100 text-indigo-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      const now = new Date();
      const diffHours = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60));
      
      let timeStatus = '';
      if (diffHours > 0) {
        timeStatus = ` (in ${diffHours}h)`;
      } else if (diffHours > -2) {
        timeStatus = ' (LIVE/Recent)';
      } else {
        timeStatus = ` (${Math.abs(diffHours)}h ago)`;
      }
      
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) + timeStatus;
    } catch {
      return timeString;
    }
  };

  const getTimeUntilExecution = (scheduledTime: string) => {
    try {
      const scheduled = new Date(scheduledTime);
      const now = new Date();
      const diffMinutes = Math.round((scheduled.getTime() - now.getTime()) / (1000 * 60));
      
      if (diffMinutes > 60) {
        const hours = Math.round(diffMinutes / 60);
        return `${hours}h`;
      } else if (diffMinutes > 0) {
        return `${diffMinutes}m`;
      } else if (diffMinutes > -10) {
        return 'NOW';
      } else {
        return 'PAST';
      }
    } catch {
      return '?';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📅 Daily Matches & Content Schedule
          </h1>
          <p className="text-gray-600">
            Real-time view of discovered matches and scheduled content delivery
          </p>
          {discoveryStats.lastDiscoveryTime && (
            <p className="text-sm text-gray-500 mt-1">
              Last discovery: {formatTime(discoveryStats.lastDiscoveryTime)}
            </p>
          )}
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
          >
            {autoRefresh ? '⏸️ Pause' : '▶️ Auto'} Refresh
          </Button>
          
          <Button
            onClick={loadTodaysMatches}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            {refreshing ? <LoadingSpinner size="sm" /> : '🔄'}
            Refresh
          </Button>
          
          <Button
            onClick={triggerMorningDiscovery}
            disabled={refreshing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {refreshing ? <LoadingSpinner size="sm" /> : '🌅'}
            Discovery
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="text-red-600">
              ❌ <strong>Error:</strong> {error}
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-600">Total Matches</h3>
          <p className="text-2xl font-bold text-blue-600 mt-1">{discoveryStats.totalMatches}</p>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-600">High Priority</h3>
          <p className="text-2xl font-bold text-red-600 mt-1">{discoveryStats.highPriorityMatches}</p>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-600">Content Scheduled</h3>
          <p className="text-2xl font-bold text-purple-600 mt-1">{discoveryStats.scheduledContentItems}</p>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-600">Completed</h3>
          <p className="text-2xl font-bold text-green-600 mt-1">{discoveryStats.completedContentItems}</p>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-600">Pending</h3>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{discoveryStats.pendingContentItems}</p>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-600">Failed</h3>
          <p className="text-2xl font-bold text-red-600 mt-1">{discoveryStats.failedContentItems}</p>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Matches List */}
        <div className="xl:col-span-2">
          <h2 className="text-xl font-bold mb-4">🏟️ Discovered Matches</h2>
          
          {matches.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">⚽</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Important Matches Today
              </h3>
              <p className="text-gray-500 mb-6">
                Run morning discovery to find today's important matches
              </p>
              <Button onClick={triggerMorningDiscovery} disabled={refreshing}>
                {refreshing ? <LoadingSpinner size="sm" /> : '🔍'}
                Discover Matches
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {matches.map((match) => (
                <Card 
                  key={match.id} 
                  className={`p-5 hover:shadow-lg transition-all cursor-pointer ${
                    selectedMatch?.id === match.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => {
                    setSelectedMatch(match);
                    loadScheduledContent(match.id);
                  }}
                >
                  {/* Match Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {match.home_team} vs {match.away_team}
                      </h3>
                      <p className="text-gray-600 text-sm">{match.competition}</p>
                      <p className="text-xs text-gray-500">{match.venue}</p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={getImportanceColor(match.importance_score)}>
                        Score: {match.importance_score}
                      </Badge>
                                             <StatusBadge status={match.match_status === 'live' ? 'active' : match.match_status === 'finished' ? 'inactive' : 'enabled'} />
                    </div>
                  </div>

                  {/* Match Timeline */}
                  <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                    <div>
                      <span className="text-gray-600">Kickoff:</span>
                      <div className="font-medium">{formatTime(match.kickoff_time)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Content Items:</span>
                      <div className="font-medium">
                        {match.completed_content_count || 0} / {match.scheduled_content_count || 0}
                      </div>
                    </div>
                  </div>

                  {/* Content Opportunities */}
                  {match.content_opportunities && (
                    <div>
                      <p className="text-xs text-gray-600 mb-2">Content Types:</p>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(match.content_opportunities)
                          .filter(([_, enabled]) => enabled)
                          .map(([type, _]) => (
                            <Badge
                              key={type}
                              className={`text-xs ${getContentTypeColor(type)}`}
                            >
                              {type}
                            </Badge>
                          ))
                        }
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex gap-2 mt-3">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        scheduleContentForMatch(match.id);
                      }}
                      variant="outline"
                      size="sm"
                      disabled={!match.content_opportunities}
                    >
                      ⏰ Schedule Content
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Scheduled Content Timeline */}
        <div>
          <h2 className="text-xl font-bold mb-4">
            ⏰ Content Timeline
            {selectedMatch && (
              <span className="text-sm font-normal text-gray-600 block">
                {selectedMatch.home_team} vs {selectedMatch.away_team}
              </span>
            )}
          </h2>
          
          {!selectedMatch ? (
            <Card className="p-8 text-center">
              <div className="text-gray-400 text-4xl mb-3">📅</div>
              <p className="text-gray-600">
                Select a match to view its content timeline
              </p>
            </Card>
          ) : scheduledContent.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-gray-400 text-4xl mb-3">📋</div>
              <p className="text-gray-600 mb-4">
                No content scheduled for this match
              </p>
              <Button
                onClick={() => scheduleContentForMatch(selectedMatch.id)}
                size="sm"
              >
                📅 Schedule Content
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {scheduledContent
                .sort((a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime())
                .map((content) => (
                <Card key={content.id} className="p-4">
                  {/* Content Header */}
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 capitalize">
                        {content.content_type}
                        {content.content_subtype && (
                          <span className="text-sm text-gray-600 ml-1">
                            ({content.content_subtype})
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-gray-500">
                        Language: {content.language.toUpperCase()}
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                                             <StatusBadge status={
                         content.status === 'pending' ? 'disabled' :
                         content.status === 'executing' ? 'active' :
                         content.status === 'completed' ? 'enabled' :
                         content.status === 'failed' ? 'inactive' : 'disabled'
                       } />
                      <Badge className="text-xs">
                        {getTimeUntilExecution(content.scheduled_for)}
                      </Badge>
                    </div>
                  </div>

                  {/* Execution Timeline */}
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Scheduled:</span>
                      <span>{formatTime(content.scheduled_for)}</span>
                    </div>
                    
                    {content.execution_started_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Started:</span>
                        <span>{formatTime(content.execution_started_at)}</span>
                      </div>
                    )}
                    
                    {content.execution_completed_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Completed:</span>
                        <span>{formatTime(content.execution_completed_at)}</span>
                      </div>
                    )}
                  </div>

                  {/* Execution Result */}
                  {content.execution_result && (
                    <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
                      {content.status === 'completed' ? (
                        <div className="text-green-700">
                          ✅ Sent to {content.execution_result.channels_sent || 0} channels
                          {content.execution_result.content_items && (
                            <span className="block">
                              Generated {content.execution_result.content_items} content items
                            </span>
                          )}
                        </div>
                      ) : content.status === 'failed' ? (
                        <div className="text-red-700">
                          ❌ {content.execution_result.error || 'Execution failed'}
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Target Channels Info */}
                  <div className="mt-2 text-xs text-gray-500">
                    Channels: {content.target_channels?.length || 0} targeted
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 