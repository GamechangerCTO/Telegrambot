/**
 * 🔍 MATCH ANALYSIS GENERATOR
 * 
 * Flow for Match Analysis Content:
 * 1. Get match → 2. Deep statistical analysis → 3. H2H comprehensive analysis → 4. Tactical analysis → 5. Key battles → 6. Predictions → 7. AI edit
 * 
 * Key features:
 * - Comprehensive head-to-head analysis
 * - Deep statistical breakdowns
 * - Tactical analysis and formations
 * - Key player battles and matchups
 * - Historical context and trends
 * - Multi-dimensional match analysis
 */

import { unifiedFootballService } from './unified-football-service';
import { aiImageGenerator } from './ai-image-generator';
import { supabase } from '@/lib/supabase';
import { getOpenAIClient } from '../api-keys';

export interface TeamAnalysisData {
  // Basic info
  name: string;
  form: string;
  position?: number;
  points?: number;
  
  // Statistical analysis
  statistics: {
    // Attack
    goalsFor: number;
    goalsPerGame: number;
    shotsPerGame: number;
    shotsOnTargetPerGame: number;
    conversionRate: number;
    
    // Defense  
    goalsAgainst: number;
    goalsAgainstPerGame: number;
    cleanSheets: number;
    cleanSheetPercentage: number;
    
    // Overall performance
    wins: number;
    draws: number;
    losses: number;
    winPercentage: number;
    pointsPerGame: number;
    goalDifference: number;
    
    // Home/Away splits
    homeRecord: { wins: number; draws: number; losses: number };
    awayRecord: { wins: number; draws: number; losses: number };
    homeGoalsFor: number;
    homeGoalsAgainst: number;
    awayGoalsFor: number;
    awayGoalsAgainst: number;
  };
  
  // Tactical information
  tactics: {
    preferredFormation: string;
    playingStyle: string;
    strengths: string[];
    weaknesses: string[];
    keyPlayers: string[];
  };
  
  // Recent form analysis
  recentForm: {
    lastFiveResults: string;
    lastFiveGoalsFor: number;
    lastFiveGoalsAgainst: number;
    currentStreak: string;
    momentum: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  };
}

export interface HeadToHeadAnalysis {
  // Basic H2H stats
  totalMeetings: number;
  timespan: string;
  
  // Results breakdown
  homeTeamWins: number;
  awayTeamWins: number;
  draws: number;
  homeTeamWinPercentage: number;
  awayTeamWinPercentage: number;
  drawPercentage: number;
  
  // Goals analysis
  totalGoals: number;
  averageGoals: number;
  homeTeamGoals: number;
  awayTeamGoals: number;
  averageHomeTeamGoals: number;
  averageAwayTeamGoals: number;
  
  // Venue analysis
  homeVenueRecord: { wins: number; draws: number; losses: number };
  awayVenueRecord: { wins: number; draws: number; losses: number };
  
  // Patterns and trends
  trends: {
    recentTrend: string; // Last 5 meetings
    goalTrend: string; // High/medium/low scoring
    competitiveTrend: string; // How close matches are
    seasonalPattern: string; // If there are seasonal patterns
  };
  
  // Key meetings
  lastMeeting: {
    date: string;
    result: string;
    score: string;
    venue: string;
    competition: string;
  };
  
  biggestWins: {
    homeTeam: { score: string; date: string; competition: string };
    awayTeam: { score: string; date: string; competition: string };
  };
  
  // Recent meetings (last 10)
  recentMeetings: Array<{
    date: string;
    homeTeam: string;
    awayTeam: string;
    score: string;
    result: string;
    competition: string;
    venue: string;
  }>;
}

export interface MatchFactors {
  // Current context
  competition: {
    name: string;
    importance: 'HIGH' | 'MEDIUM' | 'LOW';
    stageDescription: string;
  };
  
  // Stakes and motivation
  stakes: {
    homeTeamStakes: string[];
    awayTeamStakes: string[];
    overallImportance: string;
  };
  
  // External factors
  external: {
    venue: string;
    weather?: string;
    attendance?: string;
    referee?: string;
    timeOfSeason: string;
  };
  
  // Team news
  teamNews: {
    homeTeamNews: string[];
    awayTeamNews: string[];
    keyAbsentees: string[];
    suspensions: string[];
  };
}

export interface KeyBattles {
  // Tactical battles
  tactical: Array<{
    area: string;
    description: string;
    advantage: 'HOME' | 'AWAY' | 'EVEN';
  }>;
  
  // Individual battles
  individual: Array<{
    homePlayer: string;
    awayPlayer: string;
    battleArea: string;
    description: string;
    advantage: 'HOME' | 'AWAY' | 'EVEN';
  }>;
  
  // System vs System
  systemBattles: Array<{
    homeSystem: string;
    awaySystem: string;
    battleDescription: string;
    keyFactor: string;
  }>;
}

export interface MatchPrediction {
  // Result prediction
  predictedResult: string;
  confidence: number;
  
  // Score prediction
  predictedScore: string;
  scoreConfidence: number;
  
  // Match characteristics
  expectedGoals: number;
  expectedStyle: string; // 'attacking', 'defensive', 'balanced'
  expectedIntensity: 'HIGH' | 'MEDIUM' | 'LOW';
  
  // Key factors for prediction
  predictionFactors: string[];
}

export interface ComprehensiveMatchAnalysis {
  // Basic match info
  homeTeam: string;
  awayTeam: string;
  competition: string;
  venue: string;
  kickoff: string;
  
  // Deep team analysis
  teamAnalysis: {
    home: TeamAnalysisData;
    away: TeamAnalysisData;
  };
  
  // Comprehensive H2H
  headToHead: HeadToHeadAnalysis;
  
  // Match context
  matchFactors: MatchFactors;
  
  // Key battles and matchups
  keyBattles: KeyBattles;
  
  // Prediction and outlook
  prediction: MatchPrediction;
  
