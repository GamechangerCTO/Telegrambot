/**
 * 🛡️ FALLBACK DATA GENERATOR
 * Realistic fallback data when APIs are unavailable
 */

import { TeamResearch, Match } from '../types/football-types';

export type TeamTier = 'top' | 'mid' | 'lower';

export class FallbackDataGenerator {

  /**
   * 🎯 Get realistic research fallback
   */
  static getRealisticTeamResearch(teamName: string): TeamResearch {
    const tier = this.getTeamTier(teamName);
    return this.getTierBasedResearch(teamName, tier);
  }

  /**
   * 🏆 Get tier-based team research (enhanced method)
   */
  static getTierBasedResearch(teamName: string, tier: TeamTier): TeamResearch {
    const tierData = this.getStatsForTier(tier);
    
    return {
      teamName,
      teamId: `fallback_${teamName.toLowerCase().replace(/\s+/g, '_')}`,
      lastUpdated: Date.now(),
      seasonStats: {
        played: 5, // Always 5 for consistency
        wins: tierData.wins,
        draws: tierData.draws,
        losses: tierData.losses,
        goalsFor: tierData.goalsFor,
        goalsAgainst: tierData.goalsAgainst,
        goalDifference: tierData.goalsFor - tierData.goalsAgainst,
        points: (tierData.wins * 3) + tierData.draws
      },
      recentForm: {
        last5Games: tierData.form,
        last5Performance: tierData.formPercentage,
        recentGoalsScored: tierData.goalsFor,
        recentGoalsConceded: tierData.goalsAgainst
      },
      homeAwayRecord: {
        home: { 
          played: Math.ceil(5 / 2), 
          wins: Math.round(tierData.wins * 0.6), 
          draws: Math.round(tierData.draws * 0.5), 
          losses: Math.round(tierData.losses * 0.3) 
        },
        away: { 
          played: Math.floor(5 / 2), 
          wins: Math.round(tierData.wins * 0.4), 
          draws: Math.round(tierData.draws * 0.5), 
          losses: Math.round(tierData.losses * 0.7) 
        }
      },
      headToHead: {
        totalMeetings: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        lastMeeting: { date: '', result: '', score: { home: 0, away: 0 } }
      },
      playerAvailability: {
        keyPlayersInjured: [],
        suspensions: [],
        newSignings: [],
        managerChange: false
      }
    };
  }

  /**
   * 📊 Get minimal team research for emergencies
   */
  static getMinimalTeamResearch(teamName: string): TeamResearch {
    return this.getTierBasedResearch(teamName, 'mid');
  }

  /**
   * ⚽ Generate fallback matches for consistency
   */
  static generateFallbackMatches(teamName: string, currentCount: number, teamId?: string): any[] {
    const needed = 5 - currentCount;
    const matches = [];
    
    for (let i = 0; i < needed; i++) {
      const isHome = Math.random() > 0.5;
      const isWin = Math.random() > 0.6; // 40% win rate for fallback
      const isDraw = !isWin && Math.random() > 0.7; // 30% of non-wins are draws
      
      let homeScore, awayScore;
      if (isWin) {
        if (isHome) {
          homeScore = Math.floor(Math.random() * 3) + 1;
          awayScore = Math.floor(Math.random() * homeScore);
        } else {
          awayScore = Math.floor(Math.random() * 3) + 1;
          homeScore = Math.floor(Math.random() * awayScore);
        }
      } else if (isDraw) {
        const score = Math.floor(Math.random() * 3);
        homeScore = awayScore = score;
      } else {
        // Loss
        if (isHome) {
          awayScore = Math.floor(Math.random() * 3) + 1;
          homeScore = Math.floor(Math.random() * awayScore);
        } else {
          homeScore = Math.floor(Math.random() * 3) + 1;
          awayScore = Math.floor(Math.random() * homeScore);
        }
      }
      
      matches.push({
        match_id: `fallback_${i}`,
        match_date: new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000).toISOString(),
        match_hometeam_name: isHome ? teamName : `Opponent ${i + 1}`,
        match_awayteam_name: isHome ? `Opponent ${i + 1}` : teamName,
        match_hometeam_score: homeScore.toString(),
        match_awayteam_score: awayScore.toString(),
        match_status: 'Finished',
        league_name: 'Unknown League',
        match_time: '15:00',
        match_hometeam_id: isHome ? teamId : undefined,
        match_awayteam_id: isHome ? undefined : teamId
      });
    }
    
    return matches;
  }

  /**
   * 🏆 Get team tier
   */
  private static getTeamTier(teamName: string): TeamTier {
    const name = teamName.toLowerCase();
    
    // Top tier teams
    const topTeams = [
      'real madrid', 'barcelona', 'manchester city', 'psg', 'paris saint',
      'bayern munich', 'liverpool', 'chelsea', 'arsenal', 'manchester united',
      'juventus', 'inter milan', 'ac milan', 'atletico madrid', 'tottenham'
    ];
    
    // Mid tier teams  
    const midTeams = [
      'dortmund', 'leipzig', 'sevilla', 'valencia', 'napoli', 'roma',
      'leicester', 'west ham', 'wolves', 'everton', 'newcastle'
    ];
    
    if (topTeams.some(team => name.includes(team) || team.includes(name))) {
      return 'top';
    }
    
    if (midTeams.some(team => name.includes(team) || team.includes(name))) {
      return 'mid';
    }
    
    return 'lower';
  }

  /**
   * Get realistic stats based on team tier
   */
  private static getStatsForTier(tier: TeamTier) {
    switch (tier) {
      case 'top':
        return {
          wins: 4,       // 80% win rate
          draws: 1,      // 20% draw rate  
          losses: 0,     // 0% loss rate
          goalsFor: 11,  // 2.2 goals/game
          goalsAgainst: 4, // 0.8 goals against/game
          form: 'WWWDW',
          formPercentage: 80
        };
      
      case 'mid':
        return {
          wins: 2,       // 40% win rate
          draws: 2,      // 40% draw rate
          losses: 1,     // 20% loss rate  
          goalsFor: 8,   // 1.6 goals/game
          goalsAgainst: 7, // 1.4 goals against/game
          form: 'WDWDL',
          formPercentage: 60
        };
      
      case 'lower':
        return {
          wins: 1,       // 20% win rate
          draws: 2,      // 40% draw rate
          losses: 2,     // 40% loss rate
          goalsFor: 6,   // 1.2 goals/game  
          goalsAgainst: 9, // 1.8 goals against/game
          form: 'LDWDL',
          formPercentage: 40
        };
    }
  }
}

// Export standalone functions for backward compatibility
export function generateRealisticFallbackData(teamName: string): any {
  return FallbackDataGenerator.getRealisticTeamResearch(teamName);
}

export function getTierBasedFallback(teamName: string, tier: TeamTier): any {
  return FallbackDataGenerator.getTierBasedResearch(teamName, tier);
} 