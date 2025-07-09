/**
 * 🚀 UNIFIED FOOTBALL SERVICE - Your SINGLE source for ALL football data
 * 
 * ============================================================================
 * 🎯 THIS IS THE ONLY FILE YOU NEED FOR FOOTBALL DATA!
 * ============================================================================
 * 
 * Features:
 * ✅ Uses ALL corrected API clients (TheSportsDB, API-Football, APIFootball.com, SoccersAPI)
 * ✅ Integrates your FootballMatchScorer for intelligent match ranking
 * ✅ Complete workflow: get matches → score them → get detailed info
 * ✅ Supports all content types: news, betting, polls, analysis, etc.
 * ✅ Multi-language support: English, Amharic, Swahili
 * 
 * ============================================================================
 * 🎯 MAIN USAGE EXAMPLES:
 * ============================================================================
 * 
 * // 1. Complete workflow (your exact requirement):
 * const result = await unifiedFootballService.getCompleteMatchAnalysis({
 *   type: 'betting_tip',
 *   language: 'en'
 * });
 * // Returns: bestMatch + detailedInfo + scoringResults + teamAnalysis
 * 
 * // 2. Get best match for specific content:
 * const bestMatch = await unifiedFootballService.getBestMatchForContent('news', 'en');
 * 
 * // 3. Get detailed info about specific teams:
 * const matchInfo = await unifiedFootballService.getDetailedMatchInfo('Arsenal', 'Chelsea');
 * 
 * // 4. Get team analysis:
 * const teamStats = await unifiedFootballService.getTeamAnalysis('Manchester City');
 * 
 * // 5. Get multiple options:
 * const topMatches = await unifiedFootballService.getTopMatchesWithDetails({
 *   type: 'analysis',
 *   language: 'en'
 * }, 3);
 * 
 * ============================================================================
 * 🎯 REPLACES THESE FILES - DON'T USE THEM ANYMORE:
 * ============================================================================
 * - FootballDataFetcher (669 lines) ❌
 * - SmartContentFetcher (890 lines) ❌ 
 * - Individual API clients directly ❌
 * 
 * ✅ Uses FootballMatchScorer (your scoring system)
 * ✅ Uses FootballAPIManager (all corrected APIs)
 */

import { getSportsApiKeys, isAPILimitReached, updateAPICallCount } from '@/lib/api-keys';
import { footballMatchScorer, ScoredMatch } from './football-match-scorer';
import { FootballAPIManager } from './football-intelligence/api/football-api-manager';
import { APIKeys } from './football-intelligence/types/football-types';

// Define MatchData locally since we removed football-data-fetcher
export interface MatchData {
  id: string;
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
  competition: { id: string; name: string };
  kickoff: Date;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'IN_PLAY';
  score?: { home: number; away: number };
  season?: string;
}

export interface ContentRequest {
  type: 'news' | 'betting_tip' | 'poll' | 'analysis' | 'daily_summary' | 'weekly_summary' | 'live_update';
  language: 'en' | 'am' | 'sw';
  maxResults?: number;
  preferences?: {
    leagues?: string[];
    teams?: string[];
  };
}

export interface AvailableAPI {
  name: string;
  key: string;
  url: string;
  isWorking: boolean;
}

// Export the smart match type from scorer for compatibility
export type SimpleMatch = ScoredMatch;

export class UnifiedFootballService {
  private availableApis: AvailableAPI[] = [];
  private lastApiCheck = 0;
  private readonly API_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private footballAPIManager: FootballAPIManager;

  constructor() {
    // Initialize API keys from environment - רק API-Football פעיל 
    const apiKeys: Partial<APIKeys> = {
      'apifootball': process.env.APIFOOTBALL_KEY || '',
      'football-data-org': process.env.FOOTBALL_DATA_API_KEY || '',
      'api-football': process.env.API_FOOTBALL_KEY || '',
      'soccersapi': process.env.SOCCERSAPI_KEY || '',
      'soccersapi-username': process.env.SOCCERSAPI_USERNAME || '',
      'thesportsdb': process.env.THESPORTSDB_KEY || '' // לא משתמשים בפרי key כדי להשבית
    };

    this.footballAPIManager = new FootballAPIManager(apiKeys);
    console.log('🚀 UnifiedFootballService initialized with FootballAPIManager');
  }

  /**
   * 🎯 MAIN WORKFLOW FUNCTION - Get smart matches with scoring
   * This combines: get matches → score them → return best matches
   */
  async getSmartMatchesWithScoring(request: ContentRequest): Promise<{
    bestMatches: SimpleMatch[];
    totalFound: number;
    apiUsed: string;
    scoringResults: any;
  }> {
    console.log(`🎯 MAIN WORKFLOW: Getting smart matches for ${request.type} in ${request.language}`);
    
    const smartMatches = await this.getSmartMatches(request);
    
    return {
      bestMatches: smartMatches,
      totalFound: smartMatches.length,
      apiUsed: smartMatches.length > 0 ? 'Multiple APIs' : 'None',
      scoringResults: {
        maxScore: smartMatches[0]?.relevance_score?.total || 0,
        contentSuitability: smartMatches[0]?.content_suitability || {},
        scoringReasons: smartMatches[0]?.reasons || []
      }
    };
  }

  /**
   * 🎯 Get detailed match information using FootballAPIManager
   * This is the function you described - get match details after selecting the best match
   */
  async getDetailedMatchInfo(homeTeam: string, awayTeam: string, league?: string): Promise<any> {
    try {
      console.log(`🔍 Getting detailed info for: ${homeTeam} vs ${awayTeam}`);
      
      // First, search for both teams to get their IDs
      const [homeTeamResult, awayTeamResult] = await Promise.all([
        this.footballAPIManager.findTeam(homeTeam),
        this.footballAPIManager.findTeam(awayTeam)
      ]);

      if (!homeTeamResult || !awayTeamResult) {
        console.log(`⚠️ Could not find team data for ${homeTeam} or ${awayTeam}`);
        return null;
      }

      console.log(`✅ Found teams: ${homeTeamResult.name} (ID: ${homeTeamResult.id}), ${awayTeamResult.name} (ID: ${awayTeamResult.id})`);

      // Get detailed match data using our APIs
      const [homeTeamMatches, awayTeamMatches, headToHeadData] = await Promise.all([
        this.footballAPIManager.getTeamMatches(homeTeamResult.id, homeTeamResult.name, 5),
        this.footballAPIManager.getTeamMatches(awayTeamResult.id, awayTeamResult.name, 5),
        this.footballAPIManager.getHeadToHead(homeTeamResult.id, awayTeamResult.id, homeTeamResult.name, awayTeamResult.name)
      ]);

      // Get upcoming matches for both teams
      const [homeUpcomingMatches, awayUpcomingMatches] = await Promise.all([
        this.footballAPIManager.getTeamUpcomingMatches(homeTeamResult.id, homeTeamResult.name, 3),
        this.footballAPIManager.getTeamUpcomingMatches(awayTeamResult.id, awayTeamResult.name, 3)
      ]);

      return {
        homeTeam: {
          info: homeTeamResult,
          recentMatches: homeTeamMatches,
          upcomingMatches: homeUpcomingMatches
        },
        awayTeam: {
          info: awayTeamResult,
          recentMatches: awayTeamMatches,
          upcomingMatches: awayUpcomingMatches
        },
        headToHead: headToHeadData,
        league: league || 'Unknown',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Error getting detailed match info:`, error);
      return null;
    }
  }

  /**
   * 🎯 NEW: Get detailed match information using IDs directly (bypasses team search)
   * This is much more efficient when we already have the team IDs from fixtures
   */
  async getDetailedMatchInfoByIds(
    homeTeamId: string, 
    homeTeamName: string, 
    awayTeamId: string, 
    awayTeamName: string, 
    league?: string
  ): Promise<any> {
    try {
      console.log(`🔍 Getting detailed info using IDs: ${homeTeamName} (${homeTeamId}) vs ${awayTeamName} (${awayTeamId})`);

      // Get detailed match data using our APIs with the IDs we already have
      const [homeTeamMatches, awayTeamMatches, headToHeadData] = await Promise.all([
        this.footballAPIManager.getTeamMatches(homeTeamId, homeTeamName, 5),
        this.footballAPIManager.getTeamMatches(awayTeamId, awayTeamName, 5),
        this.footballAPIManager.getHeadToHead(homeTeamId, awayTeamId, homeTeamName, awayTeamName)
      ]);

      // Get upcoming matches for both teams
      const [homeUpcomingMatches, awayUpcomingMatches] = await Promise.all([
        this.footballAPIManager.getTeamUpcomingMatches(homeTeamId, homeTeamName, 3),
        this.footballAPIManager.getTeamUpcomingMatches(awayTeamId, awayTeamName, 3)
      ]);

      return {
        homeTeam: {
          info: { id: homeTeamId, name: homeTeamName },
          recentMatches: homeTeamMatches,
          upcomingMatches: homeUpcomingMatches
        },
        awayTeam: {
          info: { id: awayTeamId, name: awayTeamName },
          recentMatches: awayTeamMatches,
          upcomingMatches: awayUpcomingMatches
        },
        headToHead: headToHeadData,
        league: league || 'Unknown',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Error getting detailed match info by IDs:`, error);
      return null;
    }
  }

