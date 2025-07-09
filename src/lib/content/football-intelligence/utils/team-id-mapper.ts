// Team ID Mapper - Universal team identification across APIs
// Solves the problem of different team IDs across different football APIs

export interface UniversalTeam {
  universalId: string;
  name: string;
  aliases: string[];
  ids: {
    'football-data'?: string;
    'api-football'?: string;
    'apifootball'?: string;
    'thesportsdb'?: string;
  };
  league?: string;
  country?: string;
}

// Database of major teams with their IDs across all APIs
const TEAM_DATABASE: UniversalTeam[] = [
  {
    universalId: 'real-madrid',
    name: 'Real Madrid',
    aliases: ['Real Madrid CF', 'Madrid', 'Los Blancos'],
    ids: {
      'football-data': '86',
      'api-football': '541', 
      'apifootball': '188',
      'thesportsdb': '134577'
    },
    league: 'La Liga',
    country: 'Spain'
  },
  {
    universalId: 'psg',
    name: 'Paris Saint-Germain',
    aliases: ['PSG', 'Paris SG', 'Paris Saint Germain'],
    ids: {
      'football-data': '524',
      'api-football': '85',
      'apifootball': '147', 
      'thesportsdb': '135289'
    },
    league: 'Ligue 1',
    country: 'France'
  },
  {
    universalId: 'bayern-munich',
    name: 'Bayern Munich',
    aliases: ['FC Bayern München', 'Bayern', 'FCB'],
    ids: {
      'football-data': '5',
      'api-football': '157',
      'apifootball': '165',
      'thesportsdb': '135260'
    },
    league: 'Bundesliga',
    country: 'Germany'
  },
  {
    universalId: 'dortmund',
    name: 'Borussia Dortmund',
    aliases: ['BVB', 'Dortmund', 'Borussia'],
    ids: {
      'football-data': '4',
      'api-football': '165',
      'apifootball': '164',
      'thesportsdb': '135271'
    },
    league: 'Bundesliga',
    country: 'Germany'
  },
  {
    universalId: 'barcelona',
    name: 'FC Barcelona',
    aliases: ['Barcelona', 'Barca', 'FCB'],
    ids: {
      'football-data': '81',
      'api-football': '529',
      'apifootball': '189',
      'thesportsdb': '134576'
    },
    league: 'La Liga',
    country: 'Spain'
  },
  {
    universalId: 'manchester-city',
    name: 'Manchester City',
    aliases: ['Man City', 'City', 'MCFC'],
    ids: {
      'football-data': '65',
      'api-football': '50',
      'apifootball': '133',
      'thesportsdb': '133613'
    },
    league: 'Premier League',
    country: 'England'
  },
  {
    universalId: 'arsenal',
    name: 'Arsenal',
    aliases: ['Arsenal FC', 'Gunners', 'AFC'],
    ids: {
      'football-data': '57',
      'api-football': '42',
      'apifootball': '130',
      'thesportsdb': '133602'
    },
    league: 'Premier League',
    country: 'England'
  },
  {
    universalId: 'liverpool',
    name: 'Liverpool',
    aliases: ['Liverpool FC', 'LFC', 'Reds'],
    ids: {
      'football-data': '64',
      'api-football': '40',
      'apifootball': '132',
      'thesportsdb': '133612'
    },
    league: 'Premier League',
    country: 'England'
  },
  {
    universalId: 'chelsea',
    name: 'Chelsea',
    aliases: ['Chelsea FC', 'Blues', 'CFC'],
    ids: {
      'football-data': '61',
      'api-football': '49',
      'apifootball': '131',
      'thesportsdb': '133610'
    },
    league: 'Premier League',
    country: 'England'
  },
  {
    universalId: 'juventus',
    name: 'Juventus',
    aliases: ['Juventus FC', 'Juve', 'Bianconeri'],
    ids: {
      'football-data': '109',
      'api-football': '496',
      'apifootball': '168',
      'thesportsdb': '135269'
    },
    league: 'Serie A',
    country: 'Italy'
  }
];

export class TeamIDMapper {
  private teamDatabase: Map<string, UniversalTeam>;
  private nameIndex: Map<string, string>; // name -> universalId
  private apiIndex: Map<string, Map<string, string>>; // api -> (apiId -> universalId)

