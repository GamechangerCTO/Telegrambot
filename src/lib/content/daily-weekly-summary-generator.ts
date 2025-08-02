/**
 * 📅 DAILY & WEEKLY SUMMARY GENERATOR
 * 
 * Daily Flow: Find interesting matches from today → Analyze importance → Generate comprehensive summary
 * Weekly Flow: Summarize past week results → Analyze trends → Plan next week preview
 * 
 * Key features:
 * - Intelligent match interest detection and scoring
 * - Comprehensive daily football roundups
 * - Weekly analysis with trends and next week planning
 * - Multi-league and competition support
 * - Automated scheduling and timing
 * - Rich statistical analysis and insights
 */

import { unifiedFootballService } from './unified-football-service';
import { rssNewsFetcher } from './rss-news-fetcher';
import { aiImageGenerator } from './ai-image-generator';
import { supabase } from '@/lib/supabase';
import { getOpenAIClient } from '../api-keys';

export interface MatchResult {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  competition: string;
  date: string;
  venue: string;
  status: 'finished' | 'live' | 'scheduled';
  
  // Analysis data
  interestScore: number;
  significance: string;
  keyMoments: string[];
  standoutPerformances: string[];
}

export interface DailyInterestingMatch {
  match: MatchResult;
  interestFactors: string[];
  highlightReason: string;
  audienceAppeal: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface DailySummaryData {
  date: string;
  
  // Main content sections
  interestingMatches: DailyInterestingMatch[];
  standoutPerformances: {
    playerOfDay?: string;
    goalOfDay?: string;
    saveOfDay?: string;
    upsetOfDay?: string;
  };
  
  // Statistical overview
  statistics: {
    totalMatches: number;
    totalGoals: number;
    biggestWin: { teams: string; score: string };
    surpriseResults: MatchResult[];
    disciplinaryActions: {
      redCards: number;
      yellowCards: number;
    };
  };
  
  // News integration
  keyStorylines: Array<{
    headline: string;
    source: string;
    summary: string;
    relevance: number;
  }>;
  
  // Looking ahead
  tomorrowsFixtures: MatchResult[];
  weekendPreview?: string; // If it's Friday
}

export interface WeeklySummaryData {
  weekStart: string;
  weekEnd: string;
  
  // Past week recap
  weeklyResults: {
    topMatches: MatchResult[];
    leagueHighlights: Array<{
      league: string;
      keyResults: MatchResult[];
      tableMovements: string[];
      storylines: string[];
    }>;
  };
  
  // Statistical analysis
  weeklyStats: {
    totalMatches: number;
    totalGoals: number;
    averageGoalsPerMatch: number;
    mostGoals: { match: string; goals: number };
    cleanSheets: number;
    redCards: number;
    biggestUpsets: MatchResult[];
  };
  
  // Trends and insights
  trends: {
    teamOfTheWeek: string;
    playerOfTheWeek: string;
    formGuide: Array<{
      team: string;
      form: string;
      trend: 'up' | 'down' | 'stable';
    }>;
    emergingStories: string[];
  };
  
  // Next week planning
  nextWeekPreview: {
    keyFixtures: MatchResult[];
    fixturesByDay: { [day: string]: MatchResult[] };
    matchesToWatch: Array<{
      match: MatchResult;
      whyWatch: string;
      importance: 'HIGH' | 'MEDIUM' | 'LOW';
    }>;
    weeklyPredictions: string[];
  };
}

export interface SummaryGenerationRequest {
  type: 'daily' | 'weekly';
  language: 'en' | 'am' | 'sw';
  channelId: string;
  targetDate?: string; // For specific date summaries
  leagues?: string[]; // Focus on specific leagues
  timezone?: string; // For proper scheduling
}

export interface ChannelButtonConfig {
  main_website: string;
  betting_platform: string;
  live_scores: string;
  news_source: string;
  social_media: {
    telegram: string;
    twitter: string;
    facebook: string;
    instagram: string;
    youtube: string;
    tiktok: string;
  };
  affiliate_codes: {
    betting: string;
    bookmaker: string;
    casino: string;
  };
  channel_settings: {
    enable_betting_links: boolean;
    enable_affiliate_links: boolean;
    enable_social_sharing: boolean;
    enable_custom_buttons: boolean;
    custom_website: string;
  };
  custom_buttons: Array<{
    text: string;
    type: 'url' | 'callback' | 'switch_inline';
    data: string;
    enabled: boolean;
  }>;
}

export interface GeneratedSummary {
  title: string;
  content: string;
  imageUrl?: string;
  summaryData: DailySummaryData | WeeklySummaryData;
  aiEditedContent?: string;
  visualElements: {
    tables?: string[];
    charts?: string[];
    highlights?: string[];
  };
  telegramEnhancements?: {
    protectContent: boolean;
    enableShareButton: boolean;
    enableWebApp: boolean;
    priority: 'high' | 'medium' | 'low';
    inlineKeyboard: Array<Array<{
      text: string;
      callback_data?: string;
      switch_inline_query?: string;
      url?: string;
    }>>;
    messageThreadId?: number;
    disableWebPagePreview: boolean;
    parseMode: 'HTML' | 'Markdown' | 'MarkdownV2';
    replyMarkup: 'inline_keyboard' | 'reply_keyboard' | 'none';
  };
  metadata: {
    type: 'daily' | 'weekly';
    language: string;
    generatedAt: string;
    contentId: string;
    coverageScope: string;
    wordCount: number;
  };
}

export class DailyWeeklySummaryGenerator {

  /**
   * 🔗 Fetch channel button configuration
   */
  private async fetchChannelButtonConfig(channelId: string): Promise<ChannelButtonConfig | null> {
    try {
      // First try to get real channel ID from database
      const { data: channelData } = await supabase
        .from('channels')
        .select('id')
        .eq('id', channelId)
        .single();

      if (!channelData) {
        console.log(`⚠️ Channel ${channelId} not found, using default button config`);
        return null;
      }

      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      const response = await fetch(`${baseUrl}/api/channels/${channelId}/button-links`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.log(`⚠️ Failed to fetch button config for channel ${channelId}`);
        return null;
      }

      const result = await response.json();
      if (result.success && result.buttonConfig) {
        console.log(`✅ Fetched button config for channel ${channelId}`);
        return result.buttonConfig;
      }

      return null;
    } catch (error) {
      console.error(`❌ Error fetching button config for channel ${channelId}:`, error);
      return null;
    }
  }

  /**
   * 🎯 Generate dynamic inline keyboard from channel config
   */
  private generateChannelInlineKeyboard(buttonConfig: ChannelButtonConfig | null, summaryData: DailySummaryData | WeeklySummaryData, type: 'daily' | 'weekly'): Array<Array<any>> {
    const keyboard: Array<Array<any>> = [];

    if (!buttonConfig || !buttonConfig.channel_settings.enable_custom_buttons) {
      // Default fallback buttons
      if (type === 'daily') {
        const dailyData = summaryData as DailySummaryData;
        return [
          [
            { text: '📊 Full Stats', callback_data: `stats_${dailyData.date}` },
            { text: '⚽ Top Goals', callback_data: `goals_${dailyData.date}` }
          ],
          [
            { text: '🔥 Match Highlights', callback_data: `highlights_${dailyData.date}` },
            { text: '🏆 League Tables', callback_data: `tables_${dailyData.date}` }
          ],
          [
            { text: '📱 Share Summary', switch_inline_query: `daily_summary_${dailyData.date}` }
          ]
        ];
      } else {
        const weeklyData = summaryData as WeeklySummaryData;
        return [
          [
            { text: '📈 Week Stats', callback_data: `week_stats_${weeklyData.weekStart}` },
            { text: '🏆 Team Rankings', callback_data: `rankings_${weeklyData.weekStart}` }
          ],
          [
            { text: '🔮 Next Week', callback_data: `next_week_${weeklyData.weekStart}` },
            { text: '📊 Form Guide', callback_data: `form_${weeklyData.weekStart}` }
          ],
          [
            { text: '📱 Share Weekly Review', switch_inline_query: `weekly_review_${weeklyData.weekStart}` }
          ]
        ];
      }
    }

    // Use custom buttons from channel configuration
    const enabledButtons = buttonConfig.custom_buttons.filter(btn => btn.enabled);
    
    // Group buttons into rows (max 2 per row)
    for (let i = 0; i < enabledButtons.length; i += 2) {
      const row = [];
      
      for (let j = 0; j < 2 && i + j < enabledButtons.length; j++) {
        const button = enabledButtons[i + j];
        const buttonData: any = { text: button.text };
        
        if (button.type === 'url') {
          buttonData.url = button.data;
        } else if (button.type === 'callback') {
          buttonData.callback_data = button.data;
        } else if (button.type === 'switch_inline') {
          buttonData.switch_inline_query = button.data;
        }
        
        row.push(buttonData);
      }
      
      if (row.length > 0) {
        keyboard.push(row);
      }
    }

    // Add social media row if enabled
    if (buttonConfig.channel_settings.enable_social_sharing) {
      const socialRow = [];
      
      if (buttonConfig.social_media.facebook) {
        socialRow.push({ text: '🔵 Facebook', url: buttonConfig.social_media.facebook });
      }
      if (buttonConfig.social_media.twitter) {
        socialRow.push({ text: '🐦 Twitter', url: buttonConfig.social_media.twitter });
      }
      
      if (socialRow.length > 0) {
        keyboard.push(socialRow);
      }

      // Second social row
      const socialRow2 = [];
      if (buttonConfig.social_media.instagram) {
        socialRow2.push({ text: '📸 Instagram', url: buttonConfig.social_media.instagram });
      }
      if (buttonConfig.social_media.telegram) {
        socialRow2.push({ text: '📱 Channel', url: buttonConfig.social_media.telegram });
      }
      
      if (socialRow2.length > 0) {
        keyboard.push(socialRow2);
      }
    }

    // Add main website button if available
    if (buttonConfig.main_website) {
      keyboard.push([
        { text: '🌐 Visit Website', url: buttonConfig.main_website }
      ]);
    }

    return keyboard;
  }

