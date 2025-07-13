/**
 * 🎨 CONTENT FORMATTER - Content Formatting and Optimization Logic
 * Handles all content formatting, optimization, and text processing for different platforms
 */

import { Language } from './channel-resolver';

export interface ContentFormattingOptions {
  mode: string;
  language: Language;
  contentType: string;
  maxLength?: number;
}

export class ContentFormatter {
  /**
   * 📱 OPTIMIZED TELEGRAM CONTENT FORMATTER - Short & Engaging
   */
  formatForTelegram(content: any, mode: string): string {
    let formattedText = '';

    // Get language from content
    const contentLanguage = content.language || content.content_items?.[0]?.language || 'en';
      
    // Error messages in the correct language
    const noContentText = {
      en: 'No content available',
      am: 'ምንም ይዘት አይገኝም',
      sw: 'Hakuna maudhui yanayopatikana'
    };
      
    // Use the content from the content items if available
    if (content.content_items && content.content_items.length > 0) {
      const item = content.content_items[0]; // Get the first content item
      formattedText = item.content || item.title || (noContentText[contentLanguage as keyof typeof noContentText] || noContentText.en);
    } else if (content.text) {
      formattedText = content.text;
    } else {
      return noContentText[contentLanguage as keyof typeof noContentText] || noContentText.en;
    }

    // Ensure formattedText is a valid string
    if (!formattedText || typeof formattedText !== 'string') {
      formattedText = noContentText[contentLanguage as keyof typeof noContentText] || noContentText.en;
    }

    // 🧹 CRITICAL: Clean HTML tags for Telegram before any processing
    formattedText = this.cleanHTMLForTelegram(formattedText);

    // 🎯 SMART CONTENT OPTIMIZATION FOR TELEGRAM
    formattedText = this.optimizeContentForTelegram(formattedText, content.content_type, contentLanguage);

    // הוספת אמוג'י לפי סוג התוכן
    const emojiMap: Record<string, string> = {
      live: '🔴',
      betting: '🎯',
      news: '📰',
      polls: '📊',
      analysis: '📈',
      coupons: '🎫',
      memes: '😄',
      daily_summary: '📋',
      weekly_summary: '📊'
    };

    const emoji = emojiMap[content.content_type || content.type] || '⚽';
    
    // הוספת header עם אמוג'י (רק אם לא קיים כבר)
    if (formattedText && typeof formattedText === 'string' && !formattedText.startsWith(emoji)) {
      formattedText = `${emoji} ${formattedText}`;
    }

    // 📏 AGGRESSIVE LENGTH CONTROL - Even shorter for mobile
    const maxLength = 600; // Much shorter for better mobile UX
    const contentType = content.content_type || content.type;
    
    // ⭐ Skip length control for analysis content - it's AI-generated at optimal length
    if (formattedText && typeof formattedText === 'string' && formattedText.length > maxLength && contentType !== 'analysis') {
      formattedText = this.smartTruncateContent(formattedText, maxLength, contentLanguage);
    }

    // Final safety check - ensure we always return a valid string
    return (formattedText && typeof formattedText === 'string') ? formattedText : (noContentText[contentLanguage as keyof typeof noContentText] || noContentText.en);
  }

