/**
 * ⚽ APIFOOTBALL.COM CLIENT
 * Professional API client for APIFootball.com
 */

import { TeamSearchResult, Match } from '../types/football-types';

export interface APIFootballCountry {
  country_id: string;
  country_name: string;
  country_logo?: string;
}

export interface APIFootballLeague {
  country_id: string;
  country_name: string;
  league_id: string;
  league_name: string;
  league_season: string;
  league_logo?: string;
  country_logo?: string;
}

export interface APIFootballTeam {
  team_key: string;
  team_name: string;
  team_country: string;
  team_founded: string;
  team_badge?: string;
  venue?: {
    venue_name?: string;
    venue_address?: string;
    venue_city?: string;
    venue_capacity?: string;
    venue_surface?: string;
  };
  players?: APIFootballPlayer[];
}

export interface APIFootballPlayer {
  player_key: string;
  player_name: string;
  player_number: string;
  player_country: string;
  player_type: string;
  player_age: string;
  player_match_played: string;
  player_goals: string;
  player_yellow_cards: string;
  player_red_cards: string;
  player_image?: string;
}

export interface APIFootballMatch {
  match_id: string;
  country_id: string;
  country_name: string;
  league_id: string;
  league_name: string;
  league_season: string;
  league_logo?: string;
  country_logo?: string;
  match_date: string;
  match_status: string;
  match_time: string;
  match_hometeam_id: string;
  match_hometeam_name: string;
  match_hometeam_score: string;
  match_awayteam_id: string;
  match_awayteam_name: string;
  match_awayteam_score: string;
  match_hometeam_halftime_score?: string;
  match_awayteam_halftime_score?: string;
  match_hometeam_extra_score?: string;
  match_awayteam_extra_score?: string;
  match_hometeam_penalty_score?: string;
  match_awayteam_penalty_score?: string;
  match_hometeam_ft_score?: string;
  match_awayteam_ft_score?: string;
  match_hometeam_system?: string;
  match_awayteam_system?: string;
  match_live: string;
  match_round?: string;
  match_stadium?: string;
  match_referee?: string;
  team_home_badge?: string;
  team_away_badge?: string;
  match_week?: string;
}

const BASE_URL = 'https://apiv3.apifootball.com';