  /**
   * 📅 MAIN FUNCTION - Generate daily or weekly summary
   */
  async generateSummary(request: SummaryGenerationRequest): Promise<GeneratedSummary | null> {
    console.log(`📅 Generating ${request.type} summary in ${request.language}`);
    
    try {
      if (request.type === 'daily') {
        return await this.generateDailySummary(request);
      } else {
        return await this.generateWeeklySummary(request);
      }
    } catch (error) {
      console.error(`❌ Error generating ${request.type} summary:`, error);
      return null;
    }
  }

  /**
   * 📅 Generate daily summary with interesting matches
   */
  private async generateDailySummary(request: SummaryGenerationRequest): Promise<GeneratedSummary | null> {
    console.log(`📅 Generating daily summary for ${request.targetDate || 'today'}`);

    // Step 1: Get today's matches and results
    const todaysMatches = await this.getTodaysMatches(request.targetDate);
    if (todaysMatches.length === 0) {
      console.log(`❌ No matches found for daily summary`);
      return null;
    }

    // Step 2: Find and score interesting matches
    const interestingMatches = await this.findInterestingMatches(todaysMatches, 4, request.language);
    
    // Step 3: Get standout performances and statistics
    const standoutPerformances = await this.analyzeStandoutPerformances(todaysMatches);
    const dailyStats = await this.calculateDailyStatistics(todaysMatches);
    
    // Step 4: Get tomorrow's fixtures (NO RSS NEWS!)
    const tomorrowsFixtures = await this.getTomorrowsFixtures(request.targetDate);
    
    // Step 5: Build daily summary data (without news storylines)
    const summaryData: DailySummaryData = {
      date: request.targetDate || new Date().toISOString().split('T')[0],
      interestingMatches,
      standoutPerformances,
      statistics: dailyStats,
      keyStorylines: [], // Empty - no RSS news needed for daily summary
      tomorrowsFixtures,
      weekendPreview: this.isWeekendPreviewDay() ? await this.generateWeekendPreview() : undefined
    };

    // Step 6: Fetch channel button configuration
    const buttonConfig = await this.fetchChannelButtonConfig(request.channelId);
    console.log(`🔗 Button config fetched for channel ${request.channelId}:`, buttonConfig ? 'Found' : 'Using defaults');

    // Step 7: Generate content and visuals
    const { content, aiEditedContent } = await this.generateDailyContent(summaryData, request);
    const imageUrl = await this.generateDailySummaryImage(summaryData);
    const visualElements = await this.generateDailyVisualElements(summaryData);

    return {
      title: `📅 Daily Football Roundup - ${new Date(summaryData.date).toLocaleDateString()}`,
      content,
      imageUrl,
      summaryData,
      aiEditedContent,
      visualElements,
      telegramEnhancements: {
        protectContent: false,
        enableShareButton: true,
        enableWebApp: true,
        priority: 'high',
        inlineKeyboard: this.generateChannelInlineKeyboard(buttonConfig, summaryData, 'daily'),
        messageThreadId: undefined,
        disableWebPagePreview: false,
        parseMode: 'HTML',
        replyMarkup: 'inline_keyboard'
      },
      metadata: {
        type: 'daily',
        language: request.language,
        generatedAt: new Date().toISOString(),
        contentId: `daily_summary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        coverageScope: `${todaysMatches.length} matches analyzed`,
        wordCount: content.split(' ').length
      }
    };
  }

  /**
   * 📊 Generate weekly summary with past week and next week planning
   */
  private async generateWeeklySummary(request: SummaryGenerationRequest): Promise<GeneratedSummary | null> {
    console.log(`📊 Generating weekly summary`);

    const weekStart = this.getWeekStart(request.targetDate);
    const weekEnd = this.getWeekEnd(weekStart);

    // Step 1: Get past week's matches and results
    const weeklyMatches = await this.getWeeklyMatches(weekStart, weekEnd);
    if (weeklyMatches.length === 0) {
      console.log(`❌ No matches found for weekly summary`);
      return null;
    }

    // Step 2: Find top 10 interesting matches from the week
    const topWeeklyMatches = await this.findInterestingMatches(weeklyMatches, 10, request.language);
    const topWeeklyMatchesRaw = topWeeklyMatches.map(m => m.match);

    // Step 3: Analyze weekly results by league
    const weeklyResults = await this.analyzeWeeklyResults(topWeeklyMatchesRaw);
    
    // Step 4: Calculate weekly statistics and trends
    const weeklyStats = await this.calculateWeeklyStatistics(weeklyMatches);
    const trends = await this.analyzeWeeklyTrends(weeklyMatches);
    
    // Step 5: Generate next week preview
    const nextWeekPreview = await this.generateNextWeekPreview(weekEnd);

    // Step 6: Build weekly summary data
    const summaryData: WeeklySummaryData = {
      weekStart,
      weekEnd,
      weeklyResults,
      weeklyStats,
      trends,
      nextWeekPreview
    };

    // Step 7: Fetch channel button configuration
    const buttonConfig = await this.fetchChannelButtonConfig(request.channelId);
    console.log(`🔗 Button config fetched for weekly summary channel ${request.channelId}:`, buttonConfig ? 'Found' : 'Using defaults');

    // Step 8: Generate content and visuals
    const { content, aiEditedContent } = await this.generateWeeklyContent(summaryData, request);
    const imageUrl = await this.generateWeeklySummaryImage(summaryData);
    const visualElements = await this.generateWeeklyVisualElements(summaryData);

    return {
      title: `📊 Weekly Football Review - Week of ${new Date(weekStart).toLocaleDateString()}`,
      content,
      imageUrl,
      summaryData,
      aiEditedContent,
      visualElements,
      telegramEnhancements: {
        protectContent: false,
        enableShareButton: true,
        enableWebApp: true,
        priority: 'high',
        inlineKeyboard: this.generateChannelInlineKeyboard(buttonConfig, summaryData, 'weekly'),
        messageThreadId: undefined,
        disableWebPagePreview: false,
        parseMode: 'HTML',
        replyMarkup: 'inline_keyboard'
      },
      metadata: {
        type: 'weekly',
        language: request.language,
        generatedAt: new Date().toISOString(),
        contentId: `weekly_summary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        coverageScope: `${weeklyMatches.length} matches from ${Object.keys(weeklyResults.leagueHighlights).length} leagues`,
        wordCount: content.split(' ').length
      }
    };
  }

  /**
   * 🔍 Step 2: Find and score interesting matches from today
   */
  private async findInterestingMatches(matches: MatchResult[], maxMatches: number = 4, language: 'en' | 'am' | 'sw' = 'en'): Promise<DailyInterestingMatch[]> {
    console.log(`🔍 Analyzing ${matches.length} matches for interest level (top ${maxMatches})`);

    const scoredMatches = matches.map(match => {
      const interestScore = this.calculateMatchInterestScore(match);
      const interestFactors = this.getMatchInterestFactors(match);
      const highlightReason = this.getMatchHighlightReason(match, interestFactors, language);
      const audienceAppeal = this.determineAudienceAppeal(interestScore);

      // Update the match object with the calculated interest score
      match.interestScore = interestScore;
      match.significance = highlightReason;

      return {
        match,
        interestFactors,
        highlightReason,
        audienceAppeal,
        score: interestScore
      };
    }).sort((a, b) => b.score - a.score);

    // Return top interesting matches based on maxMatches parameter
    return scoredMatches.slice(0, maxMatches).map(({ score, ...rest }) => rest);
  }

