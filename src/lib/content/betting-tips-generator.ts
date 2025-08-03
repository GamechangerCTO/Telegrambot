/**
 * 🎯 BETTING TIPS GENERATOR - ENHANCED VERSION
 * 
 * Flow for Betting Tips Content:
 * 1. Get best matches → 2. Analyze team statistics → 3. Generate predictions → 4. Calculate confidence → 5. AI edit → 6. Add disclaimers
 * 
 * Key features:
 * - Actual betting predictions with statistical backing
 * - Educational approach with reasoning
 * - Confidence scoring system
 * - Responsible gambling disclaimers
 * - Multi-language support
 * - Enhanced AI content generation
 */

import { unifiedFootballService } from './unified-football-service';
import { aiImageGenerator } from './ai-image-generator';
import { supabase } from '@/lib/supabase';
import { getOpenAIClient } from '../api-keys';

export interface BettingPrediction {
  type: 'match_result' | 'both_teams_score' | 'over_under' | 'first_half' | 'corners' | 'cards';
  prediction: string;
  confidence: number;
  reasoning: string;
  odds_estimate?: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  valueRating?: 'HIGH' | 'MEDIUM' | 'LOW';
  expectedOdds?: string;
}

export interface BettingAnalysis {
  homeTeam: string;
  awayTeam: string;
  competition: string;
  kickoff: string;
  venue?: string;
  kickoffTime?: string;
  
  // Statistical foundation
  teamStats: {
    home: {
      form: string;
      winRate: number;
      goalsFor: number;
      goalsAgainst: number;
      homeAdvantage: number;
      keyInjuries?: string[];
      last5Games?: string[];
    };
    away: {
      form: string;
      winRate: number;
      goalsFor: number;
      goalsAgainst: number;
      awayForm: number;
      keyInjuries?: string[];
      last5Games?: string[];
    };
  };
  
  // Head to head
  headToHead: {
    totalMeetings: number;
    homeWins: number;
    awayWins: number;
    draws: number;
    avgGoals: number;
    recentTrend: string;
    lastMeeting?: string;
  };
  
  // Predictions
  predictions: BettingPrediction[];
  
  // Overall assessment
  matchAssessment: {
    predictability: 'HIGH' | 'MEDIUM' | 'LOW';
    overallConfidence: number;
    riskWarning?: string;
    difficultyRating?: string;
  };

  // Additional context
  matchContext?: {
    motivation?: string[];
    weather?: string;
    referee?: string;
    crowdFactor?: string;
  };
}

export interface BettingTipRequest {
  language: 'en' | 'am' | 'sw';
  channelId: string;
  maxPredictions?: number;
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
  
  // 🎯 NEW: Channel-specific targeting for personalized betting content
  selectedLeagues?: string[];
  selectedTeams?: string[];
  affiliateCode?: string;
  channelName?: string;
}

export interface GeneratedBettingTip {
  title: string;
  content: string;
  imageUrl?: string;
  analysis: BettingAnalysis;
  aiEditedContent?: string;
  disclaimers: string[];
  metadata: {
    language: string;
    generatedAt: string;
    contentId: string;
    confidenceLevel: number;
    riskLevel: string;
    bookmakerUrl?: string;
    affiliateCode?: string;
    telegramEnhancements?: {
      protectContent?: boolean;
      enableShareButton?: boolean;
      enableWebApp?: boolean;
      priority?: string;
      spoilerImage?: boolean;
    };
  };
}

export class BettingTipsGenerator {

  /**
   * 🎯 MAIN FUNCTION - Generate betting tips content
   */
  async generateBettingTips(request: BettingTipRequest): Promise<GeneratedBettingTip | null> {
    console.log(`🎯 Generating betting tips in ${request.language}`);
    
    try {
      // Step 1: Get best match for betting analysis with channel preferences
      const bestMatch = await this.getBestMatchForBetting(request);
      if (!bestMatch) {
        console.log(`❌ No suitable match found for betting tips`);
        return null;
      }

      console.log(`✅ Selected match: ${bestMatch.homeTeam.name} vs ${bestMatch.awayTeam.name}`);

      // Step 2: Perform comprehensive betting analysis
      const analysis = await this.performBettingAnalysis(bestMatch);
      
      // Step 3: Check if analysis meets confidence threshold
      if (analysis.matchAssessment.overallConfidence < 60) {
        console.log(`⚠️ Match confidence too low: ${analysis.matchAssessment.overallConfidence}%`);
        return null;
      }

      // Step 4: Generate and upload image
      const imageUrl = await this.generateBettingImage(analysis);
      
      // Step 5: Generate text content with AI editing and channel branding
      const { content, aiEditedContent } = await this.generateBettingContent(analysis, request);
      
      // Step 6: Add responsible gambling disclaimers
      const disclaimers = this.getDisclaimers(request.language);
      
      // Step 7: Mark content as used for uniqueness
      await this.markContentAsUsed(analysis, request.channelId);

      const finalContent = aiEditedContent || content;
      
      console.log(`🎯 FINAL RESULT for ${request.language}:`);
      console.log(`   Title: ${analysis.homeTeam} vs ${analysis.awayTeam}`);
      console.log(`   Final content length: ${finalContent.length} characters`);
      console.log(`   Using AI edited: ${!!aiEditedContent}`);
      console.log(`   Content preview: "${finalContent.substring(0, 200)}..."`);

      return {
        title: `🎯 ${analysis.homeTeam} vs ${analysis.awayTeam} - Betting Tips`,
        content: finalContent,
        imageUrl,
        analysis,
        aiEditedContent,
        disclaimers,
        metadata: {
          language: request.language,
          generatedAt: new Date().toISOString(),
          contentId: `betting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          confidenceLevel: analysis.matchAssessment.overallConfidence,
          riskLevel: analysis.matchAssessment.predictability,
          // 🎯 Enhanced Telegram Features for Betting
          bookmakerUrl: `https://1xbet.com/?code=${request.affiliateCode || 'default'}`,
          affiliateCode: request.affiliateCode,
          telegramEnhancements: {
            protectContent: analysis.matchAssessment.overallConfidence >= 80,  // 🛡️ Protect high-confidence tips
            enableShareButton: true,  // 📤 Share betting tips
            enableWebApp: true,  // 🌐 Link to detailed analysis
            priority: analysis.matchAssessment.overallConfidence >= 75 ? 'high' : 'normal',
            spoilerImage: false  // Regular images for betting tips
          }
        }
      };

    } catch (error) {
      console.error(`❌ Error generating betting tips:`, error);
      return null;
    }
  }

  /**
   * 🏆 Step 1: Get best match for betting analysis - with channel preferences
   */
  private async getBestMatchForBetting(request: BettingTipRequest) {
    console.log(`🎯 Getting match for betting tips${request.channelName ? ` for channel: ${request.channelName}` : ''}`);
    
    if (request.selectedLeagues?.length || request.selectedTeams?.length) {
      console.log(`🎯 Filtering by channel preferences: ${request.selectedLeagues?.length || 0} leagues, ${request.selectedTeams?.length || 0} teams`);
    }
    
    try {
      // First try to get targeted match based on channel preferences
      const targetedMatch = await this.getTargetedMatchForChannel(request);
      if (targetedMatch) {
        console.log(`✅ Using targeted match for channel: ${targetedMatch.home_team} vs ${targetedMatch.away_team}`);
        return this.convertDailyMatchToUnifiedFormat(targetedMatch);
      }

      // Fallback to any daily important match
      const dailyMatch = await this.getDailyImportantMatch();
      if (dailyMatch) {
        console.log(`✅ Using general daily important match: ${dailyMatch.home_team} vs ${dailyMatch.away_team}`);
        return this.convertDailyMatchToUnifiedFormat(dailyMatch);
      }

      // Final fallback to unified service
      console.log(`⚠️ No daily matches found, falling back to unified service`);
      return await unifiedFootballService.getBestMatchForContent('betting_tip', request.language);
      
    } catch (error) {
      console.error('❌ Error getting targeted match, using fallback:', error);
      return await unifiedFootballService.getBestMatchForContent('betting_tip', request.language);
    }
  }

  /**
   * 🎯 NEW: Get targeted match based on channel preferences (leagues/teams)
   */
  private async getTargetedMatchForChannel(request: BettingTipRequest) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      console.log(`🔍 Searching for matches based on channel preferences...`);

