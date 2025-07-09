/**
 * 📊 POLLS GENERATOR
 * 
 * Flow for Polls Content:
 * 1. Get match data → 2. Generate intelligent poll questions → 3. Create Telegram poll → 4. Add context content → 5. Track results → 6. Multi-language support
 * 
 * Key features:
 * - Telegram native polls integration
 * - Intelligent question generation based on match data
 * - Multiple poll types (prediction, opinion, trivia)
 * - Result tracking and analytics
 * - Engaging poll content with context
 * - Multi-language poll options
 */

import { unifiedFootballService } from './unified-football-service';
import { aiImageGenerator } from './ai-image-generator';
import { supabase } from '@/lib/supabase';

export type PollType = 
  | 'match_prediction'     // Who will win?
  | 'score_prediction'     // What will be the score?
  | 'goalscorer_prediction' // Who will score first?
  | 'match_events'         // Will there be cards/penalties?
  | 'performance_rating'   // Rate team/player performance
  | 'fan_opinion'         // General opinions about teams
  | 'trivia'              // Football knowledge questions
  | 'comparison'          // Compare two teams/players
  | 'season_predictions'; // Long-term predictions

export interface PollOption {
  text: string;
  voter_count?: number;
  percentage?: number;
  emoji?: string;
}

export interface TelegramPollConfig {
  question: string;
  options: PollOption[];
  is_anonymous: boolean;
  type: 'regular' | 'quiz';
  allows_multiple_answers: boolean;
  correct_option_id?: number; // For quiz polls
  explanation?: string; // For quiz polls
  open_period?: number; // Poll duration in seconds
  close_date?: number; // Unix timestamp when poll closes
}

export interface PollAnalysis {
  homeTeam: string;
  awayTeam: string;
  competition: string;
  matchImportance: 'HIGH' | 'MEDIUM' | 'LOW';
  
  // Statistical basis for poll
  teamComparison: {
    homeWinProbability: number;
    awayWinProbability: number;
    drawProbability: number;
    homeStrengths: string[];
    awayStrengths: string[];
    keyFactors: string[];
  };
  
  // Historical context
  headToHead: {
    recentMeetings: number;
    homeAdvantage: string;
    goalTrends: string;
    competitiveBalance: string;
  };
  
  // Current form
  formAnalysis: {
    homeForm: string;
    awayForm: string;
    momentum: string;
    keyPlayers: { home: string[]; away: string[] };
  };
}

export interface PollContent {
  // Poll configuration for Telegram
  telegramPoll: TelegramPollConfig;
  
  // Contextual content
  introText: string;
  analysisText: string;
  engagementText: string;
  
  // Poll metadata
  pollType: PollType;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  expectedEngagement: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface PollGenerationRequest {
  language: 'en' | 'am' | 'sw';
  channelId: string;
  pollType?: PollType;
  pollDuration?: number; // Duration in minutes
  includeAnalysis?: boolean;
}

export interface GeneratedPoll {
  title: string;
  content: string;
  imageUrl?: string;
  pollContent: PollContent;
  analysis: PollAnalysis;
  aiEditedContent?: string;
  telegramPollPayload: TelegramPollConfig;
  metadata: {
    language: string;
    generatedAt: string;
    contentId: string;
    pollType: string;
    expectedParticipants: number;
  };
}

export class PollsGenerator {