  /**
   * 🎯 Get team analysis using FootballAPIManager
   * Enhanced team research using our new API clients
   */
  async getTeamAnalysis(teamName: string): Promise<any> {
    try {
      console.log(`🔍 Getting team analysis for: ${teamName}`);
      
      // Search for the team
      const teamResult = await this.footballAPIManager.findTeam(teamName);
      if (!teamResult) {
        console.log(`⚠️ Could not find team: ${teamName}`);
        return null;
      }

      // Get comprehensive team data
      const [recentMatches, upcomingMatches] = await Promise.all([
        this.footballAPIManager.getTeamMatches(teamResult.id, teamResult.name, 10),
        this.footballAPIManager.getTeamUpcomingMatches(teamResult.id, teamResult.name, 5)
      ]);

      // Calculate team statistics
      const stats = this.calculateTeamStatistics(recentMatches, teamName);

      return {
        teamInfo: teamResult,
        recentMatches,
        upcomingMatches,
        statistics: stats,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Error getting team analysis:`, error);
      return null;
    }
  }

  /**
   * 🎯 NEW: Get team analysis using ID directly (bypasses team search)
   * Enhanced team research using our new API clients
   */
  async getTeamAnalysisById(teamId: string, teamName: string): Promise<any> {
    try {
      console.log(`🔍 Getting team analysis using ID: ${teamName} (${teamId})`);

      // Get comprehensive team data using the ID we already have
      const [recentMatches, upcomingMatches] = await Promise.all([
        this.footballAPIManager.getTeamMatches(teamId, teamName, 10),
        this.footballAPIManager.getTeamUpcomingMatches(teamId, teamName, 5)
      ]);

      // Calculate team statistics
      const stats = this.calculateTeamStatistics(recentMatches, teamName);

      return {
        teamInfo: { id: teamId, name: teamName },
        recentMatches,
        upcomingMatches,
        statistics: stats,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`❌ Error getting team analysis by ID:`, error);
      return null;
    }
  }

  /**
   * 🎯 COMPLETE WORKFLOW - Get best match and detailed info in one call
   * This is your exact workflow: get matches → score → get details
   */
  async getCompleteMatchAnalysis(request: ContentRequest): Promise<{
    bestMatch: SimpleMatch | null;
    detailedInfo: any;
    scoringResults: any;
    teamAnalysis: {
      homeTeam: any;
      awayTeam: any;
    };
  }> {
    console.log(`🎯 COMPLETE WORKFLOW: Getting full analysis for ${request.type}`);
    
    try {
      // Step 1: Get smart matches with scoring
      const smartResults = await this.getSmartMatchesWithScoring(request);
      
      if (smartResults.bestMatches.length === 0) {
        console.log(`❌ No matches found for ${request.type}`);
        return {
          bestMatch: null,
          detailedInfo: null,
          scoringResults: smartResults.scoringResults,
          teamAnalysis: { homeTeam: null, awayTeam: null }
        };
      }

      const bestMatch = smartResults.bestMatches[0];
      console.log(`🏆 Best match: ${bestMatch.homeTeam.name} vs ${bestMatch.awayTeam.name} (Score: ${bestMatch.relevance_score.total})`);

      // Step 2: Get detailed match info
      const detailedInfo = await this.getDetailedMatchInfo(
        bestMatch.homeTeam.name,
        bestMatch.awayTeam.name,
        bestMatch.competition.name
      );

      // Step 3: Get team analysis for both teams using IDs if available
      let homeTeamAnalysis, awayTeamAnalysis;
      
      if (bestMatch.homeTeam.id && bestMatch.awayTeam.id) {
        console.log(`✅ Using team IDs for complete analysis: Home ${bestMatch.homeTeam.id}, Away ${bestMatch.awayTeam.id}`);
        [homeTeamAnalysis, awayTeamAnalysis] = await Promise.all([
          this.getTeamAnalysisById(bestMatch.homeTeam.id, bestMatch.homeTeam.name),
          this.getTeamAnalysisById(bestMatch.awayTeam.id, bestMatch.awayTeam.name)
        ]);
      } else {
        console.log(`⚠️ No team IDs available for complete analysis, falling back to name search`);
        [homeTeamAnalysis, awayTeamAnalysis] = await Promise.all([
          this.getTeamAnalysis(bestMatch.homeTeam.name),
          this.getTeamAnalysis(bestMatch.awayTeam.name)
        ]);
      }

      return {
        bestMatch,
        detailedInfo,
        scoringResults: smartResults.scoringResults,
        teamAnalysis: {
          homeTeam: homeTeamAnalysis,
          awayTeam: awayTeamAnalysis
        }
      };

    } catch (error) {
      console.error(`❌ Error in complete workflow:`, error);
      return {
        bestMatch: null,
        detailedInfo: null,
        scoringResults: { maxScore: 0, contentSuitability: {}, scoringReasons: [] },
        teamAnalysis: { homeTeam: null, awayTeam: null }
      };
    }
  }

  /**
   * 🎯 Get multiple best matches with their detailed info
   * For when you need more than one match option
   */
  async getTopMatchesWithDetails(request: ContentRequest, count: number = 3): Promise<{
    matches: Array<{
      match: SimpleMatch;
      detailedInfo: any;
      homeTeamAnalysis: any;
      awayTeamAnalysis: any;
    }>;
    scoringResults: any;
  }> {
    console.log(`🎯 Getting top ${count} matches with details for ${request.type}`);
    
    try {
      // Get smart matches
      const smartResults = await this.getSmartMatchesWithScoring(request);
      const topMatches = smartResults.bestMatches.slice(0, count);

      if (topMatches.length === 0) {
        return {
          matches: [],
          scoringResults: smartResults.scoringResults
        };
      }

      // Get detailed info for each match using IDs if available
      const matchesWithDetails = await Promise.all(
        topMatches.map(async (match) => {
          let detailedInfo, homeTeamAnalysis, awayTeamAnalysis;
          
          if (match.homeTeam.id && match.awayTeam.id) {
            console.log(`✅ Using team IDs for top matches: ${match.homeTeam.name} (${match.homeTeam.id}) vs ${match.awayTeam.name} (${match.awayTeam.id})`);
            [detailedInfo, homeTeamAnalysis, awayTeamAnalysis] = await Promise.all([
              this.getDetailedMatchInfoByIds(match.homeTeam.id, match.homeTeam.name, match.awayTeam.id, match.awayTeam.name, match.competition.name),
              this.getTeamAnalysisById(match.homeTeam.id, match.homeTeam.name),
              this.getTeamAnalysisById(match.awayTeam.id, match.awayTeam.name)
            ]);
          } else {
            console.log(`⚠️ No team IDs available for ${match.homeTeam.name} vs ${match.awayTeam.name}, falling back to name search`);
            [detailedInfo, homeTeamAnalysis, awayTeamAnalysis] = await Promise.all([
              this.getDetailedMatchInfo(match.homeTeam.name, match.awayTeam.name, match.competition.name),
              this.getTeamAnalysis(match.homeTeam.name),
              this.getTeamAnalysis(match.awayTeam.name)
            ]);
          }

          return {
            match,
            detailedInfo,
            homeTeamAnalysis,
            awayTeamAnalysis
          };
        })
      );

      return {
        matches: matchesWithDetails,
        scoringResults: smartResults.scoringResults
      };

    } catch (error) {
      console.error(`❌ Error getting top matches with details:`, error);
      return {
        matches: [],
        scoringResults: { maxScore: 0, contentSuitability: {}, scoringReasons: [] }
      };
    }
  }

  /**
   * 🎯 Get matches by specific content type with optimized scoring
   * Uses the scorer's content-specific scoring
   */
  async getMatchesForContentType(
    contentType: 'news' | 'betting_tip' | 'poll' | 'analysis' | 'daily_summary' | 'weekly_summary' | 'live_update',
    language: 'en' | 'am' | 'sw' = 'en',
    maxResults: number = 5
  ): Promise<{
    matches: SimpleMatch[];
    contentSuitability: any;
    recommendations: string[];
  }> {
    console.log(`🎯 Getting matches optimized for ${contentType} content`);
    
    const request: ContentRequest = {
      type: contentType,
      language,
      maxResults
    };

    const smartResults = await this.getSmartMatchesWithScoring(request);
    
    // Extract content-specific recommendations
    const recommendations: string[] = [];
    if (smartResults.bestMatches.length > 0) {
      const bestMatch = smartResults.bestMatches[0];
      const suitability = bestMatch.content_suitability[contentType] || 0;
      
      if (suitability >= 80) {
        recommendations.push(`Excellent match for ${contentType} content`);
      } else if (suitability >= 60) {
        recommendations.push(`Good match for ${contentType} content`);
      } else if (suitability >= 40) {
        recommendations.push(`Moderate fit for ${contentType} content`);
      } else {
        recommendations.push(`Limited suitability for ${contentType} content`);
      }

      // Add specific reasons
      if (bestMatch.reasons) {
        recommendations.push(...bestMatch.reasons);
      }
    }

    return {
      matches: smartResults.bestMatches,
      contentSuitability: smartResults.scoringResults.contentSuitability,
      recommendations
    };
  }

  /**
   * 🎯 Re-score existing matches for different content type
   * When you want to see how existing matches score for different content
   */
  async rescoreMatchesForContent(
    matches: MatchData[],
    contentType: 'news' | 'betting_tip' | 'poll' | 'analysis' | 'daily_summary' | 'weekly_summary' | 'live_update',
    maxResults: number = 5
  ): Promise<SimpleMatch[]> {
    console.log(`🎯 Re-scoring ${matches.length} matches for ${contentType} content`);
    
    return await footballMatchScorer.getBestMatchesForContentType(
      matches,
      contentType,
      maxResults
    );
  }

  /**
   * 📊 Calculate team statistics from matches
   */
  private calculateTeamStatistics(matches: any[], teamName: string): any {
    if (!matches || matches.length === 0) {
      return {
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        winRate: 0,
        form: 'N/A'
      };
    }

    let wins = 0, draws = 0, losses = 0;
    let goalsFor = 0, goalsAgainst = 0;
    const form: string[] = [];

    matches.forEach(match => {
      if (match.match_status !== 'Finished') return;

      const isHome = match.match_hometeam_name.toLowerCase().includes(teamName.toLowerCase());
      const homeScore = parseInt(match.match_hometeam_score) || 0;
      const awayScore = parseInt(match.match_awayteam_score) || 0;

      if (isHome) {
        goalsFor += homeScore;
        goalsAgainst += awayScore;
        if (homeScore > awayScore) { wins++; form.push('W'); }
        else if (homeScore === awayScore) { draws++; form.push('D'); }
        else { losses++; form.push('L'); }
      } else {
        goalsFor += awayScore;
        goalsAgainst += homeScore;
        if (awayScore > homeScore) { wins++; form.push('W'); }
        else if (awayScore === homeScore) { draws++; form.push('D'); }
        else { losses++; form.push('L'); }
      }
    });

    const played = wins + draws + losses;
    const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;

    return {
      played,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      winRate,
      form: form.slice(-5).join('') // Last 5 matches
    };
  }

  // =============================================================================
  // 🎯 MAIN PUBLIC API - These are the ONLY methods you need to use
  // =============================================================================

  /**
   * 🎯 המטרה העיקרית: קבל משחקים חכמים עבור תוכן
   * ✅ משתמש בלוגיקה החכמה הקיימת של FootballMatchScorer!
   * 🔄 מנסה את כל ה-APIs עד שמוצא משחקים!
   */
  async getSmartMatches(request: ContentRequest): Promise<SimpleMatch[]> {
    console.log(`🎯 === DETAILED API DEBUG FOR SMART MATCHES ===`);
    console.log(`🎯 Getting smart matches for ${request.type} in ${request.language}`);
    
    // Add file logging
    const fs = require('fs');
    fs.appendFileSync('/tmp/betting_debug.log', `\n🎯 === UNIFIED SERVICE DEBUG ===\n`);
    fs.appendFileSync('/tmp/betting_debug.log', `🎯 Getting smart matches for ${request.type} in ${request.language}\n`);
    
    try {
      // Get all working APIs
      await this.refreshAvailableAPIs();
      const workingApis = this.availableApis.filter(api => api.isWorking);
      
      console.log(`🔍 WORKING APIS DEBUG:`);
      console.log(`  - Total APIs found: ${this.availableApis.length}`);
      console.log(`  - Working APIs: ${workingApis.length}`);
      workingApis.forEach((api, index) => {
        console.log(`  - API ${index + 1}: ${api.name} (${api.url})`);
      });
      
      fs.appendFileSync('/tmp/betting_debug.log', `🔍 WORKING APIS DEBUG:\n`);
      fs.appendFileSync('/tmp/betting_debug.log', `  - Total APIs found: ${this.availableApis.length}\n`);
      fs.appendFileSync('/tmp/betting_debug.log', `  - Working APIs: ${workingApis.length}\n`);
      workingApis.forEach((api, index) => {
        fs.appendFileSync('/tmp/betting_debug.log', `  - API ${index + 1}: ${api.name} (${api.url})\n`);
      });
      
      if (workingApis.length === 0) {
        console.log('❌ No working football APIs available');
        fs.appendFileSync('/tmp/betting_debug.log', '❌ No working football APIs available\n');
        return this.getFallbackMatches(request);
      }

      console.log(`🔑 Available APIs: ${workingApis.map(api => api.name).join(', ')}`);
      fs.appendFileSync('/tmp/betting_debug.log', `🔑 Available APIs: ${workingApis.map(api => api.name).join(', ')}\n`);
      
      // Try each API until we find matches
      for (const api of workingApis) {
        try {
          console.log(`\n🔄 === TRYING API: ${api.name} ===`);
          fs.appendFileSync('/tmp/betting_debug.log', `\n🔄 === TRYING API: ${api.name} ===\n`);
          
          // Check if API limit reached
          const limitReached = await isAPILimitReached(api.name);
          if (limitReached) {
            console.log(`⚠️ ${api.name} has reached its limit, trying next API`);
            fs.appendFileSync('/tmp/betting_debug.log', `⚠️ ${api.name} has reached its limit, trying next API\n`);
            continue;
          }

          console.log(`✅ Using ${api.name} API - ${api.url}`);
          fs.appendFileSync('/tmp/betting_debug.log', `✅ Using ${api.name} API - ${api.url}\n`);
          
          // Get raw matches from this API
          console.log(`📡 Fetching raw matches from ${api.name}...`);
          fs.appendFileSync('/tmp/betting_debug.log', `📡 Fetching raw matches from ${api.name}...\n`);
          const rawMatches = await this.fetchMatchesFromAPI(api, request);
          console.log(`⚽ Got ${rawMatches.length} raw matches from ${api.name}`);
          fs.appendFileSync('/tmp/betting_debug.log', `⚽ Got ${rawMatches.length} raw matches from ${api.name}\n`);
          
          if (rawMatches.length > 0) {
            console.log(`📊 RAW MATCHES SAMPLE (first 3):`);
            fs.appendFileSync('/tmp/betting_debug.log', `📊 RAW MATCHES SAMPLE (first 3):\n`);
            rawMatches.slice(0, 3).forEach((match, i) => {
              console.log(`  Match ${i + 1}: ${match.homeTeam.name} vs ${match.awayTeam.name}`);
              console.log(`    - Competition: ${match.competition.name}`);
              console.log(`    - Kickoff: ${match.kickoff}`);
              console.log(`    - Status: ${match.status}`);
              console.log(`    - Home ID: ${match.homeTeam.id}, Away ID: ${match.awayTeam.id}`);
              
              fs.appendFileSync('/tmp/betting_debug.log', `  Match ${i + 1}: ${match.homeTeam.name} vs ${match.awayTeam.name}\n`);
              fs.appendFileSync('/tmp/betting_debug.log', `    - Competition: ${match.competition.name}\n`);
              fs.appendFileSync('/tmp/betting_debug.log', `    - Kickoff: ${match.kickoff}\n`);
              fs.appendFileSync('/tmp/betting_debug.log', `    - Status: ${match.status}\n`);
              fs.appendFileSync('/tmp/betting_debug.log', `    - Home ID: ${match.homeTeam.id}, Away ID: ${match.awayTeam.id}\n`);
            });
          }
          
          if (rawMatches.length === 0) {
            console.log(`🚫 No matches from ${api.name}, trying next API...`);
            fs.appendFileSync('/tmp/betting_debug.log', `🚫 No matches from ${api.name}, trying next API...\n`);
            continue; // Try next API instead of giving up!
          }

          // 🧠 Use existing smart scoring logic!
          console.log(`🧠 Running smart scoring on ${rawMatches.length} matches...`);
          fs.appendFileSync('/tmp/betting_debug.log', `🧠 Running smart scoring on ${rawMatches.length} matches...\n`);
          const smartMatches = await footballMatchScorer.getBestMatchesForContentType(
            rawMatches,
            request.type,
            request.maxResults || 5
          );
          
          console.log(`🧠 Smart Football Scorer found ${smartMatches.length} relevant matches from ${api.name}`);
          fs.appendFileSync('/tmp/betting_debug.log', `🧠 Smart Football Scorer found ${smartMatches.length} relevant matches from ${api.name}\n`);
          
          if (smartMatches.length > 0) {
            console.log(`🔝 BEST SMART MATCH DETAILS:`);
            const bestMatch = smartMatches[0];
            console.log(`  - Match: ${bestMatch.homeTeam.name} vs ${bestMatch.awayTeam.name}`);
            console.log(`  - Total Score: ${bestMatch.relevance_score.total}`);
            console.log(`  - Competition: ${bestMatch.competition.name}`);
            console.log(`  - Kickoff: ${bestMatch.kickoff}`);
            console.log(`  - Status: ${bestMatch.status}`);
            console.log(`  - Content Suitability for ${request.type}: ${bestMatch.content_suitability[request.type] || 'N/A'}`);
            console.log(`  - Home Team ID: ${bestMatch.homeTeam.id}`);
            console.log(`  - Away Team ID: ${bestMatch.awayTeam.id}`);
            
            fs.appendFileSync('/tmp/betting_debug.log', `🔝 BEST SMART MATCH DETAILS:\n`);
            fs.appendFileSync('/tmp/betting_debug.log', `  - Match: ${bestMatch.homeTeam.name} vs ${bestMatch.awayTeam.name}\n`);
            fs.appendFileSync('/tmp/betting_debug.log', `  - Total Score: ${bestMatch.relevance_score.total}\n`);
            fs.appendFileSync('/tmp/betting_debug.log', `  - Competition: ${bestMatch.competition.name}\n`);
            fs.appendFileSync('/tmp/betting_debug.log', `  - Kickoff: ${bestMatch.kickoff}\n`);
            fs.appendFileSync('/tmp/betting_debug.log', `  - Status: ${bestMatch.status}\n`);
            fs.appendFileSync('/tmp/betting_debug.log', `  - Content Suitability for ${request.type}: ${bestMatch.content_suitability[request.type] || 'N/A'}\n`);
            fs.appendFileSync('/tmp/betting_debug.log', `  - Home Team ID: ${bestMatch.homeTeam.id}\n`);
            fs.appendFileSync('/tmp/betting_debug.log', `  - Away Team ID: ${bestMatch.awayTeam.id}\n`);
            
            return smartMatches; // Success! Return immediately
          }

        } catch (apiError) {
          console.error(`❌ Error with ${api.name}:`, apiError);
          console.log(`🔄 Trying next API...`);
          fs.appendFileSync('/tmp/betting_debug.log', `❌ Error with ${api.name}: ${apiError}\n`);
          fs.appendFileSync('/tmp/betting_debug.log', `🔄 Trying next API...\n`);
          continue; // Try next API
        }
      }

      // Last resort: Try TheSportsDB for matches
      console.log('\n🆓 === LAST RESORT: TheSportsDB ===');
      fs.appendFileSync('/tmp/betting_debug.log', '\n🆓 === LAST RESORT: TheSportsDB ===\n');
      try {
        const thesportsdbMatches = await this.fetchFromTheSportsDB(request);
        console.log(`📊 TheSportsDB returned ${thesportsdbMatches.length} matches`);
        fs.appendFileSync('/tmp/betting_debug.log', `📊 TheSportsDB returned ${thesportsdbMatches.length} matches\n`);
        
        if (thesportsdbMatches.length > 0) {
          console.log(`🏆 Found ${thesportsdbMatches.length} matches from TheSportsDB!`);
          fs.appendFileSync('/tmp/betting_debug.log', `🏆 Found ${thesportsdbMatches.length} matches from TheSportsDB!\n`);
          
          // Apply smart scoring to TheSportsDB matches
          const smartMatches = await footballMatchScorer.getBestMatchesForContentType(
            thesportsdbMatches,
            request.type,
            request.maxResults || 5
          );
          
          if (smartMatches.length > 0) {
            console.log(`🧠 TheSportsDB: ${smartMatches.length} smart matches after scoring`);
            const bestMatch = smartMatches[0];
            console.log(`🔝 TheSportsDB BEST MATCH: ${bestMatch.homeTeam.name} vs ${bestMatch.awayTeam.name}`);
            fs.appendFileSync('/tmp/betting_debug.log', `🧠 TheSportsDB: ${smartMatches.length} smart matches after scoring\n`);
            fs.appendFileSync('/tmp/betting_debug.log', `🔝 TheSportsDB BEST MATCH: ${bestMatch.homeTeam.name} vs ${bestMatch.awayTeam.name}\n`);
            return smartMatches;
          }
        }
      } catch (error) {
        console.error('❌ TheSportsDB fallback failed:', error);
        fs.appendFileSync('/tmp/betting_debug.log', `❌ TheSportsDB fallback failed: ${error}\n`);
      }

      // If we get here, all APIs failed or returned no results
      console.log('🚫 No real matches available - returning empty array (no fake matches!)');
      fs.appendFileSync('/tmp/betting_debug.log', '🚫 No real matches available - returning empty array (no fake matches!)\n');
      return [];

    } catch (error) {
      console.error('❌ Error getting smart matches:', error);
      fs.appendFileSync('/tmp/betting_debug.log', `❌ Error getting smart matches: ${error}\n`);
      return this.getFallbackMatches(request);
    }
  }

  // =============================================================================
  // 🛠️ UTILITY METHODS - Additional helpful functions
  // =============================================================================

  /**
   * 🎯 Quick method: Get best match for specific content type
   */
  async getBestMatchForContent(
    contentType: 'news' | 'betting_tip' | 'poll' | 'analysis' | 'daily_summary' | 'weekly_summary' | 'live_update',
    language: 'en' | 'am' | 'sw' = 'en'
  ): Promise<SimpleMatch | null> {
    const results = await this.getMatchesForContentType(contentType, language, 1);
    return results.matches[0] || null;
  }

  /**
   * 🎯 Quick method: Get team vs team analysis
   */
  async getTeamVsTeamAnalysis(homeTeam: string, awayTeam: string): Promise<any> {
    return await this.getDetailedMatchInfo(homeTeam, awayTeam);
  }

  /**
   * 🎯 Get API health status
   */
  async getAPIStatus(): Promise<{
    footballAPIManager: string[];
    workingAPIs: number;
    totalAPIs: number;
    isHealthy: boolean;
  }> {
    await this.refreshAvailableAPIs();
    const workingApis = this.availableApis.filter(api => api.isWorking).length;
    
    return {
      footballAPIManager: this.footballAPIManager.getAvailableAPIs(),
      workingAPIs: workingApis,
      totalAPIs: this.availableApis.length,
      isHealthy: workingApis > 0
    };
  }

  /**
   * 🎯 Get scorer statistics
   */
  getScorerInfo(): any {
    return {
      scorerReady: true,
      supportedContentTypes: ['news', 'betting_tip', 'poll', 'analysis', 'daily_summary', 'live_update'],
      supportedLanguages: ['en', 'am', 'sw'],
      scoringFactors: ['competition', 'teams', 'timing', 'stage', 'rivalry']
    };
  }

  // =============================================================================
  // 🔧 PRIVATE METHODS - Internal implementation details
  // =============================================================================

  /**
   * 🔍 מציאת API עובד (עם fallback חכם)
   */
  private async getWorkingAPI(): Promise<AvailableAPI | null> {
    try {
      // Check if we need to refresh API list
      const now = Date.now();
      if (now - this.lastApiCheck > this.API_CHECK_INTERVAL || this.availableApis.length === 0) {
        await this.refreshAvailableAPIs();
        this.lastApiCheck = now;
      }

      // Find first working API
      for (const api of this.availableApis) {
        if (api.isWorking) {
          const limitReached = await isAPILimitReached(api.name);
          if (!limitReached) {
            return api;
          } else {
            console.log(`⚠️ ${api.name} has reached its limit`);
          }
        }
      }

      console.log('❌ No working APIs available');
      return null;

    } catch (error) {
      console.error('❌ Error getting working API:', error);
      return null;
    }
  }

  /**
   * 🔄 רענון רשימת APIים זמינים
   */
  private async refreshAvailableAPIs(): Promise<void> {
    try {
      console.log('🔄 Refreshing available APIs...');
      
      const allApis = await getSportsApiKeys();
      const sortedApis = Object.values(allApis).sort((a, b) => a.priority - b.priority);
      
      this.availableApis = [];
      
      for (const api of sortedApis) {
        if (api.api_key && api.api_url && api.is_active) {
          // Validate URL format
          let cleanUrl = api.api_url.trim();
          if (!cleanUrl.startsWith('http')) {
            cleanUrl = 'https://' + cleanUrl;
          }
          if (cleanUrl.endsWith('/')) {
            cleanUrl = cleanUrl.slice(0, -1);
          }

          this.availableApis.push({
            name: api.name,
            key: api.api_key,
            url: cleanUrl,
            isWorking: true // We'll test this in real calls
          });
          
          console.log(`✅ Added ${api.name}: ${cleanUrl}`);
        } else {
          console.log(`❌ Skipped ${api.name}: missing key or url`);
        }
      }

      console.log(`🔑 Total working APIs: ${this.availableApis.length}`);

    } catch (error) {
      console.error('❌ Error refreshing APIs:', error);
      this.availableApis = [];
    }
  }

  /**
   * ⚽ שליפת משחקים מAPI ספציפי - עם FootballAPIManager החדש
   */
  private async fetchMatchesFromAPI(api: AvailableAPI, request: ContentRequest): Promise<MatchData[]> {
    try {
      console.log(`📡 Fetching from ${api.name} using new API clients...`);
      
      // Use our new FootballAPIManager to get fixture data
      const matches = await this.getMatchesFromFootballAPIManager(request);
      
      if (matches.length > 0) {
        await updateAPICallCount(api.name, 1);
        console.log(`✅ Successfully fetched ${matches.length} matches using FootballAPIManager`);
        return matches;
      }
      
      // Fallback to TheSportsDB if no matches found
      console.log(`🔄 No matches from FootballAPIManager, trying TheSportsDB fallback...`);
      const fallbackMatches = await this.fetchFromTheSportsDB(request);
      if (fallbackMatches.length > 0) {
        await updateAPICallCount('thesportsdb', 1);
        console.log(`✅ Successfully fetched ${fallbackMatches.length} matches from TheSportsDB fallback`);
        return fallbackMatches;
      }

      return [];

    } catch (error) {
      console.error(`❌ Error with ${api.name}:`, error);
      
      // Mark API as not working
      const apiIndex = this.availableApis.findIndex(a => a.name === api.name);
      if (apiIndex >= 0) {
        this.availableApis[apiIndex].isWorking = false;
        console.log(`🚫 Marked ${api.name} as not working`);
      }
      
      return [];
    }
  }

  /**
   * 🎯 Get matches using our new FootballAPIManager
   */
  private async getMatchesFromFootballAPIManager(request: ContentRequest): Promise<MatchData[]> {
    try {
      const today = new Date();
      
      // 🎯 Define date range based on content type - CORRECTED LOGIC
      let startDate: Date;
      let endDate: Date;
      
      // תאריכים נכונים לפי סוג תוכן
      switch (request.type) {
        case 'daily_summary':
          // סיכום יומי - אתמול בלבד
          startDate = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000); // אתמול
          endDate = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000); // אתמול
          console.log(`📅 Daily summary: Looking for matches from YESTERDAY only`);
          break;
          
        case 'weekly_summary':
          // סיכום שבועי - השבוע שעבר (7 ימים)
          startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000); // לפני שבוע
          endDate = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000); // עד אתמול
          console.log(`📅 Weekly summary: Looking for matches from LAST WEEK`);
          break;
          
        case 'betting_tip':
          // טיפים להימורים - עתידיים קרובים בלבד
          startDate = new Date(today.getTime()); // היום
          endDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 ימים קדימה
          console.log(`📅 Betting tips: Looking for UPCOMING matches only`);
          break;
          
        case 'analysis':
          // אנליסות - עתידיים קרובים בלבד
          startDate = new Date(today.getTime()); // היום
          endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 ימים קדימה
          console.log(`📅 Analysis: Looking for UPCOMING matches only`);
          break;
          
        case 'poll':
          // סקרים - אתמול + עתידיים קרובים
          startDate = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000); // אתמול
          endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 ימים קדימה
          console.log(`📅 Polls: Looking for YESTERDAY + UPCOMING matches`);
          break;
          
        default:
          // ברירת מחדל - טווח רחב
          startDate = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 ימים אחורה
          endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 ימים קדימה
          console.log(`📅 Default: Looking for matches in wide range`);
      }
      
      // לוגיקה פשוטה לפי סוג תוכן - ללא התערבות מיוחדת
      
      console.log(`📅 Final search range for ${request.type}: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
      
      // Get available APIs and try to fetch fixtures by date
      const availableAPIs = this.footballAPIManager.getAvailableAPIs();
      console.log(`🔑 Available APIs in manager: ${availableAPIs.join(', ')}`);
      
      const allMatches: MatchData[] = [];
      
      // Try to get fixtures for each day in the range using the new method
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        
        try {
          const matches = await this.footballAPIManager.getFixturesByDate(dateStr);
          
          // Convert to our MatchData format
          const convertedMatches: MatchData[] = matches.map(match => ({
            id: match.match_id || `match_${Date.now()}_${Math.random()}`,
            homeTeam: { 
              id: match.match_hometeam_id || `team_${match.match_hometeam_name.replace(/\s+/g, '_')}`, 
              name: match.match_hometeam_name 
            },
            awayTeam: { 
              id: match.match_awayteam_id || `team_${match.match_awayteam_name.replace(/\s+/g, '_')}`, 
              name: match.match_awayteam_name 
            },
            competition: { 
              id: (match.league_name || 'unknown_league').replace(/\s+/g, '_'), 
              name: match.league_name || 'Unknown League'
            },
            kickoff: new Date(match.match_date + ' ' + (match.match_time || '15:00')),
            status: this.normalizeStatus(match.match_status),
            score: {
              home: match.match_hometeam_score,
              away: match.match_awayteam_score
            },
            season: new Date().getFullYear().toString()
          }));
          
          allMatches.push(...convertedMatches);
          
          if (matches.length > 0) {
            console.log(`✅ Found ${matches.length} matches for ${dateStr}`);
          }
          
        } catch (error) {
          console.log(`⚠️ Failed to get matches for ${dateStr}:`, error);
        }
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
        
        // Limit to avoid too many API calls (max 10 days)
        if (allMatches.length > 100 || currentDate.getTime() - startDate.getTime() > 10 * 24 * 60 * 60 * 1000) {
          break;
        }
      }
      
      console.log(`✅ Total matches found from FootballAPIManager: ${allMatches.length}`);
      return allMatches;
      
    } catch (error) {
      console.error(`❌ Error getting matches from FootballAPIManager:`, error);
      return [];
    }
  }

