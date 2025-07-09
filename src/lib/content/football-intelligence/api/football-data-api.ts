/**
 * 🏆 FOOTBALL-DATA.ORG API CLIENT  
 * Professional API client for Football-Data.org (European leagues)
 * API Documentation: https://www.football-data.org/documentation/api
 * Base URL: https://api.football-data.org/v4
 * Authentication: X-Auth-Token header required
 */

import { TeamSearchResult, Match } from '../types/football-types';
import { apiCoordinator } from '../utils/api-coordinator';

export class FootballDataAPI {
  private apiKey: string;
  private baseUrl = 'https://api.football-data.org/v4';
  private competitions = ['PL', 'PD', 'BL1', 'SA', 'FL1', 'CL', 'EL']; // Major competitions

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    console.log('🏆 Football-Data.org API initialized with API key');
  }

  /**
   * Get headers for Football-Data.org API v4
   */
  private getHeaders() {
    return {
      'X-Auth-Token': this.apiKey,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Coordinated fetch method with proper rate limiting and queuing
   */
  private async coordinatedFetch(url: string, priority: number = 1): Promise<Response> {
    return apiCoordinator.makeRequest({
      url,
      options: {
        headers: this.getHeaders()
      },
      apiName: 'football-data',
      priority
    });
  }

  /**
   * Search for team by name across competitions (sequential to avoid rate limits)
   */
  async searchTeam(teamName: string): Promise<TeamSearchResult | null> {
    try {
      console.log(`🔍 Football-Data: Searching for team ${teamName} (sequential search)`);
      
      // Search competitions in order of priority
      const priorityCompetitions = ['PL', 'CL', 'EL', 'PD', 'BL1', 'SA', 'FL1'];
      
      for (const competitionCode of priorityCompetitions) {
        try {
          const url = `${this.baseUrl}/competitions/${competitionCode}/teams`;
          const response = await this.coordinatedFetch(url, 2); // Higher priority for team search

          if (!response.ok) {
            if (response.status === 429) {
              console.log(`⏳ Rate limited on ${competitionCode}, waiting before continuing`);
              await this.sleep(2000); // Wait 2 seconds on rate limit
              continue;
            }
            console.log(`❌ Football-Data ${competitionCode} teams failed: ${response.status}`);
            continue;
          }

          const data = await response.json();
          
          if (data.teams && Array.isArray(data.teams)) {
            // Find exact match first
            const exactMatch = data.teams.find((team: any) => 
              team.name.toLowerCase() === teamName.toLowerCase() ||
              team.shortName?.toLowerCase() === teamName.toLowerCase()
            );
            
            if (exactMatch) {
              console.log(`✅ Found ${teamName} in ${competitionCode} with ID: ${exactMatch.id}`);
              return {
                id: exactMatch.id.toString(),
                name: exactMatch.name,
                league: competitionCode,
                country: exactMatch.area?.name
              };
            }

            // Find partial match
            const partialMatch = data.teams.find((team: any) =>
              team.name.toLowerCase().includes(teamName.toLowerCase()) ||
              teamName.toLowerCase().includes(team.name.toLowerCase()) ||
              (team.shortName && team.shortName.toLowerCase().includes(teamName.toLowerCase()))
            );

            if (partialMatch) {
              console.log(`✅ Found ${teamName} in ${competitionCode} with ID: ${partialMatch.id} (partial match)`);
              return {
                id: partialMatch.id.toString(),
                name: partialMatch.name,
                league: competitionCode,
                country: partialMatch.area?.name
              };
            }
          }

          // Small delay between competition searches to be respectful
          await this.sleep(500);

        } catch (competitionError) {
          console.error(`❌ Error searching ${competitionCode}:`, competitionError);
          // Continue with next competition even on error
          continue;
        }
      }

      console.log(`❌ No team found in any competition for: ${teamName}`);
      return null;

    } catch (error) {
      console.error(`❌ Football-Data search error for ${teamName}:`, error);
      return null;
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get team last 5 matches
   */
  async getTeamLastMatches(teamId: string, limit: number = 5): Promise<Match[]> {
    try {
      console.log(`📊 Football-Data: Getting last ${limit} matches for team ${teamId}`);
      
      const response = await this.coordinatedFetch(`${this.baseUrl}/teams/${teamId}/matches?status=FINISHED&limit=${limit}`, 3); // High priority for match data

      if (!response.ok) {
        console.log(`❌ Football-Data matches failed: ${response.status}`);
        return [];
      }

      const data = await response.json();
      const matches = data.matches || [];
      
      const convertedMatches: Match[] = matches.slice(0, limit).map((match: any) => ({
        match_id: match.id?.toString(),
        match_date: match.utcDate,
        match_hometeam_name: match.homeTeam?.name,
        match_awayteam_name: match.awayTeam?.name,
        match_hometeam_score: match.score?.fullTime?.home || 0,
        match_awayteam_score: match.score?.fullTime?.away || 0,
        match_status: 'Finished',
        league_name: match.competition?.name,
        match_time: match.utcDate,
        match_hometeam_id: match.homeTeam?.id?.toString(),
        match_awayteam_id: match.awayTeam?.id?.toString()
      }));
      
      console.log(`✅ Found ${convertedMatches.length} matches from Football-Data`);
      return convertedMatches;

    } catch (error) {
      console.error(`❌ Football-Data matches error for team ${teamId}:`, error);
      return [];
    }
  }

  /**
   * Get team details
   */
  async getTeamDetails(teamId: string): Promise<any | null> {
    try {
      const response = await this.coordinatedFetch(`${this.baseUrl}/teams/${teamId}`, 1); // Normal priority for team details
      
      if (!response.ok) return null;

      const data = await response.json();
      return data;

    } catch (error) {
      console.error(`❌ Football-Data team details error for ${teamId}:`, error);
      return null;
    }
  }

  /**
   * Get head-to-head matches (using both teams' recent matches)
   */
  async getHeadToHead(team1Id: string, team2Id: string, team1Name: string, team2Name: string): Promise<Match[]> {
    try {
      console.log(`🔄 Football-Data: Getting H2H for teams ${team1Id} vs ${team2Id}`);
      
      // Get more matches for H2H analysis
      const [team1Matches, team2Matches] = await Promise.all([
        this.getTeamLastMatches(team1Id, 20),
        this.getTeamLastMatches(team2Id, 20)
      ]);

      // Find H2H matches by cross-referencing
      const h2hMatches: Match[] = [];
      
      team1Matches.forEach(match => {
        const isH2H = (
          match.match_hometeam_name?.toLowerCase().includes(team2Name.toLowerCase()) ||
          match.match_awayteam_name?.toLowerCase().includes(team2Name.toLowerCase())
        );
        
        if (isH2H) {
          h2hMatches.push(match);
        }
      });

      // Also check team2 matches for additional H2H
      team2Matches.forEach(match => {
        const isH2H = (
          match.match_hometeam_name?.toLowerCase().includes(team1Name.toLowerCase()) ||
          match.match_awayteam_name?.toLowerCase().includes(team1Name.toLowerCase())
        );
        
        if (isH2H && !h2hMatches.find(existing => existing.match_id === match.match_id)) {
          h2hMatches.push(match);
        }
      });

      console.log(`✅ Found ${h2hMatches.length} H2H matches from Football-Data`);
      return h2hMatches.slice(-10); // Last 10 H2H meetings

    } catch (error) {
      console.error(`❌ Football-Data H2H error:`, error);
      return [];
    }
  }

  /**
   * Get competition teams
   */
  async getCompetitionTeams(competitionCode: string): Promise<any[]> {
    try {
      const response = await this.coordinatedFetch(`${this.baseUrl}/competitions/${competitionCode}/teams`, 1); // Normal priority
      
      if (!response.ok) return [];

      const data = await response.json();
      return data.teams || [];

    } catch (error) {
      console.error(`❌ Football-Data competition teams error:`, error);
      return [];
    }
  }

  /**
   * Get available competitions
   */
  async getCompetitions(): Promise<any[]> {
    try {
      const response = await this.coordinatedFetch(`${this.baseUrl}/competitions`, 1); // Normal priority
      
      if (!response.ok) return [];

      const data = await response.json();
      return data.competitions || [];

    } catch (error) {
      console.error(`❌ Football-Data competitions error:`, error);
      return [];
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.coordinatedFetch(`${this.baseUrl}/competitions`, 0); // Low priority for health check
      
      return response.ok;

    } catch (error) {
      console.error('❌ Football-Data health check failed:', error);
      return false;
    }
  }
}

// Singleton instance using environment variable (fixed name)
const apiKey = process.env.FOOTBALL_DATA_API_KEY;

export const footballDataAPI = apiKey ? new FootballDataAPI(apiKey) : null;

if (apiKey) {
  console.log('✅ Football-Data.org API client ready');
} else {
  console.log('⚠️ FOOTBALL_DATA_API_KEY not found - Football-Data.org API disabled');
} 