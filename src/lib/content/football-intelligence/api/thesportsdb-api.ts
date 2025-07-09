/**
 * 🏟️ THESPORTSDB API CLIENT
 * Professional API client for TheSportsDB.com
 */

import { TeamSearchResult, Match } from '../types/football-types';

export interface TheSportsDBTeam {
  idTeam: string;
  strTeam: string;
  strTeamShort?: string;
  strAlternate?: string;
  intFormedYear?: string;
  strSport: string;
  strLeague?: string;
  idLeague?: string;
  strDivision?: string;
  strManager?: string;
  strStadium?: string;
  strKeywords?: string;
  strRSS?: string;
  strStadiumThumb?: string;
  strStadiumDescription?: string;
  strStadiumLocation?: string;
  intStadiumCapacity?: string;
  strWebsite?: string;
  strFacebook?: string;
  strTwitter?: string;
  strInstagram?: string;
  strDescriptionEN?: string;
  strDescriptionDE?: string;
  strDescriptionFR?: string;
  strDescriptionCN?: string;
  strDescriptionIT?: string;
  strDescriptionJP?: string;
  strDescriptionRU?: string;
  strDescriptionES?: string;
  strDescriptionPT?: string;
  strDescriptionSE?: string;
  strDescriptionNL?: string;
  strDescriptionHU?: string;
  strDescriptionNO?: string;
  strDescriptionIL?: string;
  strDescriptionPL?: string;
  strGender?: string;
  strCountry?: string;
  strTeamBadge?: string;
  strTeamJersey?: string;
  strTeamLogo?: string;
  strTeamFanart1?: string;
  strTeamFanart2?: string;
  strTeamFanart3?: string;
  strTeamFanart4?: string;
  strTeamBanner?: string;
  strYoutube?: string;
  strLocked?: string;
}

export interface TheSportsDBEvent {
  idEvent: string;
  idSoccerXML?: string;
  idAPIfootball?: string;
  strEvent: string;
  strEventAlternate?: string;
  strFilename?: string;
  strSport: string;
  idLeague: string;
  strLeague?: string;
  strSeason?: string;
  strDescriptionEN?: string;
  strHomeTeam?: string;
  strAwayTeam?: string;
  intHomeScore?: string;
  intAwayScore?: string;
  intRound?: string;
  strOfficial?: string;
  strHomeGoalDetails?: string;
  strHomeRedCards?: string;
  strHomeYellowCards?: string;
  strHomeLineupGoalkeeper?: string;
  strHomeLineupDefense?: string;
  strHomeLineupMidfield?: string;
  strHomeLineupForward?: string;
  strHomeLineupSubstitutes?: string;
  strAwayRedCards?: string;
  strAwayYellowCards?: string;
  strAwayGoalDetails?: string;
  strAwayLineupGoalkeeper?: string;
  strAwayLineupDefense?: string;
  strAwayLineupMidfield?: string;
  strAwayLineupForward?: string;
  strAwayLineupSubstitutes?: string;
  intHomeShots?: string;
  intAwayShots?: string;
  dateEvent?: string;
  dateEventLocal?: string;
  strTime?: string;
  strTimeLocal?: string;
  strTVStation?: string;
  idHomeTeam?: string;
  idAwayTeam?: string;
  strResult?: string;
  strVenue?: string;
  strCountry?: string;
  strCity?: string;
  strPoster?: string;
  strSquare?: string;
  strFanart?: string;
  strThumb?: string;
  strBanner?: string;
  strMap?: string;
  strTweet1?: string;
  strTweet2?: string;
  strTweet3?: string;
  strVideo?: string;
  strStatus?: string;
  strPostponed?: string;
  strLocked?: string;
}

export interface TheSportsDBResponse {
  teams?: TheSportsDBTeam[];
  events?: TheSportsDBEvent[];
}

const BASE_URL = 'https://www.thesportsdb.com/api/v1/json';
const V2_BASE_URL = 'https://www.thesportsdb.com/api/v2/json';

export async function searchTeamsFromTheSportsDB(teamName: string): Promise<TheSportsDBTeam[]> {
  try {
    console.log(`🔍 TheSportsDB: Searching for team "${teamName}"`);
    
    // Use the correct search endpoint
    const response = await fetch(`${BASE_URL}/searchteams.php?t=${encodeURIComponent(teamName)}`);

    if (!response.ok) {
      console.log(`⚠️ TheSportsDB: ${response.status} ${response.statusText}`);
      return [];
    }

    const data: TheSportsDBResponse = await response.json();
    
    if (data.teams && data.teams.length > 0) {
      // Filter only soccer/football teams
      const footballTeams = data.teams.filter(team => 
        team.strSport === 'Soccer' || team.strSport === 'Football'
      );
      
      if (footballTeams.length > 0) {
        console.log(`✅ TheSportsDB: Found ${footballTeams.length} football teams`);
        return footballTeams;
      }
    }

    console.log(`❌ TheSportsDB: No football teams found for "${teamName}"`);
    return [];
  } catch (error) {
    console.error('❌ TheSportsDB API error:', error);
    return [];
  }
}

