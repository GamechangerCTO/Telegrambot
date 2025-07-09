// Dynamic Team Mapper - Intelligent team discovery across APIs
// Discovers team IDs at runtime and builds mapping dynamically

import { FootballCacheManager } from './cache-manager';

export interface DiscoveredTeam {
  universalName: string;
  normalizedName: string;
  confidence: number;
  apis: {
    [apiName: string]: {
      id: string;
      name: string;
      source: string;
      lastUpdated: number;
    };
  };
  aliases: string[];
  league?: string;
  country?: string;
  discoveredAt: number;
}

export interface TeamSearchResult {
  id: string;
  name: string;
  shortName?: string;
  country?: string;
  league?: string;
  logo?: string;
  confidence: number;
}

export class DynamicTeamMapper {
  private teamMappings: Map<string, DiscoveredTeam> = new Map();
  private searchCache: Map<string, TeamSearchResult[]> = new Map();
  private readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
  private cacheManager: FootballCacheManager;
  
  constructor() {
    this.cacheManager = new FootballCacheManager();
    this.loadCachedMappings();
    console.log('🔍 Dynamic Team Mapper initialized');
  }

  /**
   * 🎯 Main Discovery Function - Find team across all APIs
   */
  async discoverTeam(teamName: string, apiClients: any): Promise<DiscoveredTeam | null> {
    const normalizedName = this.normalizeTeamName(teamName);
    
    // Check if we already have this team
    const existing = this.teamMappings.get(normalizedName);
    if (existing && this.isDataFresh(existing)) {
      console.log(`💾 Using cached mapping for ${teamName}`);
      return existing;
    }

    console.log(`🔍 Discovering team: ${teamName} across all APIs`);
    
    const discoveredTeam: DiscoveredTeam = {
      universalName: teamName,
      normalizedName,
      confidence: 0,
      apis: {},
      aliases: [teamName],
      discoveredAt: Date.now()
    };

    // Search across all available APIs in parallel
    const searchPromises = Object.entries(apiClients).map(([apiName, client]) => 
      this.searchInAPI(apiName, teamName, client)
    );

    try {
      const results = await Promise.allSettled(searchPromises);
      
      for (let i = 0; i < results.length; i++) {
        const apiName = Object.keys(apiClients)[i];
        const result = results[i];
        
        if (result.status === 'fulfilled' && result.value) {
          const bestMatch = this.findBestMatch(teamName, result.value);
          if (bestMatch && bestMatch.confidence > 0.6) {
            discoveredTeam.apis[apiName] = {
              id: bestMatch.id,
              name: bestMatch.name,
              source: apiName,
              lastUpdated: Date.now()
            };
            
            // Add new aliases
            if (!discoveredTeam.aliases.includes(bestMatch.name)) {
              discoveredTeam.aliases.push(bestMatch.name);
            }
            if (bestMatch.shortName && !discoveredTeam.aliases.includes(bestMatch.shortName)) {
              discoveredTeam.aliases.push(bestMatch.shortName);
            }
            
            // Enrich with metadata
            if (bestMatch.country) discoveredTeam.country = bestMatch.country;
            if (bestMatch.league) discoveredTeam.league = bestMatch.league;
            
            console.log(`✅ Found ${teamName} in ${apiName}: ID ${bestMatch.id} (confidence: ${bestMatch.confidence})`);
          }
        } else {
          console.log(`❌ Search failed in ${apiName}:`, result.status === 'rejected' ? result.reason : 'No results');
        }
      }

      // Calculate overall confidence
      discoveredTeam.confidence = this.calculateOverallConfidence(discoveredTeam);
      
      // Only save if we found the team in at least one API
      if (Object.keys(discoveredTeam.apis).length > 0) {
        this.teamMappings.set(normalizedName, discoveredTeam);
        this.persistMapping(discoveredTeam);
        
        console.log(`💾 Mapped ${teamName} across ${Object.keys(discoveredTeam.apis).length} APIs`);
        return discoveredTeam;
      } else {
        console.log(`❌ Could not find ${teamName} in any API`);
        return null;
      }

    } catch (error) {
      console.error(`❌ Error discovering team ${teamName}:`, error);
      return null;
    }
  }

