import { NextRequest, NextResponse } from 'next/server';
import { FootballMatchScorer } from '@/lib/content/football-match-scorer';
import { UnifiedFootballService } from '@/lib/content/unified-football-service';

/**
 * 🔧 Force Fix Filtering - API עזר לתיקון בעיית הסינון
 * 
 * הAPI הזה בודק שהתיקון שביצענו למערכת הסינון באמת עובד
 * ומוצא משחקים עתידיים במקום לדחות הכל כ"too old"
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Testing fixed filtering logic...');
    
    const scorer = new FootballMatchScorer();
    const footballService = new UnifiedFootballService();
    
    // Get today's date for testing
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const todayString = today.toISOString().split('T')[0];
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    
    console.log(`📅 Testing with dates: ${todayString} and ${tomorrowString}`);
    
    // Try to get matches for today and tomorrow
    const todayMatches = await footballService.getMatchesByDate(todayString);
    const tomorrowMatches = await footballService.getMatchesByDate(tomorrowString);
    
    console.log(`📊 Found ${todayMatches.length} matches today, ${tomorrowMatches.length} matches tomorrow`);
    
    // Test the scorer with different content types
    const allMatches = [...todayMatches, ...tomorrowMatches];
    
    if (allMatches.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No matches found for testing',
        fixed: false,
        reason: 'No matches available in APIs'
      });
    }
    
    // Test betting tips (should find future matches)
    const bettingMatches = await scorer.getBestMatchesForContentType(allMatches, 'betting_tip', 10);
    
    // Test live updates (should find current/recent matches)
    const liveMatches = await scorer.getBestMatchesForContentType(allMatches, 'live_update', 10);
    
    // Test analysis (should find upcoming matches)
    const analysisMatches = await scorer.getBestMatchesForContentType(allMatches, 'analysis', 10);
    
    const results = {
      success: true,
      timestamp: new Date().toISOString(),
      test_results: {
        total_raw_matches: allMatches.length,
        betting_matches_found: bettingMatches.length,
        live_matches_found: liveMatches.length,
        analysis_matches_found: analysisMatches.length
      },
      filtering_fixed: (bettingMatches.length > 0 || liveMatches.length > 0 || analysisMatches.length > 0),
      sample_matches: allMatches.slice(0, 3).map(match => ({
        home: match.homeTeam?.name,
        away: match.awayTeam?.name,
        kickoff: match.kickoff,
        competition: match.competition?.name,
        hours_from_now: Math.round((new Date(match.kickoff).getTime() - today.getTime()) / (1000 * 60 * 60) * 10) / 10
      })),
      fixed_content_types: {
        betting_working: bettingMatches.length > 0,
        live_working: liveMatches.length > 0,
        analysis_working: analysisMatches.length > 0
      }
    };
    
    if (results.filtering_fixed) {
      console.log('✅ Filtering is FIXED! Found matches for content generation');
    } else {
      console.log('❌ Filtering still broken - no matches found');
    }
    
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('❌ Error testing filtering fix:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      filtering_fixed: false
    }, { status: 500 });
  }
} 