/**
 * ⚽ API-FOOTBALL V3 CLIENT
 * Professional API client for API-Football.com (v3.football.api-sports.io)
 */

import { TeamSearchResult, Match } from '../types/football-types';

export interface APIFootballTeam {
  id: number;
  name: string;
  code?: string;
  country: string;
  founded?: number;
  national: boolean;
  logo: string;
}

export interface APIFootballVenue {
  id: number;
  name: string;
  address?: string;
  city: string;
  capacity?: number;
  surface?: string;
  image?: string;
}

export interface APIFootballLeague {
  id: number;
  name: string;
  country: string;
  logo: string;
  flag?: string;
  season: number;
  round?: string;
}

export interface APIFootballFixture {
  id: number;
  referee?: string;
  timezone: string;
  date: string;
  timestamp: number;
  periods: {
    first?: number;
    second?: number;
  };
  venue: APIFootballVenue;
  status: {
    long: string;
    short: string;
    elapsed?: number;
  };
}

export interface APIFootballScore {
  halftime: { home: number | null; away: number | null };
  fulltime: { home: number | null; away: number | null };
  extratime: { home: number | null; away: number | null };
  penalty: { home: number | null; away: number | null };
}

export interface APIFootballMatch {
  fixture: APIFootballFixture;
  league: APIFootballLeague;
  teams: {
    home: APIFootballTeam;
    away: APIFootballTeam;
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: APIFootballScore;
}

export interface APIFootballResponse<T> {
  get: string;
  parameters: Record<string, any>;
  errors: any[];
  results: number;
  paging: {
    current: number;
    total: number;
  };
  response: T[];
}

export interface APIFootballPlayer {
  id: number;
  name: string;
  firstname: string;
  lastname: string;
  age: number;
  birth: {
    date: string;
    place: string;
    country: string;
  };
  nationality: string;
  height: string;
  weight: string;
  injured: boolean;
  photo: string;
}

export interface APIFootballCoach {
  id: number;
  name: string;
  firstname: string;
  lastname: string;
  age: number;
  birth: {
    date: string;
    place: string;
    country: string;
  };
  nationality: string;
  height: string;
  weight: string;
  photo: string;
}

export interface APIFootballPlayerStatistics {
  team: APIFootballTeam;
  league: APIFootballLeague;
  games: {
    appearences: number;
    lineups: number;
    minutes: number;
    number: number;
    position: string;
    rating: string;
    captain: boolean;
  };
  substitutes: {
    in: number;
    out: number;
    bench: number;
  };
  shots: {
    total: number;
    on: number;
  };
  goals: {
    total: number;
    conceded: number;
    assists: number;
    saves: number;
  };
  passes: {
    total: number;
    key: number;
    accuracy: number;
  };
  tackles: {
    total: number;
    blocks: number;
    interceptions: number;
  };
  duels: {
    total: number;
    won: number;
  };
  dribbles: {
    attempts: number;
    success: number;
    past: number;
  };
  fouls: {
    drawn: number;
    committed: number;
  };
  cards: {
    yellow: number;
    yellowred: number;
    red: number;
  };
  penalty: {
    won: number;
    commited: number;
    scored: number;
    missed: number;
    saved: number;
  };
}

export interface APIFootballStanding {
  rank: number;
  team: APIFootballTeam;
  points: number;
  goalsDiff: number;
  group: string;
  form: string;
  status: string;
  description: string;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  home: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  away: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  update: string;
}

export interface APIFootballLineup {
  team: APIFootballTeam;
  coach: APIFootballCoach;
  formation: string;
  startXI: Array<{
    player: APIFootballPlayer;
  }>;
  substitutes: Array<{
    player: APIFootballPlayer;
  }>;
}

export interface APIFootballEvent {
  time: {
    elapsed: number;
    extra: number;
  };
  team: APIFootballTeam;
  player: APIFootballPlayer;
  assist: APIFootballPlayer;
  type: string;
  detail: string;
  comments: string;
}

export interface APIFootballStatistics {
  team: APIFootballTeam;
  statistics: Array<{
    type: string;
    value: any;
  }>;
}

export interface APIFootballTopScorer {
  player: APIFootballPlayer;
  statistics: Array<{
    team: APIFootballTeam;
    league: APIFootballLeague;
    games: {
      appearences: number;
      lineups: number;
      minutes: number;
      number: number;
      position: string;
      rating: string;
      captain: boolean;
    };
    goals: {
      total: number;
      assists: number;
    };
    passes: {
      total: number;
      key: number;
      accuracy: number;
    };
    penalty: {
      won: number;
      commited: number;
      scored: number;
      missed: number;
      saved: number;
    };
  }>;
}

export interface APIFootballTransfer {
  player: APIFootballPlayer;
  update: string;
  transfers: Array<{
    date: string;
    type: string;
    teams: {
      in: APIFootballTeam;
      out: APIFootballTeam;
    };
  }>;
}

export interface APIFootballInjury {
  player: APIFootballPlayer;
  team: APIFootballTeam;
  fixture: APIFootballFixture;
  league: APIFootballLeague;
  type: string;
  reason: string;
  date: string;
}

export interface APIFootballTrophy {
  league: string;
  country: string;
  season: string;
  place: string;
}

export interface APIFootballSeason {
  year: number;
  start: string;
  end: string;
  current: boolean;
  coverage: {
    fixtures: {
      events: boolean;
      lineups: boolean;
      statistics_fixtures: boolean;
      statistics_players: boolean;
    };
    standings: boolean;
    players: boolean;
    top_scorers: boolean;
    top_assists: boolean;
    top_cards: boolean;
    injuries: boolean;
    predictions: boolean;
    odds: boolean;
  };
}

export interface APIFootballCountry {
  name: string;
  code: string;
  flag: string;
}

export interface APIFootballOdds {
  league: APIFootballLeague;
  fixture: APIFootballFixture;
  update: string;
  bookmakers: Array<{
    id: number;
    name: string;
    bets: Array<{
      id: number;
      name: string;
      values: Array<{
        value: string;
        odd: string;
      }>;
    }>;
  }>;
}

export interface APIFootballPrediction {
  predictions: {
    winner: {
      id: number;
      name: string;
      comment: string;
    };
    win_or_draw: boolean;
    under_over: string;
    goals: {
      home: string;
      away: string;
    };
    advice: string;
    percent: {
      home: string;
      draw: string;
      away: string;
    };
  };
  league: APIFootballLeague;
  teams: {
    home: APIFootballTeam;
    away: APIFootballTeam;
  };
  comparison: {
    form: {
      home: string;
      away: string;
    };
    att: {
      home: string;
      away: string;
    };
    def: {
      home: string;
      away: string;
    };
    poisson_distribution: {
      home: string;
      away: string;
    };
    h2h: {
      home: string;
      away: string;
    };
    goals: {
      home: string;
      away: string;
    };
    total: {
      home: string;
      away: string;
    };
  };
}

const BASE_URL = 'https://v3.football.api-sports.io';
const RAPIDAPI_BASE_URL = 'https://api-football-v1.p.rapidapi.com/v3';

export class APIFootballAPI {
  private apiKey: string;
  private baseUrl: string;
  private isRapidAPI: boolean;

