/**
 * 🧠 FOOTBALL INTELLIGENCE ENGINE - MODULAR VERSION
 * Clean, modular architecture replacing the 2094-line monolithic file
 */

import { MatchAnalysis, APIKeys, TeamResearch } from './types/football-types';
import { FootballAPIManager } from './api/football-api-manager';
import { FootballCacheManager } from './utils/cache-manager';
import { rateLimiter } from './utils/rate-limiter';
import { intelligentWaiter } from './utils/intelligent-waiter';
import { FallbackDataGenerator } from './utils/fallback-data';
import { ProbabilityCalculator } from './core/probability-calculator';
import { TeamIDMapper } from './utils/team-id-mapper';
import { databaseTeamMapper } from './utils/database-team-mapper';

export class FootballIntelligenceEngine {
  private apiManager: FootballAPIManager;
  private cacheManager: FootballCacheManager;
  private teamIDMapper: TeamIDMapper;

  constructor() {
    console.log('🧠 Football Intelligence Engine (Modular) initializing...');
    
    // Initialize API keys from environment
    const apiKeys: Partial<APIKeys> = {
      'apifootball': process.env.APIFOOTBALL_KEY || '',
      'football-data-org': process.env.FOOTBALL_DATA_API_KEY || '',
      'api-football': process.env.API_FOOTBALL_KEY || '',
      'soccersapi': process.env.SOCCERSAPI_KEY || '',
      'soccersapi-username': process.env.SOCCERSAPI_USERNAME || '',
      'thesportsdb': process.env.THESPORTSDB_KEY || ''
    };

    // Initialize components
    this.apiManager = new FootballAPIManager(apiKeys);
    this.cacheManager = new FootballCacheManager();
    this.teamIDMapper = new TeamIDMapper();
    
    console.log('✅ Football Intelligence Engine (Modular) ready!');
  }

  /**
   * 🎯 Main Analysis Function - Clean and Simple
   * No more 2094 lines - just clean orchestration!
   */
  async analyzeMatch(
    homeTeam: string, 
    awayTeam: string, 
    league: string = 'Unknown'
  ): Promise<MatchAnalysis> {
    try {
      console.log(`🎯 Analyzing match: ${homeTeam} vs ${awayTeam} in ${league}`);

      // Get team data in parallel
      const [homeTeamData, awayTeamData] = await Promise.all([
        this.getTeamResearch(homeTeam),
        this.getTeamResearch(awayTeam)
      ]);

      // Get head-to-head data
      const headToHeadData = await this.getHeadToHeadData(homeTeamData, awayTeamData);

      // Calculate probabilities using our professional engine
      const mainProbabilities = ProbabilityCalculator.calculateAdvancedProbabilities(
        homeTeamData, 
        awayTeamData, 
        headToHeadData
      );

      // Calculate goal probabilities
      const goalProbabilities = ProbabilityCalculator.calculateGoalProbabilities(
        homeTeamData, 
        awayTeamData
      );

      // Calculate confidence and risk
      const confidence = ProbabilityCalculator.calculateConfidence(
        homeTeamData, 
        awayTeamData, 
        headToHeadData
      );
      const riskLevel = ProbabilityCalculator.assessRiskLevel(mainProbabilities);

      // Generate insights and value bets
      const insights = this.generateInsights(homeTeamData, awayTeamData);
      const valueBets = this.generateValueBets(mainProbabilities, goalProbabilities);

      // Create final analysis
      const analysis: MatchAnalysis = {
        matchId: `${homeTeam}-vs-${awayTeam}-${Date.now()}`,
        homeTeam,
        awayTeam,
        date: new Date().toISOString(),
        league,
        homeTeamResearch: homeTeamData,
        awayTeamResearch: awayTeamData,
        probabilities: mainProbabilities,
        confidence,
        insights,
        riskLevel,
        calculatedProbabilities: {
          homeWin: mainProbabilities.homeWin,
          draw: mainProbabilities.draw,
          awayWin: mainProbabilities.awayWin,
          bothTeamsScore: goalProbabilities.bothTeamsScore,
          over25Goals: goalProbabilities.over25Goals,
          under25Goals: goalProbabilities.under25Goals
        },
        valueBets,
        researchSummary: this.generateResearchSummary(homeTeamData, awayTeamData, valueBets)
      };

      console.log(`✅ Analysis complete: ${homeTeam} ${analysis.calculatedProbabilities.homeWin}% - Draw ${analysis.calculatedProbabilities.draw}% - ${awayTeam} ${analysis.calculatedProbabilities.awayWin}%`);
      return analysis;

    } catch (error) {
      console.error('❌ Error in match analysis:', error);
      return this.getFallbackAnalysis(homeTeam, awayTeam, league);
    }
  }

