/**
 * 🚨 URGENT CONTENT CRON - Free Vercel Plan (Hobby)
 * Runs ONCE per day at 9:00 AM - handles time-sensitive content
 * 
 * ⏰ Triggered: Daily at 9:00 AM
 * 🎯 Content: Live updates, Betting tips, Analysis for today's matches
 */

import { NextResponse } from 'next/server';
import { RuleExecutor } from '@/lib/automation/rule-executor';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET() {
  try {
    console.log(`🚨 URGENT CRON: Starting urgent content generation at ${new Date().toISOString()}`);
    
    const executor = new RuleExecutor();
    const results = [];
    let totalContentGenerated = 0;

    // Get urgent/high priority rules
    const { supabase } = await import('@/lib/supabase');
    const { data: urgentRules } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('enabled', true)
      .in('content_type', ['live_update', 'betting_tip', 'analysis'])
      .order('priority', { ascending: false });

    console.log(`🔍 Found ${urgentRules?.length || 0} urgent automation rules`);

    // Execute each urgent rule
    for (const rule of urgentRules || []) {
      try {
        console.log(`🚨 Executing urgent rule: ${rule.name} (${rule.content_type})`);
        const result = await executor.executeRule(rule.id);
        
        if (result.success) {
          totalContentGenerated += result.contentGenerated || 0;
          results.push({
            rule_name: rule.name,
            content_type: rule.content_type,
            success: true,
            content_generated: result.contentGenerated,
            duration: result.duration
          });
        } else {
          results.push({
            rule_name: rule.name,
            content_type: rule.content_type,
            success: false,
            error: result.error,
            duration: result.duration
          });
        }
      } catch (error) {
        console.error(`❌ Error executing rule ${rule.name}:`, error);
        results.push({
          rule_name: rule.name,
          content_type: rule.content_type,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: 0
        });
      }
    }

    // If no content was generated, at least try one betting rule manually
    if (totalContentGenerated === 0) {
      console.log('🔄 No urgent content generated, checking for any betting rules...');
      
      // Get any betting rule and execute it
      const { data: bettingRules } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('enabled', true)
        .eq('content_type', 'betting_tip')
        .limit(1);
      
      if (bettingRules?.length > 0) {
        try {
          const fallbackResult = await executor.executeRule(bettingRules[0].id);
          if (fallbackResult.success) {
            totalContentGenerated += fallbackResult.contentGenerated || 0;
            results.push({
              rule_name: bettingRules[0].name + ' (Fallback)',
              content_type: 'betting_tip',
              success: true,
              content_generated: fallbackResult.contentGenerated,
              duration: fallbackResult.duration,
              is_fallback: true
            });
          }
        } catch (fallbackError) {
          console.error('❌ Fallback execution failed:', fallbackError);
        }
      }
    }
    
    console.log(`✅ URGENT CRON: Completed at ${new Date().toISOString()}`);
    console.log(`📊 Total content generated: ${totalContentGenerated}`);
    
    return NextResponse.json({
      success: true,
      message: 'Urgent content generation completed',
      timestamp: new Date().toISOString(),
      total_content_generated: totalContentGenerated,
      results: results,
      summary: {
        total_rules_attempted: results.length,
        successful_rules: results.filter(r => r.success).length,
        failed_rules: results.filter(r => !r.success).length,
        total_content_items: totalContentGenerated
      }
    });
    
  } catch (error) {
    console.error('❌ URGENT CRON: Fatal error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 