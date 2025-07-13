/**
 * 🎯 CONTENT ROUTER - Content Generation and Routing Logic
 * Routes requests to appropriate content generators and handles fallback content
 */

import { Language } from './content-config';

// Import all content generators
import { liveUpdatesGenerator } from '@/lib/content/live-updates-generator';
import { bettingTipsGenerator } from '@/lib/content/betting-tips-generator';
import { newsContentGenerator } from '@/lib/content/news-content-generator';
import { pollsGenerator } from '@/lib/content/polls-generator';
import { matchAnalysisGenerator } from '@/lib/content/match-analysis-generator';
import { smartCouponsGenerator } from '@/lib/content/smart-coupons-generator';
import { dailyWeeklySummaryGenerator } from '@/lib/content/daily-weekly-summary-generator';
import { ContentConfigUtils } from './content-config';

export type ContentType = 'live' | 'betting' | 'news' | 'polls' | 'analysis' | 'coupons' | 'memes' | 'daily_summary' | 'weekly_summary';

export interface ContentGenerationResult {
  contentItems: any[];
  processingInfo: {
    data_source: string;
    ai_processing: boolean;
    image_generation: boolean;
    fallback_used: boolean;
    error?: string;
    betting_fallback_to_news?: boolean;
  };
}

export interface ContentGenerationOptions {
  type: ContentType;
  language: Language;
  maxItems: number;
  channelId?: string;
  customContent?: any;
}

export class ContentRouter {
  /**
   * Main content generation method - routes to appropriate generators
   */
  async generateContent(options: ContentGenerationOptions): Promise<ContentGenerationResult> {
    const { type, language, maxItems, channelId = 'unified-content', customContent } = options;

    console.log(`🎯 Content Router: Generating ${type} content for ${language}`);

    // Route to specific content generator
    switch (type) {
      case 'live':
        return await this.generateLiveContent(language, maxItems, channelId);
        
      case 'betting':
        return await this.generateBettingContent(language, maxItems, channelId);
        
      case 'news':
        return await this.generateNewsContent(language, maxItems, channelId);
        
      case 'polls':
        return await this.generatePollsContent(language, maxItems, channelId, customContent);
        
      case 'analysis':
        return await this.generateAnalysisContent(language, maxItems, channelId);
        
      case 'coupons':
        return await this.generateCouponsContent(language, maxItems, channelId);
        
      case 'memes':
        return await this.generateMemesContent(language, maxItems, channelId);
        
      case 'daily_summary':
        return await this.generateDailySummaryContent(language, maxItems, channelId);
        
      case 'weekly_summary':
        return await this.generateWeeklySummaryContent(language, maxItems, channelId);
        
      default:
        console.error(`❌ Unsupported content type: ${type}`);
        return await this.generateFallbackContent(type, language, maxItems);
    }
  }

  /**
   * Generate live content
   */
  private async generateLiveContent(language: Language, maxItems: number, channelId: string): Promise<ContentGenerationResult> {
    try {
      console.log(`🔴 Using enhanced live content generator with fallback for ${language}`);
      
      // Get active live updates using the correct method
      const results = await liveUpdatesGenerator.getActiveLiveUpdates(language, maxItems);
      
      if (!results || results.length === 0) {
        console.log('⚠️ No active live updates found');
        return await this.generateFallbackContent('live', language, maxItems);
      }
      
      const result = results[0]; // Use the first live update
      
      return {
        contentItems: [{
          id: result.metadata?.contentId || `live_${Date.now()}`,
          type: 'live',
          title: result.title,
          content: result.content,
          language: language,
          imageUrl: result.imageUrl,
          metadata: result.metadata
        }],
        processingInfo: {
          data_source: 'Live Updates Generator',
          ai_processing: true,
          image_generation: ContentConfigUtils.shouldGenerateImage('live'),
          fallback_used: false
        }
      };
    } catch (error) {
      console.error('Error generating live content with enhanced generator:', error);
      return {
        contentItems: [],
        processingInfo: {
          data_source: 'Live content generation failed',
          ai_processing: false,
          image_generation: ContentConfigUtils.shouldGenerateImage('live'),
          fallback_used: true
        }
      };
    }
  }