  // Analysis summary
  summary: {
    keyPoints: string[];
    mainStoryline: string;
    x_factor: string;
    verdict: string;
  };
}

export interface AnalysisGenerationRequest {
  language: 'en' | 'am' | 'sw';
  channelId: string;
  analysisDepth?: 'basic' | 'detailed' | 'comprehensive';
  focusAreas?: Array<'statistics' | 'tactics' | 'h2h' | 'predictions' | 'players'>;
}

export interface GeneratedAnalysis {
  title: string;
  content: string;
  imageUrl?: string;
  analysis: ComprehensiveMatchAnalysis;
  aiEditedContent?: string;
  metadata: {
    language: string;
    generatedAt: string;
    contentId: string;
    analysisDepth: string;
    wordCount: number;
  };
}

export class MatchAnalysisGenerator {

  /**
   * 🎯 MAIN FUNCTION - Generate comprehensive match analysis
   */
  async generateMatchAnalysis(request: AnalysisGenerationRequest): Promise<GeneratedAnalysis | null> {
    console.log(`🔍 Generating comprehensive match analysis in ${request.language}`);
    
    try {
      // Step 1: Get best match for analysis
      const bestMatch = await this.getBestMatchForAnalysis(request.language);
      if (!bestMatch) {
        console.log(`❌ No suitable match found for analysis`);
        return null;
      }

      console.log(`✅ Selected match: ${bestMatch.homeTeam.name} vs ${bestMatch.awayTeam.name}`);

      // Step 2: Perform comprehensive analysis
      const analysis = await this.performComprehensiveAnalysis(bestMatch);
      
      // Step 3: Generate analysis image
      const imageUrl = await this.generateAnalysisImage(analysis);
      
      // Step 4: Generate content and AI edit
      const { content, aiEditedContent } = await this.generateAnalysisContent(analysis, request);
      
      // Step 5: Mark content as used
      await this.markContentAsUsed(analysis, request.channelId);

      return {
        title: `🔍 MATCH ANALYSIS: ${analysis.homeTeam} vs ${analysis.awayTeam}`,
        content: aiEditedContent || content, // ⭐ שימוש בתוכן המורחב של AI
        imageUrl,
        analysis,
        aiEditedContent,
        metadata: {
          language: request.language,
          generatedAt: new Date().toISOString(),
          contentId: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          analysisDepth: request.analysisDepth || 'comprehensive',
          wordCount: (aiEditedContent || content).split(' ').length // ⭐ ספירת מילים נכונה
        }
      };

    } catch (error) {
      console.error(`❌ Error generating match analysis:`, error);
      return null;
    }
  }

  /**
   * 🏆 Step 1: Get best match for analysis
   */
  private async getBestMatchForAnalysis(language: 'en' | 'am' | 'sw') {
    return await unifiedFootballService.getBestMatchForContent('analysis', language);
  }

  /**
   * 📊 Step 2: Perform comprehensive match analysis
   */
  private async performComprehensiveAnalysis(match: any): Promise<ComprehensiveMatchAnalysis> {
    console.log(`📊 Performing comprehensive analysis for ${match.homeTeam.name} vs ${match.awayTeam.name}`);

    // Get all necessary data in parallel using IDs if available, otherwise fallback to names
    let homeAnalysis, awayAnalysis, detailedInfo;
    
    if (match.homeTeam.id && match.awayTeam.id) {
      console.log(`✅ Using team IDs for analysis: Home ${match.homeTeam.id}, Away ${match.awayTeam.id}`);
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
      console.log(`⚠️ No team IDs available for analysis, falling back to name search`);
      [homeAnalysis, awayAnalysis, detailedInfo] = await Promise.all([
        unifiedFootballService.getTeamAnalysis(match.homeTeam.name),
        unifiedFootballService.getTeamAnalysis(match.awayTeam.name),
        unifiedFootballService.getDetailedMatchInfo(match.homeTeam.name, match.awayTeam.name)
      ]);
    }

    // Build comprehensive analysis
    const teamAnalysis = {
      home: await this.buildTeamAnalysis(match.homeTeam.name, homeAnalysis, true),
      away: await this.buildTeamAnalysis(match.awayTeam.name, awayAnalysis, false)
    };

    const headToHead = await this.buildHeadToHeadAnalysis(
      match.homeTeam.name, 
      match.awayTeam.name, 
      detailedInfo?.headToHead
    );

    const matchFactors = await this.analyzeMatchFactors(match, teamAnalysis);
    const keyBattles = await this.identifyKeyBattles(teamAnalysis, headToHead);
    const prediction = await this.generateMatchPrediction(teamAnalysis, headToHead, matchFactors);
    const summary = await this.generateAnalysisSummary(teamAnalysis, headToHead, keyBattles, prediction);

    return {
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      competition: match.competition.name,
      venue: match.venue || `${match.homeTeam.name} Stadium`,
      kickoff: match.kickoff || new Date().toISOString(),
      teamAnalysis,
      headToHead,
      matchFactors,
      keyBattles,
      prediction,
      summary
    };
  }