/**
 * 🆕 Get upcoming events for a team using V2 API
 */
export async function getUpcomingEventsFromTheSportsDB(teamId: string, limit: number = 5): Promise<TheSportsDBEvent[]> {
  try {
    console.log(`🔍 TheSportsDB V2: Getting upcoming events for team ${teamId}`);
    
    // Use V2 API for upcoming events
    const response = await fetch(`${V2_BASE_URL}/schedule/next/team/${teamId}`);

    if (!response.ok) {
      console.log(`⚠️ TheSportsDB V2 upcoming events: ${response.status} ${response.statusText}`);
      return [];
    }

    const data: TheSportsDBResponse = await response.json();
    
    if (data.events && data.events.length > 0) {
      // Filter upcoming matches (no scores yet) and limit results
      const upcomingEvents = data.events
        .filter(event => {
          // Check if match hasn't started yet (no scores)
          const hasNoScores = (event.intHomeScore === null || event.intHomeScore === undefined || event.intHomeScore === '') &&
                             (event.intAwayScore === null || event.intAwayScore === undefined || event.intAwayScore === '');
          
          // Check if date is in the future
          const eventDate = new Date(event.dateEvent || '');
          const now = new Date();
          const isFuture = eventDate > now;
          
          return hasNoScores && isFuture;
        })
        .slice(0, limit);
      
      console.log(`✅ TheSportsDB V2: Found ${upcomingEvents.length} upcoming events`);
      return upcomingEvents;
    }

    console.log(`❌ TheSportsDB V2: No upcoming events found for team ${teamId}`);
    return [];
  } catch (error) {
    console.error('❌ TheSportsDB V2 upcoming events error:', error);
    return [];
  }
}

/**
 * 🆕 Get upcoming events for a league using V2 API
 */
export async function getUpcomingLeagueEventsFromTheSportsDB(leagueId: string, limit: number = 10): Promise<TheSportsDBEvent[]> {
  try {
    console.log(`🔍 TheSportsDB V2: Getting upcoming events for league ${leagueId}`);
    
    // Use V2 API for upcoming league events
    const response = await fetch(`${V2_BASE_URL}/schedule/next/league/${leagueId}`);

    if (!response.ok) {
      console.log(`⚠️ TheSportsDB V2 upcoming league events: ${response.status} ${response.statusText}`);
      return [];
    }

    const data: TheSportsDBResponse = await response.json();
    
    if (data.events && data.events.length > 0) {
      // Filter upcoming matches and limit results
      const upcomingEvents = data.events
        .filter(event => {
          const hasNoScores = (event.intHomeScore === null || event.intHomeScore === undefined || event.intHomeScore === '') &&
                             (event.intAwayScore === null || event.intAwayScore === undefined || event.intAwayScore === '');
          
          const eventDate = new Date(event.dateEvent || '');
          const now = new Date();
          const isFuture = eventDate > now;
          
          return hasNoScores && isFuture;
        })
        .slice(0, limit);
      
      console.log(`✅ TheSportsDB V2: Found ${upcomingEvents.length} upcoming league events`);
      return upcomingEvents;
    }

    console.log(`❌ TheSportsDB V2: No upcoming league events found for league ${leagueId}`);
    return [];
  } catch (error) {
    console.error('❌ TheSportsDB V2 upcoming league events error:', error);
    return [];
  }
}

export async function getEventsFromTheSportsDB(teamId: string, limit: number = 5): Promise<TheSportsDBEvent[]> {
  try {
    console.log(`🔍 TheSportsDB: Getting events for team ${teamId}`);
    
    // Get recent events for the team
    const response = await fetch(`${BASE_URL}/eventslast.php?id=${teamId}`);

    if (!response.ok) {
      console.log(`⚠️ TheSportsDB events: ${response.status} ${response.statusText}`);
      return [];
    }

    const data: TheSportsDBResponse = await response.json();
    
    if (data.events && data.events.length > 0) {
      // Filter completed matches and limit results
      const completedEvents = data.events
        .filter(event => event.intHomeScore !== null && event.intAwayScore !== null)
        .slice(0, limit);
      
      console.log(`✅ TheSportsDB: Found ${completedEvents.length} completed events`);
      return completedEvents;
    }

    console.log(`❌ TheSportsDB: No events found for team ${teamId}`);
    return [];
  } catch (error) {
    console.error('❌ TheSportsDB events error:', error);
    return [];
  }
}