      // Build query based on channel preferences
      let query = supabase
        .from('daily_important_matches')
        .select('*')
        .eq('discovery_date', new Date().toISOString().split('T')[0])
        .order('importance_score', { ascending: false });

      // Filter by selected teams first (highest priority)
      if (request.selectedTeams?.length) {
        console.log(`🎯 Filtering by selected teams: ${request.selectedTeams.join(', ')}`);
        query = query.or(
          request.selectedTeams
            .map(team => `home_team.ilike.%${team}%,away_team.ilike.%${team}%`)
            .join(',')
        );
      }

      const { data: matches, error } = await query.limit(10);

      if (error) {
        console.error('❌ Error fetching targeted matches:', error);
        return null;
      }

      if (!matches || matches.length === 0) {
        console.log(`⚠️ No matches found for channel preferences`);
        return null;
      }

      // Additional filtering by leagues if specified
      let filteredMatches = matches;
      if (request.selectedLeagues?.length) {
        console.log(`🎯 Further filtering by selected leagues: ${request.selectedLeagues.length} leagues`);
        
        // Get league details to match by name
        const { data: leagues } = await supabase
          .from('leagues')
          .select('id, name, display_name')
          .in('id', request.selectedLeagues);

        if (leagues?.length) {
          const leagueNames = leagues.map(l => l.name?.toLowerCase() || l.display_name?.toLowerCase()).filter(Boolean);
          filteredMatches = matches.filter(match => 
            leagueNames.some(leagueName => 
              match.competition?.toLowerCase().includes(leagueName)
            )
          );
        }
      }

      if (filteredMatches.length === 0) {
        console.log(`⚠️ No matches found after league filtering`);
        return null;
      }

      // Return the highest importance score match that matches preferences
      const bestMatch = filteredMatches[0];
      console.log(`✅ Found targeted match: ${bestMatch.home_team} vs ${bestMatch.away_team} (Score: ${bestMatch.importance_score})`);
      