  /**
   * 📊 Calculate match interest score (0-100)
   */
  private calculateMatchInterestScore(match: MatchResult): number {
    let score = 0;

    // Competition importance
    if (match.competition.includes('Premier League')) score += 25;
    else if (match.competition.includes('Champions League')) score += 30;
    else if (match.competition.includes('Europa League')) score += 20;
    else if (match.competition.includes('FA Cup')) score += 15;
    else score += 10;

    // Score differential (closer games are more interesting)
    const scoreDiff = Math.abs(match.homeScore - match.awayScore);
    if (scoreDiff === 0) score += 20; // Draw
    else if (scoreDiff === 1) score += 15; // Close game
    else if (scoreDiff === 2) score += 10; // Decent margin
    else if (scoreDiff >= 4) score += 15; // Thrashing/upset

    // Total goals (exciting games)
    const totalGoals = match.homeScore + match.awayScore;
    if (totalGoals >= 5) score += 20; // High-scoring
    else if (totalGoals >= 3) score += 15; // Good attacking game
    else if (totalGoals === 0) score += 10; // Defensive battle

    // Team prominence (simplified - would use real team rankings)
    const bigTeams = ['Manchester City', 'Arsenal', 'Liverpool', 'Chelsea', 'Manchester United', 'Tottenham', 'Real Madrid', 'Barcelona'];
    const homeIsBig = bigTeams.some(team => match.homeTeam.includes(team));
    const awayIsBig = bigTeams.some(team => match.awayTeam.includes(team));
    
    if (homeIsBig && awayIsBig) score += 25; // Big team clash
    else if (homeIsBig || awayIsBig) score += 15; // One big team
    
    // Upset potential (big team losing)
    if (homeIsBig && match.homeScore < match.awayScore) score += 20; // Home upset
    if (awayIsBig && match.awayScore < match.homeScore) score += 15; // Away upset

    // Status bonus
    if (match.status === 'live') score += 10; // Live games more interesting

    return Math.min(100, Math.max(0, score));
  }

  /**
   * 🎯 Get match interest factors
   */
  private getMatchInterestFactors(match: MatchResult): string[] {
    const factors = [];
    const scoreDiff = Math.abs(match.homeScore - match.awayScore);
    const totalGoals = match.homeScore + match.awayScore;

    // Competition factor
    if (match.competition.includes('Champions League')) factors.push('European elite competition');
    if (match.competition.includes('Premier League')) factors.push('Top-flight domestic action');

    // Score factors
    if (scoreDiff === 0) factors.push('Thrilling draw');
    if (scoreDiff >= 4) factors.push('Goal fest');
    if (totalGoals >= 5) factors.push('High-scoring encounter');
    if (totalGoals === 0) factors.push('Defensive masterclass');

    // Team factors
    const bigTeams = ['City', 'Arsenal', 'Liverpool', 'Chelsea', 'United'];
    const homeIsBig = bigTeams.some(team => match.homeTeam.includes(team));
    const awayIsBig = bigTeams.some(team => match.awayTeam.includes(team));
    
    if (homeIsBig && awayIsBig) factors.push('Big team clash');
    if (homeIsBig && match.homeScore < match.awayScore) factors.push('Shocking upset');
    if (awayIsBig && match.awayScore < match.homeScore) factors.push('Away day upset');

    // Special circumstances
    if (match.keyMoments.length > 0) factors.push('Dramatic moments');
    if (match.standoutPerformances.length > 0) factors.push('Individual brilliance');

    return factors.length > 0 ? factors : ['Competitive fixture'];
  }

  /**
   * 💫 Get match highlight reason
   */
  private getMatchHighlightReason(match: MatchResult, factors: string[], language: 'en' | 'am' | 'sw' = 'en'): string {
    const totalGoals = match.homeScore + match.awayScore;
    const scoreDiff = Math.abs(match.homeScore - match.awayScore);

    // Language-specific templates
    const templates = {
      en: {
        upset: `Major upset as ${match.homeScore > match.awayScore ? match.homeTeam : match.awayTeam} pulled off a surprise victory`,
        goalThriller: `Goal thriller with ${totalGoals} goals in an entertaining ${match.homeScore}-${match.awayScore} result`,
        draw: `Evenly matched teams battled to a ${match.homeScore}-${match.awayScore} draw`,
        bigClash: `High-profile clash between two top teams delivered quality football`,
        default: `${match.competition} fixture provided competitive action`
      },
      am: {
        upset: `የሚያስደንቅ ስኬት - ${match.homeScore > match.awayScore ? match.homeTeam : match.awayTeam} ከእጅ ያልተጠበቀ ድል አስመዘገበ`,
        goalThriller: `${totalGoals} ጎሎች ያሉት አስደሳች ${match.homeScore}-${match.awayScore} ውጤት`,
        draw: `እኩል ተጫዋቾች ${match.homeScore}-${match.awayScore} አቻችኋል`,
        bigClash: `ከፍተኛ ደረጃ ያላቸው ሁለት ቡድኖች ጥሩ እግርኳስ አሳዩ`,
        default: `የ${match.competition} ውድድር ተወዳዳሪ ተግባር አቅርቦልናል`
      },
      sw: {
        upset: `Mshangao mkubwa - ${match.homeScore > match.awayScore ? match.homeTeam : match.awayTeam} alishinda kinyume na matarajio`,
        goalThriller: `Mchezo wa kushangaza na magoli ${totalGoals} katika matokeo ya ${match.homeScore}-${match.awayScore}`,
        draw: `Timu sawa zilishindana hadi ${match.homeScore}-${match.awayScore} sare`,
        bigClash: `Mchezo wa hali ya juu kati ya timu kuu mbili ulitoa mpira wa miguu wa ubora`,
        default: `Mchezo wa ${match.competition} ulitoa vitendo vya ushindani`
      }
    };

    const t = templates[language];

    if (factors.includes('Shocking upset')) {
      return t.upset;
    }
    
    if (totalGoals >= 5) {
      return t.goalThriller;
    }
    
    if (scoreDiff === 0) {
      return t.draw;
    }
    
    if (factors.includes('Big team clash')) {
      return t.bigClash;
    }
    
    return t.default;
  }

  /**
   * 👥 Determine audience appeal
   */
  private determineAudienceAppeal(score: number): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (score >= 70) return 'HIGH';
    if (score >= 50) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * ⭐ Analyze standout performances from today's matches
   */
  private async analyzeStandoutPerformances(matches: MatchResult[]) {
    // This would analyze match data for standout performances
    // For now, using representative examples
    
    const allPerformances = matches.flatMap(m => m.standoutPerformances);
    const topGoals = matches.filter(m => m.homeScore + m.awayScore >= 3);
    
    return {
      playerOfDay: allPerformances.length > 0 ? allPerformances[0] : undefined,
      goalOfDay: topGoals.length > 0 ? `Spectacular strike in ${topGoals[0].homeTeam} vs ${topGoals[0].awayTeam}` : undefined,
      saveOfDay: 'Crucial penalty save preserves clean sheet',
      upsetOfDay: matches.find(m => this.isUpsetResult(m)) ? 
        `${matches.find(m => this.isUpsetResult(m))?.awayTeam} stuns ${matches.find(m => this.isUpsetResult(m))?.homeTeam}` : undefined
    };
  }

  /**
   * 📊 Calculate daily statistics
   */
  private async calculateDailyStatistics(matches: MatchResult[]) {
    const totalGoals = matches.reduce((sum, m) => sum + m.homeScore + m.awayScore, 0);
    const surpriseResults = matches.filter(m => this.isUpsetResult(m));
    
    // Find biggest win
    let biggestWin = { teams: '', score: '', margin: 0 };
    matches.forEach(match => {
      const margin = Math.abs(match.homeScore - match.awayScore);
      if (margin > biggestWin.margin) {
        biggestWin = {
          teams: `${match.homeTeam} vs ${match.awayTeam}`,
          score: `${match.homeScore}-${match.awayScore}`,
          margin
        };
      }
    });

    return {
      totalMatches: matches.length,
      totalGoals,
      biggestWin: { teams: biggestWin.teams, score: biggestWin.score },
      surpriseResults,
      disciplinaryActions: {
        redCards: Math.floor(Math.random() * 3), // Would come from real data
        yellowCards: Math.floor(Math.random() * 15) + 10
      }
    };
  }

  /**
   * 📰 Get relevant news storylines from RSS
   */
  private async getRelevantNewsStorylines() {
    try {
      const latestNews = await rssNewsFetcher.getLatestNews(5);
      
      return latestNews.map(news => ({
        headline: news.title,
        source: news.source,
        summary: news.description.substring(0, 150) + '...',
        relevance: Math.floor(Math.random() * 30) + 70 // Would be calculated based on content relevance
      })).sort((a, b) => b.relevance - a.relevance);
    } catch (error) {
      console.error('Error fetching news storylines:', error);
      return [];
    }
  }

  /**
   * 📅 Generate daily content
   */
  private async generateDailyContent(summaryData: DailySummaryData, request: SummaryGenerationRequest): Promise<{
    content: string;
    aiEditedContent: string;
  }> {
    const content = this.buildDailyContent(summaryData, request.language);
    const aiEditedContent = await this.aiEditDailyContent(content, summaryData, request.language);
    
    return { content, aiEditedContent };
  }