  /**
   * 🎯 Research Team (Enhanced with Dynamic Discovery)  
   */
  async researchTeam(teamName: string): Promise<TeamResearch> {
    const cacheKey = `team_research_${teamName}`;
    
    // Check cache first
    const cached = this.cacheManager.get(cacheKey);
    if (cached) {
      console.log(`💾 Using cached research for ${teamName}`);
      return cached as TeamResearch;
    }

    try {
      console.log(`🔍 Researching team: ${teamName}`);
      
      // Quick check if any APIs are available to save time
      const availableAPIs = await rateLimiter.getAvailableAPIs();
      if (availableAPIs.length === 0) {
        console.log(`⚠️ No APIs available due to rate limiting, using smart fallback for ${teamName}`);
        const fallback = FallbackDataGenerator.getRealisticTeamResearch(teamName);
        this.cacheManager.set(teamName, fallback);
        return fallback;
      }

      console.log(`📡 Available APIs: ${availableAPIs.join(', ')}`);
      
      // First try database, then dynamic discovery for new teams
      const discoveredTeam = await databaseTeamMapper.discoverTeam(teamName);

      // If database discovery worked, use it
      if (discoveredTeam && discoveredTeam.mappings && Object.keys(discoveredTeam.mappings).length > 0) {
        console.log(`✅ Database found ${teamName} with ${Object.keys(discoveredTeam.mappings).length} API mappings`);
        // Store discovered mapping for future use
        return await this.researchTeamWithDiscoveredData(teamName, discoveredTeam);
      }

      // Fallback to existing system for compatibility
      console.log(`🔄 Falling back to static mapping for ${teamName}`);
      return await this.getResearchWithRateLimit(teamName);

    } catch (error) {
      console.error(`❌ Error researching ${teamName}:`, error);
      const fallback = FallbackDataGenerator.getRealisticTeamResearch(teamName);
      this.cacheManager.set(teamName, fallback);
      return fallback;
    }
  }

  /**
   * 🔍 Research using discovered team data
   */
  private async researchTeamWithDiscoveredData(teamName: string, discoveredTeam: any): Promise<TeamResearch> {
    // For now, use existing research method but with enhanced logging
    console.log(`📊 Team found in database with APIs: ${Object.keys(discoveredTeam.mappings).join(', ')}`);
    console.log(`🎯 Primary aliases: ${discoveredTeam.aliases.join(', ')}`);
    
    // Use the most reliable API available
    const preferredAPIs = ['football-data', 'api-football', 'thesportsdb', 'apifootball'];
    for (const apiName of preferredAPIs) {
      if (discoveredTeam.mappings[apiName]) {
        const teamId = discoveredTeam.mappings[apiName].id;
        console.log(`🎯 Using ${apiName} with team ID: ${teamId}`);
        
        try {
          const teamData = await this.getTeamDataFromAPI(teamName, teamId, apiName);
          if (teamData && teamData.matches && teamData.matches.length > 0) {
            const research = this.calculateTeamStats(teamData.matches, teamName, teamData.teamInfo?.id);
            this.cacheManager.set(teamName, research);
            return research;
          }
        } catch (error) {
          console.log(`❌ Failed to use ${apiName} for ${teamName}, trying next API`);
        }
      }
    }

    // If all APIs failed, use fallback
    console.log(`⚠️ All discovered APIs failed for ${teamName}, using fallback`);
    const fallback = FallbackDataGenerator.getRealisticTeamResearch(teamName);
    this.cacheManager.set(teamName, fallback);
    return fallback;
  }

  /**
   * 📡 Get team data from specific API
   */
  private async getTeamDataFromAPI(teamName: string, teamId: string, apiName: string): Promise<any> {
    const canRequest = await rateLimiter.canMakeRequest(apiName);
    if (!canRequest) {
      console.log(`⏱️ Rate limited for ${apiName}`);
      return null;
    }

    try {
      const response = await this.apiManager.getTeamMatches(teamId, apiName);
      rateLimiter.recordRequest(apiName);
      
      return {
        teamInfo: { id: teamId, name: teamName },
        matches: response || []
      };
         } catch (error) {
       if (error instanceof Error && error.message.includes('429')) {
         rateLimiter.recordError(apiName, 429);
       }
       throw error;
     }
  }

