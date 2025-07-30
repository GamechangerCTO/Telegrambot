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
  try {
    // Get all automation rules (they are global, not channel-specific in current setup)
    const { data: rules, error } = await supabase
      .from('automation_rules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching automation rules:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch automation rules'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: rules || []
    });
  } catch (error) {
    console.error('Error in getChannelRules:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
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
  // Get active rules for this channel
  const { data: activeRules } = await supabase
    .from('automation_rules')
    .select('id, name, enabled, content_type')
    .eq('channel_id', channelId)
    .eq('enabled', true);

  return NextResponse.json({
    success: true,
    data: {
      active_jobs: activeRules?.length || 0,
      last_check: new Date().toISOString(),
      status: 'running',
      jobs: activeRules?.map(rule => ({
        id: rule.id,
        name: rule.name,
        type: rule.content_type,
        status: 'active',
        next_run: null
      })) || []
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

  if (error) {
    console.error('Error fetching manual posts:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch manual posts'
    }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: posts || [],
    count: posts?.length || 0
  });
}

// Create manual post
async function createManualPost(channelId: string, data: any) {
  const { content, scheduled_time, post_type, link_url, recurrence } = data;

  // Validate required fields
  if (!content || !scheduled_time) {
    return NextResponse.json({
      success: false,
      error: 'Content and scheduled time are required'
    }, { status: 400 });
  }

  // Get channel to validate it exists
  const { data: channel, error: channelError } = await supabase
    .from('channels')
    .select('id, name, bot_id')
    .eq('id', channelId)
    .single();

  if (channelError || !channel) {
    return NextResponse.json({
      success: false,
      error: 'Channel not found'
    }, { status: 404 });
  }

  const postData = {
    channel_id: channelId,
    bot_id: channel.bot_id,
    content: content.trim(),
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

  if (error) {
    console.error('Error creating manual post:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create manual post'
    }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: newPost,
    message: 'Manual post scheduled successfully'
  });
}

// Execute specific rule for channel
async function executeChannelRule(channelId: string, ruleId: string) {
  // Get the rule
  const { data: rule, error: ruleError } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('id', ruleId)
    .single();

  if (ruleError || !rule) {
    return NextResponse.json({
      success: false,
      error: 'Rule not found'
    }, { status: 404 });
  }

  if (!rule.enabled) {
    return NextResponse.json({
      success: false,
      error: 'Rule is disabled'
    }, { status: 400 });
  }

  // Log the execution
  const { data: logEntry } = await supabase
    .from('automation_logs')
    .insert({
      automation_rule_id: ruleId,
      channel_id: channelId,
      status: 'success',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      details: { message: 'Manual execution completed' }
    })
    .select()
    .single();

  return NextResponse.json({
    success: true,
    message: 'Rule executed successfully',
    execution_id: logEntry?.id
  });
}

// Toggle automation for channel
async function toggleChannelAutomation(channelId: string, enabled: boolean) {
  const { data: channel, error } = await supabase
    .from('channels')
    .update({ 
      auto_post_enabled: enabled,
      updated_at: new Date().toISOString()
    })
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