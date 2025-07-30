import { RSSItem, RSSSource } from '@/types/database';
import { supabase } from '@/lib/supabase';

/**
 * RSS Parser for football news aggregation
 * Supports multiple RSS sources with deduplication and language detection
 */

export interface ParsedRSSItem extends RSSItem {
  id?: string;
  hash: string; // For deduplication
}

export class RSSParser {
  private seenItems = new Set<string>(); // For deduplication within session

  /**
   * Parse RSS feed from URL
   */
  async parseRSSFeed(source: RSSSource): Promise<ParsedRSSItem[]> {
    try {
      console.log(`🔄 Fetching RSS from: ${source.name} (${source.url})`);
      
      const response = await fetch(source.url, {
        headers: {
          'User-Agent': 'TelegramBotSport/1.0 (Football News Aggregator)',
          'Accept': 'application/rss+xml, application/xml, text/xml'
        },
        // Timeout after 10 seconds
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const xmlText = await response.text();
      
      // Parse XML using simpler regex approach for RSS feeds
      const items = this.extractRSSItemsWithRegex(xmlText, source);
      const deduplicatedItems = this.deduplicateItems(items);
      
      console.log(`✅ Parsed ${deduplicatedItems.length} items from ${source.name}`);
      
      // Update source statistics
      await this.updateSourceStats(source.id, deduplicatedItems.length);
      
      return deduplicatedItems;
      
    } catch (error) {
      console.error(`❌ Error parsing RSS feed ${source.name}:`, error);
      
      // Update error statistics
      await this.updateSourceError(source.id, error instanceof Error ? error.message : 'Unknown error');
      
      return [];
    }
  }

  /**
   * Extract RSS items using regex parsing (more reliable for Node.js)
   */
  private extractRSSItemsWithRegex(xmlText: string, source: RSSSource): ParsedRSSItem[] {
    const items: ParsedRSSItem[] = [];
    
    // Extract all <item>...</item> blocks
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    let match;
    
    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemXml = match[1];
      
      try {
        // Extract title (handle CDATA properly)
        let titleMatch = itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        let title = '';
        if (titleMatch) {
          title = titleMatch[1];
          if (title.includes('<![CDATA[')) {
            title = title.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
          }
          title = this.cleanText(title);
        }
        
        // Extract description (handle CDATA properly)  
        let descMatch = itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
        let description = '';
        if (descMatch) {
          description = descMatch[1];
          if (description.includes('<![CDATA[')) {
            description = description.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
          }
          description = this.cleanText(description);
        }
        
        // Extract link (handle CDATA properly)
        let linkMatch = itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
        let link = '';
        if (linkMatch) {
          link = linkMatch[1];
          if (link.includes('<![CDATA[')) {
            link = link.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
          }
          link = link.trim();
        }
        
        // Extract pubDate
        const dateMatch = itemXml.match(/<pubDate[^>]*>(.*?)<\/pubDate>/i);
        const pubDateStr = dateMatch ? dateMatch[1].trim() : '';
        
        if (!title || !link) {
          continue; // Skip items without essential data
        }
        
        // Create hash for deduplication
        const hash = this.createContentHash(title, link);
        
        const pubDate = pubDateStr ? new Date(pubDateStr) : new Date();
        
        // Skip items older than 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        if (pubDate < sevenDaysAgo) {
          continue;
        }

        items.push({
          title,
          description,
          link,
          pubDate,
          language: source.language,
          category: source.category,
          source: source.name,
          hash
        });
        
      } catch (error) {
        console.warn(`⚠️ Error parsing RSS item:`, error);
        continue;
      }
    }

    return items;
  }

  /**
   * Extract RSS items from XML document (legacy DOM-based method)
   */
  private extractRSSItems(xmlDoc: Document, source: RSSSource): ParsedRSSItem[] {
    const items: ParsedRSSItem[] = [];
    
    // Support both RSS and Atom feeds
    const itemElements = [
      ...Array.from(xmlDoc.querySelectorAll('item')), // RSS
      ...Array.from(xmlDoc.querySelectorAll('entry')) // Atom
    ];

    for (const itemElement of itemElements) {
      try {
        const title = this.getTextContent(itemElement, ['title']);
        const description = this.getTextContent(itemElement, ['description', 'summary', 'content']);
        const link = this.getTextContent(itemElement, ['link', 'guid']) || 
                     itemElement.querySelector('link')?.getAttribute('href') || '';
        const pubDateStr = this.getTextContent(itemElement, ['pubDate', 'published', 'updated']);
        
        if (!title || !link) {
          continue; // Skip items without essential data
        }

        // Create hash for deduplication
        const hash = this.createContentHash(title, link);
        
        const pubDate = pubDateStr ? new Date(pubDateStr) : new Date();
        
        // Skip items older than 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        if (pubDate < sevenDaysAgo) {
          continue;
        }

        items.push({
          title: this.cleanText(title),
          description: this.cleanText(description),
          link: link.trim(),
          pubDate,
          language: source.language,
          category: source.category,
          source: source.name,
          hash
        });
        
      } catch (error) {
        console.warn(`⚠️ Error parsing RSS item:`, error);
        continue;
      }
    }

