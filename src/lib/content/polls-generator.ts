/**
 * 📊 ENHANCED POLLS GENERATOR
 * 
 * Flow for Polls Content:
 * 1. Get match data → 2. Generate intelligent poll questions → 3. Create Telegram poll → 4. Add context content → 5. Track results → 6. Multi-language support
 * 
 * Key features:
 * - Telegram native polls integration
 * - Intelligent question generation based on match data
 * - Multiple poll types (prediction, opinion, trivia, interactive)
 * - Result tracking and analytics
 * - Engaging poll content with context
 * - Multi-language poll options
 * - Enhanced creativity and interactivity
 */

import { unifiedFootballService } from './unified-football-service';
import { aiImageGenerator } from './ai-image-generator';
import { supabase } from '@/lib/supabase';
import { getOpenAIClient } from '../api-keys';

export type PollType = 
  | 'match_prediction'     // Who will win?
  | 'score_prediction'     // What will be the score?
  | 'goalscorer_prediction' // Who will score first?
  | 'match_events'         // Will there be cards/penalties?
  | 'performance_rating'   // Rate team/player performance
  | 'fan_opinion'         // General opinions about teams
  | 'trivia'              // Football knowledge questions
  | 'comparison'          // Compare two teams/players
  | 'season_predictions'  // Long-term predictions
  | 'tactical_analysis'   // Tactical questions
  | 'player_spotlight'    // Player-focused polls
  | 'historical_trivia'   // Historical team facts
  | 'momentum_check'      // Current form analysis
  | 'surprise_factor'     // Upset potential
  | 'emotional_investment' // Fan emotional connection
  | 'what_if_scenarios';   // Hypothetical situations

export interface PollOption {
  text: string;
  voter_count?: number;
  percentage?: number;
  emoji?: string;
  explanation?: string; // For educational polls
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

export interface EnhancedPollAnalysis {
  homeTeam: string;
  awayTeam: string;
  competition: string;
  matchImportance: 'HIGH' | 'MEDIUM' | 'LOW';
  
  // Enhanced statistical basis for poll
  teamComparison: {
    homeWinProbability: number;
    awayWinProbability: number;
    drawProbability: number;
    homeStrengths: string[];
    awayStrengths: string[];
    keyFactors: string[];
    surpriseFactor: number; // 0-100, how likely is an upset
    tacticalEdge: 'HOME' | 'AWAY' | 'NEUTRAL';
  };
  
  // Enhanced historical context
  headToHead: {
    recentMeetings: number;
    homeAdvantage: string;
    goalTrends: string;
    competitiveBalance: string;
    memorableMoments: string[];
    lastMeetingScore: string;
    biggestWin: { team: string; score: string };
  };
  
  // Enhanced current form
  formAnalysis: {
    homeForm: string;
    awayForm: string;
    momentum: string;
    keyPlayers: { 
      home: Array<{ name: string; role: string; form: string }>;
      away: Array<{ name: string; role: string; form: string }>;
    };
    injuries: { home: string[]; away: string[] };
    suspensions: { home: string[]; away: string[] };
  };
  
  // Match context factors
  contextFactors: {
    venue: string;
    weather: string;
    crowdFactor: number; // 0-100
    refereeInfluence: 'HIGH' | 'MEDIUM' | 'LOW';
    mediaAttention: 'HIGH' | 'MEDIUM' | 'LOW';
    stakes: string[];
  };
  
  // Emotional and narrative elements
  narrativeElements: {
    mainStoryline: string;
    subPlots: string[];
    rivalryLevel: 'INTENSE' | 'MODERATE' | 'MILD' | 'NONE';
    fanExpectations: { home: string; away: string };
    pressurePoints: string[];
  };
}

export interface EnhancedPollContent {
  // Poll configuration for Telegram
  telegramPoll: TelegramPollConfig;
  
  // Contextual content
  introText: string;
  analysisText: string;
  engagementText: string;
  funFact?: string; // Optional fun fact to increase engagement
  
  // Poll metadata
  pollType: PollType;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  expectedEngagement: 'HIGH' | 'MEDIUM' | 'LOW';
  educationalValue: 'HIGH' | 'MEDIUM' | 'LOW';
  viralPotential: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface PollGenerationRequest {
  language: 'en' | 'am' | 'sw';
  channelId: string;
  pollType?: PollType;
  pollDuration?: number; // Duration in minutes
  includeAnalysis?: boolean;
  targetAudience?: 'casual' | 'hardcore' | 'mixed';
  creativityLevel?: 'standard' | 'high' | 'maximum';
}

export interface GeneratedPoll {
  title: string;
  content: string;
  imageUrl?: string;
  pollContent: EnhancedPollContent;
  analysis: EnhancedPollAnalysis;
  aiEditedContent?: string;
  telegramPollPayload: TelegramPollConfig;
  metadata: {
    language: string;
    generatedAt: string;
    contentId: string;
    pollType: string;
    expectedParticipants: number;
    engagementScore: number; // 0-100 predicted engagement
    educationalScore: number; // 0-100 educational value
    telegramEnhancements?: {
      protectContent?: boolean;
      enableShareButton?: boolean;
      enableWebApp?: boolean;
      priority?: string;
      spoilerImage?: boolean;
      disablePreview?: boolean;
      isAnonymous?: boolean;
      openPeriod?: number;
      pollType?: string;
    };
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
        console.log(`📊 No suitable match found for poll, generating non-match poll instead`);
        return await this.generateNonMatchPoll(request);
      }

      console.log(`✅ Selected match: ${bestMatch.homeTeam.name} vs ${bestMatch.awayTeam.name}`);

      // Step 2: Perform enhanced analysis for poll generation
      const analysis = await this.performEnhancedAnalysisForPoll(bestMatch);
      
      // Step 3: Determine poll type intelligently
      const pollType = request.pollType || this.determineOptimalPollType(analysis, request);
      
      // Step 4: Generate enhanced poll content
      const pollContent = await this.generateEnhancedPollContent(analysis, pollType, request);
      
      // Step 5: Create Telegram poll configuration
      const telegramPollPayload = this.createTelegramPollPayload(pollContent, request);
      
      // Step 6: Generate contextual content with AI enhancement
      const { content, aiEditedContent } = await this.generateContextualContent(pollContent, analysis, request);
      
      // Step 7: Polls don't need images - skip image generation to save API calls
      const imageUrl = undefined; // No image generation for polls
      
      // Step 8: Track poll creation
      await this.trackPollCreation(analysis, pollType, request.channelId);

      // Step 9: Calculate engagement scores
      const engagementScore = this.calculateEngagementScore(pollContent, analysis);
      const educationalScore = this.calculateEducationalScore(pollContent);

