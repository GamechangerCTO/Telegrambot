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
import { contentSpamPreventer } from '../utils/content-spam-preventer';

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
  
  // 🎯 NEW: Channel-specific targeting for personalized news content
  selectedLeagues?: string[];
  selectedTeams?: string[];
  channelName?: string;
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
    detailsUrl?: string;
    telegramEnhancements?: {
      protectContent?: boolean;
      enableShareButton?: boolean;
      enableWebApp?: boolean;
      priority?: string;
      spoilerImage?: boolean;
      disablePreview?: boolean;
    };
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
        console.log(`❌ No RSS news found, attempting AI-generated fallback news`);
        return await this.generateFallbackNewsContent(request);
      }
      console.log(`✅ Fetched ${rssNews.length} news items in ${Date.now() - startTime}ms`);

      // Step 2: Score and rank news items with channel preferences (batch processing)
      const scoredNews = this.scoreAndRankNewsOptimized(rssNews, request);
      
      // Step 3: Check uniqueness and get best unused news
      const bestNews = await this.getBestUnusedNewsOptimized(scoredNews, request.channelId);
      if (!bestNews) {
        console.log(`❌ No new/unused news found`);
        return null;
      }

      console.log(`✅ Selected news: "${bestNews.title}" (Score: ${bestNews.relevanceScore})`);

      // 🔄 STEP 3.5: Check if similar content was recently generated (SAVE OPENAI CALLS!)
      const canGenerate = await contentSpamPreventer.canGenerateContent(
        'news',
        request.channelId,
        bestNews.title
      );
      
      if (!canGenerate.allowed) {
        console.log(`🔄 DUPLICATE PREVENTION: ${canGenerate.reason}`);
        // Return the existing content instead of generating new
        if (canGenerate.duplicateContent?.details?.content) {
          return {
            title: canGenerate.duplicateContent.details.title || bestNews.title,
            content: canGenerate.duplicateContent.details.content,
            imageUrl: canGenerate.duplicateContent.details.imageUrl,
            metadata: {
              language: request.language,
              generatedAt: new Date().toISOString(),
              contentId: bestNews.id,
              source: bestNews.source,
              relevanceScore: bestNews.relevanceScore,
              detailsUrl: bestNews.url,
              duplicateFlag: true, // Mark as duplicate to avoid OpenAI call
              telegramEnhancements: {
                protectContent: request.language !== 'en',
                enableShareButton: true,
                enableWebApp: false,
                priority: 'high',
                spoilerImage: false,
                disablePreview: false
              }
            }
          };
        } else {
          console.log(`❌ Duplicate content found but no content details - skipping generation`);
          return null;
        }
      }

      console.log(`✅ CONTENT GENERATION APPROVED: Proceeding with OpenAI call`);

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
          relevanceScore: bestNews.relevanceScore || 0,
          // 📰 Enhanced Telegram Features for News
          detailsUrl: bestNews.sourceUrl,
          telegramEnhancements: {
            protectContent: (bestNews.relevanceScore || 0) >= 85,  // 🛡️ Protect high-value exclusive news
            enableShareButton: true,  // 📤 Share breaking news
            enableWebApp: false,  // No web app for news
            priority: (bestNews.relevanceScore || 0) >= 80 ? 'high' : 'normal',
            spoilerImage: bestNews.title?.toLowerCase().includes('transfer') || 
                         bestNews.title?.toLowerCase().includes('breaking'),  // 🙈 Spoiler for transfers/breaking
            disablePreview: false  // Show link preview for news
          }
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
   * 🏆 OPTIMIZED: Score with caching, batch processing and channel preferences
   */
  private scoreAndRankNewsOptimized(newsItems: NewsItem[], request?: NewsGenerationRequest): NewsItem[] {
    console.log(`🏆 Scoring ${newsItems.length} news items${request?.channelName ? ` for channel: ${request.channelName}` : ''}`);
    
    if (request?.selectedTeams?.length || request?.selectedLeagues?.length) {
      console.log(`🎯 Channel preferences: ${request.selectedTeams?.length || 0} teams, ${request.selectedLeagues?.length || 0} leagues`);
    }
    
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
      
      // 🎯 CHANNEL-SPECIFIC TEAM PREFERENCES (High Priority Scoring)
      if (request?.selectedTeams?.length) {
        for (const preferredTeam of request.selectedTeams) {
          // Get team name from database or use ID as fallback
          const teamName = preferredTeam.toLowerCase();
          if (fullText.includes(teamName)) {
            score += 25; // Higher score for channel's preferred teams
            console.log(`🎯 Boosted score (+25) for preferred team: ${preferredTeam}`);
          }
        }
      }
      
      // 🎯 CHANNEL-SPECIFIC LEAGUE PREFERENCES  
      if (request?.selectedLeagues?.length) {
        // This would need league name mapping from database
        // For now, give a small boost if it's a major league
        const hasPreferredLeague = request.selectedLeagues.some(leagueId => {
          // Simple check - in production would map league IDs to names
          return patterns.premierLeague.test(fullText) || 
                 patterns.championsLeague.test(fullText) ||
                 patterns.europaLeague.test(fullText);
        });
        
        if (hasPreferredLeague) {
          score += 15; // Boost for preferred leagues
          console.log(`🎯 Boosted score (+15) for preferred league content`);
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
  private async aiEditNewsContentOptimized(news: NewsItem, language: 'en' | 'am' | 'sw' | 'fr' | 'ar'): Promise<string> {
    // Always try AI translation for non-English languages - don't skip for short content
    console.log(`🤖 AI editing news content for language: ${language}`);
    
    try {
      const openai = await getOpenAIClient();
      if (!openai) {
        console.log(`❌ OpenAI client not available - using template for ${language}`);
        return this.createTemplateNewsContent(news, language);
      }

      // 📊 Log OpenAI call attempt
      await this.logOpenAICall('news-generation', language, news.title);

      const systemPrompts = {
        'en': `You are a football journalist. Create a complete 4-5 line summary with emojis. IMPORTANT: Always finish your sentences completely - never cut off in the middle. End with hashtags.`,
        'am': `You are an Ethiopian football journalist. TRANSLATE and REWRITE this English football news into proper, fluent Amharic language. Requirements:
1. Write ONLY in natural Amharic - no English words
2. Create a complete news story (4-5 sentences minimum)
3. CRITICAL: Always finish your sentences completely - never cut off mid-sentence
4. Include all key details from the original news
5. Use ⚽ emoji at the start
6. End with source and hashtags: #እግርኳስዜና #ስፖርት #ዝማኔ
7. Make it sound like native Amharic journalism`,
        'sw': `You are a football journalist writing ONLY in Swahili. Create 4-5 complete lines. IMPORTANT: Always finish your sentences completely - never cut off in the middle. End with Swahili & English hashtags.`,
        'fr': `Vous êtes un journaliste de football écrivant UNIQUEMENT en français. Créez un résumé complet de 4-5 lignes. IMPORTANT: Terminez toujours vos phrases complètement - ne coupez jamais au milieu. Utilisez des emojis ⚽. Terminez par des hashtags français.`,
        'ar': `أنت صحفي كرة قدم تكتب باللغة العربية فقط. أنشئ ملخصاً كاملاً من 4-5 أسطر. مهم: اكمل جملك دائماً - لا تقطع أبداً في المنتصف. استخدم رموز ⚽. انته بهاشتاغات عربية.`
      };

      const languageNames = {
        'en': 'English',
        'am': 'Amharic',
        'sw': 'Swahili', 
        'fr': 'français',
        'ar': 'العربية'
      };

      const response = await Promise.race([
        openai.chat.completions.create({
          model: "gpt-4o-mini", // Fastest model for translations
          messages: [
            { role: "system", content: systemPrompts[language] },
            { 
              role: "user", 
              content: `Create a complete news summary in ${languageNames[language]}. Translate ALL the information. Make sure to end with complete sentences:\n\nTitle: ${news.title}\nContent: ${news.content.substring(0, 800)}` 
            }
          ],
          max_tokens: 800, // Increased for complete content
          temperature: 0.7
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('AI_TIMEOUT_30_SECONDS')), 30000))
      ]) as any;

      const aiResult = response.choices[0]?.message?.content?.trim();
      console.log(`🤖 AI Result for ${language}:`, aiResult ? aiResult.substring(0, 200) + '...' : 'EMPTY/NULL');
      
      if (aiResult && aiResult.length > 50) {
        console.log(`✅ Using AI result for ${language}`);
        return aiResult;
      } else {
        console.log(`❌ AI result invalid for ${language}, using template`);
        return this.createTemplateNewsContent(news, language);
      }
    } catch (error) {
      console.log(`❌ AI editing failed for ${language}, error:`, error?.message || error);
      console.log(`🔍 Error details:`, error);
      return this.createTemplateNewsContent(news, language);
    }
  }

  /**
   * 📝 Create template-based news content for all languages
   */
  private createTemplateNewsContent(news: NewsItem, language: 'en' | 'am' | 'sw' | 'fr' | 'ar'): string {
    const shortContent = this.shortenContent(news.content, 400); // Increased from 200 to 400
    
    const templates = {
      en: `⚽ ${news.title}\n\n${shortContent}\n\n🔗 ${news.source}\n\n#FootballNews #Breaking`,
      am: this.createAmharicNewsContent(news, shortContent),
      sw: `⚽ ${news.title}\n\n${shortContent}\n\n🔗 Chanzo: ${news.source}\n\n#HabariMpira #FootballNews`,
      fr: this.createFrenchNewsContent(news, shortContent),
      ar: this.createArabicNewsContent(news, shortContent)
    };

    return templates[language];
  }

  /**
   * 🔤 Create proper Amharic news content
   */
  private createAmharicNewsContent(news: NewsItem, shortContent: string): string {
    // Create meaningful Amharic content instead of just mixing English
    const amharicIntro = this.getAmharicNewsIntro(news.category);
    const processedContent = this.processContentForAmharic(shortContent);
    
    return `📰 ${amharicIntro}\n\n⚽ ${processedContent}\n\n🔗 ምንጭ፡ ${news.source}\n📅 ${new Date().toLocaleDateString('am-ET')}\n\n#እግርኳስዜና #ስፖርት #ዝማኔ`;
  }

  /**
   * 🇫🇷 Create proper French news content
   */
  private createFrenchNewsContent(news: NewsItem, shortContent: string): string {
    const frenchIntro = this.getFrenchNewsIntro(news.category);
    const processedContent = this.processContentForFrench(shortContent);
    
    return `📰 ${frenchIntro}\n\n⚽ ${processedContent}\n\n🔗 Source: ${news.source}\n📅 ${new Date().toLocaleDateString('fr-FR')}\n\n#FootballNews #Sport #ActualitéFoot`;
  }

  /**
   * 🇸🇦 Create proper Arabic news content  
   */
  private createArabicNewsContent(news: NewsItem, shortContent: string): string {
    const arabicIntro = this.getArabicNewsIntro(news.category);
    const processedContent = this.processContentForArabic(shortContent);
    
    return `📰 ${arabicIntro}\n\n⚽ ${processedContent}\n\n🔗 المصدر: ${news.source}\n📅 ${new Date().toLocaleDateString('ar-SA')}\n\n#أخبار_كرة_القدم #رياضة #كرة_القدم`;
  }

  /**
   * 🌍 Get Amharic intro based on news category
   */
  private getAmharicNewsIntro(category?: string): string {
    const categoryIntros = {
      'Premier League': 'የፕሪሚየር ሊግ ዜና',
      'Champions League': 'የቻምፒዮንስ ሊግ ዜና',
      'Transfer News': 'የተጫዋቾች ዝውውር ዜና',
      'World Cup': 'የዓለም ዋንጫ ዜና',
      'La Liga': 'የላ ሊጋ ዜና',
      'Serie A': 'የሴሪ ኤ ዜና',
      'Bundesliga': 'የቡንደስሊጋ ዜና',
      'International': 'የአለም አቀፍ እግር ኳስ ዜና'
    };
    
    return categoryIntros[category as keyof typeof categoryIntros] || 'የእግር ኳስ ዜና እና ዝማኔ';
  }

  /**
   * 🌍 Get French intro based on news category
   */
  private getFrenchNewsIntro(category?: string): string {
    const categoryIntros = {
      'Premier League': 'Actualités de la Premier League',
      'Champions League': 'Actualités de la Ligue des Champions',
      'Transfer News': 'Actualités des transferts',
      'World Cup': 'Actualités de la Coupe du Monde',
      'La Liga': 'Actualités de La Liga',
      'Serie A': 'Actualités de la Serie A',
      'Bundesliga': 'Actualités de la Bundesliga',
      'International': 'Actualités du football international'
    };
    
    return categoryIntros[category as keyof typeof categoryIntros] || 'Actualités et mises à jour du football';
  }

  /**
   * 🌍 Get Arabic intro based on news category
   */
  private getArabicNewsIntro(category?: string): string {
    const categoryIntros = {
      'Premier League': 'أخبار الدوري الإنجليزي الممتاز',
      'Champions League': 'أخبار دوري أبطال أوروبا',
      'Transfer News': 'أخبار انتقالات اللاعبين',
      'World Cup': 'أخبار كأس العالم',
      'La Liga': 'أخبار الليجا الإسبانية',
      'Serie A': 'أخبار الدوري الإيطالي',
      'Bundesliga': 'أخبار البوندسليجا الألمانية',
      'International': 'أخبار كرة القدم الدولية'
    };
    
    return categoryIntros[category as keyof typeof categoryIntros] || 'أخبار ومستجدات كرة القدم';
  }

  /**
   * 📝 Process content for better Amharic presentation with basic translation
   */
  private processContentForAmharic(content: string): string {
    // Basic improvement - add context for Amharic readers
    if (content.length < 50) {
      return 'ዝርዝር መረጃ በቅርቡ ይመጣል። ለተጨማሪ ዝማኔ ይከተሉን።';
    }
    
    // Clean up content and provide better Amharic context
    let cleanContent = content
      // Remove HTML tags completely
      .replace(/(<\/?)strong[^>]*>/gi, '')
      .replace(/(<\/?)p[^>]*>/gi, '\n')
      .replace(/(<\/?)div[^>]*>/gi, '\n')
      .replace(/(<\/?)span[^>]*>/gi, '')
      .replace(/(<\/?)br[^>]*>/gi, '\n')
      .replace(/(<\/?)em[^>]*>/gi, '')
      .replace(/(<\/?)b[^>]*>/gi, '')
      .replace(/(<\/?)i[^>]*>/gi, '')
      .replace(/(<\/?)a[^>]*>/gi, '')
      .replace(/(<\/?)h[1-6][^>]*>/gi, '\n')
      .replace(/<[^>]*>/g, '') // Remove any remaining HTML
      .replace(/\s{2,}/g, ' ') // Clean whitespace
      .replace(/\n{2,}/g, '\n')
      .trim();

    // Basic football terminology translation for better readability
    cleanContent = this.translateBasicFootballTerms(cleanContent);
    
    // Extract key team/player names for better context
    const teamNames = this.extractTeamNames(cleanContent);
    let contextualContent = cleanContent.substring(0, 400); // Increased from 200 to 400
    
    // Make sure we don't cut in the middle of a word
    const lastSpace = contextualContent.lastIndexOf(' ');
    if (lastSpace > 300) { // Adjusted threshold accordingly
      contextualContent = contextualContent.substring(0, lastSpace);
    }
    
    // Add proper Amharic context
    if (teamNames.length > 0) {
      return `የ${teamNames[0]} እና ተያያዥ ክለቦች ዜና፡\n\n${contextualContent}...\n\nተጨማሪ ዝርዝሮች ከምንጩ ይመልከቱ።`;
    }
    
    return `ከአለም አቀፍ እግር ኳስ ዓለም የደረሰ ወቅታዊ ዜና፡\n\n${contextualContent}...\n\nለሙሉ ዝርዝር ምንጹን ይመልከቱ።`;
  }

  /**
   * 🔤 Basic football terminology translation to Amharic
   */
  private translateBasicFootballTerms(content: string): string {
    const translations = {
      'football': 'እግር ኳስ',
      'soccer': 'እግር ኳስ', 
      'penalty': 'ቅጣት ምት',
      'goal': 'ጎል',
      'match': 'ጨዋታ',
      'game': 'ጨዋታ',
      'team': 'ቡድን',
      'player': 'ተጫዋች',
      'coach': 'አሰልጣኝ',
      'manager': 'አስተዳዳሪ',
      'win': 'ድል',
      'victory': 'ድል',
      'defeat': 'ሽንፈት',
      'score': 'ውጤት',
      'league': 'ሊግ',
      'championship': 'ሻምፒዮንሺፕ',
      'tournament': 'ውድድር',
      'season': 'ወቅት',
      'transfer': 'ዝውውር',
      'contract': 'ውል',
      'stadium': 'ስታዲየም',
      'fans': 'ደጋፊዎች',
      'supporters': 'ደጋፊዎች'
    };

    let translatedContent = content;
    
    // Apply translations while preserving original context
    Object.entries(translations).forEach(([english, amharic]) => {
      // Only translate standalone words, not parts of names
      const regex = new RegExp(`\\b${english}\\b`, 'gi');
      if (regex.test(translatedContent) && !this.isPartOfProperName(translatedContent, english)) {
        translatedContent = translatedContent.replace(regex, `${english} (${amharic})`);
      }
    });

    return translatedContent;
  }

  /**
   * Check if a word is part of a proper name (team, player, etc.)
   */
  private isPartOfProperName(content: string, word: string): boolean {
    const wordIndex = content.toLowerCase().indexOf(word.toLowerCase());
    if (wordIndex === -1) return false;
    
    // Check if the word is preceded or followed by a capital letter (indicating a proper name)
    const beforeChar = wordIndex > 0 ? content[wordIndex - 1] : ' ';
    const afterChar = wordIndex + word.length < content.length ? content[wordIndex + word.length] : ' ';
    
    return /[A-Z]/.test(beforeChar) || /[A-Z]/.test(afterChar);
  }

  /**
   * 📝 Process content for better French presentation
   */
  private processContentForFrench(content: string): string {
    if (content.length < 50) {
      return 'Plus de détails seront disponibles prochainement. Suivez-nous pour les dernières actualités.';
    }
    
    const cleanContent = content
      .replace(/[<>]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    return cleanContent.length > 200 ? cleanContent.substring(0, 200) + '...' : cleanContent;
  }

  /**
   * 📝 Process content for better Arabic presentation
   */
  private processContentForArabic(content: string): string {
    if (content.length < 50) {
      return 'ستتوفر تفاصيل أكثر قريباً. تابعونا للحصول على آخر الأخبار.';
    }
    
    const cleanContent = content
      .replace(/[<>]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    return cleanContent.length > 200 ? cleanContent.substring(0, 200) + '...' : cleanContent;
  }
  
  /**
   * Extract team names from content for better context
   */
  private extractTeamNames(content: string): string[] {
    const commonTeams = ['Tottenham', 'Arsenal', 'Chelsea', 'Liverpool', 'Manchester', 'City', 'United', 'Real Madrid', 'Barcelona', 'Bayern', 'PSG'];
    const foundTeams = commonTeams.filter(team => 
      content.toLowerCase().includes(team.toLowerCase())
    );
    return foundTeams.slice(0, 2); // Max 2 teams
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

  /**
   * 📊 Log OpenAI API call for tracking usage
   */
  private async logOpenAICall(
    callType: string, 
    language: string, 
    contentTitle: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('openai_usage_logs')
        .insert({
          call_type: callType,
          language: language,
          content_title: contentTitle.substring(0, 200), // Limit title length
          timestamp: new Date().toISOString(),
          estimated_tokens: this.estimateTokens(contentTitle),
          status: 'initiated'
        });

      if (error) {
        console.error('Error logging OpenAI call:', error);
      } else {
        console.log(`📊 OpenAI call logged: ${callType} for ${language}`);
      }
    } catch (error) {
      console.error('Failed to log OpenAI call:', error);
    }
  }

  /**
   * 🔢 Estimate token usage for cost tracking
   */
  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 0.75 words for English, adjust for other languages
    const wordCount = text.split(' ').length;
    const tokenMultiplier = {
      'en': 0.75,
      'am': 1.2,  // Amharic typically uses more tokens
      'sw': 0.8,  // Swahili
      'fr': 0.8,  // French
      'ar': 1.0   // Arabic
    };
    
    return Math.ceil(wordCount * (tokenMultiplier['en'] || 0.75));
  }

  /**
   * 🔄 Generate fallback news content when RSS feeds fail
   */
  private async generateFallbackNewsContent(request: NewsGenerationRequest): Promise<GeneratedNews | null> {
    console.log(`🔄 Generating AI fallback news content for ${request.language}`);
    
    try {
      const openai = await getOpenAIClient();
      if (!openai) {
        console.log('❌ OpenAI not available for fallback news, returning basic template');
        return this.createBasicFallbackNews(request);
      }

      const currentDate = new Date().toLocaleDateString();
      const topicPrompts = {
        'en': `Create football news content for today (${currentDate}). Write about general football topics like transfer rumors, upcoming matches, league updates, or player performances. Make it timely and engaging.`,
        'am': `ለዛሬ (${currentDate}) የእግር ኳስ ዜና ይፍጠሩ። የተጫዋች ዝውውር፣ የሊግ ዝማኔዎች፣ ወይም አመቺ የእግር ኳስ ርዕሶች ላይ በአማርኛ ይፃፉ።`,
        'sw': `Unda habari za mpira wa miguu za leo (${currentDate}). Andika kuhusu mada za mpira kama vile uhamisho wa wachezaji, mechi zinazokuja, au maendeleo ya ligi.`
      };

      const systemPrompts = {
        'en': `You are a football journalist creating daily news content. Write 4-5 complete sentences about current football topics. Include emojis naturally. End with hashtags #Football #Sports #News`,
        'am': `እርስዎ የእግር ኳስ ዜና ጸሐፊ ናቸው። ስለ ወቅታዊ እግር ኳስ ርዕሶች 4-5 ሙሉ ዓረፍተ ነገሮች ይፃፉ። ተፈጥሮአዊ ኢሞጂዎችን ያካትቱ። በ #እግርኳስ #ስፖርት #ዜና ይጨርሱ`,
        'sw': `Wewe ni mwandishi wa habari za mpira wa miguu. Andika sentensi 4-5 kamili kuhusu mada za mpira za sasa. Jumuisha emoji kwa kawaida. Malizia na hashtags #MpiraMiguu #Michezo #Habari`
      };

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompts[request.language] || systemPrompts['en'] },
          { role: "user", content: topicPrompts[request.language] || topicPrompts['en'] }
        ],
        max_tokens: 400,
        temperature: 0.8
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        return this.createBasicFallbackNews(request);
      }

      // Generate an image for the fallback news
      const imageUrl = await this.generateFallbackNewsImage(request.language);

      return {
        title: this.getFallbackNewsTitle(request.language),
        content: content,
        imageUrl: imageUrl,
        sourceUrl: `https://telegrambotsport.vercel.app/news/fallback/${Date.now()}`,
        aiEditedContent: content, // Already AI generated
        metadata: {
          language: request.language,
          source: 'AI Generated Fallback',
          contentId: `fallback_${Date.now()}`,
          generatedAt: new Date().toISOString(),
          relevanceScore: 75, // Good baseline score
          telegramEnhancements: {
            protectContent: false,
            enableShareButton: true,
            enableWebApp: true,
            priority: 'normal',
            spoilerImage: false
          }
        }
      };

    } catch (error) {
      console.error('❌ Error generating fallback news:', error);
      return this.createBasicFallbackNews(request);
    }
  }

  /**
   * 📰 Create basic template fallback news when AI fails
   */
  private createBasicFallbackNews(request: NewsGenerationRequest): GeneratedNews {
    const templates = {
      'en': {
        title: '⚽ Daily Football Updates',
        content: `🏆 Stay updated with the latest football news and match results.\n\n📊 Check back soon for fresh updates from leagues around the world.\n\n⚽ Your source for reliable football content!\n\n#Football #Sports #Updates`
      },
      'am': {
        title: '⚽ የእግር ኳስ ዕለታዊ ዝማኔዎች',
        content: `🏆 ከዓለም አቀፍ እግር ኳስ ዓለም የቅርብ ጊዜ ዜናዎች ጋር ይዘምኑ።\n\n📊 ከተለያዩ ሊጎች የሚመጡ አዳዲስ መረጃዎች ለማየት በቅርቡ ይመለሱ።\n\n⚽ ለአስተማማኝ እግር ኳስ ይዘት የእርስዎ ምንጭ!\n\n#እግርኳስ #ስፖርት #ዝማኔዎች`
      },
      'sw': {
        title: '⚽ Habari za Kila Siku za Mpira',
        content: `🏆 Baki umejua habari za hivi karibuni za mpira wa miguu na matokeo ya mechi.\n\n📊 Rudi hivi karibuni kwa habari mpya kutoka ligi duniani.\n\n⚽ Chanzo chako cha kuaminika cha maudhui ya mpira!\n\n#MpiraMiguu #Michezo #Habari`
      }
    };

    const template = templates[request.language] || templates['en'];

    return {
      title: template.title,
      content: template.content,
      sourceUrl: `https://telegrambotsport.vercel.app/news/template/${Date.now()}`,
      metadata: {
        language: request.language,
        source: 'Template Fallback',
        contentId: `template_${Date.now()}`,
        generatedAt: new Date().toISOString(),
        relevanceScore: 60,
        telegramEnhancements: {
          protectContent: false,
          enableShareButton: true,
          enableWebApp: true,
          priority: 'normal'
        }
      }
    };
  }

  /**
   * 🖼️ Generate fallback news image
   */
  private async generateFallbackNewsImage(language: string): Promise<string | undefined> {
    try {
      const prompts = {
        'en': 'Football stadium atmosphere with fans cheering, modern sports photography style',
        'am': 'Ethiopian football fans celebrating in stadium, vibrant atmosphere, sports photography',
        'sw': 'African football stadium with passionate fans, colorful banners, sports photography'
      };

      return await aiImageGenerator.generateImage({
        type: 'news',
        prompt: prompts[language] || prompts['en'],
        language: language as 'en' | 'am' | 'sw'
      });
    } catch (error) {
      console.error('❌ Error generating fallback news image:', error);
      return undefined;
    }
  }

  /**
   * 📰 Get fallback news title
   */
  private getFallbackNewsTitle(language: string): string {
    const titles = {
      'en': '⚽ Football News Update',
      'am': '⚽ የእግር ኳስ ዜና ዝማኔ', 
      'sw': '⚽ Habari za Mpira'
    };
    return titles[language] || titles['en'];
  }
}

// Export singleton instance
export const newsContentGenerator = new OptimizedNewsContentGenerator();