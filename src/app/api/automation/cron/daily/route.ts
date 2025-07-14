import { NextRequest, NextResponse } from 'next/server';
import { RuleExecutor } from '@/lib/automation/rule-executor';

/**
 * 📅 Vercel Cron: Daily Scheduled Content
 * 
 * Runs 3 times daily: 9:00, 18:00, 23:00
 * Generates scheduled content like news, summaries, analysis
 */
export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const hour = now.getHours();
    
    console.log(`📅 Vercel Cron (Daily): Starting scheduled content at ${hour}:00...`);
    
    const executor = new RuleExecutor();
    let contentGenerated = 0;
    let executedRules: string[] = [];

    // Get scheduled rules
    const { supabase } = await import('@/lib/supabase');
    const { data: rules } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('enabled', true)
      .eq('automation_type', 'scheduled');

    for (const rule of rules || []) {
      try {
        // Check if rule should execute at this hour
        const shouldExecute = shouldRuleExecuteAtHour(rule, hour);
        
        if (shouldExecute) {
          console.log(`📅 Executing scheduled rule: ${rule.name} (${rule.content_type})`);
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

    // Force generate some content if none was created
    if (contentGenerated === 0) {
      console.log('🔄 No scheduled content found, generating general content...');
      
      try {
        // Generate news content
        const newsResult = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/unified-content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            content_type: 'news', 
            force_generate: true,
            cron_trigger: true 
          })
        });
        
        if (newsResult.ok) {
          contentGenerated++;
          executedRules.push('Force News Generation');
        }
      } catch (error) {
        console.error('❌ Error generating force content:', error);
      }
    }

    console.log(`✅ Daily Cron completed: ${contentGenerated} content items generated`);
    
    return NextResponse.json({
      success: true,
      type: 'daily-cron',
      hour,
      timestamp: new Date().toISOString(),
      contentGenerated,
      executedRules,
      message: `Generated ${contentGenerated} content items from ${executedRules.length} rules at ${hour}:00`
    });

  } catch (error) {
    console.error('❌ Daily Cron error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * Check if a scheduled rule should execute at this hour
 */
function shouldRuleExecuteAtHour(rule: any, hour: number): boolean {
  const config = rule.config || {};
  
  // Check if rule has specific times configured
  if (config.times && Array.isArray(config.times)) {
    return config.times.some((time: string) => {
      const ruleHour = parseInt(time.split(':')[0]);
      return ruleHour === hour;
    });
  }
  
  // Default scheduling based on content type
  switch (rule.content_type) {
    case 'news':
      return hour === 9 || hour === 18; // Morning and evening news
    case 'daily_summary':
      return hour === 23; // End of day summary
    case 'betting':
      return hour === 18; // Evening betting tips
    default:
      return hour === 9; // Default to morning
  }
} 