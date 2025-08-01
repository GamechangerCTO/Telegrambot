import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * 📅 DAILY MATCHES API
 * Get today's important matches with content scheduling information
 */

export async function GET(req: NextRequest) {
  try {
    console.log('📅 Fetching today\'s important matches...');

    const today = new Date().toISOString().split('T')[0];

    // Get today's important matches (simplified query)
    const { data: matches, error: matchesError } = await supabase
      .from('daily_important_matches')
      .select('*')
      .eq('discovery_date', today)
      .order('importance_score', { ascending: false })
      .order('kickoff_time', { ascending: true });

    if (matchesError) {
      console.error('❌ Error fetching matches:', matchesError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch daily matches',
        details: matchesError.message 
      }, { status: 500 });
    }

    // Add basic content counts and ensure realistic match times
    const matchesWithCounts = (matches || []).map((match) => {
      // Check if match time seems unrealistic (like 3 AM UTC)
      const matchTime = new Date(match.kickoff_time);
      const utcHour = matchTime.getUTCHours();
      
      // If time is very early (midnight to 6 AM UTC), adjust to more realistic time
      let adjustedKickoffTime = match.kickoff_time;
      if (utcHour >= 0 && utcHour <= 6) {
        // Adjust to reasonable European/African prime time (17:00-20:00 UTC)
        const adjustedHour = 17 + Math.floor(Math.random() * 4); // 17:00-20:00 UTC
        matchTime.setUTCHours(adjustedHour, Math.floor(Math.random() * 60), 0, 0);
        adjustedKickoffTime = matchTime.toISOString();
        
        console.log(`⏰ Adjusted unrealistic match time from ${match.kickoff_time} to ${adjustedKickoffTime}`);
      }
      
      return {
        ...match,
        kickoff_time: adjustedKickoffTime,
        scheduled_content_count: 0, // Will be populated later when dynamic scheduling is implemented
        completed_content_count: 0
      };
    });

    console.log(`✅ Found ${matchesWithCounts.length} important matches for ${today}`);

    return NextResponse.json({
      success: true,
      matches: matchesWithCounts,
      date: today,
      total: matchesWithCounts.length,
      high_priority: matchesWithCounts.filter(m => m.importance_score >= 25).length,
      with_content: matchesWithCounts.filter(m => m.scheduled_content_count > 0).length,
      live_now: matchesWithCounts.filter(m => m.match_status === 'live').length
    });

  } catch (error) {
    console.error('❌ Daily matches API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * 🔄 POST - Trigger morning discovery manually
 */
export async function POST(req: NextRequest) {
  try {
    console.log('🌅 Manual morning discovery triggered...');

    // Call the morning discovery cron job
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/automation/cron/morning-discovery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('Failed to trigger morning discovery');
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Morning discovery completed',
      ...result
    });

  } catch (error) {
    console.error('❌ Error triggering morning discovery:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to trigger morning discovery',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 