  constructor() {
    this.teamDatabase = new Map();
    this.nameIndex = new Map();
    this.apiIndex = new Map();
    
    this.buildIndexes();
    console.log(`🗂️ Team ID Mapper initialized with ${TEAM_DATABASE.length} teams`);
  }

  private buildIndexes() {
    // Build all indexes for fast lookup
    for (const team of TEAM_DATABASE) {
      // Main database
      this.teamDatabase.set(team.universalId, team);
      
      // Name index (main name + aliases)
      this.nameIndex.set(team.name.toLowerCase(), team.universalId);
      for (const alias of team.aliases) {
        this.nameIndex.set(alias.toLowerCase(), team.universalId);
      }
      
      // API index
      for (const [apiName, apiId] of Object.entries(team.ids)) {
        if (apiId) {
          if (!this.apiIndex.has(apiName)) {
            this.apiIndex.set(apiName, new Map());
          }
          this.apiIndex.get(apiName)!.set(apiId, team.universalId);
        }
      }
    }
  }

  /**
   * Find team by any name or alias
   */
  findTeamByName(teamName: string): UniversalTeam | null {
    const normalizedName = teamName.toLowerCase().trim();
    
    // Direct match
    const universalId = this.nameIndex.get(normalizedName);
    if (universalId) {
      return this.teamDatabase.get(universalId) || null;
    }
    
    // Fuzzy match
    for (const [indexedName, id] of this.nameIndex.entries()) {
      if (indexedName.includes(normalizedName) || normalizedName.includes(indexedName)) {
        return this.teamDatabase.get(id) || null;
      }
    }
    
    return null;
  }

  /**
   * Find team by API-specific ID
   */
  findTeamByAPIId(apiName: string, apiId: string): UniversalTeam | null {
    const apiMap = this.apiIndex.get(apiName);
    if (!apiMap) return null;
    
    const universalId = apiMap.get(apiId);
    return universalId ? this.teamDatabase.get(universalId) || null : null;
  }

  /**
   * Get team ID for specific API
   */
  getTeamIdForAPI(universalId: string, apiName: string): string | null {
    const team = this.teamDatabase.get(universalId);
    return team?.ids[apiName as keyof typeof team.ids] || null;
  }

  /**
   * Map team from one API to another
   */
  mapTeamBetweenAPIs(fromAPI: string, fromId: string, toAPI: string): string | null {
    const team = this.findTeamByAPIId(fromAPI, fromId);
    if (!team) return null;
    
    return this.getTeamIdForAPI(team.universalId, toAPI);
  }

  /**
   * Get all teams for a specific API
   */
  getAllTeamsForAPI(apiName: string): Array<{universalId: string, apiId: string, team: UniversalTeam}> {
    const results: Array<{universalId: string, apiId: string, team: UniversalTeam}> = [];
    
    for (const [universalId, team] of this.teamDatabase.entries()) {
      const apiId = team.ids[apiName as keyof typeof team.ids];
      if (apiId) {
        results.push({ universalId, apiId, team });
      }
    }
    
    return results;
  }

  /**
   * Add or update team in database
   */
  addTeam(team: UniversalTeam): void {
    TEAM_DATABASE.push(team);
    this.buildIndexes(); // Rebuild indexes
    console.log(`✅ Added team ${team.name} to mapper database`);
  }

  /**
   * Get team info with all API IDs
   */
  getTeamInfo(teamName: string): UniversalTeam | null {
    return this.findTeamByName(teamName);
  }

  /**
   * Debug: Show all mappings for a team
   */
  debugTeam(teamName: string): void {
    const team = this.findTeamByName(teamName);
    if (!team) {
      console.log(`❌ Team "${teamName}" not found in mapper`);
      return;
    }
    
    console.log(`🔍 Team Mapping for ${team.name}:`);
    console.log(`  Universal ID: ${team.universalId}`);
    console.log(`  League: ${team.league} (${team.country})`);
    console.log(`  Aliases: ${team.aliases.join(', ')}`);
    console.log(`  API IDs:`);
    for (const [api, id] of Object.entries(team.ids)) {
      if (id) {
        console.log(`    ${api}: ${id}`);
      }
    }
  }
}

// Singleton instance
export const teamIDMapper = new TeamIDMapper(); 