  /**
   * 📄 Build daily content
   */
  private buildDailyContent(summaryData: DailySummaryData, language: 'en' | 'am' | 'sw'): string {
    const date = new Date(summaryData.date).toLocaleDateString();
    
    if (language === 'am') {
      // BUILD ENHANCED AMHARIC CONTENT WITH MODERN TELEGRAM FEATURES
      let content = `<b>⚽ የዕለት እግርኳስ ማጠቃለያ</b> 📅 ${date}\n`;
      content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      
      if (summaryData.interestingMatches.length > 0) {
        content += `<b>🏆 ዛሬ የተከናወኑ ጉልህ ጨዋታዎች</b>\n\n`;
        
        summaryData.interestingMatches.slice(0, 3).forEach((interestingMatch, index) => {
          const match = interestingMatch.match;
          const totalGoals = match.homeScore + match.awayScore;
          const isHighScoring = totalGoals >= 5;
          const isUpset = Math.abs(match.homeScore - match.awayScore) >= 3;
          
          content += `<b>${index + 1}. ${match.homeTeam}</b> <code>${match.homeScore}-${match.awayScore}</code> <b>${match.awayTeam}</b>\n`;
          content += `   🏟️ <i>${match.competition}</i>\n`;
          content += `   ${isHighScoring ? '🔥' : '⚽'} ${interestingMatch.highlightReason}\n`;
          
          if (isHighScoring) {
            content += `   ✨ <i>ከፍተኛ ጎል የተሰማርበት ጨዋታ (${totalGoals} ጎሎች)</i>\n`;
          }
          if (isUpset) {
            content += `   😱 <i>የሚያስደንቅ ውጤት!</i>\n`;
          }
          content += `\n`;
        });
      }

      // ENHANCED STATISTICS WITH VISUAL ELEMENTS
      content += `<b>📊 የዛሬ የእግርኳስ ዓለም በቁጥሮች</b>\n`;
      content += `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
      content += `┃ 🎯 ጨዋታዎች: <b>${summaryData.statistics.totalMatches}</b> ድምር ጨዋታዎች\n`;
      content += `┃ ⚽ ጎሎች: <b>${summaryData.statistics.totalGoals}</b> ጠቅላላ ጎሎች\n`;
      content += `┃ 📈 አማካይ: <b>${(summaryData.statistics.totalGoals / summaryData.statistics.totalMatches).toFixed(1)}</b> ጎሎች በጨዋታ\n`;
      
      if (summaryData.statistics.biggestWin.teams) {
        content += `┃ 🏆 ከፍተኛ ድል: <i>${summaryData.statistics.biggestWin.teams}</i>\n`;
      }
      
      if (summaryData.statistics.surpriseResults.length > 0) {
        content += `┃ 😱 ያልተጠበቁ ውጤቶች: <b>${summaryData.statistics.surpriseResults.length}</b>\n`;
      }
      content += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;

      // STANDOUT PERFORMANCES WITH EMOJIS
      if (Object.values(summaryData.standoutPerformances).some(v => v)) {
        content += `<b>⭐ የዛሬ ምርጥ አፈጻጸሞች</b>\n`;
        if (summaryData.standoutPerformances.goalOfDay) {
          content += `🥅 <b>የቀኑ ጎል:</b> <i>${summaryData.standoutPerformances.goalOfDay}</i>\n`;
        }
        if (summaryData.standoutPerformances.playerOfDay) {
          content += `👑 <b>የቀኑ ተጫዋች:</b> <i>${summaryData.standoutPerformances.playerOfDay}</i>\n`;
        }
        if (summaryData.standoutPerformances.saveOfDay) {
          content += `🧤 <b>የቀኑ ማዳን:</b> <i>${summaryData.standoutPerformances.saveOfDay}</i>\n`;
        }
        if (summaryData.standoutPerformances.upsetOfDay) {
          content += `🎭 <b>የቀኑ አስደናቂ:</b> <i>${summaryData.standoutPerformances.upsetOfDay}</i>\n`;
        }
        content += `\n`;
      }
      
      // TOMORROW'S FIXTURES WITH ENHANCED PREVIEW
      if (summaryData.tomorrowsFixtures.length > 0) {
        content += `<b>🔮 የነገ ዋና ዋና ጨዋታዎች</b>\n`;
        content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        summaryData.tomorrowsFixtures.slice(0, 5).forEach((fixture, index) => {
          const importance = this.determineMatchImportance(fixture);
          const importanceEmoji = importance === 'HIGH' ? '🔥' : importance === 'MEDIUM' ? '⚡' : '⚽';
          content += `${importanceEmoji} <b>${fixture.homeTeam}</b> 🆚 <b>${fixture.awayTeam}</b>\n`;
          content += `   📍 <i>${fixture.competition}</i>\n`;
          if (index < summaryData.tomorrowsFixtures.length - 1) content += `\n`;
        });
        content += `\n`;
      }

      // CALL TO ACTION WITH ENHANCED FORMATTING
      content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      content += `<b>📱 ከታች ያሉትን ቁልፎች ተጠቅመው የበለጠ ይከታተሉ!</b>\n`;
      content += `💫 <i>ዝርዝር ስታትስቲክስ | ጎል ሰብሳቢዎች | ሊግ ጠረጴዛዎች</i>\n\n`;
      content += `<i>🌟 በየቀኑ የእግርኳስ ዓለም ከእኛ ጋር ይከታተሉ!</i>`;
      
      return content;
    }
    
    if (language === 'sw') {
      // BUILD ENHANCED SWAHILI CONTENT WITH MODERN TELEGRAM FEATURES
      let content = `<b>⚽ Muhtasari wa Mpira wa Miguu</b> 📅 ${date}\n`;
      content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      
      if (summaryData.interestingMatches.length > 0) {
        content += `<b>🏆 Mechi Muhimu za Leo</b>\n\n`;
        
        summaryData.interestingMatches.slice(0, 3).forEach((interestingMatch, index) => {
          const match = interestingMatch.match;
          const totalGoals = match.homeScore + match.awayScore;
          const isHighScoring = totalGoals >= 5;
          const isUpset = Math.abs(match.homeScore - match.awayScore) >= 3;
          
          content += `<b>${index + 1}. ${match.homeTeam}</b> <code>${match.homeScore}-${match.awayScore}</code> <b>${match.awayTeam}</b>\n`;
          content += `   🏟️ <i>${match.competition}</i>\n`;
          content += `   ${isHighScoring ? '🔥' : '⚽'} ${interestingMatch.highlightReason}\n`;
          
          if (isHighScoring) {
            content += `   ✨ <i>Mchezo wa mabao mengi (mabao ${totalGoals})</i>\n`;
          }
          if (isUpset) {
            content += `   😱 <i>Matokeo ya kushangaza!</i>\n`;
          }
          content += `\n`;
        });
      }

      // ENHANCED STATISTICS WITH VISUAL ELEMENTS
      content += `<b>📊 Takwimu za Leo katika Dunia ya Mpira</b>\n`;
      content += `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
      content += `┃ 🎯 Mechi: <b>${summaryData.statistics.totalMatches}</b> jumla ya mechi\n`;
      content += `┃ ⚽ Mabao: <b>${summaryData.statistics.totalGoals}</b> jumla ya mabao\n`;
      content += `┃ 📈 Wastani: <b>${(summaryData.statistics.totalGoals / summaryData.statistics.totalMatches).toFixed(1)}</b> mabao kwa mechi\n`;
      
      if (summaryData.statistics.biggestWin.teams) {
        content += `┃ 🏆 Ushindi mkubwa: <i>${summaryData.statistics.biggestWin.teams}</i>\n`;
      }
      
      if (summaryData.statistics.surpriseResults.length > 0) {
        content += `┃ 😱 Matokeo ya kushangaza: <b>${summaryData.statistics.surpriseResults.length}</b>\n`;
      }
      content += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;

      // STANDOUT PERFORMANCES WITH EMOJIS
      if (Object.values(summaryData.standoutPerformances).some(v => v)) {
        content += `<b>⭐ Utendaji Bora wa Leo</b>\n`;
        if (summaryData.standoutPerformances.goalOfDay) {
          content += `🥅 <b>Bao la Siku:</b> <i>${summaryData.standoutPerformances.goalOfDay}</i>\n`;
        }
        if (summaryData.standoutPerformances.playerOfDay) {
          content += `👑 <b>Mchezaji wa Siku:</b> <i>${summaryData.standoutPerformances.playerOfDay}</i>\n`;
        }
        if (summaryData.standoutPerformances.saveOfDay) {
          content += `🧤 <b>Uokoaji wa Siku:</b> <i>${summaryData.standoutPerformances.saveOfDay}</i>\n`;
        }
        if (summaryData.standoutPerformances.upsetOfDay) {
          content += `🎭 <b>Mshangao wa Siku:</b> <i>${summaryData.standoutPerformances.upsetOfDay}</i>\n`;
        }
        content += `\n`;
      }
      
      // TOMORROW'S FIXTURES WITH ENHANCED PREVIEW
      if (summaryData.tomorrowsFixtures.length > 0) {
        content += `<b>🔮 Mechi Muhimu za Kesho</b>\n`;
        content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        summaryData.tomorrowsFixtures.slice(0, 5).forEach((fixture, index) => {
          const importance = this.determineMatchImportance(fixture);
          const importanceEmoji = importance === 'HIGH' ? '🔥' : importance === 'MEDIUM' ? '⚡' : '⚽';
          content += `${importanceEmoji} <b>${fixture.homeTeam}</b> 🆚 <b>${fixture.awayTeam}</b>\n`;
          content += `   📍 <i>${fixture.competition}</i>\n`;
          if (index < summaryData.tomorrowsFixtures.length - 1) content += `\n`;
        });
        content += `\n`;
      }

      // CALL TO ACTION WITH ENHANCED FORMATTING
      content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      content += `<b>📱 Tumia vitufe hapa chini kufuata zaidi!</b>\n`;
      content += `💫 <i>Takwimu kamili | Wafungaji | Jedwali za Ligi</i>\n\n`;
      content += `<i>🌟 Fuatilia dunia ya mpira wa miguu kila siku!</i>`;
      
      return content;
    }

    // BUILD ENHANCED ENGLISH CONTENT WITH MODERN TELEGRAM FEATURES
    let content = `<b>⚽ DAILY FOOTBALL ROUNDUP</b> 📅\n`;
    content += `<i>${new Date(summaryData.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</i>\n`;
    content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    // Interesting matches section
    if (summaryData.interestingMatches.length > 0) {
      content += `<b>🏆 TODAY'S STANDOUT MATCHES</b>\n\n`;
      summaryData.interestingMatches.slice(0, 3).forEach((interestingMatch, index) => {
        const match = interestingMatch.match;
        const totalGoals = match.homeScore + match.awayScore;
        const isHighScoring = totalGoals >= 5;
        const isUpset = Math.abs(match.homeScore - match.awayScore) >= 3;
        
        content += `<b>${index + 1}. ${match.homeTeam}</b> <code>${match.homeScore}-${match.awayScore}</code> <b>${match.awayTeam}</b>\n`;
        content += `   🏟️ <i>${match.competition}</i>\n`;
        content += `   ${isHighScoring ? '🔥' : '⚽'} ${interestingMatch.highlightReason}\n`;
        
        if (isHighScoring) {
          content += `   ✨ <i>High-scoring thriller (${totalGoals} goals)</i>\n`;
        }
        if (isUpset) {
          content += `   😱 <i>Stunning upset result!</i>\n`;
        }
        if (interestingMatch.interestFactors.length > 0) {
          content += `   💫 <i>${interestingMatch.interestFactors.slice(0, 2).join(', ')}</i>\n`;
        }
        content += `\n`;
      });
    }

    // Standout performances with enhanced formatting
    if (Object.values(summaryData.standoutPerformances).some(v => v)) {
      content += `<b>⭐ TODAY'S STANDOUT PERFORMANCES</b>\n`;
      if (summaryData.standoutPerformances.goalOfDay) {
        content += `🥅 <b>Goal of the Day:</b> <i>${summaryData.standoutPerformances.goalOfDay}</i>\n`;
      }
      if (summaryData.standoutPerformances.playerOfDay) {
        content += `👑 <b>Player of the Day:</b> <i>${summaryData.standoutPerformances.playerOfDay}</i>\n`;
      }
      if (summaryData.standoutPerformances.saveOfDay) {
        content += `🧤 <b>Save of the Day:</b> <i>${summaryData.standoutPerformances.saveOfDay}</i>\n`;
      }
      if (summaryData.standoutPerformances.upsetOfDay) {
        content += `🎭 <b>Upset of the Day:</b> <i>${summaryData.standoutPerformances.upsetOfDay}</i>\n`;
      }
      content += `\n`;
    }

    // Enhanced statistics section with visual elements
    content += `<b>📊 TODAY'S FOOTBALL WORLD BY THE NUMBERS</b>\n`;
    content += `┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n`;
    content += `┃ 🎯 Matches: <b>${summaryData.statistics.totalMatches}</b> total matches\n`;
    content += `┃ ⚽ Goals: <b>${summaryData.statistics.totalGoals}</b> total goals\n`;
    content += `┃ 📈 Average: <b>${(summaryData.statistics.totalGoals / summaryData.statistics.totalMatches).toFixed(1)}</b> goals per match\n`;
    
    if (summaryData.statistics.biggestWin.teams) {
      content += `┃ 🏆 Biggest win: <i>${summaryData.statistics.biggestWin.teams} (${summaryData.statistics.biggestWin.score})</i>\n`;
    }
    
    if (summaryData.statistics.surpriseResults.length > 0) {
      content += `┃ 😱 Surprise results: <b>${summaryData.statistics.surpriseResults.length}</b>\n`;
    }
    content += `┃ 🟨 Disciplinary: ${summaryData.statistics.disciplinaryActions.redCards} red, ${summaryData.statistics.disciplinaryActions.yellowCards} yellow cards\n`;
    content += `┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;

    // Key storylines with better formatting
    if (summaryData.keyStorylines.length > 0) {
      content += `<b>📰 KEY STORYLINES</b>\n`;
      summaryData.keyStorylines.slice(0, 3).forEach(story => {
        content += `🔹 <b>${story.headline}</b>\n`;
        if (story.summary.length > 50) {
          content += `   <i>${story.summary}</i>\n`;
        }
      });
      content += `\n`;
    }

    // Tomorrow's fixtures with enhanced preview
    if (summaryData.tomorrowsFixtures.length > 0) {
      content += `<b>🔮 TOMORROW'S KEY FIXTURES</b>\n`;
      content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      summaryData.tomorrowsFixtures.slice(0, 5).forEach((fixture, index) => {
        const importance = this.determineMatchImportance(fixture);
        const importanceEmoji = importance === 'HIGH' ? '🔥' : importance === 'MEDIUM' ? '⚡' : '⚽';
        content += `${importanceEmoji} <b>${fixture.homeTeam}</b> 🆚 <b>${fixture.awayTeam}</b>\n`;
        content += `   📍 <i>${fixture.competition}</i>\n`;
        if (index < summaryData.tomorrowsFixtures.length - 1) content += `\n`;
      });
      content += `\n`;
    }

