/**
 * 🚀 CONTENT ROUTER - Direct Content Generation for Automation
 * 
 * This router allows direct content generation without HTTP requests,
 * perfect for automation systems and internal calls
 */

import { BettingTipsGenerator } from '../betting-tips-generator';
import { OptimizedNewsContentGenerator } from '../news-content-generator';
import { MatchAnalysisGenerator } from '../match-analysis-generator';
import { LiveUpdatesGenerator } from '../live-updates-generator';
import { PollsGenerator } from '../polls-generator';
import { DailyWeeklySummaryGenerator } from '../daily-weekly-summary-generator';

export interface ContentGenerationRequest {
  contentType: string;
  language: string;
  channelIds?: string[];
  isAutomationExecution?: boolean;
  targetChannels?: string;
}

export interface ContentGenerationResult {
  success: boolean;
  content_items?: any[];
    error?: string;
  message?: string;
}

export class ContentRouter {
  private bettingGenerator: BettingTipsGenerator;
  private newsGenerator: OptimizedNewsContentGenerator;
  private analysisGenerator: MatchAnalysisGenerator;
  private liveGenerator: LiveUpdatesGenerator;
  private pollsGenerator: PollsGenerator;
  private summaryGenerator: DailyWeeklySummaryGenerator;

  constructor() {
    this.bettingGenerator = new BettingTipsGenerator();
    this.newsGenerator = new OptimizedNewsContentGenerator();
    this.analysisGenerator = new MatchAnalysisGenerator();
    this.liveGenerator = new LiveUpdatesGenerator();
    this.pollsGenerator = new PollsGenerator();
    this.summaryGenerator = new DailyWeeklySummaryGenerator();
  }

  /**
   * 🎯 Generate content directly using the appropriate generator
   */
  async generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResult> {
    try {
      console.log(`🎯 ContentRouter: Generating ${request.contentType} in ${request.language}`);
      
      const channelId = request.channelIds?.[0] || 'default';
      let result: any = null;

      switch (request.contentType) {
        case 'betting':
          result = await this.bettingGenerator.generateBettingTips({
            language: request.language as 'en' | 'am' | 'sw',
            channelId: channelId,
            maxPredictions: 3,
            riskTolerance: 'moderate'
          });
          break;

        case 'news':
          result = await this.newsGenerator.generateNewsContent({
            language: request.language as 'en' | 'am' | 'sw',
            channelId: channelId,
            maxItems: 1,
            categories: ['general', 'breaking', 'transfer']
          });
          break;

        case 'analysis':
          result = await this.analysisGenerator.generateMatchAnalysis({
            language: request.language as 'en' | 'am' | 'sw',
            channelId: channelId,
            analysisType: 'pre_match',
            includeStatistics: true
          });
          break;

        case 'live_updates':
          result = await this.liveGenerator.generateLiveUpdate({
            language: request.language as 'en' | 'am' | 'sw',
            channelId: channelId,
            updateType: 'auto'
          });
          break;

        case 'poll':
        case 'polls':
          result = await this.pollsGenerator.generatePoll({
            language: request.language as 'en' | 'am' | 'sw',
            channelId: channelId,
            pollType: 'prediction'
          });
          break;

        case 'daily_summary':
          result = await this.summaryGenerator.generateDailySummary({
            language: request.language as 'en' | 'am' | 'sw',
            channelId: channelId,
            date: new Date().toISOString().split('T')[0]
          });
          break;

        case 'weekly_summary':
          result = await this.summaryGenerator.generateWeeklySummary({
            language: request.language as 'en' | 'am' | 'sw',
            channelId: channelId,
            weekStart: new Date().toISOString().split('T')[0]
          });
          break;

        default:
          throw new Error(`Unknown content type: ${request.contentType}`);
      }
      
      if (!result) {
        return {
          success: false,
          error: `No content generated for ${request.contentType}`,
          content_items: []
        };
      }

      // Format the result to match the expected structure
      const formattedResult = this.formatGeneratorResult(result, request.contentType);
      
      console.log(`✅ ContentRouter: Generated ${request.contentType} successfully`);
      return {
        success: true,
        content_items: [formattedResult],
        message: `Generated ${request.contentType} content successfully`
      };

    } catch (error) {
      console.error(`❌ ContentRouter error for ${request.contentType}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        content_items: []
      };
    }
  }

  /**
   * 🔧 Format generator result to match unified structure
   */
  private formatGeneratorResult(result: any, contentType: string): any {
    if (!result) return null;

    // Each generator has a different structure, normalize it
    switch (contentType) {
      case 'betting':
        return {
          content: result.aiEditedContent || result.content,
          image_url: result.imageUrl,
          title: result.title,
          type: 'betting',
          metadata: result.metadata,
          analysis: result.analysis
        };

      case 'news':
      return {
          content: result.aiEditedContent || result.content,
          image_url: result.imageUrl,
          title: result.title,
          type: 'news',
          metadata: result.metadata,
          source_url: result.sourceUrl,
          category: result.category
        };

      case 'analysis':
        return {
          content: result.aiEditedContent || result.content,
          image_url: result.imageUrl,
          title: result.title,
          type: 'analysis',
          metadata: result.metadata,
          analysis: result.analysis
        };

      case 'live_updates':
      return {
          content: result.aiEditedContent || result.content,
          title: result.title,
          type: 'live_updates',
          metadata: result.metadata,
          matchData: result.matchData,
          updateType: result.updateType
        };

      case 'poll':
      case 'polls':
        return {
          content: result.aiEditedContent || result.content,
          title: result.title,
          type: 'poll',
          metadata: result.metadata,
          poll: result.poll
        };

      case 'daily_summary':
      case 'weekly_summary':
      return {
          content: result.aiEditedContent || result.content,
          image_url: result.imageUrl,
          title: result.title,
          type: contentType,
          metadata: result.metadata,
          summary: result.summary
        };

      default:
        return {
          content: result.content || result.aiEditedContent || 'Content generated',
          title: result.title || `${contentType} content`,
          type: contentType,
          metadata: result.metadata || {}
        };
    }
  }
}

// Export singleton instance
export const contentRouter = new ContentRouter(); 