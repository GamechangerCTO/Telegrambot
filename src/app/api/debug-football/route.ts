import { NextRequest, NextResponse } from 'next/server';
import { unifiedFootballService } from '@/lib/content/unified-football-service';
import { TimezoneUtils } from '@/lib/utils/timezone-utils';

/**
 * 🔍 FOOTBALL DEBUG API
 * Test and debug football match time fetching and timezone conversion
 */

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Football Debug API: Testing match time fetching...');

    // Test 1: Get matches from unified service
    const testMatch = await unifiedFootballService.getBestMatchForContent('betting_tip', 'en');
    
    if (testMatch) {
      console.log('🏆 Found test match:', {
        homeTeam: testMatch.homeTeam.name,
        awayTeam: testMatch.awayTeam.name,
        originalKickoff: testMatch.kickoff,
        kickoffType: typeof testMatch.kickoff,
        kickoffString: testMatch.kickoff.toString(),
        utcHour: testMatch.kickoff.getUTCHours(),
        utcMinutes: testMatch.kickoff.getUTCMinutes()
      });

      // Test timezone conversions
      const timezones = [
        'Africa/Addis_Ababa', // Ethiopia
        'Asia/Jerusalem',     // Israel
        'Europe/London',      // UK
        'Africa/Nairobi'      // Kenya
      ];

      const timezoneTests = timezones.map(timezone => {
        const localTime = TimezoneUtils.utcToChannelTime(testMatch.kickoff, timezone);
        const formattedTime = TimezoneUtils.formatTimeForChannel(testMatch.kickoff, timezone);
        
        return {
          timezone,
          localTime: localTime.toISOString(),
          localHour: localTime.getHours(),
          localMinutes: localTime.getMinutes(),
          formattedTime,
          isReasonableHour: localTime.getHours() >= 14 && localTime.getHours() <= 23
        };
      });

      return NextResponse.json({
        success: true,
        debug: {
          originalMatch: {
            teams: `${testMatch.homeTeam.name} vs ${testMatch.awayTeam.name}`,
            competition: testMatch.competition.name,
            originalKickoff: testMatch.kickoff.toISOString(),
            utcHour: testMatch.kickoff.getUTCHours(),
            utcMinutes: testMatch.kickoff.getUTCMinutes(),
            isReasonableUTC: testMatch.kickoff.getUTCHours() >= 12 && testMatch.kickoff.getUTCHours() <= 22
          },
          timezoneConversions: timezoneTests,
          recommendations: {
            needsTimeAdjustment: testMatch.kickoff.getUTCHours() < 6,
            suggestedUTCHour: testMatch.kickoff.getUTCHours() < 6 ? 17 : testMatch.kickoff.getUTCHours()
          }
        }
      });
    }

    // Test 2: Try to get today's matches directly from API
    const today = new Date().toISOString().split('T')[0];
    const todayMatches = await unifiedFootballService.getMatchesByDate(today);
    
    return NextResponse.json({
      success: true,
      debug: {
        message: 'No best match found, showing today matches',
        todayMatches: todayMatches.slice(0, 3).map(match => ({
          teams: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
          kickoff: match.kickoff.toISOString(),
          utcHour: match.kickoff.getUTCHours(),
          status: match.status
        }))
      }
    });

  } catch (error) {
    console.error('❌ Football Debug API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Debug API error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST: Test specific date and timezone combinations
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, timezone } = body;

    console.log(`🔍 Testing specific date: ${date} with timezone: ${timezone}`);

    const matches = await unifiedFootballService.getMatchesByDate(date || new Date().toISOString().split('T')[0]);
    
    const processedMatches = matches.slice(0, 5).map(match => {
      const originalKickoff = match.kickoff;
      const localTime = TimezoneUtils.utcToChannelTime(originalKickoff, timezone || 'Africa/Addis_Ababa');
      
      return {
        teams: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
        competition: match.competition.name,
        original: {
          kickoff: originalKickoff.toISOString(),
          utcHour: originalKickoff.getUTCHours(),
          utcMinutes: originalKickoff.getUTCMinutes()
        },
        converted: {
          localTime: localTime.toISOString(),
          localHour: localTime.getHours(),
          localMinutes: localTime.getMinutes(),
          formatted: TimezoneUtils.formatTimeForChannel(originalKickoff, timezone || 'Africa/Addis_Ababa')
        },
        analysis: {
          originalReasonable: originalKickoff.getUTCHours() >= 12 && originalKickoff.getUTCHours() <= 22,
          localReasonable: localTime.getHours() >= 14 && localTime.getHours() <= 23,
          needsAdjustment: originalKickoff.getUTCHours() < 6
        }
      };
    });

    return NextResponse.json({
      success: true,
      date,
      timezone,
      totalMatches: matches.length,
      processedMatches,
      summary: {
        unreasonableOriginalTimes: processedMatches.filter(m => !m.analysis.originalReasonable).length,
        reasonableLocalTimes: processedMatches.filter(m => m.analysis.localReasonable).length
      }
    });

  } catch (error) {
    console.error('❌ Football Debug POST error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Debug POST error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}