    // Weekend preview (if Friday)
    if (summaryData.weekendPreview) {
      content += `<b>🔮 WEEKEND PREVIEW</b>\n`;
      content += `${summaryData.weekendPreview}\n\n`;
    }

    // Call to action with enhanced formatting
    content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    content += `<b>📱 Use the buttons below to explore more!</b>\n`;
    content += `💫 <i>Detailed stats | Goal highlights | League tables</i>\n\n`;
    content += `<i>🌟 Stay tuned for daily football action!</i>`;

    return content;
  }

  /**
   * 📊 Generate weekly content
   */
  private async generateWeeklyContent(summaryData: WeeklySummaryData, request: SummaryGenerationRequest): Promise<{
    content: string;
    aiEditedContent: string;
  }> {
    const content = this.buildWeeklyContent(summaryData, request.language);
    const aiEditedContent = await this.aiEditWeeklyContent(content, summaryData, request.language);
    
    return { content, aiEditedContent };
  }

  /**
   * 📄 Build weekly content
   */
  private buildWeeklyContent(summaryData: WeeklySummaryData, language: 'en' | 'am' | 'sw'): string {
    const weekStartDate = new Date(summaryData.weekStart).toLocaleDateString();
    const weekEndDate = new Date(summaryData.weekEnd).toLocaleDateString();
    
    if (language === 'am') {
      // Build full content in Amharic
      let content = `📊 የሳምንት እግርኳስ ክለሳ\n`;
      content += `${weekStartDate} - ${weekEndDate}\n\n`;

      // Past week recap
      if (summaryData.weeklyResults.topMatches.length > 0) {
        content += `🏆 የሳምንቱ ዋና ዋና ውጤቶች\n\n`;
        summaryData.weeklyResults.topMatches.slice(0, 5).forEach(match => {
          content += `• ${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam} (${match.competition})\n`;
        });
        content += `\n`;
      }

      // Weekly statistics
      content += `📈 የሳምንቱ ቁጥሮች\n`;
      content += `• ${summaryData.weeklyStats.totalMatches} ጨዋታዎች\n`;
      content += `• ${summaryData.weeklyStats.totalGoals} ጎሎች (በአማካይ ${summaryData.weeklyStats.averageGoalsPerMatch} በጨዋታ)\n`;
      if (summaryData.weeklyStats.mostGoals.match) {
        content += `• ከፍተኛ ጎል: ${summaryData.weeklyStats.mostGoals.match} (${summaryData.weeklyStats.mostGoals.goals} ጎሎች)\n`;
      }
      content += `• ${summaryData.weeklyStats.cleanSheets} ንጹህ ሉህ\n`;
      content += `• ${summaryData.weeklyStats.redCards} ቀይ ካርዶች\n\n`;

      // Trends and insights
      if (summaryData.trends.teamOfTheWeek) {
        content += `👑 የሳምንቱ ቡድን: ${summaryData.trends.teamOfTheWeek}\n`;
      }
      if (summaryData.trends.playerOfTheWeek) {
        content += `⭐ የሳምንቱ ተጫዋች: ${summaryData.trends.playerOfTheWeek}\n`;
      }
      
      // Next week preview
      if (summaryData.nextWeekPreview.keyFixtures.length > 0) {
        content += `\n🔮 የሚቀጥለው ሳምንት ማቅረቢያ\n\n`;
        content += `🎯 ዋና ዋና ግጥሚያዎች:\n`;
        summaryData.nextWeekPreview.keyFixtures.slice(0, 5).forEach(fixture => {
          content += `• ${fixture.homeTeam} በተቃወመ ${fixture.awayTeam} (${fixture.competition})\n`;
        });
        content += `\n`;
      }

      if (summaryData.nextWeekPreview.matchesToWatch.length > 0) {
        content += `👀 ሊታዩ የሚገቡ ግጥሚያዎች:\n`;
        summaryData.nextWeekPreview.matchesToWatch.slice(0, 3).forEach(match => {
          content += `🔥 ${match.match.homeTeam} በተቃወመ ${match.match.awayTeam}\n`;
          content += `   ለምንድነው: ${match.whyWatch}\n`;
        });
        content += `\n`;
      }

      content += `📱 ለሚቀጥለው ሳምንት ድርጊት አብረን ይከተሉ!`;
      return content;
    }
    
    if (language === 'sw') {
      // Build full content in Swahili
      let content = `📊 Mapitio ya Mpira wa Miguu ya Juma\n`;
      content += `${weekStartDate} - ${weekEndDate}\n\n`;

      // Past week recap
      if (summaryData.weeklyResults.topMatches.length > 0) {
        content += `🏆 Matokeo Makuu ya Juma\n\n`;
        summaryData.weeklyResults.topMatches.slice(0, 5).forEach(match => {
          content += `• ${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam} (${match.competition})\n`;
        });
        content += `\n`;
      }

      // Weekly statistics
      content += `📈 Takwimu za Juma\n`;
      content += `• Mechi ${summaryData.weeklyStats.totalMatches}\n`;
      content += `• Mabao ${summaryData.weeklyStats.totalGoals} (wastani ${summaryData.weeklyStats.averageGoalsPerMatch} kwa mechi)\n`;
      if (summaryData.weeklyStats.mostGoals.match) {
        content += `• Mabao mengi: ${summaryData.weeklyStats.mostGoals.match} (mabao ${summaryData.weeklyStats.mostGoals.goals})\n`;
      }
      content += `• Karatasi safi ${summaryData.weeklyStats.cleanSheets}\n`;
      content += `• Kadi nyekundu ${summaryData.weeklyStats.redCards}\n\n`;

      // Trends and insights
      if (summaryData.trends.teamOfTheWeek) {
        content += `👑 Timu ya Juma: ${summaryData.trends.teamOfTheWeek}\n`;
      }
      if (summaryData.trends.playerOfTheWeek) {
        content += `⭐ Mchezaji wa Juma: ${summaryData.trends.playerOfTheWeek}\n`;
      }
      
      // Next week preview
      if (summaryData.nextWeekPreview.keyFixtures.length > 0) {
        content += `\n🔮 Mapitio ya Juma Ijayo\n\n`;
        content += `🎯 Mechi Kuu:\n`;
        summaryData.nextWeekPreview.keyFixtures.slice(0, 5).forEach(fixture => {
          content += `• ${fixture.homeTeam} dhidi ya ${fixture.awayTeam} (${fixture.competition})\n`;
        });
        content += `\n`;
      }

      if (summaryData.nextWeekPreview.matchesToWatch.length > 0) {
        content += `👀 Mechi za Kuangalia:\n`;
        summaryData.nextWeekPreview.matchesToWatch.slice(0, 3).forEach(match => {
          content += `🔥 ${match.match.homeTeam} dhidi ya ${match.match.awayTeam}\n`;
          content += `   Kwa nini: ${match.whyWatch}\n`;
        });
        content += `\n`;
      }

      content += `📱 Fuatilia vitendo vya juma ijayo!`;
      return content;
    }

    let content = `📊 WEEKLY FOOTBALL REVIEW\n`;
    content += `Week of ${new Date(summaryData.weekStart).toLocaleDateString()} - ${new Date(summaryData.weekEnd).toLocaleDateString()}\n\n`;

    // Past week recap
    content += `🏆 WEEK'S HIGHLIGHTS\n\n`;
    if (summaryData.weeklyResults.topMatches.length > 0) {
      content += `Top Results:\n`;
      summaryData.weeklyResults.topMatches.slice(0, 5).forEach(match => {
        content += `• ${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam} (${match.competition})\n`;
      });
      content += `\n`;
    }

    // League highlights
    if (summaryData.weeklyResults.leagueHighlights.length > 0) {
      content += `League Highlights:\n`;
      summaryData.weeklyResults.leagueHighlights.forEach(league => {
        content += `🏟️ ${league.league}:\n`;
        league.storylines.slice(0, 2).forEach(story => {
          content += `  • ${story}\n`;
        });
      });
      content += `\n`;
    }

    // Weekly statistics
    content += `📈 WEEK IN NUMBERS\n`;
    content += `• ${summaryData.weeklyStats.totalMatches} matches played\n`;
    content += `• ${summaryData.weeklyStats.totalGoals} goals scored (${summaryData.weeklyStats.averageGoalsPerMatch} per match)\n`;
    if (summaryData.weeklyStats.mostGoals.match) {
      content += `• Highest scoring: ${summaryData.weeklyStats.mostGoals.match} (${summaryData.weeklyStats.mostGoals.goals} goals)\n`;
    }
    content += `• ${summaryData.weeklyStats.cleanSheets} clean sheets\n`;
    content += `• ${summaryData.weeklyStats.redCards} red cards issued\n\n`;

    // Trends and insights
    content += `🔍 TRENDS & INSIGHTS\n`;
    if (summaryData.trends.teamOfTheWeek) {
      content += `👑 Team of the Week: ${summaryData.trends.teamOfTheWeek}\n`;
    }
    if (summaryData.trends.playerOfTheWeek) {
      content += `⭐ Player of the Week: ${summaryData.trends.playerOfTheWeek}\n`;
    }
    
    if (summaryData.trends.formGuide.length > 0) {
      content += `📊 Form Guide:\n`;
      summaryData.trends.formGuide.slice(0, 5).forEach(team => {
        const arrow = team.trend === 'up' ? '🔺' : team.trend === 'down' ? '🔻' : '➡️';
        content += `  ${arrow} ${team.team}: ${team.form}\n`;
      });
    }
    content += `\n`;

    // Next week preview
    content += `🔮 NEXT WEEK PREVIEW\n\n`;
    
    if (summaryData.nextWeekPreview.keyFixtures.length > 0) {
      content += `🎯 Key Fixtures:\n`;
      summaryData.nextWeekPreview.keyFixtures.slice(0, 5).forEach(fixture => {
        content += `• ${fixture.homeTeam} vs ${fixture.awayTeam} (${fixture.competition})\n`;
      });
      content += `\n`;
    }

    if (summaryData.nextWeekPreview.matchesToWatch.length > 0) {
      content += `👀 Matches to Watch:\n`;
      summaryData.nextWeekPreview.matchesToWatch.slice(0, 3).forEach(match => {
        content += `🔥 ${match.match.homeTeam} vs ${match.match.awayTeam}\n`;
        content += `   Why watch: ${match.whyWatch}\n`;
      });
      content += `\n`;
    }

    if (summaryData.nextWeekPreview.weeklyPredictions.length > 0) {
      content += `🎲 Week Ahead Predictions:\n`;
      summaryData.nextWeekPreview.weeklyPredictions.slice(0, 3).forEach(prediction => {
        content += `• ${prediction}\n`;
      });
      content += `\n`;
    }

    content += `📱 Follow along for all the action next week!`;

    return content;
  }

