/**
 * 🎯 BETTING TIPS GENERATOR
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
}

export interface BettingAnalysis {
  homeTeam: string;
  awayTeam: string;
  competition: string;
  kickoff: string;
  
  // Statistical foundation
  teamStats: {
    home: {
      form: string;
      winRate: number;
      goalsFor: number;
      goalsAgainst: number;
      homeAdvantage: number;
    };
    away: {
      form: string;
      winRate: number;
      goalsFor: number;
      goalsAgainst: number;
      awayForm: number;
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
  };
  
  // Predictions
  predictions: BettingPrediction[];
  
  // Overall assessment
  matchAssessment: {
    predictability: 'HIGH' | 'MEDIUM' | 'LOW';
    overallConfidence: number;
    riskWarning?: string;
  };
}

export interface BettingTipRequest {
  language: 'en' | 'am' | 'sw';
  channelId: string;
  maxPredictions?: number;
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
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
  };
}

export class BettingTipsGenerator {

  /**
   * 🎯 MAIN FUNCTION - Generate betting tips content
   */
  async generateBettingTips(request: BettingTipRequest): Promise<GeneratedBettingTip | null> {
    console.log(`🎯 Generating betting tips in ${request.language}`);
    
    try {
      // Step 1: Get best match for betting analysis
      const bestMatch = await this.getBestMatchForBetting(request.language);
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
      
      // Step 5: Generate text content with AI editing
      const { content, aiEditedContent } = await this.generateBettingContent(analysis, request.language);
      
      // Step 6: Add responsible gambling disclaimers
      const disclaimers = this.getDisclaimers(request.language);
      
      // Step 7: Mark content as used for uniqueness
      await this.markContentAsUsed(analysis, request.channelId);

      return {
        title: `🎯 ${analysis.homeTeam} vs ${analysis.awayTeam} - Betting Analysis`,
        content,
        imageUrl,
        analysis,
        aiEditedContent,
        disclaimers,
        metadata: {
          language: request.language,
          generatedAt: new Date().toISOString(),
          contentId: `betting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          confidenceLevel: analysis.matchAssessment.overallConfidence,
          riskLevel: analysis.matchAssessment.predictability
        }
      };

    } catch (error) {
      console.error(`❌ Error generating betting tips:`, error);
      return null;
    }
  }

  /**
   * 🏆 Step 1: Get best match for betting analysis
   */
  private async getBestMatchForBetting(language: 'en' | 'am' | 'sw') {
    return await unifiedFootballService.getBestMatchForContent('betting_tip', language);
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
    
    // Calculate overall assessment
    const matchAssessment = this.calculateMatchAssessment(predictions, teamStats);

    return {
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      competition: match.competition.name,
      kickoff: match.kickoff || new Date().toISOString(),
      teamStats,
      headToHead,
      predictions,
      matchAssessment
    };
  }

  /**
   * 📈 Calculate team statistics for betting analysis
   */
  private calculateTeamStats(homeAnalysis: any, awayAnalysis: any) {
    // Home team stats
    const homeStats = {
      form: homeAnalysis?.statistics?.form || 'Unknown',
      winRate: homeAnalysis?.statistics?.winRate || 0,
      goalsFor: homeAnalysis?.statistics?.goalsFor || 0,
      goalsAgainst: homeAnalysis?.statistics?.goalsAgainst || 0,
      homeAdvantage: this.calculateHomeAdvantage(homeAnalysis)
    };

    // Away team stats  
    const awayStats = {
      form: awayAnalysis?.statistics?.form || 'Unknown',
      winRate: awayAnalysis?.statistics?.winRate || 0,
      goalsFor: awayAnalysis?.statistics?.goalsFor || 0,
      goalsAgainst: awayAnalysis?.statistics?.goalsAgainst || 0,
      awayForm: this.calculateAwayForm(awayAnalysis)
    };

    return { home: homeStats, away: awayStats };
  }

  /**
   * 🏠 Calculate home advantage factor
   */
  private calculateHomeAdvantage(homeAnalysis: any): number {
    // Home teams typically have 5-15% advantage
    const baseAdvantage = 10;
    
    // Boost based on home form
    const form = homeAnalysis?.statistics?.form || '';
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
    
    const form = awayAnalysis?.statistics?.form || '';
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
        totalMeetings: 0,
        homeWins: 0,
        awayWins: 0,
        draws: 0,
        avgGoals: 2.5,
        recentTrend: 'No recent data'
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
      recentTrend
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
    let reasoning = `Home advantage (${home.homeAdvantage}%) and better form`;

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
      ? `Both teams average good scoring rates (Home: ${(home.goalsFor/10).toFixed(1)}, Away: ${(away.goalsFor/10).toFixed(1)} goals/game)`
      : `Defensive-minded teams or poor attacking records suggest limited goals`;

    return {
      type: 'both_teams_score',
      prediction: `BOTH TEAMS TO SCORE: ${prediction}`,
      confidence: Math.round(Math.max(finalProb, 100 - finalProb)),
      reasoning,
      odds_estimate: this.calculateOddsEstimate(Math.max(finalProb, 100 - finalProb)),
      risk_level: Math.abs(finalProb - 50) > 20 ? 'LOW' : Math.abs(finalProb - 50) > 10 ? 'MEDIUM' : 'HIGH'
    };
  }

  /**
   * 📊 Predict over/under goals
   */
  private predictOverUnder(teamStats: any, headToHead: any): BettingPrediction {
    const { home, away } = teamStats;
    
    // Calculate expected goals
    const homeExpected = (home.goalsFor / 10) + (away.goalsAgainst / 10);
    const awayExpected = (away.goalsFor / 10) + (home.goalsAgainst / 10);
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
      riskWarning
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
    const prompt = `Professional football betting analysis illustration: ${analysis.homeTeam} vs ${analysis.awayTeam} in ${analysis.competition}.
    Modern sports betting design with statistics display, confidence meters, prediction graphics, 
    odds analysis charts, professional betting aesthetic, clean infographic style, 
    team colors integration, statistical data visualization, high quality digital art.`;

    try {
      const generatedImage = await aiImageGenerator.generateImage({
        prompt: prompt,
        size: '1024x1024',
        quality: 'high'
      });
      
      if (!generatedImage) return undefined;

      // The AI image generator already handles upload to Supabase and returns a public URL
      return generatedImage.url;
    } catch (error) {
      console.error(`❌ Error generating betting image:`, error);
      return undefined;
    }
  }

  /**
   * 📝 Generate betting content with AI editing
   */
  private async generateBettingContent(analysis: BettingAnalysis, language: 'en' | 'am' | 'sw'): Promise<{
    content: string;
    aiEditedContent: string;
  }> {
    // Generate base content
    const content = this.generateBaseContent(analysis, language);
    
    // AI edit for quality and engagement
    const aiEditedContent = await this.aiEditBettingContent(content, analysis, language);
    
    return { content, aiEditedContent };
  }

  /**
   * 📄 Generate base betting content
   */
  private generateBaseContent(analysis: BettingAnalysis, language: 'en' | 'am' | 'sw'): string {
    const { homeTeam, awayTeam, competition, predictions, matchAssessment, teamStats } = analysis;
    
    if (language === 'en') {
      let content = `🎯 BETTING ANALYSIS: ${homeTeam} vs ${awayTeam}\n\n`;
      content += `🏆 Competition: ${competition}\n`;
      content += `📊 Overall Confidence: ${matchAssessment.overallConfidence}%\n`;
      content += `🎲 Predictability: ${matchAssessment.predictability}\n\n`;
      
      content += `📈 TEAM FORM:\n`;
      content += `🏠 ${homeTeam}: ${teamStats.home.form} (${teamStats.home.winRate}% win rate)\n`;
      content += `✈️ ${awayTeam}: ${teamStats.away.form} (${teamStats.away.winRate}% win rate)\n\n`;
      
      content += `💡 PREDICTIONS:\n`;
      predictions.forEach((pred, index) => {
        content += `${index + 1}. ${pred.prediction}\n`;
        content += `   📊 Confidence: ${pred.confidence}%\n`;
        content += `   💰 Est. Odds: ${pred.odds_estimate}\n`;
        content += `   ⚠️ Risk: ${pred.risk_level}\n`;
        content += `   📝 Reasoning: ${pred.reasoning}\n\n`;
      });
      
      if (matchAssessment.riskWarning) {
        content += `⚠️ RISK WARNING: ${matchAssessment.riskWarning}\n\n`;
      }
      
      return content;
    }
    
    if (language === 'am') {
      let content = `🎯 የውርርድ ትንታኔ: ${homeTeam} በተቃ ${awayTeam}\n\n`;
      content += `🏆 ውድድር: ${competition}\n`;
      content += `📊 አጠቃላይ እምነት: ${matchAssessment.overallConfidence}%\n`;
      content += `🎲 ትንበያ: ${matchAssessment.predictability}\n\n`;
      
      content += `📈 የቡድን ሁኔታ:\n`;
      content += `🏠 ${homeTeam}: ${teamStats.home.form} (${teamStats.home.winRate}% ያሸነፈ)\n`;
      content += `✈️ ${awayTeam}: ${teamStats.away.form} (${teamStats.away.winRate}% ያሸነፈ)\n\n`;
      
      content += `💡 ትንበያዎች:\n`;
      predictions.forEach((pred, index) => {
        // Translate basic prediction types to Amharic
        const translatedPrediction = this.translatePrediction(pred.prediction, 'am');
        const translatedReasoning = this.translateReasoning(pred.reasoning, 'am');
        
        content += `${index + 1}. ${translatedPrediction}\n`;
        content += `   📊 እምነት: ${pred.confidence}%\n`;
        content += `   💰 ግምት: ${pred.odds_estimate}\n`;
        content += `   ⚠️ ስጋት: ${pred.risk_level}\n`;
        content += `   📝 ምክንያት: ${translatedReasoning}\n\n`;
      });
      
      if (matchAssessment.riskWarning) {
        content += `⚠️ የስጋት ማስጠንቀቂያ: ${matchAssessment.riskWarning}\n\n`;
      }
      
      return content;
    }
    
    if (language === 'sw') {
      let content = `🎯 UCHAMBUZI WA KAMARI: ${homeTeam} dhidi ya ${awayTeam}\n\n`;
      content += `🏆 Ushindani: ${competition}\n`;
      content += `📊 Uongozi Jumla: ${matchAssessment.overallConfidence}%\n`;
      content += `🎲 Ubashiri: ${matchAssessment.predictability}\n\n`;
      
      content += `📈 HALI YA TIMU:\n`;
      content += `🏠 ${homeTeam}: ${teamStats.home.form} (${teamStats.home.winRate}% kushinda)\n`;
      content += `✈️ ${awayTeam}: ${teamStats.away.form} (${teamStats.away.winRate}% kushinda)\n\n`;
      
      content += `💡 UBASHIRI:\n`;
      predictions.forEach((pred, index) => {
        // Translate basic prediction types to Swahili
        const translatedPrediction = this.translatePrediction(pred.prediction, 'sw');
        const translatedReasoning = this.translateReasoning(pred.reasoning, 'sw');
        
        content += `${index + 1}. ${translatedPrediction}\n`;
        content += `   📊 Uongozi: ${pred.confidence}%\n`;
        content += `   💰 Nasibu: ${pred.odds_estimate}\n`;
        content += `   ⚠️ Hatari: ${pred.risk_level}\n`;
        content += `   📝 Sababu: ${translatedReasoning}\n\n`;
      });
      
      if (matchAssessment.riskWarning) {
        content += `⚠️ ONYO LA HATARI: ${matchAssessment.riskWarning}\n\n`;
      }
      
      return content;
    }
    
    // Fallback to English
    return `🎯 ${homeTeam} vs ${awayTeam} - ${competition}\n\nBetting analysis with ${matchAssessment.overallConfidence}% confidence.\n\nPredictions and analysis available.`;
  }

  /**
   * 🤖 AI edit betting content - REAL AI INTEGRATION
   */
  private async aiEditBettingContent(content: string, analysis: BettingAnalysis, language: 'en' | 'am' | 'sw'): Promise<string> {
    console.log(`🤖 AI editing betting content for language: ${language}`);
    
    try {
      const openai = await getOpenAIClient();
      if (!openai) {
        console.log('❌ OpenAI client not available, using template-based editing');
        return this.enhanceBettingContent(content, analysis, language);
      }

      const systemPrompts = {
        'en': `You are a professional football betting analyst. Create engaging, informative betting analysis content of exactly 4-6 lines. Include relevant emojis and responsible gambling reminders.`,
        'am': `You are a professional football betting analyst writing in AMHARIC language. You MUST write EVERYTHING in Amharic script - including all content and text. Never use English words. Create engaging betting analysis content of exactly 4-6 lines in Amharic only.`,
        'sw': `You are a professional football betting analyst writing in SWAHILI language. You MUST write EVERYTHING in Swahili - including all content and text. Never use English words. Create engaging betting analysis content of exactly 4-6 lines in Swahili only.`
      };

      // Build comprehensive analysis data for AI
      const analysisData = {
        teams: `${analysis.homeTeam} vs ${analysis.awayTeam}`,
        competition: analysis.competition,
        confidence: analysis.matchAssessment.overallConfidence,
        predictability: analysis.matchAssessment.predictability,
        homeTeamStats: {
          form: analysis.teamStats.home.form,
          winRate: analysis.teamStats.home.winRate,
          goalsFor: analysis.teamStats.home.goalsFor,
          goalsAgainst: analysis.teamStats.home.goalsAgainst,
          homeAdvantage: analysis.teamStats.home.homeAdvantage
        },
        awayTeamStats: {
          form: analysis.teamStats.away.form,
          winRate: analysis.teamStats.away.winRate,
          goalsFor: analysis.teamStats.away.goalsFor,
          goalsAgainst: analysis.teamStats.away.goalsAgainst,
          awayForm: analysis.teamStats.away.awayForm
        },
        headToHead: {
          totalMeetings: analysis.headToHead.totalMeetings,
          homeWins: analysis.headToHead.homeWins,
          awayWins: analysis.headToHead.awayWins,
          draws: analysis.headToHead.draws,
          avgGoals: analysis.headToHead.avgGoals,
          recentTrend: analysis.headToHead.recentTrend
        },
        topPredictions: analysis.predictions.slice(0, 3).map(pred => ({
          prediction: pred.prediction,
          confidence: pred.confidence,
          reasoning: pred.reasoning,
          risk: pred.risk_level
        })),
        riskWarning: analysis.matchAssessment.riskWarning
      };

      const languageInstructions = {
        'en': `Create engaging betting analysis content using this comprehensive data. Write exactly 4-6 lines. Include the confidence percentage, key team stats, and top predictions. Add relevant emojis and responsible gambling reminder:`,
        'am': `ይህን ሰፊ መረጃ በመጠቀም አሳታፊ የውርርድ ትንታኔ ይዘት ፍጠር። በትክክል 4-6 መስመሮች ብቻ ጻፍ። የእምነት መቶኛ፣ ቁልፍ የቡድን ስታቲስቲክስ እና ቀዳሚ ትንበያዎች አካትት። ስሜት ገላጭ ምልክቶች እና የኃላፊነት ውርርድ ማስታወሻ ጨምር። ሁሉም ነገር በአማርኛ ብቻ መሆን አለበት፡`,
        'sw': `Unda maudhui ya uchambuzi wa kamari ya kuvutia kwa kutumia data hii ya kina. Andika mistari 4-6 tu haswa. Jumuisha asilimia ya imani, takwimu muhimu za timu na utabiri wa juu. Ongeza alama za hisia na kikumbusho cha kamari ya uwajibikaji. Kila kitu kiwe kwa Kiswahili tu:`
      };

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { 
            role: "system", 
            content: systemPrompts[language]
          },
          { 
            role: "user", 
            content: `${languageInstructions[language]}\n\nAnalysis Data:\n${JSON.stringify(analysisData, null, 2)}` 
          }
        ],
        max_tokens: language === 'en' ? 400 : 500, // More tokens for other languages
        temperature: 0.7
      });

      const enhancedContent = response.choices[0]?.message?.content?.trim();
      
      if (enhancedContent) {
        console.log(`✅ AI enhanced betting content in ${language}: "${enhancedContent.substring(0, 100)}..."`);
        return enhancedContent;
      }
      
    } catch (error) {
      console.error('❌ Error enhancing betting content with AI:', error);
    }
    
    // Fallback to template-based editing
    return this.enhanceBettingContent(content, analysis, language);
  }

  /**
   * ✨ Enhance betting content with engaging format
   */
  private enhanceBettingContent(content: string, analysis: BettingAnalysis, language: 'en' | 'am' | 'sw'): string {
    if (language === 'en') {
      return `${content}🔥 Don't miss this ${analysis.matchAssessment.predictability.toLowerCase()}-confidence betting opportunity!\n\n💡 Remember: Bet responsibly and only what you can afford to lose!\n\n#BettingTips #Football #${analysis.homeTeam.replace(/\s+/g, '')} #${analysis.awayTeam.replace(/\s+/g, '')}`;
    }
    
    if (language === 'am') {
      return `${content}🔥 ይህን የ${analysis.matchAssessment.predictability.toLowerCase()}-እምነት የውርርድ እድል አታመልጡት!\n\n💡 ያስታውሱ: በኃላፊነት ይዋረዱ እና ማጣት የሚችሉትን ብቻ!\n\n#የውርርድጠቃሚ #እግርኳስ #${analysis.homeTeam.replace(/\s+/g, '')} #${analysis.awayTeam.replace(/\s+/g, '')}`;
    }
    
    if (language === 'sw') {
      return `${content}🔥 Usikose fursa hii ya kamari ya ${analysis.matchAssessment.predictability.toLowerCase()}-uongozi!\n\n💡 Kumbuka: Weka kamari kwa busara na kile unachoweza kupoteza tu!\n\n#KamariTips #Mpira #${analysis.homeTeam.replace(/\s+/g, '')} #${analysis.awayTeam.replace(/\s+/g, '')}`;
    }
    
    return content;
  }

  /**
   * ⚠️ Get responsible gambling disclaimers
   */
  private getDisclaimers(language: 'en' | 'am' | 'sw'): string[] {
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
        '📚 ይህ ትንታኔ ለትምህርት ዓላማ ብቻ ነው',
        '🆘 የውርርድ ችግር? እርዳታ ያግኙ'
      ],
      sw: [
        '⚠️ Umri 18+ pekee - Kamari inaweza kuwa hatari',
        '💰 Usiweke zaidi ya unachoweza kupoteza',
        '📚 Uchambuzi huu ni kwa madhumuni ya kielimu tu',
        '🆘 Matatizo ya kamari? Pata msaada'
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
        'Home Win': 'የቤት ቡድን ያሸንፋል',
        'Away Win': 'የእንግድ ቡድን ያሸንፋል', 
        'Draw': 'እኩል ይበርራል',
        'Both Teams to Score': 'ሁለቱም ቡድኖች ይመዘገባሉ',
        'Over 2.5 Goals': 'ከ2.5 ጎሎች በላይ',
        'Under 2.5 Goals': 'ከ2.5 ጎሎች በታች',
        'First Half Win': 'የመጀመሪያ ግማሽ ጊዜ ያሸንፋል'
      },
      sw: {
        'Home Win': 'Timu ya nyumbani kushinda',
        'Away Win': 'Timu ya nje kushinda',
        'Draw': 'Sare',
        'Both Teams to Score': 'Timu zote mbili kutunga',
        'Over 2.5 Goals': 'Zaidi ya magoli 2.5',
        'Under 2.5 Goals': 'Chini ya magoli 2.5',
        'First Half Win': 'Ushindi wa kipindi cha kwanza'
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
        'Strong home form': 'ጠንካራ የቤት ሁኔታ',
        'Good away record': 'ጥሩ የእንግድ ውጤት',
        'High-scoring teams': 'ጎል የሚሰሩ ቡድኖች',
        'Defensive teams': 'መከላከያ ቡድኖች',
        'Recent form favors': 'የቅርብ ጊዜ ሁኔታ ይደግፋል',
        'Head-to-head record': 'ቀጥታ ውድድር ሪከርድ'
      },
      sw: {
        'Strong home form': 'Uongozi mkuu wa nyumbani',
        'Good away record': 'Rekodi nzuri ya nje',
        'High-scoring teams': 'Timu zenye kutunga mengi',
        'Defensive teams': 'Timu za ulinzi',
        'Recent form favors': 'Hali ya hivi karibuni inapendekeza',
        'Head-to-head record': 'Rekodi ya moja kwa moja'
      }
    };

    let translatedReasoning = reasoning;
    const langPhrases = phrases[language];
    
    for (const [english, translated] of Object.entries(langPhrases)) {
      translatedReasoning = translatedReasoning.replace(english, translated);
    }
    
    return translatedReasoning;
  }
}

// Export singleton instance
export const bettingTipsGenerator = new BettingTipsGenerator();