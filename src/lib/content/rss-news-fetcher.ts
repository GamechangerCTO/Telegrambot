/**
 * 📡 RSS NEWS FETCHER
 * Real RSS parsing implementation for news content
 */

import { XMLParser } from 'fast-xml-parser';

export interface RSSItem {
  id: string;
  title: string;
  description: string;
  content: string;
  link: string;
  pubDate: string;
  author?: string;
  category?: string;
  imageUrl?: string;
  source: string;
}

export interface RSSFeed {
  title: string;
  description: string;
  link: string;
  items: RSSItem[];
}

export class RSSNewsFetcher {
  
  private xmlParser: XMLParser;
  
  constructor() {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseAttributeValue: false,
      parseTagValue: false,
      trimValues: true
    });
  }
  
  private readonly FOOTBALL_RSS_FEEDS = [
    {
      url: 'https://feeds.bbci.co.uk/sport/football/rss.xml',
      name: 'BBC Sport Football'
    },
    {
      url: 'https://www.theguardian.com/football/rss',
      name: 'The Guardian Football'
    },
    {
      url: 'https://www.skysports.com/rss/football',
      name: 'Sky Sports Football'
    },
    {
      url: 'http://feeds.feedburner.com/SoccerNews',
      name: 'ESPN Soccer'
    },
    {
      url: 'https://talksport.com/football/feed/',
      name: 'TalkSport'
    }
  ];

  /**
   * 📡 Fetch all RSS feeds
   */
  async fetchAllFeeds(): Promise<RSSItem[]> {
    console.log(`📡 Fetching ${this.FOOTBALL_RSS_FEEDS.length} RSS feeds`);
    
    const allItems: RSSItem[] = [];
    
    // Fetch feeds in parallel with error handling
    const fetchPromises = this.FOOTBALL_RSS_FEEDS.map(async (feed) => {
      try {
        const items = await this.fetchSingleFeed(feed.url, feed.name);
        console.log(`✅ ${feed.name}: ${items.length} items`);
        return items;
      } catch (error) {
        console.error(`❌ Error fetching ${feed.name}:`, error);
        return [];
      }
    });

    const results = await Promise.allSettled(fetchPromises);
    
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        allItems.push(...result.value);
      }
    });

    // Remove duplicates based on title similarity
    const uniqueItems = this.removeDuplicates(allItems);
    
    console.log(`📰 Total items: ${allItems.length}, Unique: ${uniqueItems.length}`);
    return uniqueItems;
  }

  /**
   * 📡 Fetch single RSS feed
   */
  private async fetchSingleFeed(feedUrl: string, sourceName: string): Promise<RSSItem[]> {
    try {
      // Try direct fetch first (works for many RSS feeds)
      let xmlContent: string;
      try {
        console.log(`🔍 Fetching RSS feed directly: ${feedUrl}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(feedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; RSS Bot)',
            'Accept': 'application/rss+xml, application/xml, text/xml'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        xmlContent = await response.text();
      } catch (directError) {
        // Try multiple proxy services
        console.log(`🔄 Direct fetch failed, trying proxy services for ${sourceName}`);
        xmlContent = await this.fetchViaProxy(feedUrl, sourceName);
      }
      
      // Parse XML content using fast-xml-parser
      const parsedData = this.xmlParser.parse(xmlContent);
      
      // Handle different RSS formats
      let items: any[] = [];
      if (parsedData.rss?.channel?.item) {
        items = Array.isArray(parsedData.rss.channel.item) 
          ? parsedData.rss.channel.item 
          : [parsedData.rss.channel.item];
      } else if (parsedData.feed?.entry) {
        // Atom feed
        items = Array.isArray(parsedData.feed.entry) 
          ? parsedData.feed.entry 
          : [parsedData.feed.entry];
      }

      // Convert to standardized RSS items
      const rssItems: RSSItem[] = items.map(item => {
        const id = item.guid?.['#text'] || item.guid || item.link || item.id || `${sourceName}_${Date.now()}_${Math.random()}`;
        const title = this.extractText(item.title) || 'No title';
        const description = this.extractText(item.description) || this.extractText(item.summary) || '';
        const content = this.extractText(item['content:encoded']) || this.extractText(item.content) || description;
        const link = item.link?.href || item.link || '';
        const pubDate = item.pubDate || item.published || new Date().toISOString();
        const author = this.extractText(item.author) || this.extractText(item['dc:creator']) || '';
        const category = this.extractText(item.category) || 'Football';
        const imageUrl = this.extractImageFromItem(item, description);

        return {
          id,
          title,
          description,
          content,
          link,
          pubDate,
          author,
          category,
          imageUrl,
          source: sourceName
        };
      });

      console.log(`✅ ${sourceName}: ${rssItems.length} items`);
      return rssItems;

    } catch (error) {
      console.error(`❌ Error fetching RSS feed ${feedUrl}:`, error);
      // Return empty array instead of throwing to continue with other feeds
      return [];
    }
  }

  /**
   * 🔄 Fetch via proxy with multiple fallbacks
   */
  private async fetchViaProxy(feedUrl: string, sourceName: string): Promise<string> {
    const proxyServices = [
      'https://api.allorigins.win/get?url=',
      'https://cors-anywhere.herokuapp.com/',
      'https://api.codetabs.com/v1/proxy?quest='
    ];
    
    let lastError: any;
    
    for (let i = 0; i < proxyServices.length; i++) {
      try {
        const proxyUrl = proxyServices[i] + encodeURIComponent(feedUrl);
        console.log(`🔄 Trying proxy ${i + 1}/${proxyServices.length} for ${sourceName}`);
        
        const proxyController = new AbortController();
        const proxyTimeoutId = setTimeout(() => proxyController.abort(), 8000);
        
        const proxyResponse = await fetch(proxyUrl, { signal: proxyController.signal });
        clearTimeout(proxyTimeoutId);
        
        if (!proxyResponse.ok) {
          throw new Error(`Proxy HTTP ${proxyResponse.status}: ${proxyResponse.statusText}`);
        }
        
        let xmlContent: string;
        if (proxyServices[i].includes('allorigins')) {
          const proxyData = await proxyResponse.json();
          xmlContent = proxyData.contents;
        } else {
          xmlContent = await proxyResponse.text();
        }
        
        if (xmlContent && xmlContent.length > 100) {
          console.log(`✅ Proxy ${i + 1} successful for ${sourceName}`);
          return xmlContent;
        }
        
        throw new Error('Empty or invalid response');
        
      } catch (error) {
        lastError = error;
        console.error(`❌ Proxy ${i + 1} failed for ${sourceName}:`, error);
        
        // Wait before trying next proxy
        if (i < proxyServices.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    throw lastError || new Error('All proxy services failed');
  }

  /**
   * 🧹 Remove duplicate news items
   */
  private removeDuplicates(items: RSSItem[]): RSSItem[] {
    const seen = new Set<string>();
    const unique: RSSItem[] = [];

    for (const item of items) {
      // Create a simple key for duplicate detection
      const key = item.title.toLowerCase().replace(/[^\w\s]/g, '').slice(0, 50);
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    }

    return unique;
  }

  /**
   * 📝 Extract text content from parsed XML data
   */
  private extractText(data: any): string {
    if (!data) return '';
    
    if (typeof data === 'string') {
      return data.trim();
    }
    
    if (data['#text']) {
      return data['#text'].trim();
    }
    
    if (typeof data === 'object' && data.toString) {
      return data.toString().trim();
    }
    
    return '';
  }

  /**
   * 🖼️ Extract image URL from RSS item
   */
  private extractImageFromItem(item: any, description: string): string | undefined {
    // Try different image sources in RSS
    
    // 1. Check for media:thumbnail or media:content
    if (item['media:thumbnail']?.['@_url']) {
      return item['media:thumbnail']['@_url'];
    }
    
    if (item['media:content']?.['@_url']) {
      return item['media:content']['@_url'];
    }
    
    // 2. Check for enclosure
    if (item.enclosure?.['@_url'] && item.enclosure['@_type']?.includes('image')) {
      return item.enclosure['@_url'];
    }
    
    // 3. Extract from description HTML
    if (description) {
      const imgMatch = description.match(/<img[^>]+src="([^"]+)"/i);
      if (imgMatch) {
        return imgMatch[1];
      }
    }
    
    return undefined;
  }

  /**
   * 📝 Extract text content from XML element (legacy method)
   */
  private getTextContent(item: Element, tagName: string): string {
    const element = item.querySelector(tagName);
    return element?.textContent?.trim() || '';
  }

  /**
   * 🖼️ Extract image URL from RSS item (legacy method)
   */
  private extractImageUrl(item: Element, description: string): string | undefined {
    // Try different image sources in RSS
    
    // 1. Check for media:thumbnail or media:content
    const mediaThumbnail = item.querySelector('media\\:thumbnail, thumbnail');
    if (mediaThumbnail) {
      const url = mediaThumbnail.getAttribute('url');
      if (url) return url;
    }

    const mediaContent = item.querySelector('media\\:content, content');
    if (mediaContent) {
      const url = mediaContent.getAttribute('url');
      if (url && url.includes('image')) return url;
    }

    // 2. Check for enclosure (podcast/media)
    const enclosure = item.querySelector('enclosure');
    if (enclosure) {
      const type = enclosure.getAttribute('type');
      const url = enclosure.getAttribute('url');
      if (type?.includes('image') && url) return url;
    }

    // 3. Extract from description HTML
    const imgMatch = description.match(/<img[^>]+src=['"](.*?)['"]/i);
    if (imgMatch && imgMatch[1]) {
      return imgMatch[1];
    }

    // 4. Look for image URLs in description text
    const urlMatch = description.match(/(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/i);
    if (urlMatch && urlMatch[1]) {
      return urlMatch[1];
    }

    return undefined;
  }

  /**
   * 🧹 Clean text content
   */
  private cleanText(text: string): string {
    return text
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Decode HTML entities
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * 🔍 Search RSS items by keyword
   */
  async searchByKeyword(keyword: string): Promise<RSSItem[]> {
    const allItems = await this.fetchAllFeeds();
    const searchTerm = keyword.toLowerCase();
    
    return allItems.filter(item =>
      item.title.toLowerCase().includes(searchTerm) ||
      item.description.toLowerCase().includes(searchTerm) ||
      item.category?.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * 📊 Get RSS feed statistics
   */
  async getFeedStats(): Promise<{
    totalFeeds: number;
    totalItems: number;
    itemsPerFeed: { [key: string]: number };
    categories: { [key: string]: number };
    withImages: number;
    withoutImages: number;
  }> {
    const allItems = await this.fetchAllFeeds();
    
    const itemsPerFeed: { [key: string]: number } = {};
    const categories: { [key: string]: number } = {};
    let withImages = 0;
    
    allItems.forEach(item => {
      // Count per feed
      itemsPerFeed[item.source] = (itemsPerFeed[item.source] || 0) + 1;
      
      // Count per category
      const category = item.category || 'Uncategorized';
      categories[category] = (categories[category] || 0) + 1;
      
      // Count images
      if (item.imageUrl) withImages++;
    });

    return {
      totalFeeds: this.FOOTBALL_RSS_FEEDS.length,
      totalItems: allItems.length,
      itemsPerFeed,
      categories,
      withImages,
      withoutImages: allItems.length - withImages
    };
  }

  /**
   * 🎯 Get latest news (sorted by date)
   */
  async getLatestNews(limit: number = 10): Promise<RSSItem[]> {
    const allItems = await this.fetchAllFeeds();
    
    // Sort by publication date (newest first)
    return allItems
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, limit);
  }

  /**
   * 🏆 Get top news by source priority
   */
  async getTopNewsByPriority(limit: number = 10): Promise<RSSItem[]> {
    const allItems = await this.fetchAllFeeds();
    
    // Create source priority map
    const sourcePriority: { [key: string]: number } = {};
    this.FOOTBALL_RSS_FEEDS.forEach(feed => {
      sourcePriority[feed.name] = feed.priority;
    });
    
    // Sort by source priority then by date
    return allItems
      .sort((a, b) => {
        const priorityA = sourcePriority[a.source] || 0;
        const priorityB = sourcePriority[b.source] || 0;
        
        if (priorityA !== priorityB) {
          return priorityB - priorityA; // Higher priority first
        }
        
        // Same priority, sort by date
        return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
      })
      .slice(0, limit);
  }
}

// Export singleton instance
export const rssNewsFetcher = new RSSNewsFetcher();