  // Helper methods for data fetching (would integrate with real APIs)
  private async getTodaysMatches(targetDate?: string): Promise<MatchResult[]> {
    console.log(`📅 Getting matches for daily summary`);
    
    try {
      let dateToQuery: string;
      
      if (targetDate) {
        dateToQuery = targetDate;
      } else {
        // For daily summary, we want yesterday's matches (previous day)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        dateToQuery = yesterday.toISOString().split('T')[0];
      }
      
      console.log(`📅 Getting matches for date: ${dateToQuery} (for daily summary)`);
      
      // Get real matches from unified football service
      const realMatches = await unifiedFootballService.getMatchesByDate(dateToQuery);
      
      if (!realMatches || realMatches.length === 0) {
        console.log(`📅 No matches found for ${dateToQuery}`);
        return [];
      }

      // Convert MatchData to MatchResult format
      const matchResults: MatchResult[] = realMatches.map(match => ({
        id: match.id,
        homeTeam: match.homeTeam.name,
        awayTeam: match.awayTeam.name,
        homeScore: match.score?.home || 0,
        awayScore: match.score?.away || 0,
        competition: match.competition.name,
        date: match.kickoff.toISOString(),
        venue: '', // Will be enriched later if needed
        status: match.status === 'FINISHED' ? 'finished' : 
                match.status === 'LIVE' || match.status === 'IN_PLAY' ? 'live' : 'scheduled',
        interestScore: 0, // Will be calculated in findInterestingMatches
        significance: '', // Will be calculated in findInterestingMatches
        keyMoments: [], // Will be enriched later
        standoutPerformances: [] // Will be enriched later
      }));

      console.log(`📅 Found ${matchResults.length} real matches for ${dateToQuery}`);
      return matchResults;

    } catch (error) {
      console.error(`❌ Error getting matches:`, error);
      return [];
    }
  }

