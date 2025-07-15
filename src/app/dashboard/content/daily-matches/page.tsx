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

interface ContentSchedule {
  id: string;
  content_type: string;
  content_subtype?: string;
  scheduled_for: string;
  status: string;
  priority: number;
  language: string;
  target_channels: string[];
}

export default function DailyMatchesPage() {
  const [matches, setMatches] = useState<DailyMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<DailyMatch | null>(null);
  const [matchSchedule, setMatchSchedule] = useState<ContentSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load today's important matches
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

    } catch (err) {
      console.error('Error loading daily matches:', err);
      setError(err instanceof Error ? err.message : 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const loadMatchSchedule = async (matchId: string) => {
    try {
      const response = await fetch(`/api/daily-matches/${matchId}/schedule`);
      if (!response.ok) {
        throw new Error('Failed to load match schedule');
      }

      const data = await response.json();
      setMatchSchedule(data.schedule || []);

    } catch (err) {
      console.error('Error loading match schedule:', err);
      setMatchSchedule([]);
    }
  };

  const refreshMatches = async () => {
    setRefreshing(true);
    await loadTodaysMatches();
    setRefreshing(false);
  };

  const triggerMorningDiscovery = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/automation/cron/morning-discovery', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to trigger morning discovery');
      }

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
        await loadMatchSchedule(matchId);
      }

    } catch (err) {
      console.error('Error scheduling content:', err);
      setError(err instanceof Error ? err.message : 'Failed to schedule content');
    }
  };

  const getImportanceColor = (score: number) => {
    if (score >= 25) return 'bg-red-500';
    if (score >= 20) return 'bg-orange-500';
    if (score >= 15) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'blue';
      case 'live': return 'green';
      case 'finished': return 'gray';
      case 'postponed': return 'yellow';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString();
  };

  const getContentTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'poll': 'bg-blue-100 text-blue-800',
      'betting': 'bg-green-100 text-green-800',
      'analysis': 'bg-purple-100 text-purple-800',
      'live_updates': 'bg-red-100 text-red-800',
      'summary': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Today's Important Matches</h1>
          <p className="text-gray-600 mt-2">
            Matches discovered and scheduled for content generation
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={refreshMatches}
            disabled={refreshing}
            variant="outline"
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
            Trigger Discovery
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

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-700">Total Matches</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{matches.length}</p>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-700">High Priority</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {matches.filter(m => m.importance_score >= 25).length}
          </p>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-700">With Content</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {matches.filter(m => (m.scheduled_content_count || 0) > 0).length}
          </p>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-700">Live Now</h3>
          <p className="text-3xl font-bold text-orange-600 mt-2">
            {matches.filter(m => m.match_status === 'live').length}
          </p>
        </Card>
      </div>

      {/* Matches List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {matches.length === 0 ? (
          <div className="col-span-full">
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
          </div>
        ) : (
          matches.map((match) => (
            <Card key={match.id} className="p-6 hover:shadow-lg transition-shadow">
              {/* Match Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {match.home_team} vs {match.away_team}
                  </h3>
                  <p className="text-gray-600">{match.competition}</p>
                  <p className="text-sm text-gray-500">{match.venue}</p>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${getImportanceColor(match.importance_score)}`}
                    title={`Importance Score: ${match.importance_score}`}
                  />
                                     <Badge className={`badge-${getStatusColor(match.match_status)}`}>
                     {match.match_status}
                   </Badge>
                </div>
              </div>

              {/* Match Details */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Kickoff:</span>
                  <span className="font-medium">{formatTime(match.kickoff_time)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Importance Score:</span>
                  <Badge className={getImportanceColor(match.importance_score)}>
                    {match.importance_score}/30
                  </Badge>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Scheduled Content:</span>
                  <span className="font-medium">
                    {match.scheduled_content_count || 0} items
                  </span>
                </div>
              </div>

              {/* Content Opportunities */}
              {match.content_opportunities && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Content Opportunities:</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(match.content_opportunities)
                      .filter(([_, enabled]) => enabled)
                      .map(([type, _]) => (
                        <Badge
                          key={type}
                          className={getContentTypeColor(type)}
                        >
                          {type}
                        </Badge>
                      ))
                    }
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setSelectedMatch(match);
                    loadMatchSchedule(match.id);
                  }}
                  variant="outline"
                  size="sm"
                >
                  📅 View Schedule
                </Button>
                
                <Button
                  onClick={() => scheduleContentForMatch(match.id)}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  ⚡ Schedule Content
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Match Schedule Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">
                  Content Schedule: {selectedMatch.home_team} vs {selectedMatch.away_team}
                </h2>
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {matchSchedule.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No content scheduled for this match</p>
                  <Button
                    onClick={() => scheduleContentForMatch(selectedMatch.id)}
                    className="mt-4"
                  >
                    Schedule Content Now
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {matchSchedule.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">
                            {item.content_type}
                            {item.content_subtype && ` (${item.content_subtype})`}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Scheduled: {formatTime(item.scheduled_for)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Language: {item.language} | Channels: {item.target_channels.length}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`priority-${item.priority}`}>
                            Priority {item.priority}
                          </Badge>
                          <Badge className={`badge-${item.status === 'completed' ? 'green' : 
                                   item.status === 'executing' ? 'blue' : 
                                   item.status === 'failed' ? 'red' : 'gray'}`}>
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 