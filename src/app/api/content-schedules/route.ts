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
 * GET /api/content-schedules - Get all content schedules
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channel_id');

    let query = supabase
      .from('content_schedules')
      .select(`
        *,
        channels:channel_id (
          id,
          name,
          language,
          telegram_channel_id,
          is_active
        )
      `);

    if (channelId) {
      query = query.eq('channel_id', channelId);
    }

    const { data, error } = await query
      .order('day_of_week', { ascending: true })
      .order('hour', { ascending: true })
      .order('minute', { ascending: true });

    if (error) {
      console.error('❌ Error fetching content schedules:', error);
      return NextResponse.json(
        { error: 'Failed to fetch content schedules' },
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
 * POST /api/content-schedules - Create new content schedule
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const body = await request.json();

    const {
      channel_id,
      schedule_name,
      day_of_week,
      hour,
      minute,
      content_type,
      content_priority,
      timezone,
      delay_minutes_range
    } = body;

    // Validate required fields
    if (!channel_id || !content_type || hour === undefined || minute === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: channel_id, content_type, hour, minute' },
        { status: 400 }
      );
    }

    // Validate hour and minute ranges
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return NextResponse.json(
        { error: 'Invalid time: hour must be 0-23, minute must be 0-59' },
        { status: 400 }
      );
    }

    // Check for existing schedule with same time and channel
    const { data: existing, error: checkError } = await supabase
      .from('content_schedules')
      .select('id')
      .eq('channel_id', channel_id)
      .eq('day_of_week', day_of_week || null)
      .eq('hour', hour)
      .eq('minute', minute)
      .eq('content_type', content_type);

    if (checkError) {
      console.error('❌ Error checking existing schedules:', checkError);
      return NextResponse.json(
        { error: 'Failed to check existing schedules' },
        { status: 500 }
      );
    }

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'Schedule already exists for this channel at this time with this content type' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('content_schedules')
      .insert({
        channel_id,
        schedule_name: schedule_name || 'New Schedule',
        day_of_week: day_of_week || null,
        hour,
        minute,
        content_type,
        content_priority: content_priority || 5,
        timezone: timezone || 'UTC',
        delay_minutes_range: delay_minutes_range || [0, 30],
        is_active: true
      })
      .select(`
        *,
        channels:channel_id (
          id,
          name,
          language,
          telegram_channel_id,
          is_active
        )
      `)
      .single();

    if (error) {
      console.error('❌ Error creating content schedule:', error);
      return NextResponse.json(
        { error: 'Failed to create content schedule' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Content schedule created successfully'
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
 * PUT /api/content-schedules - Update content schedule
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      );
    }

    // Remove undefined values from updates
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    const { data, error } = await supabase
      .from('content_schedules')
      .update(cleanUpdates)
      .eq('id', id)
      .select(`
        *,
        channels:channel_id (
          id,
          name,
          language,
          telegram_channel_id,
          is_active
        )
      `)
      .single();

    if (error) {
      console.error('❌ Error updating content schedule:', error);
      return NextResponse.json(
        { error: 'Failed to update content schedule' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Content schedule updated successfully'
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
 * DELETE /api/content-schedules - Delete content schedule
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('content_schedules')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting content schedule:', error);
      return NextResponse.json(
        { error: 'Failed to delete content schedule' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Content schedule deleted successfully'
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 