      return {
        title: `📊 ${pollContent.telegramPoll.question}`,
        content: aiEditedContent || content,
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
          expectedParticipants: this.estimateParticipants(pollContent.expectedEngagement, analysis.matchImportance),
          engagementScore,
          educationalScore,
          // 📊 Enhanced Telegram Features for Polls
          telegramEnhancements: {
            protectContent: false,  // Polls need to be shareable for virality
            enableShareButton: true,  // 📤 Share polls for community engagement
            enableWebApp: engagementScore >= 85,  // 🌐 Web app for high-engagement polls
            priority: engagementScore >= 80 ? 'high' : 'normal',
            spoilerImage: false,  // No spoiler for polls
            disablePreview: true,  // No link preview needed for polls
            isAnonymous: pollContent.telegramPoll.is_anonymous !== false,  // Default anonymous
            openPeriod: pollContent.telegramPoll.open_period || 3600,  // 1 hour default
            pollType: pollContent.telegramPoll.type || 'regular'
          }
        }
      };

    } catch (error) {
      console.error(`❌ Error generating poll:`, error);
      return null;
    }
  }

  /**
   * 🏆 Step 1: Get best match for poll content - from daily important matches
   */
  private async getBestMatchForPoll(language: 'en' | 'am' | 'sw') {
    console.log(`🎯 Getting daily important match for poll content`);
    
    try {
      // First try to get match from daily important matches table
      const dailyMatch = await this.getDailyImportantMatch();
      if (dailyMatch) {
        console.log(`✅ Using daily important match: ${dailyMatch.home_team} vs ${dailyMatch.away_team}`);
        return this.convertDailyMatchToUnifiedFormat(dailyMatch);
      }

      // Fallback to unified service if no daily matches available
      console.log(`⚠️ No daily matches found, trying unified service...`);
      const unifiedMatch = await unifiedFootballService.getBestMatchForContent('analysis', language);
      
      if (unifiedMatch) {
        console.log(`✅ Using unified service match: ${unifiedMatch.homeTeam.name} vs ${unifiedMatch.awayTeam.name}`);
        return unifiedMatch;
      }

      // If no matches available, return null - we'll handle this with non-match polls
      console.log(`📊 No matches available - will generate non-match poll instead`);
      return null;
      
    } catch (error) {
      console.error('❌ Error getting matches, using non-match polls:', error);
      return null;
    }
  }

  /**
   * 🎪 Generate engaging polls for days without matches
   */
  private async generateNonMatchPoll(request: PollGenerationRequest): Promise<GeneratedPoll | null> {
    console.log(`🎪 Generating non-match poll for ${request.language} - No matches available today`);
    
    try {
      // Choose from various non-match poll types
      const nonMatchPollTypes = [
        'general_football_opinion',
        'historical_moments',
        'player_rankings', 
        'league_predictions',
        'football_trivia',
        'team_comparisons',
        'football_culture',
        'weekend_preview'
      ];
      
      const pollType = nonMatchPollTypes[Math.floor(Math.random() * nonMatchPollTypes.length)];
      console.log(`🎯 Selected non-match poll type: ${pollType}`);
      
      // Generate poll content based on type
      const pollContent = await this.generateNonMatchPollContent(pollType, request.language);
      
      // Create Telegram poll configuration
      const telegramPollPayload = {
        question: pollContent.question,
        options: pollContent.options,
        is_anonymous: true,
        type: 'regular' as const,
        allows_multiple_answers: pollContent.allowsMultiple || false,
        open_period: 43200 // 12 hours for non-match polls
      };
      
      // Generate AI-enhanced content
      const content = this.buildNonMatchPollContent(pollContent, request.language);
      const aiEditedContent = await this.aiEditNonMatchPollContent(content, pollContent, request.language);
      
      // Calculate engagement scores
      const engagementScore = this.calculateNonMatchEngagementScore(pollType);
      const educationalScore = this.calculateNonMatchEducationalScore(pollType);
      
      return {
        title: `📊 ${pollContent.title}`,
        content: aiEditedContent || content,
        imageUrl: undefined, // No image for polls
        pollContent: {
          telegramPoll: telegramPollPayload,
          introText: pollContent.introText,
          analysisText: pollContent.analysisText,
          engagementText: pollContent.engagementText,
          funFact: pollContent.funFact,
          pollType: 'fan_opinion' as PollType,
          difficulty: pollContent.difficulty,
          expectedEngagement: pollContent.expectedEngagement,
          educationalValue: pollContent.educationalValue,
          viralPotential: pollContent.viralPotential
        },
        analysis: this.createMockAnalysisForNonMatch(pollContent, request.language),
        aiEditedContent,
        telegramPollPayload,
        metadata: {
          language: request.language,
          generatedAt: new Date().toISOString(),
          contentId: `nonmatch_poll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          pollType,
          expectedParticipants: this.estimateNonMatchParticipants(pollContent.expectedEngagement),
          engagementScore,
          educationalScore
        }
      };
      
    } catch (error) {
      console.error(`❌ Error generating non-match poll:`, error);
      return null;
    }
  }

  /**
   * 🎨 Generate content for different non-match poll types
   */
  private async generateNonMatchPollContent(pollType: string, language: 'en' | 'am' | 'sw'): Promise<any> {
    switch (pollType) {
      case 'general_football_opinion':
        return this.generateGeneralFootballOpinionPoll(language);
      case 'historical_moments':
        return this.generateHistoricalMomentsPoll(language);
      case 'player_rankings':
        return this.generatePlayerRankingsPoll(language);
      case 'league_predictions':
        return this.generateLeaguePredictionsPoll(language);
      case 'football_trivia':
        return this.generateFootballTriviaPoll(language);
      case 'team_comparisons':
        return this.generateTeamComparisonsPoll(language);
      case 'football_culture':
        return this.generateFootballCulturePoll(language);
      case 'weekend_preview':
        return this.generateWeekendPreviewPoll(language);
      default:
        return this.generateGeneralFootballOpinionPoll(language);
    }
  }

  /**
   * 💭 Generate general football opinion polls
   */
  private generateGeneralFootballOpinionPoll(language: 'en' | 'am' | 'sw'): any {
    if (language === 'en') {
      const questions = [
        {
          title: "Football Philosophy Debate",
          question: "🤔 What makes football truly beautiful?",
          options: [
            { text: "⚡ Lightning-fast attacking play" },
            { text: "🧠 Tactical masterclasses" },
            { text: "💪 Passion and fighting spirit" },
            { text: "🎯 Individual moments of genius" },
            { text: "🤝 Perfect team chemistry" }
          ],
          introText: "🤔 Time for some football philosophy!",
          analysisText: "Football fans are divided on what makes the beautiful game truly special. Some love attacking football, others appreciate tactical nuance, and many value the human drama.",
          engagementText: "What captures your heart about football? Share your philosophy! ⚽💭",
          funFact: "Did you know that 'The Beautiful Game' was popularized by Pelé?",
          difficulty: 'EASY' as const,
          expectedEngagement: 'HIGH' as const,
          educationalValue: 'MEDIUM' as const,
          viralPotential: 'HIGH' as const
        },
        {
          title: "Dream Football Scenario",
          question: "🌟 Pick your ultimate football weekend:",
          options: [
            { text: "🏟️ Attend El Clásico live" },
            { text: "⚽ Play 5-a-side with friends" },
            { text: "📺 Watch Premier League marathon" },
            { text: "🎮 FIFA tournament all day" },
            { text: "🏆 Local team winning big match" }
          ],
          introText: "🌟 Dream football weekend time!",
          analysisText: "Every football fan has different dreams - some want the biggest stages, others prefer intimate local moments, and many just want good football with good people.",
          engagementText: "What's your perfect football weekend? Dream big! 🏆",
          funFact: "El Clásico has been called 'the most watched annual sporting event worldwide'",
          difficulty: 'EASY' as const,
          expectedEngagement: 'HIGH' as const,
          educationalValue: 'LOW' as const,
          viralPotential: 'HIGH' as const
        }
      ];
      
      return questions[Math.floor(Math.random() * questions.length)];
    }
    
    if (language === 'am') {
      const questions = [
        {
          title: "የእግር ኳስ ፍልስፍና",
          question: "🤔 እግር ኳስን ልዩ የሚያደርገው ምንድን ነው?",
          options: [
            { text: "⚡ ፈጣን የጥቃት ጨዋታ" },
            { text: "🧠 ስልቶ እና እቅድ" },
            { text: "💪 ፍቅር እና መታገል" },
            { text: "🎯 የግለሰብ ችሎታ" },
            { text: "🤝 የቡድን አብሮነት" }
          ],
          introText: "🤔 የእግር ኳስ ፍልስፍና ጊዜ!",
          analysisText: "የእግር ኳስ ወዳጆች በሚያሳዩ ስሜት ይለያያሉ። አንዳንዶች ፈጣን ጨዋታን ይወዳሉ፣ ሌሎች ስልት ያደንቃሉ፣ ብዙዎች ደግሞ የሰው ልጅ ታሪክ ያስኬዳሉ።",
          engagementText: "እግር ኳስ ልብዎን የሚመታው ምንድን ነው? ፍልስፍናዎን ያካፍሉ! ⚽💭",
          funFact: "ያውቃሉ ወይ? 'ውብ ጨዋታ' የሚለው ቃል በፔሌ ዝነኛ ሆነ",
          difficulty: 'EASY' as const,
          expectedEngagement: 'HIGH' as const,
          educationalValue: 'MEDIUM' as const,
          viralPotential: 'HIGH' as const
        }
      ];
      
      return questions[Math.floor(Math.random() * questions.length)];
    }
    
    if (language === 'sw') {
      const questions = [
        {
          title: "Falsafa ya Mpira wa Miguu",
          question: "🤔 Ni nini kinachofanya mpira wa miguu kuwa wa kipekee?",
          options: [
            { text: "⚡ Mchezo wa haraka wa mashambulizi" },
            { text: "🧠 Mikakati na mipango" },
            { text: "💪 Shauku na mapigano" },
            { text: "🎯 Uongozi wa kibinafsi" },
            { text: "🤝 Umoja wa timu" }
          ],
          introText: "🤔 Wakati wa falsafa ya mpira wa miguu!",
          analysisText: "Mashabiki wa mpira wa miguu wanapendezwa na mambo tofauti. Wengine wanapenda mchezo wa haraka, wengine wanathamini mikakati, na wengi wanapenda hadithi za kibinadamu.",
          engagementText: "Ni nini kinachoshika moyo wako kuhusu mpira wa miguu? Shiriki falsafa yako! ⚽💭",
          funFact: "Je, ulijua kwamba 'Mchezo Mzuri' ulifanywa maarufu na Pelé?",
          difficulty: 'EASY' as const,
          expectedEngagement: 'HIGH' as const,
          educationalValue: 'MEDIUM' as const,
          viralPotential: 'HIGH' as const
        }
      ];
      
      return questions[Math.floor(Math.random() * questions.length)];
    }
    
    // Fallback
    return this.generateGeneralFootballOpinionPoll('en');
  }

  /**
   * 🏆 Generate historical moments polls
   */
  private generateHistoricalMomentsPoll(language: 'en' | 'am' | 'sw'): any {
    if (language === 'en') {
      const questions = [
        {
          title: "Greatest Football Moments",
          question: "🏆 Which is the greatest World Cup moment ever?",
          options: [
            { text: "🇧🇷 Pelé's 1970 Brazil team perfection" },
            { text: "🇦🇷 Maradona's 1986 magic in Mexico" },
            { text: "🇫🇷 Zidane's 1998 France triumph" },
            { text: "🇩🇪 Germany's 2014 Brazil demolition" },
            { text: "🤔 Something else entirely" }
          ],
          introText: "🏆 Time to settle the greatest moments debate!",
          analysisText: "Football history is filled with magical moments that transcend the sport. From individual brilliance to team perfection, these moments define generations of fans.",
          engagementText: "Which moment gives you goosebumps every time? 🔥",
          funFact: "The 1970 Brazil team is the only squad to win the World Cup with 100% victories",
          difficulty: 'MEDIUM' as const,
          expectedEngagement: 'HIGH' as const,
          educationalValue: 'HIGH' as const,
          viralPotential: 'HIGH' as const
        },
        {
          title: "Legendary Comebacks",
          question: "💥 Most incredible comeback in football history?",
          options: [
            { text: "🔴 Liverpool 3-3 AC Milan (2005 UCL)" },
            { text: "🔵 Barcelona 6-1 PSG (2017)" },
            { text: "⚪ Real Madrid vs Atletico (2014 UCL)" },
            { text: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Leicester City 2015-16 season" },
            { text: "🔄 Another epic comeback" }
          ],
          introText: "💥 Football's most incredible turnarounds!",
          analysisText: "Comebacks define football's magic - the moments when everything seems lost, yet hope refuses to die. These moments remind us why we never leave early.",
          engagementText: "Which comeback still gives you chills? 🤯",
          funFact: "Liverpool's 2005 Champions League final comeback is called 'The Miracle of Istanbul'",
          difficulty: 'MEDIUM' as const,
          expectedEngagement: 'HIGH' as const,
          educationalValue: 'HIGH' as const,
          viralPotential: 'HIGH' as const
        }
      ];
      
      return questions[Math.floor(Math.random() * questions.length)];
    }
    
    // Add Amharic and Swahili versions...
    return this.generateGeneralFootballOpinionPoll(language);
  }

  /**
   * ⭐ Generate player rankings polls  
   */
  private generatePlayerRankingsPoll(language: 'en' | 'am' | 'sw'): any {
    if (language === 'en') {
      const questions = [
        {
          title: "Current Best Players",
          question: "⭐ Who's the most complete footballer right now?",
          options: [
            { text: "🐐 Lionel Messi - Pure genius" },
            { text: "👑 Cristiano Ronaldo - Ultimate professional" },
            { text: "🥇 Kylian Mbappé - Future GOAT" },
            { text: "⚡ Erling Haaland - Goal machine" },
            { text: "🎭 Someone else deserves recognition" }
          ],
          introText: "⭐ Current football royalty debate!",
          analysisText: "The GOAT debate continues to evolve. While Messi and Ronaldo defined an era, new stars like Mbappé and Haaland are writing their own legends.",
          engagementText: "Who gets your vote for football perfection? 👑",
          funFact: "Messi and Ronaldo have won 12 of the last 13 Ballon d'Or awards between them",
          difficulty: 'EASY' as const,
          expectedEngagement: 'HIGH' as const,
          educationalValue: 'MEDIUM' as const,
          viralPotential: 'HIGH' as const
        }
      ];
      
      return questions[Math.floor(Math.random() * questions.length)];
    }
    
    return this.generateGeneralFootballOpinionPoll(language);
  }

  /**
   * 🔮 Generate league predictions polls
   */
  private generateLeaguePredictionsPoll(language: 'en' | 'am' | 'sw'): any {
    if (language === 'en') {
      const questions = [
        {
          title: "Premier League Predictions",
          question: "🏆 Who wins the Premier League this season?",
          options: [
            { text: "🔵 Manchester City - Experience" },
            { text: "🔴 Arsenal - Hungry for glory" },
            { text: "⚫ Liverpool - Never count them out" },
            { text: "🟡 Someone unexpected surprises" },
            { text: "🤔 Too close to call right now" }
          ],
          introText: "🏆 Premier League title race predictions!",
          analysisText: "The Premier League remains the most competitive league in the world. With multiple title contenders, every season brings surprises and drama.",
          engagementText: "Who's lifting the trophy in May? Make your prediction! 🏆",
          funFact: "Only 7 different teams have won the Premier League since 1992",
          difficulty: 'EASY' as const,
          expectedEngagement: 'HIGH' as const,
          educationalValue: 'MEDIUM' as const,
          viralPotential: 'HIGH' as const
        }
      ];
      
      return questions[Math.floor(Math.random() * questions.length)];
    }
    
    return this.generateGeneralFootballOpinionPoll(language);
  }

  /**
   * 🧠 Generate football trivia polls
   */
  private generateFootballTriviaPoll(language: 'en' | 'am' | 'sw'): any {
    if (language === 'en') {
      const questions = [
        {
          title: "Football Trivia Challenge",
          question: "🧠 Which country has never won the World Cup but deserves one?",
          options: [
            { text: "🇳🇱 Netherlands - Total Football pioneers" },
            { text: "🇧🇪 Belgium - Golden generation talent" },
            { text: "🇵🇹 Portugal - Beyond Ronaldo's era" },
            { text: "🇲🇽 Mexico - Consistent performers" },
            { text: "🇩🇰 Denmark - Dark horse potential" }
          ],
          introText: "🧠 Time to test your football knowledge!",
          analysisText: "Some of football's most beautiful teams have never captured the ultimate prize. The World Cup can be cruel to even the most talented nations.",
          engagementText: "Which footballing nation deserves World Cup glory? 🌍⚽",
          funFact: "The Netherlands reached 3 World Cup finals (1974, 1978, 2010) but never won",
          difficulty: 'MEDIUM' as const,
          expectedEngagement: 'MEDIUM' as const,
          educationalValue: 'HIGH' as const,
          viralPotential: 'MEDIUM' as const
        }
      ];
      
      return questions[Math.floor(Math.random() * questions.length)];
    }
    
    return this.generateGeneralFootballOpinionPoll(language);
  }

  /**
   * 🏟️ Generate team comparisons polls
   */
  private generateTeamComparisonsPoll(language: 'en' | 'am' | 'sw'): any {
    if (language === 'en') {
      const questions = [
        {
          title: "Classic Team Rivalries",
          question: "⚔️ Greatest football rivalry of all time?",
          options: [
            { text: "🇪🇸 El Clásico (Real vs Barca)" },
            { text: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Manchester United vs Liverpool" },
            { text: "🇮🇹 AC Milan vs Inter Milan" },
            { text: "🇦🇷 Boca Juniors vs River Plate" },
            { text: "⚡ Local derby in my area" }
          ],
          introText: "⚔️ The ultimate rivalry debate!",
          analysisText: "Football rivalries create the sport's most passionate moments. From El Clásico's global stage to local derbies' intimate intensity, rivalries define football culture.",
          engagementText: "Which rivalry gets your blood pumping? 🔥",
          funFact: "El Clásico is watched by over 650 million people worldwide",
          difficulty: 'EASY' as const,
          expectedEngagement: 'HIGH' as const,
          educationalValue: 'MEDIUM' as const,
          viralPotential: 'HIGH' as const
        }
      ];
      
      return questions[Math.floor(Math.random() * questions.length)];
    }
    
    return this.generateGeneralFootballOpinionPoll(language);
  }

  /**
   * 🌍 Generate football culture polls
   */
  private generateFootballCulturePoll(language: 'en' | 'am' | 'sw'): any {
    if (language === 'en') {
      const questions = [
        {
          title: "Football Culture Around the World",
          question: "🌍 Best football atmosphere in the world?",
          options: [
            { text: "🇩🇪 Borussia Dortmund - Yellow Wall" },
            { text: "🇹🇷 Galatasaray - Hell atmosphere" },
            { text: "🇦🇷 Boca Juniors - La Bombonera" },
            { text: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Liverpool - You'll Never Walk Alone" },
            { text: "🏠 My local team's ground" }
          ],
          introText: "🌍 Football atmosphere around the globe!",
          analysisText: "Football stadiums create unique atmospheres that reflect local culture. From Germany's organized chanting to South America's passionate chaos, each region brings magic.",
          engagementText: "Where would you most want to experience football? 🏟️",
          funFact: "Dortmund's Yellow Wall holds 24,454 standing fans - the largest terrace in European football",
          difficulty: 'MEDIUM' as const,
          expectedEngagement: 'MEDIUM' as const,
          educationalValue: 'HIGH' as const,
          viralPotential: 'MEDIUM' as const
        }
      ];
      
      return questions[Math.floor(Math.random() * questions.length)];
    }
    
    return this.generateGeneralFootballOpinionPoll(language);
  }

  /**
   * 📅 Generate weekend preview polls
   */
  private generateWeekendPreviewPoll(language: 'en' | 'am' | 'sw'): any {
    if (language === 'en') {
      const questions = [
        {
          title: "Weekend Football Plans",
          question: "⚽ How are you spending your football weekend?",
          options: [
            { text: "📺 Watching multiple matches at home" },
            { text: "🏟️ Going to see my team live" },
            { text: "🍺 Pub with friends for the big games" },
            { text: "⚽ Playing football myself" },
            { text: "📱 Following scores on my phone" }
          ],
          introText: "⚽ Weekend football vibes incoming!",
          analysisText: "Football weekends bring different joys - the stadium atmosphere, the pub camaraderie, the home comfort, or the pure joy of playing the beautiful game yourself.",
          engagementText: "How do you get your football fix? Share your weekend plans! 📅",
          funFact: "Saturday 3pm kickoffs in England have been protected since 1960",
          difficulty: 'EASY' as const,
          expectedEngagement: 'HIGH' as const,
          educationalValue: 'LOW' as const,
          viralPotential: 'MEDIUM' as const
        }
      ];
      
      return questions[Math.floor(Math.random() * questions.length)];
    }
    
    return this.generateGeneralFootballOpinionPoll(language);
  }

  /**
   * 📄 Build content for non-match polls - Only intro/context, NOT the poll question
   */
  private buildNonMatchPollContent(pollContent: any, language: 'en' | 'am' | 'sw'): string {
    if (language === 'en') {
      let content = `📊 FOOTBALL COMMUNITY POLL 🔥\n\n`;
      content += `${pollContent.introText}\n\n`;
      content += `${pollContent.analysisText}\n\n`;
      if (pollContent.funFact) {
        content += `${pollContent.funFact}\n\n`;
      }
      content += `${pollContent.engagementText}\n\n`;
      content += `📈 Join the conversation with football fans worldwide! 🌍`;
      
      return content;
    }
    
    if (language === 'am') {
      let content = `📊 የእግር ኳስ ማህበረሰብ ሕዝብ ጥያቄ 🔥\n\n`;
      content += `${pollContent.introText}\n\n`;
      content += `${pollContent.analysisText}\n\n`;
      if (pollContent.funFact) {
        content += `${pollContent.funFact}\n\n`;
      }
      content += `${pollContent.engagementText}\n\n`;
      content += `📈 በዓለም ዙሪያ ካሉ የእግር ኳስ ወዳጆች ጋር ይቀላቀሉ! 🌍`;
      
      return content;
    }
    
    if (language === 'sw') {
      let content = `📊 UCHAGUZI WA JAMII YA MPIRA WA MIGUU 🔥\n\n`;
      content += `${pollContent.introText}\n\n`;
      content += `${pollContent.analysisText}\n\n`;
      if (pollContent.funFact) {
        content += `${pollContent.funFact}\n\n`;
      }
      content += `${pollContent.engagementText}\n\n`;
      content += `📈 Jiunge na mazungumzo na mashabiki wa mpira wa miguu ulimwenguni! 🌍`;
      
      return content;
    }
    
    return pollContent.introText;
  }

  /**
   * 🤖 AI edit non-match poll content
   */
  private async aiEditNonMatchPollContent(content: string, pollContent: any, language: 'en' | 'am' | 'sw'): Promise<string> {
    try {
      const openai = await getOpenAIClient();
      if (!openai) {
        console.log('❌ OpenAI client not available for non-match poll enhancement');
        return this.enhanceNonMatchPollContentManually(content, language);
      }

      const languagePrompts = {
        'en': `Enhance this football community poll to be more engaging and viral. Keep it conversational and fun. Add relevant emojis naturally. Make it feel like a genuine community discussion. Include hashtags at the end:`,
        'am': `ይህን የእግር ኳስ ማህበረሰብ ጥያቄ የበለጠ አሳታፊ እና ተወዳጅ እንዲሆን ያሻሽሉት። እንደ እውነተኛ ማህበረሰብ ውይይት ያድርጉት። በመጨረሻ የሃሽታግ ይጨምሩ። IMPORTANT: Write entire response in AMHARIC only:`,
        'sw': `Boresha uchaguzi huu wa jamii ya mpira wa miguu uwe wa kuvutia zaidi. Ufanye uwe kama mazungumzo halisi ya jamii. Ongeza hashtags mwishoni. IMPORTANT: Write entire response in SWAHILI only:`
      };

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: `You are a social media expert specializing in football community content. Make polls engaging, conversational, and community-focused.`
          },
          { 
            role: "user", 
            content: `${languagePrompts[language]}\n\n${content}` 
          }
        ],
        max_tokens: 500,
        temperature: 0.8
      });

      const enhancedContent = response.choices[0]?.message?.content?.trim();
      
      if (enhancedContent) {
        console.log(`✅ AI enhanced non-match poll content in ${language}`);
        return enhancedContent;
      }
      
    } catch (error) {
      console.error('❌ Error enhancing non-match poll content with AI:', error);
    }
    
    return this.enhanceNonMatchPollContentManually(content, language);
  }

  /**
   * ✨ Manually enhance non-match poll content  
   */
  private enhanceNonMatchPollContentManually(content: string, language: 'en' | 'am' | 'sw'): string {
    const languageHashtags = {
      'en': `#FootballPoll #CommunityVote #Football #SoccerTalk #YourOpinion #FootballFans`,
      'am': `#የእግርኳስጥያቄ #ማህበረሰብድምጽ #እግርኳስ #FootballPoll #Community`,
      'sw': `#UchaguziMpira #JamiiSauti #MpiraMiguu #FootballPoll #Community`
    };
    
    const engagementText = {
      'en': '🗳️ Your voice matters in the football community! Vote and spark the debate! ⚽🔥',
      'am': '🗳️ የእርስዎ ድምጽ በእግር ኳስ ማህበረሰብ ውስጥ ይቆጠራል! ድምጽ ይስጡ እና ውይይቱን ይጀምሩ! ⚽🔥',
      'sw': '🗳️ Sauti yako inahitajika katika jamii ya mpira wa miguu! Piga kura na anzisha mjadala! ⚽🔥'
    };
    
    return `${content}\n\n${engagementText[language]}\n\n${languageHashtags[language]}`;
  }

  /**
   * 📊 Calculate engagement score for non-match polls
   */
  private calculateNonMatchEngagementScore(pollType: string): number {
    const baseScores: Record<string, number> = {
      'general_football_opinion': 85,
      'historical_moments': 75,
      'player_rankings': 90,
      'league_predictions': 80,
      'football_trivia': 65,
      'team_comparisons': 85,
      'football_culture': 70,
      'weekend_preview': 75
    };
    
    return baseScores[pollType] || 70;
  }

  /**
   * 🎓 Calculate educational score for non-match polls
   */
  private calculateNonMatchEducationalScore(pollType: string): number {
    const eduScores: Record<string, number> = {
      'general_football_opinion': 40,
      'historical_moments': 85,
      'player_rankings': 60,
      'league_predictions': 70,
      'football_trivia': 90,
      'team_comparisons': 75,
      'football_culture': 80,
      'weekend_preview': 30
    };
    
    return eduScores[pollType] || 50;
  }

  /**
   * 👥 Estimate participants for non-match polls
   */
  private estimateNonMatchParticipants(engagement: string): number {
    const baseParticipants = {
      'HIGH': 250,
      'MEDIUM': 150,
      'LOW': 80
    };
    
    return baseParticipants[engagement as keyof typeof baseParticipants] || 100;
  }

  /**
   * 🎭 Create mock analysis for non-match polls
   */
  private createMockAnalysisForNonMatch(pollContent: any, language: 'en' | 'am' | 'sw'): EnhancedPollAnalysis {
    return {
      homeTeam: 'Football',
      awayTeam: 'Community',
      competition: 'Global Football Discussion',
      matchImportance: 'MEDIUM' as const,
      teamComparison: {
        homeWinProbability: 40,
        awayWinProbability: 35,
        drawProbability: 25,
        homeStrengths: ['Community engagement'],
        awayStrengths: ['Diverse opinions'],
        keyFactors: ['Fan participation', 'Cultural differences', 'Football knowledge'],
        surpriseFactor: 30,
        tacticalEdge: 'NEUTRAL' as const
      },
      headToHead: {
        recentMeetings: 0,
        homeAdvantage: 'N/A',
        goalTrends: 'N/A',
        competitiveBalance: 'Community poll',
        memorableMoments: ['Football brings people together'],
        lastMeetingScore: 'N/A',
        biggestWin: { team: 'Football fans', score: 'Everyone wins' }
      },
      formAnalysis: {
        homeForm: 'GOOD',
        awayForm: 'GOOD',
        momentum: 'Community engagement growing',
        keyPlayers: {
          home: [{ name: 'Football fans', role: 'Participants', form: 'Active' }],
          away: [{ name: 'Community', role: 'Engagement', form: 'Strong' }]
        },
        injuries: { home: [], away: [] },
        suspensions: { home: [], away: [] }
      },
      contextFactors: {
        venue: 'Global Football Community',
        weather: 'Perfect for discussion',
        crowdFactor: 85,
        refereeInfluence: 'LOW' as const,
        mediaAttention: 'MEDIUM' as const,
        stakes: ['Community engagement', 'Football discussion', 'Shared passion']
      },
      narrativeElements: {
        mainStoryline: 'Football fans coming together to share opinions',
        subPlots: ['Different perspectives', 'Cultural diversity', 'Shared passion'],
        rivalryLevel: 'NONE' as const,
        fanExpectations: {
          home: 'Engaging discussion',
          away: 'Diverse opinions shared'
        },
        pressurePoints: ['Respectful debate', 'Inclusive discussion']
      }
    };
  }

  /**
   * 📅 Get today's most important match from database
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
   * 📊 Step 2: Perform enhanced analysis for poll generation
   */
  private async performEnhancedAnalysisForPoll(match: any): Promise<EnhancedPollAnalysis> {
    console.log(`📊 Performing enhanced analysis for poll: ${match.homeTeam.name} vs ${match.awayTeam.name}`);

    // Get comprehensive team analysis data
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

    // Build enhanced analysis components
    const teamComparison = this.calculateEnhancedTeamComparison(homeAnalysis, awayAnalysis);
    const headToHead = this.analyzeEnhancedHeadToHead(detailedInfo?.headToHead, match.homeTeam.name, match.awayTeam.name);
    const formAnalysis = this.analyzeEnhancedCurrentForm(homeAnalysis, awayAnalysis);
    const contextFactors = this.analyzeContextFactors(match);
    const narrativeElements = this.analyzeNarrativeElements(match, teamComparison, headToHead);

    return {
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      competition: match.competition.name,
      matchImportance: this.determineMatchImportance(match.competition.name, teamComparison),
      teamComparison,
      headToHead,
      formAnalysis,
      contextFactors,
      narrativeElements
    };
  }

  /**
   * ⚖️ Calculate enhanced team comparison for poll context
   */
  private calculateEnhancedTeamComparison(homeAnalysis: any, awayAnalysis: any) {
    const homeStats = homeAnalysis?.statistics || {};
    const awayStats = awayAnalysis?.statistics || {};
    
    // Enhanced probability calculations
    const homeWinRate = homeStats.winRate || (45 + Math.random() * 20);
    const awayWinRate = awayStats.winRate || (45 + Math.random() * 20);
    const homeAdvantage = 12; // Enhanced home field advantage
    
    // Factor in recent form
    const homeFormBonus = this.calculateFormBonus(homeStats.form || 'WWDLL');
    const awayFormBonus = this.calculateFormBonus(awayStats.form || 'WLWWD');
    
    let homeProb = homeWinRate + homeAdvantage + homeFormBonus;
    let awayProb = awayWinRate + awayFormBonus;
    let drawProb = 100 - homeProb - awayProb + 10; // Slight draw bias
    
    // Normalize to 100%
    const total = homeProb + awayProb + drawProb;
    homeProb = Math.max(15, Math.min(70, (homeProb / total) * 100));
    awayProb = Math.max(15, Math.min(70, (awayProb / total) * 100));
    drawProb = Math.max(15, Math.min(40, (drawProb / total) * 100));

    // Calculate surprise factor (upset potential)
    const strengthGap = Math.abs(homeWinRate - awayWinRate);
    const surpriseFactor = Math.max(10, 60 - strengthGap);

    return {
      homeWinProbability: Math.round(homeProb),
      awayWinProbability: Math.round(awayProb),
      drawProbability: Math.round(drawProb),
      homeStrengths: this.identifyTeamStrengths(homeStats, true),
      awayStrengths: this.identifyTeamStrengths(awayStats, false),
      keyFactors: [
        'Recent form momentum',
        'Head-to-head psychological edge',
        'Home crowd support',
        'Key player availability',
        'Tactical matchup advantages'
      ],
      surpriseFactor: Math.round(surpriseFactor),
      tacticalEdge: this.determineTacticalEdge(homeStats, awayStats)
    };
  }

  /**
   * 🔄 Analyze enhanced head-to-head for richer poll context
   */
  private analyzeEnhancedHeadToHead(h2hData: any, homeTeam: string, awayTeam: string) {
    if (!h2hData || !h2hData.lastMeetings?.length) {
      return {
        recentMeetings: 0,
        homeAdvantage: 'No recent history - fresh rivalry brewing!',
        goalTrends: 'Unknown patterns - anything could happen',
        competitiveBalance: 'First meeting between these teams',
        memorableMoments: ['This will be their first encounter!'],
        lastMeetingScore: 'N/A',
        biggestWin: { team: 'None yet', score: 'N/A' }
      };
    }

    const meetings = h2hData.lastMeetings.slice(0, 10);
    let homeWins = 0;
    let awayWins = 0;
    let draws = 0;
    let totalGoals = 0;
    let biggestHomeWin = { score: '0-0', margin: 0 };
    let biggestAwayWin = { score: '0-0', margin: 0 };

    meetings.forEach((match: any) => {
      const homeScore = parseInt(match.match_hometeam_score) || 0;
      const awayScore = parseInt(match.match_awayteam_score) || 0;
      totalGoals += homeScore + awayScore;
      
      const margin = Math.abs(homeScore - awayScore);
      
      if (homeScore > awayScore) {
        homeWins++;
        if (margin > biggestHomeWin.margin) {
          biggestHomeWin = { score: `${homeScore}-${awayScore}`, margin };
        }
      } else if (awayScore > homeScore) {
        awayWins++;
        if (margin > biggestAwayWin.margin) {
          biggestAwayWin = { score: `${homeScore}-${awayScore}`, margin };
        }
      } else {
        draws++;
      }
    });

    const avgGoals = totalGoals / meetings.length;
    const lastMeeting = meetings[0];
    const lastScore = `${lastMeeting.match_hometeam_score}-${lastMeeting.match_awayteam_score}`;

    // Generate memorable moments
    const memorableMoments = this.generateMemorableMoments(meetings, homeTeam, awayTeam);

    return {
      recentMeetings: meetings.length,
      homeAdvantage: this.analyzeHomeAdvantageNarrative(homeWins, awayWins, draws, homeTeam, awayTeam),
      goalTrends: this.analyzeGoalTrendsNarrative(avgGoals, meetings),
      competitiveBalance: this.analyzeCompetitiveBalanceNarrative(homeWins, awayWins, draws),
      memorableMoments,
      lastMeetingScore: lastScore,
      biggestWin: biggestHomeWin.margin > biggestAwayWin.margin ? 
        { team: homeTeam, score: biggestHomeWin.score } :
        { team: awayTeam, score: biggestAwayWin.score }
    };
  }

  /**
   * 📈 Analyze enhanced current form with detailed player info
   */
  private analyzeEnhancedCurrentForm(homeAnalysis: any, awayAnalysis: any) {
    const homeStats = homeAnalysis?.statistics || {};
    const awayStats = awayAnalysis?.statistics || {};

    return {
      homeForm: homeStats.form || this.generateRealisticForm(),
      awayForm: awayStats.form || this.generateRealisticForm(),
      momentum: this.determineMomentumNarrative(homeStats.form, awayStats.form),
      keyPlayers: {
        home: this.generateKeyPlayersWithForm(homeAnalysis, true),
        away: this.generateKeyPlayersWithForm(awayAnalysis, false)
      },
      injuries: {
        home: this.generateInjuries(true),
        away: this.generateInjuries(false)
      },
      suspensions: {
        home: this.generateSuspensions(),
        away: this.generateSuspensions()
      }
    };
  }

  /**
   * 🎭 Analyze match context factors
   */
  private analyzeContextFactors(match: any) {
    return {
      venue: match.venue || `${match.homeTeam.name} Stadium`,
      weather: this.generateWeatherConditions(),
      crowdFactor: Math.floor(Math.random() * 30) + 70, // 70-100
      refereeInfluence: this.determineRefereeInfluence(),
      mediaAttention: this.determineMediaAttention(match.competition.name),
      stakes: this.determineStakes(match)
    };
  }

  /**
   * 📖 Analyze narrative elements for storytelling
   */
  private analyzeNarrativeElements(match: any, teamComparison: any, headToHead: any) {
    return {
      mainStoryline: this.generateMainStoryline(match, teamComparison),
      subPlots: this.generateSubPlots(teamComparison, headToHead),
      rivalryLevel: this.determineRivalryLevel(headToHead),
      fanExpectations: {
        home: this.generateFanExpectations(teamComparison.homeWinProbability, true),
        away: this.generateFanExpectations(teamComparison.awayWinProbability, false)
      },
      pressurePoints: this.identifyPressurePoints(match, teamComparison)
    };
  }

  /**
   * 🎯 Step 3: Determine optimal poll type based on analysis and audience
   */
  private determineOptimalPollType(analysis: EnhancedPollAnalysis, request: PollGenerationRequest): PollType {
    const { teamComparison, matchImportance, narrativeElements } = analysis;
    
    // Factor in creativity level
    const isCreative = request.creativityLevel === 'high' || request.creativityLevel === 'maximum';
    
    // High importance matches get prediction polls
    if (matchImportance === 'HIGH') {
      if (isCreative && Math.random() < 0.3) {
        return Math.random() < 0.5 ? 'what_if_scenarios' : 'emotional_investment';
      }
      return Math.random() < 0.6 ? 'match_prediction' : 'score_prediction';
    }
    
    // Rivalry matches get special treatment
    if (narrativeElements.rivalryLevel === 'INTENSE') {
      const rivalryPolls: PollType[] = ['emotional_investment', 'historical_trivia', 'fan_opinion'];
      return rivalryPolls[Math.floor(Math.random() * rivalryPolls.length)];
    }
    
    // Close matches get engaging polls
    const maxProb = Math.max(
      teamComparison.homeWinProbability, 
      teamComparison.awayWinProbability, 
      teamComparison.drawProbability
    );
    
    if (maxProb < 45) { // Very competitive
      if (isCreative) {
        return Math.random() < 0.4 ? 'surprise_factor' : 'momentum_check';
      }
      return 'match_prediction';
    }
    
    // High surprise factor gets upset-focused polls
    if (teamComparison.surpriseFactor > 60 && isCreative) {
      return 'surprise_factor';
    }
    
    // Creative mode has more variety
    if (isCreative) {
      const creativePolls: PollType[] = [
        'tactical_analysis', 'player_spotlight', 'what_if_scenarios',
        'emotional_investment', 'momentum_check'
      ];
      if (Math.random() < 0.4) {
        return creativePolls[Math.floor(Math.random() * creativePolls.length)];
      }
    }
    
    // Standard variety
    const standardPolls: PollType[] = [
      'match_prediction', 'score_prediction', 'goalscorer_prediction',
      'match_events', 'fan_opinion', 'comparison', 'trivia'
    ];
    
    return standardPolls[Math.floor(Math.random() * standardPolls.length)];
  }

  /**
   * 📝 Step 4: Generate enhanced poll content based on type
   */
  private async generateEnhancedPollContent(analysis: EnhancedPollAnalysis, pollType: PollType, request: PollGenerationRequest): Promise<EnhancedPollContent> {
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
      case 'tactical_analysis':
        return this.generateTacticalAnalysisPoll(analysis, request.language);
      case 'player_spotlight':
        return this.generatePlayerSpotlightPoll(analysis, request.language);
      case 'historical_trivia':
        return this.generateHistoricalTriviaPoll(analysis, request.language);
      case 'momentum_check':
        return this.generateMomentumCheckPoll(analysis, request.language);
      case 'surprise_factor':
        return this.generateSurpriseFactorPoll(analysis, request.language);
      case 'emotional_investment':
        return this.generateEmotionalInvestmentPoll(analysis, request.language);
      case 'what_if_scenarios':
        return this.generateWhatIfScenariosPoll(analysis, request.language);
      default:
        return this.generateMatchPredictionPoll(analysis, request.language);
    }
  }

  /**
   * 🏆 Generate enhanced match prediction poll
   */
  private generateMatchPredictionPoll(analysis: EnhancedPollAnalysis, language: 'en' | 'am' | 'sw' | 'fr' | 'ar'): EnhancedPollContent {
    const { homeTeam, awayTeam, teamComparison, narrativeElements } = analysis;
    
    // Translate key factors to target language for pure content
    const translatedKeyFactors = this.translateKeyFactors(teamComparison.keyFactors.slice(0, 3), language);
    
    if (language === 'en') {
      return {
        telegramPoll: {
          question: `🔥 ${homeTeam} vs ${awayTeam}: Who takes the victory?`,
          options: [
            { text: `🏠 ${homeTeam} Win (${teamComparison.homeWinProbability}%)`, emoji: '🏠' },
            { text: `🤝 Draw (${teamComparison.drawProbability}%)`, emoji: '🤝' },
            { text: `✈️ ${awayTeam} Win (${teamComparison.awayWinProbability}%)`, emoji: '✈️' }
          ],
          is_anonymous: true,
          type: 'regular',
          allows_multiple_answers: false,
          open_period: 36000
        },
        introText: `🔥 ${narrativeElements.mainStoryline}`,
        analysisText: `📊 The Stats Say:\n• ${homeTeam}: ${teamComparison.homeWinProbability}% win probability\n• Draw: ${teamComparison.drawProbability}% probability\n• ${awayTeam}: ${teamComparison.awayWinProbability}% win probability\n\n🎯 Key Factors:\n${translatedKeyFactors.map(factor => `• ${factor}`).join('\n')}`,
        engagementText: `Cast your vote and join ${this.estimateParticipants('HIGH', analysis.matchImportance)}+ football fans! 🗳️⚽`,
        funFact: `💡 Did you know? ${this.generateFunFact(analysis)}`,
        pollType: 'match_prediction',
        difficulty: 'EASY',
        expectedEngagement: 'HIGH',
        educationalValue: 'MEDIUM',
        viralPotential: 'HIGH'
      };
    }
    
    if (language === 'am') {
      return {
        telegramPoll: {
          question: `🔥 ${homeTeam} በተቃወመ ${awayTeam}: ማን ድል ይቀዳጃል?`,
          options: [
            { text: `🏠 ${homeTeam} ድል (${teamComparison.homeWinProbability}%)`, emoji: '🏠' },
            { text: `🤝 አቻነት (${teamComparison.drawProbability}%)`, emoji: '🤝' },
            { text: `✈️ ${awayTeam} ድል (${teamComparison.awayWinProbability}%)`, emoji: '✈️' }
          ],
          is_anonymous: true,
          type: 'regular',
          allows_multiple_answers: false,
          open_period: 36000
        },
        introText: `🔥 ታላቅ ጨዋታ! ${narrativeElements.mainStoryline}`,
        analysisText: `📊 የስታቲስቲክ መረጃ:\n• ${homeTeam}: ${teamComparison.homeWinProbability}% የማሸነፍ ዕድል\n• አቻነት: ${teamComparison.drawProbability}% ዕድል\n• ${awayTeam}: ${teamComparison.awayWinProbability}% የማሸነፍ ዕድል\n\n🎯 ቁልፍ ነጥቦች:\n${translatedKeyFactors.map(factor => `• ${factor}`).join('\n')}`,
        engagementText: `ድምጽዎን ይስጡ እና ከ${this.estimateParticipants('HIGH', analysis.matchImportance)}+ የእግር ኳስ ፍቅረኞች ጋር ይቀላቀሉ! 🗳️⚽`,
        funFact: `💡 ያውቃሉ ወይ? ${this.generateFunFact(analysis)}`,
        pollType: 'match_prediction',
        difficulty: 'EASY',
        expectedEngagement: 'HIGH',
        educationalValue: 'MEDIUM',
        viralPotential: 'HIGH'
      };
    }
    
    if (language === 'sw') {
      return {
        telegramPoll: {
          question: `🔥 ${homeTeam} dhidi ya ${awayTeam}: Nani atashinda?`,
          options: [
            { text: `🏠 ${homeTeam} Kushinda (${teamComparison.homeWinProbability}%)`, emoji: '🏠' },
            { text: `🤝 Sare (${teamComparison.drawProbability}%)`, emoji: '🤝' },
            { text: `✈️ ${awayTeam} Kushinda (${teamComparison.awayWinProbability}%)`, emoji: '✈️' }
          ],
          is_anonymous: true,
          type: 'regular',
          allows_multiple_answers: false,
          open_period: 36000
        },
        introText: `🔥 Mechi kubwa! ${narrativeElements.mainStoryline}`,
        analysisText: `📊 Takwimu Zinasema:\n• ${homeTeam}: ${teamComparison.homeWinProbability}% uwezekano wa kushinda\n• Sare: ${teamComparison.drawProbability}% uwezekano\n• ${awayTeam}: ${teamComparison.awayWinProbability}% uwezekano wa kushinda\n\n🎯 Mambo Muhimu:\n${translatedKeyFactors.map(factor => `• ${factor}`).join('\n')}`,
        engagementText: `Piga kura yako na ujiunga na mapinduzi ya ${this.estimateParticipants('HIGH', analysis.matchImportance)}+ wapenzi wa mpira! 🗳️⚽`,
        funFact: `💡 Je, unajua? ${this.generateFunFact(analysis)}`,
        pollType: 'match_prediction',
        difficulty: 'EASY',
        expectedEngagement: 'HIGH',
        educationalValue: 'MEDIUM',
        viralPotential: 'HIGH'
      };
    }

    if (language === 'fr') {
      return {
        telegramPoll: {
          question: `🔥 ${homeTeam} vs ${awayTeam}: Qui remporte la victoire?`,
          options: [
            { text: `🏠 Victoire ${homeTeam} (${teamComparison.homeWinProbability}%)`, emoji: '🏠' },
            { text: `🤝 Match nul (${teamComparison.drawProbability}%)`, emoji: '🤝' },
            { text: `✈️ Victoire ${awayTeam} (${teamComparison.awayWinProbability}%)`, emoji: '✈️' }
          ],
          is_anonymous: true,
          type: 'regular',
          allows_multiple_answers: false,
          open_period: 36000
        },
        introText: `🔥 Grand match! ${narrativeElements.mainStoryline}`,
        analysisText: `📊 Les Statistiques Disent:\n• ${homeTeam}: ${teamComparison.homeWinProbability}% de probabilité de victoire\n• Match nul: ${teamComparison.drawProbability}% de probabilité\n• ${awayTeam}: ${teamComparison.awayWinProbability}% de probabilité de victoire\n\n🎯 Facteurs Clés:\n${translatedKeyFactors.map(factor => `• ${factor}`).join('\n')}`,
        engagementText: `Votez et rejoignez ${this.estimateParticipants('HIGH', analysis.matchImportance)}+ fans de football! 🗳️⚽`,
        funFact: `💡 Le saviez-vous? ${this.generateFunFact(analysis)}`,
        pollType: 'match_prediction',
        difficulty: 'EASY',
        expectedEngagement: 'HIGH',
        educationalValue: 'MEDIUM',
        viralPotential: 'HIGH'
      };
    }

    if (language === 'ar') {
      return {
        telegramPoll: {
          question: `🔥 ${homeTeam} ضد ${awayTeam}: من سيحقق النصر؟`,
          options: [
            { text: `🏠 فوز ${homeTeam} (${teamComparison.homeWinProbability}%)`, emoji: '🏠' },
            { text: `🤝 تعادل (${teamComparison.drawProbability}%)`, emoji: '🤝' },
            { text: `✈️ فوز ${awayTeam} (${teamComparison.awayWinProbability}%)`, emoji: '✈️' }
          ],
          is_anonymous: true,
          type: 'regular',
          allows_multiple_answers: false,
          open_period: 36000
        },
        introText: `🔥 مباراة كبيرة! ${narrativeElements.mainStoryline}`,
        analysisText: `📊 الإحصائيات تقول:\n• ${homeTeam}: ${teamComparison.homeWinProbability}% احتمالية الفوز\n• التعادل: ${teamComparison.drawProbability}% احتمالية\n• ${awayTeam}: ${teamComparison.awayWinProbability}% احتمالية الفوز\n\n🎯 العوامل الرئيسية:\n${translatedKeyFactors.map(factor => `• ${factor}`).join('\n')}`,
        engagementText: `صوت وانضم إلى ${this.estimateParticipants('HIGH', analysis.matchImportance)}+ من عشاق كرة القدم! 🗳️⚽`,
        funFact: `💡 هل تعلم؟ ${this.generateFunFact(analysis)}`,
        pollType: 'match_prediction',
        difficulty: 'EASY',
        expectedEngagement: 'HIGH',
        educationalValue: 'MEDIUM',
        viralPotential: 'HIGH'
      };
    }

    // Fallback to English if language not supported
    return this.generateMatchPredictionPoll(analysis, 'en');
  }

  /**
   * 🧠 Generate tactical analysis poll
   */
  private generateTacticalAnalysisPoll(analysis: EnhancedPollAnalysis, language: 'en' | 'am' | 'sw'): EnhancedPollContent {
    const { homeTeam, awayTeam, teamComparison } = analysis;
    
    if (language === 'en') {
      const tacticalQuestions = [
        `Which tactical approach will dominate this match?`,
        `Where will this match be won and lost?`,
        `What's the key tactical battle to watch?`
      ];
      
      const question = tacticalQuestions[Math.floor(Math.random() * tacticalQuestions.length)];
      
      return {
        telegramPoll: {
          question,
          options: [
            { text: `${homeTeam}'s home setup dominates`, emoji: '🏠' },
            { text: `Midfield battle decides everything`, emoji: '⚔️' },
            { text: `${awayTeam}'s away tactics prevail`, emoji: '✈️' },
            { text: `Set pieces make the difference`, emoji: '🎯' },
            { text: `Individual brilliance trumps tactics`, emoji: '⭐' }
          ],
          is_anonymous: true,
          type: 'regular',
          allows_multiple_answers: false,
          open_period: 54000
        },
        introText: `🧠 Tactical Masterclass Incoming!`,
        analysisText: `⚔️ Tactical Edge Analysis:\n• ${homeTeam} strengths: ${teamComparison.homeStrengths.join(', ')}\n• ${awayTeam} strengths: ${teamComparison.awayStrengths.join(', ')}\n• Current tactical edge: ${teamComparison.tacticalEdge}`,
        engagementText: `Show your tactical knowledge! What wins matches? 🎯`,
        funFact: `🎓 Tactical insight: ${this.generateTacticalInsight(analysis)}`,
        pollType: 'tactical_analysis',
        difficulty: 'MEDIUM',
        expectedEngagement: 'MEDIUM',
        educationalValue: 'HIGH',
        viralPotential: 'MEDIUM'
      };
    }
    
    return this.generateFallbackPoll(analysis, 'tactical_analysis', language);
  }

  /**
   * 🌟 Generate player spotlight poll
   */
  private generatePlayerSpotlightPoll(analysis: EnhancedPollAnalysis, language: 'en' | 'am' | 'sw'): EnhancedPollContent {
    const { homeTeam, awayTeam, formAnalysis } = analysis;
    
    if (language === 'en') {
      return {
        telegramPoll: {
          question: `⭐ Who will be the standout player?`,
          options: [
            { text: `${formAnalysis.keyPlayers.home[0]?.name || 'Home Star'} (${homeTeam})`, emoji: '🏠' },
            { text: `${formAnalysis.keyPlayers.away[0]?.name || 'Away Star'} (${awayTeam})`, emoji: '✈️' },
            { text: `${formAnalysis.keyPlayers.home[1]?.name || 'Home Midfielder'} (${homeTeam})`, emoji: '🔵' },
            { text: `${formAnalysis.keyPlayers.away[1]?.name || 'Away Midfielder'} (${awayTeam})`, emoji: '🔴' },
            { text: `Surprise breakout performance`, emoji: '💫' }
          ],
          is_anonymous: true,
          type: 'regular',
          allows_multiple_answers: false,
          open_period: 36000
        },
        introText: `⭐ Player Spotlight Time!`,
        analysisText: `🌟 Players to Watch:\n• ${homeTeam}: ${formAnalysis.keyPlayers.home.map(p => `${p.name} (${p.role})`).join(', ')}\n• ${awayTeam}: ${formAnalysis.keyPlayers.away.map(p => `${p.name} (${p.role})`).join(', ')}\n\nWho steps up when it matters?`,
        engagementText: `Back your favorite star! Who shines brightest? ⭐`,
        funFact: `🎯 Star power: ${this.generatePlayerFact(formAnalysis)}`,
        pollType: 'player_spotlight',
        difficulty: 'MEDIUM',
        expectedEngagement: 'MEDIUM',
        educationalValue: 'MEDIUM',
        viralPotential: 'MEDIUM'
      };
    }
    
    return this.generateFallbackPoll(analysis, 'player_spotlight', language);
  }

  /**
   * 🎲 Generate surprise factor poll
   */
  private generateSurpriseFactorPoll(analysis: EnhancedPollAnalysis, language: 'en' | 'am' | 'sw'): EnhancedPollContent {
    const { homeTeam, awayTeam, teamComparison } = analysis;
    
    if (language === 'en') {
      return {
        telegramPoll: {
          question: `🎲 Upset alert! What's the biggest surprise potential?`,
          options: [
            { text: `${teamComparison.homeWinProbability < teamComparison.awayWinProbability ? homeTeam : awayTeam} shock victory`, emoji: '💥' },
            { text: `Unexpected high-scoring thriller`, emoji: '🔥' },
            { text: `Defensive masterclass (0-0 or 1-0)`, emoji: '🛡️' },
            { text: `Last-minute drama decides it`, emoji: '⏰' },
            { text: `No surprises - favorites win comfortably`, emoji: '😴' }
          ],
          is_anonymous: true,
          type: 'regular',
          allows_multiple_answers: false,
          open_period: 36000
        },
        introText: `🎲 Upset Watch is ON!`,
        analysisText: `💥 Surprise Factor: ${teamComparison.surpriseFactor}%\n\n🎯 Why upsets happen:\n• Form can be deceiving\n• Motivation vs expectation\n• Individual moments of magic\n• Tactical surprises\n\nCurrent odds suggest... but football is unpredictable!`,
        engagementText: `Feeling the upset? What's your chaos prediction? 🌪️`,
        funFact: `🎰 Upset stat: ${this.generateUpsetFact(analysis)}`,
        pollType: 'surprise_factor',
        difficulty: 'MEDIUM',
        expectedEngagement: 'HIGH',
        educationalValue: 'MEDIUM',
        viralPotential: 'HIGH'
      };
    }
    
    return this.generateFallbackPoll(analysis, 'surprise_factor', language);
  }

  /**
   * 💝 Generate emotional investment poll
   */
  private generateEmotionalInvestmentPoll(analysis: EnhancedPollAnalysis, language: 'en' | 'am' | 'sw'): EnhancedPollContent {
    const { homeTeam, awayTeam, narrativeElements } = analysis;
    
    if (language === 'en') {
      const emotionalQuestions = [
        `How emotionally invested are you in this match?`,
        `What would hurt most as a neutral fan?`,
        `Which result would create the most drama?`
      ];
      
      const question = emotionalQuestions[Math.floor(Math.random() * emotionalQuestions.length)];
      
      return {
        telegramPoll: {
          question,
          options: [
            { text: `${homeTeam} must win - I'm all in! 🔥`, emoji: '🏠' },
            { text: `Rooting for ${awayTeam} - upset vibes! ⚡`, emoji: '✈️' },
            { text: `Just want a great match 🍿`, emoji: '🤝' },
            { text: `Drama and chaos please! 🎭`, emoji: '🎲' },
            { text: `Don't care much tbh 😴`, emoji: '😐' }
          ],
          is_anonymous: true,
          type: 'regular',
          allows_multiple_answers: false,
          open_period: 72000
        },
        introText: `💝 Heart vs Head Time!`,
        analysisText: `💭 The Emotional Stakes:\n• ${narrativeElements.rivalryLevel} rivalry level\n• Fan expectations: ${narrativeElements.fanExpectations.home} vs ${narrativeElements.fanExpectations.away}\n• Pressure points: ${narrativeElements.pressurePoints.join(', ')}\n\nSometimes it's not about logic...`,
        engagementText: `Where's your heart in this one? Football is emotion! ❤️⚽`,
        funFact: `💫 Drama factor: ${this.generateDramaFact(analysis)}`,
        pollType: 'emotional_investment',
        difficulty: 'EASY',
        expectedEngagement: 'HIGH',
        educationalValue: 'LOW',
        viralPotential: 'HIGH'
      };
    }
    
    return this.generateFallbackPoll(analysis, 'emotional_investment', language);
  }

  /**
   * 🔮 Generate what-if scenarios poll
   */
  private generateWhatIfScenariosPoll(analysis: EnhancedPollAnalysis, language: 'en' | 'am' | 'sw'): EnhancedPollContent {
    const { homeTeam, awayTeam } = analysis;
    
    if (language === 'en') {
      const scenarios = [
        {
          question: `🔮 What if both teams' star players get injured in warmup?`,
          context: 'sudden squad changes'
        },
        {
          question: `🔮 What if it's 0-0 at 89th minute - what happens next?`,
          context: 'late drama scenarios'
        },
        {
          question: `🔮 What if the referee makes a controversial VAR decision?`,
          context: 'external factors'
        }
      ];
      
      const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
      
      return {
        telegramPoll: {
          question: scenario.question,
          options: [
            { text: `${homeTeam} adapts better and wins`, emoji: '🏠' },
            { text: `${awayTeam} thrives under pressure`, emoji: '✈️' },
            { text: `Total chaos - anyone's guess`, emoji: '🌪️' },
            { text: `Match becomes boring/defensive`, emoji: '😴' },
            { text: `Substitutions save the day`, emoji: '🔄' }
          ],
          is_anonymous: true,
          type: 'regular',
          allows_multiple_answers: false,
          open_period: 48000
        },
        introText: `🔮 Alternative Reality Football!`,
        analysisText: `🎭 Scenario Planning:\nFootball is full of unexpected turns. How teams react to curve balls often separates the great from the good.\n\n${scenario.context === 'sudden squad changes' ? '💭 Squad depth matters!' : scenario.context === 'late drama scenarios' ? '⏰ Mental strength crucial!' : '🤔 External pressures test character!'}`,
        engagementText: `Use your football imagination! What would really happen? 🧠`,
        funFact: `🎯 Scenario insight: ${this.generateScenarioFact(analysis)}`,
        pollType: 'what_if_scenarios',
        difficulty: 'HARD',
        expectedEngagement: 'MEDIUM',
        educationalValue: 'HIGH',
        viralPotential: 'MEDIUM'
      };
    }
    
    return this.generateFallbackPoll(analysis, 'what_if_scenarios', language);
  }

  // Enhanced helper methods for poll generation continue...
  // (Additional helper methods would continue here following the same pattern)

  /**
   * 🎯 Generate contextual content with AI enhancement
   */
  private async generateContextualContent(pollContent: EnhancedPollContent, analysis: EnhancedPollAnalysis, request: PollGenerationRequest): Promise<{
    content: string;
    aiEditedContent: string;
  }> {
    const content = this.buildEnhancedPollContent(pollContent, analysis, request.language);
    const aiEditedContent = await this.aiEditPollContent(content, analysis, pollContent, request.language);
    
    return { content, aiEditedContent };
  }

  /**
   * 📄 Build enhanced poll content - Only intro/context, NOT the poll question itself
   */
  private buildEnhancedPollContent(pollContent: EnhancedPollContent, analysis: EnhancedPollAnalysis, language: 'en' | 'am' | 'sw'): string {
    const { homeTeam, awayTeam, competition } = analysis;
    
    if (language === 'en') {
      let content = `📊 MATCH POLL 🔥\n\n`;
      content += `${pollContent.introText}\n\n`;
      content += `🏆 ${homeTeam} vs ${awayTeam}\n`;
      content += `📍 ${competition}\n\n`;
      
      if (pollContent.analysisText) {
        content += `${pollContent.analysisText}\n\n`;
      }
      
      if (pollContent.funFact) {
        content += `${pollContent.funFact}\n\n`;
      }
      
      content += `${pollContent.engagementText}`;
      
      return content;
    }
    
    if (language === 'am') {
      let content = `📊 የግጥሚያ ሕዝብ አስተያየት 🔥\n\n`;
      content += `${pollContent.introText}\n\n`;
      content += `🏆 ${homeTeam} በተቃወመ ${awayTeam}\n`;
      content += `📍 ${competition}\n\n`;
      
      if (pollContent.analysisText) {
        content += `${pollContent.analysisText}\n\n`;
      }
      
      if (pollContent.funFact) {
        content += `${pollContent.funFact}\n\n`;
      }
      
      content += `${pollContent.engagementText}`;
      
      return content;
    }
    
    if (language === 'sw') {
      let content = `📊 UCHAGUZI WA MCHEZO 🔥\n\n`;
      content += `${pollContent.introText}\n\n`;
      content += `🏆 ${homeTeam} dhidi ya ${awayTeam}\n`;
      content += `📍 ${competition}\n\n`;
      
      if (pollContent.analysisText) {
        content += `${pollContent.analysisText}\n\n`;
      }
      
      if (pollContent.funFact) {
        content += `${pollContent.funFact}\n\n`;
      }
      
      content += `${pollContent.engagementText}`;
      
      return content;
    }
    
    return this.buildBasicPollContent(pollContent, analysis, language);
  }

  /**
   * 🤖 Enhanced AI edit poll content
   */
  private async aiEditPollContent(content: string, analysis: EnhancedPollAnalysis, pollContent: EnhancedPollContent, language: 'en' | 'am' | 'sw'): Promise<string> {
    try {
      const openai = await getOpenAIClient();
      if (!openai) {
        console.log('❌ OpenAI client not available for poll enhancement');
        return this.enhancePollContentManually(content, analysis, language);
      }

      const languagePrompts = {
        'en': `Enhance this football poll content to be more engaging and viral. Keep it concise but exciting. Add relevant emojis naturally. Make it feel interactive and fun. Include strategic hashtags at the end:`,
        'am': `ይህን የእግር ኳስ የሕዝብ አስተያየት ይዘት የበለጠ አሳታፊ እና ተወዳጅ እንዲሆን ያሻሽሉት። አጭር ነገር ግን አስደሳች ያድርጉት። ተፈጥሯዊ ስሜቶችን ያክሉ። በመጨረሻ የሃሽታግ ይጨምሩ። IMPORTANT: Write entire response in AMHARIC only:`,
        'sw': `Boresha maudhui haya ya uchaguzi wa mpira wa miguu yawe ya kuvutia zaidi na yenye kuenea haraka. Yafupishe lakini yawe ya kusisimua. Ongeza emoji kwa kawaida. Yaonyeshe mwingiliano na furaha. Jumuisha hashtags mwishoni. IMPORTANT: Write entire response in SWAHILI only:`
      };

      const systemPrompts = {
        'en': `You are a social media expert specializing in interactive football content. Make polls engaging, shareable, and exciting while keeping them concise and clear.`,
        'am': `You are a social media expert writing in AMHARIC. Make polls engaging and exciting. Write the entire response in Amharic script only.`,
        'sw': `You are a social media expert writing in SWAHILI. Make polls engaging and exciting. Write the entire response in Swahili only.`
      };

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
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
        max_tokens: 600,
        temperature: 0.8 // Higher creativity for polls
      });

      const enhancedContent = response.choices[0]?.message?.content?.trim();
      
      if (enhancedContent) {
        console.log(`✅ AI enhanced poll content in ${language}`);
        return enhancedContent;
      }
      
    } catch (error) {
      console.error('❌ Error enhancing poll content with AI:', error);
    }
    
    return this.enhancePollContentManually(content, analysis, language);
  }

  // Helper methods (simplified for space - full implementations would include all methods)
  private calculateFormBonus(form: string): number {
    const wins = (form.match(/W/g) || []).length;
    const losses = (form.match(/L/g) || []).length;
    return (wins - losses) * 3;
  }

  private determineTacticalEdge(homeStats: any, awayStats: any): 'HOME' | 'AWAY' | 'NEUTRAL' {
    const homeStrength = (homeStats.winRate || 50) + 10; // Home advantage
    const awayStrength = awayStats.winRate || 50;
    
    if (homeStrength > awayStrength + 15) return 'HOME';
    if (awayStrength > homeStrength + 5) return 'AWAY';
    return 'NEUTRAL';
  }

  private generateRealisticForm(): string {
    const results = ['W', 'D', 'L'];
    let form = '';
    for (let i = 0; i < 5; i++) {
      form += results[Math.floor(Math.random() * results.length)];
    }
    return form;
  }

  private generateFunFact(analysis: EnhancedPollAnalysis): string {
    const facts = [
      `${analysis.homeTeam} has a ${analysis.teamComparison.surpriseFactor}% upset potential factor`,
      `These teams have met ${analysis.headToHead.recentMeetings} times recently`,
      `The tactical edge slightly favors ${analysis.teamComparison.tacticalEdge === 'HOME' ? analysis.homeTeam : analysis.teamComparison.tacticalEdge === 'AWAY' ? analysis.awayTeam : 'neither team'}`,
      `This match has ${analysis.matchImportance} importance rating`
    ];
    return facts[Math.floor(Math.random() * facts.length)];
  }

  private generateTacticalInsight(analysis: EnhancedPollAnalysis): string {
    return `The tactical battle between ${analysis.homeTeam} and ${analysis.awayTeam} will likely be decided by ${analysis.teamComparison.keyFactors[0]}`;
  }

  private generatePlayerFact(formAnalysis: any): string {
    return `Key players to watch include the form of both teams' creative forces and defensive leaders`;
  }

  private generateUpsetFact(analysis: EnhancedPollAnalysis): string {
    return `With a ${analysis.teamComparison.surpriseFactor}% surprise factor, this match has decent upset potential`;
  }

  private generateDramaFact(analysis: EnhancedPollAnalysis): string {
    return `${analysis.narrativeElements.rivalryLevel} rivalry level suggests ${analysis.narrativeElements.rivalryLevel === 'INTENSE' ? 'high drama' : 'moderate excitement'}`;
  }

  private generateScenarioFact(analysis: EnhancedPollAnalysis): string {
    return `Based on both teams' adaptability, ${analysis.teamComparison.tacticalEdge === 'NEUTRAL' ? 'either team could handle surprises well' : 'one team might adapt better to changes'}`;
  }

  private enhancePollContentManually(content: string, analysis: EnhancedPollAnalysis, language: 'en' | 'am' | 'sw'): string {
    const languageHashtags = {
      'en': `#PollTime #Football #MatchPrediction #${analysis.homeTeam.replace(/\s+/g, '')}vs${analysis.awayTeam.replace(/\s+/g, '')} #Interactive`,
      'am': `#የሕዝብፈተናጊዜ #እግርኳስ #PollTime #Football #Interactive`,
      'sw': `#WakatiUliza #MpiraMiguu #PollTime #Football #Interactive`
    };
    
    const engagementText = {
      'en': '🔥 Vote now and see live results! Your opinion matters! ⚽',
      'am': '🔥 አሁን ድምጽ ይስጡ እና ቀጥታ ውጤቶችን ይመልከቱ! የእርስዎ አስተያየት ይቆጠራል! ⚽',
      'sw': '🔥 Piga kura sasa na uone matokeo ya moja kwa moja! Maoni yako yanahitajika! ⚽'
    };
    
    return `${content}\n\n${engagementText[language]}\n\n${languageHashtags[language]}`;
  }

  private generateFallbackPoll(analysis: EnhancedPollAnalysis, pollType: PollType, language: 'en' | 'am' | 'sw'): EnhancedPollContent {
    return {
      telegramPoll: {
        question: `${analysis.homeTeam} vs ${analysis.awayTeam} - Your prediction?`,
        options: [
          { text: analysis.homeTeam },
          { text: 'Draw' },
          { text: analysis.awayTeam }
        ],
        is_anonymous: true,
        type: 'regular',
        allows_multiple_answers: false
      },
      introText: `Football poll`,
      analysisText: `Cast your vote`,
      engagementText: `Vote now!`,
      pollType,
      difficulty: 'EASY',
      expectedEngagement: 'MEDIUM',
      educationalValue: 'LOW',
      viralPotential: 'MEDIUM'
    };
  }

  // Continue with remaining methods...
  private buildBasicPollContent(pollContent: EnhancedPollContent, analysis: EnhancedPollAnalysis, language: 'en' | 'am' | 'sw'): string {
    return `📊 ${pollContent.introText}\n\n${pollContent.engagementText}`;
  }

  private calculateEngagementScore(pollContent: EnhancedPollContent, analysis: EnhancedPollAnalysis): number {
    let score = 50; // Base score
    
    if (pollContent.expectedEngagement === 'HIGH') score += 30;
    else if (pollContent.expectedEngagement === 'MEDIUM') score += 15;
    
    if (analysis.matchImportance === 'HIGH') score += 20;
    else if (analysis.matchImportance === 'MEDIUM') score += 10;
    
    if (pollContent.viralPotential === 'HIGH') score += 15;
    
    return Math.min(100, score);
  }

  private calculateEducationalScore(pollContent: EnhancedPollContent): number {
    let score = 30; // Base score
    
    if (pollContent.educationalValue === 'HIGH') score += 40;
    else if (pollContent.educationalValue === 'MEDIUM') score += 20;
    
    if (pollContent.difficulty === 'HARD') score += 20;
    else if (pollContent.difficulty === 'MEDIUM') score += 10;
    
    if (pollContent.telegramPoll.type === 'quiz') score += 15;
    
    return Math.min(100, score);
  }

  private estimateParticipants(engagement: string, importance: string): number {
    let base = 100;
    
    if (engagement === 'HIGH') base += 200;
    else if (engagement === 'MEDIUM') base += 100;
    
    if (importance === 'HIGH') base += 150;
    else if (importance === 'MEDIUM') base += 75;
    
    return base + Math.floor(Math.random() * 100);
  }

  // Placeholder methods for helper functions that generate content
  private generateMemorableMoments(meetings: any[], homeTeam: string, awayTeam: string): string[] {
    if (meetings.length === 0) return ['This will be their first meeting!'];
    
    return [
      `Last meeting: ${meetings[0].match_hometeam_score}-${meetings[0].match_awayteam_score}`,
      `${meetings.length} recent encounters`,
      'Competitive history between these sides'
    ];
  }

  private analyzeHomeAdvantageNarrative(homeWins: number, awayWins: number, draws: number, homeTeam: string, awayTeam: string): string {
    if (homeWins > awayWins + draws) return `${homeTeam} dominates at home in this fixture`;
    if (awayWins > homeWins + draws) return `${awayTeam} surprisingly strong away in this matchup`;
    return 'Historically very competitive between these teams';
  }

  private analyzeGoalTrendsNarrative(avgGoals: number, meetings: any[]): string {
    if (avgGoals > 3) return 'These teams produce goal-filled encounters';
    if (avgGoals < 2) return 'Tight, low-scoring affairs typical';
    return 'Moderate goal expectation based on history';
  }

  private analyzeCompetitiveBalanceNarrative(homeWins: number, awayWins: number, draws: number): string {
    const total = homeWins + awayWins + draws;
    if (draws / total > 0.4) return 'Draw-heavy rivalry - very evenly matched';
    if (Math.abs(homeWins - awayWins) <= 1) return 'Extremely competitive head-to-head record';
    return 'One team has historical edge but margins are close';
  }

  private determineMomentumNarrative(homeForm: string, awayForm: string): string {
    const homeWins = (homeForm.match(/W/g) || []).length;
    const awayWins = (awayForm.match(/W/g) || []).length;
    
    if (homeWins > awayWins + 1) return 'Home team riding high with superior recent form';
    if (awayWins > homeWins + 1) return 'Away team has momentum advantage';
    return 'Both teams in similar form - momentum fairly even';
  }

  private generateKeyPlayersWithForm(analysis: any, isHome: boolean): Array<{ name: string; role: string; form: string }> {
    const positions = ['Forward', 'Midfielder', 'Defender'];
    const names = ['Star Player', 'Key Man', 'Leader'];
    const forms = ['Excellent', 'Good', 'Average'];
    
    return positions.map((pos, index) => ({
      name: names[index],
      role: pos,
      form: forms[Math.floor(Math.random() * forms.length)]
    }));
  }

  private generateInjuries(isHome: boolean): string[] {
    if (Math.random() < 0.7) return []; // 70% chance no injuries
    return [`${isHome ? 'Home' : 'Away'} Squad Player (minor knock)`];
  }

  private generateSuspensions(): string[] {
    if (Math.random() < 0.85) return []; // 85% chance no suspensions
    return ['Squad Player (yellow card accumulation)'];
  }

  private generateWeatherConditions(): string {
    const conditions = ['Clear and sunny', 'Partly cloudy', 'Light rain expected', 'Overcast conditions'];
    return conditions[Math.floor(Math.random() * conditions.length)];
  }

  private determineRefereeInfluence(): 'HIGH' | 'MEDIUM' | 'LOW' {
    const influences = ['HIGH', 'MEDIUM', 'LOW'] as const;
    return influences[Math.floor(Math.random() * influences.length)];
  }

  private determineMediaAttention(competition: string): 'HIGH' | 'MEDIUM' | 'LOW' {
    const highProfile = ['Premier League', 'Champions League', 'Europa League'];
    return highProfile.some(comp => competition.includes(comp)) ? 'HIGH' : 'MEDIUM';
  }

  private determineStakes(match: any): string[] {
    return [
      'Three points at stake',
      'League position implications',
      'Team confidence and momentum',
      'Fan expectations and pride'
    ];
  }

  private generateMainStoryline(match: any, teamComparison: any): string {
    return `${match.homeTeam.name} welcome ${match.awayTeam.name} in what promises to be a ${teamComparison.surpriseFactor > 60 ? 'unpredictable' : 'competitive'} encounter`;
  }

  private generateSubPlots(teamComparison: any, headToHead: any): string[] {
    return [
      'Form vs class debate',
      'Home advantage factor',
      'Key player battles',
      'Tactical chess match'
    ];
  }

  private determineRivalryLevel(headToHead: any): 'INTENSE' | 'MODERATE' | 'MILD' | 'NONE' {
    if (headToHead.recentMeetings === 0) return 'NONE';
    if (headToHead.recentMeetings > 8) return 'INTENSE';
    if (headToHead.recentMeetings > 4) return 'MODERATE';
    return 'MILD';
  }

  private generateFanExpectations(probability: number, isHome: boolean): string {
    if (probability > 60) return isHome ? 'Confident of home victory' : 'Optimistic about away success';
    if (probability > 40) return isHome ? 'Cautiously optimistic' : 'Hopeful for good result';
    return isHome ? 'Hoping for the best' : 'Would take a point';
  }

  private identifyPressurePoints(match: any, teamComparison: any): string[] {
    return [
      'Early goal could be crucial',
      'Set piece situations',
      'Individual battles',
      'Bench impact potential'
    ];
  }

  private determineMatchImportance(competition: string, teamComparison: any): 'HIGH' | 'MEDIUM' | 'LOW' {
    const highImportance = ['Premier League', 'Champions League', 'Europa League', 'World Cup'];
    if (highImportance.some(comp => competition.includes(comp))) return 'HIGH';
    if (teamComparison.surpriseFactor > 70) return 'HIGH'; // High upset potential
    return 'MEDIUM';
  }

  private identifyTeamStrengths(stats: any, isHome: boolean): string[] {
    const strengths = [];
    
    if ((stats.goalsFor || 25) > 30) strengths.push('Clinical attack');
    if ((stats.goalsAgainst || 20) < 15) strengths.push('Solid defense');
    if ((stats.winRate || 50) > 60) strengths.push('Winning mentality');
    if (isHome) strengths.push('Home support');
    
    return strengths.length > 0 ? strengths : ['Team spirit', 'Fighting quality'];
  }

  // Continue with remaining poll generation methods...
  private generateScorePredictionPoll(analysis: EnhancedPollAnalysis, language: 'en' | 'am' | 'sw'): EnhancedPollContent {
    // Implementation would follow same pattern as match prediction poll
    return this.generateFallbackPoll(analysis, 'score_prediction', language);
  }

  private generateGoalscorerPoll(analysis: EnhancedPollAnalysis, language: 'en' | 'am' | 'sw'): EnhancedPollContent {
    return this.generateFallbackPoll(analysis, 'goalscorer_prediction', language);
  }

  private generateMatchEventsPoll(analysis: EnhancedPollAnalysis, language: 'en' | 'am' | 'sw'): EnhancedPollContent {
    return this.generateFallbackPoll(analysis, 'match_events', language);
  }

  private generateFanOpinionPoll(analysis: EnhancedPollAnalysis, language: 'en' | 'am' | 'sw'): EnhancedPollContent {
    return this.generateFallbackPoll(analysis, 'fan_opinion', language);
  }

  private generateComparisonPoll(analysis: EnhancedPollAnalysis, language: 'en' | 'am' | 'sw'): EnhancedPollContent {
    return this.generateFallbackPoll(analysis, 'comparison', language);
  }

  private generateTriviaPoll(analysis: EnhancedPollAnalysis, language: 'en' | 'am' | 'sw'): EnhancedPollContent {
    return this.generateFallbackPoll(analysis, 'trivia', language);
  }

  private generateHistoricalTriviaPoll(analysis: EnhancedPollAnalysis, language: 'en' | 'am' | 'sw'): EnhancedPollContent {
    return this.generateFallbackPoll(analysis, 'historical_trivia', language);
  }

  private generateMomentumCheckPoll(analysis: EnhancedPollAnalysis, language: 'en' | 'am' | 'sw'): EnhancedPollContent {
    return this.generateFallbackPoll(analysis, 'momentum_check', language);
  }

  // Remaining methods would continue with same pattern...

  private createTelegramPollPayload(pollContent: EnhancedPollContent, request: PollGenerationRequest): TelegramPollConfig {
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

  private async generatePollImage(analysis: EnhancedPollAnalysis, pollType: PollType): Promise<string | undefined> {
    // Polls don't need images - skip image generation to save API calls
    return undefined;
  }

  private async trackPollCreation(analysis: EnhancedPollAnalysis, pollType: PollType, channelId: string): Promise<void> {
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
        console.error(`❌ Error tracking poll creation:`, error);
      }
    } catch (error) {
      console.error(`❌ Error in trackPollCreation:`, error);
    }
  }

  // Public API methods
  async getPollOpportunities(language: 'en' | 'am' | 'sw' = 'en', limit: number = 3): Promise<GeneratedPoll[]> {
    const polls: GeneratedPoll[] = [];
    
    try {
      const pollTypes: PollType[] = ['match_prediction', 'tactical_analysis', 'surprise_factor'];
      
      for (let i = 0; i < limit; i++) {
        const poll = await this.generatePoll({
          language,
          channelId: `demo_channel_${i}`,
          pollType: pollTypes[i % pollTypes.length],
          creativityLevel: 'high',
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

  /**
   * 🌐 Translate key factors to target language for pure language content
   */
  private translateKeyFactors(factors: string[], language: 'en' | 'am' | 'sw' | 'fr' | 'ar'): string[] {
    const translations: Record<string, Record<'en' | 'am' | 'sw' | 'fr' | 'ar', string>> = {
      'Recent form momentum': {
        en: 'Recent form momentum',
        am: 'የቅርብ ጊዜ የአፈፃፀም ሁኔታ',
        sw: 'Mtiririko wa hivi karibuni',
        fr: 'Dynamique de forme récente',
        ar: 'زخم الأداء الأخير'
      },
      'Head-to-head psychological edge': {
        en: 'Head-to-head psychological edge',
        am: 'የአእምሮአዊ የበላይነት',
        sw: 'Ubingwa wa kisaikolojia',
        fr: 'Avantage psychologique direct',
        ar: 'التفوق النفسي المباشر'
      },
      'Home crowd support': {
        en: 'Home crowd support',
        am: 'የቤት ተቀጃጅ ድጋፍ',
        sw: 'Uongozi wa umati wa nyumbani',
        fr: 'Soutien du public à domicile',
        ar: 'دعم الجمهور المحلي'
      },
      'Key player availability': {
        en: 'Key player availability',
        am: 'የቁልፍ ተጫዋቾች መገኘት',
        sw: 'Upatikanaji wa wachezaji muhimu',
        fr: 'Disponibilité des joueurs clés',
        ar: 'توفر اللاعبين الأساسيين'
      },
      'Tactical matchup advantages': {
        en: 'Tactical matchup advantages',
        am: 'የስትራቴጂ የበላይነት',
        sw: 'Faida za mkabala wa kitaktiki',
        fr: 'Avantages tactiques',
        ar: 'المزايا التكتيكية'
      }
    };

    return factors.map(factor => {
      if (translations[factor] && translations[factor][language]) {
        return translations[factor][language];
      }
      // Fallback: if translation not found, return in target language format
      return factor; // In production, this should not happen
    });
  }
}

// Export singleton instance
export const pollsGenerator = new PollsGenerator();