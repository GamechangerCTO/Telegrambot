/**
 * 🎯 FOOTBALL API MANAGER
 * Central API coordinator that manages all football data sources
 */

import { APIKeys, TeamSearchResult, Match, HeadToHeadData } from '../types/football-types';
import { FootballDataAPI } from './football-data-api';
import { TheSportsDbAPI } from './thesportsdb-api';
import { SoccersAPI } from './soccersapi-api';
import { APIFootballAPI } from './api-football-api';
import { APIFootballComAPI } from './apifootball-com-api';

export class FootballAPIManager {
  private footballDataAPI?: FootballDataAPI;
  private theSportsDbAPI?: TheSportsDbAPI;
  private apiFootballAPI?: APIFootballAPI;
  private apiFootballComAPI?: APIFootballComAPI;
  private soccersAPI?: SoccersAPI;
  private apiFootballRapidAPI?: any; // Will be created later

  constructor(apiKeys: Partial<APIKeys>) {
    console.log('🎯 Football API Manager initializing...');
    
    // Initialize available APIs
    if (apiKeys['football-data-org']) {
      this.footballDataAPI = new FootballDataAPI(apiKeys['football-data-org']);
    }
    
    if (apiKeys['thesportsdb']) {
      this.theSportsDbAPI = new TheSportsDbAPI(apiKeys['thesportsdb']);
    }
    
    if (apiKeys['soccersapi'] && apiKeys['soccersapi-username']) {
      this.soccersAPI = new SoccersAPI(apiKeys['soccersapi'], apiKeys['soccersapi-username']);
    }
    
    if (apiKeys['api-football']) {
      this.apiFootballAPI = new APIFootballAPI(apiKeys['api-football']);
    }
    
    if (apiKeys['apifootball']) {
      this.apiFootballComAPI = new APIFootballComAPI(apiKeys['apifootball']);
    }
    
    // TODO: Initialize other APIs
    // if (apiKeys['api-football-rapid']) { this.apiFootballRapidAPI = new APIFootballRapidAPI(apiKeys['api-football-rapid']); }
    
    console.log(`✅ Football API Manager initialized with ${this.getAvailableAPIs().length} APIs`);
  }

  /**
   * Search for team across all available APIs
   * Returns first successful result
   */
  async findTeam(teamName: string): Promise<TeamSearchResult | null> {
    console.log(`🔍 Searching for team: ${teamName} across all APIs`);

    // Try APIs in order of reliability and data quality - API-Football ראשון
    const searchPromises: Promise<TeamSearchResult | null>[] = [];

    // 1. API-Football (Best comprehensive data, הכי מפורט)
    if (this.apiFootballAPI) {
      searchPromises.push(
        this.apiFootballAPI.searchTeam(teamName).catch(() => null)
      );
    }

    // 2. Football-Data.org (European leagues, very reliable)
    if (this.footballDataAPI) {
      searchPromises.push(
        this.footballDataAPI.searchTeam(teamName).catch(() => null)
      );
    }

    // 3. TheSportsDB (Global coverage, good reliability)  
    if (this.theSportsDbAPI) {
      searchPromises.push(
        this.theSportsDbAPI.searchTeam(teamName).catch(() => null)
      );
    }

    // 4. APIFootball.com (Additional coverage)
    if (this.apiFootballComAPI) {
      searchPromises.push(
        this.apiFootballComAPI.searchTeam(teamName).catch(() => null)
      );
    }

    // 5. SoccersAPI (Comprehensive data)
    if (this.soccersAPI) {
      searchPromises.push(
        this.soccersAPI.searchTeam(teamName).catch(() => null)
      );
    }

    // 5. Other APIs (to be added)
    // if (this.apiFootballRapidAPI) { searchPromises.push(this.apiFootballRapidAPI.searchTeam(teamName).catch(() => null)); }

    // Execute searches in parallel but return first successful result
    try {
      const results = await Promise.allSettled(searchPromises);
      
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          console.log(`✅ Found ${teamName} with ID: ${result.value.id} from ${result.value.league || 'unknown league'}`);
          return result.value;
        }
      }

