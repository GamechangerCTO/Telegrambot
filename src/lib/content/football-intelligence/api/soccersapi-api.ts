/**
 * ⚽ SOCCERSAPI CLIENT
 * Professional API client for SoccersAPI.com
 */

import { TeamSearchResult, Match } from '../types/football-types';

export interface SoccersAPITeam {
  team_key: string;
  team_name: string;
  team_country: string;
  team_logo?: string;
  team_badge?: string;
}

export interface SoccersAPIMatch {
  match_id: string;
  country_id: string;
  country_name: string;
  league_id: string;
  league_name: string;
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
  league_logo?: string;
  country_logo?: string;
  league_year?: string;
  fk_stage_key?: string;
  stage_name?: string;
}

export interface SoccersAPIResponse {
  success: number;
  data?: SoccersAPIMatch[];
  teams?: SoccersAPITeam[];
  error?: string;
}

const BASE_URL = 'https://api.soccersapi.com/v2.2';

export class SoccersAPI {
  private user: string;
  private token: string;
  private baseUrl = BASE_URL;

  constructor(token: string, username: string) {
    this.token = token;
    this.user = username;
    console.log('⚽ SoccersAPI initialized');
  }

  /**
   * Make authenticated request to SoccersAPI
   */
  private async makeRequest(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    // Add authentication parameters
    url.searchParams.append('user', this.user);
    url.searchParams.append('token', this.token);
    
    // Add additional parameters
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    console.log(`🔍 SoccersAPI: ${url.toString()}`);

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ SoccersAPI Response: ${response.status} - ${errorText}`);
      throw new Error(`SoccersAPI error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Search for team by name
   */
  async searchTeam(teamName: string): Promise<TeamSearchResult | null> {
    try {
      console.log(`🔍 SoccersAPI: Searching for team ${teamName}`);
      
      // SoccersAPI doesn't have direct team search, but we can get teams by country
      // For now, we'll use a simplified approach
      const data = await this.makeRequest('/teams/', { t: 'list' });
      
      if (data.success && data.teams && Array.isArray(data.teams)) {
        const team = data.teams.find((t: SoccersAPITeam) => 
          t.team_name.toLowerCase().includes(teamName.toLowerCase())
        );
        
        if (team) {
          return {
            id: team.team_key,
            name: team.team_name,
            country: team.team_country,
            league: '' // SoccersAPI doesn't provide league in team search
          };
        }
      }

      return null;

    } catch (error) {
      console.error(`❌ SoccersAPI search error for ${teamName}:`, error);
      return null;
    }
  }

  /**
   * Get team last matches
   */
  async getTeamLastMatches(teamId: string, limit: number = 5): Promise<Match[]> {
    try {
      console.log(`📊 SoccersAPI: Getting last ${limit} matches for team ${teamId}`);
      
      const today = new Date();
      const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const data = await this.makeRequest('/fixtures/', {
        t: 'schedule',
        d: `${lastMonth.toISOString().split('T')[0]}:${today.toISOString().split('T')[0]}`
      });
      
      if (data.success && data.data && Array.isArray(data.data)) {
        const teamMatches = data.data.filter((match: SoccersAPIMatch) => 
          match.match_hometeam_id === teamId || match.match_awayteam_id === teamId
        );

        const matches: Match[] = teamMatches
          .filter((match: SoccersAPIMatch) => match.match_status === 'Finished')
          .slice(0, limit)
          .map((match: SoccersAPIMatch) => ({
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

        console.log(`✅ Found ${matches.length} matches from SoccersAPI`);
        return matches;
      }

      return [];

    } catch (error) {
      console.error(`❌ SoccersAPI matches error for team ${teamId}:`, error);
      return [];
    }
  }

  /**
   * Get upcoming matches for a team
   */
  async getTeamUpcomingMatches(teamId: string, limit: number = 5): Promise<Match[]> {
    try {
      console.log(`📊 SoccersAPI: Getting upcoming ${limit} matches for team ${teamId}`);
      
      const today = new Date();
      const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const data = await this.makeRequest('/fixtures/', {
        t: 'schedule',
        d: `${today.toISOString().split('T')[0]}:${nextMonth.toISOString().split('T')[0]}`
      });
      
      if (data.success && data.data && Array.isArray(data.data)) {
        const teamMatches = data.data.filter((match: SoccersAPIMatch) => 
          match.match_hometeam_id === teamId || match.match_awayteam_id === teamId
        );

        const matches: Match[] = teamMatches
          .filter((match: SoccersAPIMatch) => 
            match.match_status === 'Not Started' || 
            match.match_status === 'Scheduled' ||
            match.match_status === ''
          )
          .slice(0, limit)
          .map((match: SoccersAPIMatch) => ({
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

        console.log(`✅ Found ${matches.length} upcoming matches from SoccersAPI`);
        return matches;
      }

      return [];

    } catch (error) {
      console.error(`❌ SoccersAPI upcoming matches error for team ${teamId}:`, error);
      return [];
    }
  }

  /**
   * Get live matches
   */
  async getLiveMatches(limit: number = 10): Promise<Match[]> {
    try {
      console.log(`📊 SoccersAPI: Getting live matches`);
      
      const data = await this.makeRequest('/livescores/', { t: 'live' });
      
      if (data.success && data.data && Array.isArray(data.data)) {
        const matches: Match[] = data.data
          .slice(0, limit)
          .map((match: SoccersAPIMatch) => ({
            match_id: match.match_id,
            match_date: match.match_date,
            match_hometeam_name: match.match_hometeam_name,
            match_awayteam_name: match.match_awayteam_name,
            match_hometeam_score: parseInt(match.match_hometeam_score) || 0,
            match_awayteam_score: parseInt(match.match_awayteam_score) || 0,
            match_status: 'Live',
            league_name: match.league_name,
            match_time: match.match_time,
            match_hometeam_id: match.match_hometeam_id,
            match_awayteam_id: match.match_awayteam_id
          }));

        console.log(`✅ Found ${matches.length} live matches from SoccersAPI`);
        return matches;
      }

      return [];

    } catch (error) {
      console.error(`❌ SoccersAPI live matches error:`, error);
      return [];
    }
  }

  /**
   * Get today's matches
   */
  async getTodayMatches(limit: number = 20): Promise<Match[]> {
    try {
      console.log(`📊 SoccersAPI: Getting today's matches`);
      
      const data = await this.makeRequest('/livescores/', { t: 'today' });
      
      if (data.success && data.data && Array.isArray(data.data)) {
        const matches: Match[] = data.data
          .slice(0, limit)
          .map((match: SoccersAPIMatch) => ({
            match_id: match.match_id,
            match_date: match.match_date,
            match_hometeam_name: match.match_hometeam_name,
            match_awayteam_name: match.match_awayteam_name,
            match_hometeam_score: parseInt(match.match_hometeam_score) || 0,
            match_awayteam_score: parseInt(match.match_awayteam_score) || 0,
            match_status: this.normalizeStatus(match.match_status),
            league_name: match.league_name,
            match_time: match.match_time,
            match_hometeam_id: match.match_hometeam_id,
            match_awayteam_id: match.match_awayteam_id
          }));

        console.log(`✅ Found ${matches.length} today's matches from SoccersAPI`);
        return matches;
      }

      return [];

    } catch (error) {
      console.error(`❌ SoccersAPI today's matches error:`, error);
      return [];
    }
  }

  /**
   * Get matches by date range
   */
  async getMatchesByDateRange(fromDate: string, toDate: string, limit: number = 50): Promise<Match[]> {
    try {
      console.log(`📊 SoccersAPI: Getting matches from ${fromDate} to ${toDate}`);
      
      const data = await this.makeRequest('/fixtures/', {
        t: 'schedule',
        d: `${fromDate}:${toDate}`
      });
      
      if (data.success && data.data && Array.isArray(data.data)) {
        const matches: Match[] = data.data
          .slice(0, limit)
          .map((match: SoccersAPIMatch) => ({
            match_id: match.match_id,
            match_date: match.match_date,
            match_hometeam_name: match.match_hometeam_name,
            match_awayteam_name: match.match_awayteam_name,
            match_hometeam_score: parseInt(match.match_hometeam_score) || 0,
            match_awayteam_score: parseInt(match.match_awayteam_score) || 0,
            match_status: this.normalizeStatus(match.match_status),
            league_name: match.league_name,
            match_time: match.match_time,
            match_hometeam_id: match.match_hometeam_id,
            match_awayteam_id: match.match_awayteam_id
          }));

        console.log(`✅ Found ${matches.length} matches from SoccersAPI`);
        return matches;
      }

      return [];

    } catch (error) {
      console.error(`❌ SoccersAPI date range matches error:`, error);
      return [];
    }
  }

  /**
   * Get head-to-head matches
   */
  async getHeadToHead(team1Name: string, team2Name: string): Promise<Match[]> {
    try {
      console.log(`🔄 SoccersAPI: Searching H2H ${team1Name} vs ${team2Name}`);
      
      // Get matches for both teams and filter
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

      console.log(`✅ Found ${h2hMatches.length} H2H matches from SoccersAPI`);
      return h2hMatches;

    } catch (error) {
      console.error(`❌ SoccersAPI H2H error:`, error);
      return [];
    }
  }

  /**
   * Normalize match status
   */
  private normalizeStatus(status: string): string {
    switch (status.toLowerCase()) {
      case 'finished':
      case 'match finished':
        return 'Finished';
      case 'live':
      case 'in play':
        return 'Live';
      case 'not started':
      case 'scheduled':
      case '':
        return 'Scheduled';
      case 'postponed':
        return 'Postponed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const data = await this.makeRequest('/livescores/', { t: 'today' });
      return data.success === 1;
    } catch {
      return false;
    }
  }
}

export async function checkSoccersAPIHealth(token: string, username: string): Promise<boolean> {
  try {
    const api = new SoccersAPI(token, username);
    return await api.healthCheck();
  } catch (error) {
    console.error('❌ SoccersAPI health check failed:', error);
    return false;
  }
}