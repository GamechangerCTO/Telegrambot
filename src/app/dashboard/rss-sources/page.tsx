'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

interface RSSSource {
  id: string;
  name: string;
  url: string;
  language: string;
  category: string;
  is_active: boolean;
  last_fetched_at?: string;
  fetch_frequency_minutes: number;
  created_at: string;
  updated_at: string;
}

interface League {
  id: string;
  name: string;
  country: string;
  season?: string;
  api_source?: string;
  is_active: boolean;
  priority: number;
}

interface Team {
  id: string;
  name: string;
  league_id: string;
  country: string;
  is_local: boolean;
}

export default function RSSSourcesPage() {
  const [rssSources, setRssSources] = useState<RSSSource[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sources' | 'leagues' | 'teams'>('sources');
  const [searchTerm, setSearchTerm] = useState('');
  
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load RSS sources
      const { data: sourcesData, error: sourcesError } = await supabase
        .from('rss_sources')
        .select('*')
        .order('created_at', { ascending: false });

      if (sourcesError) throw sourcesError;

      // Load leagues
      const { data: leaguesData, error: leaguesError } = await supabase
        .from('leagues')
        .select('*')
        .order('priority', { ascending: true });

      if (leaguesError) throw leaguesError;

      // Load teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .order('name');

      if (teamsError) throw teamsError;

      setRssSources(sourcesData || []);
      setLeagues(leaguesData || []);
      setTeams(teamsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSourceStatus = async (sourceId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('rss_sources')
        .update({ is_active: !currentStatus })
        .eq('id', sourceId);

      if (error) throw error;

      setRssSources(prev => 
        prev.map(source => 
          source.id === sourceId 
            ? { ...source, is_active: !currentStatus }
            : source
        )
      );
    } catch (error) {
      console.error('Error updating source status:', error);
    }
  };

  const filteredSources = rssSources.filter(source =>
    source.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    source.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLeagues = leagues.filter(league =>
    league.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    league.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'General News': return '📰';
      case 'Official Leagues': return '⚽';
      case 'Live Results': return '🟢';
      default: return '📄';
    }
  };

  const getCountryFlag = (country: string) => {
    const flags: { [key: string]: string } = {
      'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
      'Germany': '🇩🇪',
      'Spain': '🇪🇸',
      'Italy': '🇮🇹',
      'Ethiopia': '🇪🇹',
      'France': '🇫🇷',
      'Brazil': '🇧🇷',
    };
    return flags[country] || '🌍';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">RSS Sources & Discovery</h1>
          <p className="text-gray-600">
            Manage RSS feeds and view discovered leagues and teams from external APIs and news sources.
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'sources', label: 'RSS Sources', count: rssSources.length },
                { id: 'leagues', label: 'Discovered Leagues', count: leagues.length },
                { id: 'teams', label: 'Discovered Teams', count: teams.length },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>

          {/* Search */}
          <div className="p-6">
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {activeTab === 'sources' && (
            <div className="p-6">
              <div className="grid gap-4">
                {filteredSources.map(source => (
                  <div key={source.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-2xl">{getCategoryIcon(source.category)}</span>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{source.name}</h3>
                            <p className="text-sm text-gray-500">{source.category}</p>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <a 
                            href={source.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm break-all"
                          >
                            {source.url}
                          </a>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Language:</span>
                            <span className="ml-1 text-gray-600">{source.language.toUpperCase()}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Frequency:</span>
                            <span className="ml-1 text-gray-600">{source.fetch_frequency_minutes}min</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Last Fetched:</span>
                            <span className="ml-1 text-gray-600">
                              {source.last_fetched_at 
                                ? new Date(source.last_fetched_at).toLocaleDateString()
                                : 'Never'
                              }
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Created:</span>
                            <span className="ml-1 text-gray-600">
                              {new Date(source.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          source.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {source.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={() => toggleSourceStatus(source.id, source.is_active)}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            source.is_active
                              ? 'bg-red-100 hover:bg-red-200 text-red-700'
                              : 'bg-green-100 hover:bg-green-200 text-green-700'
                          }`}
                        >
                          {source.is_active ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredSources.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No RSS sources found</h3>
                  <p className="text-gray-500">
                    {rssSources.length === 0 
                      ? "No RSS sources configured yet"
                      : "No sources match your search criteria"
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'leagues' && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLeagues.map(league => (
                  <div key={league.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-2xl">{getCountryFlag(league.country)}</span>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{league.name}</h3>
                        <p className="text-sm text-gray-500">{league.country}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        league.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {league.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm">
                      {league.season && (
                        <div>
                          <span className="font-medium text-gray-700">Season:</span>
                          <span className="ml-1 text-gray-600">{league.season}</span>
                        </div>
                      )}
                      {league.api_source && (
                        <div>
                          <span className="font-medium text-gray-700">Source:</span>
                          <span className="ml-1 text-gray-600">{league.api_source}</span>
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-gray-700">Priority:</span>
                        <span className="ml-1 text-gray-600">#{league.priority}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="text-sm text-gray-500">
                        {teams.filter(team => team.league_id === league.id).length} teams discovered
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredLeagues.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">⚽</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No leagues found</h3>
                  <p className="text-gray-500">
                    {leagues.length === 0 
                      ? "No leagues discovered yet from RSS feeds and APIs"
                      : "No leagues match your search criteria"
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'teams' && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTeams.map(team => {
                  const league = leagues.find(l => l.id === team.league_id);
                  return (
                    <div key={team.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="text-2xl">{getCountryFlag(team.country)}</span>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                          <p className="text-sm text-gray-500">{league?.name || 'Unknown League'}</p>
                        </div>
                        {team.is_local && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            Local
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-gray-500">
                        <div>
                          <span className="font-medium text-gray-700">Country:</span>
                          <span className="ml-1">{team.country}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredTeams.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">🏃‍♂️</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No teams found</h3>
                  <p className="text-gray-500">
                    {teams.length === 0 
                      ? "No teams discovered yet from RSS feeds and APIs"
                      : "No teams match your search criteria"
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 