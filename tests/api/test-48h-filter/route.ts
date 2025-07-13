import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Import the football match scorer to test the new 48-hour filter
    const { FootballMatchScorer } = await import('../../../lib/content/football-match-scorer');
    
    console.log('🧪 Testing 48-hour filter for polls and daily summaries');
    
    const scorer = new FootballMatchScorer();
    
    // Create test matches with different time stamps
    const now = new Date();
    const formattedMatches = [
      {
        id: 'test_0',
        homeTeam: { id: 'team_a', name: 'Test Team A' },
        awayTeam: { id: 'team_b', name: 'Test Team B' },
        kickoff: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
        competition: { name: 'Test League' },
        status: 'FINISHED'
      },
      {
        id: 'test_1',
        homeTeam: { id: 'team_c', name: 'Test Team C' },
        awayTeam: { id: 'team_d', name: 'Test Team D' },
        kickoff: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 24 hours ago
        competition: { name: 'Test League' },
        status: 'FINISHED'
      },
      {
        id: 'test_2',
        homeTeam: { id: 'team_e', name: 'Test Team E' },
        awayTeam: { id: 'team_f', name: 'Test Team F' },
        kickoff: new Date(now.getTime() - 36 * 60 * 60 * 1000), // 36 hours ago
        competition: { name: 'Test League' },
        status: 'FINISHED'
      },
      {
        id: 'test_3',
        homeTeam: { id: 'team_g', name: 'Test Team G' },
        awayTeam: { id: 'team_h', name: 'Test Team H' },
        kickoff: new Date(now.getTime() - 50 * 60 * 60 * 1000), // 50 hours ago (should be filtered out)
        competition: { name: 'Test League' },
        status: 'FINISHED'
      }
    ] as any[];
    
    // Test poll filter (should include up to 48 hours)
    const pollMatches = await scorer.scoreMatches(formattedMatches, {
      content_type: 'poll'
    });
    
    // Test daily summary filter (should include up to 48 hours)
    const dailySummaryMatches = await scorer.scoreMatches(formattedMatches, {
      content_type: 'daily_summary'
    });
    
    // Test betting filter (should not include past matches)
    const bettingMatches = await scorer.scoreMatches(formattedMatches, {
      content_type: 'betting_tip'
    });
    
    return NextResponse.json({
      success: true,
      message: '🧪 48-hour filter test completed',
             test_results: {
         total_test_matches: formattedMatches.length,
         poll_results: {
           matches_found: pollMatches.length,
           expected: 3, // Should include 6h, 24h, 36h ago but NOT 50h ago
           matches: pollMatches.map((m: any) => ({
             match: `${m.homeTeam.name} vs ${m.awayTeam.name}`,
             hours_ago: Math.round((now.getTime() - m.kickoff.getTime()) / (1000 * 60 * 60)),
             score: m.relevance_score?.total || 0
           }))
         },
         daily_summary_results: {
           matches_found: dailySummaryMatches.length,
           expected: 3, // Should include 6h, 24h, 36h ago but NOT 50h ago
           matches: dailySummaryMatches.map((m: any) => ({
             match: `${m.homeTeam.name} vs ${m.awayTeam.name}`,
             hours_ago: Math.round((now.getTime() - m.kickoff.getTime()) / (1000 * 60 * 60)),
             score: m.relevance_score?.total || 0
           }))
         },
         betting_results: {
           matches_found: bettingMatches.length,
           expected: 0, // Should include NO past matches
           matches: bettingMatches.map((m: any) => ({
             match: `${m.homeTeam.name} vs ${m.awayTeam.name}`,
             hours_ago: Math.round((now.getTime() - m.kickoff.getTime()) / (1000 * 60 * 60)),
             score: m.relevance_score?.total || 0
           }))
         }
       },
      filter_status: {
        poll_filter_48h: pollMatches.length === 3 ? '✅ WORKING' : '❌ FAILED',
        daily_summary_filter_48h: dailySummaryMatches.length === 3 ? '✅ WORKING' : '❌ FAILED',
        betting_filter_no_past: bettingMatches.length === 0 ? '✅ WORKING' : '❌ FAILED'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({
    message: 'Use GET method to test the 48-hour filter'
  });
} 