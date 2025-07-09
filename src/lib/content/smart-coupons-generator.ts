/**
 * 🎫 SMART COUPONS GENERATOR
 * 
 * Flow for Smart Coupons:
 * 1. User creates coupon → 2. Store in database → 3. Smart contextual triggers → 4. Intelligent placement → 5. Track performance → 6. Analytics
 * 
 * Key features:
 * - User interface for coupon creation and management
 * - Intelligent contextual posting (after betting tips, analysis, etc.)
 * - Smart placement algorithms
 * - Performance tracking and analytics
 * - Multi-language coupon support
 * - A/B testing capabilities
 */

import { unifiedFootballService } from './unified-football-service';
import { aiImageGenerator } from './ai-image-generator';
import { supabase } from '@/lib/supabase';

export type CouponType = 
  | 'betting_bonus'      // Betting site bonuses
  | 'odds_boost'         // Enhanced odds offers
  | 'cashback'          // Money back offers
  | 'free_bet'          // Free bet promotions
  | 'deposit_bonus'     // Deposit match bonuses
  | 'risk_free'         // Risk-free bet offers
  | 'accumulator_boost' // Acca insurance/boosts
  | 'merchandise'       // Team merchandise
  | 'streaming'         // Match streaming services
  | 'fantasy'          // Fantasy football bonuses
  | 'general_promo';   // General promotions

export type TriggerContext = 
  | 'after_betting_tips'    // Post after betting content
  | 'after_analysis'        // Post after match analysis
  | 'after_news'           // Post after news content
  | 'after_polls'          // Post after poll content
  | 'before_matches'       // Post before big matches
  | 'after_goals'          // Post after goal updates
  | 'weekend_specials'     // Weekend promotions
  | 'manual'              // Manual posting
  | 'scheduled';          // Scheduled posting

export interface CouponData {
  id: string;
  title: string;
  description: string;
  offerText: string;
  
  // Coupon details
  couponCode?: string;
  discountPercentage?: number;
  discountAmount?: number;
  minSpend?: number;
  maxDiscount?: number;
  
  // Validity
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  
  // Targeting
  targetAudience: string[];
  languages: ('en' | 'am' | 'sw')[];
  
  // Branding
  brandName: string;
  brandLogo?: string;
  brandColors: {
    primary: string;
    secondary: string;
  };
  
  // Links
  affiliateLink: string;
  termsUrl?: string;
  
  // Metadata
  type: CouponType;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  maxUsage?: number;
  currentUsage: number;
  
  // Contextual triggers
  triggerContexts: TriggerContext[];
  triggerConditions: {
    afterContentTypes?: string[];
    matchImportance?: ('HIGH' | 'MEDIUM' | 'LOW')[];
    timeOfDay?: string[];
    dayOfWeek?: string[];
  };
  
  // Performance
  impressions: number;
  clicks: number;
  conversions: number;
  
  // Creation info
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CouponPlacementContext {
  contentType: string;
  matchData?: any;
  channelId: string;
  language: 'en' | 'am' | 'sw';
  matchImportance?: 'HIGH' | 'MEDIUM' | 'LOW';
  userEngagement?: 'HIGH' | 'MEDIUM' | 'LOW';
  timeContext: {
    hour: number;
    dayOfWeek: string;
    isWeekend: boolean;
  };
}

export interface SmartCouponPlacement {
  shouldShowCoupon: boolean;
  selectedCoupon?: CouponData;
  placementReason: string;
  confidence: number;
  alternativeCoupons: CouponData[];
}

export interface GeneratedCoupon {
  title: string;
  content: string;
  imageUrl?: string;
  couponData: CouponData;
  placementContext: CouponPlacementContext;
  aiEditedContent?: string;
  callToAction: string;
  urgencyText?: string;
  metadata: {
    language: string;
    generatedAt: string;
    contentId: string;
    placementReason: string;
    expectedConversion: number;
  };
}

export interface CouponCreateRequest {
  title: string;
  description: string;
  offerText: string;
  couponCode?: string;
  discountPercentage?: number;
  discountAmount?: number;
  minSpend?: number;
  validUntil: string;
  brandName: string;
  affiliateLink: string;
  type: CouponType;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  triggerContexts: TriggerContext[];
  languages: ('en' | 'am' | 'sw')[];
  targetAudience: string[];
}

export interface CouponPerformanceStats {
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  clickThroughRate: number;
  conversionRate: number;
  topPerformingCoupons: CouponData[];
  contextualPerformance: { [context: string]: number };
}

export class SmartCouponsGenerator {