  /**
   * 🔍 Get Team Research - With Rate Limiting and Universal ID Mapping
   */
  private async getTeamResearch(teamName: string): Promise<TeamResearch> {
    // Check cache first
    const cached = this.cacheManager.get(teamName);
    if (cached) {
      console.log(`💾 Using cached data for ${teamName}`);
      return cached;
    }

    try {
      console.log(`🔍 Enhanced research for team: ${teamName}`);
      
      // Step 1: Check if team exists in universal mapper
      const mappedTeam = this.teamIDMapper.findTeamByName(teamName);
      if (mappedTeam) {
        console.log(`✅ Found ${teamName} in universal mapper as ${mappedTeam.universalId}`);
        // Use cross-API IDs for more accurate search
        return await this.getResearchWithMapping(mappedTeam);
      }

      // Step 2: Fallback to regular API search with rate limiting
      console.log(`🔍 Team ${teamName} not in mapper, using API search with rate limiting`);
      return await this.getResearchWithRateLimit(teamName);

    } catch (error) {
      console.error(`❌ Error researching ${teamName}:`, error);
      const fallback = FallbackDataGenerator.getRealisticTeamResearch(teamName);
      this.cacheManager.set(teamName, fallback);
      return fallback;
    }
  }

  /**
   * 🗂️ Get Research Using Universal Team Mapping - With Intelligent Waiting
   */
  private async getResearchWithMapping(mappedTeam: any): Promise<TeamResearch> {
    const apiPriority = ['football-data', 'api-football', 'apifootball', 'thesportsdb'];
    
    console.log(`🔄 Trying APIs with intelligent waiting: ${apiPriority.join(', ')}`);
    
    for (const apiName of apiPriority) {
      const apiId = mappedTeam.ids[apiName];
      if (!apiId) continue;

      try {
        console.log(`📡 Trying ${apiName} with mapped ID: ${apiId}`);
        
        // Check if API is immediately available
        let canRequest = await rateLimiter.canMakeRequest(apiName);
        
        // If not immediately available, wait intelligently
        if (!canRequest) {
          console.log(`⏳ ${apiName} not immediately available, waiting intelligently...`);
          const waitSuccess = await intelligentWaiter.waitForAPI(apiName, 10000); // 10 second wait
          if (!waitSuccess) {
            console.log(`⏰ ${apiName} still unavailable after waiting, trying next API`);
            continue;
          }
          console.log(`✅ ${apiName} available after intelligent waiting`);
        }
        
        // Try to get data using the mapped ID
        const teamData = await this.apiManager.getComprehensiveTeamData(mappedTeam.name);
        
        if (teamData && teamData.matches && teamData.matches.length > 0) {
          console.log(`✅ Got ${teamData.matches.length} matches from ${apiName}`);
          const research = this.processTeamData(mappedTeam.name, teamData);
          this.cacheManager.set(mappedTeam.name, research);
          return research;
        }

      } catch (error: any) {
        console.log(`❌ Error with ${apiName}:`, error.message);
        
        // Record error for rate limiting
        if (error.message.includes('429')) {
          rateLimiter.recordError(apiName, 429);
        } else if (error.message.includes('500')) {
          rateLimiter.recordError(apiName, 500);
        }
        
        // Continue to next API instead of giving up
        continue;
      }
    }

    // If all APIs failed, use fallback
    console.log(`⚠️ All APIs failed or had no data for ${mappedTeam.name}, using tier-based fallback`);
    const tier = this.getTeamTier(mappedTeam.universalId);
    const fallback = FallbackDataGenerator.getRealisticTeamResearch(mappedTeam.name);
    this.cacheManager.set(mappedTeam.name, fallback);
    return fallback;
  }

