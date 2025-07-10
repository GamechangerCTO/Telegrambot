/**
 * 🐛 DEBUG FOOTBALL APIs - בדיקה מפורטת של כל API בנפרד
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSportsApiKeys } from '@/lib/api-keys';
import { APIFootballAPI } from '@/lib/content/football-intelligence/api/api-football-api';
import { UnifiedFootballService } from '@/lib/content/unified-football-service';
import { footballMatchScorer } from '@/lib/content/football-match-scorer';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 DEBUG: בדיקת משחקים מאתמול ובשבוע הקרוב');
    
    // Get API key from environment
    const apiKey = process.env.API_FOOTBALL_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'API_FOOTBALL_KEY not found in environment' 
      }, { status: 500 });
    }

    const apiFootball = new APIFootballAPI(apiKey);

    // חישוב תאריכים
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // פורמט תאריכים ל-YYYY-MM-DD
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    console.log(`📅 חיפוש משחקים:
    - אתמול: ${yesterdayStr}
    - היום: ${todayStr}  
    - השבוע הקרוב: עד ${nextWeekStr}`);

    // קבלת משחקים מאתמול (finished)
    console.log(`🔍 מחפש משחקים מאתמול: ${yesterdayStr}`);
    const yesterdayMatches = await apiFootball.getFixturesByDate(yesterdayStr);

    // קבלת משחקים מהיום
    console.log(`🔍 מחפש משחקים מהיום: ${todayStr}`);
    const todayMatches = await apiFootball.getFixturesByDate(todayStr);

    // קבלת משחקים מהשבוע הקרוב (3 ימים קדימה)
    const upcomingDates = [];
    const upcomingMatches = [];
    
    for (let i = 1; i <= 7; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + i);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      upcomingDates.push(futureDateStr);
      
      console.log(`🔍 מחפש משחקים ליום: ${futureDateStr}`);
      const dayMatches = await apiFootball.getFixturesByDate(futureDateStr);
      upcomingMatches.push({ date: futureDateStr, matches: dayMatches });
    }

    // סיכום התוצאות
    const totalYesterday = yesterdayMatches.length;
    const totalToday = todayMatches.length;
    const totalUpcoming = upcomingMatches.reduce((sum, day) => sum + day.matches.length, 0);

    return NextResponse.json({
      message: 'בדיקת משחקים מאתמול ובשבוע הקרוב',
      timestamp: new Date().toISOString(),
      dates: {
        yesterday: yesterdayStr,
        today: todayStr,
        upcomingWeek: upcomingDates
      },
      results: {
        yesterday: {
          date: yesterdayStr,
          total: totalYesterday,
          matches: yesterdayMatches.slice(0, 10) // רק 10 ראשונים לתצוגה
        },
        today: {
          date: todayStr,
          total: totalToday,
          matches: todayMatches.slice(0, 10)
        },
        upcoming: {
          totalMatches: totalUpcoming,
          byDay: upcomingMatches.map(day => ({
            date: day.date,
            total: day.matches.length,
            topMatches: day.matches.slice(0, 5) // 5 ראשונים מכל יום
          }))
        }
      },
      summary: {
        yesterdayTotal: totalYesterday,
        todayTotal: totalToday,
        upcomingTotal: totalUpcoming,
        grandTotal: totalYesterday + totalToday + totalUpcoming
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('❌ שגיאה בבדיקת משחקים:', error);
    return NextResponse.json({
      error: 'שגיאה בבדיקת משחקים',
      details: error instanceof Error ? error.message : 'שגיאה לא ידועה'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, start_date, end_date, apply_smart_scoring, content_type } = body;

    if (action === 'get_weekly_fixtures') {
      console.log('🏟️ Getting weekly fixtures with smart scoring...');
      
      // Get API key from environment
      const apiKey = process.env.API_FOOTBALL_KEY;
      if (!apiKey) {
        return NextResponse.json({ 
          success: false,
          error: 'API_FOOTBALL_KEY not found in environment' 
        }, { status: 500 });
      }

      const apiFootball = new APIFootballAPI(apiKey);

      // Get fixtures for the date range
      const startDate = start_date || new Date().toISOString().split('T')[0];
      const endDate = end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      console.log(`📅 Fetching fixtures from ${startDate} to ${endDate}`);
      
      const matches = await apiFootball.getFixturesByDateRange(startDate, endDate, 100);
      
      if (matches.length === 0) {
        return NextResponse.json({
          success: true,
          matches: [],
          message: 'No matches found for the specified date range'
        });
      }

      console.log(`⚽ Found ${matches.length} raw matches`);

      // If smart scoring is requested, apply FootballMatchScorer
      if (apply_smart_scoring) {
        try {
          // Convert to MatchData format for scorer
          const matchData = matches.map(match => ({
            id: match.match_id || `match_${Date.now()}_${Math.random()}`,
            homeTeam: { 
              id: match.match_hometeam_id || 'unknown_home', 
              name: match.match_hometeam_name || 'Unknown Home'
            },
            awayTeam: { 
              id: match.match_awayteam_id || 'unknown_away', 
              name: match.match_awayteam_name || 'Unknown Away'
            },
            competition: { 
              id: 'api_league', 
              name: match.league_name || 'Unknown League'
            },
            kickoff: new Date(match.match_date + 'T' + (match.match_time || '15:00')),
            status: (match.match_status === 'Finished' ? 'FINISHED' : 
                   match.match_status === 'Live' ? 'LIVE' : 'SCHEDULED') as 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'IN_PLAY',
            homeScore: match.match_hometeam_score || 0,
            awayScore: match.match_awayteam_score || 0
          }));

          console.log('🧠 Applying smart scoring with FootballMatchScorer...');
          
          const scoredMatches = await footballMatchScorer.scoreMatches(matchData, {
            content_type: content_type || 'daily_summary',
            min_score_threshold: 15, // Only matches with decent relevance
            max_future_days: 14
          });

          console.log(`✅ Smart scoring complete: ${scoredMatches.length} relevant matches`);

          // Convert back to API format with scoring data
          const enhancedMatches = scoredMatches.map(scored => {
            const originalMatch = matches.find(m => m.match_id === scored.id);
            return {
              ...originalMatch,
              relevance_score: scored.relevance_score,
              reasons: scored.reasons,
              content_suitability: scored.content_suitability,
              // Add fixture format for compatibility
              fixture: {
                id: scored.id,
                date: scored.kickoff.toISOString(),
                status: {
                  short: scored.status === 'FINISHED' ? 'FT' : 
                        scored.status === 'LIVE' ? 'LIVE' : 'NS',
                  long: scored.status === 'FINISHED' ? 'Finished' : 
                       scored.status === 'LIVE' ? 'Live' : 'Not Started'
                }
              },
              teams: {
                home: { name: scored.homeTeam.name },
                away: { name: scored.awayTeam.name }
              },
              league: { name: scored.competition.name },
                             goals: {
                 home: originalMatch?.match_hometeam_score || 0,
                 away: originalMatch?.match_awayteam_score || 0
               }
            };
          });

          return NextResponse.json({
            success: true,
            matches: enhancedMatches,
            scoring_applied: true,
            total_raw_matches: matches.length,
            total_scored_matches: enhancedMatches.length,
            content_type: content_type || 'daily_summary',
            date_range: { start_date: startDate, end_date: endDate }
          });

        } catch (scoringError) {
          console.error('❌ Smart scoring failed:', scoringError);
          // Fallback to basic matches without scoring
          return NextResponse.json({
            success: true,
            matches: matches.slice(0, 50), // Limit without scoring
            scoring_applied: false,
            error: 'Smart scoring failed, showing basic matches',
            total_matches: matches.length
          });
        }
      } else {
        // Return matches without smart scoring
        return NextResponse.json({
          success: true,
          matches: matches.slice(0, 50),
          scoring_applied: false,
          total_matches: matches.length,
          date_range: { start_date: startDate, end_date: endDate }
        });
      }
    }

    // Default response for unknown actions
    return NextResponse.json({
      success: false,
      error: `Unknown action: ${action}. Available actions: get_weekly_fixtures`
    }, { status: 400 });

  } catch (error) {
    console.error('❌ Error in POST /api/debug-football:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

async function debugAllAPIs() {
  const results = [];
  
  try {
    const sportsApis = await getSportsApiKeys();
    console.log(`🔑 Found ${Object.keys(sportsApis).length} sports APIs`);
    
    for (const [name, api] of Object.entries(sportsApis)) {
      console.log(`\n🔍 Testing ${name}...`);
      const result = await testSingleAPI(name, api);
      results.push(result);
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      apis_tested: results.length,
      results: results
    });
    
  } catch (error) {
    console.error('❌ Error debugging all APIs:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to debug APIs'
    }, { status: 500 });
  }
}

async function debugSingleAPI(apiName: string) {
  try {
    const sportsApis = await getSportsApiKeys();
    const api = sportsApis[apiName];
    
    if (!api) {
      return NextResponse.json({
        success: false,
        error: `API ${apiName} not found. Available: ${Object.keys(sportsApis).join(', ')}`
      }, { status: 404 });
    }
    
    const result = await testSingleAPI(apiName, api);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      api: apiName,
      result: result
    });
    
  } catch (error) {
    console.error(`❌ Error debugging ${apiName}:`, error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : `Failed to debug ${apiName}`
    }, { status: 500 });
  }
}

async function testSingleAPI(name: string, api: any) {
  const result = {
    name: name,
    url: api.api_url,
    has_key: !!api.api_key,
    key_length: api.api_key ? api.api_key.length : 0,
    status: 'unknown',
    response_time: 0,
    error: null as string | null,
    response_data: null as any,
    headers_used: {} as Record<string, string>
  };
  
  try {
    const startTime = Date.now();
    
    // Setup URL and headers based on API type
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const fromStr = today.toISOString().split('T')[0];
    const toStr = nextWeek.toISOString().split('T')[0];
    
    let url: string;
    let headers: Record<string, string>;
    
    if (name === 'football-data-org') {
      let baseUrl = api.api_url.endsWith('/') ? api.api_url.slice(0, -1) : api.api_url;
      if (baseUrl.endsWith('/v4')) {
        baseUrl = baseUrl.slice(0, -3);
      }
      url = `${baseUrl}/v4/matches?dateFrom=${fromStr}&dateTo=${toStr}`;
      headers = { 'X-Auth-Token': api.api_key };
      
    } else if (name === 'api-football') {
      const isRapidAPI = api.api_url.includes('rapidapi.com');
      let baseUrl = api.api_url.endsWith('/') ? api.api_url.slice(0, -1) : api.api_url;
      url = `${baseUrl}/fixtures?season=2023&from=${fromStr}&to=${toStr}`;
      
      if (isRapidAPI) {
        headers = {
          'X-RapidAPI-Key': api.api_key,
          'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
        };
      } else {
        headers = { 'x-apisports-key': api.api_key };
      }
      
    } else if (name === 'soccersapi') {
      let baseUrl = api.api_url.endsWith('/') ? api.api_url.slice(0, -1) : api.api_url;
      // SoccersAPI requires both user and token
      const user = process.env.SOCCERSAPI_USER || 'triroars';
      url = `${baseUrl}/matches?date_from=${fromStr}&date_to=${toStr}&user=${user}&token=${api.api_key}`;
      headers = {};
      
    } else if (name === 'apifootball') {
      let baseUrl = api.api_url.endsWith('/') ? api.api_url.slice(0, -1) : api.api_url;
      url = `${baseUrl}/?action=get_events&from=${fromStr}&to=${toStr}&APIkey=${api.api_key}`;
      headers = {};
      
    } else {
      throw new Error(`Unsupported API: ${name}`);
    }
    
    result.headers_used = headers;
    
    console.log(`🔗 Testing URL: ${url}`);
    console.log(`🔑 Headers:`, headers);
    
    const response = await fetch(url, { 
      headers
    });
    
    result.response_time = Date.now() - startTime;
    result.status = response.status.toString();
    
    if (response.ok) {
      const data = await response.json();
      result.response_data = {
        type: typeof data,
        is_array: Array.isArray(data),
        keys: typeof data === 'object' && !Array.isArray(data) ? Object.keys(data).slice(0, 10) : [],
        length: Array.isArray(data) ? data.length : (data.matches?.length || data.response?.length || 'unknown'),
        sample: typeof data === 'object' ? JSON.stringify(data).substring(0, 200) + '...' : data
      };
      console.log(`✅ ${name}: Success! Status ${response.status}, Time: ${result.response_time}ms`);
    } else {
      const errorText = await response.text();
      result.error = `HTTP ${response.status}: ${errorText}`;
      console.log(`❌ ${name}: Error ${response.status} - ${errorText}`);
    }
    
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    result.response_time = Date.now() - (Date.now() - result.response_time);
    console.log(`❌ ${name}: Exception - ${result.error}`);
  }
  
  return result;
} 