import { NextRequest, NextResponse } from 'next/server';
import { FootballMatchScorer } from '@/lib/content/football-match-scorer';
import { UnifiedFootballService } from '@/lib/content/unified-football-service';

/**
 * 📅 Upcoming Week Matches API
 * 
 * Fetches all matches for the next 7 days with automation scheduling info
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📅 Fetching upcoming matches for next week...');
    
    const now = new Date();
    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    
    const footballService = new UnifiedFootballService();
    const scorer = new FootballMatchScorer();
    
    // Get matches for next 7 days
    const allMatches: any[] = [];
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const dateString = currentDate.toISOString().split('T')[0];
      try {
        const dayMatches = await footballService.getMatchesByDate(dateString);
        allMatches.push(...dayMatches);
      } catch (error) {
        console.log(`⚠️ Could not fetch matches for ${dateString}:`, error);
      }
    }
    
    console.log(`📊 Found ${allMatches.length} matches in next 7 days`);
    
    // Score matches for different content types
    const bettingMatches = await scorer.getBestMatchesForContentType(allMatches, 'betting_tip', 50);
    const analysisMatches = await scorer.getBestMatchesForContentType(allMatches, 'analysis', 50);
    const liveMatches = await scorer.getBestMatchesForContentType(allMatches, 'live_update', 50);
    
    // Create a map for quick score lookup
    const scoreMap = new Map();
    bettingMatches.forEach((m: any) => {
      const key = `${m.homeTeam.name}-${m.awayTeam.name}`;
      scoreMap.set(key, { ...scoreMap.get(key) || {}, betting: m.relevance_score.total });
    });
    analysisMatches.forEach((m: any) => {
      const key = `${m.homeTeam.name}-${m.awayTeam.name}`;
      scoreMap.set(key, { ...scoreMap.get(key) || {}, analysis: m.relevance_score.total });
    });
    liveMatches.forEach((m: any) => {
      const key = `${m.homeTeam.name}-${m.awayTeam.name}`;
      scoreMap.set(key, { ...scoreMap.get(key) || {}, live: m.relevance_score.total });
    });
    
    // Add scoring and automation info to each match
    const matchesWithInfo = allMatches.map((match: any) => {
      try {
        const matchDate = new Date(match.kickoff);
        const hoursFromNow = (matchDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        // Get scores from map
        const matchKey = `${match.homeTeam.name}-${match.awayTeam.name}`;
        const scores = scoreMap.get(matchKey) || { betting: 0, analysis: 0, live: 0 };
        const bettingScore = scores.betting || 0;
        const analysisScore = scores.analysis || 0;
        const liveScore = scores.live || 0;
        
        // Determine content scheduling
        const scheduledContent: any[] = [];
        
        // Betting tips: 2-6 hours before match
        if (hoursFromNow >= 2 && hoursFromNow <= 48 && bettingScore >= 5) {
          const bettingTime = new Date(matchDate.getTime() - 3 * 60 * 60 * 1000); // 3 hours before
          scheduledContent.push({
            type: 'betting_tip',
            emoji: '🎯',
            scheduled_time: bettingTime.toISOString(),
            score: bettingScore,
            priority: bettingScore >= 8 ? 'high' : bettingScore >= 6 ? 'medium' : 'low'
          });
        }
        
        // Analysis: 30-90 minutes before match
        if (hoursFromNow >= 0.5 && hoursFromNow <= 24 && analysisScore >= 6) {
          const analysisTime = new Date(matchDate.getTime() - 60 * 60 * 1000); // 1 hour before
          scheduledContent.push({
            type: 'analysis',
            emoji: '📈',
            scheduled_time: analysisTime.toISOString(),
            score: analysisScore,
            priority: analysisScore >= 8 ? 'high' : analysisScore >= 6 ? 'medium' : 'low'
          });
        }
        
        // Live updates: during match
        if (hoursFromNow >= -3 && hoursFromNow <= 3 && liveScore >= 4) {
          scheduledContent.push({
            type: 'live_update',
            emoji: '🔴',
            scheduled_time: matchDate.toISOString(),
            score: liveScore,
            priority: liveScore >= 7 ? 'high' : liveScore >= 5 ? 'medium' : 'low'
          });
        }
        
        return {
          ...match,
          kickoff_local: matchDate.toLocaleString('he-IL', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          hours_from_now: Math.round(hoursFromNow * 10) / 10,
          scores: {
            betting: bettingScore,
            analysis: analysisScore,
            live: liveScore,
            overall: Math.max(bettingScore, analysisScore, liveScore)
          },
          scheduled_content: scheduledContent,
          automation_eligible: scheduledContent.length > 0
        };
      } catch (error) {
        console.error(`❌ Error processing match ${match.homeTeam?.name} vs ${match.awayTeam?.name}:`, error);
        return {
          ...match,
          error: 'Failed to process match data'
        };
      }
    });
    
    // Sort by kickoff time
    matchesWithInfo.sort((a: any, b: any) => 
      new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
    );
    
    // Group by day
    const matchesByDay: any = {};
    matchesWithInfo.forEach((match: any) => {
      const day = new Date(match.kickoff).toISOString().split('T')[0];
      if (!matchesByDay[day]) {
        matchesByDay[day] = [];
      }
      matchesByDay[day].push(match);
    });
    
    // Calculate statistics
    const stats = {
      total_matches: matchesWithInfo.length,
      matches_with_automation: matchesWithInfo.filter((m: any) => m.automation_eligible).length,
      content_scheduled: matchesWithInfo.reduce((sum: number, m: any) => sum + (m.scheduled_content?.length || 0), 0),
      high_priority_matches: matchesWithInfo.filter((m: any) => 
        m.scores?.overall >= 8
      ).length,
      competitions: [...new Set(matchesWithInfo.map((m: any) => m.competition?.name))].length
    };
    
    console.log(`✅ Processed ${matchesWithInfo.length} matches with automation scheduling`);
    
    return NextResponse.json({
      success: true,
      stats,
      matches: matchesWithInfo,
      matches_by_day: matchesByDay,
      period: {
        start: now.toISOString(),
        end: endDate.toISOString(),
        days: 7
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching upcoming matches:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      matches: [],
      matches_by_day: {},
      stats: {
        total_matches: 0,
        matches_with_automation: 0,
        content_scheduled: 0,
        high_priority_matches: 0,
        competitions: 0
      }
    }, { status: 500 });
  }
} 