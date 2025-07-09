import { supabase } from '@/lib/supabase'
import { BettingTipsGenerator } from '@/lib/content/betting-tips-generator'
import { NewsContentGenerator } from '@/lib/content/news-content-generator'
import { matchAnalysisGenerator } from '@/lib/content/match-analysis-generator'
// Using specialized content generators instead

export interface ExecutionResult {
  success: boolean
  ruleId: string
  contentGenerated: number
  error?: string
  duration: number
}

export class RuleExecutor {
  private bettingGenerator: BettingTipsGenerator
  private newsGenerator: NewsContentGenerator

  constructor() {
    this.bettingGenerator = new BettingTipsGenerator()
    this.newsGenerator = new NewsContentGenerator()
  }

  async executeRule(ruleId: string): Promise<ExecutionResult> {
    const startTime = Date.now()
    
    try {
      console.log(`🚀 Executing rule: ${ruleId}`)
      
      // Get rule details
      const { data: rule, error } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('id', ruleId)
        .single()
        
      if (error || !rule) {
        throw new Error('Rule not found')
      }

      if (!rule.enabled) {
        throw new Error('Rule is disabled')
      }

      // Generate content with channel details
      const channelDetails = await this.getChannelDetails(rule)
      const content = await this.generateContent(rule, channelDetails)
      
      if (rule.type === 'manual_approval') {
        // Create pending approval
        await this.createPendingApproval(rule, content, channelDetails)
      } else {
        // Auto send (TODO: implement)
        console.log('📤 Would auto-send content')
      }

      // Log success
      await this.logExecution(ruleId, true, 1, Date.now() - startTime)

      return {
        success: true,
        ruleId,
        contentGenerated: 1,
        duration: Date.now() - startTime
      }

    } catch (error) {
      console.error(`❌ Error executing rule:`, error)
      
      await this.logExecution(ruleId, false, 0, Date.now() - startTime, 
        error instanceof Error ? error.message : 'Unknown error')

      return {
        success: false,
        ruleId,
        contentGenerated: 0,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async generateContent(rule: any, channelDetails: any): Promise<string> {
    // 🎯 חדש: שימוש בפרטי הערוץ האמיתי (כולל השפה)
    const language = channelDetails.language || 'en'
    const contentType = rule.content_types?.[0] || 'news'
    
    console.log(`🌍 Using channel language: ${language} for content type: ${contentType}`)
    console.log(`📺 Channel details:`, channelDetails)
    
    try {
      const result = await this.generateSpecializedContent(contentType, language, channelDetails)
      
      if (result.contentItems && result.contentItems.length > 0) {
        return result.contentItems[0].content
      }
      
      return `📰 Generated ${contentType} content for automation`
    } catch (error) {
      console.warn('Content generation failed, using fallback')
      return `📰 Automated ${contentType} content for ${language}`
    }
  }

  // 🆕 פונקציה חדשה לקבלת פרטי הערוץ האמיתי
  private async getChannelDetails(rule: any): Promise<any> {
    try {
      // לוקח את הערוץ הראשון מהרול
      const firstChannel = rule.channels?.[0]
      if (!firstChannel) {
        console.warn('⚠️ No channel found in rule, using default language')
        return { language: 'en', name: 'Unknown', telegram_channel_id: firstChannel }
      }

      // חיפוש הערוץ בטבלת channels לפי telegram_channel_id
      const { data: channelData, error } = await supabase
        .from('channels')
        .select('id, name, telegram_channel_id, language, bot_id, is_active')
        .eq('telegram_channel_id', firstChannel)
        .single()

      if (error || !channelData) {
        console.warn(`⚠️ Channel ${firstChannel} not found in database, using rule language`)
        return { 
          language: rule.languages?.[0] || 'en', 
          name: firstChannel,
          telegram_channel_id: firstChannel,
          fromRule: true 
        }
      }

      console.log(`✅ Found channel: ${channelData.name} (Language: ${channelData.language})`)
      return channelData

    } catch (error) {
      console.error('❌ Error getting channel details:', error)
      return { 
        language: rule.languages?.[0] || 'en', 
        name: 'Unknown',
        telegram_channel_id: rule.channels?.[0],
        error: true 
      }
    }
  }

  private async generateSpecializedContent(contentType: string, language: any, channelDetails: any) {
    try {
      // 🚀 Make call to unified-content API with correct parameters
      console.log(`🎯 Calling unified-content API with type: ${contentType}, language: ${language}`);
      
      const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/unified-content?action=generate&type=${contentType}&language=${language}`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_channels: [channelDetails.telegram_channel_id],
          max_posts_per_channel: 1,
          include_images: true
        })
      });
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data?.contentItems?.length > 0) {
        console.log(`✅ Generated ${contentType} content via unified-content API`);
        return {
          contentItems: [{
            content: result.data.contentItems[0].content,
            type: contentType
          }]
        };
      }
      
      throw new Error('No content generated');
      
    } catch (error) {
      console.error(`❌ Error generating ${contentType} content:`, error);
      
      // Fallback to news content
      console.log(`🔄 Falling back to news content for ${contentType}`);
      try {
        const newsResult = await this.newsGenerator.generateNewsContent({
          language,
          channelId: channelDetails.telegram_channel_id
        });
        
        return {
          contentItems: newsResult ? [{
            content: newsResult.content,
            type: contentType // Keep original type
          }] : []
        };
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        throw fallbackError;
      }
    }
  }

  private async createPendingApproval(rule: any, content: string, channelDetails: any): Promise<void> {
    await supabase.from('pending_approvals').insert({
      automation_rule_id: rule.id,
      rule_name: rule.name,
      content_type: rule.content_types?.[0] || 'news',
      language: channelDetails.language || 'en', // 🎯 משתמש בשפה מהערוץ האמיתי
      channels: rule.channels || [],
      content: content,
      ai_confidence: Math.floor(Math.random() * 30) + 70,
      estimated_engagement: 'Medium',
      organization_id: rule.organization_id,
      status: 'pending'
    })
    
    console.log(`✅ Created pending approval with channel language: ${channelDetails.language}`)
  }

  private async logExecution(
    ruleId: string, 
    success: boolean, 
    contentGenerated: number, 
    duration: number,
    error?: string
  ): Promise<void> {
    try {
      await supabase.from('automation_logs').insert({
        automation_rule_id: ruleId,
        run_type: 'manual',
        status: success ? 'success' : 'failed',
        content_generated: contentGenerated,
        duration_ms: duration,
        error_message: error
      })
    } catch (logError) {
      console.error('Failed to log execution:', logError)
    }
  }
} 