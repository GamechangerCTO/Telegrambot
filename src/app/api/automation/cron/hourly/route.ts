import { NextRequest, NextResponse } from 'next/server';
import { RuleExecutor } from '@/lib/automation/rule-executor';

/**
 * ⏰ Vercel Cron: Hourly Check
 * 
 * Runs every hour for medium-priority content
 * Handles betting tips, analysis, and match preparation
 */
export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const hour = now.getHours();
    
    console.log(`⏰ Vercel Cron (Hourly): Starting hourly check at ${hour}:00...`);
    
    const executor = new RuleExecutor();
    let contentGenerated = 0;
    let executedRules: string[] = [];

    // Get rules that should run hourly
    const { supabase } = await import('@/lib/supabase');
    const { data: rules } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('enabled', true);

    for (const rule of rules || []) {
      try {
        // Check if rule should execute this hour
        const shouldExecute = shouldRuleExecuteThisHour(rule, hour);
        
        if (shouldExecute) {
          console.log(`⏰ Executing hourly rule: ${rule.name} (${rule.content_type})`);
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

    // Additional hourly tasks
    if (hour % 4 === 0) { // Every 4 hours
      console.log('🔄 Running 4-hour maintenance tasks...');
      
      try {
        // Generate analysis content
        const analysisResult = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/unified-content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            content_type: 'analysis', 
            force_generate: true,
            cron_trigger: true 
          })
        });
        
        if (analysisResult.ok) {
          contentGenerated++;
          executedRules.push('4-Hour Analysis Generation');
        }
      } catch (error) {
        console.error('❌ Error in 4-hour maintenance:', error);
      }
    }

    console.log(`✅ Hourly Cron completed: ${contentGenerated} content items generated`);
    
    return NextResponse.json({
      success: true,
      type: 'hourly-cron',
      hour,
      timestamp: new Date().toISOString(),
      contentGenerated,
      executedRules,
      message: `Generated ${contentGenerated} content items from ${executedRules.length} rules at ${hour}:00`
    });

  } catch (error) {
    console.error('❌ Hourly Cron error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * Check if a rule should execute this hour
 */
function shouldRuleExecuteThisHour(rule: any, hour: number): boolean {
  // Context-aware rules (smart coupons) - run occasionally
  if (rule.automation_type === 'context_aware') {
    return hour % 6 === 0; // Every 6 hours
  }
  
  // Event-driven rules - check for upcoming matches
  if (rule.automation_type === 'event_driven') {
    // Pre-match content - run during peak hours
    if (rule.content_type === 'betting' || rule.content_type === 'analysis') {
      return hour >= 8 && hour <= 22 && hour % 3 === 0; // Every 3 hours during peak
    }
    
    // Live content - more frequent during match hours
    if (rule.content_type === 'live') {
      return hour >= 12 && hour <= 23; // Afternoon and evening
    }
  }
  
  // Polls - run before peak match times
  if (rule.content_type === 'polls') {
    return hour === 15 || hour === 19; // 3 PM and 7 PM
  }
  
  return false;
} 