  /**
   * ⏱️ Get Research With Rate Limiting (for unmapped teams)
   */
  private async getResearchWithRateLimit(teamName: string): Promise<TeamResearch> {
    // Check if football-data is available, if not, use fallback immediately
    const canRequest = await rateLimiter.canMakeRequest('football-data');
    if (!canRequest) {
      console.log(`⚠️ Football-Data API unavailable, using fallback for ${teamName}`);
      const fallback = FallbackDataGenerator.getRealisticTeamResearch(teamName);
      this.cacheManager.set(teamName, fallback);
      return fallback;
    }
    
    try {
      // Get comprehensive team data from APIs
      const teamData = await this.apiManager.getComprehensiveTeamData(teamName);
      
      // Record successful request
      rateLimiter.recordRequest('football-data');
      
      if (!teamData.teamInfo || teamData.matches.length === 0) {
        console.log(`⚠️ Limited data for ${teamName}, using realistic fallback`);
        const fallback = FallbackDataGenerator.getRealisticTeamResearch(teamName);
        this.cacheManager.set(teamName, fallback);
        return fallback;
      }

      // Process real data into team research
      const research = this.processTeamData(teamName, teamData);
      
      // Cache the result
      this.cacheManager.set(teamName, research);
      
      return research;

    } catch (error: any) {
      console.error(`❌ Rate-limited API error for ${teamName}:`, error);
      
      // Record error
      if (error.message.includes('429')) {
        rateLimiter.recordError('football-data', 429);
      }
      
      const fallback = FallbackDataGenerator.getRealisticTeamResearch(teamName);
      this.cacheManager.set(teamName, fallback);
      return fallback;
    }
  }

  /**
   * 🏆 Get Team Tier for Fallback Data
   */
  private getTeamTier(universalId: string): 'top' | 'mid' | 'lower' {
    const topTeams = ['real-madrid', 'barcelona', 'manchester-city', 'psg', 'bayern-munich'];
    const midTeams = ['arsenal', 'liverpool', 'chelsea', 'juventus', 'dortmund'];
    
    if (topTeams.includes(universalId)) return 'top';
    if (midTeams.includes(universalId)) return 'mid';
    return 'lower';
  }