  private async getTomorrowsFixtures(targetDate?: string): Promise<MatchResult[]> {
    console.log(`🔮 Getting tomorrow's fixtures for ${targetDate || 'today'}`);
    
    try {
      // Calculate tomorrow's date
      const today = targetDate ? new Date(targetDate) : new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const tomorrowDateString = tomorrow.toISOString().split('T')[0];

      // Get real fixtures from unified football service
      const realFixtures = await unifiedFootballService.getMatchesByDate(tomorrowDateString);
      
      if (!realFixtures || realFixtures.length === 0) {
        console.log(`🔮 No fixtures found for tomorrow (${tomorrowDateString})`);
        return [];
      }

      // Convert MatchData to MatchResult format
      const fixtureResults: MatchResult[] = realFixtures.map(fixture => ({
        id: fixture.id,
        homeTeam: fixture.homeTeam.name,
        awayTeam: fixture.awayTeam.name,
        homeScore: 0, // Future matches don't have scores
        awayScore: 0,
        competition: fixture.competition.name,
        date: fixture.kickoff.toISOString(),
        venue: '', // Will be enriched later if needed
        status: 'scheduled',
        interestScore: 0, // Will be calculated if needed
        significance: 'Upcoming fixture',
        keyMoments: [],
        standoutPerformances: []
      }));

      console.log(`🔮 Found ${fixtureResults.length} fixtures for tomorrow`);
      return fixtureResults;

    } catch (error) {
      console.error(`❌ Error getting tomorrow's fixtures:`, error);
      return [];
    }
  }

