import { NextRequest, NextResponse } from 'next/server';
import { RuleExecutor } from '@/lib/automation/rule-executor';

/**
 * 🔗 Automation Webhook
 * 
 * This can be called by external services to trigger automation
 * Useful for:
 * - External cron services (cron-job.org, etc.)
 * - Manual triggers
 * - Testing automation
 */
export async function POST(request: NextRequest) {
  try {
    const { trigger_type, content_types, force_generate } = await request.json();
    
    console.log(`🔗 Webhook triggered: ${trigger_type}`);
    
    const executor = new RuleExecutor();
    let contentGenerated = 0;
    let executedRules: string[] = [];

    // Get automation rules
    const { supabase } = await import('@/lib/supabase');
    const { data: rules } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('enabled', true);

    if (!rules || rules.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No active automation rules found'
      }, { status: 404 });
    }

    // Filter rules by content type if specified
    const filteredRules = content_types 
      ? rules.filter(rule => content_types.includes(rule.content_type))
      : rules;

    // Execute rules based on trigger type
    for (const rule of filteredRules) {
      try {
        let shouldExecute = false;

        switch (trigger_type) {
          case 'manual':
            shouldExecute = true;
            break;
          case 'hourly':
            shouldExecute = rule.automation_type === 'event_driven' || 
                          rule.automation_type === 'context_aware';
            break;
          case 'daily':
            shouldExecute = rule.automation_type === 'scheduled';
            break;
          case 'live':
            shouldExecute = rule.content_type === 'live' || 
                          rule.automation_type === 'continuous';
            break;
          case 'betting':
            shouldExecute = rule.content_type === 'betting';
            break;
          case 'news':
            shouldExecute = rule.content_type === 'news';
            break;
          default:
            shouldExecute = force_generate === true;
        }

        if (shouldExecute) {
          console.log(`🔗 Webhook executing: ${rule.name} (${rule.content_type})`);
          const result = await executor.executeRule(rule.id);
          
          if (result.success) {
            contentGenerated += result.contentGenerated;
            executedRules.push(rule.name);
          }
        }
      } catch (error) {
        console.error(`❌ Webhook error executing rule ${rule.name}:`, error);
      }
    }

    // Force generate specific content if no rules matched
    if (contentGenerated === 0 && force_generate) {
      console.log('🔄 Force generating content via API...');
      
      const contentType = content_types?.[0] || 'news';
      
      try {
        const contentResult = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/unified-content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            content_type: contentType, 
            force_generate: true,
            webhook_trigger: true 
          })
        });
        
        if (contentResult.ok) {
          contentGenerated++;
          executedRules.push(`Force ${contentType} Generation`);
        }
      } catch (error) {
        console.error('❌ Error in force generation:', error);
      }
    }

    console.log(`✅ Webhook completed: ${contentGenerated} content items generated`);
    
    return NextResponse.json({
      success: true,
      type: 'webhook',
      trigger_type,
      timestamp: new Date().toISOString(),
      contentGenerated,
      executedRules,
      message: `Webhook generated ${contentGenerated} content items from ${executedRules.length} rules`
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * GET endpoint for webhook health check
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    status: 'healthy',
    webhook_ready: true,
    timestamp: new Date().toISOString(),
    usage: {
      manual: 'POST with trigger_type: "manual"',
      hourly: 'POST with trigger_type: "hourly"', 
      daily: 'POST with trigger_type: "daily"',
      live: 'POST with trigger_type: "live"',
      betting: 'POST with trigger_type: "betting"',
      news: 'POST with trigger_type: "news"',
      force: 'POST with force_generate: true'
    }
  });
} 