    return items;
  }

  /**
   * Get text content from multiple possible selectors
   */
  private getTextContent(element: Element, selectors: string[]): string {
    for (const selector of selectors) {
      const found = element.querySelector(selector);
      if (found?.textContent) {
        // Handle CDATA sections properly
        let content = found.textContent.trim();
        if (content.startsWith('[CDATA[') && content.endsWith(']]')) {
          content = content.slice(7, -2); // Remove CDATA wrapper
        }
        return content;
      }
    }
    return '';
  }

  /**
   * Clean and normalize text content - Enhanced for malformed HTML
   */
  private cleanText(text: string): string {
    return text
      // First, fix malformed HTML tags (missing angle brackets)
      .replace(/\bp\b(?![a-z])/gi, '') // Remove standalone 'p' tags
      .replace(/\bstrong\b(?![a-z])/gi, '') // Remove standalone 'strong' tags
      .replace(/\bem\b(?![a-z])/gi, '') // Remove standalone 'em' tags
      .replace(/\bb\b(?![a-z])/gi, '') // Remove standalone 'b' tags
      .replace(/\bi\b(?![a-z])/gi, '') // Remove standalone 'i' tags
      .replace(/\bdiv\b(?![a-z])/gi, '') // Remove standalone 'div' tags
      .replace(/\bspan\b(?![a-z])/gi, '') // Remove standalone 'span' tags
      .replace(/\/p\b/gi, '') // Remove closing p tags
      .replace(/\/strong\b/gi, '') // Remove closing strong tags
      .replace(/\/em\b/gi, '') // Remove closing em tags
      .replace(/\/b\b/gi, '') // Remove closing b tags
      .replace(/\/i\b/gi, '') // Remove closing i tags
      .replace(/\/div\b/gi, '') // Remove closing div tags
      .replace(/\/span\b/gi, '') // Remove closing span tags
      // Then remove proper HTML tags
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .trim();
  }

  /**
   * Create content hash for deduplication
   */
  private createContentHash(title: string, link: string): string {
    const content = `${title}::${link}`;
    return Buffer.from(content).toString('base64').slice(0, 16);
  }

  /**
   * Remove duplicate items within the current batch
   */
  private deduplicateItems(items: ParsedRSSItem[]): ParsedRSSItem[] {
    const uniqueItems: ParsedRSSItem[] = [];
    const batchHashes = new Set<string>();

    for (const item of items) {
      // Skip if we've seen this hash in this batch or in previous sessions
      if (batchHashes.has(item.hash) || this.seenItems.has(item.hash)) {
        continue;
      }

      batchHashes.add(item.hash);
      this.seenItems.add(item.hash);
      uniqueItems.push(item);
    }

    return uniqueItems;
  }

  /**
   * Update RSS source statistics after successful fetch
   */
  private async updateSourceStats(sourceId: string, itemCount: number): Promise<void> {
    try {
      await supabase
        .from('rss_sources')
        .update({
          last_fetched_at: new Date().toISOString(),
          last_item_count: itemCount,
          error_count: 0, // Reset error count on success
          last_error: null
        })
        .eq('id', sourceId);
    } catch (error) {
      console.warn('Could not update RSS source stats:', error);
    }
  }

  /**
   * Update RSS source error information
   */
  private async updateSourceError(sourceId: string, errorMessage: string): Promise<void> {
    try {
      const { data: source } = await supabase
        .from('rss_sources')
        .select('error_count')
        .eq('id', sourceId)
        .single();

      const errorCount = (source?.error_count || 0) + 1;

      await supabase
        .from('rss_sources')
        .update({
          error_count: errorCount,
          last_error: errorMessage,
          // Disable source if too many consecutive errors
          is_active: errorCount < 5
        })
        .eq('id', sourceId);
    } catch (error) {
      console.warn('Could not update RSS source error:', error);
    }
  }

  /**
   * Filter items by keywords and football relevance
   */
  filterFootballContent(items: ParsedRSSItem[]): ParsedRSSItem[] {
    const footballKeywords = [
      // English
      'football', 'soccer', 'goal', 'match', 'league', 'cup', 'championship',
      'premier league', 'champions league', 'world cup', 'uefa', 'fifa',
      'transfer', 'player', 'coach', 'manager', 'stadium', 'penalty',
      
      // Teams (common ones)
      'arsenal', 'chelsea', 'liverpool', 'manchester', 'barcelona', 'madrid',
      'juventus', 'milan', 'psg', 'bayern',
      
      // African football
      'africa cup', 'afcon', 'caf', 'african football',
      
      // Amharic (transliterated)
      'እግር ኳስ', 'ጎል', 'ጨዋታ', 'ሊግ', 'ኩባንያ',
      
      // Swahili
      'mpira wa miguu', 'mchezo', 'goli', 'ligi', 'kombe'
    ];

    return items.filter(item => {
      const searchText = `${item.title} ${item.description}`.toLowerCase();
      return footballKeywords.some(keyword => 
        searchText.includes(keyword.toLowerCase())
      );
    });
  }

  /**
   * Get all active RSS sources
   */
  async getActiveRSSSources(): Promise<RSSSource[]> {
    const { data, error } = await supabase
      .from('rss_sources')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching RSS sources:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Parse all active RSS sources
   */
  async parseAllSources(): Promise<ParsedRSSItem[]> {
    const sources = await this.getActiveRSSSources();
    const allItems: ParsedRSSItem[] = [];

    console.log(`🔄 Parsing ${sources.length} RSS sources...`);

    // Process sources in parallel but with concurrency limit
    const concurrencyLimit = 3;
    for (let i = 0; i < sources.length; i += concurrencyLimit) {
      const batch = sources.slice(i, i + concurrencyLimit);
      const batchPromises = batch.map(source => this.parseRSSFeed(source));
      const batchResults = await Promise.allSettled(batchPromises);

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          allItems.push(...result.value);
        }
      }
    }

    // Global deduplication and filtering
    const uniqueItems = this.deduplicateItems(allItems);
    const footballItems = this.filterFootballContent(uniqueItems);

    console.log(`✅ Parsed ${footballItems.length} unique football items from all sources`);

    return footballItems;
  }
}

// Export singleton instance
export const rssParser = new RSSParser(); 