  /**
   * 🧹 Clean HTML tags for Telegram compatibility
   * טלגרם תומך רק בתגים ספציפיים: <b>, <i>, <u>, <s>, <a>, <code>, <pre>
   */
  private cleanHTMLForTelegram(text: string): string {
    if (!text || typeof text !== 'string') return text;

    console.log('🧹 Cleaning HTML for Telegram:', text.substring(0, 100) + '...');

    // Lista of HTML tags that Telegram supports
    const supportedTags = ['b', 'i', 'u', 's', 'a', 'code', 'pre'];
    
    // Create regex pattern for supported tags
    const supportedTagsPattern = supportedTags.join('|');
    
    // Remove all HTML tags except supported ones
    text = text.replace(/<\/?(?!(?:\/?)(?:b|i|u|s|a|code|pre)\b)[^>]*>/gi, '');
    
    // Clean up specific problematic tags that might remain
    text = text
      // Remove paragraph tags but keep content
      .replace(/<\/?p[^>]*>/gi, '\n')
      // Remove div tags but keep content
      .replace(/<\/?div[^>]*>/gi, '\n')
      // Remove span tags but keep content
      .replace(/<\/?span[^>]*>/gi, '')
      // Remove header tags but keep content
      .replace(/<\/?h[1-6][^>]*>/gi, '\n')
      // Remove list tags but keep content
      .replace(/<\/?ul[^>]*>/gi, '\n')
      .replace(/<\/?ol[^>]*>/gi, '\n')
      .replace(/<\/?li[^>]*>/gi, '\n• ')
      // Remove table tags but keep content
      .replace(/<\/?table[^>]*>/gi, '\n')
      .replace(/<\/?tr[^>]*>/gi, '\n')
      .replace(/<\/?td[^>]*>/gi, ' ')
      .replace(/<\/?th[^>]*>/gi, ' ')
      // Remove other common tags
      .replace(/<\/?br[^>]*>/gi, '\n')
      .replace(/<\/?hr[^>]*>/gi, '\n---\n')
      .replace(/<\/?blockquote[^>]*>/gi, '\n')
      .replace(/<\/?strong[^>]*>/gi, '')
      .replace(/<\/?em[^>]*>/gi, '')
      .replace(/<\/?mark[^>]*>/gi, '')
      .replace(/<\/?small[^>]*>/gi, '')
      .replace(/<\/?sub[^>]*>/gi, '')
      .replace(/<\/?sup[^>]*>/gi, '')
      // Remove any remaining HTML tags
      .replace(/<[^>]*>/g, '')
      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&hellip;/g, '...')
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–')
      .replace(/&rsquo;/g, "'")
      .replace(/&lsquo;/g, "'")
      .replace(/&rdquo;/g, '"')
      .replace(/&ldquo;/g, '"')
      // Clean up excessive whitespace and newlines
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s{2,}/g, ' ')
      .trim();

    console.log('✅ HTML cleaned for Telegram:', text.substring(0, 100) + '...');
    return text;
  }

  /**
   * 🎯 Smart Content Optimization for Different Content Types
   */
  private optimizeContentForTelegram(text: string, contentType: string, language: string): string {
    if (!text || typeof text !== 'string') return text;

    // Remove excessive newlines and spaces
    text = text.replace(/\n{3,}/g, '\n\n').replace(/\s{2,}/g, ' ').trim();

    // Content-type specific optimizations
    switch (contentType) {
      case 'news':
        text = this.optimizeNewsContent(text, language);
        break;
      case 'betting':
        text = this.optimizeBettingContent(text, language);
        break;
      case 'analysis':
        text = this.optimizeAnalysisContent(text, language);
        break;
      case 'live':
        text = this.optimizeLiveContent(text, language);
        break;
      case 'daily_summary':
      case 'weekly_summary':
        text = this.optimizeSummaryContent(text, language);
        break;
      default:
        // For unknown content types, ensure it's clean
        text = this.cleanHTMLForTelegram(text);
        break;
    }

    // Final HTML cleaning pass to ensure no tags slipped through
    text = this.cleanHTMLForTelegram(text);

    return text;
  }

  /**
   * 📰 News Content Optimization
   */
  private optimizeNewsContent(text: string, language: string): string {
    // Remove repetitive phrases and keep only essential info
    text = text.replace(/\b(latest|recent|breaking|update|news|story)\b/gi, '');
    
    // Extract key information in bullet points for news
    const lines = text.split('\n').filter(line => line.trim());
    const optimized = lines.slice(0, 3).join('\n'); // Keep only first 3 lines
    
    return optimized.trim();
  }

  /**
   * 🎯 Betting Content Optimization
   */
  private optimizeBettingContent(text: string, language: string): string {
    // Focus on key predictions and odds
    const predictions = text.match(/🎯[^🎯]*/g) || [];
    const keyInfo = predictions.slice(0, 2).join('\n'); // Max 2 predictions
    
    // Add responsible gambling reminder
    const disclaimer = language === 'en' ? '⚠️ 18+ Bet Responsibly' : 
                      language === 'am' ? '⚠️ 18+ በኃላፊነት ይዋረዱ' : 
                      '⚠️ 18+ Weka dau kwa uwazi';
    
    return keyInfo ? `${keyInfo}\n\n${disclaimer}` : text;
  }

  /**
   * 📈 Analysis Content Optimization
   */
  private optimizeAnalysisContent(text: string, language: string): string {
    // ⭐ For analysis content, we DON'T want to truncate since it's AI-generated at optimal length
    // Just clean up excessive whitespace
    return text.replace(/\n{3,}/g, '\n\n').replace(/\s{2,}/g, ' ').trim();
  }

  /**
   * 🔴 Live Content Optimization
   */
  private optimizeLiveContent(text: string, language: string): string {
    // Focus on current score and key events
    const urgentInfo = text.split('\n').filter(line => 
      line.includes('GOAL') || 
      line.includes('⚽') || 
      line.includes('🔴') || 
      line.includes('LIVE') ||
      line.includes('-') && line.includes(':')
    ).slice(0, 3);
    
    return urgentInfo.join('\n') || text.substring(0, 250);
  }

  /**
   * 📋 Summary Content Optimization
   */
  private optimizeSummaryContent(text: string, language: string): string {
    // Extract highlights and key points
    const sections = text.split('\n\n');
    const highlights = sections.filter(section => 
      section.includes('🏆') || 
      section.includes('⚽') || 
      section.includes('📊') ||
      section.includes('TOP') ||
      section.toLowerCase().includes('highlight')
    ).slice(0, 2);
    
    return highlights.join('\n\n') || text.substring(0, 400);
  }

  /**
   * ✂️ Smart Content Truncation with Natural Break Points
   */
  private smartTruncateContent(text: string, maxLength: number, language: string): string {
    if (text.length <= maxLength) return text;

    // Find natural break points
    const sentences = text.split(/[.!?]\s+/);
    let result = '';
    
    for (const sentence of sentences) {
      const nextLength = result.length + sentence.length + 2; // +2 for punctuation and space
      if (nextLength > maxLength - 50) break; // Leave room for "read more"
      result += (result ? '. ' : '') + sentence;
    }
    
    // If no good sentence break, find word break
    if (!result) {
      const words = text.split(' ');
      for (const word of words) {
        const nextLength = result.length + word.length + 1;
        if (nextLength > maxLength - 50) break;
        result += (result ? ' ' : '') + word;
      }
    }
    
    // Add "read more" text in the correct language
    const readMoreText = {
      en: '📖 More',
      am: '📖 ተጨማሪ',
      sw: '📖 Zaidi'
    };
    
    return result.trim() + '...\n\n' + (readMoreText[language as keyof typeof readMoreText] || readMoreText.en);
  }

  /**
   * 🏷️ Extract Team Names from Content
   */
  extractTeamsFromContent(content: string): string[] {
    // Regular expressions for common team name patterns
    const patterns = [
      // "Team A vs Team B" or "Team A vs. Team B"
      /([A-Za-zА-Я\s]+)\s+vs\.?\s+([A-Za-zА-Я\s]+)/gi,
      // "Team A - Team B"
      /([A-Za-zА-Я\s]+)\s+-\s+([A-Za-zА-Я\s]+)/gi,
      // "Team A against Team B"
      /([A-Za-zА-Я\s]+)\s+against\s+([A-Za-zА-Я\s]+)/gi
    ];
    
    for (const pattern of patterns) {
      const match = pattern.exec(content);
      if (match && match.length >= 3) {
        return [match[1].trim(), match[2].trim()];
      }
    }
    
    // Look for common football team name patterns
    const teamWords = ['FC', 'United', 'City', 'Madrid', 'Barcelona', 'Liverpool', 'Arsenal', 'Chelsea', 'Manchester', 'Real'];
    const words = content.split(/\s+/);
    const teams: string[] = [];
    
    for (let i = 0; i < words.length - 1; i++) {
      if (teamWords.some(tw => words[i].includes(tw) || words[i + 1].includes(tw))) {
        const teamName = `${words[i]} ${words[i + 1]}`.trim();
        if (teamName.length > 3 && !teams.includes(teamName)) {
          teams.push(teamName);
        }
      }
    }
    
    return teams.slice(0, 2); // Return max 2 teams
  }

  /**
   * 🏆 Extract Competition Name from Content
   */
  extractCompetitionFromContent(content: string): string {
    const competitions = [
      'Premier League', 'Champions League', 'UEFA', 'FIFA', 'World Cup', 'Europa League',
      'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'Copa del Rey', 'FA Cup',
      'Intercontinental Cup', 'Club World Cup', 'Nations League'
    ];
    
    for (const comp of competitions) {
      if (content.toLowerCase().includes(comp.toLowerCase())) {
        return comp;
      }
    }
    
    // Look for competition-like patterns
    const competitionPatterns = [
      /(\w+\s+(?:Cup|League|Championship|Tournament))/gi,
      /(FIFA\s+\w+)/gi,
      /(UEFA\s+\w+)/gi
    ];
    
    for (const pattern of competitionPatterns) {
      const match = pattern.exec(content);
      if (match) {
        return match[1].trim();
      }
    }
    
    return 'Football Match';
  }

  /**
   * 🗳️ Extract Poll Options from Content
   */
  extractPollOptionsFromContent(content: string): string[] {
    // Look for numbered options (1. Option, 2. Option, etc.)
    const numberedPattern = /\d+[\.\)]\s*([^\d\n]+)/g;
    const numberedMatches = content.match(numberedPattern);
    if (numberedMatches && numberedMatches.length >= 2) {
      return numberedMatches.map(match => match.replace(/\d+[\.\)]\s*/, '').trim()).slice(0, 4);
    }
    
    // Look for lettered options (A. Option, B. Option, etc.)
    const letteredPattern = /[A-D][\.\)]\s*([^\n]+)/g;
    const letteredMatches = content.match(letteredPattern);
    if (letteredMatches && letteredMatches.length >= 2) {
      return letteredMatches.map(match => match.replace(/[A-D][\.\)]\s*/, '').trim()).slice(0, 4);
    }
    
    // Look for bullet points or dashes
    const bulletPattern = /[-•*]\s*([^\n]+)/g;
    const bulletMatches = content.match(bulletPattern);
    if (bulletMatches && bulletMatches.length >= 2) {
      return bulletMatches.map(match => match.replace(/[-•*]\s*/, '').trim()).slice(0, 4);
    }
    
    // Look for "or" separated options
    const orPattern = /([^,\n]+)\s+or\s+([^,\n]+)/gi;
    const orMatch = orPattern.exec(content);
    if (orMatch && orMatch.length >= 3) {
      return [orMatch[1].trim(), orMatch[2].trim()];
    }
    
    return []; // Return empty array if no options found
  }

  /**
   * 📊 Format content for specific platforms
   */
  formatForPlatform(content: any, platform: 'telegram' | 'web' | 'email', options: ContentFormattingOptions): string {
    switch (platform) {
      case 'telegram':
        return this.formatForTelegram(content, options.mode);
      case 'web':
        return this.formatForWeb(content, options);
      case 'email':
        return this.formatForEmail(content, options);
      default:
        return this.formatForTelegram(content, options.mode);
    }
  }

  /**
   * 🌐 Format content for web display
   */
  private formatForWeb(content: any, options: ContentFormattingOptions): string {
    const formattedText = content.content_items?.[0]?.content || content.text || 'No content available';
    
    // Web formatting - keep full content, add HTML structure
    return `<div class="content-${options.contentType}">
      <h3>${content.content_items?.[0]?.title || 'Content'}</h3>
      <div class="content-body">
        ${formattedText.replace(/\n/g, '<br>')}
      </div>
    </div>`;
  }

  /**
   * 📧 Format content for email
   */
  private formatForEmail(content: any, options: ContentFormattingOptions): string {
    const formattedText = content.content_items?.[0]?.content || content.text || 'No content available';
    
    // Email formatting - structured with headers
    const emailContent = `
Subject: ${content.content_items?.[0]?.title || 'Football Update'}

${formattedText}

---
Football Updates | ${new Date().toLocaleDateString()}
    `.trim();
    
    return emailContent;
  }

  /**
   * 🎯 Optimize content length for different contexts
   */
  optimizeContentLength(text: string, targetLength: number, language: Language): string {
    if (text.length <= targetLength) return text;
    
    return this.smartTruncateContent(text, targetLength, language);
  }
}

export const contentFormatter = new ContentFormatter(); 