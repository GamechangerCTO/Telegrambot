/**
 * 📰 OPTIMIZED NEWS CONTENT GENERATOR
 * 
 * Performance improvements:
 * - Parallel RSS fetching with timeout
 * - Caching for RSS feeds
 * - Batch processing for scoring
 * - Smart image handling
 * - Optimized AI calls
 */

import { unifiedFootballService } from './unified-football-service';
import { aiImageGenerator } from './ai-image-generator';
import { supabase } from '@/lib/supabase';
import { rssNewsFetcher, RSSItem } from './rss-news-fetcher';
import { getOpenAIClient } from '../api-keys';

// Cache for RSS feeds
const RSS_CACHE = new Map<string, { data: NewsItem[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  content: string;
  imageUrl?: string;
  sourceUrl: string;
  publishedAt: string;
  source: string;
  category: string;
  relevanceScore?: number;
}

export interface NewsGenerationRequest {
  language: 'en' | 'am' | 'sw';
  channelId: string;
  maxResults?: number;
  excludeUsedContent?: boolean;
}

export interface GeneratedNews {
  title: string;
  content: string;
  imageUrl?: string;
  sourceUrl: string;
  aiEditedContent?: string;
  metadata: {
    language: string;
    source: string;
    contentId: string;
    generatedAt: string;
    relevanceScore: number;
  };
}

export class OptimizedNewsContentGenerator {
  private scoreCache = new Map<string, number>();
  private usedContentCache = new Map<string, Set<string>>();
  private cacheTimeout = 10 * 60 * 1000; // 10 minutes

  /**
   * 🎯 MAIN FUNCTION - Generate news content (OPTIMIZED)
   */
  async generateNewsContent(request: NewsGenerationRequest): Promise<GeneratedNews | null> {
    console.log(`📰 Generating news content in ${request.language}`);
    const startTime = Date.now();
    
    try {
      // Step 1: Get RSS news feeds (with caching)
      const rssNews = await this.fetchRSSNewsOptimized();
      if (rssNews.length === 0) {
        console.log(`❌ No RSS news found`);
        return null;
      }
      console.log(`✅ Fetched ${rssNews.length} news items in ${Date.now() - startTime}ms`);

      // Step 2: Score and rank news items (batch processing)
      const scoredNews = this.scoreAndRankNewsOptimized(rssNews);
      
      // Step 3: Check uniqueness and get best unused news
      const bestNews = await this.getBestUnusedNewsOptimized(scoredNews, request.channelId);
      if (!bestNews) {
        console.log(`❌ No new/unused news found`);
        return null;
      }

      console.log(`✅ Selected news: "${bestNews.title}" (Score: ${bestNews.relevanceScore})`);

      // Step 4 & 5: Handle image and AI edit in parallel
      const [imageUrl, aiEditedContent] = await Promise.all([
        this.handleNewsImageOptimized(bestNews),
        this.aiEditNewsContentOptimized(bestNews, request.language)
      ]);
      
      // Step 6: Mark content as used (async, don't wait)
      this.markContentAsUsed(bestNews.id, request.channelId).catch(err => 
        console.error('Error marking content as used:', err)
      );

      const totalTime = Date.now() - startTime;
      console.log(`✅ News generation completed in ${totalTime}ms`);

      return {
        title: bestNews.title,
        content: aiEditedContent,
        imageUrl,
        sourceUrl: bestNews.sourceUrl,
        aiEditedContent,
        metadata: {
          language: request.language,
          source: bestNews.source,
          contentId: bestNews.id,
          generatedAt: new Date().toISOString(),
          relevanceScore: bestNews.relevanceScore || 0
        }
      };

    } catch (error) {
      console.error(`❌ Error generating news content:`, error);
      return null;
    }
  }

  /**
   * 📡 OPTIMIZED: Fetch RSS with caching and timeout
   */
  private async fetchRSSNewsOptimized(): Promise<NewsItem[]> {
    const cacheKey = 'all-feeds';
    const cached = RSS_CACHE.get(cacheKey);
    
    // Return cached data if fresh
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('📰 Using cached RSS feeds');
      return cached.data;
    }

    console.log(`📡 Fetching fresh RSS feeds`);
    
    try {
      // Fetch with longer timeout and retry logic
      const fetchPromise = this.fetchWithRetry();
      const timeoutPromise = new Promise<RSSItem[]>((_, reject) => 
        setTimeout(() => reject(new Error('RSS fetch timeout')), 30000) // הארכת timeout ל-30 שניות
      );
      
      const rssItems = await Promise.race([fetchPromise, timeoutPromise]);
      
      // Convert to NewsItem format
      const newsItems: NewsItem[] = rssItems.map(rssItem => ({
        id: rssItem.id,
        title: rssItem.title,
        description: rssItem.description,
        content: rssItem.content,
        imageUrl: rssItem.imageUrl,
        sourceUrl: rssItem.link,
        publishedAt: rssItem.pubDate,
        source: rssItem.source,
        category: rssItem.category || 'Football'
      }));

      // Cache the results
      RSS_CACHE.set(cacheKey, { data: newsItems, timestamp: Date.now() });
      
      console.log(`📰 Fetched and cached ${newsItems.length} news items`);
      return newsItems;
      
    } catch (error) {
      console.error(`❌ Error fetching RSS news:`, error);
      // Return cached data even if expired
      const expiredCached = RSS_CACHE.get(cacheKey);
      if (expiredCached && expiredCached.data.length > 0) {
        console.log('📰 Using expired cached RSS feeds as fallback');
        return expiredCached.data;
      }
      
      // DON'T use fallback data - return empty array so system returns null
      console.log('❌ No RSS feeds available and no cache - returning empty array');
      return [];
    }
  }

  /**
   * 🔄 Fetch with retry logic
   */
  private async fetchWithRetry(maxRetries: number = 2): Promise<RSSItem[]> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📡 RSS fetch attempt ${attempt}/${maxRetries}`);
        const result = await rssNewsFetcher.fetchAllFeeds();
        
        if (result.length > 0) {
          console.log(`✅ RSS fetch successful on attempt ${attempt}`);
          return result;
        }
        
        // If no items found, try again (unless last attempt)
        if (attempt < maxRetries) {
          console.log(`⚠️ No RSS items found, retrying in 3 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
      } catch (error) {
        lastError = error;
        console.error(`❌ RSS fetch attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          console.log(`🔄 Retrying in 5 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }
    
    throw lastError || new Error('All RSS fetch attempts failed');
  }

  /**
   * 🏆 OPTIMIZED: Score with caching and batch processing
   */
  private scoreAndRankNewsOptimized(newsItems: NewsItem[]): NewsItem[] {
    console.log(`🏆 Scoring ${newsItems.length} news items`);
    
    // Pre-compile regex patterns for better performance
    const patterns = {
      premierLeague: /premier league/i,
      championsLeague: /champions league|uefa/i,
      europaLeague: /europa league/i,
      worldCup: /world cup|fifa/i,
      euro: /euro 202[4-9]|european championship/i,
      goal: /goal|score/i,
      hatTrick: /hat[\s-]?trick/i,
      penalty: /penalty|red card/i,
      derby: /derby|classico/i,
      transfer: /transfer|signing/i,
      contract: /contract|deal/i,
      money: /million|[€£$]/,
      final: /final|semi-final/i,
      quarterFinal: /quarter-final|playoff/i,
      title: /title|championship/i,
      manager: /manager|coach/i,
      injury: /injury|injured/i,
      suspension: /suspension|banned/i
    };

    const topTeams = new Set([
      'manchester city', 'arsenal', 'liverpool', 'chelsea', 'manchester united',
      'real madrid', 'barcelona', 'bayern munich', 'psg', 'juventus'
    ]);

    const premiumSources = new Set(['bbc', 'sky sports', 'guardian', 'reuters', 'espn']);
    const goodSources = new Set(['talksport', 'goal', 'marca', 'as']);
    
    const scoredNews = newsItems.map(news => {
      // Check cache first
      const cacheKey = news.id;
      if (this.scoreCache.has(cacheKey)) {
        return { ...news, relevanceScore: this.scoreCache.get(cacheKey) };
      }

      let score = 0;
      const fullText = `${news.title} ${news.content} ${news.description}`.toLowerCase();
      
      // Competition scoring
      if (patterns.premierLeague.test(fullText)) score += 15;
      if (patterns.championsLeague.test(fullText)) score += 15;
      if (patterns.europaLeague.test(fullText)) score += 12;
      if (patterns.worldCup.test(fullText)) score += 20;
      if (patterns.euro.test(fullText)) score += 18;
      
      // Team scoring (optimized)
      for (const team of topTeams) {
        if (fullText.includes(team)) {
          score += 10;
          break; // One team match is enough
        }
      }
      
      // Event scoring
      if (patterns.goal.test(fullText)) score += 8;
      if (patterns.hatTrick.test(fullText)) score += 12;
      if (patterns.penalty.test(fullText)) score += 7;
      if (patterns.derby.test(fullText)) score += 10;
      if (patterns.transfer.test(fullText)) score += 8;
      if (patterns.contract.test(fullText)) score += 6;
      if (patterns.money.test(fullText)) score += 5;
      if (patterns.final.test(fullText)) score += 12;
      if (patterns.quarterFinal.test(fullText)) score += 8;
      if (patterns.title.test(fullText)) score += 10;
      if (patterns.manager.test(fullText)) score += 6;
      if (patterns.injury.test(fullText)) score += 5;
      if (patterns.suspension.test(fullText)) score += 6;
      
      // Recency scoring (optimized calculation)
      const hoursAgo = (Date.now() - new Date(news.publishedAt).getTime()) / 3600000;
      if (hoursAgo < 1) score += 15;
      else if (hoursAgo < 3) score += 12;
      else if (hoursAgo < 6) score += 10;
      else if (hoursAgo < 12) score += 8;
      else if (hoursAgo < 24) score += 6;
      else if (hoursAgo < 48) score += 3;
      
      // Image bonus
      if (news.imageUrl) score += 5;
      
      // Source scoring (optimized)
      const sourceLower = news.source.toLowerCase();
      if ([...premiumSources].some(s => sourceLower.includes(s))) score += 8;
      else if ([...goodSources].some(s => sourceLower.includes(s))) score += 5;
      
      // Content quality
      const contentLength = news.content.length;
      if (contentLength > 300) score += 4;
      if (contentLength > 500) score += 2;
      
      // Category bonus
      if (news.category === 'Premier League') score += 8;
      if (news.category === 'Champions League') score += 8;
      if (news.category === 'Transfer News') score += 6;

      // Cache the score
      this.scoreCache.set(cacheKey, score);

      return { ...news, relevanceScore: score };
    });

    // Sort by relevance score
    return scoredNews.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  }

  /**
   * 🔍 OPTIMIZED: Get best unused news with caching
   */
  private async getBestUnusedNewsOptimized(scoredNews: NewsItem[], channelId: string): Promise<NewsItem | null> {
    console.log(`🔍 Finding best unused news for channel ${channelId}`);
    
    // Get cached used content IDs
    let usedContentIds = this.usedContentCache.get(channelId);
    
    if (!usedContentIds) {
      const ids = await this.getUsedContentIds(channelId);
      usedContentIds = new Set(ids);
      this.usedContentCache.set(channelId, usedContentIds);
      
      // Clear cache after timeout
      setTimeout(() => this.usedContentCache.delete(channelId), this.cacheTimeout);
    }
    
    // Find first unused news
    for (const news of scoredNews) {
      if (!usedContentIds.has(news.id)) {
        console.log(`✅ Found unused news: "${news.title}"`);
        return news;
      }
    }
    
    console.log(`⚠️ All news items have been used for channel ${channelId}`);
    return null;
  }

  /**
   * 🖼️ OPTIMIZED: Handle image with quick validation
   */
  private async handleNewsImageOptimized(news: NewsItem): Promise<string | undefined> {
    // Use RSS image if available
    if (news.imageUrl) {
      console.log(`✅ Using RSS image`);
      return news.imageUrl;
    }
    
    // Generate only if really needed
    console.log(`🎨 Generating AI image`);
    
    try {
      const generatedImage = await aiImageGenerator.generateNewsImage(
        news.content.substring(0, 500), // Limit content for faster processing
        news.title,
        'en'
      );
      
      return generatedImage?.url;
    } catch (error) {
      console.error(`❌ Error generating image:`, error);
      return undefined;
    }
  }

  /**
   * 🤖 OPTIMIZED: AI edit with fallback
   */
  private async aiEditNewsContentOptimized(news: NewsItem, language: 'en' | 'am' | 'sw'): Promise<string> {
    // Quick template for non-English languages if content is already short
    if (language !== 'en' && news.content.length < 300) {
      return this.createTemplateNewsContent(news, language);
    }

    console.log(`🤖 AI editing news content for language: ${language}`);
    
    try {
      const openai = await getOpenAIClient();
      if (!openai) {
        return this.createTemplateNewsContent(news, language);
      }

      const systemPrompts = {
        'en': `Football journalist. Create 4-5 line summary with emojis. End with hashtags.`,
        'am': `Football journalist writing ONLY in Amharic. 4-5 lines. End with Amharic & English hashtags.`,
        'sw': `Football journalist writing ONLY in Swahili. 4-5 lines. End with Swahili & English hashtags.`
      };

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // Faster model
        messages: [
          { role: "system", content: systemPrompts[language] },
          { 
            role: "user", 
            content: `Summarize in ${language === 'en' ? 'English' : language === 'am' ? 'Amharic' : 'Swahili'}:\n\nTitle: ${news.title}\nContent: ${news.content.substring(0, 500)}` 
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      });

      return response.choices[0]?.message?.content?.trim() || this.createTemplateNewsContent(news, language);
      
    } catch (error) {
      console.error('❌ Error with AI:', error);
      return this.createTemplateNewsContent(news, language);
    }
  }

  /**
   * 📝 Create template-based news content (fallback)
   */
  private createTemplateNewsContent(news: NewsItem, language: 'en' | 'am' | 'sw'): string {
    const shortContent = this.shortenContent(news.content, 200);
    
    const templates = {
      en: `⚽ ${news.title}\n\n${shortContent}\n\n🔗 ${news.source}\n\n#FootballNews #Breaking`,
      am: `⚽ ${news.title}\n\n${shortContent}\n\n🔗 ምንጭ፡ ${news.source}\n\n#እግርኳስዜና #FootballNews`,
      sw: `⚽ ${news.title}\n\n${shortContent}\n\n🔗 Chanzo: ${news.source}\n\n#HabariMpira #FootballNews`
    };

    return templates[language];
  }

  /**
   * ✂️ Shorten content efficiently
   */
  private shortenContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) return content;
    
    const truncated = content.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return truncated.substring(0, lastSpace) + '...';
  }

  /**
   * 📊 Get used content IDs
   */
  private async getUsedContentIds(channelId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('content_uniqueness')
        .select('content_id')
        .eq('channel_id', channelId)
        .eq('content_type', 'news');

      if (error) throw error;
      return (data?.map((item: { content_id: string }) => item.content_id)) || [];

    } catch (error) {
      console.error(`❌ Error fetching used content:`, error);
      return [];
    }
  }

  /**
   * ✅ Mark content as used (async)
   */
  private async markContentAsUsed(contentId: string, channelId: string): Promise<void> {
    try {
      await supabase
        .from('content_uniqueness')
        .insert({
          content_id: contentId,
          channel_id: channelId,
          content_type: 'news',
          used_at: new Date().toISOString(),
          variation_token: `NEWS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });

    } catch (error) {
      console.error(`❌ Error marking content as used:`, error);
    }
  }

  /**
   * 🎯 Quick method: Get latest football news (cached)
   */
  async getLatestFootballNews(language: 'en' | 'am' | 'sw' = 'en', limit: number = 5): Promise<NewsItem[]> {
    const rssNews = await this.fetchRSSNewsOptimized();
    const scoredNews = this.scoreAndRankNewsOptimized(rssNews);
    return scoredNews.slice(0, limit);
  }

  /**
   * 🧹 Clear all caches
   */
  clearCaches(): void {
    RSS_CACHE.clear();
    this.scoreCache.clear();
    this.usedContentCache.clear();
    console.log('✅ All caches cleared');
  }
}

// Export singleton instance
export const newsContentGenerator = new OptimizedNewsContentGenerator();