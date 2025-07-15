import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * 📋 MATCH SCHEDULE API
 * Get content schedule for a specific match
 */

export async function GET(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const { matchId } = params;
    console.log(`📋 Fetching content schedule for match ${matchId}...`);

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

    // Get schedule for this match
    const { data: schedule, error: scheduleError } = await supabase
      .from('dynamic_content_schedule')
      .select('*')
      .eq('match_id', matchId)
      .order('scheduled_for', { ascending: true });

    if (scheduleError) {
      console.error('❌ Error fetching schedule:', scheduleError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch schedule',
        details: scheduleError.message 
      }, { status: 500 });
    }

    // Group schedule by status
    const scheduleItems = schedule || [];
    const groupedSchedule = {
      pending: scheduleItems.filter(item => item.status === 'pending'),
      executing: scheduleItems.filter(item => item.status === 'executing'),
      completed: scheduleItems.filter(item => item.status === 'completed'),
      failed: scheduleItems.filter(item => item.status === 'failed'),
      cancelled: scheduleItems.filter(item => item.status === 'cancelled')
    };

    console.log(`✅ Found ${scheduleItems.length} scheduled items for match ${matchId}`);

    return NextResponse.json({
      success: true,
      match: {
        id: match.id,
        home_team: match.home_team,
        away_team: match.away_team,
        competition: match.competition,
        kickoff_time: match.kickoff_time,
        importance_score: match.importance_score,
        match_status: match.match_status
      },
      schedule: scheduleItems,
      grouped_schedule: groupedSchedule,
      statistics: {
        total: scheduleItems.length,
        pending: groupedSchedule.pending.length,
        executing: groupedSchedule.executing.length,
        completed: groupedSchedule.completed.length,
        failed: groupedSchedule.failed.length,
        cancelled: groupedSchedule.cancelled.length,
        success_rate: scheduleItems.length > 0 
          ? Math.round((groupedSchedule.completed.length / scheduleItems.length) * 100)
          : 0
      }
    });

  } catch (error) {
    console.error('❌ Match schedule API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 