export async function getTeamByIdFromTheSportsDB(teamId: string): Promise<TheSportsDBTeam | null> {
  try {
    console.log(`🔍 TheSportsDB: Getting team details for ${teamId}`);
    
    const response = await fetch(`${BASE_URL}/lookupteam.php?id=${teamId}`);

    if (!response.ok) {
      console.log(`⚠️ TheSportsDB team lookup: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: TheSportsDBResponse = await response.json();
    
    if (data.teams && data.teams.length > 0) {
      console.log(`✅ TheSportsDB: Found team details`);
      return data.teams[0];
    }

    return null;
  } catch (error) {
    console.error('❌ TheSportsDB team lookup error:', error);
    return null;
  }
}

export async function checkTheSportsDBHealth(): Promise<boolean> {
  try {
    // Test with a simple search
    const response = await fetch(`${BASE_URL}/searchteams.php?t=Arsenal`);
    return response.ok;
  } catch (error) {
    console.error('❌ TheSportsDB health check failed:', error);
    return false;
  }
}

export class TheSportsDbAPI {
  private apiKey: string;
  private baseUrl = 'https://www.thesportsdb.com/api/v1/json';
  private v2BaseUrl = 'https://www.thesportsdb.com/api/v2/json';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    console.log('🏟️ TheSportsDB API initialized');
  }

  /**
   * Search for team by name
   */
  async searchTeam(teamName: string): Promise<TeamSearchResult | null> {
    try {
      console.log(`🔍 TheSportsDB: Searching for team ${teamName}`);
      
      const url = `${this.baseUrl}/${this.apiKey}/searchteams.php?t=${encodeURIComponent(teamName)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log(`❌ TheSportsDB search failed: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      if (data.teams && Array.isArray(data.teams) && data.teams.length > 0) {
        const team = data.teams[0]; // First match
        
        return {
          id: team.idTeam,
          name: team.strTeam,
          league: team.strLeague,
          country: team.strCountry
        };
      }

      return null;

    } catch (error) {
      console.error(`❌ TheSportsDB search error for ${teamName}:`, error);
      return null;
    }
  }

  /**
   * Get team last matches
   */
  async getTeamLastMatches(teamId: string, limit: number = 5): Promise<Match[]> {
    try {
      console.log(`📊 TheSportsDB: Getting last ${limit} matches for team ${teamId}`);
      
      const url = `${this.baseUrl}/${this.apiKey}/eventslast.php?id=${teamId}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log(`❌ TheSportsDB matches failed: ${response.status}`);
        return [];
      }

      const data = await response.json();
      
      if (data.results && Array.isArray(data.results)) {
        const matches: Match[] = data.results
          .filter((event: any) => event.strStatus === 'Match Finished')
          .slice(0, limit)
          .map((event: any) => ({
            match_id: event.idEvent,
            match_date: event.dateEvent,
            match_hometeam_name: event.strHomeTeam,
            match_awayteam_name: event.strAwayTeam,
            match_hometeam_score: parseInt(event.intHomeScore) || 0,
            match_awayteam_score: parseInt(event.intAwayScore) || 0,
            match_status: 'Finished',
            league_name: event.strLeague,
            match_time: event.strTime,
            match_hometeam_id: event.idHomeTeam,
            match_awayteam_id: event.idAwayTeam
          }));

        console.log(`✅ Found ${matches.length} matches from TheSportsDB`);
        return matches;
      }

      return [];

    } catch (error) {
      console.error(`❌ TheSportsDB matches error for team ${teamId}:`, error);
      return [];
    }
  }

  /**
   * Get team details
   */
  async getTeamDetails(teamId: string): Promise<any | null> {
    try {
      const url = `${this.baseUrl}/${this.apiKey}/lookupteam.php?id=${teamId}`;
      const response = await fetch(url);
      
      if (!response.ok) return null;

      const data = await response.json();
      
      if (data.teams && Array.isArray(data.teams) && data.teams.length > 0) {
        return data.teams[0];
      }

      return null;

    } catch (error) {
      console.error(`❌ TheSportsDB team details error for ${teamId}:`, error);
      return null;
    }
  }

  /**
   * Search for head-to-head matches
   */
  async getHeadToHead(team1Name: string, team2Name: string): Promise<Match[]> {
    try {
      console.log(`🔄 TheSportsDB: Searching H2H ${team1Name} vs ${team2Name}`);
      
      // TheSportsDB doesn't have direct H2H endpoint, need to get both teams' matches
      // and filter manually - this is a simplified implementation
      
      const team1 = await this.searchTeam(team1Name);
      const team2 = await this.searchTeam(team2Name);
      
      if (!team1 || !team2) {
        console.log(`⚠️ Could not find both teams for H2H`);
        return [];
      }

      // Get recent matches for team1 and filter for team2
      const team1Matches = await this.getTeamLastMatches(team1.id, 20);
      
      const h2hMatches = team1Matches.filter(match => 
        match.match_hometeam_name.toLowerCase().includes(team2Name.toLowerCase()) ||
        match.match_awayteam_name.toLowerCase().includes(team2Name.toLowerCase())
      );

      console.log(`✅ Found ${h2hMatches.length} H2H matches from TheSportsDB`);
      return h2hMatches;

    } catch (error) {
      console.error(`❌ TheSportsDB H2H error:`, error);
      return [];
    }
  }

  /**
   * Get league teams
   */
  async getLeagueTeams(leagueName: string): Promise<TeamSearchResult[]> {
    try {
      const url = `${this.baseUrl}/${this.apiKey}/search_all_teams.php?l=${encodeURIComponent(leagueName)}`;
      const response = await fetch(url);
      
      if (!response.ok) return [];

      const data = await response.json();
      
      if (data.teams && Array.isArray(data.teams)) {
        return data.teams.map((team: any) => ({
          id: team.idTeam,
          name: team.strTeam,
          league: team.strLeague,
          country: team.strCountry
        }));
      }

      return [];

    } catch (error) {
      console.error(`❌ TheSportsDB league teams error:`, error);
      return [];
    }
  }

  /**
   * 🆕 Get upcoming matches for a team using V2 API
   */
  async getTeamUpcomingMatches(teamId: string, limit: number = 5): Promise<Match[]> {
    try {
      console.log(`📊 TheSportsDB V2: Getting upcoming ${limit} matches for team ${teamId}`);
      
      const url = `${this.v2BaseUrl}/schedule/next/team/${teamId}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log(`❌ TheSportsDB V2 upcoming matches failed: ${response.status}`);
        return [];
      }

      const data = await response.json();
      
      if (data.events && Array.isArray(data.events)) {
        const matches: Match[] = data.events
          .filter((event: any) => {
            // Filter for upcoming matches (no scores yet)
            const hasNoScores = (!event.intHomeScore && !event.intAwayScore);
            const eventDate = new Date(event.dateEvent);
            const now = new Date();
            return hasNoScores && eventDate > now;
          })
          .slice(0, limit)
          .map((event: any) => ({
            match_id: event.idEvent,
            match_date: event.dateEvent,
            match_hometeam_name: event.strHomeTeam,
            match_awayteam_name: event.strAwayTeam,
            match_hometeam_score: 0,
            match_awayteam_score: 0,
            match_status: 'Scheduled',
            league_name: event.strLeague,
            match_time: event.strTime,
            match_hometeam_id: event.idHomeTeam,
            match_awayteam_id: event.idAwayTeam
          }));

        console.log(`✅ Found ${matches.length} upcoming matches from TheSportsDB V2`);
        return matches;
      }

      return [];

    } catch (error) {
      console.error(`❌ TheSportsDB V2 upcoming matches error for team ${teamId}:`, error);
      return [];
    }
  }

  /**
   * 🆕 Get upcoming matches for a league using V2 API
   */
  async getLeagueUpcomingMatches(leagueId: string, limit: number = 10): Promise<Match[]> {
    try {
      console.log(`📊 TheSportsDB V2: Getting upcoming ${limit} matches for league ${leagueId}`);
      
      const url = `${this.v2BaseUrl}/schedule/next/league/${leagueId}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log(`❌ TheSportsDB V2 upcoming league matches failed: ${response.status}`);
        return [];
      }

      const data = await response.json();
      
      if (data.events && Array.isArray(data.events)) {
        const matches: Match[] = data.events
          .filter((event: any) => {
            const hasNoScores = (!event.intHomeScore && !event.intAwayScore);
            const eventDate = new Date(event.dateEvent);
            const now = new Date();
            return hasNoScores && eventDate > now;
          })
          .slice(0, limit)
          .map((event: any) => ({
            match_id: event.idEvent,
            match_date: event.dateEvent,
            match_hometeam_name: event.strHomeTeam,
            match_awayteam_name: event.strAwayTeam,
            match_hometeam_score: 0,
            match_awayteam_score: 0,
            match_status: 'Scheduled',
            league_name: event.strLeague,
            match_time: event.strTime,
            match_hometeam_id: event.idHomeTeam,
            match_awayteam_id: event.idAwayTeam
          }));

        console.log(`✅ Found ${matches.length} upcoming league matches from TheSportsDB V2`);
        return matches;
      }

      return [];

    } catch (error) {
      console.error(`❌ TheSportsDB V2 upcoming league matches error for league ${leagueId}:`, error);
      return [];
    }
  }

  /**
   * Check if API is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.apiKey}/search_all_teams.php?l=English%20Premier%20League`);
      return response.ok;
    } catch {
      return false;
    }
  }
} 