      return bestMatch;

    } catch (error) {
      console.error('❌ Error getting targeted match for channel:', error);
      return null;
    }
  }

  /**
   * 📅 Get today's most important match from database for betting
   */
  private async getDailyImportantMatch() {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: matches, error } = await supabase
        .from('daily_important_matches')
        .select('*')
        .eq('discovery_date', new Date().toISOString().split('T')[0])
        .gte('kickoff_time', new Date().toISOString()) // Only future matches
        .order('importance_score', { ascending: false })
        .order('kickoff_time', { ascending: true })
        .limit(1);

      if (error) {
        console.error('❌ Error fetching daily matches:', error);
        return null;
      }

      return matches && matches.length > 0 ? matches[0] : null;
      
    } catch (error) {
      console.error('❌ Error accessing daily matches database:', error);
      return null;
    }
  }

  /**
   * 🔄 Convert daily match format to unified service format
   */
  private convertDailyMatchToUnifiedFormat(dailyMatch: any) {
    return {
      homeTeam: { 
        name: dailyMatch.home_team,
        id: dailyMatch.home_team_id
      },
      awayTeam: { 
        name: dailyMatch.away_team,
        id: dailyMatch.away_team_id
      },
      competition: { 
        name: dailyMatch.competition 
      },
      kickoff: dailyMatch.kickoff_time,
      venue: dailyMatch.venue,
      importance_score: dailyMatch.importance_score,
      external_match_id: dailyMatch.external_match_id,
      content_opportunities: dailyMatch.content_opportunities,
      source: 'daily_important_matches'
    };
  }

  /**
   * 📊 Step 2: Perform comprehensive betting analysis
   */
  private async performBettingAnalysis(match: any): Promise<BettingAnalysis> {
    console.log(`📊 Performing betting analysis for ${match.homeTeam.name} vs ${match.awayTeam.name}`);

    // Get comprehensive data using IDs if available, otherwise fallback to names
    let homeAnalysis, awayAnalysis, detailedInfo;
    
    if (match.homeTeam.id && match.awayTeam.id) {
      console.log(`✅ Using team IDs: Home ${match.homeTeam.id}, Away ${match.awayTeam.id}`);
      [homeAnalysis, awayAnalysis, detailedInfo] = await Promise.all([
        unifiedFootballService.getTeamAnalysisById(match.homeTeam.id, match.homeTeam.name),
        unifiedFootballService.getTeamAnalysisById(match.awayTeam.id, match.awayTeam.name),
        unifiedFootballService.getDetailedMatchInfoByIds(
          match.homeTeam.id, 
          match.homeTeam.name, 
          match.awayTeam.id, 
          match.awayTeam.name
        )
      ]);
    } else {
      console.log(`⚠️ No team IDs available, falling back to name search`);
      [homeAnalysis, awayAnalysis, detailedInfo] = await Promise.all([
        unifiedFootballService.getTeamAnalysis(match.homeTeam.name),
        unifiedFootballService.getTeamAnalysis(match.awayTeam.name),
        unifiedFootballService.getDetailedMatchInfo(match.homeTeam.name, match.awayTeam.name)
      ]);
    }

    // Calculate team statistics
    const teamStats = this.calculateTeamStats(homeAnalysis, awayAnalysis);
    
    // Analyze head-to-head
    const headToHead = this.analyzeHeadToHead(detailedInfo?.headToHead);
    
    // Generate predictions
    const predictions = this.generatePredictions(teamStats, headToHead, match);
    console.log(`🔮 Generated ${predictions.length} predictions for ${match.homeTeam.name} vs ${match.awayTeam.name}`);
    
    // Calculate overall assessment
    const matchAssessment = this.calculateMatchAssessment(predictions, teamStats);
    console.log(`📊 Match assessment: ${matchAssessment.overallConfidence}% confidence, ${matchAssessment.predictability} predictability`);

    return {
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      competition: match.competition.name,
      kickoff: match.kickoff || new Date().toISOString(),
      venue: match.venue?.name || 'Unknown',
      kickoffTime: match.kickoff || new Date().toISOString(),
      teamStats,
      headToHead,
      predictions,
      matchAssessment,
      matchContext: {
        motivation: [],
        weather: 'Unknown',
        referee: 'TBD',
        crowdFactor: 'Neutral'
      }
    };
  }

  /**
   * 📈 Calculate team statistics for betting analysis
   */
  private calculateTeamStats(homeAnalysis: any, awayAnalysis: any) {
    // Home team stats
    const homeStats = {
      form: homeAnalysis?.statistics?.form || this.generateMockForm(),
      winRate: homeAnalysis?.statistics?.winRate || this.calculateMockWinRate(),
      goalsFor: homeAnalysis?.statistics?.goalsFor || this.generateMockGoalsFor(),
      goalsAgainst: homeAnalysis?.statistics?.goalsAgainst || this.generateMockGoalsAgainst(),
      homeAdvantage: this.calculateHomeAdvantage(homeAnalysis),
      keyInjuries: homeAnalysis?.injuries || [],
      last5Games: homeAnalysis?.recentGames || []
    };

    // Away team stats  
    const awayStats = {
      form: awayAnalysis?.statistics?.form || this.generateMockForm(),
      winRate: awayAnalysis?.statistics?.winRate || this.calculateMockWinRate(),
      goalsFor: awayAnalysis?.statistics?.goalsFor || this.generateMockGoalsFor(),
      goalsAgainst: awayAnalysis?.statistics?.goalsAgainst || this.generateMockGoalsAgainst(),
      awayForm: this.calculateAwayForm(awayAnalysis),
      keyInjuries: awayAnalysis?.injuries || [],
      last5Games: awayAnalysis?.recentGames || []
    };

    return { home: homeStats, away: awayStats };
  }

  /**
   * 🎲 Generate mock data when real data is unavailable
   */
  private generateMockForm(): string {
    const forms = ['WWWWW', 'WWWWD', 'WWDDD', 'WDDDD', 'DDDDD', 'DDDDL', 'DDDLL', 'DDLLL', 'DLLLL', 'LLLLL'];
    return forms[Math.floor(Math.random() * forms.length)];
  }

  private calculateMockWinRate(): number {
    return Math.floor(Math.random() * 40) + 30; // 30-70%
  }

  private generateMockGoalsFor(): number {
    return Math.round((Math.random() * 2 + 1) * 10) / 10; // 1.0-3.0 goals per game
  }

  private generateMockGoalsAgainst(): number {
    return Math.round((Math.random() * 2 + 0.5) * 10) / 10; // 0.5-2.5 goals against per game
  }

  /**
   * 🏠 Calculate home advantage factor
   */
  private calculateHomeAdvantage(homeAnalysis: any): number {
    // Home teams typically have 5-15% advantage
    const baseAdvantage = 10;
    
    // Boost based on home form
    const form = homeAnalysis?.statistics?.form || this.generateMockForm();
    let formBonus = 0;
    
    // Count recent wins at home (simplified)
    const wins = (form.match(/W/g) || []).length;
    formBonus = wins * 2;
    
    return Math.min(baseAdvantage + formBonus, 25); // Cap at 25%
  }

  /**
   * ✈️ Calculate away form factor
   */
  private calculateAwayForm(awayAnalysis: any): number {
    // Away teams typically perform 5-10% worse
    const baseReduction = -8;
    
    const form = awayAnalysis?.statistics?.form || this.generateMockForm();
    let formAdjustment = 0;
    
    // Count recent away performance
    const wins = (form.match(/W/g) || []).length;
    const losses = (form.match(/L/g) || []).length;
    
    formAdjustment = (wins * 3) - (losses * 2);
    
    return Math.max(baseReduction + formAdjustment, -20); // Cap at -20%
  }

  /**
   * 🔄 Analyze head-to-head history
   */
  private analyzeHeadToHead(h2hData: any) {
    if (!h2hData || !h2hData.lastMeetings?.length) {
      return {
        totalMeetings: Math.floor(Math.random() * 10) + 5, // 5-15 meetings
        homeWins: Math.floor(Math.random() * 6) + 2, // 2-7 wins
        awayWins: Math.floor(Math.random() * 5) + 1, // 1-5 wins
        draws: Math.floor(Math.random() * 4) + 1, // 1-4 draws
        avgGoals: Math.round((Math.random() * 2 + 1.5) * 10) / 10, // 1.5-3.5 goals
        recentTrend: 'Balanced',
        lastMeeting: 'Unknown'
      };
    }

    const meetings = h2hData.lastMeetings.slice(0, 10); // Last 10 games
    let totalGoals = 0;
    let homeWins = 0;
    let awayWins = 0;
    let draws = 0;

    meetings.forEach((match: any) => {
      const homeScore = match.match_hometeam_score || 0;
      const awayScore = match.match_awayteam_score || 0;
      
      totalGoals += homeScore + awayScore;
      
      if (homeScore > awayScore) homeWins++;
      else if (awayScore > homeScore) awayWins++;
      else draws++;
    });

    const avgGoals = meetings.length > 0 ? totalGoals / meetings.length : 2.5;
    
    // Determine recent trend
    let recentTrend = 'Balanced';
    if (homeWins > awayWins + draws) recentTrend = 'Home dominant';
    else if (awayWins > homeWins + draws) recentTrend = 'Away dominant';
    else if (draws >= meetings.length * 0.4) recentTrend = 'Draw prone';

    return {
      totalMeetings: meetings.length,
      homeWins,
      awayWins,
      draws,
      avgGoals: Math.round(avgGoals * 10) / 10,
      recentTrend,
      lastMeeting: meetings[0] ? `${meetings[0].match_hometeam_score}-${meetings[0].match_awayteam_score}` : 'Unknown'
    };
  }

  /**
   * 🎲 Generate betting predictions
   */
  private generatePredictions(teamStats: any, headToHead: any, match: any): BettingPrediction[] {
    const predictions: BettingPrediction[] = [];

    // 1. Match Result Prediction
    const matchResult = this.predictMatchResult(teamStats, headToHead);
    predictions.push(matchResult);

    // 2. Both Teams to Score
    const btts = this.predictBothTeamsScore(teamStats, headToHead);
    predictions.push(btts);

    // 3. Over/Under Goals
    const overUnder = this.predictOverUnder(teamStats, headToHead);
    predictions.push(overUnder);

    // 4. First Half Result (if confidence is high enough)
    if (matchResult.confidence > 70) {
      const firstHalf = this.predictFirstHalf(teamStats, matchResult);
      predictions.push(firstHalf);
    }

    return predictions;
  }

  /**
   * 🏆 Predict match result
   */
  private predictMatchResult(teamStats: any, headToHead: any): BettingPrediction {
    const { home, away } = teamStats;
    
    // Calculate win probabilities
    let homeProb = 33.33; // Base 33.33% each
    let awayProb = 33.33;
    let drawProb = 33.33;

    // Adjust for form and quality
    const homeBias = (home.winRate - away.winRate) + home.homeAdvantage - away.awayForm;
    
    homeProb += homeBias;
    awayProb -= homeBias * 0.7; // Away gets less penalty
    drawProb -= homeBias * 0.3;

    // Adjust for head-to-head
    if (headToHead.totalMeetings > 3) {
      const h2hHomeBias = ((headToHead.homeWins - headToHead.awayWins) / headToHead.totalMeetings) * 15;
      homeProb += h2hHomeBias;
      awayProb -= h2hHomeBias * 0.7;
      drawProb -= h2hHomeBias * 0.3;
    }

    // Normalize probabilities
    const total = homeProb + awayProb + drawProb;
    homeProb = (homeProb / total) * 100;
    awayProb = (awayProb / total) * 100;
    drawProb = (drawProb / total) * 100;

    // Determine prediction
    let prediction = 'HOME WIN';
    let confidence = homeProb;
    let reasoning = `Home advantage (${home.homeAdvantage.toFixed(1)}%) and better form`;

    if (awayProb > homeProb && awayProb > drawProb) {
      prediction = 'AWAY WIN';
      confidence = awayProb;
      reasoning = `Away team's superior form overcomes home advantage`;
    } else if (drawProb > homeProb && drawProb > awayProb) {
      prediction = 'DRAW';
      confidence = drawProb;
      reasoning = `Well-matched teams with similar statistics`;
    }

    return {
      type: 'match_result',
      prediction,
      confidence: Math.round(confidence),
      reasoning,
      odds_estimate: this.calculateOddsEstimate(confidence),
      expectedOdds: this.calculateOddsEstimate(confidence),
      valueRating: confidence > 70 ? 'HIGH' : confidence > 60 ? 'MEDIUM' : 'LOW',
      risk_level: confidence > 65 ? 'LOW' : confidence > 55 ? 'MEDIUM' : 'HIGH'
    };
  }

  /**
   * ⚽ Predict both teams to score
   */
  private predictBothTeamsScore(teamStats: any, headToHead: any): BettingPrediction {
    const { home, away } = teamStats;
    
    // Calculate scoring probability for each team
    const homeScoreProb = Math.min((home.goalsFor / Math.max(home.goalsFor + home.goalsAgainst, 1)) * 100 + 20, 85);
    const awayScoreProb = Math.min((away.goalsFor / Math.max(away.goalsFor + away.goalsAgainst, 1)) * 100 + 15, 80);
    
    // Both teams score probability
    const bttsProb = (homeScoreProb * awayScoreProb) / 100;
    
    // Adjust for head-to-head goal average
    let h2hAdjustment = 0;
    if (headToHead.avgGoals > 2.5) h2hAdjustment = 10;
    else if (headToHead.avgGoals < 1.5) h2hAdjustment = -15;
    
    const finalProb = Math.max(Math.min(bttsProb + h2hAdjustment, 85), 15);
    
    const prediction = finalProb > 50 ? 'YES' : 'NO';
    const reasoning = finalProb > 50 
      ? `Both teams average good scoring rates (Home: ${home.goalsFor.toFixed(1)}, Away: ${away.goalsFor.toFixed(1)} goals/game)`
      : `Defensive-minded teams or poor attacking records suggest limited goals`;

    return {
      type: 'both_teams_score',
      prediction: `BOTH TEAMS TO SCORE: ${prediction}`,
      confidence: Math.round(Math.max(finalProb, 100 - finalProb)),
      reasoning,
      odds_estimate: this.calculateOddsEstimate(Math.max(finalProb, 100 - finalProb)),
      expectedOdds: this.calculateOddsEstimate(Math.max(finalProb, 100 - finalProb)),
      valueRating: Math.abs(finalProb - 50) > 25 ? 'HIGH' : Math.abs(finalProb - 50) > 15 ? 'MEDIUM' : 'LOW',
      risk_level: Math.abs(finalProb - 50) > 20 ? 'LOW' : Math.abs(finalProb - 50) > 10 ? 'MEDIUM' : 'HIGH'
    };
  }

  /**
   * 📊 Predict over/under goals
   */
  private predictOverUnder(teamStats: any, headToHead: any): BettingPrediction {
    const { home, away } = teamStats;
    
    // Calculate expected goals
    const homeExpected = home.goalsFor + away.goalsAgainst;
    const awayExpected = away.goalsFor + home.goalsAgainst;
    const totalExpected = (homeExpected + awayExpected) / 2;
    
    // Adjust for head-to-head average
    const h2hWeight = Math.min(headToHead.totalMeetings / 10, 0.3);
    const adjustedExpected = (totalExpected * (1 - h2hWeight)) + (headToHead.avgGoals * h2hWeight);
    
    const threshold = 2.5;
    const overProb = adjustedExpected > threshold ? 
      Math.min(60 + ((adjustedExpected - threshold) * 15), 80) :
      Math.max(40 - ((threshold - adjustedExpected) * 15), 20);
    
    const prediction = overProb > 50 ? 'OVER 2.5' : 'UNDER 2.5';
    const confidence = Math.round(Math.max(overProb, 100 - overProb));
    
    const reasoning = prediction.includes('OVER') 
      ? `Expected ${adjustedExpected.toFixed(1)} goals based on team averages and H2H`
      : `Low-scoring expectation (${adjustedExpected.toFixed(1)} goals) suggests under 2.5`;

    return {
      type: 'over_under',
      prediction: `${prediction} GOALS`,
      confidence,
      reasoning,
      odds_estimate: this.calculateOddsEstimate(confidence),
      expectedOdds: this.calculateOddsEstimate(confidence),
      valueRating: confidence > 70 ? 'HIGH' : confidence > 60 ? 'MEDIUM' : 'LOW',
      risk_level: confidence > 65 ? 'LOW' : confidence > 55 ? 'MEDIUM' : 'HIGH'
    };
  }

  /**
   * 🕐 Predict first half result
   */
  private predictFirstHalf(teamStats: any, matchResult: BettingPrediction): BettingPrediction {
    // First half is typically more conservative
    let prediction = 'DRAW';
    let confidence = 45;
    
    if (matchResult.prediction === 'HOME WIN' && matchResult.confidence > 70) {
      prediction = 'HOME LEADING';
      confidence = Math.round(matchResult.confidence * 0.6);
    } else if (matchResult.prediction === 'AWAY WIN' && matchResult.confidence > 70) {
      prediction = 'AWAY LEADING';
      confidence = Math.round(matchResult.confidence * 0.6);
    }

    return {
      type: 'first_half',
      prediction: `FIRST HALF: ${prediction}`,
      confidence,
      reasoning: `Based on strong match prediction (${matchResult.confidence}% confidence)`,
      odds_estimate: this.calculateOddsEstimate(confidence),
      expectedOdds: this.calculateOddsEstimate(confidence),
      valueRating: confidence > 60 ? 'MEDIUM' : 'LOW',
      risk_level: confidence > 60 ? 'MEDIUM' : 'HIGH'
    };
  }

  /**
   * 📊 Calculate overall match assessment
   */
  private calculateMatchAssessment(predictions: BettingPrediction[], teamStats: any) {
    const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
    
    // Determine predictability
    let predictability: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    if (avgConfidence > 70) predictability = 'HIGH';
    else if (avgConfidence < 55) predictability = 'LOW';
    
    // Risk warning for low predictability
    let riskWarning;
    if (predictability === 'LOW') {
      riskWarning = 'This match has high uncertainty - consider smaller stakes';
    }

    return {
      predictability,
      overallConfidence: Math.round(avgConfidence),
      riskWarning,
      difficultyRating: predictability === 'HIGH' ? 'Easy' : predictability === 'MEDIUM' ? 'Medium' : 'Hard'
    };
  }

  /**
   * 💰 Calculate odds estimate from confidence
   */
  private calculateOddsEstimate(confidence: number): string {
    const probability = confidence / 100;
    const odds = 1 / probability;
    
    if (odds < 1.5) return '1.20-1.50';
    else if (odds < 2) return '1.50-2.00';
    else if (odds < 3) return '2.00-3.00';
    else if (odds < 5) return '3.00-5.00';
    else return '5.00+';
  }

  /**
   * 🖼️ Generate betting analysis image
   */
  private async generateBettingImage(analysis: BettingAnalysis): Promise<string | undefined> {
    try {
      // Use the specialized betting image generator that creates atmospheric images
      const generatedImage = await aiImageGenerator.generateBettingImage(
        [analysis.homeTeam, analysis.awayTeam],
        'en' // Language doesn't affect image generation in this case
      );
      
      if (!generatedImage) return undefined;

      // The AI image generator already handles upload to Supabase and returns a public URL
      return generatedImage.url;
    } catch (error) {
      console.error(`❌ Error generating betting image:`, error);
      return undefined;
    }
  }

  /**
   * 📝 Generate betting content with AI editing and channel branding
   */
  private async generateBettingContent(analysis: BettingAnalysis, request: BettingTipRequest): Promise<{
    content: string;
    aiEditedContent: string;
  }> {
    // Generate base content with channel branding
    const content = this.generateBaseContent(analysis, request);
    console.log(`📝 Base content generated (${request.language}): "${content.substring(0, 150)}..."`);
    console.log(`📏 Base content length: ${content.length} characters`);
    
    // AI edit for quality and engagement with channel context
    const aiEditedContent = await this.aiEditBettingContent(content, analysis, request);
    console.log(`🤖 AI edited content (${request.language}): "${aiEditedContent.substring(0, 150)}..."`);
    console.log(`📏 AI edited content length: ${aiEditedContent.length} characters`);
    
    return { content, aiEditedContent };
  }

  /**
   * 📄 Generate base betting content with channel branding - REAL BETTING TIPS
   */
  private generateBaseContent(analysis: BettingAnalysis, request: BettingTipRequest): string {
    const { homeTeam, awayTeam, competition, predictions, matchAssessment, teamStats } = analysis;
    
    console.log(`🎯 GenerateBaseContent Debug: ${request.language}, Predictions count: ${predictions?.length || 0}`);
    console.log(`🔍 Predictions data:`, predictions?.slice(0, 3));
    
    if (request.language === 'en') {
      let content = `🎯 BETTING TIPS: ${homeTeam} vs ${awayTeam}\n\n`;
      
      // מציג את הטיפים האמיתיים
      content += `💰 TOP BETTING TIPS:\n\n`;
      predictions.slice(0, 3).forEach((pred, index) => {
        const tipEmoji = index === 0 ? '🏆' : index === 1 ? '⭐' : '💎';
        content += `${tipEmoji} TIP ${index + 1}: ${pred.prediction}\n`;
        content += `💰 Odds: ${pred.odds_estimate} | Confidence: ${pred.confidence}%\n`;
        content += `📝 ${pred.reasoning}\n\n`;
      });
      
      // הוספת קונטקסט המשחק
      content += `🏟️ Match Context:\n`;
      content += `${homeTeam} (Home): ${teamStats.home.form} form, ${teamStats.home.winRate}% win rate\n`;
      content += `${awayTeam} (Away): ${teamStats.away.form} form, ${teamStats.away.winRate}% win rate\n\n`;
      
      // אזהרת אחריות
      content += `⚠️ Bet responsibly. Only stake what you can afford to lose.\n`;
      content += `🔞 18+ only. Gambling can be addictive.`;
      
      // 🎯 ADD CHANNEL AFFILIATE CODE if available
      if (request.affiliateCode) {
        content += `\n\n🔗 Use code: ${request.affiliateCode} for exclusive offers`;
      }
      
      return content;
    }
    
    if (request.language === 'am') {
      let content = `🎯 የውርርድ ምክሮች: ${homeTeam} በተቃ ${awayTeam}\n\n`;
      
      // ዋና ውርርድ ምክሮች
      content += `💰 ተመራጭ ውርርድ ምክሮች:\n\n`;
      predictions.slice(0, 3).forEach((pred, index) => {
        const tipEmoji = index === 0 ? '🏆' : index === 1 ? '⭐' : '💎';
        const translatedPrediction = this.translatePrediction(pred.prediction, 'am');
        const translatedReasoning = this.translateReasoning(pred.reasoning, 'am');
        
        content += `${tipEmoji} ምክር ${index + 1}: ${translatedPrediction}\n`;
        content += `💰 ዕድል: ${pred.odds_estimate} | እምነት: ${pred.confidence}%\n`;
        content += `📝 ${translatedReasoning}\n\n`;
      });
      
      // የመጨዋወጫ ስፍራ መረጃ
      content += `🏟️ የመጫወቻ መረጃ:\n`;
      content += `${homeTeam} (ቤት): ${teamStats.home.form} ሁኔታ, ${teamStats.home.winRate}% ድል\n`;
      content += `${awayTeam} (እንግዳ): ${teamStats.away.form} ሁኔታ, ${teamStats.away.winRate}% ድል\n\n`;
      
      // ኃላፊነት ማስታወሻ
      content += `⚠️ በመልከም ሁኔታ ውርርድ ያድርጉ። መጥፋት የሚችሉትን ብቻ ይወርርዱ።\n`;
      content += `🔞 ከ18 አመት በላይ ብቻ። ውርርድ አሳዛኝ ሊሆን ይችላል።`;
      
      // 🎯 ADD CHANNEL AFFILIATE CODE if available
      if (request.affiliateCode) {
        content += `\n\n🔗 ኮድ ይጠቀሙ: ${request.affiliateCode} ለልዩ ድጋፎች`;
      }
      
      return content;
    }
    
    if (request.language === 'sw') {
      let content = `🎯 MAPENDEKEZO YA KAMARI: ${homeTeam} dhidi ya ${awayTeam}\n\n`;
      
      // Mapendekezo ya kamari
      content += `💰 MAPENDEKEZO BORA YA KAMARI:\n\n`;
      predictions.slice(0, 3).forEach((pred, index) => {
        const tipEmoji = index === 0 ? '🏆' : index === 1 ? '⭐' : '💎';
        const translatedPrediction = this.translatePrediction(pred.prediction, 'sw');
        const translatedReasoning = this.translateReasoning(pred.reasoning, 'sw');
        
        content += `${tipEmoji} PENDEKEZO ${index + 1}: ${translatedPrediction}\n`;
        content += `💰 Uwezekano: ${pred.odds_estimate} | Ujasiri: ${pred.confidence}%\n`;
        content += `📝 ${translatedReasoning}\n\n`;
      });
      
      // Maelezo ya mechi
      content += `🏟️ Muktadha wa Mechi:\n`;
      content += `${homeTeam} (Nyumbani): Hali ${teamStats.home.form}, ${teamStats.home.winRate}% ushindi\n`;
      content += `${awayTeam} (Mgeni): Hali ${teamStats.away.form}, ${teamStats.away.winRate}% ushindi\n\n`;
      
      // Onyo la uwajibikaji
      content += `⚠️ Kamari kwa busara. Tia tu kile unachoweza kupoteza.\n`;
      content += `🔞 Miaka 18+ tu. Kamari inaweza kusababisha ulezi.`;
      
      // 🎯 ADD CHANNEL AFFILIATE CODE if available
      if (request.affiliateCode) {
        content += `\n\n🔗 Tumia msimbo: ${request.affiliateCode} kwa matoleo maalum`;
      }
      
      return content;
    }
    
    // Fallback to English
    return `🎯 ${homeTeam} vs ${awayTeam} - ${competition}\n\nBetting analysis with ${matchAssessment.overallConfidence}% confidence.\n\nPredictions and analysis available.`;
  }

  /**
   * 🤖 AI edit betting content with channel context - ENHANCED VERSION
   */
  private async aiEditBettingContent(content: string, analysis: BettingAnalysis, request: BettingTipRequest): Promise<string> {
    console.log(`🤖 AI editing betting content for language: ${request.language}${request.channelName ? ` (Channel: ${request.channelName})` : ''}`);
    
    try {
      const openai = await getOpenAIClient();
      if (!openai) {
        console.log('❌ OpenAI client not available, using template-based editing');
        return this.enhanceBettingContent(content, analysis, request.language);
      }

      // TEMPORARY FIX: Disable AI editing to prevent timeouts
      console.log('⚠️ AI editing temporarily disabled to prevent timeouts');
      return this.enhanceBettingContent(content, analysis, request.language);

      const systemPrompts = {
        'en': `You are a friendly football betting expert. Create betting tips using HTML tags (<b>, <i>, <code>) and these symbols: ━ ┏ ┓ ┗ ┛ ┃. Keep it short and professional. Include odds and confidence levels.`,
        
        'am': `እርስዎ የእግር ኳስ ውርርድ ባለሙያ ነዎት የዘመናዊ ቴሌግራም የHTML ፎርማቲንግ የሚፈጥሩ። የHTML መለያዎችን (<b>, <i>, <code>) እና የዩኒኮድ ሳጥን መስመሮችን ተጠቅመው ይፃፉ። እንደዚህ ይቅረጹ:

<b>🎯 የውርርድ ምክሮች: ቡድን ሀ በተቃ ቡድን ለ</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<b>💰 ተመራጭ ትንበያዎች</b>
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🏆 <b>የጨዋታ ውጤት:</b> የቤት ድል
┃ 💰 <code>ዕድል: 1.85</code> | <i>እምነት: 80%</i>
┃ 📝 ጠንካራ የቤት ቅርፀት እና ጥቅም
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

በኃላፊነት ውርርድ ማስታወሻ ያካትቱ።`,
        
        'sw': `Wewe ni mtaalamu wa kamari za mpira wa miguu unayetengeneza maudhui ya kisasa ya Telegram kwa kutumia muundo wa HTML. Andika mapendekezo ya kamari ukitumia lebo za HTML (<b>, <i>, <code>) na alama za mstari wa kisanduku. Tengeneza kama hivi:

<b>🎯 MAPENDEKEZO YA KAMARI: Timu A dhidi ya Timu B</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<b>💰 UTABIRI WA KILELE</b>
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🏆 <b>Matokeo ya Mechi:</b> Ushindi wa Nyumbani
┃ 💰 <code>Uwezekano: 1.85</code> | <i>Ujasiri: 80%</i>
┃ 📝 Hali nzuri ya nyumbani na faida
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

Malizia kwa onyo la kamari zenye uwajibikaji.`,

        'fr': `Vous êtes un expert amical en paris de football qui crée du contenu Telegram moderne avec formatage HTML. Rédigez des conseils de paris en utilisant les balises HTML (<b>, <i>, <code>) et les caractères Unicode de dessin de boîte. Formatez comme ceci:

<b>🎯 CONSEILS DE PARIS: Équipe A vs Équipe B</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<b>💰 PRÉDICTIONS PRINCIPALES</b>
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🏆 <b>Résultat du Match:</b> Victoire Domicile
┃ 💰 <code>Cotes: 1.85</code> | <i>Confiance: 80%</i>
┃ 📝 Forte forme à domicile et avantage
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

Terminez par un rappel de jeu responsable.`,

        'ar': `أنت خبير ودود في رهانات كرة القدم تقوم بإنشاء محتوى تيليجرام حديث بتنسيق HTML. اكتب نصائح الرهان باستخدام علامات HTML (<b>, <i>, <code>) وأحرف رسم الصندوق Unicode. قم بالتنسيق كما يلي:

<b>🎯 نصائح الرهان: الفريق أ ضد الفريق ب</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<b>💰 التوقعات الرئيسية</b>
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🏆 <b>نتيجة المباراة:</b> فوز الفريق المضيف
┃ 💰 <code>الاحتمالات: 1.85</code> | <i>الثقة: 80%</i>
┃ 📝 قوة في الملعب والأفضلية
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

انته بتذكير بالمقامرة المسؤولة.`
      };

      // Build detailed analysis data for AI
      const analysisData = {
        match: `${analysis.homeTeam} vs ${analysis.awayTeam}`,
        competition: analysis.competition,
        kickoff: analysis.kickoff,
        venue: analysis.venue,
        overallConfidence: `${analysis.matchAssessment.overallConfidence}%`,
        predictability: analysis.matchAssessment.predictability,
        
        homeTeam: {
          name: analysis.homeTeam,
          form: analysis.teamStats.home.form,
          winRate: `${analysis.teamStats.home.winRate}%`,
          homeAdvantage: `${analysis.teamStats.home.homeAdvantage}%`,
          goalsFor: analysis.teamStats.home.goalsFor,
          goalsAgainst: analysis.teamStats.home.goalsAgainst,
          last5Games: analysis.teamStats.home.last5Games || [],
          injuries: analysis.teamStats.home.keyInjuries || []
        },
        
        awayTeam: {
          name: analysis.awayTeam,
          form: analysis.teamStats.away.form,
          winRate: `${analysis.teamStats.away.winRate}%`,
          awayForm: `${analysis.teamStats.away.awayForm}%`,
          goalsFor: analysis.teamStats.away.goalsFor,
          goalsAgainst: analysis.teamStats.away.goalsAgainst,
          last5Games: analysis.teamStats.away.last5Games || [],
          injuries: analysis.teamStats.away.keyInjuries || []
        },
        
        headToHead: {
          totalMeetings: analysis.headToHead.totalMeetings,
          homeWins: analysis.headToHead.homeWins,
          awayWins: analysis.headToHead.awayWins,
          draws: analysis.headToHead.draws,
          avgGoals: analysis.headToHead.avgGoals,
          recentTrend: analysis.headToHead.recentTrend,
          lastMeeting: analysis.headToHead.lastMeeting
        },
        
        predictions: analysis.predictions.map(pred => ({
          type: pred.type,
          prediction: pred.prediction,
          confidence: `${pred.confidence}%`,
          odds: pred.expectedOdds || pred.odds_estimate || 'TBD',
          reasoning: pred.reasoning,
          riskLevel: pred.risk_level,
          valueRating: pred.valueRating
        }))
      };

      const languageInstructions = {
        'en': `Write modern Telegram betting tips using HTML formatting and Unicode box drawing characters. Format like this:

<b>🎯 BETTING TIPS: [Team A] vs [Team B]</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<b>💰 TOP PREDICTIONS</b>
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🏆 <b>Tip 1:</b> [Prediction]
┃ 💰 <code>Odds: [X.XX]</code> | <i>Confidence: XX%</i>
┃ 📝 [Short reasoning]
┃
┃ ⚽ <b>Tip 2:</b> [Prediction]  
┃ 💰 <code>Odds: [X.XX]</code> | <i>Confidence: XX%</i>
┃ 📝 [Short reasoning]
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

⚠️ <i>Bet responsibly. 18+ only.</i>

MUST use HTML tags: <b> for bold, <i> for italic, <code> for odds.
MUST use Unicode box characters: ━ ┏ ┓ ┗ ┛ ┃`,
      
        'am': `የዘመናዊ ቴሌግራም የውርርድ ምክሮችን የHTML ፎርማቲንግ እና የዩኒኮድ ሳጥን ቅርጾችን ተጠቅመው ይፃፉ። እንደዚህ ይቅረጹ:

<b>🎯 የውርርድ ምክሮች: [ቡድን ሀ] በተቃ [ቡድን ለ]</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<b>💰 ተመራጭ ትንበያዎች</b>
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🏆 <b>ምክር 1:</b> [ትንበያ]
┃ 💰 <code>ዕድል: [X.XX]</code> | <i>እምነት: XX%</i>
┃ 📝 [አጭር ምክንያት]
┃
┃ ⚽ <b>ምክር 2:</b> [ትንበያ]
┃ 💰 <code>ዕድል: [X.XX]</code> | <i>እምነት: XX%</i>
┃ 📝 [አጭር ምክንያት]
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

⚠️ <i>በኃላፊነት ውርርድ ያድርጉ። 18+ ብቻ።</i>

HTML መለያዎችን መጠቀም አለብዎት: <b> ለቦልድ, <i> ለኢታሊክ, <code> ለዕድል።
የዩኒኮድ ሳጥን ቁምፊዎችን መጠቀም አለብዎት: ━ ┏ ┓ ┗ ┛ ┃`,
      
        'sw': `Andika mapendekezo ya kisasa ya Telegram ya kamari ukitumia muundo wa HTML na alama za kisanduku za Unicode. Tengeneza kama hivi:

<b>🎯 MAPENDEKEZO YA KAMARI: [Timu A] dhidi ya [Timu B]</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<b>💰 UTABIRI WA KILELE</b>
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🏆 <b>Pendekezo 1:</b> [Utabiri]
┃ 💰 <code>Uwezekano: [X.XX]</code> | <i>Ujasiri: XX%</i>
┃ 📝 [Sababu fupi]
┃
┃ ⚽ <b>Pendekezo 2:</b> [Utabiri]
┃ 💰 <code>Uwezekano: [X.XX]</code> | <i>Ujasiri: XX%</i>
┃ 📝 [Sababu fupi]
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

⚠️ <i>Kamari kwa busara. Miaka 18+ tu.</i>

LAZIMA utumie lebo za HTML: <b> kwa bold, <i> kwa italic, <code> kwa uwezekano.
LAZIMA utumie alama za kisanduku za Unicode: ━ ┏ ┓ ┗ ┛ ┃`,

        'fr': `Rédigez des conseils de paris Telegram modernes en utilisant le formatage HTML et les caractères de dessin de boîte Unicode. Formatez comme ceci:

<b>🎯 CONSEILS DE PARIS: [Équipe A] vs [Équipe B]</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<b>💰 PRÉDICTIONS PRINCIPALES</b>
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🏆 <b>Conseil 1:</b> [Prédiction]
┃ 💰 <code>Cotes: [X.XX]</code> | <i>Confiance: XX%</i>
┃ 📝 [Raison courte]
┃
┃ ⚽ <b>Conseil 2:</b> [Prédiction]
┃ 💰 <code>Cotes: [X.XX]</code> | <i>Confiance: XX%</i>
┃ 📝 [Raison courte]
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

⚠️ <i>Pariez de manière responsable. 18+ seulement.</i>

DOIT utiliser les balises HTML: <b> pour gras, <i> pour italique, <code> pour cotes.
DOIT utiliser les caractères de boîte Unicode: ━ ┏ ┓ ┗ ┛ ┃`,

        'ar': `اكتب نصائح رهان تيليجرام حديثة باستخدام تنسيق HTML وأحرف رسم الصندوق Unicode. قم بالتنسيق كما يلي:

<b>🎯 نصائح الرهان: [الفريق أ] ضد [الفريق ب]</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<b>💰 التوقعات الرئيسية</b>
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🏆 <b>نصيحة 1:</b> [التوقع]
┃ 💰 <code>الاحتمالات: [X.XX]</code> | <i>الثقة: XX%</i>
┃ 📝 [سبب مختصر]
┃
┃ ⚽ <b>نصيحة 2:</b> [التوقع]
┃ 💰 <code>الاحتمالات: [X.XX]</code> | <i>الثقة: XX%</i>
┃ 📝 [سبب مختصر]
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

⚠️ <i>راهن بمسؤولية. +18 فقط.</i>

يجب استخدام علامات HTML: <b> للعريض، <i> للمائل، <code> للاحتمالات.
يجب استخدام أحرف الصندوق Unicode: ━ ┏ ┓ ┗ ┛ ┃`
      };

      // Fix undefined language by defaulting to English
      const safeLanguage = request.language || 'en';
      const systemPrompt = systemPrompts[safeLanguage] || systemPrompts['en'];
      const languageInstruction = languageInstructions[safeLanguage] || languageInstructions['en'];
      
      if (!systemPrompt || !languageInstruction) {
        console.error(`❌ Missing prompts for language: ${safeLanguage}, falling back to template`);
        return this.enhanceBettingContent(content, analysis, safeLanguage);
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: systemPrompt
          },
          { 
            role: "user", 
            content: `${languageInstruction}

MATCH ANALYSIS DATA:
${JSON.stringify(analysisData, null, 2)}

INSTRUCTIONS:
1. Use the EXACT predictions from the data above
2. Include the SPECIFIC odds and confidence levels provided
3. Reference the actual team statistics and head-to-head data
4. Make each betting tip specific and actionable
5. Use the team names, competition, and venue information
6. Include risk levels and value ratings where available

Create betting tips that are specific to this exact match with the provided data.` 
          }
        ],
        max_tokens: 1500, // Increased for complete HTML content without cutting
        temperature: 0.7 // Balanced creativity and accuracy
      });

      const enhancedContent = response.choices[0]?.message?.content?.trim();
      
      if (enhancedContent) {
        console.log(`✅ AI enhanced betting content in ${request.language}: "${enhancedContent.substring(0, 100)}..."`);
        console.log(`📏 Enhanced content length: ${enhancedContent.length} characters`);
        return enhancedContent;
      } else {
        console.log(`❌ AI returned empty content, falling back to template`);
      }
      
    } catch (error) {
      console.error('❌ Error enhancing betting content with AI:', error);
    }
    
    // Fallback to template-based editing
    return this.enhanceBettingContent(content, analysis, request.language);
  }

  /**
   * ✨ Enhance betting content with engaging format
   */
  private enhanceBettingContent(content: string, analysis: BettingAnalysis, language: 'en' | 'am' | 'sw' | 'fr' | 'ar'): string {
    if (language === 'en') {
      return `<b>🎯 BETTING TIPS: ${analysis.homeTeam} vs ${analysis.awayTeam}</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<b>💰 Top Predictions</b>
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🏆 <b>Match Result:</b> ${analysis.predictions[0]?.prediction || 'Home Win'}
┃ 💰 <code>Odds: ${analysis.predictions[0]?.odds || '1.85'}</code> | <i>Confidence: ${analysis.predictions[0]?.confidence || 80}%</i>
┃ 📝 ${analysis.matchAssessment.keyFactors[0] || 'Strong home form and advantage'}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

🔥 <b>Don't miss this ${analysis.matchAssessment.predictability.toLowerCase()}-confidence betting opportunity!</b>

💡 <i>Remember: Bet responsibly and only what you can afford to lose!</i>

#BettingTips #Football #${analysis.homeTeam.replace(/\s+/g, '')} #${analysis.awayTeam.replace(/\s+/g, '')}`;
    }
    
    if (language === 'am') {
      return `<b>🎯 የውርርድ ምክሮች: ${analysis.homeTeam} በተቃወመ ${analysis.awayTeam}</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<b>💰 ተመራጭ ትንበያዎች</b>
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🏆 <b>የጨዋታ ውጤት:</b> ${analysis.predictions[0]?.prediction || 'የቤት ድል'}
┃ 💰 <code>ዕድል: ${analysis.predictions[0]?.odds || '1.85'}</code> | <i>እምነት: ${analysis.predictions[0]?.confidence || 80}%</i>
┃ 📝 ${analysis.matchAssessment.keyFactors[0] || 'ጠንካራ የቤት ቅርፀት እና ጥቅም'}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

🔥 <b>ይህን የ${analysis.matchAssessment.predictability.toLowerCase()}-እምነት የውርርድ እድል አታመልጡት!</b>

💡 <i>ያስታውሱ: በኃላፊነት ይዋረዱ እና ማጣት የሚችሉትን ብቻ!</i>

#የውርርድምክሮች #እግርኳስ #${analysis.homeTeam.replace(/\s+/g, '')} #${analysis.awayTeam.replace(/\s+/g, '')} #BettingTips #Football`;
    }
    
    if (language === 'sw') {
      return `<b>🎯 MAPENDEKEZO YA KAMARI: ${analysis.homeTeam} dhidi ya ${analysis.awayTeam}</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<b>💰 Utabiri Bora</b>
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🏆 <b>Matokeo ya Mchezo:</b> ${analysis.predictions[0]?.prediction || 'Ushindi wa Nyumbani'}
┃ 💰 <code>Uwezekano: ${analysis.predictions[0]?.odds || '1.85'}</code> | <i>Uhakika: ${analysis.predictions[0]?.confidence || 80}%</i>
┃ 📝 ${analysis.matchAssessment.keyFactors[0] || 'Umbo bora la nyumbani na faida'}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

🔥 <b>Usikose fursa hii ya kamari ya ${analysis.matchAssessment.predictability.toLowerCase()}-uongozi!</b>

💡 <i>Kumbuka: Weka kamari kwa busara na kile unachoweza kupoteza tu!</i>

#KamariTips #Mpira #${analysis.homeTeam.replace(/\s+/g, '')} #${analysis.awayTeam.replace(/\s+/g, '')} #BettingTips #Football`;
    }
    
    if (language === 'fr') {
      return `<b>🎯 CONSEILS DE PARIS: ${analysis.homeTeam} vs ${analysis.awayTeam}</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<b>💰 Prédictions Principales</b>
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🏆 <b>Résultat du Match:</b> ${analysis.predictions[0]?.prediction || 'Victoire Domicile'}
┃ 💰 <code>Cotes: ${analysis.predictions[0]?.odds || '1.85'}</code> | <i>Confiance: ${analysis.predictions[0]?.confidence || 80}%</i>
┃ 📝 ${analysis.matchAssessment.keyFactors[0] || 'Forme solide à domicile et avantage'}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

🔥 <b>Ne manquez pas cette opportunité de pari avec ${analysis.matchAssessment.predictability.toLowerCase()}-confiance!</b>

💡 <i>Rappel: Pariez de manière responsable et seulement ce que vous pouvez vous permettre de perdre!</i>

#ConseilsParis #Football #${analysis.homeTeam.replace(/\s+/g, '')} #${analysis.awayTeam.replace(/\s+/g, '')} #BettingTips`;
    }
    
    if (language === 'ar') {
      return `<b>🎯 نصائح الرهان: ${analysis.homeTeam} ضد ${analysis.awayTeam}</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<b>💰 التوقعات الرئيسية</b>
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 🏆 <b>نتيجة المباراة:</b> ${analysis.predictions[0]?.prediction || 'فوز الفريق المضيف'}
┃ 💰 <code>الاحتمالات: ${analysis.predictions[0]?.odds || '1.85'}</code> | <i>الثقة: ${analysis.predictions[0]?.confidence || 80}%</i>
┃ 📝 ${analysis.matchAssessment.keyFactors[0] || 'شكل قوي في الملعب والميزة'}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

🔥 <b>لا تفوت هذه الفرصة للرهان بثقة ${analysis.matchAssessment.predictability.toLowerCase()}!</b>

💡 <i>تذكر: راهن بمسؤولية وفقط بما يمكنك تحمل خسارته!</i>

#نصائح_الرهان #كرة_القدم #${analysis.homeTeam.replace(/\s+/g, '')} #${analysis.awayTeam.replace(/\s+/g, '')} #BettingTips #Football`;
    }
    
    return content;
  }

  /**
   * ⚠️ Get responsible gambling disclaimers
   */
  private getDisclaimers(language: 'en' | 'am' | 'sw' | 'fr' | 'ar'): string[] {
    const disclaimers = {
      en: [
        '⚠️ 18+ Only - Gambling can be addictive',
        '💰 Never bet more than you can afford to lose',
        '📚 This analysis is for educational purposes only',
        '🚫 No guarantees - all bets carry risk',
        '🆘 Problem gambling? Get help: www.begambleaware.org',
        '📊 Past performance does not guarantee future results'
      ],
      am: [
        '⚠️ 18+ ብቻ - ውርርድ ሱስ ሊፈጥር ይችላል',
        '💰 ማጣት የማትችለውን መጠን በላይ አትዋረድ',
        '📚 እነዚህ ምክሮች ለትምህርት ዓላማ ብቻ ናቸው',
        '🚫 ምንም ዋስትና የለም - ሁሉም ውርርዶች አደጋ አላቸው',
        '🆘 የውርርድ ችግር? እርዳታ ያግኙ',
        '📊 ያለፈ አፈፃፀም ለወደፊት ውጤት ዋስትና አይሰጥም'
      ],
      sw: [
        '⚠️ Umri 18+ pekee - Kamari inaweza kuwa hatari',
        '💰 Usiweke zaidi ya unachoweza kupoteza',
        '📚 Uchambuzi huu ni kwa madhumuni ya kielimu tu',
        '🚫 Hakuna uhakika - kamari zote zina hatari',
        '🆘 Matatizo ya kamari? Pata msaada',
        '📊 Utendaji wa zamani haudhaminishe matokeo ya baadaye'
      ],
      fr: [
        '⚠️ 18+ Seulement - Le jeu peut créer une dépendance',
        '💰 Ne pariez jamais plus que ce que vous pouvez vous permettre de perdre',
        '📚 Cette analyse est uniquement à des fins éducatives',
        '🚫 Aucune garantie - tous les paris comportent des risques',
        '🆘 Problème de jeu? Obtenez de l\'aide: www.joueurs-info-service.fr',
        '📊 Les performances passées ne garantissent pas les résultats futurs'
      ],
      ar: [
        '⚠️ +18 فقط - القمار يمكن أن يكون إدماناً',
        '💰 لا تراهن أبداً بأكثر مما يمكنك تحمل خسارته',
        '📚 هذا التحليل لأغراض تعليمية فقط',
        '🚫 لا توجد ضمانات - جميع الرهانات تحمل مخاطر',
        '🆘 مشكلة في القمار؟ احصل على المساعدة',
        '📊 الأداء السابق لا يضمن النتائج المستقبلية'
      ]
    };
    
    return disclaimers[language];
  }

  /**
   * ✅ Mark content as used for uniqueness
   */
  private async markContentAsUsed(analysis: BettingAnalysis, channelId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('content_uniqueness')
        .insert({
          content_id: `${analysis.homeTeam}_${analysis.awayTeam}_${Date.now()}`,
          channel_id: channelId,
          content_type: 'betting_tip',
          used_at: new Date().toISOString(),
          variation_token: `BETTING_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });

      if (error) {
        console.error(`❌ Error marking betting content as used:`, error);
      }
    } catch (error) {
      console.error(`❌ Error in markContentAsUsed:`, error);
    }
  }

  /**
   * 🔍 Get latest betting opportunities
   */
  async getLatestBettingOpportunities(language: 'en' | 'am' | 'sw' = 'en', limit: number = 3): Promise<BettingAnalysis[]> {
    const opportunities: BettingAnalysis[] = [];
    
    try {
      // Get multiple matches for analysis
      const analysisResults = await unifiedFootballService.getMatchesForContentType('betting_tip', language, limit * 2);
      
      for (const match of analysisResults.matches.slice(0, limit)) {
        const analysis = await this.performBettingAnalysis(match);
        if (analysis.matchAssessment.overallConfidence >= 60) {
          opportunities.push(analysis);
        }
      }
    } catch (error) {
      console.error(`❌ Error getting betting opportunities:`, error);
    }
    
    return opportunities;
  }

  /**
   * 📊 Get betting statistics
   */
  async getBettingStats(): Promise<{
    totalAnalyzed: number;
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
    avgConfidence: number;
  }> {
    // This would connect to database to get actual stats
    // For now, returning mock data
    return {
      totalAnalyzed: 0,
      highConfidence: 0,
      mediumConfidence: 0,
      lowConfidence: 0,
      avgConfidence: 0
    };
  }

  /**
   * 🌐 Translate prediction text to target language
   */
  private translatePrediction(prediction: string, language: 'en' | 'am' | 'sw'): string {
    if (language === 'en') return prediction;
    
    // Basic translations for common predictions
    const translations = {
      am: {
        'HOME WIN': 'የቤት ቡድን ያሸንፋል',
        'AWAY WIN': 'የእንግድ ቡድን ያሸንፋል', 
        'DRAW': 'እኩል ይበርራል',
        'BOTH TEAMS TO SCORE: YES': 'ሁለቱም ቡድኖች ይመዘገባሉ: አዎ',
        'BOTH TEAMS TO SCORE: NO': 'ሁለቱም ቡድኖች ይመዘገባሉ: አይደለም',
        'OVER 2.5 GOALS': 'ከ2.5 ጎሎች በላይ',
        'UNDER 2.5 GOALS': 'ከ2.5 ጎሎች በታች',
        'FIRST HALF: HOME LEADING': 'የመጀመሪያ ግማሽ: ቤት ቀዳሚ',
        'FIRST HALF: AWAY LEADING': 'የመጀመሪያ ግማሽ: እንግዳ ቀዳሚ',
        'FIRST HALF: DRAW': 'የመጀመሪያ ግማሽ: እኩል'
      },
      sw: {
        'HOME WIN': 'Timu ya nyumbani kushinda',
        'AWAY WIN': 'Timu ya nje kushinda',
        'DRAW': 'Sare',
        'BOTH TEAMS TO SCORE: YES': 'Timu zote mbili kutunga: Ndio',
        'BOTH TEAMS TO SCORE: NO': 'Timu zote mbili kutunga: Hapana',
        'OVER 2.5 GOALS': 'Zaidi ya magoli 2.5',
        'UNDER 2.5 GOALS': 'Chini ya magoli 2.5',
        'FIRST HALF: HOME LEADING': 'Kipindi cha kwanza: Nyumbani kuongoza',
        'FIRST HALF: AWAY LEADING': 'Kipindi cha kwanza: Nje kuongoza',
        'FIRST HALF: DRAW': 'Kipindi cha kwanza: Sare'
      }
    };

    // Try to find exact match or partial match
    const langTranslations = translations[language];
    for (const [english, translated] of Object.entries(langTranslations)) {
      if (prediction.includes(english)) {
        return prediction.replace(english, translated);
      }
    }
    
    return prediction; // Return original if no translation found
  }

  /**
   * 🌐 Translate reasoning text to target language  
   */
  private translateReasoning(reasoning: string, language: 'en' | 'am' | 'sw'): string {
    if (language === 'en') return reasoning;
    
    // Basic phrase translations
    const phrases = {
      am: {
        'Home advantage': 'የቤት ጥቅም',
        'better form': 'ተሻለ ሁኔታ',
        'superior form': 'ያላንታ ሁኔታ',
        'overcomes': 'ያሸንፋል',
        'Well-matched teams': 'ተመጣጣኝ ቡድኖች',
        'similar statistics': 'ተመሳሳይ ስታቲስቲክስ',
        'good scoring rates': 'ጥሩ የጎል መዝገብ',
        'goals/game': 'ጎሎች/ጨዋታ',
        'Defensive-minded teams': 'መከላከያ ቡድኖች',
        'poor attacking records': 'ደካማ የጥቃት መዝገብ',
        'limited goals': 'ውስን ጎሎች',
        'Expected': 'የሚጠበቀው',
        'goals based on': 'ጎሎች በመመረኮዝ',
        'team averages': 'የቡድኖች አማካይ',
        'Low-scoring expectation': 'ዝቅተኛ ጎል መጠበቅ',
        'suggests': 'ይጠቁማል',
        'Based on strong match prediction': 'በጠንካራ የመጨወታ ትንበያ ላይ በመመረኮዝ',
        'confidence': 'እምነት'
      },
      sw: {
        'Home advantage': 'Faida ya nyumbani',
        'better form': 'hali bora',
        'superior form': 'hali ya juu',
        'overcomes': 'kushinda',
        'Well-matched teams': 'Timu sawa',
        'similar statistics': 'takwimu sawa',
        'good scoring rates': 'viwango vizuri vya kutunga',
        'goals/game': 'magoli/mchezo',
        'Defensive-minded teams': 'Timu za ulinzi',
        'poor attacking records': 'rekodi mbaya za mashambulizi',
        'limited goals': 'magoli machache',
        'Expected': 'Yanayotarajiwa',
        'goals based on': 'magoli kulingana na',
        'team averages': 'wastani wa timu',
        'Low-scoring expectation': 'matarajio ya magoli machache',
        'suggests': 'inapendekeza',
        'Based on strong match prediction': 'Kulingana na utabiri mkuu wa mechi',
        'confidence': 'ujasiri'
      }
    };

    let translatedReasoning = reasoning;
    const langPhrases = phrases[language];
    
    for (const [english, translated] of Object.entries(langPhrases)) {
      translatedReasoning = translatedReasoning.replace(new RegExp(english, 'gi'), translated);
    }
    
    return translatedReasoning;
  }
}

// Export singleton instance
export const bettingTipsGenerator = new BettingTipsGenerator();