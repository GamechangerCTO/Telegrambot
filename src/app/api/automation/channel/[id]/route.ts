import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const channelId = params.id;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';

    switch (type) {
      case 'rules':
        return await getChannelRules(channelId);
      case 'executions': 
        return await getChannelExecutions(channelId);
      case 'cron':
        return await getChannelCronStatus(channelId);
      case 'manual-posts':
        return await getManualPosts(channelId);
      case 'overview':
      default:
        return await getChannelAutomationOverview(channelId);
    }
  } catch (error) {
    console.error('Error in channel automation API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const channelId = params.id;
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create-manual-post':
        return await createManualPost(channelId, data);
      case 'execute-rule':
        return await executeChannelRule(channelId, data.ruleId);
      case 'toggle-automation':
        return await toggleChannelAutomation(channelId, data.enabled);
      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action' 
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in channel automation POST:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Get channel automation overview with today's timeline
async function getChannelAutomationOverview(channelId: string) {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  // Get channel info
  const { data: channel } = await supabase
    .from('channels')
    .select('*, bots(*)')
    .eq('id', channelId)
    .single();

  // Get automation rules for this channel
  const { data: rules } = await supabase
    .from('automation_rules')
    .select('*')
    .or(`channels.cs.{"${channelId}"},channels.is.null,channels.eq.[]`)
    .eq('enabled', true);

  // Get today's executions
  const { data: executions } = await supabase
    .from('automation_logs')
    .select('*')
    .gte('created_at', todayStart.toISOString())
    .lt('created_at', todayEnd.toISOString())
    .order('created_at', { ascending: false });

  // Get manual posts for today
  const { data: manualPosts } = await supabase
    .from('manual_posts')
    .select('*')
    .eq('channel_id', channelId)
    .gte('scheduled_time', todayStart.toISOString())
    .lt('scheduled_time', todayEnd.toISOString())
    .order('scheduled_time', { ascending: true });

  // Generate timeline data for today
  const timeline = generateDailyTimeline(rules || [], executions || [], manualPosts || []);

  // Calculate summary stats
  const stats = {
    scheduled: timeline.filter(item => item.status === 'pending').length,
    executed: timeline.filter(item => item.status === 'executed').length,
    failed: timeline.filter(item => item.status === 'failed').length,
    manual: manualPosts?.length || 0
  };

  return NextResponse.json({
    success: true,
    data: {
      channel,
      stats,
      timeline,
      rules: rules || [],
      executions: executions || [],
      manualPosts: manualPosts || []
    }
  });
}

// Get automation rules for specific channel
async function getChannelRules(channelId: string) {
  const { data: rules, error } = await supabase
    .from('automation_rules')
    .select('*')
    .or(`channels.cs.{"${channelId}"},channels.is.null,channels.eq.[]`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return NextResponse.json({
    success: true,
    data: rules || []
  });
}

// Get execution logs for channel
async function getChannelExecutions(channelId: string) {
  const { data: executions, error } = await supabase
    .from('automation_logs')
    .select(`
      *,
      automation_rules(name, content_type)
    `)
    .eq('channel_id', channelId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;

  return NextResponse.json({
    success: true,
    data: executions || []
  });
}

// Get cron status for channel
async function getChannelCronStatus(channelId: string) {
  // This would integrate with background scheduler
  const { backgroundScheduler } = await import('@/lib/automation/background-scheduler');
  const stats = await backgroundScheduler.getStats();

  return NextResponse.json({
    success: true,
    data: {
      isRunning: stats.isRunning,
      lastExecution: stats.lastExecutions?.[0]?.lastExecuted,
      totalExecutions: stats.totalRulesExecuted,
      liveUpdates: stats.liveUpdates
    }
  });
}

// Get manual posts for channel
async function getManualPosts(channelId: string) {
  const { data: posts, error } = await supabase
    .from('manual_posts')
    .select('*')
    .eq('channel_id', channelId)
    .order('scheduled_time', { ascending: false })
    .limit(20);

  if (error) throw error;

  return NextResponse.json({
    success: true,
    data: posts || []
  });
}

// Create manual post
async function createManualPost(channelId: string, data: any) {
  const { content, scheduled_time, post_type, link_url, recurrence } = data;

  const postData = {
    channel_id: channelId,
    content,
    scheduled_time: new Date(scheduled_time).toISOString(),
    post_type: post_type || 'custom',
    link_url,
    recurrence: recurrence || 'once',
    status: 'scheduled',
    created_at: new Date().toISOString()
  };

  const { data: newPost, error } = await supabase
    .from('manual_posts')
    .insert(postData)
    .select()
    .single();

  if (error) throw error;

  return NextResponse.json({
    success: true,
    data: newPost,
    message: 'Manual post scheduled successfully'
  });
}

// Execute specific rule for channel
async function executeChannelRule(channelId: string, ruleId: string) {
  const { RuleExecutor } = await import('@/lib/automation/rule-executor');
  const executor = new RuleExecutor();
  
  const result = await executor.executeRule(ruleId);
  
  return NextResponse.json({
    success: result.success,
    data: result,
    message: result.success ? 'Rule executed successfully' : 'Rule execution failed'
  });
}

// Toggle automation for channel
async function toggleChannelAutomation(channelId: string, enabled: boolean) {
  const { data: channel, error } = await supabase
    .from('channels')
    .update({ auto_post_enabled: enabled })
    .eq('id', channelId)
    .select()
    .single();

  if (error) throw error;

  return NextResponse.json({
    success: true,
    data: channel,
    message: `Automation ${enabled ? 'enabled' : 'disabled'} successfully`
  });
}

// Generate daily timeline combining rules and executions
function generateDailyTimeline(rules: any[], executions: any[], manualPosts: any[]) {
  const timeline: any[] = [];
  const today = new Date();

  // Add scheduled rules to timeline
  rules.forEach(rule => {
    if (rule.schedule?.times) {
      rule.schedule.times.forEach((time: string) => {
        const [hour, minute] = time.split(':').map(Number);
        const scheduledTime = new Date(today);
        scheduledTime.setHours(hour, minute, 0, 0);

        // Check if this rule was executed
        const execution = executions.find(ex => 
          ex.automation_rule_id === rule.id &&
          new Date(ex.created_at).getHours() === hour
        );

        timeline.push({
          id: `rule-${rule.id}-${time}`,
          type: 'automated',
          time: scheduledTime.toISOString(),
          content_type: rule.content_type,
          rule_name: rule.name,
          status: execution ? (execution.status === 'success' ? 'executed' : 'failed') : 'pending',
          source: 'automation',
          execution_id: execution?.id
        });
      });
    }
  });

  // Add manual posts to timeline
  manualPosts.forEach(post => {
    timeline.push({
      id: `manual-${post.id}`,
      type: 'manual',
      time: post.scheduled_time,
      content_type: post.post_type,
      content: post.content,
      status: post.status,
      source: 'manual',
      link_url: post.link_url
    });
  });

  // Sort by time
  timeline.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  return timeline;
}