      console.log(`❌ Team ${teamName} not found in any API`);
      return null;

    } catch (error) {
      console.error(`❌ Error searching for team ${teamName}:`, error);
      return null;
    }
  }

  /**
   * Get team matches from best available source
   */
  async getTeamMatches(teamId: string, teamName: string, limit: number = 5): Promise<Match[]> {
    console.log(`📊 Getting ${limit} matches for team ${teamName} (ID: ${teamId})`);

    // Try APIs in order of data quality - API-Football ראשון
    const sources = [
      { name: 'API-Football', api: this.apiFootballAPI },
      { name: 'Football-Data', api: this.footballDataAPI },
      { name: 'TheSportsDB', api: this.theSportsDbAPI },
      { name: 'APIFootball.com', api: this.apiFootballComAPI },
      { name: 'SoccersAPI', api: this.soccersAPI }
    ];

    for (const source of sources) {
      if (source.api) {
        try {
          const matches = await source.api.getTeamLastMatches(teamId, limit);
          if (matches.length > 0) {
            console.log(`✅ Got ${matches.length} matches from ${source.name}`);
            return matches;
          }
        } catch (error) {
          console.log(`⚠️ ${source.name} failed for team ${teamName}:`, error);
          continue;
        }
      }
    }

    console.log(`❌ No matches found for team ${teamName} in any API`);
    return [];
  }

  /**
   * 🆕 Get upcoming team matches from best available source
   */
  async getTeamUpcomingMatches(teamId: string, teamName: string, limit: number = 5): Promise<Match[]> {
    console.log(`🔮 Getting ${limit} upcoming matches for team ${teamName} (ID: ${teamId})`);

    // Try APIs in order of data quality for upcoming matches
    const sources = [
      { name: 'API-Football', api: this.apiFootballAPI },
      { name: 'TheSportsDB', api: this.theSportsDbAPI },
      { name: 'Football-Data', api: this.footballDataAPI },
      { name: 'APIFootball.com', api: this.apiFootballComAPI },
      { name: 'SoccersAPI', api: this.soccersAPI }
    ];

    for (const source of sources) {
      if (source.api) {
        try {
          let matches: Match[] = [];
          
          // Check if the API has upcoming matches method
          if (source.name === 'API-Football' && 'getTeamUpcomingMatches' in source.api) {
            matches = await (source.api as any).getTeamUpcomingMatches(teamId, limit);
          } else if (source.name === 'TheSportsDB' && 'getTeamUpcomingMatches' in source.api) {
            matches = await (source.api as any).getTeamUpcomingMatches(teamId, limit);
          } else if (source.name === 'Football-Data' && 'getTeamUpcomingMatches' in source.api) {
            matches = await (source.api as any).getTeamUpcomingMatches(teamId, limit);
          } else if (source.name === 'APIFootball.com' && 'getTeamUpcomingMatches' in source.api) {
            matches = await (source.api as any).getTeamUpcomingMatches(teamId, limit);
          } else if (source.name === 'SoccersAPI' && 'getTeamUpcomingMatches' in source.api) {
            matches = await (source.api as any).getTeamUpcomingMatches(teamId, limit);
          }
          
          if (matches.length > 0) {
            console.log(`✅ Got ${matches.length} upcoming matches from ${source.name}`);
            return matches;
          }
        } catch (error) {
          console.log(`⚠️ ${source.name} failed for upcoming matches of team ${teamName}:`, error);
          continue;
        }
      }
    }

    console.log(`❌ No upcoming matches found for team ${teamName} in any API`);
    return [];
  }

  /**
   * 🆕 Get fixtures by date with intelligent fallback
   */
  async getFixturesByDate(date: string): Promise<Match[]> {
    console.log(`🎯 Getting fixtures for date: ${date}`);
    
    // Try API-Football first (most comprehensive)
    if (this.apiFootballAPI) {
      try {
        const matches = await this.apiFootballAPI.getFixturesByDate(date);
        if (matches.length > 0) {
          return matches;
        }
      } catch (error) {
        console.log(`⚠️ API-Football failed, trying alternatives...`);
      }
    }
    
    // Try other APIs...
    if (this.footballDataAPI) {
      try {
        // Football-Data doesn't have date-specific endpoint, skip
      } catch (error) {
        console.log(`⚠️ Football-Data failed...`);
      }
    }
    
    console.log(`❌ No fixtures found for date ${date}`);
    return [];
  }

  /**
   * Get league standings
   */
  async getStandings(leagueId: string, season: string): Promise<any[]> {
    console.log(`📊 Getting standings for league ${leagueId}, season ${season}`);
    
    // Try API-Football first
    if (this.apiFootballAPI) {
      try {
        const standings = await this.apiFootballAPI.getStandings(leagueId, season);
        if (standings.length > 0) {
          return standings;
        }
      } catch (error) {
        console.log(`⚠️ API-Football standings failed, trying alternatives...`);
      }
    }
    
    console.log(`❌ No standings found for league ${leagueId}`);
    return [];
  }

  /**
   * Get team statistics
   */
  async getTeamStatistics(teamId: string, leagueId: string, season: string): Promise<any[]> {
    console.log(`📊 Getting team statistics for ${teamId}`);
    
    // Try API-Football first
    if (this.apiFootballAPI) {
      try {
        const stats = await this.apiFootballAPI.getTeamStatistics(teamId, leagueId, season);
        if (stats.length > 0) {
          return stats;
        }
      } catch (error) {
        console.log(`⚠️ API-Football team statistics failed...`);
      }
    }
    
    console.log(`❌ No team statistics found for ${teamId}`);
    return [];
  }

  /**
   * Get fixture statistics
   */
  async getFixtureStatistics(fixtureId: string): Promise<any[]> {
    console.log(`📊 Getting fixture statistics for ${fixtureId}`);
    
    // Try API-Football first
    if (this.apiFootballAPI) {
      try {
        const stats = await this.apiFootballAPI.getFixtureStatistics(fixtureId);
        if (stats.length > 0) {
          return stats;
        }
      } catch (error) {
        console.log(`⚠️ API-Football fixture statistics failed...`);
      }
    }
    
    console.log(`❌ No fixture statistics found for ${fixtureId}`);
    return [];
  }

  /**
   * Get fixture events
   */
  async getFixtureEvents(fixtureId: string): Promise<any[]> {
    console.log(`⚡ Getting fixture events for ${fixtureId}`);
    
    // Try API-Football first
    if (this.apiFootballAPI) {
      try {
        const events = await this.apiFootballAPI.getFixtureEvents(fixtureId);
        if (events.length > 0) {
          return events;
        }
      } catch (error) {
        console.log(`⚠️ API-Football fixture events failed...`);
      }
    }
    
    console.log(`❌ No fixture events found for ${fixtureId}`);
    return [];
  }

  /**
   * Get fixture lineups
   */
  async getFixtureLineups(fixtureId: string): Promise<any[]> {
    console.log(`👥 Getting fixture lineups for ${fixtureId}`);
    
    // Try API-Football first
    if (this.apiFootballAPI) {
      try {
        const lineups = await this.apiFootballAPI.getFixtureLineups(fixtureId);
        if (lineups.length > 0) {
          return lineups;
        }
      } catch (error) {
        console.log(`⚠️ API-Football fixture lineups failed...`);
      }
    }
    
    console.log(`❌ No fixture lineups found for ${fixtureId}`);
    return [];
  }

  /**
   * Get team players
   */
  async getTeamPlayers(teamId: string, season: string): Promise<any[]> {
    console.log(`👨‍⚽ Getting players for team ${teamId}`);
    
    // Try API-Football first
    if (this.apiFootballAPI) {
      try {
        const players = await this.apiFootballAPI.getTeamPlayers(teamId, season);
        if (players.length > 0) {
          return players;
        }
      } catch (error) {
        console.log(`⚠️ API-Football team players failed...`);
      }
    }
    
    console.log(`❌ No players found for team ${teamId}`);
    return [];
  }

  /**
   * Get player statistics
   */
  async getPlayerStatistics(playerId: string, season: string): Promise<any[]> {
    console.log(`📊 Getting player statistics for ${playerId}`);
    
    // Try API-Football first
    if (this.apiFootballAPI) {
      try {
        const stats = await this.apiFootballAPI.getPlayerStatistics(playerId, season);
        if (stats.length > 0) {
          return stats;
        }
      } catch (error) {
        console.log(`⚠️ API-Football player statistics failed...`);
      }
    }
    
    console.log(`❌ No player statistics found for ${playerId}`);
    return [];
  }

  /**
   * Get top scorers
   */
  async getTopScorers(leagueId: string, season: string): Promise<any[]> {
    console.log(`🥇 Getting top scorers for league ${leagueId}`);
    
    // Try API-Football first
    if (this.apiFootballAPI) {
      try {
        const topScorers = await this.apiFootballAPI.getTopScorers(leagueId, season);
        if (topScorers.length > 0) {
          return topScorers;
        }
      } catch (error) {
        console.log(`⚠️ API-Football top scorers failed...`);
      }
    }
    
    console.log(`❌ No top scorers found for league ${leagueId}`);
    return [];
  }

  /**
   * Get top assists
   */
  async getTopAssists(leagueId: string, season: string): Promise<any[]> {
    console.log(`🎯 Getting top assists for league ${leagueId}`);
    
    // Try API-Football first
    if (this.apiFootballAPI) {
      try {
        const topAssists = await this.apiFootballAPI.getTopAssists(leagueId, season);
        if (topAssists.length > 0) {
          return topAssists;
        }
      } catch (error) {
        console.log(`⚠️ API-Football top assists failed...`);
      }
    }
    
    console.log(`❌ No top assists found for league ${leagueId}`);
    return [];
  }

  /**
   * Get transfers
   */
  async getTransfers(teamId?: string, playerId?: string): Promise<any[]> {
    console.log(`🔄 Getting transfers`);
    
    // Try API-Football first
    if (this.apiFootballAPI) {
      try {
        const transfers = await this.apiFootballAPI.getTransfers(teamId, playerId);
        if (transfers.length > 0) {
          return transfers;
        }
      } catch (error) {
        console.log(`⚠️ API-Football transfers failed...`);
      }
    }
    
    console.log(`❌ No transfers found`);
    return [];
  }

  /**
   * Get injuries
   */
  async getInjuries(leagueId?: string, season?: string, teamId?: string): Promise<any[]> {
    console.log(`🏥 Getting injuries`);
    
    // Try API-Football first
    if (this.apiFootballAPI) {
      try {
        const injuries = await this.apiFootballAPI.getInjuries(leagueId, season, teamId);
        if (injuries.length > 0) {
          return injuries;
        }
      } catch (error) {
        console.log(`⚠️ API-Football injuries failed...`);
      }
    }
    
    console.log(`❌ No injuries found`);
    return [];
  }

  /**
   * Get trophies
   */
  async getTrophies(playerId?: string, coachId?: string): Promise<any[]> {
    console.log(`🏆 Getting trophies`);
    
    // Try API-Football first
    if (this.apiFootballAPI) {
      try {
        const trophies = await this.apiFootballAPI.getTrophies(playerId, coachId);
        if (trophies.length > 0) {
          return trophies;
        }
      } catch (error) {
        console.log(`⚠️ API-Football trophies failed...`);
      }
    }
    
    console.log(`❌ No trophies found`);
    return [];
  }

  /**
   * Get countries
   */
  async getCountries(): Promise<any[]> {
    console.log(`🌍 Getting countries`);
    
    // Try API-Football first
    if (this.apiFootballAPI) {
      try {
        const countries = await this.apiFootballAPI.getCountries();
        if (countries.length > 0) {
          return countries;
        }
      } catch (error) {
        console.log(`⚠️ API-Football countries failed...`);
      }
    }
    
    console.log(`❌ No countries found`);
    return [];
  }

  /**
   * Get seasons
   */
  async getSeasons(): Promise<number[]> {
    console.log(`📅 Getting seasons`);
    
    // Try API-Football first
    if (this.apiFootballAPI) {
      try {
        const seasons = await this.apiFootballAPI.getSeasons();
        if (seasons.length > 0) {
          return seasons;
        }
      } catch (error) {
        console.log(`⚠️ API-Football seasons failed...`);
      }
    }
    
    console.log(`❌ No seasons found`);
    return [];
  }

  /**
   * Get venues
   */
  async getVenues(countryName?: string, city?: string): Promise<any[]> {
    console.log(`🏟️ Getting venues`);
    
    // Try API-Football first
    if (this.apiFootballAPI) {
      try {
        const venues = await this.apiFootballAPI.getVenues(countryName, city);
        if (venues.length > 0) {
          return venues;
        }
      } catch (error) {
        console.log(`⚠️ API-Football venues failed...`);
      }
    }
    
    console.log(`❌ No venues found`);
    return [];
  }

  /**
   * Get predictions
   */
  async getPredictions(fixtureId: string): Promise<any[]> {
    console.log(`🔮 Getting predictions for fixture ${fixtureId}`);
    
    // Try API-Football first
    if (this.apiFootballAPI) {
      try {
        const predictions = await this.apiFootballAPI.getPredictions(fixtureId);
        if (predictions.length > 0) {
          return predictions;
        }
      } catch (error) {
        console.log(`⚠️ API-Football predictions failed...`);
      }
    }
    
    console.log(`❌ No predictions found for fixture ${fixtureId}`);
    return [];
  }

  /**
   * Get odds
   */
  async getOdds(fixtureId: string): Promise<any[]> {
    console.log(`💰 Getting odds for fixture ${fixtureId}`);
    
    // Try API-Football first
    if (this.apiFootballAPI) {
      try {
        const odds = await this.apiFootballAPI.getOdds(fixtureId);
        if (odds.length > 0) {
          return odds;
        }
      } catch (error) {
        console.log(`⚠️ API-Football odds failed...`);
      }
    }
    
    console.log(`❌ No odds found for fixture ${fixtureId}`);
    return [];
  }

  /**
   * Get live odds
   */
  async getLiveOdds(fixtureId: string): Promise<any[]> {
    console.log(`💰 Getting live odds for fixture ${fixtureId}`);
    
    // Try API-Football first
    if (this.apiFootballAPI) {
      try {
        const odds = await this.apiFootballAPI.getLiveOdds(fixtureId);
        if (odds.length > 0) {
          return odds;
        }
      } catch (error) {
        console.log(`⚠️ API-Football live odds failed...`);
      }
    }
    
    console.log(`❌ No live odds found for fixture ${fixtureId}`);
    return [];
  }

  /**
   * Get coaches
   */
  async getCoaches(teamId?: string, search?: string): Promise<any[]> {
    console.log(`👔 Getting coaches`);
    
    // Try API-Football first
    if (this.apiFootballAPI) {
      try {
        const coaches = await this.apiFootballAPI.getCoaches(teamId, search);
        if (coaches.length > 0) {
          return coaches;
        }
      } catch (error) {
        console.log(`⚠️ API-Football coaches failed...`);
      }
    }
    
    console.log(`❌ No coaches found`);
    return [];
  }

  /**
   * Get sidelined players
   */
  async getSidelined(playerId?: string, teamId?: string): Promise<any[]> {
    console.log(`🚫 Getting sidelined players`);
    
    // Try API-Football first
    if (this.apiFootballAPI) {
      try {
        const sidelined = await this.apiFootballAPI.getSidelined(playerId, teamId);
        if (sidelined.length > 0) {
          return sidelined;
        }
      } catch (error) {
        console.log(`⚠️ API-Football sidelined failed...`);
      }
    }
    
    console.log(`❌ No sidelined players found`);
    return [];
  }

  /**
   * Get head-to-head data between two teams
   */
  async getHeadToHead(team1Id: string, team2Id: string, team1Name: string, team2Name: string): Promise<HeadToHeadData> {
    console.log(`🔄 Getting H2H data: ${team1Name} vs ${team2Name}`);

    let bestH2H: HeadToHeadData = {
      totalMeetings: 0,
      homeWins: 0,
      awayWins: 0,
      draws: 0,
      lastMeetings: []
    };

    // Try each API and combine results
    const h2hPromises: Promise<Match[]>[] = [];

    if (this.footballDataAPI) {
      h2hPromises.push(
        this.footballDataAPI.getHeadToHead(team1Id, team2Id, team1Name, team2Name).catch(() => [])
      );
    }

    if (this.theSportsDbAPI) {
      h2hPromises.push(
        this.theSportsDbAPI.getHeadToHead(team1Name, team2Name).catch(() => [])
      );
    }

    try {
      const results = await Promise.allSettled(h2hPromises);
      const allH2HMatches: Match[] = [];

      // Combine all H2H matches from different sources
      for (const result of results) {
        if (result.status === 'fulfilled') {
          allH2HMatches.push(...result.value);
        }
      }

      if (allH2HMatches.length > 0) {
        // Remove duplicates based on date and teams
        const uniqueMatches = this.removeDuplicateMatches(allH2HMatches);
        bestH2H = this.calculateH2HStats(uniqueMatches, team1Name, team2Name);
        console.log(`✅ Found ${bestH2H.totalMeetings} H2H meetings`);
      }

    } catch (error) {
      console.error(`❌ Error getting H2H data:`, error);
    }

    return bestH2H;
  }

  /**
   * Get comprehensive team data from multiple sources
   */
  async getComprehensiveTeamData(teamName: string): Promise<{
    teamInfo: TeamSearchResult | null;
    matches: Match[];
    details: any;
  }> {
    console.log(`📋 Getting comprehensive data for ${teamName}`);

    // First, find the team
    const teamInfo = await this.findTeam(teamName);
    
    if (!teamInfo) {
      return { teamInfo: null, matches: [], details: null };
    }

    // Get matches and details in parallel
    const [matches, details] = await Promise.all([
      this.getTeamMatches(teamInfo.id, teamName, 5),
      this.getTeamDetails(teamInfo.id)
    ]);

    return { teamInfo, matches, details };
  }

  /**
   * Get team details from best available source
   */
  private async getTeamDetails(teamId: string): Promise<any> {
    const sources = [
      { name: 'Football-Data', api: this.footballDataAPI },
      { name: 'TheSportsDB', api: this.theSportsDbAPI }
    ];

    for (const source of sources) {
      if (source.api) {
        try {
          const details = await source.api.getTeamDetails(teamId);
          if (details) {
            console.log(`✅ Got team details from ${source.name}`);
            return details;
          }
        } catch (error) {
          console.log(`⚠️ ${source.name} team details failed:`, error);
          continue;
        }
      }
    }

    return null;
  }

  /**
   * Remove duplicate matches from different APIs
   */
  private removeDuplicateMatches(matches: Match[]): Match[] {
    const seen = new Set<string>();
    const unique: Match[] = [];

    for (const match of matches) {
      // Create unique key based on date and team names
      const key = `${match.match_date}_${match.match_hometeam_name}_${match.match_awayteam_name}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(match);
      }
    }

    return unique;
  }

  /**
   * Calculate H2H statistics from matches
   */
  private calculateH2HStats(matches: Match[], team1Name: string, team2Name: string): HeadToHeadData {
    let homeWins = 0;
    let awayWins = 0;
    let draws = 0;

    matches.forEach(match => {
      const homeScore = match.match_hometeam_score;
      const awayScore = match.match_awayteam_score;
      const home = match.match_hometeam_name?.toLowerCase();
      const team1Lower = team1Name.toLowerCase();

      if (homeScore > awayScore) {
        if (home?.includes(team1Lower)) {
          homeWins++;
        } else {
          awayWins++;
        }
      } else if (awayScore > homeScore) {
        if (home?.includes(team1Lower)) {
          awayWins++;
        } else {
          homeWins++;
        }
      } else {
        draws++;
      }
    });

    return {
      totalMeetings: matches.length,
      homeWins,
      awayWins,
      draws,
      lastMeetings: matches.slice(-10) // Last 10 meetings
    };
  }

  /**
   * Get list of available APIs
   */
  getAvailableAPIs(): string[] {
    const available: string[] = [];
    
    if (this.footballDataAPI) available.push('Football-Data.org');
    if (this.theSportsDbAPI) available.push('TheSportsDB');
    if (this.apiFootballAPI) available.push('API-Football');
    if (this.apiFootballComAPI) available.push('APIFootball.com');
    if (this.apiFootballRapidAPI) available.push('API-Football-Rapid');
    if (this.soccersAPI) available.push('SoccersAPI');
    
    return available;
  }

  /**
   * Health check for all APIs
   */
  async healthCheck(): Promise<{ [api: string]: boolean }> {
    const health: { [api: string]: boolean } = {};

    const checks = [
      { name: 'Football-Data', api: this.footballDataAPI },
      { name: 'TheSportsDB', api: this.theSportsDbAPI },
      { name: 'API-Football', api: this.apiFootballAPI },
      { name: 'APIFootball.com', api: this.apiFootballComAPI },
      { name: 'SoccersAPI', api: this.soccersAPI }
    ];

    await Promise.all(
      checks.map(async (check) => {
        if (check.api) {
          try {
            health[check.name] = await check.api.healthCheck();
          } catch {
            health[check.name] = false;
          }
        }
      })
    );

    return health;
  }
} 