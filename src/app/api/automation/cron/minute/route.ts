import { NextRequest, NextResponse } from 'next/server';
import { RuleExecutor } from '@/lib/automation/rule-executor';

/**
 * 🕐 Vercel Cron: Every Minute Check
 * 
 * This runs every minute via Vercel Cron Jobs
 * Checks for live matches and immediate content opportunities
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🕐 Vercel Cron (Every Minute): Starting live content check...');
    
    // Verify this is called by Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes('Bearer')) {
      console.log('⚠️ Unauthorized cron call - accepting for development');
      // In development, allow without auth
    }

    const executor = new RuleExecutor();
    let contentGenerated = 0;
    let executedRules: string[] = [];

    // Get live/event-driven rules that should run frequently
    const { supabase } = await import('@/lib/supabase');
    const { data: rules } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('enabled', true)
      .in('automation_type', ['continuous', 'event_driven']);

    for (const rule of rules || []) {
      try {
        // Check if rule should execute now
        const shouldExecute = await shouldRuleExecuteNow(rule);
        
        if (shouldExecute) {
          console.log(`⚡ Executing rule: ${rule.name} (${rule.content_type})`);
          const result = await executor.executeRule(rule.id);
          
          if (result.success) {
            contentGenerated += result.contentGenerated;
            executedRules.push(rule.name);
          }
        }
      } catch (error) {
        console.error(`❌ Error executing rule ${rule.name}:`, error);
      }
    }

    console.log(`✅ Minute Cron completed: ${contentGenerated} content items generated`);
    
    return NextResponse.json({
      success: true,
      type: 'minute-cron',
      timestamp: new Date().toISOString(),
      contentGenerated,
      executedRules,
      message: `Generated ${contentGenerated} content items from ${executedRules.length} rules`
    });

  } catch (error) {
    console.error('❌ Minute Cron error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * Check if a rule should execute now based on its type and timing
 */
async function shouldRuleExecuteNow(rule: any): Promise<boolean> {
  const now = new Date();
  
  // For live content - check if there are ongoing matches
  if (rule.content_type === 'live') {
    return true; // Always check for live content
  }
  
  // For event-driven content - check based on timing config
  if (rule.automation_type === 'event_driven') {
    return true; // Check for upcoming matches
  }
  
  // For continuous content - run every few minutes
  if (rule.automation_type === 'continuous') {
    return Math.random() > 0.8; // 20% chance each minute = ~every 5 minutes
  }
  
  return false;
} 