  private async getWeeklyMatches(weekStart: string, weekEnd: string): Promise<MatchResult[]> {
    console.log(`📅 Getting weekly matches from ${weekStart} to ${weekEnd}`);
    
    try {
      // Get all matches for the entire week
      let allMatches: MatchResult[] = [];
      
      // Get matches for each day of the week
      const startDate = new Date(weekStart);
      const endDate = new Date(weekEnd);
      
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        console.log(`🔍 Getting matches for date: ${dateStr}`);
        
        const dayMatches = await this.getTodaysMatches(dateStr);
        allMatches = allMatches.concat(dayMatches);
      }
      
      console.log(`📊 Found ${allMatches.length} total matches for the week`);
      return allMatches;
      
    } catch (error) {
      console.error(`❌ Error getting weekly matches:`, error);
      // Fallback to today's matches if weekly fetch fails
      return await this.getTodaysMatches();
    }
  }

  private async analyzeWeeklyResults(matches: MatchResult[]) {
    const leagueGroups = this.groupMatchesByLeague(matches);
    
    return {
      topMatches: matches.sort((a, b) => b.interestScore - a.interestScore).slice(0, 10),
      leagueHighlights: Object.entries(leagueGroups).map(([league, leagueMatches]) => ({
        league,
        keyResults: leagueMatches.slice(0, 3),
        tableMovements: [`${leagueMatches[0]?.homeTeam} moves up to 3rd`], // Would calculate real movements
        storylines: [`Exciting ${league} action continues`] // Would analyze real storylines
      }))
    };
  }

  private async calculateWeeklyStatistics(matches: MatchResult[]) {
    const totalGoals = matches.reduce((sum, m) => sum + m.homeScore + m.awayScore, 0);
    const avgGoals = matches.length > 0 ? (totalGoals / matches.length).toFixed(1) : '0.0';
    
    let mostGoalsMatch = { match: '', goals: 0 };
    matches.forEach(match => {
      const goals = match.homeScore + match.awayScore;
      if (goals > mostGoalsMatch.goals) {
        mostGoalsMatch = {
          match: `${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam}`,
          goals
        };
      }
    });

    return {
      totalMatches: matches.length,
      totalGoals,
      averageGoalsPerMatch: parseFloat(avgGoals),
      mostGoals: mostGoalsMatch,
      cleanSheets: matches.filter(m => m.homeScore === 0 || m.awayScore === 0).length,
      redCards: Math.floor(Math.random() * 8) + 2, // Would come from real data
      biggestUpsets: matches.filter(m => this.isUpsetResult(m))
    };
  }

  private async analyzeWeeklyTrends(matches: MatchResult[]) {
    // Would analyze real trends from match data
    const teamPerformances = this.analyzeTeamPerformances(matches);
    
    return {
      teamOfTheWeek: teamPerformances[0]?.team || 'Manchester City',
      playerOfTheWeek: 'Outstanding midfielder dominates games',
      formGuide: teamPerformances.slice(0, 8).map(team => ({
        team: team.team,
        form: team.form,
        trend: team.trend
      })),
      emergingStories: [
        'Young talent breaking through',
        'Manager tactics proving effective',
        'Transfer window implications'
      ]
    };
  }

  private async generateNextWeekPreview(weekEnd: string) {
    // Would get next week's fixtures
    const nextWeekStart = new Date(new Date(weekEnd).getTime() + 24 * 60 * 60 * 1000);
    const keyFixtures = await this.getTomorrowsFixtures(); // Simplified

    return {
      keyFixtures,
      fixturesByDay: this.groupFixturesByDay(keyFixtures),
      matchesToWatch: keyFixtures.map(fixture => ({
        match: fixture,
        whyWatch: this.generateWhyWatchReason(fixture),
        importance: this.determineMatchImportance(fixture)
      })),
      weeklyPredictions: [
        'Expect high-scoring encounters',
        'Title race continues to intensify',
        'Europa League spots up for grabs'
      ]
    };
  }

  // Helper methods
  private isUpsetResult(match: MatchResult): boolean {
    // Simplified upset detection
    const bigTeams = ['Manchester City', 'Arsenal', 'Liverpool', 'Chelsea'];
    const homeIsBig = bigTeams.includes(match.homeTeam);
    const awayIsBig = bigTeams.includes(match.awayTeam);
    
    return (homeIsBig && match.homeScore < match.awayScore) || 
           (awayIsBig && match.awayScore < match.homeScore);
  }

  private groupMatchesByLeague(matches: MatchResult[]) {
    return matches.reduce((groups, match) => {
      const league = match.competition;
      if (!groups[league]) groups[league] = [];
      groups[league].push(match);
      return groups;
    }, {} as { [league: string]: MatchResult[] });
  }

  private analyzeTeamPerformances(matches: MatchResult[]): Array<{
    team: string;
    form: string;
    trend: 'up' | 'down' | 'stable';
  }> {
    // Simplified team performance analysis
    const teamStats: { [team: string]: { wins: number; draws: number; losses: number } } = {};
    
    matches.forEach(match => {
      if (!teamStats[match.homeTeam]) teamStats[match.homeTeam] = { wins: 0, draws: 0, losses: 0 };
      if (!teamStats[match.awayTeam]) teamStats[match.awayTeam] = { wins: 0, draws: 0, losses: 0 };
      
      if (match.homeScore > match.awayScore) {
        teamStats[match.homeTeam].wins++;
        teamStats[match.awayTeam].losses++;
      } else if (match.awayScore > match.homeScore) {
        teamStats[match.awayTeam].wins++;
        teamStats[match.homeTeam].losses++;
      } else {
        teamStats[match.homeTeam].draws++;
        teamStats[match.awayTeam].draws++;
      }
    });

    return Object.entries(teamStats).map(([team, stats]) => ({
      team,
      form: `${stats.wins}W ${stats.draws}D ${stats.losses}L`,
      trend: (stats.wins > stats.losses ? 'up' : stats.losses > stats.wins ? 'down' : 'stable') as 'up' | 'down' | 'stable'
    })).sort((a, b) => {
      const aPoints = teamStats[a.team].wins * 3 + teamStats[a.team].draws;
      const bPoints = teamStats[b.team].wins * 3 + teamStats[b.team].draws;
      return bPoints - aPoints;
    });
  }

  private groupFixturesByDay(fixtures: MatchResult[]) {
    return fixtures.reduce((groups, fixture) => {
      const day = new Date(fixture.date).toLocaleDateString('en-US', { weekday: 'long' });
      if (!groups[day]) groups[day] = [];
      groups[day].push(fixture);
      return groups;
    }, {} as { [day: string]: MatchResult[] });
  }

  private generateWhyWatchReason(fixture: MatchResult): string {
    const reasons = [
      'Title race implications',
      'European qualification battle',
      'Local derby intensity',
      'Tactical masterclass expected',
      'Star player showdown',
      'Form teams collide'
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
  }

  private determineMatchImportance(fixture: MatchResult): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (fixture.competition.includes('Champions League')) return 'HIGH';
    if (fixture.competition.includes('Premier League')) return 'HIGH';
    return 'MEDIUM';
  }

  private getWeekStart(targetDate?: string): string {
    const date = targetDate ? new Date(targetDate) : new Date();
    
    // If it's Sunday and we want last week's summary
    if (date.getDay() === 0 && !targetDate) {
      // Go back to previous week's Monday
      const mondayLastWeek = new Date(date);
      mondayLastWeek.setDate(date.getDate() - 6);
      return mondayLastWeek.toISOString().split('T')[0];
    }
    
    // For any other day, calculate the Monday of the current week
    const monday = new Date(date);
    monday.setDate(date.getDate() - date.getDay() + 1);
    return monday.toISOString().split('T')[0];
  }

  private getWeekEnd(weekStart: string): string {
    const sunday = new Date(weekStart);
    sunday.setDate(sunday.getDate() + 6);
    return sunday.toISOString().split('T')[0];
  }

  private isWeekendPreviewDay(): boolean {
    return new Date().getDay() === 5; // Friday
  }

  private async generateWeekendPreview(): Promise<string> {
    return 'Big weekend of football ahead with key Premier League clashes and European action!';
  }

  // Image and visual generation methods
  private async generateDailySummaryImage(summaryData: DailySummaryData): Promise<string | undefined> {
    console.log(`🎨 Generating daily summary image for ${summaryData.date}`);
    
    // Simple image with just the title
    const prompt = `Simple and clean football-themed infographic showing only the title "Daily Summary" in elegant text.
    Professional football background with stadium atmosphere, modern typography, minimalist design, 
    clean layout, no detailed statistics or match results, just the title text.`;

    try {
      const generatedImage = await aiImageGenerator.generateImage({
        prompt,
        quality: 'low', // Smaller file size
        size: '1024x1024' // Standard size
      });
      
      if (!generatedImage || !generatedImage.url) {
        console.log('⚠️ No image generated for daily summary');
        return undefined;
      }

      console.log(`✅ Daily summary image generated: ${generatedImage.url}`);
      return generatedImage.url;
      
    } catch (error) {
      console.error(`❌ Error generating daily summary image:`, error);
      console.log('📝 Continuing without image for daily summary');
      return undefined;
    }
  }

  private async generateWeeklySummaryImage(summaryData: WeeklySummaryData): Promise<string | undefined> {
    const prompt = `Simple and clean football-themed infographic showing only the title "Weekly Summary" in elegant text.
    Professional football background with stadium atmosphere, modern typography, minimalist design, 
    clean layout, no detailed statistics or match results, just the title text.`;

    try {
      const generatedImage = await aiImageGenerator.generateImage({
        prompt,
        quality: 'low', // Smaller file size
        size: '1024x1024' // Standard size
      });
      
      if (!generatedImage || !generatedImage.url) {
        console.log('⚠️ No image generated for weekly summary');
        return undefined;
      }

      console.log(`✅ Weekly summary image generated: ${generatedImage.url}`);
      return generatedImage.url;
      
    } catch (error) {
      console.error(`❌ Error generating weekly summary image:`, error);
      console.log('📝 Continuing without image for weekly summary');
      return undefined;
    }
  }

  private async generateDailyVisualElements(summaryData: DailySummaryData) {
    return {
      tables: ['Match Results Table', 'Top Scorers'],
      charts: ['Goals Distribution', 'Competition Breakdown'],
      highlights: summaryData.interestingMatches.map(m => m.highlightReason)
    };
  }

  private async generateWeeklyVisualElements(summaryData: WeeklySummaryData) {
    return {
      tables: ['Weekly Results', 'Form Guide', 'Next Week Fixtures'],
      charts: ['Goals per Day', 'League Performance', 'Trend Analysis'],
      highlights: summaryData.trends.emergingStories
    };
  }

  private async aiEditDailyContent(content: string, summaryData: DailySummaryData, language: 'en' | 'am' | 'sw'): Promise<string> {
    const openai = await getOpenAIClient();
    if (!openai) {
      console.warn('OpenAI client not available, returning original content');
      return content;
    }
    
    const languageInstructions = {
      en: "Write ONLY in English with engaging style and football terminology",
      am: "Write ONLY in Amharic (አማርኛ) with native football terminology and engaging style",
      sw: "Write ONLY in Swahili with native football terminology and engaging style"
    };
    
    const formatInstructions = {
      en: `Format your content using MODERN TELEGRAM HTML formatting:
- Use <b>bold text</b> for titles and important information
- Use <i>italic text</i> for descriptions and details
- Use <code>monospace</code> for scores and numbers
- Use Unicode box drawing characters for visual borders (━, ┏, ┓, ┗, ┛, ┃)
- Include emojis strategically for visual appeal
- Structure content with clear sections and spacing`,
      am: `በዘመናዊ ቴሌግራም HTML ቅርጸት ይጻፉ:
- ለርዕሶች እና አስፈላጊ መረጃዎች <b>ደማቅ ጽሑፍ</b> ይጠቀሙ
- ለመግለጫዎች እና ዝርዝሮች <i>ዘንበል ያለ ጽሑፍ</i> ይጠቀሙ
- ለውጤቶች እና ቁጥሮች <code>monospace</code> ይጠቀሙ
- ለዕይታ ድንበሮች የዩኒኮድ ሳጥን መሳል ቁምፊዎችን ይጠቀሙ (━, ┏, ┓, ┗, ┛, ┃)
- ለዕይታ ማሳያ emojis በስልት ያካትቱ
- ዓይነቶችን በግልጽ ክፍሎች እና ክፍተት ያደራጁ`,
      sw: `Tumia muundo wa kisasa wa Telegram HTML:
- Tumia <b>maandishi mazito</b> kwa vichwa na taarifa muhimu
- Tumia <i>maandishi ya italiki</i> kwa maelezo na undani
- Tumia <code>monospace</code> kwa alama na namba
- Tumia herufi za kuchora kisanduku cha Unicode kwa mipaka ya kuona (━, ┏, ┓, ┗, ┛, ┃)
- Jumuisha emoji kwa mkakati wa kuona
- Panga maudhui na sehemu na nafasi wazi`
    };

    const prompt = `You are a professional football journalist creating content for MODERN TELEGRAM with enhanced formatting. Create a comprehensive daily football summary based on the following data:

    Original content template:
    ${content}
    
    Match Details:
    - Date: ${summaryData.date}
    - Number of matches analyzed: ${summaryData.statistics.totalMatches}
    - Total goals scored: ${summaryData.statistics.totalGoals}
    - Top interesting matches: ${summaryData.interestingMatches.length}
    - Tomorrow's fixtures: ${summaryData.tomorrowsFixtures.length}
    
    Specific match information:
    ${summaryData.interestingMatches.map((match, index) => 
      `${index + 1}. ${match.match.homeTeam} ${match.match.homeScore}-${match.match.awayScore} ${match.match.awayTeam} (${match.match.competition})`
    ).join('\n')}
    
    FORMATTING REQUIREMENTS:
    ${formatInstructions[language]}
    
    CONTENT INSTRUCTIONS:
    1. ${languageInstructions[language]}
    2. FOLLOW THE EXACT FORMAT from the template above with HTML tags
    3. Use the SAME visual structure: title with separators, boxed statistics, enhanced sections
    4. Include specific team names, scores, and competitions from the data above
    5. Add intelligent analysis about what made these matches interesting
    6. Calculate and include averages (goals per match, etc.)
    7. Highlight high-scoring games (5+ goals) with 🔥 and upsets (3+ goal difference) with 😱
    8. Include tomorrow's fixtures with importance indicators (🔥 HIGH, ⚡ MEDIUM, ⚽ LOW)
    9. End with the call-to-action about interactive buttons
    10. NO generic content - use ONLY the specific match data provided
    
    CRITICAL: Return content in the EXACT SAME HTML format as the template, maintaining the visual structure with borders, sections, and enhanced formatting.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1500,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });
      return response.choices[0].message.content || content;
    } catch (error) {
      console.error(`❌ Error editing daily content with AI:`, error);
      return content; // Fallback to original if AI fails
    }
  }

  private async aiEditWeeklyContent(content: string, summaryData: WeeklySummaryData, language: 'en' | 'am' | 'sw'): Promise<string> {
    const openai = await getOpenAIClient();
    if (!openai) {
      console.warn('OpenAI client not available, returning original content');
      return content;
    }
    
    const prompt = `Edit the following weekly football summary content to make it more engaging and relevant to ${language} readers.
    Original content:
    ${content}
    
    Summary data:
    Week start: ${summaryData.weekStart}
    Week end: ${summaryData.weekEnd}
    Weekly results: ${summaryData.weeklyResults.topMatches.length} top matches, ${summaryData.weeklyResults.leagueHighlights.length} league highlights
    Weekly statistics: ${summaryData.weeklyStats.totalMatches} matches, ${summaryData.weeklyStats.totalGoals} goals
    Trends: ${summaryData.trends.teamOfTheWeek} team of the week, ${summaryData.trends.playerOfTheWeek} player of the week
    Next week preview: ${summaryData.nextWeekPreview.keyFixtures.length} key fixtures, ${summaryData.nextWeekPreview.matchesToWatch.length} matches to watch
    
    Edit the content to:
    1. Add more context and background about the week's events and trends.
    2. Highlight key moments and standout performances.
    3. Include more specific statistics and details.
    4. Make the language more engaging and local to ${language}.
    5. Add relevant hashtags and calls to action.
    6. Ensure the content is concise and informative.
    7. Maintain the original structure and flow.
    
    Edit the content and return ONLY the edited version.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });
      return response.choices[0].message.content || content;
    } catch (error) {
      console.error(`❌ Error editing weekly content with AI:`, error);
      return content; // Fallback to original if AI fails
    }
  }

  /**
   * 🕐 Schedule automated summary generation
   */
  async scheduleAutomatedSummaries(timezone: string = 'UTC') {
    // This would integrate with a cron job system
    // Daily summaries: 10 PM local time
    // Weekly summaries: Sunday 8 AM local time (morning review of previous week)
    console.log(`📅 Scheduling automated summaries for timezone: ${timezone}`);
    
    return {
      dailySchedule: '0 22 * * *', // 10 PM daily
      weeklySchedule: '0 8 * * 0', // 8 AM Sunday (morning review of previous week)
      timezone
    };
  }

  /**
   * 📊 Get summary performance stats
   */
  async getSummaryStats() {
    return {
      totalDailySummaries: 0,
      totalWeeklySummaries: 0,
      averageEngagement: 0,
      mostPopularSection: 'interesting_matches'
    };
  }
}

// Export singleton instance
export const dailyWeeklySummaryGenerator = new DailyWeeklySummaryGenerator();