  /**
   * 👥 Build detailed team analysis
   */
  private async buildTeamAnalysis(teamName: string, rawData: any, isHome: boolean): Promise<TeamAnalysisData> {
    // Extract statistics from raw data
    const stats = rawData?.statistics || {};
    
    // Calculate derived statistics
    const goalsPerGame = stats.goalsFor ? (stats.goalsFor / Math.max(stats.played || 10, 1)) : 1.5;
    const goalsAgainstPerGame = stats.goalsAgainst ? (stats.goalsAgainst / Math.max(stats.played || 10, 1)) : 1.2;
    const winPercentage = stats.winRate || 50;
    const cleanSheetPercentage = stats.cleanSheets ? (stats.cleanSheets / Math.max(stats.played || 10, 1)) * 100 : 30;

    return {
      name: teamName,
      form: stats.form || 'WWDLL',
      position: stats.position || Math.floor(Math.random() * 20) + 1,
      points: stats.points || Math.floor(Math.random() * 50) + 20,
      
      statistics: {
        // Attack
        goalsFor: stats.goalsFor || 25,
        goalsPerGame: Math.round(goalsPerGame * 10) / 10,
        shotsPerGame: Math.round((goalsPerGame * 5) * 10) / 10,
        shotsOnTargetPerGame: Math.round((goalsPerGame * 2) * 10) / 10,
        conversionRate: Math.round((goalsPerGame / Math.max(goalsPerGame * 5, 1)) * 100),
        
        // Defense
        goalsAgainst: stats.goalsAgainst || 20,
        goalsAgainstPerGame: Math.round(goalsAgainstPerGame * 10) / 10,
        cleanSheets: stats.cleanSheets || 5,
        cleanSheetPercentage: Math.round(cleanSheetPercentage),
        
        // Overall
        wins: stats.wins || 8,
        draws: stats.draws || 4,
        losses: stats.losses || 3,
        winPercentage: Math.round(winPercentage),
        pointsPerGame: Math.round(((stats.wins || 8) * 3 + (stats.draws || 4)) / Math.max(stats.played || 15, 1) * 10) / 10,
        goalDifference: (stats.goalsFor || 25) - (stats.goalsAgainst || 20),
        
        // Home/Away splits
        homeRecord: { wins: 5, draws: 2, losses: 1 },
        awayRecord: { wins: 3, draws: 2, losses: 2 },
        homeGoalsFor: Math.round((stats.goalsFor || 25) * 0.6),
        homeGoalsAgainst: Math.round((stats.goalsAgainst || 20) * 0.4),
        awayGoalsFor: Math.round((stats.goalsFor || 25) * 0.4),
        awayGoalsAgainst: Math.round((stats.goalsAgainst || 20) * 0.6)
      },
      
      tactics: {
        preferredFormation: this.determineFormation(stats),
        playingStyle: this.determinePlayingStyle(stats),
        strengths: this.identifyStrengths(stats, isHome),
        weaknesses: this.identifyWeaknesses(stats, isHome),
        keyPlayers: this.identifyKeyPlayers(teamName)
      },
      
      recentForm: {
        lastFiveResults: stats.form || 'WWDLL',
        lastFiveGoalsFor: Math.floor(goalsPerGame * 5),
        lastFiveGoalsAgainst: Math.floor(goalsAgainstPerGame * 5),
        currentStreak: this.determineStreak(stats.form || 'WWDLL'),
        momentum: this.determineMomentum(stats.form || 'WWDLL')
      }
    };
  }

  /**
   * 🔄 Build comprehensive head-to-head analysis
   */
  private async buildHeadToHeadAnalysis(homeTeam: string, awayTeam: string, h2hData: any): Promise<HeadToHeadAnalysis> {
    console.log(`🔄 Building comprehensive H2H analysis: ${homeTeam} vs ${awayTeam}`);

    if (!h2hData || !h2hData.lastMeetings?.length) {
      return this.buildMockH2HAnalysis(homeTeam, awayTeam);
    }

    const meetings = h2hData.lastMeetings || [];
    const totalMeetings = meetings.length;
    
    // Calculate basic stats
    let homeWins = 0;
    let awayWins = 0;
    let draws = 0;
    let totalGoals = 0;
    let homeGoals = 0;
    let awayGoals = 0;

    const recentMeetings: any[] = [];

    meetings.forEach((match: any, index: number) => {
      const homeScore = match.match_hometeam_score || 0;
      const awayScore = match.match_awayteam_score || 0;
      
      totalGoals += homeScore + awayScore;
      
      // Determine which team is which in this historical match
      const isHomeTeamHome = match.match_hometeam_name?.toLowerCase().includes(homeTeam.toLowerCase());
      
      if (isHomeTeamHome) {
        homeGoals += homeScore;
        awayGoals += awayScore;
        
        if (homeScore > awayScore) homeWins++;
        else if (awayScore > homeScore) awayWins++;
        else draws++;
      } else {
        homeGoals += awayScore;
        awayGoals += homeScore;
        
        if (awayScore > homeScore) homeWins++;
        else if (homeScore > awayScore) awayWins++;
        else draws++;
      }

      // Build recent meetings array
      if (index < 10) {
        recentMeetings.push({
          date: match.match_date || new Date().toISOString(),
          homeTeam: isHomeTeamHome ? match.match_hometeam_name : match.match_awayteam_name,
          awayTeam: isHomeTeamHome ? match.match_awayteam_name : match.match_hometeam_name,
          score: isHomeTeamHome ? `${homeScore}-${awayScore}` : `${awayScore}-${homeScore}`,
          result: homeScore > awayScore ? (isHomeTeamHome ? 'HOME' : 'AWAY') : 
                  awayScore > homeScore ? (isHomeTeamHome ? 'AWAY' : 'HOME') : 'DRAW',
          competition: match.league_name || 'League',
          venue: isHomeTeamHome ? 'Home' : 'Away'
        });
      }
    });

    // Calculate percentages
    const homeWinPercentage = totalMeetings > 0 ? (homeWins / totalMeetings) * 100 : 33;
    const awayWinPercentage = totalMeetings > 0 ? (awayWins / totalMeetings) * 100 : 33;
    const drawPercentage = totalMeetings > 0 ? (draws / totalMeetings) * 100 : 34;

    // Analyze trends
    const recentTrend = this.analyzeRecentTrend(recentMeetings.slice(0, 5));
    const goalTrend = this.analyzeGoalTrend(totalGoals / Math.max(totalMeetings, 1));
    const competitiveTrend = this.analyzeCompetitiveTrend(homeWins, awayWins, draws);

    return {
      totalMeetings,
      timespan: totalMeetings > 0 ? 'Last 10 years' : 'No data',
      
      homeTeamWins: homeWins,
      awayTeamWins: awayWins,
      draws,
      homeTeamWinPercentage: Math.round(homeWinPercentage),
      awayTeamWinPercentage: Math.round(awayWinPercentage),
      drawPercentage: Math.round(drawPercentage),
      
      totalGoals,
      averageGoals: totalMeetings > 0 ? Math.round((totalGoals / totalMeetings) * 10) / 10 : 2.5,
      homeTeamGoals: homeGoals,
      awayTeamGoals: awayGoals,
      averageHomeTeamGoals: totalMeetings > 0 ? Math.round((homeGoals / totalMeetings) * 10) / 10 : 1.3,
      averageAwayTeamGoals: totalMeetings > 0 ? Math.round((awayGoals / totalMeetings) * 10) / 10 : 1.2,
      
      homeVenueRecord: this.calculateVenueRecord(recentMeetings, true),
      awayVenueRecord: this.calculateVenueRecord(recentMeetings, false),
      
      trends: {
        recentTrend,
        goalTrend,
        competitiveTrend,
        seasonalPattern: 'Consistent throughout season'
      },
      
      lastMeeting: recentMeetings[0] || {
        date: 'N/A',
        result: 'No previous meeting',
        score: 'N/A',
        venue: 'N/A',
        competition: 'N/A'
      },
      
      biggestWins: this.findBiggestWins(recentMeetings, homeTeam, awayTeam),
      recentMeetings: recentMeetings.slice(0, 10)
    };
  }