export class APIFootballComAPI {
  private apiKey: string;
  private baseUrl = BASE_URL;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    console.log('⚽ APIFootball.com initialized');
  }

  /**
   * Make authenticated request to APIFootball.com
   */
  private async makeRequest(action: string, params: Record<string, string> = {}): Promise<any> {
    const url = new URL(this.baseUrl);
    
    // Add action and API key
    url.searchParams.append('action', action);
    url.searchParams.append('APIkey', this.apiKey);
    
    // Add additional parameters
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    console.log(`🔍 APIFootball.com: ${url.toString()}`);

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ APIFootball.com Response: ${response.status} - ${errorText}`);
      throw new Error(`APIFootball.com error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Get countries
   */
  async getCountries(): Promise<APIFootballCountry[]> {
    try {
      console.log(`🌍 APIFootball.com: Getting countries`);
      
      const data = await this.makeRequest('get_countries');
      
      if (Array.isArray(data)) {
        console.log(`✅ Found ${data.length} countries from APIFootball.com`);
        return data;
      }

      return [];

    } catch (error) {
      console.error(`❌ APIFootball.com countries error:`, error);
      return [];
    }
  }

  /**
   * Get leagues
   */
  async getLeagues(countryId?: string): Promise<APIFootballLeague[]> {
    try {
      console.log(`🏆 APIFootball.com: Getting leagues${countryId ? ` for country ${countryId}` : ''}`);
      
      const params: Record<string, string> = {};
      if (countryId) params.country_id = countryId;
      
      const data = await this.makeRequest('get_leagues', params);
      
      if (Array.isArray(data)) {
        console.log(`✅ Found ${data.length} leagues from APIFootball.com`);
        return data;
      }

      return [];

    } catch (error) {
      console.error(`❌ APIFootball.com leagues error:`, error);
      return [];
    }
  }

  /**
   * Get teams by league
   */
  async getTeamsByLeague(leagueId: string): Promise<APIFootballTeam[]> {
    try {
      console.log(`👥 APIFootball.com: Getting teams for league ${leagueId}`);
      
      const data = await this.makeRequest('get_teams', { league_id: leagueId });
      
      if (Array.isArray(data)) {
        console.log(`✅ Found ${data.length} teams from APIFootball.com`);
        return data;
      }

      return [];

    } catch (error) {
      console.error(`❌ APIFootball.com teams error:`, error);
      return [];
    }
  }

  /**
   * Get team details
   */
  async getTeamDetails(teamId: string): Promise<APIFootballTeam | null> {
    try {
      console.log(`👥 APIFootball.com: Getting team details for ${teamId}`);
      
      const data = await this.makeRequest('get_teams', { team_id: teamId });
      
      if (Array.isArray(data) && data.length > 0) {
        console.log(`✅ Found team details from APIFootball.com`);
        return data[0];
      }

      return null;

    } catch (error) {
      console.error(`❌ APIFootball.com team details error:`, error);
      return null;
    }
  }

  /**
   * Search for team by name
   */
  async searchTeam(teamName: string): Promise<TeamSearchResult | null> {
    try {
      console.log(`🔍 APIFootball.com: Searching for team ${teamName}`);
      
      // APIFootball.com doesn't have direct team search, so we need to search through leagues
      // For now, we'll try major leagues and search through teams
      const majorLeagues = ['152', '207', '175', '168', '302']; // Premier League, La Liga, Serie A, Bundesliga, Ligue 1
      
      for (const leagueId of majorLeagues) {
        const teams = await this.getTeamsByLeague(leagueId);
        const team = teams.find(t => 
          t.team_name.toLowerCase().includes(teamName.toLowerCase())
        );
        
        if (team) {
          return {
            id: team.team_key,
            name: team.team_name,
            country: team.team_country,
            league: '' // Will be filled by league context
          };
        }
      }

      return null;

    } catch (error) {
      console.error(`❌ APIFootball.com search error for ${teamName}:`, error);
      return null;
    }
  }

  /**
   * Get events/matches by date range
   */
  async getEventsByDateRange(fromDate: string, toDate: string): Promise<APIFootballMatch[]> {
    try {
      console.log(`📊 APIFootball.com: Getting events from ${fromDate} to ${toDate}`);
      
      const data = await this.makeRequest('get_events', {
        from: fromDate,
        to: toDate
      });
      
      if (Array.isArray(data)) {
        console.log(`✅ Found ${data.length} events from APIFootball.com`);
        return data;
      }

      return [];

    } catch (error) {
      console.error(`❌ APIFootball.com events error:`, error);
      return [];
    }
  }

  /**
   * Get live matches
   */
  async getLiveMatches(): Promise<APIFootballMatch[]> {
    try {
      console.log(`📊 APIFootball.com: Getting live matches`);
      
      const data = await this.makeRequest('get_events', {
        match_live: '1'
      });
      
      if (Array.isArray(data)) {
        console.log(`✅ Found ${data.length} live matches from APIFootball.com`);
        return data;
      }

      return [];

    } catch (error) {
      console.error(`❌ APIFootball.com live matches error:`, error);
      return [];
    }
  }

  /**
   * Get matches by league
   */
  async getMatchesByLeague(leagueId: string, fromDate?: string, toDate?: string): Promise<APIFootballMatch[]> {
    try {
      console.log(`📊 APIFootball.com: Getting matches for league ${leagueId}`);
      
      const params: Record<string, string> = { league_id: leagueId };
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      
      const data = await this.makeRequest('get_events', params);
      
      if (Array.isArray(data)) {
        console.log(`✅ Found ${data.length} league matches from APIFootball.com`);
        return data;
      }

      return [];

    } catch (error) {
      console.error(`❌ APIFootball.com league matches error:`, error);
      return [];
    }
  }

  /**
   * Get team last matches
   */
  async getTeamLastMatches(teamId: string, limit: number = 5): Promise<Match[]> {
    try {
      console.log(`📊 APIFootball.com: Getting last ${limit} matches for team ${teamId}`);
      
      const today = new Date();
      const pastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const fromDate = pastMonth.toISOString().split('T')[0];
      const toDate = today.toISOString().split('T')[0];
      
      const events = await this.getEventsByDateRange(fromDate, toDate);
      
      const teamMatches = events.filter(match => 
        match.match_hometeam_id === teamId || match.match_awayteam_id === teamId
      );

      const matches: Match[] = teamMatches
        .filter(match => match.match_status === 'Finished')
        .slice(-limit) // Get last N matches
        .map(match => ({
          match_id: match.match_id,
          match_date: match.match_date,
          match_hometeam_name: match.match_hometeam_name,
          match_awayteam_name: match.match_awayteam_name,
          match_hometeam_score: parseInt(match.match_hometeam_score) || 0,
          match_awayteam_score: parseInt(match.match_awayteam_score) || 0,
          match_status: 'Finished',
          league_name: match.league_name,
          match_time: match.match_time,
          match_hometeam_id: match.match_hometeam_id,
          match_awayteam_id: match.match_awayteam_id
        }));

      console.log(`✅ Found ${matches.length} matches from APIFootball.com`);
      return matches;

    } catch (error) {
      console.error(`❌ APIFootball.com matches error for team ${teamId}:`, error);
      return [];
    }
  }

  /**
   * Get upcoming matches for a team
   */
  async getTeamUpcomingMatches(teamId: string, limit: number = 5): Promise<Match[]> {
    try {
      console.log(`📊 APIFootball.com: Getting upcoming ${limit} matches for team ${teamId}`);
      
      const today = new Date();
      const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const fromDate = today.toISOString().split('T')[0];
      const toDate = nextMonth.toISOString().split('T')[0];
      
      const events = await this.getEventsByDateRange(fromDate, toDate);
      
      const teamMatches = events.filter(match => 
        match.match_hometeam_id === teamId || match.match_awayteam_id === teamId
      );

      const matches: Match[] = teamMatches
        .filter(match => 
          match.match_status === '' || 
          match.match_status === 'Not Started' ||
          match.match_status === 'Scheduled'
        )
        .slice(0, limit)
        .map(match => ({
          match_id: match.match_id,
          match_date: match.match_date,
          match_hometeam_name: match.match_hometeam_name,
          match_awayteam_name: match.match_awayteam_name,
          match_hometeam_score: 0,
          match_awayteam_score: 0,
          match_status: 'Scheduled',
          league_name: match.league_name,
          match_time: match.match_time,
          match_hometeam_id: match.match_hometeam_id,
          match_awayteam_id: match.match_awayteam_id
        }));

      console.log(`✅ Found ${matches.length} upcoming matches from APIFootball.com`);
      return matches;

    } catch (error) {
      console.error(`❌ APIFootball.com upcoming matches error for team ${teamId}:`, error);
      return [];
    }
  }

  /**
   * Get head-to-head matches
   */
  async getHeadToHead(team1Name: string, team2Name: string): Promise<Match[]> {
    try {
      console.log(`🔄 APIFootball.com: Searching H2H ${team1Name} vs ${team2Name}`);
      
      const team1 = await this.searchTeam(team1Name);
      const team2 = await this.searchTeam(team2Name);
      
      if (!team1 || !team2) {
        console.log(`⚠️ Could not find both teams for H2H`);
        return [];
      }

      const team1Matches = await this.getTeamLastMatches(team1.id, 50);
      
      const h2hMatches = team1Matches.filter(match => 
        match.match_hometeam_name.toLowerCase().includes(team2Name.toLowerCase()) ||
        match.match_awayteam_name.toLowerCase().includes(team2Name.toLowerCase())
      );

      console.log(`✅ Found ${h2hMatches.length} H2H matches from APIFootball.com`);
      return h2hMatches;

    } catch (error) {
      console.error(`❌ APIFootball.com H2H error:`, error);
      return [];
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const countries = await this.getCountries();
      return Array.isArray(countries) && countries.length > 0;
    } catch {
      return false;
    }
  }
}

export async function checkAPIFootballComHealth(apiKey: string): Promise<boolean> {
  try {
    const api = new APIFootballComAPI(apiKey);
    return await api.healthCheck();
  } catch (error) {
    console.error('❌ APIFootball.com health check failed:', error);
    return false;
  }
}