  /**
   * 🎫 MAIN FUNCTION - Get smart coupon for context
   */
  async getSmartCouponForContext(context: CouponPlacementContext): Promise<GeneratedCoupon | null> {
    console.log(`🎫 Evaluating smart coupon for ${context.contentType} in ${context.language}`);
    
    try {
      // Step 1: Analyze placement opportunity
      const placement = await this.analyzeSmartPlacement(context);
      
      if (!placement.shouldShowCoupon || !placement.selectedCoupon) {
        console.log(`❌ No suitable coupon for this context: ${placement.placementReason}`);
        return null;
      }

      console.log(`✅ Selected coupon: ${placement.selectedCoupon.title} (${placement.confidence}% confidence)`);

      // Step 2: Generate contextual coupon content
      const couponContent = await this.generateContextualCouponContent(
        placement.selectedCoupon, 
        context
      );
      
      // Step 3: Create coupon image
      const imageUrl = await this.generateCouponImage(placement.selectedCoupon);
      
      // Step 4: AI edit for engagement
      const aiEditedContent = await this.aiEditCouponContent(
        couponContent.content,
        placement.selectedCoupon,
        context
      );
      
      // Step 5: Track coupon impression
      await this.trackCouponImpression(placement.selectedCoupon.id, context);

      return {
        title: couponContent.title,
        content: couponContent.content,
        imageUrl,
        couponData: placement.selectedCoupon,
        placementContext: context,
        aiEditedContent,
        callToAction: couponContent.callToAction,
        urgencyText: couponContent.urgencyText,
        metadata: {
          language: context.language,
          generatedAt: new Date().toISOString(),
          contentId: `coupon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          placementReason: placement.placementReason,
          expectedConversion: this.calculateExpectedConversion(placement.selectedCoupon, context)
        }
      };

    } catch (error) {
      console.error(`❌ Error getting smart coupon:`, error);
      return null;
    }
  }

  /**
   * 🧠 Step 1: Analyze smart placement opportunity
   */
  private async analyzeSmartPlacement(context: CouponPlacementContext): Promise<SmartCouponPlacement> {
    // Get available coupons for this context
    const availableCoupons = await this.getAvailableCoupons(context);
    
    if (availableCoupons.length === 0) {
      return {
        shouldShowCoupon: false,
        placementReason: 'No active coupons available',
        confidence: 0,
        alternativeCoupons: []
      };
    }

    // Score each coupon for this context
    const scoredCoupons = availableCoupons.map(coupon => ({
      coupon,
      score: this.calculateCouponContextScore(coupon, context)
    })).sort((a, b) => b.score - a.score);

    const bestCoupon = scoredCoupons[0];
    
    // Determine if we should show a coupon
    const shouldShow = this.shouldShowCouponInContext(context, bestCoupon.score);
    
    if (!shouldShow) {
      return {
        shouldShowCoupon: false,
        placementReason: 'Context not suitable for coupon placement',
        confidence: bestCoupon.score,
        alternativeCoupons: scoredCoupons.slice(1, 4).map(s => s.coupon)
      };
    }

    return {
      shouldShowCoupon: true,
      selectedCoupon: bestCoupon.coupon,
      placementReason: this.getPlacementReason(context, bestCoupon.coupon),
      confidence: bestCoupon.score,
      alternativeCoupons: scoredCoupons.slice(1, 4).map(s => s.coupon)
    };
  }

  /**
   * 📊 Calculate coupon context score
   */
  private calculateCouponContextScore(coupon: CouponData, context: CouponPlacementContext): number {
    let score = 0;

    // Base priority score
    score += coupon.priority === 'HIGH' ? 40 : coupon.priority === 'MEDIUM' ? 25 : 10;

    // Context relevance
    if (coupon.triggerContexts.includes(this.mapContentTypeToTrigger(context.contentType))) {
      score += 30;
    }

    // Language support
    if (coupon.languages.includes(context.language)) {
      score += 20;
    } else {
      score -= 20; // Penalty for unsupported language
    }

    // Match importance relevance
    if (context.matchImportance && coupon.triggerConditions.matchImportance) {
      if (coupon.triggerConditions.matchImportance.includes(context.matchImportance)) {
        score += 15;
      }
    }

    // Time relevance
    const timeScore = this.calculateTimeRelevanceScore(coupon, context.timeContext);
    score += timeScore;

    // Performance history
    const performanceScore = this.calculatePerformanceScore(coupon);
    score += performanceScore;

    // Freshness (newer coupons get slight boost)
    const daysSinceCreated = (Date.now() - new Date(coupon.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreated < 7) score += 5;

    // Usage limits
    if (coupon.maxUsage && coupon.currentUsage >= coupon.maxUsage) {
      score = 0; // Expired usage
    }

    // Validity check
    if (new Date() > new Date(coupon.validUntil)) {
      score = 0; // Expired coupon
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * ⏰ Calculate time relevance score
   */
  private calculateTimeRelevanceScore(coupon: CouponData, timeContext: any): number {
    let score = 0;

    // Hour of day relevance
    if (coupon.triggerConditions.timeOfDay?.length) {
      const currentHourRange = this.getHourRange(timeContext.hour);
      if (coupon.triggerConditions.timeOfDay.includes(currentHourRange)) {
        score += 10;
      }
    }

    // Day of week relevance
    if (coupon.triggerConditions.dayOfWeek?.length) {
      if (coupon.triggerConditions.dayOfWeek.includes(timeContext.dayOfWeek)) {
        score += 10;
      }
    }

    // Weekend boost for certain coupon types
    if (timeContext.isWeekend && ['betting_bonus', 'odds_boost'].includes(coupon.type)) {
      score += 15;
    }

    return score;
  }

  /**
   * 📈 Calculate performance score
   */
  private calculatePerformanceScore(coupon: CouponData): number {
    if (coupon.impressions === 0) return 0; // No data yet

    const ctr = coupon.clicks / coupon.impressions;
    const conversionRate = coupon.conversions / coupon.clicks || 0;

    // Good CTR is above 3%, great is above 5%
    let ctrScore = 0;
    if (ctr > 0.05) ctrScore = 15;
    else if (ctr > 0.03) ctrScore = 10;
    else if (ctr > 0.01) ctrScore = 5;

    // Good conversion rate is above 10%, great is above 20%
    let convScore = 0;
    if (conversionRate > 0.20) convScore = 10;
    else if (conversionRate > 0.10) convScore = 5;

    return ctrScore + convScore;
  }

  /**
   * 🎯 Determine if we should show coupon in this context
   */
  private shouldShowCouponInContext(context: CouponPlacementContext, bestScore: number): boolean {
    // Minimum score threshold
    if (bestScore < 30) return false;

    // Frequency control (don't show coupons too often)
    const shouldShowByFrequency = this.checkFrequencyControl(context);
    if (!shouldShowByFrequency) return false;

    // Content type specific rules
    const contentSpecificRules = this.checkContentSpecificRules(context);
    if (!contentSpecificRules) return false;

    return true;
  }

  /**
   * 🔄 Check frequency control
   */
  private checkFrequencyControl(context: CouponPlacementContext): boolean {
    // Don't show coupons in consecutive posts
    // In production, this would check recent coupon history for this channel
    // For now, using random probability based on content type
    
    const contentTypeFrequency = {
      'betting_tip': 0.7,    // Higher frequency after betting tips
      'analysis': 0.5,       // Medium frequency after analysis
      'news': 0.3,          // Lower frequency after news
      'live_update': 0.2,    // Low frequency during live updates
      'poll': 0.4           // Medium frequency after polls
    };

    const threshold = contentTypeFrequency[context.contentType as keyof typeof contentTypeFrequency] || 0.3;
    return Math.random() < threshold;
  }

  /**
   * 📋 Check content-specific rules
   */
  private checkContentSpecificRules(context: CouponPlacementContext): boolean {
    // Don't show coupons during live updates unless it's a goal
    if (context.contentType === 'live_update') {
      // Could check if it's a goal update or important event
      return false;
    }

    // Show betting coupons more often after betting content
    if (context.contentType === 'betting_tip') {
      return true;
    }

    // Show analysis-related offers after analysis
    if (context.contentType === 'analysis') {
      return true;
    }

    return true;
  }

  /**
   * 📝 Step 2: Generate contextual coupon content
   */
  private async generateContextualCouponContent(coupon: CouponData, context: CouponPlacementContext): Promise<{
    title: string;
    content: string;
    callToAction: string;
    urgencyText?: string;
  }> {
    const { language, contentType } = context;
    
    if (language === 'en') {
      const title = `🎫 ${coupon.title}`;
      
      let content = `💎 EXCLUSIVE OFFER\n\n`;
      content += `${coupon.offerText}\n\n`;
      
      // Add contextual introduction
      const contextIntro = this.getContextualIntroduction(contentType, coupon.type);
      if (contextIntro) {
        content += `${contextIntro}\n\n`;
      }
      
      content += `🏷️ ${coupon.description}\n\n`;
      
      // Add coupon details
      if (coupon.couponCode) {
        content += `🔑 Code: ${coupon.couponCode}\n`;
      }
      
      if (coupon.discountPercentage) {
        content += `💰 ${coupon.discountPercentage}% OFF\n`;
      }
      
      if (coupon.discountAmount) {
        content += `💰 $${coupon.discountAmount} OFF\n`;
      }
      
      if (coupon.minSpend) {
        content += `📊 Min spend: $${coupon.minSpend}\n`;
      }
      
      content += `⏰ Valid until: ${new Date(coupon.validUntil).toLocaleDateString()}\n\n`;
      
      // Brand info
      content += `🏪 Partner: ${coupon.brandName}\n`;
      
      // Terms
      if (coupon.termsUrl) {
        content += `📜 Terms & Conditions apply\n`;
      }
      
      const callToAction = this.generateCallToAction(coupon, language);
      const urgencyText = this.generateUrgencyText(coupon, language);
      
      return {
        title,
        content,
        callToAction,
        urgencyText
      };
    }
    
    // Simplified for other languages
    return {
      title: `🎫 ${coupon.title}`,
      content: `${coupon.offerText}\n\nCode: ${coupon.couponCode || 'No code needed'}\nValid until: ${new Date(coupon.validUntil).toLocaleDateString()}`,
      callToAction: 'Claim offer!',
      urgencyText: 'Limited time!'
    };
  }

  /**
   * 🎭 Get contextual introduction
   */
  private getContextualIntroduction(contentType: string, couponType: CouponType): string {
    const introductions = {
      'betting_tip': {
        'betting_bonus': 'Ready to back your predictions? Get extra value with this exclusive bonus!',
        'odds_boost': 'Boost your betting potential with enhanced odds on today\'s matches!',
        'free_bet': 'Turn your analysis into action with this free bet opportunity!',
        'risk_free': 'Bet with confidence - your first bet is on us if it doesn\'t win!'
      },
      'analysis': {
        'betting_bonus': 'Put your match analysis to the test with this betting bonus!',
        'odds_boost': 'Leverage your football knowledge with boosted odds!',
        'free_bet': 'Your analysis deserves a free bet - claim yours now!'
      },
      'news': {
        'betting_bonus': 'Stay informed and bet smart with this exclusive bonus!',
        'merchandise': 'Show your team pride with exclusive merchandise deals!'
      },
      'poll': {
        'betting_bonus': 'From poll predictions to real bets - get your bonus!',
        'free_bet': 'Voted in our poll? Here\'s a free bet to back your choice!'
      }
    };

    return introductions[contentType as keyof typeof introductions]?.[couponType] || 
           'Don\'t miss this exclusive opportunity!';
  }

  /**
   * 📢 Generate call to action
   */
  private generateCallToAction(coupon: CouponData, language: 'en' | 'am' | 'sw'): string {
    const callToActions = {
      en: {
        'betting_bonus': '🚀 Claim Your Bonus Now!',
        'odds_boost': '⚡ Get Boosted Odds!',
        'free_bet': '🎁 Claim Free Bet!',
        'cashback': '💰 Get Cashback!',
        'merchandise': '🛒 Shop Now!',
        'streaming': '📺 Start Watching!',
        'default': '🎯 Claim Offer Now!'
      },
      am: {
        'default': 'አሁን ይቀበሉ!'
      },
      sw: {
        'default': 'Pokea sasa!'
      }
    };

    return callToActions[language]?.[coupon.type] || 
           callToActions[language]?.['default'] || 
           '🎯 Claim Now!';
  }

  /**
   * ⏰ Generate urgency text
   */
  private generateUrgencyText(coupon: CouponData, language: 'en' | 'am' | 'sw'): string | undefined {
    const daysUntilExpiry = Math.ceil(
      (new Date(coupon.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry <= 1) {
      return language === 'en' ? '⚡ Expires today!' : '⚡ Ends soon!';
    } else if (daysUntilExpiry <= 3) {
      return language === 'en' ? `⏰ Only ${daysUntilExpiry} days left!` : '⏰ Ending soon!';
    } else if (daysUntilExpiry <= 7) {
      return language === 'en' ? '🔥 Limited time offer!' : '🔥 Limited time!';
    }

    return undefined;
  }

  /**
   * 🖼️ Generate coupon image
   */
  private async generateCouponImage(coupon: CouponData): Promise<string | undefined> {
    const prompt = `Professional promotional coupon design for ${coupon.brandName}.
    ${coupon.title} promotion with ${coupon.offerText}, modern coupon aesthetic,
    promotional graphics, discount badge design, brand colors ${coupon.brandColors.primary},
    call-to-action elements, professional marketing design, high quality digital art.`;

    try {
      const imageBuffer = await aiImageGenerator.generateImage(prompt);
      if (!imageBuffer) return undefined;

      const fileName = `coupon_${Date.now()}.png`;
      const { data, error } = await supabase.storage
        .from('content-images')
        .upload(fileName, imageBuffer, {
          contentType: 'image/png',
          cacheControl: '3600'
        });

      if (error) {
        console.error(`❌ Error uploading coupon image:`, error);
        return undefined;
      }

      const { data: urlData } = supabase.storage
        .from('content-images')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error(`❌ Error generating coupon image:`, error);
      return undefined;
    }
  }

  /**
   * 🤖 AI edit coupon content
   */
  private async aiEditCouponContent(content: string, coupon: CouponData, context: CouponPlacementContext): Promise<string> {
    // Enhanced version with more engagement and context
    const enhanced = `${content}\n\n🔥 Don't miss out on this exclusive opportunity!\n\n#ExclusiveOffer #${coupon.brandName.replace(/\s+/g, '')} #Football #Promotion`;
    
    return enhanced;
  }

  /**
   * 📊 Track coupon impression
   */
  private async trackCouponImpression(couponId: string, context: CouponPlacementContext): Promise<void> {
    try {
      // Update coupon impressions
      const { error: updateError } = await supabase
        .from('coupons')
        .update({ 
          impressions: supabase.sql`impressions + 1`,
          updated_at: new Date().toISOString()
        })
        .eq('id', couponId);

      if (updateError) {
        console.error(`❌ Error updating coupon impressions:`, updateError);
      }

      // Track impression event
      const { error: trackError } = await supabase
        .from('coupon_events')
        .insert({
          coupon_id: couponId,
          event_type: 'impression',
          channel_id: context.channelId,
          content_type: context.contentType,
          language: context.language,
          created_at: new Date().toISOString()
        });

      if (trackError) {
        console.error(`❌ Error tracking coupon impression:`, trackError);
      }
    } catch (error) {
      console.error(`❌ Error in trackCouponImpression:`, error);
    }
  }

  /**
   * 📈 Calculate expected conversion
   */
  private calculateExpectedConversion(coupon: CouponData, context: CouponPlacementContext): number {
    let baseConversion = 5; // 5% base conversion rate

    // Adjust based on coupon type
    if (coupon.type === 'free_bet') baseConversion += 5;
    if (coupon.type === 'risk_free') baseConversion += 3;
    if (coupon.type === 'odds_boost') baseConversion += 2;

    // Adjust based on context
    if (context.contentType === 'betting_tip') baseConversion += 3;
    if (context.matchImportance === 'HIGH') baseConversion += 2;

    // Adjust based on performance history
    if (coupon.impressions > 0) {
      const historicalConversion = (coupon.conversions / coupon.impressions) * 100;
      baseConversion = (baseConversion + historicalConversion) / 2;
    }

    return Math.min(baseConversion, 25); // Cap at 25%
  }

  // Helper methods
  private mapContentTypeToTrigger(contentType: string): TriggerContext {
    const mapping: { [key: string]: TriggerContext } = {
      'betting_tip': 'after_betting_tips',
      'analysis': 'after_analysis',
      'news': 'after_news',
      'poll': 'after_polls',
      'live_update': 'after_goals'
    };

    return mapping[contentType] || 'manual';
  }

  private getHourRange(hour: number): string {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  private getPlacementReason(context: CouponPlacementContext, coupon: CouponData): string {
    const reasons = [];
    
    if (coupon.triggerContexts.includes(this.mapContentTypeToTrigger(context.contentType))) {
      reasons.push(`Targeted for ${context.contentType} content`);
    }
    
    if (coupon.priority === 'HIGH') {
      reasons.push('High priority promotion');
    }
    
    if (context.matchImportance === 'HIGH') {
      reasons.push('High importance match context');
    }

    return reasons.join(', ') || 'Contextually relevant offer';
  }

  /**
   * 📊 DATABASE OPERATIONS
   */

  /**
   * 💾 Create new coupon
   */
  async createCoupon(request: CouponCreateRequest, createdBy: string): Promise<CouponData | null> {
    try {
      const couponData: Partial<CouponData> = {
        id: `coupon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...request,
        validFrom: new Date().toISOString(),
        isActive: true,
        brandColors: {
          primary: '#007bff',
          secondary: '#6c757d'
        },
        currentUsage: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        triggerConditions: {
          afterContentTypes: request.triggerContexts.map(tc => this.mapTriggerToContentType(tc))
        },
        createdBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('coupons')
        .insert(couponData)
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating coupon:`, error);
        return null;
      }

      return data as CouponData;
    } catch (error) {
      console.error(`❌ Error in createCoupon:`, error);
      return null;
    }
  }

  /**
   * 📋 Get available coupons for context
   */
  private async getAvailableCoupons(context: CouponPlacementContext): Promise<CouponData[]> {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString())
        .contains('languages', [context.language]);

      if (error) {
        console.error(`❌ Error fetching available coupons:`, error);
        return [];
      }

      return data as CouponData[];
    } catch (error) {
      console.error(`❌ Error in getAvailableCoupons:`, error);
      return [];
    }
  }

  /**
   * 📊 Get coupon performance statistics
   */
  async getCouponPerformanceStats(): Promise<CouponPerformanceStats> {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error(`❌ Error fetching coupon stats:`, error);
        return this.getEmptyStats();
      }

      const coupons = data as CouponData[];
      
      const totalImpressions = coupons.reduce((sum, c) => sum + c.impressions, 0);
      const totalClicks = coupons.reduce((sum, c) => sum + c.clicks, 0);
      const totalConversions = coupons.reduce((sum, c) => sum + c.conversions, 0);

      return {
        totalImpressions,
        totalClicks,
        totalConversions,
        clickThroughRate: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
        conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
        topPerformingCoupons: coupons
          .sort((a, b) => (b.conversions / Math.max(b.impressions, 1)) - (a.conversions / Math.max(a.impressions, 1)))
          .slice(0, 5),
        contextualPerformance: {} // Would be calculated from coupon_events table
      };
    } catch (error) {
      console.error(`❌ Error in getCouponPerformanceStats:`, error);
      return this.getEmptyStats();
    }
  }