  /**
   * Generate betting content
   */
  private async generateBettingContent(language: Language, maxItems: number, channelId: string): Promise<ContentGenerationResult> {
    try {
      console.log(`🎯 Using betting tips generator for ${language}`);
      
      // Try multiple attempts to get betting content
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`🎯 Betting attempt ${attempt}/3`);
        
        const result = await bettingTipsGenerator.generateBettingTips({
          language,
          channelId
        });
        
        if (result) {
          console.log('✅ Successfully generated betting content');
          return {
            contentItems: [{
              id: result.metadata.contentId,
              type: 'betting',
              title: result.title,
              content: result.content,
              language: language,
              imageUrl: result.imageUrl,
              metadata: result.metadata
            }],
            processingInfo: {
              data_source: `Betting Tips Generator (Attempt ${attempt})`,
              ai_processing: true,
              image_generation: !!result.imageUrl,
              fallback_used: false
            }
          };
        }
        
        console.log(`⚠️ Attempt ${attempt} failed, trying again...`);
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Only fail if ALL attempts failed - don't fall back to news
      console.log('❌ All betting attempts failed');
      throw new Error('Betting content generation failed after 3 attempts');
      
    } catch (error) {
      console.error('❌ Error generating betting content:', error);
      
      // Return a proper error instead of falling back to news
      return {
        contentItems: [],
        processingInfo: {
          data_source: 'Betting Generator Failed',
          ai_processing: false,
          image_generation: false,
          fallback_used: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Generate news content
   */
  private async generateNewsContent(language: Language, maxItems: number, channelId: string): Promise<ContentGenerationResult> {
    try {
      console.log(`📰 Using news content generator for ${language}`);
      const result = await newsContentGenerator.generateNewsContent({
        language,
        channelId
      });
      
      if (!result) {
        console.log('❌ No RSS news available - returning empty content');
        return {
          contentItems: [],
          processingInfo: {
            data_source: 'News Generator - No RSS Data Available',
            ai_processing: false,
            image_generation: false,
            fallback_used: false,
            error: 'No RSS feeds available'
          }
        };
      }
      
      return {
        contentItems: [{
          id: result.metadata?.contentId || `news_${Date.now()}`,
          type: 'news',
          title: result.title,
          content: result.content,
          language: language,
          imageUrl: result.imageUrl,
          metadata: result.metadata
        }],
        processingInfo: {
          data_source: 'News Generator',
          ai_processing: true,
          image_generation: !!result.imageUrl,
          fallback_used: false
        }
      };
    } catch (error) {
      console.error('Error generating news content:', error);
      console.log('❌ News generation failed - returning empty content');
      return {
        contentItems: [],
        processingInfo: {
          data_source: 'News Generator - Error',
          ai_processing: false,
          image_generation: false,
          fallback_used: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Generate polls content
   */
  private async generatePollsContent(language: Language, maxItems: number, channelId: string, customContent?: any): Promise<ContentGenerationResult> {
    try {
      console.log(`🗳️ Using polls generator for ${language}`);
      
      // בדיקה אם יש custom_content (לסקרים ישירים)
      if (customContent && customContent.content_items) {
        console.log('🗳️ Using custom poll content provided by simple-polls API');
        return {
          contentItems: customContent.content_items,
          processingInfo: { 
            data_source: 'Custom Poll Content', 
            ai_processing: false, 
            image_generation: ContentConfigUtils.shouldGenerateImage('polls'), 
            fallback_used: false 
          }
        };
      }
      
      const result = await pollsGenerator.generatePoll({
        language,
        channelId,
        pollType: 'match_prediction'
      });
      
      return {
        contentItems: result ? [{
          id: result.metadata?.contentId || `poll_${Date.now()}`,
          type: 'poll',
          title: result.title,
          content: result.aiEditedContent || result.content,
          language: language,
          poll: {
            question: result.pollContent.telegramPoll.question,
            options: result.pollContent.telegramPoll.options.map(opt => opt.text),
            isAnonymous: result.pollContent.telegramPoll.is_anonymous,
            type: result.pollContent.telegramPoll.type,
            allowsMultipleAnswers: result.pollContent.telegramPoll.allows_multiple_answers,
            correctOptionId: result.pollContent.telegramPoll.correct_option_id,
            explanation: result.pollContent.telegramPoll.explanation,
            openPeriod: result.pollContent.telegramPoll.open_period,
            closeDate: result.pollContent.telegramPoll.close_date
          },
          metadata: result.metadata
        }] : [],
        processingInfo: {
          data_source: result ? 'Polls Generator' : 'No polls available',
          ai_processing: true,
          image_generation: ContentConfigUtils.shouldGenerateImage('polls'),
          fallback_used: !result
        }
      };
    } catch (error) {
      console.error('Error generating polls content with new generator:', error);
      return await this.generateFallbackContent('polls', language, maxItems);
    }
  }

  /**
   * Generate analysis content
   */
  private async generateAnalysisContent(language: Language, maxItems: number, channelId: string): Promise<ContentGenerationResult> {
    try {
      console.log(`📈 Using match analysis generator for ${language}`);
      const result = await matchAnalysisGenerator.generateMatchAnalysis({
        language,
        channelId
      });
      
      if (!result) {
        return {
          contentItems: [],
          processingInfo: {
            data_source: 'Analysis Generator - No Result',
            ai_processing: false,
            image_generation: false,
            fallback_used: true
          }
        };
      }
      
      return {
        contentItems: [{
          id: result.metadata?.contentId || `analysis_${Date.now()}`,
          type: 'analysis',
          title: result.title,
          content: result.content,
          language: language,
          imageUrl: result.imageUrl,
          metadata: result.metadata
        }],
        processingInfo: {
          data_source: 'Analysis Generator',
          ai_processing: true,
          image_generation: !!result.imageUrl,
          fallback_used: false
        }
      };
    } catch (error) {
      console.error('Error generating analysis content with enhanced generator:', error);
      return {
        contentItems: [],
        processingInfo: {
          data_source: 'Analysis content generation failed',
          ai_processing: false,
          image_generation: false,
          fallback_used: true
        }
      };
    }
  }

  /**
   * Generate coupons content
   */
  private async generateCouponsContent(language: Language, maxItems: number, channelId: string): Promise<ContentGenerationResult> {
    try {
      console.log(`🎫 Using smart coupons generator for ${language}`);
      
      // Smart coupons work differently - they need context
      const context = {
        contentType: 'betting_tip',
        channelId: channelId,
        language: language as 'en' | 'am' | 'sw',
        timeContext: {
          hour: new Date().getHours(),
          dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
          isWeekend: [0, 6].includes(new Date().getDay())
        }
      };
      
      const coupon = await smartCouponsGenerator.getSmartCouponForContext(context);
      
      return {
        contentItems: coupon ? [{
          id: coupon.metadata.contentId,
          type: 'coupon',
          title: coupon.title,
          content: coupon.content,
          language: language,
          imageUrl: coupon.imageUrl,
          metadata: coupon.metadata
        }] : [],
        processingInfo: {
          data_source: coupon ? 'Smart Coupons Generator' : 'No contextual coupons available',
          ai_processing: true,
          image_generation: !!coupon?.imageUrl,
          fallback_used: !coupon
        }
      };
    } catch (error) {
      console.error('Error generating coupons content with new generator:', error);
      return await this.generateFallbackContent('coupons', language, maxItems);
    }
  }

  /**
   * Generate memes content (placeholder)
   */
  private async generateMemesContent(language: Language, maxItems: number, channelId: string): Promise<ContentGenerationResult> {
    try {
      console.log(`😂 Generating memes content for ${language} (placeholder)`);
      // Memes generator not implemented yet - using fallback
      return await this.generateFallbackContent('memes', language, maxItems);
    } catch (error) {
      console.error('Error generating memes content with new generator:', error);
      return await this.generateFallbackContent('memes', language, maxItems);
    }
  }

  /**
   * Generate daily summary content
   */
  private async generateDailySummaryContent(language: Language, maxItems: number, channelId: string): Promise<ContentGenerationResult> {
    try {
      console.log(`📋 Using daily summary generator for ${language}`);
      
      // 🗓️ IMPORTANT: Daily summary runs at 00:30 (after midnight)
      // We need to get matches from the previous day, not current day
      const now = new Date();
      const currentHour = now.getHours();
      
      // If it's between 00:00 and 06:00, use previous day's matches
      let targetDate: string | undefined;
      if (currentHour >= 0 && currentHour < 6) {
        const previousDay = new Date(now);
        previousDay.setDate(previousDay.getDate() - 1);
        targetDate = previousDay.toISOString().split('T')[0];
        console.log(`🗓️ Early morning (${currentHour}:00): Using previous day's matches: ${targetDate}`);
      }
      
      const result = await dailyWeeklySummaryGenerator.generateSummary({
        type: 'daily',
        language,
        channelId,
        targetDate
      });
      
      if (!result) {
        return {
          contentItems: [],
          processingInfo: {
            data_source: 'Daily Summary Generator - No Result',
            ai_processing: false,
            image_generation: false,
            fallback_used: true
          }
        };
      }
      
      return {
        contentItems: [{
          id: result.metadata?.contentId || `daily_${Date.now()}`,
          type: 'daily_summary',
          title: result.title,
          content: result.content,
          language: language,
          imageUrl: result.imageUrl,
          metadata: result.metadata
        }],
        processingInfo: {
          data_source: 'Daily Summary Generator',
          ai_processing: true,
          image_generation: !!result.imageUrl,
          fallback_used: false
        }
      };
    } catch (error) {
      console.error('Error generating daily summary content with new generator:', error);
      return await this.generateFallbackContent('daily_summary', language, maxItems);
    }
  }

  /**
   * Generate weekly summary content
   */
  private async generateWeeklySummaryContent(language: Language, maxItems: number, channelId: string): Promise<ContentGenerationResult> {
    try {
      console.log(`📊 Using weekly summary generator for ${language}`);
      const result = await dailyWeeklySummaryGenerator.generateSummary({
        type: 'weekly',
        language,
        channelId
      });

      if (!result) {
        return {
          contentItems: [],
          processingInfo: {
            data_source: 'Weekly Summary Generator - No Result',
            ai_processing: false,
            image_generation: false,
            fallback_used: true
          }
        };
      }

      return {
        contentItems: [{
          id: result.metadata?.contentId || `weekly_${Date.now()}`,
          type: 'weekly_summary',
          title: result.title,
          content: result.content,
          language: language,
          imageUrl: result.imageUrl,
          metadata: result.metadata
        }],
        processingInfo: {
          data_source: 'Weekly Summary Generator',
          ai_processing: true,
          image_generation: !!result.imageUrl,
          fallback_used: false
        }
      };

    } catch (error) {
      console.error('Error generating weekly summary with generator:', error);
      return await this.generateFallbackContent('weekly_summary', language, maxItems);
    }
  }

  /**
   * Generate fallback content when no real data is available
   */
  async generateFallbackContent(contentType: string, language: Language, maxItems: number): Promise<ContentGenerationResult> {
    console.log(`📰 Using fallback content for ${contentType} in ${language} (last month's news)`);
    
    // תוכן מותאם לשפה
    const templates = {
      en: {
        title: `📰 ${contentType.toUpperCase()}: Recent Football Updates`,
        content: `📰 RECENT FOOTBALL NEWS\n\n⚽ Latest updates from the football world\n🏆 Top stories from recent matches\n📅 ${new Date().toDateString()}\n\nStay tuned for more updates...\n\n#${contentType.toUpperCase()} #${language.toUpperCase()}`
      },
      am: {
        title: `📰 ${contentType.toUpperCase()}: የቅርብ ጊዜ የእግር ኳስ ዝማኔዎች`,
        content: `📰 የቅርብ ጊዜ የእግር ኳስ ዜናዎች\n\n⚽ ከእግር ኳስ አለም የቅርብ ጊዜ ዝማኔዎች\n🏆 ከቅርብ ግጥሚያዎች ዋና ዋና ታሪኮች\n📅 ${new Date().toLocaleDateString('am-ET')}\n\nለተጨማሪ ዝማኔዎች ተከታተሉን...\n\n#${contentType.toUpperCase()} #${language.toUpperCase()}`
      },
      sw: {
        title: `📰 ${contentType.toUpperCase()}: Masasisho ya Hivi Karibuni ya Mpira wa Miguu`,
        content: `📰 HABARI ZA HIVI KARIBUNI ZA MPIRA WA MIGUU\n\n⚽ Masasisho ya hivi karibuni kutoka ulimwenguni mwa mpira wa miguu\n🏆 Hadithi kuu kutoka mechi za hivi karibuni\n📅 ${new Date().toLocaleDateString('sw-KE')}\n\nEndelea kufuatilia kwa masasisho zaidi...\n\n#${contentType.toUpperCase()} #${language.toUpperCase()}`
      }
    };

    const template = templates[language];
    
    const fallbackContent = [{
      id: `fallback_${contentType}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      type: contentType,
      title: template.title,
      content: template.content,
      language,
      generated_at: new Date().toISOString(),
      priority: 8,
      note: 'Fallback content - based on recent news from last month',
      metadata: {
        fallback: true,
        source: 'fallback_generator'
      }
    }];

    return {
      contentItems: fallbackContent.slice(0, maxItems),
      processingInfo: { 
        data_source: 'Fallback - Last month news', 
        ai_processing: false, 
        image_generation: false, 
        fallback_used: true 
      }
    };
  }

  /**
   * Generate content by type (legacy method for backward compatibility)
   */
  async generateContentByType(type: ContentType, language: Language, maxItems: number): Promise<ContentGenerationResult> {
    return await this.generateContent({
      type,
      language,
      maxItems
    });
  }

  /**
   * Check if content type is supported
   */
  isContentTypeSupported(type: string): boolean {
    const supportedTypes: ContentType[] = [
      'live', 'betting', 'news', 'polls', 'analysis', 'coupons', 'memes', 'daily_summary', 'weekly_summary'
    ];
    return supportedTypes.includes(type as ContentType);
  }

  /**
   * Get content type priority (for scheduling)
   */
  getContentTypePriority(type: ContentType): number {
    const priorities: Record<ContentType, number> = {
      live: 1,
      betting: 2,
      news: 3,
      polls: 4,
      analysis: 5,
      coupons: 6,
      memes: 7,
      daily_summary: 8,
      weekly_summary: 9
    };
    return priorities[type] || 10;
  }

  /**
   * Get supported content types
   */
  getSupportedContentTypes(): Array<{ type: ContentType; priority: number; description: string }> {
    return [
      { type: 'live', priority: 1, description: 'Real-time match updates' },
      { type: 'betting', priority: 2, description: 'AI-powered betting tips' },
      { type: 'news', priority: 3, description: 'RSS-based news summaries' },
      { type: 'polls', priority: 4, description: 'Interactive fan polls' },
      { type: 'analysis', priority: 5, description: 'Match analysis reports' },
      { type: 'coupons', priority: 6, description: 'Affiliate promotions' },
      { type: 'memes', priority: 7, description: 'Entertainment content' },
      { type: 'daily_summary', priority: 8, description: 'Daily recap reports' },
      { type: 'weekly_summary', priority: 9, description: 'Weekly summary reports' }
    ];
  }
}

export const contentRouter = new ContentRouter(); 