  constructor(apiKey: string, isRapidAPI: boolean = false) {
    this.apiKey = apiKey;
    this.isRapidAPI = isRapidAPI;
    this.baseUrl = isRapidAPI ? RAPIDAPI_BASE_URL : BASE_URL;
    console.log('⚽ API-Football v3 initialized');
  }

  /**
   * Make authenticated request to API-Football v3
   */
  private async makeRequest(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    // Add parameters
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const headers: Record<string, string> = {};

    if (this.isRapidAPI) {
      headers['X-RapidAPI-Key'] = this.apiKey;
      headers['X-RapidAPI-Host'] = 'api-football-v1.p.rapidapi.com';
    } else {
      headers['x-apisports-key'] = this.apiKey;
    }

    console.log(`🔍 API-Football v3: ${url.toString()}`);

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ API-Football v3 Response: ${response.status} - ${errorText}`);
      throw new Error(`API-Football v3 error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Search for team by name
   */
  async searchTeam(teamName: string): Promise<TeamSearchResult | null> {
    try {
      console.log(`🔍 API-Football v3: Searching for team ${teamName}`);
      
      const data: APIFootballResponse<APIFootballTeam> = await this.makeRequest('/teams', {
        search: teamName
      });
      
      if (data && data.response && data.response.length > 0) {
        const team = data.response[0];
        
        // Validate that we have all required fields
        if (!team || !team.id || !team.name) {
          console.log(`⚠️ API-Football returned incomplete team data for ${teamName}`);
          return null;
        }
        
        return {
          id: team.id.toString(),
          name: team.name,
          country: team.country || 'Unknown',
          league: '' // API-Football doesn't provide league in team search
        };
      }

      console.log(`⚠️ API-Football found no teams matching: ${teamName}`);
      return null;

    } catch (error) {
      console.error(`❌ API-Football v3 search error for ${teamName}:`, error);
      return null;
    }
  }

  /**
   * Get team last matches
   */
  async getTeamLastMatches(teamId: string, limit: number = 5): Promise<Match[]> {
    try {
      console.log(`📊 API-Football v3: Getting last ${limit} matches for team ${teamId}`);
      
      const currentSeason = new Date().getFullYear();
      
      const data: APIFootballResponse<APIFootballMatch> = await this.makeRequest('/fixtures', {
        team: teamId,
        season: currentSeason.toString(),
        last: limit.toString()
      });
      
      if (data.response && data.response.length > 0) {
        const matches: Match[] = data.response
          .filter(match => match.fixture.status.short === 'FT')
          .map(match => ({
            match_id: match.fixture.id.toString(),
            match_date: match.fixture.date.split('T')[0],
            match_hometeam_name: match.teams.home.name,
            match_awayteam_name: match.teams.away.name,
            match_hometeam_score: match.goals.home || 0,
            match_awayteam_score: match.goals.away || 0,
            match_status: 'Finished',
            league_name: match.league.name,
            match_time: match.fixture.date.split('T')[1]?.slice(0, 5) || '',
            match_hometeam_id: match.teams.home.id.toString(),
            match_awayteam_id: match.teams.away.id.toString()
          }));

        console.log(`✅ Found ${matches.length} matches from API-Football v3`);
        return matches;
      }

      return [];

    } catch (error) {
      console.error(`❌ API-Football v3 matches error for team ${teamId}:`, error);
      return [];
    }
  }

  /**
   * Get upcoming matches for a team
   */
  async getTeamUpcomingMatches(teamId: string, limit: number = 5): Promise<Match[]> {
    try {
      console.log(`📊 API-Football v3: Getting upcoming ${limit} matches for team ${teamId}`);
      
      const currentSeason = new Date().getFullYear();
      
      const data: APIFootballResponse<APIFootballMatch> = await this.makeRequest('/fixtures', {
        team: teamId,
        season: currentSeason.toString(),
        next: limit.toString()
      });
      
      if (data.response && data.response.length > 0) {
        const matches: Match[] = data.response
          .filter(match => 
            match.fixture.status.short === 'NS' || // Not Started
            match.fixture.status.short === 'TBD'   // To Be Determined
          )
          .map(match => ({
            match_id: match.fixture.id.toString(),
            match_date: match.fixture.date.split('T')[0],
            match_hometeam_name: match.teams.home.name,
            match_awayteam_name: match.teams.away.name,
            match_hometeam_score: 0,
            match_awayteam_score: 0,
            match_status: 'Scheduled',
            league_name: match.league.name,
            match_time: match.fixture.date.split('T')[1]?.slice(0, 5) || '',
            match_hometeam_id: match.teams.home.id.toString(),
            match_awayteam_id: match.teams.away.id.toString()
          }));

        console.log(`✅ Found ${matches.length} upcoming matches from API-Football v3`);
        return matches;
      }

      return [];

    } catch (error) {
      console.error(`❌ API-Football v3 upcoming matches error for team ${teamId}:`, error);
      return [];
    }
  }

  /**
   * Get live matches
   */
  async getLiveMatches(limit: number = 10): Promise<Match[]> {
    try {
      console.log(`🔴 API-Football v3: Getting live matches (limit: ${limit})`);
      
      const data: APIFootballResponse<APIFootballMatch> = await this.makeRequest('/fixtures', {
        live: 'all'
      });
      
      if (data.response && data.response.length > 0) {
        const matches: Match[] = data.response
          .slice(0, limit)
          .map(match => ({
            match_id: match.fixture.id.toString(),
            match_date: match.fixture.date.split('T')[0],
            match_hometeam_name: match.teams.home.name,
            match_awayteam_name: match.teams.away.name,
            match_hometeam_score: match.goals.home || 0,
            match_awayteam_score: match.goals.away || 0,
            match_status: 'Live',
            league_name: match.league.name,
            match_time: match.fixture.date.split('T')[1]?.slice(0, 5) || '',
            match_hometeam_id: match.teams.home.id.toString(),
            match_awayteam_id: match.teams.away.id.toString()
          }));

        console.log(`✅ Found ${matches.length} live matches from API-Football v3`);
        return matches;
      }

      return [];

    } catch (error) {
      console.error(`❌ API-Football v3 live matches error:`, error);
      return [];
    }
  }

  /**
   * Get fixtures by date range
   */
  async getFixturesByDateRange(fromDate: string, toDate: string, limit: number = 50): Promise<Match[]> {
    try {
      console.log(`📊 API-Football v3: Getting fixtures from ${fromDate} to ${toDate}`);
      
      const data: APIFootballResponse<APIFootballMatch> = await this.makeRequest('/fixtures', {
        from: fromDate,
        to: toDate
      });
      
      if (data.response && data.response.length > 0) {
        const matches: Match[] = data.response
          .slice(0, limit)
          .map(match => ({
            match_id: match.fixture.id.toString(),
            match_date: match.fixture.date.split('T')[0],
            match_hometeam_name: match.teams.home.name,
            match_awayteam_name: match.teams.away.name,
            match_hometeam_score: match.goals.home || 0,
            match_awayteam_score: match.goals.away || 0,
            match_status: this.normalizeStatus(match.fixture.status.short),
            league_name: match.league.name,
            match_time: match.fixture.date.split('T')[1]?.slice(0, 5) || '',
            match_hometeam_id: match.teams.home.id.toString(),
            match_awayteam_id: match.teams.away.id.toString()
          }));

        console.log(`✅ Found ${matches.length} fixtures from API-Football v3`);
        return matches;
      }

      return [];

    } catch (error) {
      console.error(`❌ API-Football v3 fixtures error:`, error);
      return [];
    }
  }

  /**
   * Get fixtures by league
   */
  async getLeagueFixtures(leagueId: string, season: string, limit: number = 50): Promise<Match[]> {
    try {
      console.log(`📊 API-Football v3: Getting fixtures for league ${leagueId}, season ${season}`);
      
      const data: APIFootballResponse<APIFootballMatch> = await this.makeRequest('/fixtures', {
        league: leagueId,
        season: season
      });
      
      if (data.response && data.response.length > 0) {
        const matches: Match[] = data.response
          .slice(0, limit)
          .map(match => ({
            match_id: match.fixture.id.toString(),
            match_date: match.fixture.date.split('T')[0],
            match_hometeam_name: match.teams.home.name,
            match_awayteam_name: match.teams.away.name,
            match_hometeam_score: match.goals.home || 0,
            match_awayteam_score: match.goals.away || 0,
            match_status: this.normalizeStatus(match.fixture.status.short),
            league_name: match.league.name,
            match_time: match.fixture.date.split('T')[1]?.slice(0, 5) || '',
            match_hometeam_id: match.teams.home.id.toString(),
            match_awayteam_id: match.teams.away.id.toString()
          }));

        console.log(`✅ Found ${matches.length} league fixtures from API-Football v3`);
        return matches;
      }

      return [];

    } catch (error) {
      console.error(`❌ API-Football v3 league fixtures error:`, error);
      return [];
    }
  }

  /**
   * Get head-to-head matches
   */
  async getHeadToHead(team1Id: string, team2Id: string, limit: number = 10): Promise<Match[]> {
    try {
      console.log(`🔄 API-Football v3: Getting H2H ${team1Id} vs ${team2Id}`);
      
      const data: APIFootballResponse<APIFootballMatch> = await this.makeRequest('/fixtures/headtohead', {
        h2h: `${team1Id}-${team2Id}`,
        last: limit.toString()
      });
      
      if (data.response && data.response.length > 0) {
        const matches: Match[] = data.response
          .map(match => ({
            match_id: match.fixture.id.toString(),
            match_date: match.fixture.date.split('T')[0],
            match_hometeam_name: match.teams.home.name,
            match_awayteam_name: match.teams.away.name,
            match_hometeam_score: match.goals.home || 0,
            match_awayteam_score: match.goals.away || 0,
            match_status: this.normalizeStatus(match.fixture.status.short),
            league_name: match.league.name,
            match_time: match.fixture.date.split('T')[1]?.slice(0, 5) || '',
            match_hometeam_id: match.teams.home.id.toString(),
            match_awayteam_id: match.teams.away.id.toString()
          }));

        console.log(`✅ Found ${matches.length} H2H matches from API-Football v3`);
        return matches;
      }

      return [];

    } catch (error) {
      console.error(`❌ API-Football v3 H2H error:`, error);
      return [];
    }
  }

  /**
   * Get team details
   */
  async getTeamDetails(teamId: string): Promise<APIFootballTeam | null> {
    try {
      console.log(`📊 API-Football v3: Getting team details for ${teamId}`);
      
      const data: APIFootballResponse<APIFootballTeam> = await this.makeRequest('/teams', {
        id: teamId
      });
      
      if (data.response && data.response.length > 0) {
        console.log(`✅ Found team details from API-Football v3`);
        return data.response[0];
      }

      return null;

    } catch (error) {
      console.error(`❌ API-Football v3 team details error:`, error);
      return null;
    }
  }

  /**
   * Get leagues
   */
  async getLeagues(country?: string, season?: string): Promise<APIFootballLeague[]> {
    try {
      console.log(`📊 API-Football v3: Getting leagues`);
      
      const params: Record<string, string> = {};
      if (country) params.country = country;
      if (season) params.season = season;
      
      const data: APIFootballResponse<{ league: APIFootballLeague }> = await this.makeRequest('/leagues', params);
      
      if (data.response && data.response.length > 0) {
        const leagues = data.response.map(item => item.league);
        console.log(`✅ Found ${leagues.length} leagues from API-Football v3`);
        return leagues;
      }

      return [];

    } catch (error) {
      console.error(`❌ API-Football v3 leagues error:`, error);
      return [];
    }
  }

  /**
   * Normalize match status
   */
  private normalizeStatus(status: string): string {
    switch (status) {
      case 'FT':
      case 'AET':
      case 'PEN':
        return 'Finished';
      case '1H':
      case '2H':
      case 'HT':
      case 'ET':
      case 'BT':
      case 'P':
      case 'LIVE':
        return 'Live';
      case 'NS':
      case 'TBD':
        return 'Scheduled';
      case 'PST':
        return 'Postponed';
      case 'CANC':
      case 'ABD':
        return 'Cancelled';
      case 'AWD':
        return 'Awarded';
      case 'WO':
        return 'Walkover';
      default:
        return status;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const data = await this.makeRequest('/status');
      return data.response && data.response.account;
    } catch {
      return false;
    }
  }

  /**
   * Get fixtures by specific date
   */
  async getFixturesByDate(date: string): Promise<Match[]> {
    try {
      console.log(`📅 API-Football v3: Getting fixtures for date ${date}`);
      
      const data: APIFootballResponse<APIFootballMatch> = await this.makeRequest('/fixtures', {
        date: date
      });
      
      if (data.response && data.response.length > 0) {
        const matches: Match[] = data.response.map(match => ({
          match_id: match.fixture.id.toString(),
          match_date: match.fixture.date.split('T')[0],
          match_hometeam_name: match.teams.home.name,
          match_awayteam_name: match.teams.away.name,
          match_hometeam_score: match.goals.home || 0,
          match_awayteam_score: match.goals.away || 0,
          match_status: this.normalizeStatus(match.fixture.status.short),
          league_name: match.league.name,
          match_time: match.fixture.date.split('T')[1]?.slice(0, 5) || '',
          match_hometeam_id: match.teams.home.id.toString(),
          match_awayteam_id: match.teams.away.id.toString()
        }));

        console.log(`✅ Found ${matches.length} fixtures for ${date} from API-Football v3`);
        return matches;
      }

      return [];

    } catch (error) {
      console.error(`❌ API-Football v3 fixtures by date error:`, error);
      return [];
    }
  }

  /**
   * Get league standings
   */
  async getStandings(leagueId: string, season: string): Promise<APIFootballStanding[]> {
    try {
      console.log(`📊 API-Football v3: Getting standings for league ${leagueId}, season ${season}`);
      
      const data: APIFootballResponse<{ league: APIFootballLeague; standings: APIFootballStanding[][] }> = await this.makeRequest('/standings', {
        league: leagueId,
        season: season
      });
      
      if (data.response && data.response.length > 0) {
        const standings = data.response[0].standings[0] || [];
        console.log(`✅ Found ${standings.length} standings from API-Football v3`);
        return standings;
      }

      return [];

    } catch (error) {
      console.error(`❌ API-Football v3 standings error:`, error);
      return [];
    }
  }

  /**
   * Get team statistics
   */
  async getTeamStatistics(teamId: string, leagueId: string, season: string): Promise<APIFootballStatistics[]> {
    try {
      console.log(`📊 API-Football v3: Getting team statistics for ${teamId}`);
      
      const data: APIFootballResponse<APIFootballStatistics> = await this.makeRequest('/teams/statistics', {
        team: teamId,
        league: leagueId,
        season: season
      });
      
      if (data.response && data.response.length > 0) {
        console.log(`✅ Found team statistics from API-Football v3`);
        return data.response;
      }

      return [];

    } catch (error) {
      console.error(`❌ API-Football v3 team statistics error:`, error);
      return [];
    }
  }

  /**
   * Get fixture statistics
   */
  async getFixtureStatistics(fixtureId: string): Promise<APIFootballStatistics[]> {
    try {
      console.log(`📊 API-Football v3: Getting fixture statistics for ${fixtureId}`);
      
      const data: APIFootballResponse<APIFootballStatistics> = await this.makeRequest('/fixtures/statistics', {
        fixture: fixtureId
      });
      
      if (data.response && data.response.length > 0) {
        console.log(`✅ Found fixture statistics from API-Football v3`);
        return data.response;
      }

      return [];

    } catch (error) {
      console.error(`❌ API-Football v3 fixture statistics error:`, error);
      return [];
    }
  }

  /**
   * Get fixture events
   */
  async getFixtureEvents(fixtureId: string): Promise<APIFootballEvent[]> {
    try {
      console.log(`⚡ API-Football v3: Getting fixture events for ${fixtureId}`);
      
      const data: APIFootballResponse<APIFootballEvent> = await this.makeRequest('/fixtures/events', {
        fixture: fixtureId
      });
      
      if (data.response && data.response.length > 0) {
        console.log(`✅ Found ${data.response.length} fixture events from API-Football v3`);
        return data.response;
      }

      return [];

    } catch (error) {
      console.error(`❌ API-Football v3 fixture events error:`, error);
      return [];
    }
  }

  /**
   * Get fixture lineups
   */
  async getFixtureLineups(fixtureId: string): Promise<APIFootballLineup[]> {
    try {
      console.log(`👥 API-Football v3: Getting fixture lineups for ${fixtureId}`);
      
      const data: APIFootballResponse<APIFootballLineup> = await this.makeRequest('/fixtures/lineups', {
        fixture: fixtureId
      });
      
      if (data.response && data.response.length > 0) {
        console.log(`✅ Found ${data.response.length} fixture lineups from API-Football v3`);
        return data.response;
      }

      return [];

    } catch (error) {
      console.error(`❌ API-Football v3 fixture lineups error:`, error);
      return [];
    }
  }

  /**
   * Get players by team
   */
  async getTeamPlayers(teamId: string, season: string): Promise<APIFootballPlayer[]> {
    try {
      console.log(`👨‍⚽ API-Football v3: Getting players for team ${teamId}`);
      
      const data: APIFootballResponse<{ team: APIFootballTeam; players: APIFootballPlayer[] }> = await this.makeRequest('/players', {
        team: teamId,
        season: season
      });
      
      if (data.response && data.response.length > 0) {
        const players = data.response[0].players || [];
        console.log(`✅ Found ${players.length} players from API-Football v3`);
        return players;
      }

      return [];

    } catch (error) {
      console.error(`❌ API-Football v3 team players error:`, error);
      return [];
    }
  }

  /**
   * Get player statistics
   */
  async getPlayerStatistics(playerId: string, season: string): Promise<APIFootballPlayerStatistics[]> {
    try {
      console.log(`📊 API-Football v3: Getting player statistics for ${playerId}`);
      
      const data: APIFootballResponse<{ player: APIFootballPlayer; statistics: APIFootballPlayerStatistics[] }> = await this.makeRequest('/players', {
        id: playerId,
        season: season
      });
      
      if (data.response && data.response.length > 0) {
        const statistics = data.response[0].statistics || [];
        console.log(`✅ Found player statistics from API-Football v3`);
        return statistics;
      }

      return [];

    } catch (error) {
      console.error(`❌ API-Football v3 player statistics error:`, error);
      return [];
    }
  }

  /**
   * Get top scorers
   */
  async getTopScorers(leagueId: string, season: string): Promise<APIFootballTopScorer[]> {
    try {
      console.log(`🥇 API-Football v3: Getting top scorers for league ${leagueId}`);
      
      const data: APIFootballResponse<APIFootballTopScorer> = await this.makeRequest('/players/topscorers', {
        league: leagueId,
        season: season
      });
      
      if (data.response && data.response.length > 0) {
        console.log(`✅ Found ${data.response.length} top scorers from API-Football v3`);
        return data.response;
      }

      return [];

    } catch (error) {
      console.error(`❌ API-Football v3 top scorers error:`, error);
      return [];
    }
  }

  /**
   * Get top assists
   */
  async getTopAssists(leagueId: string, season: string): Promise<APIFootballTopScorer[]> {
    try {
      console.log(`🎯 API-Football v3: Getting top assists for league ${leagueId}`);
      
      const data: APIFootballResponse<APIFootballTopScorer> = await this.makeRequest('/players/topassists', {
        league: leagueId,
        season: season
      });
      
      if (data.response && data.response.length > 0) {
        console.log(`✅ Found ${data.response.length} top assists from API-Football v3`);
        return data.response;
      }

      return [];

    } catch (error) {
      console.error(`❌ API-Football v3 top assists error:`, error);
      return [];
    }
  }

  /**
   * Get transfers
   */
  async getTransfers(teamId?: string, playerId?: string): Promise<APIFootballTransfer[]> {
    try {
      console.log(`🔄 API-Football v3: Getting transfers`);
      
      const params: Record<string, string> = {};
      if (teamId) params.team = teamId;
      if (playerId) params.player = playerId;
      
      const data: APIFootballResponse<APIFootballTransfer> = await this.makeRequest('/transfers', params);
      
      if (data.response && data.response.length > 0) {
        console.log(`✅ Found ${data.response.length} transfers from API-Football v3`);
        return data.response;
      }

      return [];

    } catch (error) {
      console.error(`❌ API-Football v3 transfers error:`, error);
      return [];
    }
  }

  /**
   * Get injuries
   */
  async getInjuries(leagueId?: string, season?: string, teamId?: string): Promise<APIFootballInjury[]> {
    try {
      console.log(`🏥 API-Football v3: Getting injuries`);
      
      const params: Record<string, string> = {};
      if (leagueId) params.league = leagueId;
      if (season) params.season = season;
      if (teamId) params.team = teamId;
      
      const data: APIFootballResponse<APIFootballInjury> = await this.makeRequest('/injuries', params);
      
      if (data.response && data.response.length > 0) {
        console.log(`✅ Found ${data.response.length} injuries from API-Football v3`);
        return data.response;
      }

      return [];

    } catch (error) {
      console.error(`❌ API-Football v3 injuries error:`, error);
      return [];
    }
  }

  /**
   * Get trophies
   */
  async getTrophies(playerId?: string, coachId?: string): Promise<APIFootballTrophy[]> {
    try {
      console.log(`🏆 API-Football v3: Getting trophies`);
      
      const params: Record<string, string> = {};
      if (playerId) params.player = playerId;
      if (coachId) params.coach = coachId;
      
      const data: APIFootballResponse<APIFootballTrophy> = await this.makeRequest('/trophies', params);
      
      if (data.response && data.response.length > 0) {
        console.log(`✅ Found ${data.response.length} trophies from API-Football v3`);
        return data.response;
      }

      return [];

    } catch (error) {
      console.error(`❌ API-Football v3 trophies error:`, error);
      return [];
    }
  }

  /**
   * Get countries
   */
  async getCountries(): Promise<APIFootballCountry[]> {
    try {
      console.log(`🌍 API-Football v3: Getting countries`);
      
      const data: APIFootballResponse<APIFootballCountry> = await this.makeRequest('/countries');
      
      if (data.response && data.response.length > 0) {
        console.log(`✅ Found ${data.response.length} countries from API-Football v3`);
        return data.response;
      }

      return [];

    } catch (error) {
      console.error(`❌ API-Football v3 countries error:`, error);
      return [];
    }
  }

  /**
   * Get seasons
   */
  async getSeasons(): Promise<number[]> {
    try {
      console.log(`📅 API-Football v3: Getting seasons`);
      
      const data: APIFootballResponse<number> = await this.makeRequest('/leagues/seasons');
      
      if (data.response && data.response.length > 0) {
        console.log(`✅ Found ${data.response.length} seasons from API-Football v3`);
        return data.response;
      }

      return [];

    } catch (error) {
      console.error(`❌ API-Football v3 seasons error:`, error);
      return [];
    }
  }

  /**
   * Get venues
   */
  async getVenues(countryName?: string, city?: string): Promise<APIFootballVenue[]> {
    try {
      console.log(`🏟️ API-Football v3: Getting venues`);
      
      const params: Record<string, string> = {};
      if (countryName) params.country = countryName;
      if (city) params.city = city;
      
      const data: APIFootballResponse<APIFootballVenue> = await this.makeRequest('/venues', params);
      
      if (data.response && data.response.length > 0) {
        console.log(`✅ Found ${data.response.length} venues from API-Football v3`);
        return data.response;
      }

      return [];

    } catch (error) {
      console.error(`❌ API-Football v3 venues error:`, error);
      return [];
    }
  }

  /**
   * Get predictions
   */
  async getPredictions(fixtureId: string): Promise<APIFootballPrediction[]> {
    try {
      console.log(`🔮 API-Football v3: Getting predictions for fixture ${fixtureId}`);
      
      const data: APIFootballResponse<APIFootballPrediction> = await this.makeRequest('/predictions', {
        fixture: fixtureId
      });
      
      if (data.response && data.response.length > 0) {
        console.log(`✅ Found ${data.response.length} predictions from API-Football v3`);
        return data.response;
      }

      return [];

    } catch (error) {
      console.error(`❌ API-Football v3 predictions error:`, error);
      return [];
    }
  }

  /**
   * Get pre-match odds
   */
  async getOdds(fixtureId: string): Promise<APIFootballOdds[]> {
    try {
      console.log(`💰 API-Football v3: Getting odds for fixture ${fixtureId}`);
      
      const data: APIFootballResponse<APIFootballOdds> = await this.makeRequest('/odds', {
        fixture: fixtureId
      });
      
      if (data.response && data.response.length > 0) {
        console.log(`✅ Found ${data.response.length} odds from API-Football v3`);
        return data.response;
      }

      return [];

    } catch (error) {
      console.error(`❌ API-Football v3 odds error:`, error);
      return [];
    }
  }

  /**
   * Get live odds
   */
  async getLiveOdds(fixtureId: string): Promise<APIFootballOdds[]> {
    try {
      console.log(`💰 API-Football v3: Getting live odds for fixture ${fixtureId}`);
      
      const data: APIFootballResponse<APIFootballOdds> = await this.makeRequest('/odds/live', {
        fixture: fixtureId
      });
      
      if (data.response && data.response.length > 0) {
        console.log(`✅ Found ${data.response.length} live odds from API-Football v3`);
        return data.response;
      }

      return [];

    } catch (error) {
      console.error(`❌ API-Football v3 live odds error:`, error);
      return [];
    }
  }

  /**
   * Get coaches
   */
  async getCoaches(teamId?: string, search?: string): Promise<APIFootballCoach[]> {
    try {
      console.log(`👔 API-Football v3: Getting coaches`);
      
      const params: Record<string, string> = {};
      if (teamId) params.team = teamId;
      if (search) params.search = search;
      
      const data: APIFootballResponse<APIFootballCoach> = await this.makeRequest('/coachs', params);
      
      if (data.response && data.response.length > 0) {
        console.log(`✅ Found ${data.response.length} coaches from API-Football v3`);
        return data.response;
      }

      return [];

    } catch (error) {
      console.error(`❌ API-Football v3 coaches error:`, error);
      return [];
    }
  }

  /**
   * Get sidelined players
   */
  async getSidelined(playerId?: string, teamId?: string): Promise<APIFootballInjury[]> {
    try {
      console.log(`🚫 API-Football v3: Getting sidelined players`);
      
      const params: Record<string, string> = {};
      if (playerId) params.player = playerId;
      if (teamId) params.team = teamId;
      
      const data: APIFootballResponse<APIFootballInjury> = await this.makeRequest('/sidelined', params);
      
      if (data.response && data.response.length > 0) {
        console.log(`✅ Found ${data.response.length} sidelined players from API-Football v3`);
        return data.response;
      }

      return [];

    } catch (error) {
      console.error(`❌ API-Football v3 sidelined error:`, error);
      return [];
    }
  }
}

export async function checkAPIFootballHealth(apiKey: string, isRapidAPI: boolean = false): Promise<boolean> {
  try {
    const api = new APIFootballAPI(apiKey, isRapidAPI);
    return await api.healthCheck();
  } catch (error) {
    console.error('❌ API-Football v3 health check failed:', error);
    return false;
  }
}