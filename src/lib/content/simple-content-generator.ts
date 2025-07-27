/**
 * 🎯 SIMPLE CONTENT GENERATOR - פשוט ויעיל
 * יוצר תוכן לפי שפת הערוץ אוטומטית
 */

import { simpleChannelResolver, type SimpleChannel, type Language } from './simple-channel-resolver';

export interface ContentGenerationResult {
  success: boolean;
  contentItems: Array<{
    content: string;
    language: Language;
    channel: SimpleChannel;
    contentType: string;
    image?: string;
  }>;
  channels: SimpleChannel[];
  statistics: {
    totalGenerated: number;
    languageBreakdown: Record<Language, number>;
    errors: string[];
  };
}

export class SimpleContentGenerator {
  /**
   * יצירת תוכן לכל הערוצים הפעילים
   */
  async generateForAllChannels(contentType: string): Promise<ContentGenerationResult> {
    const channels = await simpleChannelResolver.getChannelsByContentType(contentType);
    return this.generateForChannels(channels, contentType);
  }

  /**
   * יצירת תוכן לערוצים ספציפיים
   */
  async generateForSpecificChannels(channelIds: string[], contentType: string): Promise<ContentGenerationResult> {
    const channels = await simpleChannelResolver.getSpecificChannels(channelIds);
    return this.generateForChannels(channels, contentType);
  }

  /**
   * יצירת תוכן לערוצים שראויים לאוטומציה כרגע
   */
  async generateForAutomation(contentType: string): Promise<ContentGenerationResult> {
    const channels = await simpleChannelResolver.getChannelsForAutomation(contentType);
    return this.generateForChannels(channels, contentType);
  }

  /**
   * פונקציה מרכזית ליצירת תוכן
   */
  private async generateForChannels(channels: SimpleChannel[], contentType: string): Promise<ContentGenerationResult> {
    const result: ContentGenerationResult = {
      success: true,
      contentItems: [],
      channels,
      statistics: {
        totalGenerated: 0,
        languageBreakdown: { he: 0, en: 0, am: 0, sw: 0 },
        errors: []
      }
    };

    console.log(`🎯 מתחיל יצירת תוכן עבור ${channels.length} ערוצים, סוג: ${contentType}`);

    // קיבוץ ערוצים לפי שפות
    const { languageGroups } = await simpleChannelResolver.resolveChannels({});

    // יצירת תוכן לכל שפה בנפרד
    for (const [language, languageChannels] of Object.entries(languageGroups)) {
      const relevantChannels = languageChannels.filter(channel => 
        channels.some(ch => ch.id === channel.id) &&
        simpleChannelResolver.supportsContentType(channel, contentType)
      );

      if (relevantChannels.length === 0) continue;

      console.log(`🌍 יוצר תוכן בשפה ${language} עבור ${relevantChannels.length} ערוצים`);

      try {
        // יצירת תוכן בשפה הספציפית
        const languageContent = await this.generateContentForLanguage(
          language as Language,
          contentType,
          relevantChannels
        );

        // הוספת התוכן לתוצאות
        for (const channel of relevantChannels) {
          result.contentItems.push({
            content: languageContent.content,
            language: language as Language,
            channel,
            contentType,
            image: languageContent.image
          });
          
          result.statistics.languageBreakdown[language as Language]++;
        }

        result.statistics.totalGenerated += relevantChannels.length;

      } catch (error) {
        console.error(`❌ שגיאה ביצירת תוכן עבור שפה ${language}:`, error);
        result.statistics.errors.push(`שגיאה בשפה ${language}: ${String(error)}`);
      }
    }

    if (result.statistics.totalGenerated === 0) {
      result.success = false;
      result.statistics.errors.push('לא נוצר תוכן עבור אף ערוץ');
    }

    console.log(`✅ סיים יצירת תוכן: ${result.statistics.totalGenerated} פריטים נוצרו`);
    return result;
  }

  /**
   * יצירת תוכן לשפה ספציפית - משתמש ב unified-content API
   */
  private async generateContentForLanguage(
    language: Language,
    contentType: string,
    channels: SimpleChannel[]
  ): Promise<{ content: string; image?: string }> {
    console.log(`🎯 יוצר תוכן ${contentType} בשפה ${language}`);

    try {
      // קריאה ל unified-content API הקיים
      const response = await fetch('/api/unified-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate',
          type: contentType,
          language: language,
          maxItems: 1
        }),
      });

      if (!response.ok) {
        throw new Error('שגיאה בקריאה ל API');
      }

      const apiResult = await response.json();
      
      if (apiResult.success && apiResult.content_items && apiResult.content_items.length > 0) {
        return {
          content: apiResult.content_items[0].content || apiResult.content_items[0],
          image: apiResult.content_items[0].image
        };
      }

      throw new Error('לא התקבל תוכן מה API');

    } catch (error) {
      console.error(`❌ שגיאה ביצירת תוכן עבור ${contentType} בשפה ${language}:`, error);
      
      // חזור לתוכן גיבוי
      return {
        content: this.getFallbackContent(contentType, language)
      };
    }
  }

  /**
   * תוכן גיבוי במקרה של שגיאה
   */
  private getFallbackContent(contentType: string, language: Language): string {
    const fallbacks = {
      he: {
        news: '⚽ חדשות ספורט עדכניות יגיעו בקרוב!',
        betting: '🎯 טיפי הימורים מקצועיים יגיעו בקרוב!',
        analysis: '📊 ניתוח מקצועי של משחקים יגיע בקרוב!',
        live: '🔴 עדכונים חיים ממשחקים יגיעו בקרוב!',
        polls: '📊 סקר דעת מעניין יגיע בקרוב!',
        summary: '📅 סיכום משחקים יגיע בקרוב!'
      },
      en: {
        news: '⚽ Latest sports news coming soon!',
        betting: '🎯 Professional betting tips coming soon!',
        analysis: '📊 Professional match analysis coming soon!',
        live: '🔴 Live match updates coming soon!',
        polls: '📊 Interesting poll coming soon!',
        summary: '📅 Match summary coming soon!'
      },
      am: {
        news: '⚽ የአዳዲስ ስፖርት ዜናዎች በቅርቡ ይመጣሉ!',
        betting: '🎯 ሙያዊ ምክርች በቅርቡ ይመጣሉ!',
        analysis: '📊 ሙያዊ ጨዋታ ትንተና በቅርቡ ይመጣል!',
        live: '🔴 ቀጥታ ጨዋታ ዝመናዎች በቅርቡ ይመጣሉ!',
        polls: '📊 አስደሳች የሕዝብ አስተያየት በቅርቡ ይመጣል!',
        summary: '📅 የጨዋታ ማጠቃለያ በቅርቡ ይመጣል!'
      },
      sw: {
        news: '⚽ Habari za hivi punde za michezo zinakuja!',
        betting: '🎯 Vidokezo vya kitaalamu vya kubashiri vinakuja!',
        analysis: '📊 Uchambuzi wa kitaalamu wa mechi unakuja!',
        live: '🔴 Masasisho ya moja kwa moja ya mechi yanakuja!',
        polls: '📊 Utafiti wa maoni unakuja!',
        summary: '📅 Muhtasari wa mechi unakuja!'
      }
    };

    return fallbacks[language]?.[contentType as keyof typeof fallbacks.he] || fallbacks.en[contentType as keyof typeof fallbacks.en] || 'Content coming soon!';
  }
}

export const simpleContentGenerator = new SimpleContentGenerator(); 