  /**
   * 📊 MAIN FUNCTION - Generate interactive poll content
   */
  async generatePoll(request: PollGenerationRequest): Promise<GeneratedPoll | null> {
    console.log(`📊 Generating ${request.pollType || 'auto'} poll in ${request.language}`);
    
    try {
      // Step 1: Get best match for poll content
      const bestMatch = await this.getBestMatchForPoll(request.language);
      if (!bestMatch) {
        console.log(`❌ No suitable match found for poll`);
        return null;
      }

      console.log(`✅ Selected match: ${bestMatch.homeTeam.name} vs ${bestMatch.awayTeam.name}`);

      // Step 2: Analyze match for poll generation
      const analysis = await this.analyzeMatchForPoll(bestMatch);
      
      // Step 3: Determine poll type if not specified
      const pollType = request.pollType || this.determineBestPollType(analysis);
      
      // Step 4: Generate poll content
      const pollContent = await this.generatePollContent(analysis, pollType, request);
      
      // Step 5: Create Telegram poll configuration
      const telegramPollPayload = this.createTelegramPollPayload(pollContent, request);
      
      // Step 6: Generate contextual content
      const { content, aiEditedContent } = await this.generateContextualContent(pollContent, analysis, request);
      
      // Step 7: Skip image generation for polls (polls are interactive content)
      const imageUrl = undefined;
      
      // Step 8: Track poll creation
      await this.trackPollCreation(analysis, pollType, request.channelId);

      return {
        title: `📊 ${pollContent.telegramPoll.question}`,
        content,
        imageUrl,
        pollContent,
        analysis,
        aiEditedContent,
        telegramPollPayload,
        metadata: {
          language: request.language,
          generatedAt: new Date().toISOString(),
          contentId: `poll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          pollType,
          expectedParticipants: this.estimateParticipants(pollContent.expectedEngagement)
        }
      };

    } catch (error) {
      console.error(`❌ Error generating poll:`, error);
      return null;
    }
  }

  /**
   * 🏆 Step 1: Get best match for poll content - use same algorithm as analysis for quality matches
   */
  private async getBestMatchForPoll(language: 'en' | 'am' | 'sw') {
    console.log(`🎯 Getting matches optimized for analysis content`);
    return await unifiedFootballService.getBestMatchForContent('analysis', language);
  }

  /**
   * 📊 Step 2: Analyze match for poll generation
   */
  private async analyzeMatchForPoll(match: any): Promise<PollAnalysis> {
    console.log(`📊 Analyzing match for poll: ${match.homeTeam.name} vs ${match.awayTeam.name}`);

    // Get team analysis data using IDs if available, otherwise fallback to names
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

    // Calculate team comparison
    const teamComparison = this.calculateTeamComparison(homeAnalysis, awayAnalysis);
    
    // Analyze head-to-head
    const headToHead = this.analyzeHeadToHeadForPoll(detailedInfo?.headToHead);
    
    // Analyze current form
    const formAnalysis = this.analyzeCurrentForm(homeAnalysis, awayAnalysis);

    return {
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      competition: match.competition.name,
      matchImportance: this.determineMatchImportance(match.competition.name),
      teamComparison,
      headToHead,
      formAnalysis
    };
  }

  /**
   * ⚖️ Calculate team comparison for poll context
   */
  private calculateTeamComparison(homeAnalysis: any, awayAnalysis: any) {
    const homeStats = homeAnalysis?.statistics || {};
    const awayStats = awayAnalysis?.statistics || {};
    
    // Calculate win probabilities
    const homeWinRate = homeStats.winRate || 50;
    const awayWinRate = awayStats.winRate || 50;
    const homeAdvantage = 10; // Home field advantage
    
    let homeProb = homeWinRate + homeAdvantage;
    let awayProb = awayWinRate;
    let drawProb = 100 - homeProb - awayProb;
    
    // Normalize to 100%
    const total = homeProb + awayProb + drawProb;
    homeProb = (homeProb / total) * 100;
    awayProb = (awayProb / total) * 100;
    drawProb = (drawProb / total) * 100;

    return {
      homeWinProbability: Math.round(homeProb),
      awayWinProbability: Math.round(awayProb),
      drawProbability: Math.round(drawProb),
      homeStrengths: this.identifyTeamStrengths(homeStats, true),
      awayStrengths: this.identifyTeamStrengths(awayStats, false),
      keyFactors: [
        'Recent form and momentum',
        'Head-to-head record',
        'Home advantage factor',
        'Key player availability'
      ]
    };
  }

  /**
   * 🔄 Analyze head-to-head for poll context
   */
  private analyzeHeadToHeadForPoll(h2hData: any) {
    if (!h2hData || !h2hData.lastMeetings?.length) {
      return {
        recentMeetings: 0,
        homeAdvantage: 'No recent data available',
        goalTrends: 'Unknown pattern',
        competitiveBalance: 'First meeting between teams'
      };
    }

    const meetings = h2hData.lastMeetings.slice(0, 5);
    let homeWins = 0;
    let awayWins = 0;
    let draws = 0;
    let totalGoals = 0;

    meetings.forEach((match: any) => {
      const homeScore = match.match_hometeam_score || 0;
      const awayScore = match.match_awayteam_score || 0;
      totalGoals += homeScore + awayScore;
      
      if (homeScore > awayScore) homeWins++;
      else if (awayScore > homeScore) awayWins++;
      else draws++;
    });

    const avgGoals = totalGoals / meetings.length;

    return {
      recentMeetings: meetings.length,
      homeAdvantage: homeWins > awayWins ? 'Home team historically stronger' : 
                     awayWins > homeWins ? 'Away team has recent edge' : 'Evenly matched',
      goalTrends: avgGoals > 3 ? 'High-scoring encounters' : 
                  avgGoals < 2 ? 'Low-scoring affairs' : 'Moderate goal expectation',
      competitiveBalance: draws >= meetings.length * 0.4 ? 'Very competitive - many draws' : 
                         Math.abs(homeWins - awayWins) <= 1 ? 'Closely matched teams' : 'One team dominates'
    };
  }

  /**
   * 📈 Analyze current form
   */
  private analyzeCurrentForm(homeAnalysis: any, awayAnalysis: any) {
    const homeStats = homeAnalysis?.statistics || {};
    const awayStats = awayAnalysis?.statistics || {};

    return {
      homeForm: homeStats.form || 'WWDLL',
      awayForm: awayStats.form || 'WLWWD',
      momentum: this.determineMomentum(homeStats.form, awayStats.form),
      keyPlayers: {
        home: ['Star Forward', 'Creative Midfielder', 'Defensive Leader'],
        away: ['Goal Machine', 'Playmaker', 'Rock at the Back']
      }
    };
  }

  /**
   * 🎯 Step 3: Determine best poll type for match
   */
  private determineBestPollType(analysis: PollAnalysis): PollType {
    const { teamComparison, matchImportance } = analysis;
    
    // High importance matches get prediction polls
    if (matchImportance === 'HIGH') {
      return Math.random() < 0.6 ? 'match_prediction' : 'score_prediction';
    }
    
    // Very close matches get prediction polls
    const maxProb = Math.max(
      teamComparison.homeWinProbability, 
      teamComparison.awayWinProbability, 
      teamComparison.drawProbability
    );
    
    if (maxProb < 45) { // Very competitive
      return 'match_prediction';
    }
    
    // Otherwise, vary poll types
    const pollTypes: PollType[] = [
      'match_prediction',
      'score_prediction', 
      'goalscorer_prediction',
      'match_events',
      'fan_opinion',
      'comparison'
    ];
    
    return pollTypes[Math.floor(Math.random() * pollTypes.length)];
  }

  /**
   * 📝 Step 4: Generate poll content based on type
   */
  private async generatePollContent(analysis: PollAnalysis, pollType: PollType, request: PollGenerationRequest): Promise<PollContent> {
    switch (pollType) {
      case 'match_prediction':
        return this.generateMatchPredictionPoll(analysis, request.language);
      case 'score_prediction':
        return this.generateScorePredictionPoll(analysis, request.language);
      case 'goalscorer_prediction':
        return this.generateGoalscorerPoll(analysis, request.language);
      case 'match_events':
        return this.generateMatchEventsPoll(analysis, request.language);
      case 'fan_opinion':
        return this.generateFanOpinionPoll(analysis, request.language);
      case 'comparison':
        return this.generateComparisonPoll(analysis, request.language);
      case 'trivia':
        return this.generateTriviaPoll(analysis, request.language);
      default:
        return this.generateMatchPredictionPoll(analysis, request.language);
    }
  }

  /**
   * 🏆 Generate match prediction poll - native content for each language
   */
  private generateMatchPredictionPoll(analysis: PollAnalysis, language: 'en' | 'am' | 'sw'): PollContent {
    const { homeTeam, awayTeam, teamComparison } = analysis;
    
    if (language === 'en') {
      return {
        telegramPoll: {
          question: `Who will win: ${homeTeam} vs ${awayTeam}?`,
          options: [
            { text: `🏠 ${homeTeam} Win`, emoji: '🏠' },
            { text: `🤝 Draw`, emoji: '🤝' },
            { text: `✈️ ${awayTeam} Win`, emoji: '✈️' }
          ],
          is_anonymous: true,
          type: 'regular',
          allows_multiple_answers: false,
          open_period: 3600 // 1 hour
        },
        introText: `🔥 Big match coming up! What's your prediction?`,
        analysisText: `📊 Statistical Analysis:\n• ${homeTeam}: ${teamComparison.homeWinProbability}% win probability\n• Draw: ${teamComparison.drawProbability}% probability\n• ${awayTeam}: ${teamComparison.awayWinProbability}% win probability\n\n${teamComparison.keyFactors.map(factor => `• ${factor}`).join('\n')}`,
        engagementText: `Cast your vote and see what the community thinks! 🗳️`,
        pollType: 'match_prediction',
        difficulty: 'EASY',
        expectedEngagement: 'HIGH'
      };
    }
    
    if (language === 'am') {
      return {
        telegramPoll: {
          question: `ማን ያሸንፋል: ${homeTeam} በተቃወመ ${awayTeam}?`,
          options: [
            { text: `🏠 ${homeTeam} ድል`, emoji: '🏠' },
            { text: `🤝 አቻነት`, emoji: '🤝' },
            { text: `✈️ ${awayTeam} ድል`, emoji: '✈️' }
          ],
          is_anonymous: true,
          type: 'regular',
          allows_multiple_answers: false,
          open_period: 3600
        },
        introText: `🔥 ታላቅ ጨዋታ እየመጣ ነው! የእርስዎ ትንበያ ምንድን ነው?`,
        analysisText: `📊 የስታቲስቲክ ትንተና:\n• ${homeTeam}: ${teamComparison.homeWinProbability}% የማሸነፍ ዕድል\n• አቻነት: ${teamComparison.drawProbability}% ዕድል\n• ${awayTeam}: ${teamComparison.awayWinProbability}% የማሸነፍ ዕድል\n\n${teamComparison.keyFactors.map(factor => `• ${factor}`).join('\n')}`,
        engagementText: `ድምጽዎን ይስጡ እና ማህበረሰቡ ምን እንደሚያስብ ይመልከቱ! 🗳️`,
        pollType: 'match_prediction',
        difficulty: 'EASY',
        expectedEngagement: 'HIGH'
      };
    }
    
    if (language === 'sw') {
      return {
        telegramPoll: {
          question: `Nani atashinda: ${homeTeam} dhidi ya ${awayTeam}?`,
          options: [
            { text: `🏠 ${homeTeam} Washinda`, emoji: '🏠' },
            { text: `🤝 Sare`, emoji: '🤝' },
            { text: `✈️ ${awayTeam} Washinda`, emoji: '✈️' }
          ],
          is_anonymous: true,
          type: 'regular',
          allows_multiple_answers: false,
          open_period: 36000
        },
        introText: `🔥 Mchezo mkuu unakuja! Utabiri wako ni nini?`,
        analysisText: `📊 Uchambuzi wa Takwimu:\n• ${homeTeam}: ${teamComparison.homeWinProbability}% uwezekano wa kushinda\n• Sare: ${teamComparison.drawProbability}% uwezekano\n• ${awayTeam}: ${teamComparison.awayWinProbability}% uwezekano wa kushinda\n\n${teamComparison.keyFactors.map(factor => `• ${factor}`).join('\n')}`,
        engagementText: `Piga kura yako na uone jamii inachofikiria! 🗳️`,
        pollType: 'match_prediction',
        difficulty: 'EASY',
        expectedEngagement: 'HIGH'
      };
    }
    
    // Default fallback (should not reach here)
    return {
      telegramPoll: {
        question: `${homeTeam} vs ${awayTeam} - Who wins?`,
        options: [
          { text: homeTeam },
          { text: 'Draw' },
          { text: awayTeam }
        ],
        is_anonymous: true,
        type: 'regular',
        allows_multiple_answers: false
      },
      introText: `Match prediction poll`,
      analysisText: `Vote for your prediction`,
      engagementText: `Cast your vote!`,
      pollType: 'match_prediction',
      difficulty: 'EASY',
      expectedEngagement: 'HIGH'
    };
  }

  /**
   * ⚽ Generate score prediction poll
   */
  private generateScorePredictionPoll(analysis: PollAnalysis, language: 'en' | 'am' | 'sw'): PollContent {
    const { homeTeam, awayTeam } = analysis;
    
    if (language === 'en') {
      return {
        telegramPoll: {
          question: `What will be the final score: ${homeTeam} vs ${awayTeam}?`,
          options: [
            { text: '1-0 or 2-0 (Low scoring home win)', emoji: '🥅' },
            { text: '0-1 or 0-2 (Low scoring away win)', emoji: '✈️' },
            { text: '2-1 or 3-1 (High scoring home win)', emoji: '🔥' },
            { text: '1-2 or 1-3 (High scoring away win)', emoji: '⚡' },
            { text: '1-1 or 2-2 (Draw)', emoji: '🤝' }
          ],
          is_anonymous: true,
          type: 'regular',
          allows_multiple_answers: false,
          open_period: 3600
        },
        introText: `🎯 Predict the exact score range!`,
        analysisText: `📈 Both teams average:\n• ${homeTeam}: Strong at home\n• ${awayTeam}: Competitive away form\n• Recent meetings: ${analysis.headToHead.goalTrends}`,
        engagementText: `Think you know football? Prove it! 🧠⚽`,
        pollType: 'score_prediction',
        difficulty: 'MEDIUM',
        expectedEngagement: 'HIGH'
      };
    }
    
    return {
      telegramPoll: {
        question: `Score prediction: ${homeTeam} vs ${awayTeam}?`,
        options: [
          { text: 'Home win 1-0' },
          { text: 'Away win 0-1' },
          { text: 'Home win 2-1' },
          { text: 'Away win 1-2' },
          { text: 'Draw 1-1' }
        ],
        is_anonymous: true,
        type: 'regular',
        allows_multiple_answers: false
      },
      introText: `Score prediction poll`,
      analysisText: `Predict the final score`,
      engagementText: `Make your prediction!`,
      pollType: 'score_prediction',
      difficulty: 'MEDIUM',
      expectedEngagement: 'HIGH'
    };
  }

  /**
   * ⚽ Generate goalscorer prediction poll
   */
  private generateGoalscorerPoll(analysis: PollAnalysis, language: 'en' | 'am' | 'sw'): PollContent {
    const { homeTeam, awayTeam, formAnalysis } = analysis;
    
    if (language === 'en') {
      return {
        telegramPoll: {
          question: `Who will score the first goal?`,
          options: [
            { text: `${formAnalysis.keyPlayers.home[0]} (${homeTeam})`, emoji: '🏠' },
            { text: `${formAnalysis.keyPlayers.away[0]} (${awayTeam})`, emoji: '✈️' },
            { text: `Other ${homeTeam} player`, emoji: '🔵' },
            { text: `Other ${awayTeam} player`, emoji: '🔴' },
            { text: `No goals / 0-0 draw`, emoji: '🥅' }
          ],
          is_anonymous: true,
          type: 'regular',
          allows_multiple_answers: false,
          open_period: 3600
        },
        introText: `⚽ Who finds the net first?`,
        analysisText: `🎯 Key Players to Watch:\n• ${homeTeam}: ${formAnalysis.keyPlayers.home.join(', ')}\n• ${awayTeam}: ${formAnalysis.keyPlayers.away.join(', ')}\n\n${analysis.teamComparison.keyFactors[0]}`,
        engagementText: `Back your favorite striker! 🎯⚽`,
        pollType: 'goalscorer_prediction',
        difficulty: 'MEDIUM',
        expectedEngagement: 'MEDIUM'
      };
    }
    
    return {
      telegramPoll: {
        question: `First goalscorer?`,
        options: [
          { text: `${homeTeam} player` },
          { text: `${awayTeam} player` },
          { text: 'No goals' }
        ],
        is_anonymous: true,
        type: 'regular',
        allows_multiple_answers: false
      },
      introText: `Goalscorer prediction`,
      analysisText: `Who scores first?`,
      engagementText: `Make your pick!`,
      pollType: 'goalscorer_prediction',
      difficulty: 'MEDIUM',
      expectedEngagement: 'MEDIUM'
    };
  }

  /**
   * 🟨 Generate match events poll
   */
  private generateMatchEventsPoll(analysis: PollAnalysis, language: 'en' | 'am' | 'sw'): PollContent {
    const { homeTeam, awayTeam } = analysis;
    
    if (language === 'en') {
      return {
        telegramPoll: {
          question: `What will happen in ${homeTeam} vs ${awayTeam}?`,
          options: [
            { text: `🟨 3+ Yellow cards shown`, emoji: '🟨' },
            { text: `🟥 Red card incident`, emoji: '🟥' },
            { text: `🎯 Penalty awarded`, emoji: '🎯' },
            { text: `⚽ Hat-trick scored`, emoji: '⚽' },
            { text: `📺 VAR controversy`, emoji: '📺' },
            { text: `🤝 Clean, fair match`, emoji: '🤝' }
          ],
          is_anonymous: true,
          type: 'regular',
          allows_multiple_answers: true, // Multiple events can happen
          open_period: 3600
        },
        introText: `🎲 Predict the match drama!`,
        analysisText: `🔥 What kind of match will this be?\n• Both teams known for competitive spirit\n• ${analysis.headToHead.competitiveBalance}\n• Referee decisions could be crucial`,
        engagementText: `Multiple answers allowed - predict all the drama! 🎭`,
        pollType: 'match_events',
        difficulty: 'MEDIUM',
        expectedEngagement: 'MEDIUM'
      };
    }
    
    return {
      telegramPoll: {
        question: `Match events prediction?`,
        options: [
          { text: 'Yellow cards' },
          { text: 'Red card' },
          { text: 'Penalty' },
          { text: 'Clean match' }
        ],
        is_anonymous: true,
        type: 'regular',
        allows_multiple_answers: true
      },
      introText: `Events prediction`,
      analysisText: `What will happen?`,
      engagementText: `Select multiple options!`,
      pollType: 'match_events',
      difficulty: 'MEDIUM',
      expectedEngagement: 'MEDIUM'
    };
  }

  /**
   * 💭 Generate fan opinion poll
   */
  private generateFanOpinionPoll(analysis: PollAnalysis, language: 'en' | 'am' | 'sw'): PollContent {
    const { homeTeam, awayTeam } = analysis;
    
    if (language === 'en') {
      const opinions = [
        `Which team has better recent form?`,
        `Who has the stronger squad depth?`,
        `Which team handles pressure better?`,
        `Who has the tactical advantage?`
      ];
      
      const question = opinions[Math.floor(Math.random() * opinions.length)];
      
      return {
        telegramPoll: {
          question,
          options: [
            { text: `${homeTeam} clearly better`, emoji: '🏠' },
            { text: `${homeTeam} slightly better`, emoji: '🔵' },
            { text: `About equal`, emoji: '🤝' },
            { text: `${awayTeam} slightly better`, emoji: '🔴' },
            { text: `${awayTeam} clearly better`, emoji: '✈️' }
          ],
          is_anonymous: true,
          type: 'regular',
          allows_multiple_answers: false,
          open_period: 7200 // 2 hours for opinion polls
        },
        introText: `💭 What's your take?`,
        analysisText: `🤔 Fan Analysis:\n• ${homeTeam}: ${analysis.teamComparison.homeStrengths.join(', ')}\n• ${awayTeam}: ${analysis.teamComparison.awayStrengths.join(', ')}\n\nBut what do YOU think?`,
        engagementText: `Let your voice be heard! Share your football wisdom 🧠`,
        pollType: 'fan_opinion',
        difficulty: 'EASY',
        expectedEngagement: 'MEDIUM'
      };
    }
    
    return {
      telegramPoll: {
        question: `Better team?`,
        options: [
          { text: homeTeam },
          { text: 'Equal' },
          { text: awayTeam }
        ],
        is_anonymous: true,
        type: 'regular',
        allows_multiple_answers: false
      },
      introText: `Fan opinion poll`,
      analysisText: `Share your opinion`,
      engagementText: `Vote now!`,
      pollType: 'fan_opinion',
      difficulty: 'EASY',
      expectedEngagement: 'MEDIUM'
    };
  }

  /**
   * ⚖️ Generate comparison poll
   */
  private generateComparisonPoll(analysis: PollAnalysis, language: 'en' | 'am' | 'sw'): PollContent {
    const { homeTeam, awayTeam, teamComparison } = analysis;
    
    if (language === 'en') {
      const comparisons = [
        { aspect: 'Attack', home: 'Clinical finishing', away: 'Pace and creativity' },
        { aspect: 'Defense', home: 'Solid organization', away: 'Quick recovery' },
        { aspect: 'Midfield', home: 'Control and possession', away: 'Dynamic pressing' }
      ];
      
      const comparison = comparisons[Math.floor(Math.random() * comparisons.length)];
      
      return {
        telegramPoll: {
          question: `${comparison.aspect} comparison: ${homeTeam} vs ${awayTeam}?`,
          options: [
            { text: `${homeTeam} much stronger`, emoji: '🏠' },
            { text: `${homeTeam} slightly better`, emoji: '🔵' },
            { text: `Even match`, emoji: '⚖️' },
            { text: `${awayTeam} slightly better`, emoji: '🔴' },
            { text: `${awayTeam} much stronger`, emoji: '✈️' }
          ],
          is_anonymous: true,
          type: 'regular',
          allows_multiple_answers: false,
          open_period: 5400 // 1.5 hours
        },
        introText: `⚖️ Head-to-head comparison!`,
        analysisText: `🔍 ${comparison.aspect} Analysis:\n• ${homeTeam}: ${comparison.home}\n• ${awayTeam}: ${comparison.away}\n\nStatistical edge: ${teamComparison.homeWinProbability > teamComparison.awayWinProbability ? homeTeam : awayTeam}`,
        engagementText: `Compare and vote! Who has the edge? 🤔`,
        pollType: 'comparison',
        difficulty: 'MEDIUM',
        expectedEngagement: 'MEDIUM'
      };
    }
    
    return {
      telegramPoll: {
        question: `${homeTeam} vs ${awayTeam} comparison?`,
        options: [
          { text: `${homeTeam} better` },
          { text: 'Equal' },
          { text: `${awayTeam} better` }
        ],
        is_anonymous: true,
        type: 'regular',
        allows_multiple_answers: false
      },
      introText: `Team comparison`,
      analysisText: `Compare the teams`,
      engagementText: `Vote for better team!`,
      pollType: 'comparison',
      difficulty: 'MEDIUM',
      expectedEngagement: 'MEDIUM'
    };
  }

  /**
   * 🧠 Generate trivia poll
   */
  private generateTriviaPoll(analysis: PollAnalysis, language: 'en' | 'am' | 'sw'): PollContent {
    const { homeTeam, awayTeam, headToHead } = analysis;
    
    if (language === 'en') {
      const triviaQuestions = [
        {
          question: `How many times have ${homeTeam} and ${awayTeam} met in recent years?`,
          options: ['1-3 times', '4-6 times', '7-10 times', '10+ times'],
          correct: headToHead.recentMeetings > 7 ? 2 : headToHead.recentMeetings > 4 ? 1 : 0
        },
        {
          question: `What's the typical goal pattern in ${homeTeam} vs ${awayTeam}?`,
          options: ['Low scoring (under 2)', 'Moderate (2-3 goals)', 'High scoring (3+ goals)', 'Varies greatly'],
          correct: headToHead.goalTrends.includes('High') ? 2 : headToHead.goalTrends.includes('Low') ? 0 : 1
        }
      ];
      
      const trivia = triviaQuestions[Math.floor(Math.random() * triviaQuestions.length)];
      
      return {
        telegramPoll: {
          question: trivia.question,
          options: trivia.options.map(opt => ({ text: opt })),
          is_anonymous: true,
          type: 'quiz',
          allows_multiple_answers: false,
          correct_option_id: trivia.correct,
          explanation: `Based on recent meetings and statistical analysis.`,
          open_period: 1800 // 30 minutes for trivia
        },
        introText: `🧠 Test your football knowledge!`,
        analysisText: `🎓 Football IQ Challenge:\nThink you know these teams well? Let's see how much you really know about their history and patterns!`,
        engagementText: `Quiz time! Get it right and show your expertise! 🎯`,
        pollType: 'trivia',
        difficulty: 'HARD',
        expectedEngagement: 'MEDIUM'
      };
    }
    
    return {
      telegramPoll: {
        question: `Football trivia question`,
        options: [
          { text: 'Option A' },
          { text: 'Option B' },
          { text: 'Option C' }
        ],
        is_anonymous: true,
        type: 'quiz',
        allows_multiple_answers: false,
        correct_option_id: 1
      },
      introText: `Trivia challenge`,
      analysisText: `Test your knowledge`,
      engagementText: `Answer the question!`,
      pollType: 'trivia',
      difficulty: 'HARD',
      expectedEngagement: 'MEDIUM'
    };
  }

  /**
   * 📱 Step 5: Create Telegram poll payload
   */
  private createTelegramPollPayload(pollContent: PollContent, request: PollGenerationRequest): TelegramPollConfig {
    const payload = { ...pollContent.telegramPoll };
    
    // Set poll duration if specified
    if (request.pollDuration) {
      payload.open_period = request.pollDuration * 60; // Convert minutes to seconds
    }
    
    // Set close date if duration is specified
    if (payload.open_period) {
      payload.close_date = Math.floor(Date.now() / 1000) + payload.open_period;
    }
    
    return payload;
  }

  /**
   * 📝 Step 6: Generate contextual content
   */
  private async generateContextualContent(pollContent: PollContent, analysis: PollAnalysis, request: PollGenerationRequest): Promise<{
    content: string;
    aiEditedContent: string;
  }> {
    const content = this.buildPollContent(pollContent, analysis, request.language);
    const aiEditedContent = await this.aiEditPollContent(content, analysis, request.language);
    
    return { content, aiEditedContent };
  }

  /**
   * 📄 Build poll content - native content for each language
   */
  private buildPollContent(pollContent: PollContent, analysis: PollAnalysis, language: 'en' | 'am' | 'sw'): string {
    const { homeTeam, awayTeam, competition } = analysis;
    
    if (language === 'en') {
      let content = `📊 INTERACTIVE POLL\n\n`;
      content += `${pollContent.introText}\n\n`;
      content += `🏆 ${homeTeam} vs ${awayTeam}\n`;
      content += `📍 ${competition}\n\n`;
      content += `❓ ${pollContent.telegramPoll.question}\n\n`;
      
      if (pollContent.analysisText) {
        content += `${pollContent.analysisText}\n\n`;
      }
      
      content += `${pollContent.engagementText}\n\n`;
      
      // Add poll instructions
      if (pollContent.telegramPoll.allows_multiple_answers) {
        content += `ℹ️ Multiple answers allowed - select all that apply!\n`;
      } else {
        content += `ℹ️ Choose your best answer!\n`;
      }
      
      if (pollContent.telegramPoll.type === 'quiz') {
        content += `🎓 Quiz mode - test your knowledge!\n`;
      }
      
      return content;
    }
    
    if (language === 'am') {
      let content = `📊 የአስተያየት ሰብሳቢ\n\n`;
      content += `${pollContent.introText}\n\n`;
      content += `🏆 ${homeTeam} በተቃወመ ${awayTeam}\n`;
      content += `📍 ${competition}\n\n`;
      content += `❓ ${pollContent.telegramPoll.question}\n\n`;
      
      if (pollContent.analysisText) {
        content += `${pollContent.analysisText}\n\n`;
      }
      
      content += `${pollContent.engagementText}\n\n`;
      
      // Add poll instructions in Amharic
      if (pollContent.telegramPoll.allows_multiple_answers) {
        content += `ℹ️ ብዙ መልሶች ይፈቀዳሉ - ሁሉንም የሚያስፈልጉዎት ይምረጡ!\n`;
      } else {
        content += `ℹ️ ምርጥ መልስዎን ይምረጡ!\n`;
      }
      
      if (pollContent.telegramPoll.type === 'quiz') {
        content += `🎓 የፈተና ሁነታ - እውቀትዎን ይሞክሩ!\n`;
      }
      
      return content;
    }
    
    if (language === 'sw') {
      let content = `📊 UCHAGUZI WA MAONI\n\n`;
      content += `${pollContent.introText}\n\n`;
      content += `🏆 ${homeTeam} dhidi ya ${awayTeam}\n`;
      content += `📍 ${competition}\n\n`;
      content += `❓ ${pollContent.telegramPoll.question}\n\n`;
      
      if (pollContent.analysisText) {
        content += `${pollContent.analysisText}\n\n`;
      }
      
      content += `${pollContent.engagementText}\n\n`;
      
      // Add poll instructions in Swahili
      if (pollContent.telegramPoll.allows_multiple_answers) {
        content += `ℹ️ Majibu mengi yanaruhusiwa - chagua yote yanayohitajika!\n`;
      } else {
        content += `ℹ️ Chagua jibu lako bora!\n`;
      }
      
      if (pollContent.telegramPoll.type === 'quiz') {
        content += `🎓 Mfumo wa jaribio - jaribu ujuzi wako!\n`;
      }
      
      return content;
    }
    
    // Fallback
    return `📊 ${pollContent.telegramPoll.question}\n\n${pollContent.introText}\n\n${pollContent.engagementText}`;
  }

  /**
   * 🤖 AI edit poll content
   */
  private async aiEditPollContent(content: string, analysis: PollAnalysis, language: 'en' | 'am' | 'sw'): Promise<string> {
    const languageHashtags = {
      'en': `#PollTime #Football #MatchPrediction #${analysis.homeTeam.replace(/\s+/g, '')}vs${analysis.awayTeam.replace(/\s+/g, '')}`,
      'am': `#የሕዝብፈተናጊዜ #እግርኳስ #PollTime #Football #MatchPrediction`,
      'sw': `#WakatiUliza #MpiraMiguu #PollTime #Football #MatchPrediction`
    };
    
    const engagementText = {
      'en': '🔥 Join the discussion! Your vote counts!',
      'am': '🔥 ወደ ውይይቱ ይቀላቀሉ! የእርስዎ ድምጽ ይቆጠራል!',
      'sw': '🔥 Jiunge na mjadala! Kura yako inahesabika!'
    };
    
    const enhanced = `${content}\n\n${engagementText[language]}\n\n${languageHashtags[language]}`;
    
    return enhanced;
  }

  /**
   * 🖼️ Generate poll image
   */
  private async generatePollImage(analysis: PollAnalysis, pollType: PollType): Promise<string | undefined> {
    const { homeTeam, awayTeam, competition } = analysis;
    
    const prompt = `Interactive football poll illustration: ${homeTeam} vs ${awayTeam} in ${competition}.
    Poll-style design with voting elements, team comparison graphics, vs layout, 
    engaging poll aesthetic, social media poll design, interactive elements,
    team colors, modern poll interface design, high quality digital art.`;

    try {
      const generatedImage = await aiImageGenerator.generateImage({
        prompt,
        quality: 'medium'
      });
      
      if (!generatedImage) return undefined;

      return generatedImage.url;
    } catch (error) {
      console.error(`❌ Error generating poll image:`, error);
      return undefined;
    }
  }

  /**
   * 📊 Track poll creation
   */
  private async trackPollCreation(analysis: PollAnalysis, pollType: PollType, channelId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('content_uniqueness')
        .insert({
          content_id: `${analysis.homeTeam}_${analysis.awayTeam}_poll_${pollType}_${Date.now()}`,
          channel_id: channelId,
          content_type: 'poll',
          used_at: new Date().toISOString(),
          variation_token: `POLL_${pollType.toUpperCase()}_${Date.now()}`
        });

      if (error) {
        console.error(`❌ Error tracking poll creation:`, {
          error_code: error.code,
          error_message: error.message,
          error_details: error.details,
          error_hint: error.hint,
          poll_type: pollType,
          channel_id: channelId,
          teams: `${analysis.homeTeam} vs ${analysis.awayTeam}`
        });
      } else {
        console.log(`✅ Poll tracking saved successfully for ${analysis.homeTeam} vs ${analysis.awayTeam}`);
      }
    } catch (error) {
      console.error(`❌ Error in trackPollCreation:`, {
        error: error instanceof Error ? error.message : String(error),
        poll_type: pollType,
        channel_id: channelId,
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  // Helper methods
  private determineMatchImportance(competition: string): 'HIGH' | 'MEDIUM' | 'LOW' {
    const highImportance = ['Premier League', 'Champions League', 'Europa League', 'World Cup'];
    return highImportance.some(comp => competition.includes(comp)) ? 'HIGH' : 'MEDIUM';
  }

  private identifyTeamStrengths(stats: any, isHome: boolean): string[] {
    const strengths = [];
    
    if ((stats.goalsFor || 25) > 30) strengths.push('Strong attack');
    if ((stats.goalsAgainst || 20) < 15) strengths.push('Solid defense');
    if ((stats.winRate || 50) > 60) strengths.push('Consistent results');
    if (isHome) strengths.push('Home advantage');
    
    return strengths.length > 0 ? strengths : ['Team spirit', 'Tactical discipline'];
  }

  private determineMomentum(homeForm: string, awayForm: string): string {
    const homeWins = (homeForm.match(/W/g) || []).length;
    const awayWins = (awayForm.match(/W/g) || []).length;
    
    if (homeWins > awayWins + 1) return 'Home team has momentum';
    if (awayWins > homeWins + 1) return 'Away team has momentum';
    return 'Both teams in similar form';
  }

  private estimateParticipants(engagement: string): number {
    switch (engagement) {
      case 'HIGH': return Math.floor(Math.random() * 500) + 200; // 200-700
      case 'MEDIUM': return Math.floor(Math.random() * 200) + 50; // 50-250
      default: return Math.floor(Math.random() * 50) + 20; // 20-70
    }
  }

  /**
   * 🎯 Get multiple poll options
   */
  async getPollOpportunities(language: 'en' | 'am' | 'sw' = 'en', limit: number = 3): Promise<GeneratedPoll[]> {
    const polls: GeneratedPoll[] = [];
    
    try {
      const pollTypes: PollType[] = ['match_prediction', 'score_prediction', 'fan_opinion'];
      
      for (let i = 0; i < limit; i++) {
        const poll = await this.generatePoll({
          language,
          channelId: `demo_channel_${i}`,
          pollType: pollTypes[i % pollTypes.length],
          includeAnalysis: true
        });
        
        if (poll) {
          polls.push(poll);
        }
      }
    } catch (error) {
      console.error(`❌ Error getting poll opportunities:`, error);
    }
    
    return polls;
  }

  /**
   * 📈 Get poll statistics
   */
  async getPollStats(): Promise<{
    totalPolls: number;
    averageParticipants: number;
    mostPopularType: string;
    engagementRate: number;
  }> {
    // This would connect to database for actual stats
    return {
      totalPolls: 0,
      averageParticipants: 0,
      mostPopularType: 'match_prediction',
      engagementRate: 0
    };
  }

  /**
   * 📱 Create Telegram sendPoll API payload
   */
  createTelegramSendPollPayload(generatedPoll: GeneratedPoll, chatId: string): {
    method: string;
    chat_id: string;
    question: string;
    options: string[];
    is_anonymous?: boolean;
    type?: string;
    allows_multiple_answers?: boolean;
    correct_option_id?: number;
    explanation?: string;
    open_period?: number;
    close_date?: number;
  } {
    const poll = generatedPoll.telegramPollPayload;
    
    return {
      method: 'sendPoll',
      chat_id: chatId,
      question: poll.question,
      options: poll.options.map(option => option.text),
      is_anonymous: poll.is_anonymous,
      type: poll.type,
      allows_multiple_answers: poll.allows_multiple_answers,
      correct_option_id: poll.correct_option_id,
      explanation: poll.explanation,
      open_period: poll.open_period,
      close_date: poll.close_date
    };
  }
}

// Export singleton instance
export const pollsGenerator = new PollsGenerator();