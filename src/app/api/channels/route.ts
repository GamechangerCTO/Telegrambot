import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Fetch active channels with their bot information
    const { data: channels, error } = await supabase
      .from('channels')
      .select(`
        id,
        name,
        telegram_channel_id,
        telegram_channel_username,
        language,
        is_active,
        member_count,
        total_posts_sent,
        last_post_at,
        content_types,
        selected_leagues,
        selected_teams,
        bots (
          id,
          name,
          telegram_bot_username,
          is_active,
          language_code
        )
      `)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('❌ Error fetching channels:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch channels' 
      }, { status: 500 });
    }

    // Process and enhance channel data
    const processedChannels = channels?.map(channel => {
      const bot = Array.isArray(channel.bots) ? channel.bots[0] : channel.bots;
      return {
        ...channel,
        bot_name: bot?.name || 'Unknown Bot',
        bot_username: bot?.telegram_bot_username || '',
        bot_active: bot?.is_active || false,
        bot_language: bot?.language_code || 'en',
        display_name: channel.name || channel.telegram_channel_username,
        language_display: (channel.language || 'en').toUpperCase(),
        status: channel.is_active && (bot?.is_active || false) ? 'Active' : 'Inactive'
      };
    }) || [];

    // Get statistics
    const activeChannels = processedChannels.filter(c => c.is_active && c.bot_active);
    const languages = [...new Set(activeChannels.map(c => c.language))];
    const totalMembers = activeChannels.reduce((sum, c) => sum + (c.member_count || 0), 0);

    return NextResponse.json({
      success: true,
      channels: processedChannels,
      statistics: {
        total: processedChannels.length,
        active: activeChannels.length,
        languages: languages,
        totalMembers: totalMembers,
        byLanguage: languages.map(lang => ({
          language: lang,
          count: activeChannels.filter(c => c.language === lang).length,
          channels: activeChannels.filter(c => c.language === lang).map(c => c.name)
        }))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Channels API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Create new channel
    const { data: channel, error } = await supabase
      .from('channels')
      .insert({
        bot_id: body.bot_id,
        name: body.name,
        telegram_channel_id: body.telegram_channel_id,
        telegram_channel_username: body.telegram_channel_username,
        language: body.language || 'en',
        description: body.description,
        is_active: body.is_active || true,
        content_types: body.content_types || {},
        selected_leagues: body.selected_leagues || {},
        selected_teams: body.selected_teams || {}
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating channel:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create channel' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      channel: channel,
      message: 'Channel created successfully'
    });

  } catch (error) {
    console.error('❌ Channel creation error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 