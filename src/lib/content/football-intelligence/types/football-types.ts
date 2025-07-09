/**
 * 🏆 FOOTBALL INTELLIGENCE TYPES
 * Central type definitions for the football analysis system
 */

export interface TeamResearch {
  teamName: string;
  teamId?: string;
  lastUpdated?: number;
  seasonStats: {
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
  };
  recentForm: {
    last5Games: string; // "WWDLW"
    last5Performance: number; // 0-100 percentage
    recentGoalsScored: number;
    recentGoalsConceded: number;
  };
  homeAwayRecord: {
    home: { played: number; wins: number; draws: number; losses: number };
    away: { played: number; wins: number; draws: number; losses: number };
  };
  headToHead: {
    totalMeetings: number;
    wins: number;
    draws: number;
    losses: number;
    lastMeeting: {
      date: string;
      result: string;
      score: { home: number; away: number };
    };
  };
  playerAvailability: {
    keyPlayersInjured: string[];
    suspensions: string[];
    newSignings: string[];
    managerChange: boolean;
  };
}

export interface Probabilities {
  homeWin: number;
  draw: number;
  awayWin: number;
}

export interface MatchAnalysis {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  league: string;
  homeTeamResearch: TeamResearch;
  awayTeamResearch: TeamResearch;
  probabilities?: Probabilities;
  confidence?: number;
  insights?: string[];
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  calculatedProbabilities: {
    homeWin: number;
    draw: number;
    awayWin: number;
    bothTeamsScore: number;
    over25Goals: number;
    under25Goals: number;
  };
  valueBets: {
    tip: string;
    confidence: number; // 1-5 stars
    reasoning: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    expectedValue: number;
  }[];
  researchSummary: string;
}

export interface APIKeys {
  'apifootball': string;
  'football-data-org': string;
  'api-football': string;
  'soccersapi': string;
  'soccersapi-username': string;
  'thesportsdb': string;
}

export interface Match {
  match_id?: string;
  match_date: string;
  match_hometeam_name: string;
  match_awayteam_name: string;
  match_hometeam_score: number;
  match_awayteam_score: number;
  match_status: string;
  league_name?: string;
  match_time?: string;
  match_hometeam_id?: string;
  match_awayteam_id?: string;
  _fallback?: boolean;
}

export interface TeamSearchResult {
  id: string;
  name: string;
  league?: string;
  country?: string;
}

export interface HeadToHeadData {
  totalMeetings: number;
  homeWins: number;
  awayWins: number;
  draws: number;
  lastMeetings: Match[];
} 