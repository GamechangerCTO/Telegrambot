import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { smartContentScheduler } from '@/lib/automation/smart-content-scheduler';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * ⚡ SCHEDULE CONTENT API
 * Create content schedule for a specific match
 */

export async function POST(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const { matchId } = params;
    console.log(`⚡ Scheduling content for match ${matchId}...`);

    // Get match details
    const { data: match, error: matchError } = await supabase
      .from('daily_important_matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchError) {
      console.error('❌ Error fetching match:', matchError);
      return NextResponse.json({ 
        success: false, 
        error: 'Match not found',
        details: matchError.message 
      }, { status: 404 });
    }

    // Check if content is already scheduled
    const { data: existingSchedule, error: scheduleCheckError } = await supabase
      .from('dynamic_content_schedule')
      .select('id')
      .eq('match_id', matchId)
      .eq('status', 'pending');

    if (scheduleCheckError) {
      console.error('❌ Error checking existing schedule:', scheduleCheckError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to check existing schedule',
        details: scheduleCheckError.message 
      }, { status: 500 });
    }

    // Get active channels grouped by language
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select('id, language')
      .eq('is_active', true);

    if (channelsError) {
      console.error('❌ Error fetching channels:', channelsError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch channels',
        details: channelsError.message 
      }, { status: 500 });
    }

    if (!channels || channels.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No active channels found' 
      }, { status: 400 });
    }

    // Group channels by language
    const targetChannels: { [language: string]: string[] } = {};
    const languages: string[] = [];

    for (const channel of channels) {
      const lang = channel.language || 'en';
      if (!targetChannels[lang]) {
        targetChannels[lang] = [];
        languages.push(lang);
      }
      targetChannels[lang].push(channel.id);
    }

    // Parse request body for custom options
    const body = await req.json().catch(() => ({}));
    const { 
      force_reschedule = false,
      timing_template,
      custom_schedule 
    } = body;

    // If content already exists and not forcing reschedule
    if (existingSchedule && existingSchedule.length > 0 && !force_reschedule) {
      return NextResponse.json({
        success: false,
        error: 'Content already scheduled for this match',
        existing_items: existingSchedule.length,
        message: 'Use force_reschedule=true to override existing schedule'
      }, { status: 409 });
    }

    // Cancel existing schedule if rescheduling
    if (force_reschedule && existingSchedule && existingSchedule.length > 0) {
      await smartContentScheduler.cancelScheduleForMatch(matchId, 'Manual reschedule requested');
      console.log(`🗑️ Cancelled ${existingSchedule.length} existing schedule items`);
    }

    // Use SmartContentScheduler to create schedule
    const scheduleItems = await smartContentScheduler.scheduleContentForMatch({
      match: {
        ...match,
        id: matchId
      },
      languages,
      targetChannels,
      timingTemplate: timing_template
    });

    if (scheduleItems.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No content could be scheduled',
        match: {
          home_team: match.home_team,
          away_team: match.away_team,
          importance_score: match.importance_score
        }
      }, { status: 400 });
    }

    console.log(`✅ Successfully scheduled ${scheduleItems.length} content items for ${match.home_team} vs ${match.away_team}`);

    return NextResponse.json({
      success: true,
      message: `Content scheduled successfully for ${match.home_team} vs ${match.away_team}`,
      match: {
        id: match.id,
        home_team: match.home_team,
        away_team: match.away_team,
        competition: match.competition,
        kickoff_time: match.kickoff_time,
        importance_score: match.importance_score
      },
      schedule: {
        total_items: scheduleItems.length,
        languages: languages,
        channels_per_language: Object.fromEntries(
          Object.entries(targetChannels).map(([lang, channels]) => [lang, channels.length])
        ),
        content_types: [...new Set(scheduleItems.map(item => item.content_type))]
      },
      scheduled_items: scheduleItems.map(item => ({
        content_type: item.content_type,
        content_subtype: item.content_subtype,
        scheduled_for: item.scheduled_for,
        priority: item.priority,
        language: item.language,
        target_channels: item.target_channels.length
      }))
    });

  } catch (error) {
    console.error('❌ Schedule content API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 