  /**
   * 🎭 Build mock H2H analysis when no data available
   */
  private buildMockH2HAnalysis(homeTeam: string, awayTeam: string): HeadToHeadAnalysis {
    return {
      totalMeetings: 0,
      timespan: 'No historical data',
      homeTeamWins: 0,
      awayTeamWins: 0,
      draws: 0,
      homeTeamWinPercentage: 33,
      awayTeamWinPercentage: 33,
      drawPercentage: 34,
      totalGoals: 0,
      averageGoals: 2.5,
      homeTeamGoals: 0,
      awayTeamGoals: 0,
      averageHomeTeamGoals: 1.3,
      averageAwayTeamGoals: 1.2,
      homeVenueRecord: { wins: 0, draws: 0, losses: 0 },
      awayVenueRecord: { wins: 0, draws: 0, losses: 0 },
      trends: {
        recentTrend: 'First meeting between teams',
        goalTrend: 'Unknown pattern',
        competitiveTrend: 'Unknown competitiveness',
        seasonalPattern: 'No pattern available'
      },
      lastMeeting: {
        date: 'N/A',
        result: 'First meeting',
        score: 'N/A',
        venue: 'N/A',
        competition: 'N/A'
      },
      biggestWins: {
        homeTeam: { score: 'N/A', date: 'N/A', competition: 'N/A' },
        awayTeam: { score: 'N/A', date: 'N/A', competition: 'N/A' }
      },
      recentMeetings: []
    };
  }

  /**
   * 🎪 Analyze match factors and context
   */
  private async analyzeMatchFactors(match: any, teamAnalysis: any): Promise<MatchFactors> {
    return {
      competition: {
        name: match.competition.name,
        importance: this.determineCompetitionImportance(match.competition.name),
        stageDescription: this.getStageDescription(match.competition.name)
      },
      
      stakes: {
        homeTeamStakes: this.determineStakes(teamAnalysis.home, true),
        awayTeamStakes: this.determineStakes(teamAnalysis.away, false),
        overallImportance: 'High-stakes encounter with significant implications'
      },
      
      external: {
        venue: match.venue || `${match.homeTeam.name} Stadium`,
        weather: 'Clear conditions expected',
        attendance: 'Expected to be sold out',
        referee: 'Experienced official assigned',
        timeOfSeason: this.determineTimeOfSeason()
      },
      
      teamNews: {
        homeTeamNews: [
          'Squad nearly at full strength',
          'Manager confident ahead of big match',
          'Home crowd expected to be 12th man'
        ],
        awayTeamNews: [
          'Traveling squad includes all key players',
          'Good recent away form provides confidence',
          'Tactical preparation has been thorough'
        ],
        keyAbsentees: ['Minor injury concerns monitored'],
        suspensions: ['No major suspensions expected']
      }
    };
  }

  /**
   * ⚔️ Identify key battles and matchups
   */
  private async identifyKeyBattles(teamAnalysis: any, headToHead: HeadToHeadAnalysis): Promise<KeyBattles> {
    const { home, away } = teamAnalysis;
    
    return {
      tactical: [
        {
          area: 'Midfield Control',
          description: `${home.name}'s ${home.tactics.preferredFormation} vs ${away.name}'s ${away.tactics.preferredFormation}`,
          advantage: this.determineTacticalAdvantage(home.statistics.winPercentage, away.statistics.winPercentage)
        },
        {
          area: 'Attacking Third',
          description: `Home attack (${home.statistics.goalsPerGame}/game) vs Away defense (${away.statistics.goalsAgainstPerGame}/game)`,
          advantage: home.statistics.goalsPerGame > away.statistics.goalsAgainstPerGame ? 'HOME' : 'AWAY'
        },
        {
          area: 'Defensive Stability',
          description: `Home defense (${home.statistics.goalsAgainstPerGame}/game) vs Away attack (${away.statistics.goalsPerGame}/game)`,
          advantage: home.statistics.goalsAgainstPerGame < away.statistics.goalsPerGame ? 'HOME' : 'AWAY'
        }
      ],
      
      individual: [
        {
          homePlayer: home.tactics.keyPlayers[0] || 'Key Forward',
          awayPlayer: away.tactics.keyPlayers[0] || 'Key Defender',
          battleArea: 'Attack vs Defense',
          description: 'Clinical finishing vs solid defending',
          advantage: home.statistics.goalsPerGame > away.statistics.goalsAgainstPerGame ? 'HOME' : 'AWAY'
        },
        {
          homePlayer: home.tactics.keyPlayers[1] || 'Midfielder',
          awayPlayer: away.tactics.keyPlayers[1] || 'Midfielder',
          battleArea: 'Midfield Duel',
          description: 'Battle for midfield supremacy',
          advantage: 'EVEN'
        }
      ],
      
      systemBattles: [
        {
          homeSystem: `${home.tactics.playingStyle} approach`,
          awaySystem: `${away.tactics.playingStyle} style`,
          battleDescription: 'Contrasting philosophies clash',
          keyFactor: 'Execution under pressure will be decisive'
        }
      ]
    };
  }

