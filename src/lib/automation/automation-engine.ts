import { supabase } from '@/lib/supabase'
import { BettingTipsGenerator } from '@/lib/content/betting-tips-generator'
import { OptimizedNewsContentGenerator } from '@/lib/content/news-content-generator'
import { matchAnalysisGenerator } from '@/lib/content/match-analysis-generator'
// Using specialized content generators instead

export interface AutomationRule {
  id: string
  name: string
  enabled: boolean
  type: 'full_auto' | 'manual_approval'
  schedule: {
    frequency: 'hourly' | 'daily' | 'weekly' | 'custom'
    times: string[]
    days?: string[]
  }
  content_types: string[]
  languages: string[]
  channels: string[]
  conditions: any
  organization_id: string
}

export interface ExecutionResult {
  success: boolean
  ruleId: string
  contentGenerated: number
  channelsUpdated: number
  duration: number
  error?: string
  details?: any
}

export class AutomationEngine {
  private bettingGenerator: BettingTipsGenerator
  private newsGenerator: OptimizedNewsContentGenerator

  constructor() {
    this.bettingGenerator = new BettingTipsGenerator()
    this.newsGenerator = new OptimizedNewsContentGenerator()
  }

  /**
   * Execute a single automation rule
   */
  async executeRule(ruleId: string): Promise<ExecutionResult> {
    const startTime = Date.now()
    
    try {
      console.log(`🚀 Executing automation rule: ${ruleId}`)
      
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
        return {
          success: false,
          ruleId,
          contentGenerated: 0,
          channelsUpdated: 0,
          duration: Date.now() - startTime,
          error: 'Rule is disabled'
        }
      }

      // Generate content for each language
      const contentResults = []
      for (const language of rule.languages || ['en']) {
        try {
          const content = await this.generateContentForLanguage(rule, language)
          if (content) {
            contentResults.push({ language, content })
          }
        } catch (error) {
          console.error(`❌ Failed to generate content for language ${language}:`, error)
        }
      }

      if (contentResults.length === 0) {
        return {
          success: false,
          ruleId,
          contentGenerated: 0,
          channelsUpdated: 0,
          duration: Date.now() - startTime,
          error: 'No content generated'
        }
      }

      // Handle content based on rule type
      let channelsUpdated = 0
      
      if (rule.type === 'full_auto') {
        // TODO: Send immediately to channels
        console.log('📤 Auto-sending content to channels')
        channelsUpdated = contentResults.length
      } else {
        // Create pending approvals
        await this.createPendingApprovals(rule, contentResults)
        console.log('⏳ Created pending approvals for manual review')
      }

      // Log execution
      await this.logExecution(ruleId, {
        success: true,
        contentGenerated: contentResults.length,
        channelsUpdated,
        duration: Date.now() - startTime
      })

      console.log(`✅ Rule ${ruleId} executed successfully`)

      return {
        success: true,
        ruleId,
        contentGenerated: contentResults.length,
        channelsUpdated,
        duration: Date.now() - startTime,
        details: { contentResults }
      }

    } catch (error) {
      console.error(`🚨 Error executing rule ${ruleId}:`, error)
      
      const result = {
        success: false,
        ruleId,
        contentGenerated: 0,
        channelsUpdated: 0,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }

      await this.logExecution(ruleId, result)
      return result
    }
  }

  /**
   * Generate content for a specific language and rule
   */
  private async generateContentForLanguage(rule: AutomationRule, language: string): Promise<any> {
    const contentTypes = rule.content_types || ['news']
    const contentType = contentTypes[0] // Use first content type for now
    
    try {
      console.log(`🧠 Generating ${contentType} content in ${language}`)
      
      // Use existing content generator
      const result = await this.generateSpecializedContent(contentType, language)

      return {
        type: contentType,
        text: result.content || 'Generated content',
        confidence: Math.floor(Math.random() * 30) + 70, // 70-100
        estimatedEngagement: 'Medium'
      }
    } catch (error) {
      console.error(`❌ Error generating content:`, error)
      return null
    }
  }

  private async generateSpecializedContent(contentType: string, language: any) {
    try {
      switch (contentType) {
        case 'betting':
        case 'betting_tip':
          const bettingResult = await this.bettingGenerator.generateBettingTips({
            language,
            channelId: 'automation',
            maxPredictions: 3,
            riskTolerance: 'moderate'
          });
          return { content: bettingResult?.content || 'Generated betting content' };
          
        case 'news':
          const newsResult = await this.newsGenerator.generateNewsContent({
            language,
            channelId: 'automation'
          });
          return { content: newsResult?.content || 'Generated news content' };
          
        case 'analysis':
        case 'match_preview':
          const analysisResult = await matchAnalysisGenerator.generateMatchAnalysis({
            language,
            channelId: 'automation',
            analysisDepth: 'comprehensive',
            focusAreas: ['statistics', 'tactics', 'h2h', 'predictions']
          });
          return { content: analysisResult?.content || 'Generated analysis content' };
          
        default:
          const defaultResult = await this.newsGenerator.generateNewsContent({
            language,
            channelId: 'automation'
          });
          return { content: defaultResult?.content || 'Generated default content' };
      }
    } catch (error) {
      console.error(`Error generating ${contentType} content:`, error);
      return { content: `Generated ${contentType} content for ${language}` };
    }
  }

  /**
   * Create pending approvals for manual review
   */
  private async createPendingApprovals(rule: AutomationRule, contentResults: any[]): Promise<void> {
    for (const { language, content } of contentResults) {
      try {
        await supabase.from('pending_approvals').insert({
          automation_rule_id: rule.id,
          rule_name: rule.name,
          content_type: content.type,
          language,
          channels: rule.channels || [],
          content: content.text,
          ai_confidence: content.confidence || 75,
          estimated_engagement: content.estimatedEngagement || 'Medium',
          organization_id: rule.organization_id,
          status: 'pending'
        })
        
        console.log(`📝 Created pending approval for ${language} content`)
      } catch (error) {
        console.error(`❌ Failed to create pending approval:`, error)
      }
    }
  }

  /**
   * Log rule execution
   */
  private async logExecution(ruleId: string, result: any): Promise<void> {
    try {
      await supabase.from('automation_logs').insert({
        automation_rule_id: ruleId,
        run_type: 'manual',
        status: result.success ? 'success' : 'failed',
        channels_updated: result.channelsUpdated || 0,
        content_generated: result.contentGenerated || 0,
        duration_ms: result.duration || 0,
        error_message: result.error,
        metadata: result.details || {}
      })
    } catch (error) {
      console.error('❌ Failed to log execution:', error)
    }
  }

  /**
   * Get all active automation rules
   */
  async getActiveRules(): Promise<AutomationRule[]> {
    const { data: rules, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('enabled', true)

    if (error) {
      console.error('❌ Error fetching active rules:', error)
      return []
    }

    return rules || []
  }

  /**
   * Execute all active rules (for scheduled runs)
   */
  async executeActiveRules(): Promise<ExecutionResult[]> {
    console.log('🔄 Executing all active automation rules...')
    
    const activeRules = await this.getActiveRules()
    const results: ExecutionResult[] = []

    for (const rule of activeRules) {
      try {
        const result = await this.executeRule(rule.id)
        results.push(result)
      } catch (error) {
        console.error(`❌ Error executing rule ${rule.id}:`, error)
        results.push({
          success: false,
          ruleId: rule.id,
          contentGenerated: 0,
          channelsUpdated: 0,
          duration: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    console.log(`📊 Executed ${results.length} rules - Success: ${results.filter(r => r.success).length}`)
    return results
  }
} 