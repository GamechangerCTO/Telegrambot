/**
 * 📰 NEWS CONTENT GENERATOR
 * 
 * Flow for News Content:
 * 1. Get RSS feeds → 2. Score/rank news → 3. Check uniqueness → 4. Use RSS image or generate → 5. AI edit → 6. Send
 * 
 * Key features:
 * - Uses RSS feeds as source
 * - Content uniqueness tracking
 * - Uses RSS images first, generates only if missing
 * - AI content editing for quality
 * - Multi-language support
 */

import { unifiedFootballService } from './unified-football-service';
import { aiImageGenerator } from './ai-image-generator';
import { supabase } from '@/lib/supabase';
import { rssNewsFetcher, RSSItem } from './rss-news-fetcher';
import { getOpenAIClient } from '../api-keys';

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

export class NewsContentGenerator {

  /**
   * 🎯 MAIN FUNCTION - Generate news content
   */
  async generateNewsContent(request: NewsGenerationRequest): Promise<GeneratedNews | null> {
    console.log(`📰 Generating news content in ${request.language}`);
    
    try {
      // Step 1: Get RSS news feeds
      const rssNews = await this.fetchRSSNews();
      if (rssNews.length === 0) {
        console.log(`❌ No RSS news found`);
        return null;
      }

      // Step 2: Score and rank news items
      const scoredNews = await this.scoreAndRankNews(rssNews);
      
      // Step 3: Check uniqueness and get best unused news
      const bestNews = await this.getBestUnusedNews(scoredNews, request.channelId);
      if (!bestNews) {
        console.log(`❌ No new/unused news found`);
        return null;
      }

      console.log(`✅ Selected news: "${bestNews.title}" (Score: ${bestNews.relevanceScore})`);

      // Step 4: Handle image (RSS first, generate if missing)
      const imageUrl = await this.handleNewsImage(bestNews);
      
      // Step 5: AI edit the content for quality and language
      const aiEditedContent = await this.aiEditNewsContent(bestNews, request.language);
      
      // Step 6: Mark content as used
      await this.markContentAsUsed(bestNews.id, request.channelId);

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
   * 📡 Step 1: Fetch RSS news from multiple sources using RSSNewsFetcher
   */
  private async fetchRSSNews(): Promise<NewsItem[]> {
    console.log(`📡 Fetching RSS news using RSSNewsFetcher`);
    
    try {
      // Use the real RSS fetcher
      const rssItems = await rssNewsFetcher.fetchAllFeeds();
      
      // Convert RSSItem to NewsItem format
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

      console.log(`📰 Total RSS news fetched: ${newsItems.length}`);
      return newsItems;
      
    } catch (error) {
      console.error(`❌ Error fetching RSS news:`, error);
      return [];
    }
  }


  /**
   * 🏆 Step 2: Score and rank news items using football intelligence
   */
  private async scoreAndRankNews(newsItems: NewsItem[]): Promise<NewsItem[]> {
    console.log(`🏆 Scoring ${newsItems.length} news items`);
    
    const scoredNews = newsItems.map(news => {
      let score = 0;
      
      const title = news.title.toLowerCase();
      const content = news.content.toLowerCase();
      const description = news.description.toLowerCase();
      const fullText = `${title} ${content} ${description}`;
      
      // Premier competition scoring (highest priority)
      if (fullText.includes('premier league')) score += 15;
      if (fullText.includes('champions league') || fullText.includes('uefa')) score += 15;
      if (fullText.includes('europa league')) score += 12;
      if (fullText.includes('world cup') || fullText.includes('fifa')) score += 20;
      if (fullText.includes('euro 2024') || fullText.includes('european championship')) score += 18;
      
      // Top team scoring
      const topTeams = ['manchester city', 'arsenal', 'liverpool', 'chelsea', 'manchester united', 
                        'real madrid', 'barcelona', 'bayern munich', 'psg', 'juventus'];
      topTeams.forEach(team => {
        if (fullText.includes(team)) score += 10;
      });
      
      // Match event scoring
      if (fullText.includes('goal') || fullText.includes('score')) score += 8;
      if (fullText.includes('hat trick') || fullText.includes('hat-trick')) score += 12;
      if (fullText.includes('penalty') || fullText.includes('red card')) score += 7;
      if (fullText.includes('derby') || fullText.includes('classico')) score += 10;
      
      // Transfer and contract scoring
      if (fullText.includes('transfer') || fullText.includes('signing')) score += 8;
      if (fullText.includes('contract') || fullText.includes('deal')) score += 6;
      if (fullText.includes('million') || fullText.includes('€') || fullText.includes('£')) score += 5;
      
      // Match significance
      if (fullText.includes('final') || fullText.includes('semi-final')) score += 12;
      if (fullText.includes('quarter-final') || fullText.includes('playoff')) score += 8;
      if (fullText.includes('title') || fullText.includes('championship')) score += 10;
      
      // Manager and player news
      if (fullText.includes('manager') || fullText.includes('coach')) score += 6;
      if (fullText.includes('injury') || fullText.includes('injured')) score += 5;
      if (fullText.includes('suspension') || fullText.includes('banned')) score += 6;
      
      // Recency scoring (newer = higher score)
      const publishedDate = new Date(news.publishedAt);
      const hoursAgo = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60);
      if (hoursAgo < 1) score += 15;
      else if (hoursAgo < 3) score += 12;
      else if (hoursAgo < 6) score += 10;
      else if (hoursAgo < 12) score += 8;
      else if (hoursAgo < 24) score += 6;
      else if (hoursAgo < 48) score += 3;
      
      // Image bonus
      if (news.imageUrl) score += 5;
      
      // Source reliability and authority scoring
      const premiumSources = ['bbc', 'sky sports', 'guardian', 'reuters', 'espn'];
      const goodSources = ['talksport', 'goal', 'marca', 'as'];
      
      if (premiumSources.some(source => news.source.toLowerCase().includes(source))) {
        score += 8;
      } else if (goodSources.some(source => news.source.toLowerCase().includes(source))) {
        score += 5;
      }
      
      // Content quality scoring
      if (news.content.length > 300) score += 4; // Longer, more detailed content
      if (news.content.length > 500) score += 2;
      
      // Category bonus
      if (news.category === 'Premier League') score += 8;
      if (news.category === 'Champions League') score += 8;
      if (news.category === 'Transfer News') score += 6;

      return {
        ...news,
        relevanceScore: score
      };
    });

    // Sort by relevance score (highest first)
    const sortedNews = scoredNews.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    
    console.log(`🏆 Top 3 scored news: ${sortedNews.slice(0, 3).map(n => `"${n.title}" (${n.relevanceScore})`).join(', ')}`);
    
    return sortedNews;
  }

  /**
   * 🔍 Step 3: Get best unused news (avoid duplicates)
   */
  private async getBestUnusedNews(scoredNews: NewsItem[], channelId: string): Promise<NewsItem | null> {
    console.log(`🔍 Finding best unused news for channel ${channelId}`);
    
    // Get list of used content for this channel
    const usedContentIds = await this.getUsedContentIds(channelId);
    
    // Find first news item that hasn't been used
    for (const news of scoredNews) {
      if (!usedContentIds.includes(news.id)) {
        console.log(`✅ Found unused news: "${news.title}"`);
        return news;
      }
    }
    
    console.log(`⚠️ All news items have been used for channel ${channelId}`);
    return null;
  }

  /**
   * 🖼️ Step 4: Handle image (RSS first, generate if missing)
   */
  private async handleNewsImage(news: NewsItem): Promise<string | undefined> {
    console.log(`🖼️ Handling image for news: "${news.title}"`);
    
    // First, try to use RSS image
    if (news.imageUrl) {
      console.log(`✅ Using RSS image: ${news.imageUrl}`);
      return news.imageUrl;
    }
    
    // No RSS image, generate one
    console.log(`🎨 No RSS image found, generating AI image`);
    
    try {
      const generatedImage = await aiImageGenerator.generateNewsImage(
        news.content,
        news.title,
        'en' // Always use English for image generation as it works better
      );
      
      if (!generatedImage) {
        console.log(`⚠️ No image generated for news`);
        return undefined;
      }

      console.log(`✅ Generated and uploaded image: ${generatedImage.url}`);
      return generatedImage.url;

    } catch (error) {
      console.error(`❌ Error generating image for news:`, error);
      return undefined;
    }
  }

  /**
   * 🤖 Step 5: AI edit content for quality and language - REAL AI INTEGRATION
   */
  private async aiEditNewsContent(news: NewsItem, language: 'en' | 'am' | 'sw'): Promise<string> {
    console.log(`🤖 AI editing news content for language: ${language}`);
    
    try {
      const openai = await getOpenAIClient();
      if (!openai) {
        console.log('❌ OpenAI client not available, using template-based editing');
        return this.createTemplateNewsContent(news, language);
      }

      const systemPrompts = {
        'en': `You are a professional football journalist. Create concise, engaging news summaries of exactly 4-5 lines. Include relevant emojis.`,
        'am': `You are a professional football journalist writing in AMHARIC language. You MUST write EVERYTHING in Amharic script - including titles, content, and all text. Never use English words. Create concise news summaries of exactly 4-5 lines in Amharic.`,
        'sw': `You are a professional football journalist writing in SWAHILI language. You MUST write EVERYTHING in Swahili - including titles, content, and all text. Never use English words. Create concise news summaries of exactly 4-5 lines in Swahili.`
      };

      const languageInstructions = {
        'en': `Summarize this football news into exactly 4-5 concise lines. Make it engaging and informative. Include relevant emojis:`,
        'am': `ይህን የእግር ኳስ ዜና በትክክል 4-5 መስመሮች ብቻ ወደ አማርኛ ተርጉመህ ሙሉ በሙሉ አጠቃልል። አሳታፊ እና መረጃዎች የያዘ እንዲሆን አድርግ። ስሜት ገላጭ ምልክቶች አካትት። ያስታውስ - ምንም የእንግሊዝኛ ቃላት አትጠቀም፤ ሁሉም ነገር በአማርኛ ብቻ መሆን አለበት:`,
        'sw': `Fupishe habari hii ya mpira wa miguu hasa mistari 4-5 tu kwa Kiswahili. Fanya iwe ya kuvutia na yenye habari muhimu. Jumuisha alama za hisia. Kumbuka - usitumie maneno ya Kiingereza; kila kitu kiwe kwa Kiswahili tu:`
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
            content: `${languageInstructions[language]}\n\nTitle: ${news.title}\nContent: ${news.content}` 
          }
        ],
        max_tokens: language === 'en' ? 300 : 400, // More tokens for other languages due to script differences
        temperature: 0.7
      });

