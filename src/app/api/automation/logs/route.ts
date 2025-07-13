import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Fetching automation activity logs...');

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const days = parseInt(searchParams.get('days') || '7');

    // Calculate date range
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Fetch automation logs with rule information
    const { data: logs, error } = await supabase
      .from('automation_logs')
      .select(`
        id,
        status,
        message,
        content_generated,
        execution_time_ms,
        created_at,
        automation_rules!inner (
          id,
          name,
          content_type,
          automation_type
        )
      `)
      .gte('created_at', fromDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Error fetching automation logs:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch automation logs',
        logs: []
      }, { status: 500 });
    }

    // Transform logs for UI
    const formattedLogs = (logs || []).map(log => ({
      id: log.id,
      timestamp: log.created_at,
      status: log.status,
      message: log.message || getDefaultMessage(log.status, log.automation_rules),
      contentGenerated: log.content_generated || 0,
      executionTime: log.execution_time_ms,
      rule: {
        id: log.automation_rules.id,
        name: log.automation_rules.name,
        contentType: log.automation_rules.content_type,
        automationType: log.automation_rules.automation_type
      }
    }));

    // Also fetch recent generated content for additional activity
    const { data: recentContent, error: contentError } = await supabase
      .from('generated_content')
      .select('id, content_type, title, created_at, channel_id, language')
      .gte('created_at', fromDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    if (contentError) {
      console.error('❌ Error fetching recent content:', contentError);
    }

    const contentActivity = (recentContent || []).map(content => ({
      id: content.id,
      timestamp: content.created_at,
      status: 'content_generated',
      message: `Generated ${content.content_type} content: "${content.title || 'Untitled'}"`,
      contentType: content.content_type,
      language: content.language,
      channelId: content.channel_id
    }));

    // Combine and sort all activity
    const allActivity = [
      ...formattedLogs.map(log => ({ ...log, type: 'automation_log' })),
      ...contentActivity.map(activity => ({ ...activity, type: 'content_generated' }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    console.log(`✅ Found ${allActivity.length} activity entries`);
    return NextResponse.json({
      success: true,
      logs: allActivity.slice(0, limit),
      summary: {
        totalLogs: allActivity.length,
        successfulRuns: formattedLogs.filter(log => log.status === 'success').length,
        failedRuns: formattedLogs.filter(log => log.status === 'error').length,
        contentGenerated: contentActivity.length,
        dateRange: {
          from: fromDate.toISOString(),
          to: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching automation logs:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch automation logs',
      logs: []
    }, { status: 500 });
  }
}

// POST - Add new automation log entry
export async function POST(request: NextRequest) {
  try {
    console.log('📝 Adding new automation log entry...');
    
    const body = await request.json();
    const { 
      automation_rule_id, 
      status, 
      message, 
      content_generated = 0, 
      execution_time_ms,
      error_details 
    } = body;

    // Validate required fields
    if (!automation_rule_id || !status) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: automation_rule_id, status' 
      }, { status: 400 });
    }

    // Create log entry
    const { data: log, error } = await supabase
      .from('automation_logs')
      .insert([{
        automation_rule_id,
        status,
        message,
        content_generated,
        execution_time_ms,
        error_details,
        organization_id: 'default'
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating automation log:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create automation log' 
      }, { status: 500 });
    }

    console.log('✅ Automation log entry created successfully');
    return NextResponse.json({
      success: true,
      message: 'Automation log entry created successfully',
      log
    });

  } catch (error) {
    console.error('❌ Error creating automation log:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Helper function to generate default messages
function getDefaultMessage(status: string, rule: any): string {
  const contentTypeEmojis: Record<string, string> = {
    live: '🔴',
    betting: '🎯',
    news: '📰',
    analysis: '📈',
    polls: '📊',
    coupons: '🎫'
  };

  const emoji = contentTypeEmojis[rule.content_type] || '⚙️';
  
  switch (status) {
    case 'success':
      return `${emoji} Successfully executed ${rule.name}`;
    case 'error':
      return `❌ Error executing ${rule.name}`;
    case 'skipped':
      return `⏭️ Skipped ${rule.name} - conditions not met`;
    default:
      return `${emoji} ${rule.name} completed with status: ${status}`;
  }
}