  /**
   * 🔮 Generate match prediction
   */
  private async generateMatchPrediction(teamAnalysis: any, headToHead: HeadToHeadAnalysis, matchFactors: MatchFactors): Promise<MatchPrediction> {
    const { home, away } = teamAnalysis;
    
    // Calculate prediction factors
    const homeStrength = home.statistics.winPercentage + home.statistics.goalDifference;
    const awayStrength = away.statistics.winPercentage + away.statistics.goalDifference;
    const h2hFactor = headToHead.homeTeamWinPercentage - headToHead.awayTeamWinPercentage;
    
    // Determine result
    let predictedResult = 'DRAW';
    let confidence = 60;
    
    if (homeStrength + h2hFactor > awayStrength + 10) {
      predictedResult = 'HOME WIN';
      confidence = Math.min(75, 60 + (homeStrength - awayStrength) / 5);
    } else if (awayStrength > homeStrength + h2hFactor + 5) {
      predictedResult = 'AWAY WIN';
      confidence = Math.min(75, 60 + (awayStrength - homeStrength) / 5);
    }
    
    // Predict score
    const homeGoals = Math.max(0, Math.round(home.statistics.goalsPerGame - away.statistics.goalsAgainstPerGame + 0.3)); // Home advantage
    const awayGoals = Math.max(0, Math.round(away.statistics.goalsPerGame - home.statistics.goalsAgainstPerGame));
    const predictedScore = `${homeGoals}-${awayGoals}`;
    
    return {
      predictedResult,
      confidence: Math.round(confidence),
      predictedScore,
      scoreConfidence: Math.round(confidence * 0.8),
      expectedGoals: homeGoals + awayGoals,
      expectedStyle: homeGoals + awayGoals > 2.5 ? 'attacking' : 'defensive',
      expectedIntensity: matchFactors.competition.importance === 'HIGH' ? 'HIGH' : 'MEDIUM',
      predictionFactors: [
        `Home form: ${home.recentForm.currentStreak}`,
        `Away form: ${away.recentForm.currentStreak}`,
        `H2H: ${headToHead.trends.recentTrend}`,
        `Stakes: ${matchFactors.competition.importance} importance`
      ]
    };
  }

  /**
   * 📋 Generate analysis summary
   */
  private async generateAnalysisSummary(teamAnalysis: any, headToHead: HeadToHeadAnalysis, keyBattles: KeyBattles, prediction: MatchPrediction) {
    const { home, away } = teamAnalysis;
    
    return {
      keyPoints: [
        `${home.name} enters with ${home.statistics.winPercentage}% win rate vs ${away.name}'s ${away.statistics.winPercentage}%`,
        `Head-to-head record favors ${headToHead.homeTeamWinPercentage > headToHead.awayTeamWinPercentage ? home.name : away.name} (${Math.max(headToHead.homeTeamWinPercentage, headToHead.awayTeamWinPercentage)}% wins)`,
        `Expected ${prediction.expectedGoals} goals based on statistical analysis`,
        `Key battle: ${keyBattles.tactical[0].area} will be decisive`
      ],
      
      mainStoryline: `${home.name} hosts ${away.name} in what promises to be a ${prediction.expectedIntensity.toLowerCase()}-intensity encounter. ${home.name}'s ${home.tactics.playingStyle} approach will test ${away.name}'s ${away.tactics.playingStyle} style.`,
      
      x_factor: `${home.recentForm.momentum === 'POSITIVE' ? home.name + ' momentum' : away.recentForm.momentum === 'POSITIVE' ? away.name + ' momentum' : 'Match-day form'}`,
      
      verdict: `${prediction.predictedResult} predicted with ${prediction.confidence}% confidence. ${prediction.predictedScore} scoreline expected based on comprehensive analysis.`
    };
  }

  // Helper methods for analysis
  private determineFormation(stats: any): string {
    const formations = ['4-3-3', '4-2-3-1', '3-5-2', '4-4-2', '3-4-3'];
    return formations[Math.floor(Math.random() * formations.length)];
  }

  private determinePlayingStyle(stats: any): string {
    const goalsFor = stats.goalsFor || 25;
    const goalsAgainst = stats.goalsAgainst || 20;
    
    if (goalsFor > 30) return 'Attacking';
    if (goalsAgainst < 15) return 'Defensive';
    return 'Balanced';
  }

  private identifyStrengths(stats: any, isHome: boolean): string[] {
    const strengths = [];
    
    if ((stats.goalsFor || 25) > 30) strengths.push('Clinical finishing');
    if ((stats.goalsAgainst || 20) < 15) strengths.push('Solid defense');
    if ((stats.winRate || 50) > 60) strengths.push('Consistent results');
    if (isHome) strengths.push('Home advantage');
    
    return strengths.length > 0 ? strengths : ['Team cohesion', 'Fighting spirit'];
  }

  private identifyWeaknesses(stats: any, isHome: boolean): string[] {
    const weaknesses = [];
    
    if ((stats.goalsFor || 25) < 20) weaknesses.push('Lack of firepower');
    if ((stats.goalsAgainst || 20) > 30) weaknesses.push('Defensive vulnerabilities');
    if ((stats.winRate || 50) < 40) weaknesses.push('Inconsistent form');
    if (!isHome) weaknesses.push('Away from home');
    
    return weaknesses.length > 0 ? weaknesses : ['Pressure situations', 'Squad depth'];
  }

  private identifyKeyPlayers(teamName: string): string[] {
    // Mock key players - in production, this would come from actual data
    return ['Star Forward', 'Creative Midfielder', 'Defensive Leader'];
  }