  /**
   * 🔍 Search in specific API
   */
  private async searchInAPI(apiName: string, teamName: string, apiClient: any): Promise<TeamSearchResult[]> {
    const cacheKey = `search_${apiName}_${this.normalizeTeamName(teamName)}`;
    const cached = this.searchCache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      let results: TeamSearchResult[] = [];
      
      switch (apiName) {
        case 'football-data':
          results = await this.searchFootballData(teamName, apiClient);
          break;
        case 'api-football':
          results = await this.searchAPIFootball(teamName, apiClient);
          break;
        case 'apifootball':
          results = await this.searchAPIFootballCom(teamName, apiClient);
          break;
        case 'thesportsdb':
          results = await this.searchTheSportsDB(teamName, apiClient);
          break;
        default:
          console.log(`❓ Unknown API: ${apiName}`);
      }

      // Cache results for 1 hour
      this.searchCache.set(cacheKey, results);
      setTimeout(() => this.searchCache.delete(cacheKey), 60 * 60 * 1000);
      
      return results;

    } catch (error) {
      console.error(`❌ Search error in ${apiName}:`, error);
      return [];
    }
  }

  /**
   * 🏈 Search Football-Data.org
   */
  private async searchFootballData(teamName: string, client: any): Promise<TeamSearchResult[]> {
    const competitions = ['PL', 'PD', 'BL1', 'SA', 'FL1', 'CL', 'EL'];
    const results: TeamSearchResult[] = [];
    
    for (const comp of competitions) {
      try {
        const teams = await client.getTeamsByCompetition(comp);
        
        for (const team of teams) {
          const confidence = this.calculateNameConfidence(teamName, team.name);
          if (confidence > 0.3) {
            results.push({
              id: team.id.toString(),
              name: team.name,
              shortName: team.shortName,
              country: team.area?.name,
              league: comp,
              confidence
            });
          }
        }
      } catch (error) {
        // Continue to next competition
      }
    }
    
    return results;
  }

  /**
   * ⚽ Search API-Football (RapidAPI)
   */
  private async searchAPIFootball(teamName: string, client: any): Promise<TeamSearchResult[]> {
    try {
      const response = await client.searchTeams(teamName);
      const results: TeamSearchResult[] = [];
      
      if (response.teams) {
        for (const team of response.teams) {
          const confidence = this.calculateNameConfidence(teamName, team.name);
          if (confidence > 0.3) {
            results.push({
              id: team.id.toString(),
              name: team.name,
              shortName: team.code,
              country: team.country,
              logo: team.logo,
              confidence
            });
          }
        }
      }
      
      return results;
    } catch (error) {
      return [];
    }
  }

  /**
   * 🌐 Search APIfootball.com
   */
  private async searchAPIFootballCom(teamName: string, client: any): Promise<TeamSearchResult[]> {
    try {
      const teams = await client.searchTeams(teamName);
      const results: TeamSearchResult[] = [];
      
      for (const team of teams) {
        const confidence = this.calculateNameConfidence(teamName, team.team_name);
        if (confidence > 0.3) {
          results.push({
            id: team.team_key,
            name: team.team_name,
            country: team.team_country,
            logo: team.team_badge,
            confidence
          });
        }
      }
      
      return results;
    } catch (error) {
      return [];
    }
  }

  /**
   * 🏆 Search TheSportsDB
   */
  private async searchTheSportsDB(teamName: string, client: any): Promise<TeamSearchResult[]> {
    try {
      const teams = await client.searchTeams(teamName);
      const results: TeamSearchResult[] = [];
      
      if (teams.teams) {
        for (const team of teams.teams) {
          // Only include football/soccer teams
          if (team.strSport === 'Soccer') {
            const confidence = this.calculateNameConfidence(teamName, team.strTeam);
            if (confidence > 0.3) {
              results.push({
                id: team.idTeam,
                name: team.strTeam,
                shortName: team.strTeamShort,
                country: team.strCountry,
                league: team.strLeague,
                logo: team.strTeamBadge,
                confidence
              });
            }
          }
        }
      }
      
      return results;
    } catch (error) {
      return [];
    }
  }

  /**
   * 🎯 Find best matching team from search results
   */
  private findBestMatch(searchTerm: string, results: TeamSearchResult[]): TeamSearchResult | null {
    if (results.length === 0) return null;
    
    // Sort by confidence
    results.sort((a, b) => b.confidence - a.confidence);
    
    // Return best match if confidence is good enough
    const bestMatch = results[0];
    return bestMatch.confidence > 0.6 ? bestMatch : null;
  }

  /**
   * 📊 Calculate name similarity confidence
   */
  private calculateNameConfidence(searchTerm: string, teamName: string): number {
    const search = this.normalizeTeamName(searchTerm);
    const team = this.normalizeTeamName(teamName);
    
    // Exact match
    if (search === team) return 1.0;
    
    // Contains match
    if (team.includes(search) || search.includes(team)) return 0.8;
    
    // Word overlap
    const searchWords = search.split(' ');
    const teamWords = team.split(' ');
    const overlap = searchWords.filter(word => teamWords.includes(word)).length;
    const maxWords = Math.max(searchWords.length, teamWords.length);
    
    return overlap / maxWords;
  }

  /**
   * 🧹 Normalize team name for comparison
   */
  private normalizeTeamName(name: string): string {
    return name
      .toLowerCase()
      .replace(/fc|cf|ac|sc|bk|fk|sk/g, '') // Remove common club suffixes
      .replace(/\./g, '') // Remove dots
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }

  /**
   * 📈 Calculate overall confidence for discovered team
   */
  private calculateOverallConfidence(team: DiscoveredTeam): number {
    const apiCount = Object.keys(team.apis).length;
    if (apiCount === 0) return 0;
    
    // More APIs = higher confidence
    let confidence = Math.min(apiCount / 4, 1); // Max confidence if found in 4+ APIs
    
    // Boost if found in high-quality APIs
    if (team.apis['football-data']) confidence += 0.1;
    if (team.apis['api-football']) confidence += 0.1;
    
    return Math.min(confidence, 1);
  }

  /**
   * 💾 Persist mapping to cache
   */
  private persistMapping(team: DiscoveredTeam): void {
    // Store in our internal cache - CacheManager is for TeamResearch data
    console.log(`💾 Persisting mapping for ${team.normalizedName}`);
  }

  /**
   * 📂 Load cached mappings
   */
  private loadCachedMappings(): void {
    // This would load from persistent storage in a real app
    console.log('📂 Loading cached team mappings');
  }

  /**
   * ⏰ Check if data is fresh
   */
  private isDataFresh(team: DiscoveredTeam): boolean {
    const age = Date.now() - team.discoveredAt;
    return age < this.CACHE_DURATION;
  }

  /**
   * 🔍 Get team mapping by name
   */
  getTeamMapping(teamName: string): DiscoveredTeam | null {
    const normalized = this.normalizeTeamName(teamName);
    return this.teamMappings.get(normalized) || null;
  }

  /**
   * 🆔 Get team ID for specific API
   */
  getTeamIdForAPI(teamName: string, apiName: string): string | null {
    const mapping = this.getTeamMapping(teamName);
    return mapping?.apis[apiName]?.id || null;
  }

  /**
   * 📊 Get discovery statistics
   */
  getStats(): {
    totalTeams: number;
    apiCoverage: Record<string, number>;
    avgConfidence: number;
  } {
    const teams = Array.from(this.teamMappings.values());
    const apiCoverage: Record<string, number> = {};
    
    teams.forEach(team => {
      Object.keys(team.apis).forEach(api => {
        apiCoverage[api] = (apiCoverage[api] || 0) + 1;
      });
    });
    
    const avgConfidence = teams.length > 0 
      ? teams.reduce((sum, team) => sum + team.confidence, 0) / teams.length 
      : 0;
    
    return {
      totalTeams: teams.length,
      apiCoverage,
      avgConfidence
    };
  }

  /**
   * 🔄 Clear old cached data
   */
  clearStaleData(): void {
    const now = Date.now();
    const staleTeams: string[] = [];
    
    this.teamMappings.forEach((team, key) => {
      if (now - team.discoveredAt > this.CACHE_DURATION) {
        staleTeams.push(key);
      }
    });
    
    staleTeams.forEach(key => this.teamMappings.delete(key));
    console.log(`🧹 Cleared ${staleTeams.length} stale team mappings`);
  }
}

// Singleton instance
export const dynamicTeamMapper = new DynamicTeamMapper(); 