  /**
   * 🏴󠁧󠁢󠁥󠁮󠁧󠁿 Football-Data.org API
   */
  private async fetchFromFootballData(api: AvailableAPI, request: ContentRequest): Promise<MatchData[]> {
    const today = new Date();
    console.log(`📅 Today is: ${today.toISOString().split('T')[0]} (${today.toISOString()})`);
    
    // 🔥 Dynamic date range based on content type - with Club World Cup 2025 support
    let daysBack = 3; // Default: 3 days back
    let daysForward = 10; // Default: 10 days forward
    
    // 🔥 לוגיקה רגילה לפי סוג תוכן
    if (request.type === 'news') {
      daysBack = 5; // Football-data.org limit: max 10 days total
      daysForward = 5; // Total: 10 days (API limit)
    } else if (request.type === 'live_update') {
      daysBack = 1; // Yesterday
      daysForward = 2; // Today and tomorrow for live
    } else if (request.type === 'daily_summary') {
      daysBack = 2; // עד 48 שעות אחורה
      daysForward = 0; // רק אתמול ושלשום
    } else if (request.type === 'weekly_summary') {
      daysBack = 7; // השבוע שעבר
      daysForward = 0; // רק השבוע שעבר
    } else if (request.type === 'analysis') {
      daysBack = 1; // אתמול לפורמה
      daysForward = 7; // משחקים עתידיים
    } else if (request.type === 'betting_tip') {
      daysBack = 1; // אתמול לפורמה
      daysForward = 9; // משחקים עתידיים
    } else if (request.type === 'poll') {
      daysBack = 2; // עד 48 שעות אחורה
      daysForward = 3; // משחקים עתידיים קרובים
    }
    
    const pastDate = new Date(today.getTime() - daysBack * 24 * 60 * 60 * 1000);
    const futureDate = new Date(today.getTime() + daysForward * 24 * 60 * 60 * 1000);
    
    const fromStr = pastDate.toISOString().split('T')[0];
    const toStr = futureDate.toISOString().split('T')[0];
    
    console.log(`📅 Date range for ${request.type}: ${fromStr} to ${toStr} (${daysBack} days back, ${daysForward} days forward)`);
    
    // Fix: Properly handle URL with or without /v4
    let baseUrl = api.url.endsWith('/') ? api.url.slice(0, -1) : api.url;
    
    // Remove /v4 if it's already there to prevent duplication
    if (baseUrl.endsWith('/v4')) {
      baseUrl = baseUrl.slice(0, -3); // Remove /v4
    }
    
    // Ensure we have the correct API version
    const url = `${baseUrl}/v4/matches?dateFrom=${fromStr}&dateTo=${toStr}`;
    
    console.log(`🔗 Fetching from football-data.org: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'X-Auth-Token': api.key
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Football-Data Response: ${response.status} - ${errorText}`);
      throw new Error(`Football-Data API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const matches = data.matches || [];
    
    console.log(`⚽ Received ${matches.length} matches from football-data.org`);
    
    // Add date range filtering to ensure we only get matches within our actual range
    const filteredMatches = matches.filter((match: any) => {
      const matchDate = new Date(match.utcDate);
      const isInRange = matchDate >= pastDate && matchDate <= futureDate;
      if (!isInRange) {
        console.log(`⚠️ Match ${match.homeTeam.name} vs ${match.awayTeam.name} on ${matchDate.toISOString().split('T')[0]} is outside range`);
      }
      return isInRange;
    });
    
    console.log(`📅 Found ${filteredMatches.length} matches within date range (${daysBack} days past, ${daysForward} days future)`);
    
    return filteredMatches.map((match: any) => ({
      id: `fd_${match.id}`,
      homeTeam: { 
        id: match.homeTeam.id || `team_${match.homeTeam.name.replace(/\s+/g, '_')}`,
        name: match.homeTeam.name 
      },
      awayTeam: { 
        id: match.awayTeam.id || `team_${match.awayTeam.name.replace(/\s+/g, '_')}`,
        name: match.awayTeam.name 
      },
      competition: { 
        id: match.competition.id || `comp_${match.competition.name.replace(/\s+/g, '_')}`,
        name: match.competition.name 
      },
      kickoff: new Date(match.utcDate),
      status: this.normalizeStatus(match.status),
      score: match.score?.fullTime ? {
        home: match.score.fullTime.home,
        away: match.score.fullTime.away
      } : { home: 0, away: 0 },
      season: new Date().getFullYear().toString()
    }));
  }

  /**
   * ⚽ API-Football.com API (supports both direct and RapidAPI)
   */
  private async fetchFromAPIFootball(api: AvailableAPI, request: ContentRequest): Promise<MatchData[]> {
    // Use current season for better data availability
    const currentYear = new Date().getFullYear();
    const season = currentYear;
    
    const today = new Date();
    console.log(`📅 Today is: ${today.toISOString().split('T')[0]} for API-Football`);
    
    // 🔥 Dynamic date range based on content type - with Club World Cup 2025 support
    let daysBack = 3; // Default: 3 days back
    let daysForward = 10; // Default: 10 days forward
    
    // 🔥 לוגיקה רגילה לפי סוג תוכן
    if (request.type === 'news') {
      daysBack = 7; // Last week for recent results
      daysForward = 7; // Next week for upcoming matches
    } else if (request.type === 'live_update') {
      daysBack = 1; // Yesterday
      daysForward = 2; // Today and tomorrow for live
    } else if (request.type === 'daily_summary') {
      daysBack = 2; // עד 48 שעות אחורה
      daysForward = 0; // רק אתמול ושלשום
    } else if (request.type === 'weekly_summary') {
      daysBack = 7; // השבוע שעבר
      daysForward = 0; // רק השבוע שעבר
    } else if (request.type === 'analysis') {
      daysBack = 1; // אתמול לפורמה
      daysForward = 7; // משחקים עתידיים
    } else if (request.type === 'betting_tip') {
      daysBack = 1; // אתמול לפורמה
      daysForward = 14; // משחקים עתידיים
    } else if (request.type === 'poll') {
      daysBack = 2; // עד 48 שעות אחורה
      daysForward = 3; // משחקים עתידיים קרובים
    }
    
    const pastDate = new Date(today.getTime() - daysBack * 24 * 60 * 60 * 1000);
    const futureDate = new Date(today.getTime() + daysForward * 24 * 60 * 60 * 1000);
    
    const fromStr = pastDate.toISOString().split('T')[0];
    const toStr = futureDate.toISOString().split('T')[0];
    
    console.log(`📅 API-Football date range for ${request.type}: ${fromStr} to ${toStr} (${daysBack} days back, ${daysForward} days forward)`);
    
    // Check if this is RapidAPI or direct API-Sports
    const isRapidAPI = api.url.includes('rapidapi.com');
    
    if (!api.url) {
      throw new Error('API URL is undefined');
    }
    
    let baseUrl = api.url.endsWith('/') ? api.url.slice(0, -1) : api.url;
    let url: string;
    let headers: Record<string, string>;
    
    if (isRapidAPI) {
      // RapidAPI format
      url = `${baseUrl}/fixtures?season=${season}&from=${fromStr}&to=${toStr}`;
      headers = {
        'X-RapidAPI-Key': api.key,
        'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
      };
      console.log(`📡 Using RapidAPI format for ${api.name}`);
    } else {
      // Direct API-Sports format
      url = `${baseUrl}/fixtures?season=${season}&from=${fromStr}&to=${toStr}`;
      headers = {
        'x-apisports-key': api.key
      };
      console.log(`📡 Using direct API-Sports format for ${api.name}`);
    }
    
    console.log(`🔗 Fetching: ${url}`);
    
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ API Response: ${response.status} - ${errorText}`);
      throw new Error(`API-Football error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const fixtures = data.response || [];
    
    console.log(`⚽ Received ${fixtures.length} fixtures from ${api.name}`);
    
    // Add date range filtering to ensure we only get matches within our actual range
    const filteredFixtures = fixtures.filter((fixture: any) => {
      const matchDate = new Date(fixture.fixture.date);
      const isInRange = matchDate >= pastDate && matchDate <= futureDate;
      if (!isInRange) {
        console.log(`⚠️ Fixture ${fixture.teams.home.name} vs ${fixture.teams.away.name} on ${matchDate.toISOString().split('T')[0]} is outside range`);
      }
      return isInRange;
    });
    
    console.log(`📅 Found ${filteredFixtures.length} fixtures within date range (${daysBack} days past, ${daysForward} days future)`);
    
    return filteredFixtures.map((fixture: any) => ({
      id: `af_${fixture.fixture.id}`,
      homeTeam: { 
        id: fixture.teams.home.id || `team_${fixture.teams.home.name.replace(/\s+/g, '_')}`,
        name: fixture.teams.home.name 
      },
      awayTeam: { 
        id: fixture.teams.away.id || `team_${fixture.teams.away.name.replace(/\s+/g, '_')}`,
        name: fixture.teams.away.name 
      },
      competition: { 
        id: fixture.league.id || `comp_${fixture.league.name.replace(/\s+/g, '_')}`,
        name: fixture.league.name 
      },
      kickoff: new Date(fixture.fixture.date),
      status: this.normalizeStatus(fixture.fixture.status.short),
      score: fixture.goals.home !== null ? {
        home: fixture.goals.home,
        away: fixture.goals.away
      } : { home: 0, away: 0 },
      season: season.toString()
    }));
  }

  /**
   * ⚽ SoccersAPI.com API
   */
  private async fetchFromSoccersAPI(api: AvailableAPI, request: ContentRequest): Promise<MatchData[]> {
    const today = new Date();
    // 🔥 Include matches from yesterday (for completed games) and next week
    const yesterday = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000);
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const fromStr = yesterday.toISOString().split('T')[0];
    const toStr = nextWeek.toISOString().split('T')[0];
    
    let baseUrl = api.url.endsWith('/') ? api.url.slice(0, -1) : api.url;
    // SoccersAPI requires both user and token
    const user = process.env.SOCCERSAPI_USER || 'triroars';
    const url = `${baseUrl}/fixtures/?t=schedule&d=${fromStr}:${toStr}&user=${user}&token=${api.key}`;
    
    console.log(`🔗 Fetching from SoccersAPI: ${url}`);
    
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ SoccersAPI Response: ${response.status} - ${errorText}`);
      throw new Error(`SoccersAPI error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const matches = data.data || [];
    
    console.log(`⚽ Received ${matches.length} matches from SoccersAPI`);
    
    return matches.map((match: any) => ({
      id: `sa_${match.match_id}`,
      homeTeam: { 
        id: match.match_hometeam_id || `team_${match.match_hometeam_name.replace(/\s+/g, '_')}`,
        name: match.match_hometeam_name 
      },
      awayTeam: { 
        id: match.match_awayteam_id || `team_${match.match_awayteam_name.replace(/\s+/g, '_')}`,
        name: match.match_awayteam_name 
      },
      competition: { 
        id: match.league_id || `comp_${match.league_name.replace(/\s+/g, '_')}`,
        name: match.league_name 
      },
      kickoff: new Date(match.match_date + ' ' + match.match_time),
      status: this.normalizeStatus(match.match_status),
      score: match.match_hometeam_score !== null ? {
        home: parseInt(match.match_hometeam_score) || 0,
        away: parseInt(match.match_awayteam_score) || 0
      } : { home: 0, away: 0 },
      season: new Date().getFullYear().toString()
    }));
  }

  /**
   * ⚽ APIFootball.com API
   */
  private async fetchFromAPIFootballCom(api: AvailableAPI, request: ContentRequest): Promise<MatchData[]> {
    const today = new Date();
    // 🔥 Include matches from yesterday (for completed games) and next week
    const yesterday = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000);
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const fromStr = yesterday.toISOString().split('T')[0];
    const toStr = nextWeek.toISOString().split('T')[0];
    
    let baseUrl = api.url.endsWith('/') ? api.url.slice(0, -1) : api.url;
    const url = `${baseUrl}/?action=get_events&from=${fromStr}&to=${toStr}&APIkey=${api.key}`;
    
    console.log(`🔗 Fetching from APIFootball.com: ${url}`);
    
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ APIFootball.com Response: ${response.status} - ${errorText}`);
      throw new Error(`APIFootball.com error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const matches = Array.isArray(data) ? data : [];
    
    console.log(`⚽ Received ${matches.length} matches from APIFootball.com`);
    
    return matches.map((match: any) => ({
      id: `af_com_${match.match_id}`,
      homeTeam: { 
        id: match.match_hometeam_id || `team_${match.match_hometeam_name.replace(/\s+/g, '_')}`,
        name: match.match_hometeam_name 
      },
      awayTeam: { 
        id: match.match_awayteam_id || `team_${match.match_awayteam_name.replace(/\s+/g, '_')}`,
        name: match.match_awayteam_name 
      },
      competition: { 
        id: match.league_id || `comp_${match.league_name.replace(/\s+/g, '_')}`,
        name: match.league_name 
      },
      kickoff: new Date(match.match_date + ' ' + match.match_time),
      status: this.normalizeStatus(match.match_status),
      score: match.match_hometeam_score !== '' ? {
        home: parseInt(match.match_hometeam_score) || 0,
        away: parseInt(match.match_awayteam_score) || 0
      } : { home: 0, away: 0 },
      season: new Date().getFullYear().toString()
    }));
  }

  /**
   * 🆓 TheSportsDB API (Free API for Club World Cup + Future Matches)
   */
  private async fetchFromTheSportsDB(request: ContentRequest): Promise<MatchData[]> {
    try {
      console.log(`🆓 Fetching from TheSportsDB with user key 123...`);
      
      // Get the API key from the configured sports APIs
      const apiKeys = await getSportsApiKeys();
      const theSportsDbApi = apiKeys['thesportsdb'];
      
      if (!theSportsDbApi) {
        console.log('❌ TheSportsDB not configured in API keys');
        return [];
      }
      
      const apiKey = theSportsDbApi.api_key; // Should be "123" 
      console.log(`🔑 Using TheSportsDB API key: ${apiKey}`);
      
      let events: any[] = [];
      
      // מחפש משחקים לפי סוג התוכן
      const leagues = ['4328', '4329', '4335', '4347', '4351']; // Premier League, La Liga, Serie A, Bundesliga, Ligue 1
      
      if (request.type === 'daily_summary') {
        console.log('📅 Fetching yesterday matches for daily summary...');
        // משחקים מאתמול
        for (const leagueId of leagues) {
          try {
            const url = `https://www.thesportsdb.com/api/v1/json/${apiKey}/eventslast.php?id=${leagueId}`;
            const response = await fetch(url);
            if (response.ok) {
              const data = await response.json();
              if (data.results && data.results.length > 0) {
                events.push(...data.results);
              }
            }
          } catch (error) {
            console.log(`⚠️ Failed to fetch recent matches from league ${leagueId}:`, error);
          }
        }
      } else if (request.type === 'weekly_summary') {
        console.log('📅 Fetching past week matches for weekly summary...');
        // משחקים מהשבוע שעבר
        for (const leagueId of leagues) {
          try {
            const url = `https://www.thesportsdb.com/api/v1/json/${apiKey}/eventslast.php?id=${leagueId}`;
            const response = await fetch(url);
            if (response.ok) {
              const data = await response.json();
              if (data.results && data.results.length > 0) {
                events.push(...data.results);
              }
            }
          } catch (error) {
            console.log(`⚠️ Failed to fetch recent matches from league ${leagueId}:`, error);
          }
        }
      } else {
        console.log('🔮 Fetching upcoming matches for future content...');
        // משחקים עתידיים
        for (const leagueId of leagues) {
          try {
            const url = `https://www.thesportsdb.com/api/v2/json/schedule/next/league/${leagueId}`;
            const response = await fetch(url);
            if (response.ok) {
              const data = await response.json();
              if (data.events && data.events.length > 0) {
                events.push(...data.events);
              }
            }
          } catch (error) {
            console.log(`⚠️ Failed to fetch upcoming matches from league ${leagueId}:`, error);
          }
        }
      }
      
      console.log(`🔮 Total matches found: ${events.length}`);
      
      // Convert TheSportsDB format to our MatchData format
      return events.map((event: any) => {
        const matchDate = new Date(event.strTimestamp || `${event.dateEvent}T${event.strTime || '00:00:00'}`);
        
        return {
          id: `tsdb_${event.idEvent}`,
          homeTeam: {
            id: event.idHomeTeam || `team_${event.strHomeTeam?.replace(/\s+/g, '_')}`,
            name: event.strHomeTeam || 'Unknown Home Team'
          },
          awayTeam: {
            id: event.idAwayTeam || `team_${event.strAwayTeam?.replace(/\s+/g, '_')}`,
            name: event.strAwayTeam || 'Unknown Away Team'
          },
          competition: {
            id: event.idLeague || `league_${event.strLeague?.replace(/\s+/g, '_')}`,
            name: event.strLeague || 'Unknown League'
          },
          kickoff: matchDate,
          status: this.normalizeTheSportsDBStatus(event.strStatus),
          score: {
            home: parseInt(event.intHomeScore) || 0,
            away: parseInt(event.intAwayScore) || 0
          },
          season: '2025'
        };
      }).filter((match: MatchData) => {
        const matchDate = match.kickoff;
        const now = new Date();
        
        // פילטר פשוט לפי זמן - נותן לmatch scorer לדרג
        const maxPastDays = 14;
        const minPastTime = new Date(now.getTime() - maxPastDays * 24 * 60 * 60 * 1000);
        
        if (matchDate < minPastTime) {
          console.log(`⏰ Filtering out very old match: ${match.homeTeam.name} vs ${match.awayTeam.name} from ${matchDate.toISOString().split('T')[0]} (older than ${maxPastDays} days)`);
          return false;
        }
        
        const maxFutureDays = 30;
        const maxFutureTime = new Date(now.getTime() + maxFutureDays * 24 * 60 * 60 * 1000);
        
        if (matchDate > maxFutureTime) {
          console.log(`⏰ Filtering out far future match: ${match.homeTeam.name} vs ${match.awayTeam.name} from ${matchDate.toISOString().split('T')[0]} (more than ${maxFutureDays} days away)`);
          return false;
        }
        
        return true;
      });
      
    } catch (error) {
      console.error('❌ Error with TheSportsDB:', error);
      return [];
    }
  }

  /**
   * 🔄 Normalize TheSportsDB status to our format
   */
  private normalizeTheSportsDBStatus(status: string): 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'IN_PLAY' {
    if (!status) return 'SCHEDULED';
    
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('finished') || statusLower.includes('ft') || statusLower.includes('aet')) {
      return 'FINISHED';
    } else if (statusLower.includes('live') || statusLower.includes('playing') || statusLower.includes('ht')) {
      return 'IN_PLAY';
    } else if (statusLower.includes('scheduled') || statusLower.includes('not started')) {
      return 'SCHEDULED';
    }
    
    return 'SCHEDULED';
  }

  /**
   * 🚫 אין fallback matches - רק משחקים אמיתיים!
   */
  private async getFallbackMatches(request: ContentRequest): Promise<SimpleMatch[]> {
    console.log('🚫 No real matches available - returning empty array (no fake matches!)');
    return [];
  }

  /**
   * 🔧 Helper functions
   */
  private normalizeStatus(status: string): 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'IN_PLAY' {
    const liveStatuses = ['LIVE', 'IN_PLAY', '1H', '2H', 'HT'];
    const finishedStatuses = ['FINISHED', 'FT', 'AET', 'PEN'];
    
    if (liveStatuses.includes(status)) return 'LIVE';
    if (finishedStatuses.includes(status)) return 'FINISHED';
    return 'SCHEDULED';
  }

  /**
   * 🔍 בדיקת בריאות המערכת
   */
  async getSystemHealth(): Promise<{
    workingApis: number;
    totalApis: number;
    lastCheck: Date;
    isHealthy: boolean;
    smartScorerReady: boolean;
  }> {
    await this.refreshAvailableAPIs();
    
    const workingApis = this.availableApis.filter(api => api.isWorking).length;
    
    return {
      workingApis,
      totalApis: this.availableApis.length,
      lastCheck: new Date(this.lastApiCheck),
      isHealthy: workingApis > 0,
      smartScorerReady: true // We always have the smart scorer
    };
  }
}

// Export singleton instance for immediate use
export const unifiedFootballService = new UnifiedFootballService(); 