  private determineStreak(form: string): string {
    const lastResult = form.charAt(0);
    let streak = 1;
    
    for (let i = 1; i < form.length; i++) {
      if (form.charAt(i) === lastResult) streak++;
      else break;
    }
    
    if (lastResult === 'W') return `${streak} wins`;
    if (lastResult === 'L') return `${streak} losses`;
    return `${streak} draws`;
  }

  private determineMomentum(form: string): 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' {
    const wins = (form.match(/W/g) || []).length;
    const losses = (form.match(/L/g) || []).length;
    
    if (wins > losses + 1) return 'POSITIVE';
    if (losses > wins + 1) return 'NEGATIVE';
    return 'NEUTRAL';
  }

  private analyzeRecentTrend(recentMeetings: any[]): string {
    if (recentMeetings.length === 0) return 'No recent meetings';
    
    const homeWins = recentMeetings.filter(m => m.result === 'HOME').length;
    const awayWins = recentMeetings.filter(m => m.result === 'AWAY').length;
    
    if (homeWins > awayWins) return 'Home team dominant recently';
    if (awayWins > homeWins) return 'Away team has recent edge';
    return 'Evenly matched recently';
  }

  private analyzeGoalTrend(avgGoals: number): string {
    if (avgGoals > 3) return 'High-scoring encounters';
    if (avgGoals < 2) return 'Low-scoring affairs';
    return 'Moderate goal expectation';
  }

  private analyzeCompetitiveTrend(homeWins: number, awayWins: number, draws: number): string {
    if (draws > homeWins + awayWins) return 'Very competitive - many draws';
    if (Math.abs(homeWins - awayWins) <= 1) return 'Highly competitive matchup';
    return 'One-sided historically';
  }

  private calculateVenueRecord(meetings: any[], isHome: boolean): { wins: number; draws: number; losses: number } {
    const venueMatches = meetings.filter(m => isHome ? m.venue === 'Home' : m.venue === 'Away');
    
    return {
      wins: venueMatches.filter(m => m.result === (isHome ? 'HOME' : 'AWAY')).length,
      draws: venueMatches.filter(m => m.result === 'DRAW').length,
      losses: venueMatches.filter(m => m.result === (isHome ? 'AWAY' : 'HOME')).length
    };
  }

  private findBiggestWins(meetings: any[], homeTeam: string, awayTeam: string) {
    // Find biggest wins for each team
    let biggestHomeWin = { score: 'N/A', date: 'N/A', competition: 'N/A' };
    let biggestAwayWin = { score: 'N/A', date: 'N/A', competition: 'N/A' };
    
    let maxHomeDiff = 0;
    let maxAwayDiff = 0;
    
    meetings.forEach(meeting => {
      const [homeScore, awayScore] = meeting.score.split('-').map(Number);
      const homeDiff = homeScore - awayScore;
      const awayDiff = awayScore - homeScore;
      
      if (homeDiff > maxHomeDiff) {
        maxHomeDiff = homeDiff;
        biggestHomeWin = {
          score: meeting.score,
          date: meeting.date,
          competition: meeting.competition
        };
      }
      
      if (awayDiff > maxAwayDiff) {
        maxAwayDiff = awayDiff;
        biggestAwayWin = {
          score: meeting.score,
          date: meeting.date,
          competition: meeting.competition
        };
      }
    });
    
    return { homeTeam: biggestHomeWin, awayTeam: biggestAwayWin };
  }

  private determineCompetitionImportance(competition: string): 'HIGH' | 'MEDIUM' | 'LOW' {
    const highImportance = ['Premier League', 'Champions League', 'Europa League', 'World Cup', 'Euro'];
    if (highImportance.some(comp => competition.includes(comp))) return 'HIGH';
    return 'MEDIUM';
  }

  private getStageDescription(competition: string): string {
    if (competition.includes('Champions League')) return 'European elite competition';
    if (competition.includes('Premier League')) return 'Top-flight domestic league';
    return 'Competitive fixture';
  }

  private determineStakes(teamData: any, isHome: boolean): string[] {
    const stakes = [];
    
    if (teamData.position <= 4) stakes.push('European qualification race');
    if (teamData.position > 15) stakes.push('Relegation battle concerns');
    if (teamData.recentForm.momentum === 'POSITIVE') stakes.push('Maintaining good form');
    if (isHome) stakes.push('Home advantage crucial');
    
    return stakes.length > 0 ? stakes : ['Pride and three points'];
  }

  private determineTimeOfSeason(): string {
    const month = new Date().getMonth();
    if (month >= 8 || month <= 1) return 'Early season - teams finding rhythm';
    if (month >= 2 && month <= 4) return 'Mid-season - form becoming clear';
    return 'Business end - every point crucial';
  }

  private determineTacticalAdvantage(homeWin: number, awayWin: number): 'HOME' | 'AWAY' | 'EVEN' {
    if (homeWin > awayWin + 10) return 'HOME';
    if (awayWin > homeWin + 10) return 'AWAY';
    return 'EVEN';
  }

  /**
   * 🖼️ Generate analysis image - אווירה של קבוצות ללא נתונים
   */
  private async generateAnalysisImage(analysis: ComprehensiveMatchAnalysis): Promise<string | undefined> {
    try {
      // שימוש בפונקציה החדשה שיוצרת אווירה ללא נתונים
      const generatedImage = await aiImageGenerator.generateAdvancedAnalysisImage(
        analysis.homeTeam,
        analysis.awayTeam,
        '', // לא צריך תוכן - האווירה תיוצר לפי שמות הקבוצות
        'en' // שפה לא משפיעה על התמונה
      );
      
      if (!generatedImage) return undefined;

      return generatedImage.url;
    } catch (error) {
      console.error(`❌ Error generating analysis image:`, error);
      return undefined;
    }
  }

  /**
   * 📝 Generate analysis content
   */
  private async generateAnalysisContent(analysis: ComprehensiveMatchAnalysis, request: AnalysisGenerationRequest): Promise<{
    content: string;
    aiEditedContent: string;
  }> {
    const content = this.buildAnalysisContent(analysis, request.language);
    const aiEditedContent = await this.aiEditAnalysisContent(content, analysis, request.language);
    
    return { content, aiEditedContent };
  }

  /**
   * 📄 Build comprehensive analysis content - AI ייצר תוכן מורחב בשפה המתאימה
   */
  private buildAnalysisContent(analysis: ComprehensiveMatchAnalysis, language: 'en' | 'am' | 'sw'): string {
    // ניצור תוכן פשוט ונתן לAI להרחיב אותו
    return this.createBasicAnalysisTemplate(analysis, language);
  }

  /**
   * 📝 Create basic analysis template - שה-AI יוכל להרחיב
   */
  private createBasicAnalysisTemplate(analysis: ComprehensiveMatchAnalysis, language: 'en' | 'am' | 'sw'): string {
    const { homeTeam, awayTeam, teamAnalysis, headToHead, prediction } = analysis;
    
    // תבנית בסיסית שה-AI ירחיב עליה
    const languageTemplates = {
      'en': `${homeTeam} vs ${awayTeam} - ${analysis.competition}\n\nMatch Analysis:\n${homeTeam} (${teamAnalysis.home.statistics.winPercentage}% win rate) faces ${awayTeam} (${teamAnalysis.away.statistics.winPercentage}% win rate). Current forms: ${teamAnalysis.home.form} vs ${teamAnalysis.away.form}. Prediction: ${prediction.predictedResult} (${prediction.confidence}% confidence).`,
      
      'am': `${homeTeam} በተቃወመ ${awayTeam} - ${analysis.competition}\n\nየጨዋታ ትንተና:\n${homeTeam} (${teamAnalysis.home.statistics.winPercentage}% ድል) ${awayTeam} (${teamAnalysis.away.statistics.winPercentage}% ድል) ይገናኛል። የቅርብ ጊዜ ፎርም: ${teamAnalysis.home.form} በተቃወመ ${teamAnalysis.away.form}። ትንበያ: ${prediction.predictedResult} (${prediction.confidence}% እርግጠኝነት)።`,
      
      'sw': `${homeTeam} dhidi ya ${awayTeam} - ${analysis.competition}\n\nUchambuzi wa Mechi:\n${homeTeam} (${teamAnalysis.home.statistics.winPercentage}% ushindi) anakutana na ${awayTeam} (${teamAnalysis.away.statistics.winPercentage}% ushindi). Hali ya sasa: ${teamAnalysis.home.form} dhidi ya ${teamAnalysis.away.form}. Utabiri: ${prediction.predictedResult} (${prediction.confidence}% uhakika).`
    };
    
         return languageTemplates[language] || languageTemplates.en;
  }

  // המשך הקוד הישן לאנגלית...
  private buildEnglishAnalysisContent(analysis: ComprehensiveMatchAnalysis): string {
    const { homeTeam, awayTeam, teamAnalysis, headToHead, keyBattles, prediction, summary } = analysis;
    
    let content = `🔍 COMPREHENSIVE MATCH ANALYSIS\n`;
    content += `${homeTeam} vs ${awayTeam} | ${analysis.competition}\n\n`;
    
    // Team Analysis Section
    content += `📊 TEAM ANALYSIS:\n\n`;
    content += `🏠 ${homeTeam}:\n`;
    content += `• Position: ${teamAnalysis.home.position} (${teamAnalysis.home.points} pts)\n`;
    content += `• Form: ${teamAnalysis.home.form} - ${teamAnalysis.home.recentForm.currentStreak}\n`;
    content += `• Goals: ${teamAnalysis.home.statistics.goalsPerGame}/game | Conceded: ${teamAnalysis.home.statistics.goalsAgainstPerGame}/game\n`;
    content += `• Win Rate: ${teamAnalysis.home.statistics.winPercentage}% | Clean Sheets: ${teamAnalysis.home.statistics.cleanSheetPercentage}%\n`;
    content += `• Style: ${teamAnalysis.home.tactics.playingStyle} (${teamAnalysis.home.tactics.preferredFormation})\n`;
    content += `• Strengths: ${teamAnalysis.home.tactics.strengths.join(', ')}\n\n`;
    
    content += `✈️ ${awayTeam}:\n`;
    content += `• Position: ${teamAnalysis.away.position} (${teamAnalysis.away.points} pts)\n`;
    content += `• Form: ${teamAnalysis.away.form} - ${teamAnalysis.away.recentForm.currentStreak}\n`;
    content += `• Goals: ${teamAnalysis.away.statistics.goalsPerGame}/game | Conceded: ${teamAnalysis.away.statistics.goalsAgainstPerGame}/game\n`;
    content += `• Win Rate: ${teamAnalysis.away.statistics.winPercentage}% | Clean Sheets: ${teamAnalysis.away.statistics.cleanSheetPercentage}%\n`;
    content += `• Style: ${teamAnalysis.away.tactics.playingStyle} (${teamAnalysis.away.tactics.preferredFormation})\n`;
    content += `• Strengths: ${teamAnalysis.away.tactics.strengths.join(', ')}\n\n`;
    
    // Head-to-Head Section
    content += `🔄 HEAD-TO-HEAD ANALYSIS:\n`;
    if (headToHead.totalMeetings > 0) {
      content += `• Total Meetings: ${headToHead.totalMeetings} (${headToHead.timespan})\n`;
      content += `• ${homeTeam} Wins: ${headToHead.homeTeamWins} (${headToHead.homeTeamWinPercentage}%)\n`;
      content += `• ${awayTeam} Wins: ${headToHead.awayTeamWins} (${headToHead.awayTeamWinPercentage}%)\n`;
      content += `• Draws: ${headToHead.draws} (${headToHead.drawPercentage}%)\n`;
      content += `• Average Goals: ${headToHead.averageGoals} per game\n`;
      content += `• Recent Trend: ${headToHead.trends.recentTrend}\n`;
      content += `• Goal Pattern: ${headToHead.trends.goalTrend}\n`;
      content += `• Last Meeting: ${headToHead.lastMeeting.result} (${headToHead.lastMeeting.score})\n\n`;
    } else {
      content += `• ${headToHead.trends.recentTrend}\n`;
      content += `• Expected competitive encounter between well-matched sides\n\n`;
    }
    
    // Key Battles Section
    content += `⚔️ KEY BATTLES:\n`;
    keyBattles.tactical.forEach((battle, index) => {
      content += `${index + 1}. ${battle.area}: ${battle.description}\n`;
      content += `   Advantage: ${battle.advantage === 'HOME' ? homeTeam : battle.advantage === 'AWAY' ? awayTeam : 'Evenly matched'}\n`;
    });
    content += `\n`;
    
    // Individual Battles
    content += `👥 INDIVIDUAL MATCHUPS:\n`;
    keyBattles.individual.forEach(battle => {
      content += `• ${battle.homePlayer} vs ${battle.awayPlayer} (${battle.battleArea})\n`;
    });
    content += `\n`;
    
    // Prediction Section
    content += `🔮 MATCH PREDICTION:\n`;
    content += `• Predicted Result: ${prediction.predictedResult} (${prediction.confidence}% confidence)\n`;
    content += `• Score Prediction: ${prediction.predictedScore} (${prediction.scoreConfidence}% confidence)\n`;
    content += `• Expected Goals: ${prediction.expectedGoals}\n`;
    content += `• Match Style: ${prediction.expectedStyle}\n`;
    content += `• Intensity: ${prediction.expectedIntensity}\n\n`;
    
    // Key Factors
    content += `🎯 KEY PREDICTION FACTORS:\n`;
    prediction.predictionFactors.forEach(factor => {
      content += `• ${factor}\n`;
    });
    content += `\n`;
    
    // Summary
    content += `📋 ANALYSIS SUMMARY:\n`;
    content += `${summary.mainStoryline}\n\n`;
    content += `🔑 Key Points:\n`;
    summary.keyPoints.forEach(point => {
      content += `• ${point}\n`;
    });
    content += `\n`;
    content += `⚡ X-Factor: ${summary.x_factor}\n`;
    content += `🏆 Verdict: ${summary.verdict}\n`;
    
    return content;
  }



  /**
   * 🤖 AI edit analysis content - הרחבת התוכן עם AI
   */
  private async aiEditAnalysisContent(content: string, analysis: ComprehensiveMatchAnalysis, language: 'en' | 'am' | 'sw'): Promise<string> {
    try {
      const openai = await getOpenAIClient();
      if (!openai) {
        console.log('❌ OpenAI client not available for content enhancement');
        return content;
      }

      const languagePrompts = {
        'en': `Expand this football match analysis into a comprehensive, engaging article of 4-6 paragraphs. Include tactical insights, team strengths/weaknesses, key player battles, and detailed predictions. Write in English:`,
        'am': `Expand this football match analysis into a comprehensive, engaging article of 4-6 paragraphs. Include tactical insights, team strengths/weaknesses, key player battles, and detailed predictions. IMPORTANT: Write the entire response in AMHARIC language only. Do not use English words. Use only Amharic script:`,
        'sw': `Expand this football match analysis into a comprehensive, engaging article of 4-6 paragraphs. Include tactical insights, team strengths/weaknesses, key player battles, and detailed predictions. IMPORTANT: Write the entire response in SWAHILI language only:`
      };

      const systemPrompts = {
        'en': `You are a professional football analyst writing detailed match previews. Write engaging, informative content that captures the tactical nuances and storylines of the match. Make it interesting but not too long.`,
        'am': `You are a professional football analyst writing detailed match previews in AMHARIC language. You must write the entire response in Amharic script only. Do not use any English words or phrases. Write engaging, informative content that captures tactical nuances and storylines.`,
        'sw': `You are a professional football analyst writing detailed match previews in SWAHILI language. You must write the entire response in Swahili only. Do not use any English words. Write engaging, informative content that captures tactical nuances and storylines.`
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
            content: `${languagePrompts[language]}\n\n${content}` 
          }
        ],
        max_tokens: 800, // יותר מקום לתוכן מורחב
        temperature: 0.7
      });

      const enhancedContent = response.choices[0]?.message?.content?.trim();
      
      if (enhancedContent) {
        console.log(`✅ AI enhanced content in ${language}`);
        return enhancedContent;
      }
      
    } catch (error) {
      console.error('❌ Error enhancing content with AI:', error);
    }
    
    return content; // fallback לתוכן המקורי
  }

  /**
   * ✅ Mark content as used
   */
  private async markContentAsUsed(analysis: ComprehensiveMatchAnalysis, channelId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('content_uniqueness')
        .insert({
          content_id: `${analysis.homeTeam}_${analysis.awayTeam}_analysis_${Date.now()}`,
          channel_id: channelId,
          content_type: 'analysis',
          used_at: new Date().toISOString(),
          variation_token: `ANALYSIS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });

      if (error) {
        console.error(`❌ Error marking analysis content as used:`, error);
      }
    } catch (error) {
      console.error(`❌ Error in markContentAsUsed:`, error);
    }
  }

  /**
   * 🎯 Get analysis opportunities
   */
  async getAnalysisOpportunities(language: 'en' | 'am' | 'sw' = 'en', limit: number = 3): Promise<ComprehensiveMatchAnalysis[]> {
    const opportunities: ComprehensiveMatchAnalysis[] = [];
    
    try {
      const analysisResults = await unifiedFootballService.getMatchesForContentType('analysis', language, limit);
      
      for (const match of analysisResults.matches.slice(0, limit)) {
        const analysis = await this.performComprehensiveAnalysis(match);
        opportunities.push(analysis);
      }
    } catch (error) {
      console.error(`❌ Error getting analysis opportunities:`, error);
    }
    
    return opportunities;
  }
}

// Export singleton instance
export const matchAnalysisGenerator = new MatchAnalysisGenerator();