  /**
   * 🔄 Update coupon
   */
  async updateCoupon(couponId: string, updates: Partial<CouponData>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', couponId);

      if (error) {
        console.error(`❌ Error updating coupon:`, error);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`❌ Error in updateCoupon:`, error);
      return false;
    }
  }

  /**
   * 🗑️ Delete coupon
   */
  async deleteCoupon(couponId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: false })
        .eq('id', couponId);

      if (error) {
        console.error(`❌ Error deleting coupon:`, error);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`❌ Error in deleteCoupon:`, error);
      return false;
    }
  }

  /**
   * 📋 Get user's coupons
   */
  async getUserCoupons(userId: string): Promise<CouponData[]> {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(`❌ Error fetching user coupons:`, error);
        return [];
      }

      return data as CouponData[];
    } catch (error) {
      console.error(`❌ Error in getUserCoupons:`, error);
      return [];
    }
  }

  /**
   * 📊 Track coupon click
   */
  async trackCouponClick(couponId: string, context: CouponPlacementContext): Promise<void> {
    try {
      // Update coupon clicks
      await supabase
        .from('coupons')
        .update({ 
          clicks: supabase.sql`clicks + 1`,
          updated_at: new Date().toISOString()
        })
        .eq('id', couponId);

      // Track click event
      await supabase
        .from('coupon_events')
        .insert({
          coupon_id: couponId,
          event_type: 'click',
          channel_id: context.channelId,
          content_type: context.contentType,
          language: context.language,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error(`❌ Error in trackCouponClick:`, error);
    }
  }

  /**
   * 💰 Track coupon conversion
   */
  async trackCouponConversion(couponId: string, context: CouponPlacementContext): Promise<void> {
    try {
      // Update coupon conversions
      await supabase
        .from('coupons')
        .update({ 
          conversions: supabase.sql`conversions + 1`,
          current_usage: supabase.sql`current_usage + 1`,
          updated_at: new Date().toISOString()
        })
        .eq('id', couponId);

      // Track conversion event
      await supabase
        .from('coupon_events')
        .insert({
          coupon_id: couponId,
          event_type: 'conversion',
          channel_id: context.channelId,
          content_type: context.contentType,
          language: context.language,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error(`❌ Error in trackCouponConversion:`, error);
    }
  }

  // Helper methods
  private mapTriggerToContentType(trigger: TriggerContext): string {
    const mapping: { [key in TriggerContext]: string } = {
      'after_betting_tips': 'betting_tip',
      'after_analysis': 'analysis',
      'after_news': 'news',
      'after_polls': 'poll',
      'before_matches': 'preview',
      'after_goals': 'live_update',
      'weekend_specials': 'weekend',
      'manual': 'manual',
      'scheduled': 'scheduled'
    };

    return mapping[trigger];
  }

  private getEmptyStats(): CouponPerformanceStats {
    return {
      totalImpressions: 0,
      totalClicks: 0,
      totalConversions: 0,
      clickThroughRate: 0,
      conversionRate: 0,
      topPerformingCoupons: [],
      contextualPerformance: {}
    };
  }
}

// Export singleton instance
export const smartCouponsGenerator = new SmartCouponsGenerator();