      const enhancedContent = response.choices[0]?.message?.content?.trim();
      
      if (enhancedContent) {
        console.log(`✅ AI enhanced news content in ${language}: "${enhancedContent.substring(0, 100)}..."`);
        return enhancedContent;
      }
      
    } catch (error) {
      console.error('❌ Error enhancing news content with AI:', error);
    }
    
    // Fallback to template-based editing
    return this.createTemplateNewsContent(news, language);
  }

  /**
   * 📝 Create template-based news content (fallback) - 4-5 lines only
   */
  private createTemplateNewsContent(news: NewsItem, language: 'en' | 'am' | 'sw'): string {
    const shortContent = this.shortenContent(news.content, 200); // Much shorter
    
    const templates = {
      en: `⚽ ${this.extractMainPoint(news.title, shortContent)}\n\n${shortContent}\n\n🔗 Source: ${news.source}`,
      
      am: `⚽ ${this.translateToAmharic(news.title)}\n\n${this.translateToAmharic(shortContent)}\n\n🔗 ምንጭ፡ ${news.source}`,
      
      sw: `⚽ ${this.translateToSwahili(news.title)}\n\n${this.translateToSwahili(shortContent)}\n\n🔗 Chanzo: ${news.source}`
    };

    return templates[language] || templates.en;
  }

  /**
   * Extract main point from title and content
   */
  private extractMainPoint(title: string, content: string): string {
    return title.length > 60 ? title.substring(0, 57) + '...' : title;
  }

  /**
   * Basic Amharic translations for fallback
   */
  private translateToAmharic(text: string): string {
    // Basic translations for common football terms
    return text
      .replace(/football/gi, 'እግር ኳስ')
      .replace(/match/gi, 'ጨዋታ')
      .replace(/goal/gi, 'ጎል')
      .replace(/player/gi, 'ተጫዋች')
      .replace(/team/gi, 'ቡድን')
      .replace(/manager/gi, 'አሰልጣኝ')
      .replace(/transfer/gi, 'ማስተላለፍ');
  }

  /**
   * Basic Swahili translations for fallback
   */
  private translateToSwahili(text: string): string {
    // Basic translations for common football terms
    return text
      .replace(/football/gi, 'mpira wa miguu')
      .replace(/match/gi, 'mchezo')
      .replace(/goal/gi, 'goli')
      .replace(/player/gi, 'mchezaji')
      .replace(/team/gi, 'timu')
      .replace(/manager/gi, 'kocha')
      .replace(/transfer/gi, 'uhamisho');
  }

  /**
   * ✂️ Shorten content without "Read More"
   */
  private shortenContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }
    
    // Find the last complete sentence within the limit
    const truncated = content.substring(0, maxLength);
    const lastSentenceEnd = Math.max(
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf('!'),
      truncated.lastIndexOf('?')
    );
    
    if (lastSentenceEnd > maxLength * 0.7) {
      return truncated.substring(0, lastSentenceEnd + 1);
    }
    
    // If no good sentence break, just cut at word boundary
    const lastSpace = truncated.lastIndexOf(' ');
    return truncated.substring(0, lastSpace) + '...';
  }

  /**
   * 🏷️ Extract hashtags from content
   */
  private extractHashtags(content: string): string {
    const text = content.toLowerCase();
    const hashtags = [];
    
    if (text.includes('premier league')) hashtags.push('PremierLeague');
    if (text.includes('champions league')) hashtags.push('ChampionsLeague');
    if (text.includes('transfer')) hashtags.push('Transfers');
    if (text.includes('goal')) hashtags.push('Goals');
    
    return hashtags.slice(0, 2).join(' #') || 'Breaking';
  }



  /**
   * 📊 Get used content IDs for uniqueness check
   */
  private async getUsedContentIds(channelId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('content_uniqueness')
        .select('content_id')
        .eq('channel_id', channelId)
        .eq('content_type', 'news');

      if (error) {
        console.error(`❌ Error fetching used content:`, error);
        return [];
      }

      return data?.map(item => item.content_id) || [];

    } catch (error) {
      console.error(`❌ Error in getUsedContentIds:`, error);
      return [];
    }
  }

  /**
   * ✅ Mark content as used
   */
  private async markContentAsUsed(contentId: string, channelId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('content_uniqueness')
        .insert({
          content_id: contentId,
          channel_id: channelId,
          content_type: 'news',
          used_at: new Date().toISOString(),
          variation_token: `NEWS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });

      if (error) {
        console.error(`❌ Error marking content as used:`, error);
      } else {
        console.log(`✅ Marked content ${contentId} as used for channel ${channelId}`);
      }

    } catch (error) {
      console.error(`❌ Error in markContentAsUsed:`, error);
    }
  }

  /**
   * 🔧 Extract source name from URL
   */
  private extractSourceFromUrl(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace('www.', '').replace('.com', '').replace('.co.uk', '');
    } catch {
      return 'Unknown Source';
    }
  }

  /**
   * 🎯 Quick method: Get latest football news
   */
  async getLatestFootballNews(language: 'en' | 'am' | 'sw' = 'en', limit: number = 5): Promise<NewsItem[]> {
    const rssNews = await this.fetchRSSNews();
    const scoredNews = await this.scoreAndRankNews(rssNews);
    return scoredNews.slice(0, limit);
  }

  /**
   * 🔍 Search news by keyword using RSSNewsFetcher
   */
  async searchNews(keyword: string, language: 'en' | 'am' | 'sw' = 'en'): Promise<NewsItem[]> {
    try {
      // Use RSS fetcher's search functionality
      const rssItems = await rssNewsFetcher.searchByKeyword(keyword);
      
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
      
      // Score and rank the search results
      return await this.scoreAndRankNews(newsItems);
      
    } catch (error) {
      console.error(`❌ Error searching news for keyword "${keyword}":`, error);
      return [];
    }
  }

  /**
   * 🏆 Get top news by priority using RSSNewsFetcher
   */
  async getTopNewsByPriority(language: 'en' | 'am' | 'sw' = 'en', limit: number = 5): Promise<NewsItem[]> {
    try {
      // Use RSS fetcher's priority-based method
      const rssItems = await rssNewsFetcher.getTopNewsByPriority(limit);
      
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
      
      // Apply our own scoring as well for additional intelligence
      return await this.scoreAndRankNews(newsItems);
      
    } catch (error) {
      console.error(`❌ Error getting top news by priority:`, error);
      return [];
    }
  }

  /**
   * 📊 Get news statistics using RSSNewsFetcher
   */
  async getNewsStats(): Promise<{
    totalSources: number;
    totalItems: number;
    itemsPerFeed: { [key: string]: number };
    categories: { [key: string]: number };
    withImages: number;
    withoutImages: number;
    avgItemsPerSource: number;
  }> {
    try {
      // Use RSS fetcher's built-in statistics
      const rssStats = await rssNewsFetcher.getFeedStats();
      
      return {
        totalSources: rssStats.totalFeeds,
        totalItems: rssStats.totalItems,
        itemsPerFeed: rssStats.itemsPerFeed,
        categories: rssStats.categories,
        withImages: rssStats.withImages,
        withoutImages: rssStats.withoutImages,
        avgItemsPerSource: rssStats.totalItems / rssStats.totalFeeds
      };
      
    } catch (error) {
      console.error(`❌ Error getting news statistics:`, error);
      return {
        totalSources: 0,
        totalItems: 0,
        itemsPerFeed: {},
        categories: {},
        withImages: 0,
        withoutImages: 0,
        avgItemsPerSource: 0
      };
    }
  }
}

// Export singleton instance
export const newsContentGenerator = new NewsContentGenerator();