/**
 * 🤖 Individual Bot API Route
 * Handles bot operations: GET, PUT, DELETE
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/bots/[id] - Get specific bot
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    
    // Get authenticated user from middleware
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Get manager record
    const { data: manager, error: managerError } = await supabase
      .from('managers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (managerError || !manager) {
      console.error('Manager not found:', managerError);
      return NextResponse.json(
        { error: 'Manager record not found' },
        { status: 403 }
      );
    }

    const botId = params.id;

    // Get bot with authorization check
    let query = supabase
      .from('bots')
      .select(`
        *,
        channels (
          id,
          name,
          telegram_channel_id,
          language,
          is_active
        )
      `)
      .eq('id', botId);

    // Super admins can access all bots, managers only their own
    if (manager.role !== 'super_admin') {
      query = query.eq('manager_id', manager.id);
    }

    const { data: bot, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Bot not found or access denied' },
          { status: 404 }
        );
      }
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bot' },
        { status: 500 }
      );
    }

    return NextResponse.json(bot);

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/bots/[id] - Update bot
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    
    // Get authenticated user from middleware
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Get manager record
    const { data: manager, error: managerError } = await supabase
      .from('managers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (managerError || !manager) {
      console.error('Manager not found:', managerError);
      return NextResponse.json(
        { error: 'Manager record not found' },
        { status: 403 }
      );
    }

    const botId = params.id;
    const updates = await request.json();

    // Validate required fields
    if (!updates.name || !updates.token) {
      return NextResponse.json(
        { error: 'Name and token are required' },
        { status: 400 }
      );
    }

    // Check if bot exists and user has permission
    const { data: existingBot, error: fetchError } = await supabase
      .from('bots')
      .select('*')
      .eq('id', botId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Bot not found' },
          { status: 404 }
        );
      }
      console.error('Database error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch bot' },
        { status: 500 }
      );
    }

    // Authorization check
    if (manager.role !== 'super_admin' && existingBot.manager_id !== manager.id) {
      return NextResponse.json(
        { error: 'Access denied - You can only update your own bots' },
        { status: 403 }
      );
    }

    // Update bot
    const { data: updatedBot, error: updateError } = await supabase
      .from('bots')
      .update({
        name: updates.name,
        token: updates.token,
        description: updates.description || null,
        is_active: updates.is_active ?? true,
        updated_at: new Date().toISOString()
      })
      .eq('id', botId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update bot' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedBot);

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/bots/[id] - Delete bot
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    
    // Get authenticated user from middleware
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Get manager record
    const { data: manager, error: managerError } = await supabase
      .from('managers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (managerError || !manager) {
      console.error('Manager not found:', managerError);
      return NextResponse.json(
        { error: 'Manager record not found' },
        { status: 403 }
      );
    }

    const botId = params.id;

    // Check if bot exists and get its data
    const { data: bot, error: fetchError } = await supabase
      .from('bots')
      .select('*')
      .eq('id', botId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Bot not found' },
          { status: 404 }
        );
      }
      console.error('Database error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch bot' },
        { status: 500 }
      );
    }

    // Authorization check
    if (manager.role !== 'super_admin' && bot.manager_id !== manager.id) {
      return NextResponse.json(
        { error: 'Access denied - You can only delete your own bots' },
        { status: 403 }
      );
    }

    // Delete associated channels first (cascade should handle this, but explicit is better)
    const { error: channelsDeleteError } = await supabase
      .from('channels')
      .delete()
      .eq('bot_id', botId);

    if (channelsDeleteError) {
      console.error('Error deleting channels:', channelsDeleteError);
      // Continue with bot deletion as cascade should handle this
    }

    // Delete the bot
    const { error: deleteError } = await supabase
      .from('bots')
      .delete()
      .eq('id', botId);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete bot' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Bot deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 