  /**
   * 📊 Process Team Data from API Results
   */
  private processTeamData(teamName: string, teamData: any): TeamResearch {
    const matches = teamData.matches || [];
    
    // Ensure exactly 5 matches for consistency
    let processedMatches = matches.slice(0, 5);
    if (processedMatches.length < 5) {
      const fallbackMatches = FallbackDataGenerator.generateFallbackMatches(
        teamName, 
        processedMatches.length, 
        teamData.teamInfo?.id
      );
      processedMatches.push(...fallbackMatches);
    }

    // Calculate statistics from exactly 5 matches
    const stats = this.calculateTeamStats(processedMatches, teamName, teamData.teamInfo?.id);

    return {
      teamName,
      teamId: teamData.teamInfo?.id,
      lastUpdated: Date.now(),
      seasonStats: {
        played: 5, // Always 5 for consistency
        wins: stats.wins,
        draws: stats.draws,
        losses: stats.losses,
        goalsFor: stats.goalsFor,
        goalsAgainst: stats.goalsAgainst,
        goalDifference: stats.goalsFor - stats.goalsAgainst,
        points: (stats.wins * 3) + stats.draws
      },
      recentForm: this.calculateRecentForm(processedMatches, teamName),
      homeAwayRecord: {
        home: { played: 0, wins: 0, draws: 0, losses: 0 },
        away: { played: 0, wins: 0, draws: 0, losses: 0 }
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
   * 📊 Calculate Team Statistics from Exactly 5 Matches
   */
  private calculateTeamStats(matches: any[], teamName: string, teamId?: string): any {
    let wins = 0, draws = 0, losses = 0;
    let goalsFor = 0, goalsAgainst = 0;

    matches.forEach(match => {
      if (!match._fallback && match.match_status !== 'Finished') return;

      const isHome = (match.match_hometeam_name || '').toLowerCase().includes(teamName.toLowerCase()) ||
                     (teamId && match.match_hometeam_id === teamId);
      
      const homeScore = parseInt(match.match_hometeam_score) || 0;
      const awayScore = parseInt(match.match_awayteam_score) || 0;

      if (isHome) {
        goalsFor += homeScore;
        goalsAgainst += awayScore;
        if (homeScore > awayScore) wins++;
        else if (homeScore === awayScore) draws++;
        else losses++;
      } else {
        goalsFor += awayScore;
        goalsAgainst += homeScore;
        if (awayScore > homeScore) wins++;
        else if (awayScore === homeScore) draws++;
        else losses++;
      }
    });

    console.log(`📊 ${teamName} stats from 5 matches: ${wins}W ${draws}D ${losses}L, ${goalsFor} GF, ${goalsAgainst} GA`);

    return { wins, draws, losses, goalsFor, goalsAgainst };
  }

  /**
   * 📈 Calculate Recent Form
   */
  private calculateRecentForm(matches: any[], teamName: string): TeamResearch['recentForm'] {
    const form: string[] = [];
    let points = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;

    matches.forEach(match => {
      const isHome = (match.match_hometeam_name || '').toLowerCase().includes(teamName.toLowerCase());
      const homeScore = parseInt(match.match_hometeam_score) || 0;
      const awayScore = parseInt(match.match_awayteam_score) || 0;

      if (isHome) {
        goalsFor += homeScore;
        goalsAgainst += awayScore;
        if (homeScore > awayScore) { form.push('W'); points += 3; }
        else if (homeScore === awayScore) { form.push('D'); points += 1; }
        else { form.push('L'); }
      } else {
        goalsFor += awayScore;
        goalsAgainst += homeScore;
        if (awayScore > homeScore) { form.push('W'); points += 3; }
        else if (awayScore === homeScore) { form.push('D'); points += 1; }
        else { form.push('L'); }
      }
    });

    return {
      last5Games: form.join(''),
      last5Performance: Math.round((points / 15) * 100),
      recentGoalsScored: goalsFor,
      recentGoalsConceded: goalsAgainst
    };
  }

  /**
   * 🔄 Get Head-to-Head Data
   */
  private async getHeadToHeadData(homeTeam: TeamResearch, awayTeam: TeamResearch): Promise<any> {
    if (!homeTeam.teamId || !awayTeam.teamId) {
      return { totalMeetings: 0, homeWins: 0, awayWins: 0, draws: 0, lastMeetings: [] };
    }

    try {
      return await this.apiManager.getHeadToHead(
        homeTeam.teamId, 
        awayTeam.teamId, 
        homeTeam.teamName, 
        awayTeam.teamName
      );
    } catch (error) {
      console.error('❌ Error getting H2H data:', error);
      return { totalMeetings: 0, homeWins: 0, awayWins: 0, draws: 0, lastMeetings: [] };
    }
  }

  /**
   * 💡 Generate Insights
   */
  private generateInsights(homeTeam: TeamResearch, awayTeam: TeamResearch): string[] {
    const insights: string[] = [];
    
    const homeWinRate = homeTeam.seasonStats.played > 0 
      ? Math.round((homeTeam.seasonStats.wins / homeTeam.seasonStats.played) * 100)
      : 0;
    const awayWinRate = awayTeam.seasonStats.played > 0 
      ? Math.round((awayTeam.seasonStats.wins / awayTeam.seasonStats.played) * 100)
      : 0;

    if (Math.abs(homeWinRate - awayWinRate) > 20) {
      insights.push(`Significant form difference: ${homeTeam.teamName} ${homeWinRate}% vs ${awayTeam.teamName} ${awayWinRate}%`);
    }

    const homeGoalsAvg = homeTeam.seasonStats.played > 0 
      ? (homeTeam.seasonStats.goalsFor / homeTeam.seasonStats.played).toFixed(1)
      : '0.0';
    if (parseFloat(homeGoalsAvg) > 2.0) {
      insights.push(`${homeTeam.teamName} strong attack: ${homeGoalsAvg} goals per game`);
    }

    return insights.slice(0, 3);
  }

  /**
   * 💎 Generate Value Bets
   */
  private generateValueBets(mainProbs: any, goalProbs: any): MatchAnalysis['valueBets'] {
    const bets: MatchAnalysis['valueBets'] = [];
    
    // Main bet
    const maxProb = Math.max(mainProbs.homeWin, mainProbs.draw, mainProbs.awayWin);
    let mainTip = '';
    let confidence = 3;
    
    if (mainProbs.homeWin === maxProb) {
      mainTip = `Home Win (${mainProbs.homeWin}% chance)`;
      confidence = mainProbs.homeWin >= 60 ? 5 : 4;
    } else if (mainProbs.awayWin === maxProb) {
      mainTip = `Away Win (${mainProbs.awayWin}% chance)`;
      confidence = mainProbs.awayWin >= 60 ? 5 : 4;
    } else {
      mainTip = `Draw (${mainProbs.draw}% chance)`;
      confidence = 3;
    }

    bets.push({
      tip: mainTip,
      confidence,
      reasoning: `Analysis shows ${maxProb}% probability for this outcome`,
      riskLevel: maxProb >= 60 ? 'LOW' : maxProb >= 45 ? 'MEDIUM' : 'HIGH',
      expectedValue: (maxProb - 50) / 100
    });

    return bets;
  }

  /**
   * 📝 Generate Research Summary
   */
  private generateResearchSummary(homeTeam: TeamResearch, awayTeam: TeamResearch, valueBets: any[]): string {
    const homeWinRate = homeTeam.seasonStats.played > 0 
      ? Math.round((homeTeam.seasonStats.wins / homeTeam.seasonStats.played) * 100)
      : 0;
    const awayWinRate = awayTeam.seasonStats.played > 0 
      ? Math.round((awayTeam.seasonStats.wins / awayTeam.seasonStats.played) * 100)
      : 0;

    const homeGoalsAvg = homeTeam.seasonStats.played > 0 
      ? (homeTeam.seasonStats.goalsFor / homeTeam.seasonStats.played).toFixed(1)
      : '0.0';
    const awayGoalsAvg = awayTeam.seasonStats.played > 0 
      ? (awayTeam.seasonStats.goalsFor / awayTeam.seasonStats.played).toFixed(1)
      : '0.0';

    const bestBet = valueBets[0];
    
    return `${homeTeam.teamName} ${homeWinRate}% win rate, ${homeGoalsAvg} goals/game. ${awayTeam.teamName} ${awayWinRate}% win rate, ${awayGoalsAvg} goals/game.

Recommendation: ${bestBet?.tip || 'Insufficient data'}. ${bestBet?.reasoning || 'Consider all factors before betting.'}`;
  }

  /**
   * 🛡️ Fallback Analysis
   */
  private getFallbackAnalysis(homeTeam: string, awayTeam: string, league: string): MatchAnalysis {
    console.log(`⚠️ Using fallback analysis for ${homeTeam} vs ${awayTeam}`);
    
    return {
      matchId: `${homeTeam}-vs-${awayTeam}-${Date.now()}`,
      homeTeam,
      awayTeam,
      date: new Date().toISOString(),
      league,
      homeTeamResearch: FallbackDataGenerator.getMinimalTeamResearch(homeTeam),
      awayTeamResearch: FallbackDataGenerator.getMinimalTeamResearch(awayTeam),
      calculatedProbabilities: {
        homeWin: 35,
        draw: 30,
        awayWin: 35,
        bothTeamsScore: 45,
        over25Goals: 40,
        under25Goals: 60
      },
      valueBets: [{
        tip: 'Insufficient data for accurate prediction',
        confidence: 1,
        reasoning: 'Limited historical data available',
        riskLevel: 'HIGH',
        expectedValue: 0
      }],
      researchSummary: `Limited data available for ${homeTeam} vs ${awayTeam}. Recommend careful analysis before betting.`
    };
  }

  /**
   * 📊 Get Enhanced Status Information
   */
  getStatus(): { 
    availableAPIs: string[], 
    cacheStats: any,
    rateLimitStatus: any,
    teamMappings: number,
    initialized: boolean 
  } {
    return {
      availableAPIs: this.apiManager.getAvailableAPIs(),
      cacheStats: this.cacheManager.getStats(),
      rateLimitStatus: rateLimiter.getAllStatus(),
      teamMappings: 0, // Will be updated with database stats separately
      initialized: true
    };
  }

  async healthCheck(): Promise<any> {
    const apiHealth = await this.apiManager.healthCheck();
    const rateLimitStatus = rateLimiter.getAllStatus();
    
    return {
      apis: apiHealth,
      rateLimits: rateLimitStatus,
      cache: this.cacheManager.getStats(),
      timestamp: new Date().toISOString()
    };
  }

  clearCache(): void {
    this.cacheManager.clear();
  }

  /**
   * 🗂️ Debug Team Mapping
   */
  debugTeamMapping(teamName: string): void {
    this.teamIDMapper.debugTeam(teamName);
  }

  /**
   * 🔄 Reset Rate Limiter for API
   */
  resetRateLimit(apiName: string): void {
    rateLimiter.resetBackoff(apiName);
    console.log(`🔄 Reset rate limit for ${apiName}`);
  }

  /**
   * 📊 Get team mappings statistics from database
   */
  async getTeamMappingsStats(): Promise<any> {
    return await databaseTeamMapper.getDatabaseStats();
  }
}

// Export singleton instance (like the original)
export const footballIntelligenceEngine = new FootballIntelligenceEngine(); 