import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

// Create service role client for admin operations (bypasses RLS)
const createServiceClient = () => {
  const supabaseUrl = 'https://ythsmnqclosoxiccchhh.supabase.co'
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0aHNtbnFjbG9zb3hpY2NjaGhoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE2NjMxOSwiZXhwIjoyMDY1NzQyMzE5fQ.WNEGkRDz0Ss_4QYUAI4VKhRWL0Q6o_dOJpYeYJ0qF50'
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * GET /api/channels/automation - Get automation settings for channels
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channel_id');

    let query = supabase
      .from('channel_automation_settings')
      .select(`
        *,
        channels:channel_id (
          id,
          name,
          language,
          is_active
        )
      `);

    if (channelId) {
      query = query.eq('channel_id', channelId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching automation settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch automation settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/channels/automation - Create automation settings for a channel
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const body = await request.json();

    const {
      channel_id,
      cron_schedule = '0 9,15,21 * * *',
      timezone = 'UTC',
      enabled_content_types = ['news', 'betting', 'analysis', 'live'],
      disabled_content_types = [],
      max_posts_per_day = 10,
      max_posts_per_hour = 3,
      min_interval_minutes = 30,
      min_content_quality = 7,
      auto_approve_high_quality = true,
      priority_level = 5,
      conditions = {},
      is_active = true
    } = body;

    // Validation
    if (!channel_id) {
      return NextResponse.json(
        { error: 'channel_id is required' },
        { status: 400 }
      );
    }

    // Verify channel exists
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .select('id, name')
      .eq('id', channel_id)
      .single();

    if (channelError || !channel) {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      );
    }

    // Create automation settings
    const { data, error } = await supabase
      .from('channel_automation_settings')
      .insert({
        channel_id,
        cron_schedule,
        timezone,
        enabled_content_types,
        disabled_content_types,
        max_posts_per_day,
        max_posts_per_hour,
        min_interval_minutes,
        min_content_quality,
        auto_approve_high_quality,
        priority_level,
        conditions,
        is_active
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating automation settings:', error);
      return NextResponse.json(
        { error: 'Failed to create automation settings' },
        { status: 500 }
      );
    }

    console.log(`✅ Created automation settings for channel: ${channel.name}`);

    return NextResponse.json({
      success: true,
      data,
      message: 'Automation settings created successfully'
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/channels/automation - Update automation settings for a channel
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const body = await request.json();

    const { channel_id, ...updateData } = body;

    if (!channel_id) {
      return NextResponse.json(
        { error: 'channel_id is required' },
        { status: 400 }
      );
    }

    // Update the automation settings
    const { data, error } = await supabase
      .from('channel_automation_settings')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('channel_id', channel_id)
      .select(`
        *,
        channels (
          id,
          name,
          language
        )
      `)
      .single();

    if (error) {
      console.error('❌ Error updating automation settings:', error);
      return NextResponse.json(
        { error: 'Failed to update automation settings' },
        { status: 500 }
      );
    }

    console.log(`✅ Updated automation settings for channel: ${data.channels?.name}`);

    return NextResponse.json({
      success: true,
      data,
      message: 'Automation settings updated successfully'
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/channels/automation - Delete automation settings for a channel
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channel_id');

    if (!channelId) {
      return NextResponse.json(
        { error: 'channel_id is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('channel_automation_settings')
      .delete()
      .eq('channel_id', channelId);

    if (error) {
      console.error('❌ Error deleting automation settings:', error);
      return NextResponse.json(
        { error: 'Failed to delete automation settings' },
        { status: 500 }
      );
    }

    console.log(`✅ Deleted automation settings for channel: ${channelId}`);

    return NextResponse.json({
      success: true,
      message: 'Automation settings deleted successfully'
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 