import { NextRequest, NextResponse } from 'next/server';
import { APIFootballAPI } from '@/lib/content/football-intelligence/api/api-football-api';
import { UnifiedFootballService } from '@/lib/content/unified-football-service';
import { FootballMatchScorer } from '@/lib/content/football-match-scorer';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const feature = searchParams.get('feature') || 'overview';
    
    // Dynamic current season
    const currentYear = new Date().getFullYear();
    const currentSeason = currentYear.toString();
    
    // Get parameters with smart defaults
    const season = searchParams.get('season') || currentSeason;
    const specificLeague = searchParams.get('league');
    const specificTeam = searchParams.get('team');
    const specificFixture = searchParams.get('fixture');
    const specificPlayer = searchParams.get('player');

    console.log(`🚀 API-Football v3 Dynamic Showcase: ${feature} (Season: ${season})`);

    const apiKey = process.env.API_FOOTBALL_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'API_FOOTBALL_KEY not configured',
        message: 'Missing API-Football API key'
      }, { status: 500 });
    }

    const api = new APIFootballAPI(apiKey);
    const footballService = new UnifiedFootballService();
    const scorer = new FootballMatchScorer();
    let data: any = {};

    switch (feature) {
      case 'overview':
        // Get comprehensive overview with dynamic data
        data = {
          feature: 'API-Football v3 Dynamic Overview',
          currentSeason: currentSeason,
          workflow: 'Find Matches → Score Them → Get Content-Specific Data',
          availableFeatures: [
            'smart-matches - Smart match selection using scorer',
            'standings - League tables (dynamic)',
            'statistics - Team/fixture/player stats (from real matches)', 
            'events - Match events from scored matches',
            'lineups - Team formations from top matches',
            'players - Player information from active teams',
            'topscorers - Leading scorers (current season)',
            'transfers - Recent player transfers',
            'injuries - Current injury reports',
            'predictions - Match predictions for upcoming games',
            'odds - Live betting odds',
            'live-data - Real-time match data'
          ],
          smartWorkflow: {
            step1: 'Get today\'s fixtures',
            step2: 'Score matches for relevance',
            step3: 'Get detailed data for best matches',
            step4: 'Generate content-specific information'
          },
          exampleUrls: {
            smartMatches: '/api/api-football-showcase?feature=smart-matches&content_type=betting_tip',
            todaysMatches: '/api/api-football-showcase?feature=smart-matches&content_type=poll',
            liveAnalysis: '/api/api-football-showcase?feature=smart-matches&content_type=analysis'
          }
        };
        break;

      case 'smart-matches':
        // The main dynamic workflow: Find → Score → Get Details
        const contentType = searchParams.get('content_type') || 'analysis';
        const maxResults = parseInt(searchParams.get('max_results') || '5');
        
        console.log(`🎯 Smart matches workflow for ${contentType} content`);

        // Step 1: Get today's matches
        const today = new Date().toISOString().split('T')[0];
        const todayFixtures = await api.getFixturesByDate(today);
        
        let matchesToScore = todayFixtures || [];
        
        // If no matches today, get next few days
        if (matchesToScore.length === 0) {
          console.log('📅 No matches today, getting upcoming matches...');
          for (let i = 1; i <= 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            const fixtures = await api.getFixturesByDate(dateStr);
            if (fixtures && fixtures.length > 0) {
              matchesToScore = fixtures;
              break;
            }
          }
        }

        console.log(`⚽ Found ${matchesToScore.length} matches to score`);

        // Step 2: Convert to MatchData format for scorer
        const matchData = matchesToScore.map(fixture => ({
          id: fixture.match_id || 'unknown',
          homeTeam: { name: fixture.match_hometeam_name, id: fixture.match_hometeam_id || 'unknown' },
          awayTeam: { name: fixture.match_awayteam_name, id: fixture.match_awayteam_id || 'unknown' },
          competition: { name: fixture.league_name || 'Unknown League', id: 'unknown' },
          kickoff: new Date(fixture.match_date),
          status: 'SCHEDULED' as const,
          venue: 'Unknown',
          season: season
        }));

        // Step 3: Score matches using our scorer
        const scoredMatches = await scorer.getBestMatchesForContentType(
          matchData,
          contentType as any,
          maxResults
        );

        console.log(`🏆 Scored ${scoredMatches.length} matches for ${contentType}`);

        // Step 4: Get detailed info for best matches
        const detailedMatches = await Promise.all(
          scoredMatches.slice(0, 3).map(async (match) => {
            const fixtureId = match.id;
            const [events, lineups, stats] = await Promise.all([
              api.getFixtureEvents(fixtureId).catch(() => null),
              api.getFixtureLineups(fixtureId).catch(() => null),
              api.getFixtureStatistics(fixtureId).catch(() => null)
            ]);

            return {
              match,
              events,
              lineups,
              statistics: stats,
              contentSuitability: match.content_suitability,
              scoringReasons: match.reasons
            };
          })
        );

        data = {
          feature: 'Smart Match Selection',
          contentType,
          workflow: {
            step1: `Found ${matchesToScore.length} matches`,
            step2: `Scored matches for ${contentType} content`,
            step3: `Selected top ${scoredMatches.length} matches`,
            step4: `Retrieved detailed data for content generation`
          },
          bestMatches: detailedMatches,
          scoringSummary: {
            totalAnalyzed: matchesToScore.length,
            passedScoring: scoredMatches.length,
            topScore: scoredMatches[0]?.relevance_score?.total || 0,
            contentSuitability: scoredMatches[0]?.content_suitability || {}
          }
        };
        break;

      case 'standings':
        // Dynamic league standings
        let leagueId = specificLeague;
        if (!leagueId) {
          // Get standings for top leagues
          const topLeagues = ['39', '140', '78', '135', '61']; // Premier, La Liga, Bundesliga, Serie A, Ligue 1
          leagueId = topLeagues[0];
        }
        
        console.log(`📊 Getting dynamic standings for league ${leagueId}, season ${season}`);
        data = {
          feature: 'Dynamic League Standings',
          league: leagueId,
          season: season,
          standings: await api.getStandings(leagueId, season)
        };
        break;

      case 'statistics':
        // Get stats from real matches
        const statsType = searchParams.get('type') || 'team';
        
        if (statsType === 'team' && specificTeam) {
          const league = specificLeague || '39';
          console.log(`📊 Getting team statistics for ${specificTeam}`);
          data = {
            feature: 'Dynamic Team Statistics',
            team: specificTeam,
            league,
            season,
            statistics: await api.getTeamStatistics(specificTeam, league, season)
          };
        } else if (statsType === 'fixture' && specificFixture) {
          console.log(`📊 Getting fixture statistics for ${specificFixture}`);
          data = {
            feature: 'Dynamic Fixture Statistics',
            fixture: specificFixture,
            statistics: await api.getFixtureStatistics(specificFixture)
          };
        } else {
          // Get stats from a real match using smart selection
          const smartRequest = { type: 'analysis' as const, language: 'en' as const, maxResults: 1 };
          const smartResult = await footballService.getSmartMatchesWithScoring(smartRequest);
          
          if (smartResult.bestMatches.length > 0) {
            const bestMatch = smartResult.bestMatches[0];
            data = {
              feature: 'Smart Match Statistics',
              selectedMatch: `${bestMatch.homeTeam.name} vs ${bestMatch.awayTeam.name}`,
              reason: 'Selected by smart scoring system',
              statistics: await api.getFixtureStatistics(bestMatch.id)
            };
          } else {
            data = { error: 'No suitable matches found for statistics' };
          }
        }
        break;

      case 'events':
        // Get events from a real match
        let eventFixtureId = specificFixture;
        if (!eventFixtureId) {
          // Get events from smart match selection
          const smartRequest = { type: 'analysis' as const, language: 'en' as const, maxResults: 1 };
          const smartResult = await footballService.getSmartMatchesWithScoring(smartRequest);
          
          if (smartResult.bestMatches.length > 0) {
            eventFixtureId = smartResult.bestMatches[0].id;
          }
        }
        
        if (eventFixtureId) {
          console.log(`⚡ Getting events for fixture ${eventFixtureId}`);
          data = {
            feature: 'Match Events',
            fixture: eventFixtureId,
            events: await api.getFixtureEvents(eventFixtureId)
          };
        } else {
          data = { error: 'No fixture specified or found' };
        }
        break;

      case 'lineups':
        // Get lineups from a real match
        let lineupFixtureId = specificFixture;
        if (!lineupFixtureId) {
          // Get lineups from smart match selection
          const smartRequest = { type: 'analysis' as const, language: 'en' as const, maxResults: 1 };
          const smartResult = await footballService.getSmartMatchesWithScoring(smartRequest);
          
          if (smartResult.bestMatches.length > 0) {
            lineupFixtureId = smartResult.bestMatches[0].id;
          }
        }
        
        if (lineupFixtureId) {
          console.log(`👥 Getting lineups for fixture ${lineupFixtureId}`);
          data = {
            feature: 'Team Lineups',
            fixture: lineupFixtureId,
            lineups: await api.getFixtureLineups(lineupFixtureId)
          };
        } else {
          data = { error: 'No fixture specified or found' };
        }
        break;

      case 'players':
        // Get players from a real team
        let playersTeamId = specificTeam;
        if (!playersTeamId) {
          // Get players from smart match selection
          const smartRequest = { type: 'analysis' as const, language: 'en' as const, maxResults: 1 };
          const smartResult = await footballService.getSmartMatchesWithScoring(smartRequest);
          
          if (smartResult.bestMatches.length > 0) {
            playersTeamId = smartResult.bestMatches[0].homeTeam.id;
          }
        }
        
        if (playersTeamId) {
          console.log(`👨‍⚽ Getting players for team ${playersTeamId}`);
          data = {
            feature: 'Team Players',
            team: playersTeamId,
            season,
            players: await api.getTeamPlayers(playersTeamId, season)
          };
        } else {
          data = { error: 'No team specified or found' };
        }
        break;

      case 'topscorers':
        // Get top scorers from active league
        let scorersLeagueId = specificLeague;
        if (!scorersLeagueId) {
          // Get league from smart match selection
          const smartRequest = { type: 'analysis' as const, language: 'en' as const, maxResults: 1 };
          const smartResult = await footballService.getSmartMatchesWithScoring(smartRequest);
          
          if (smartResult.bestMatches.length > 0) {
            scorersLeagueId = smartResult.bestMatches[0].competition.id;
          } else {
            scorersLeagueId = '39'; // Default to Premier League
          }
        }
        
        console.log(`🥇 Getting top scorers for league ${scorersLeagueId}`);
        data = {
          feature: 'Top Scorers',
          league: scorersLeagueId,
          season,
          topScorers: await api.getTopScorers(scorersLeagueId, season)
        };
        break;

      case 'transfers':
        // Get recent transfers
        console.log(`🔄 Getting recent transfers`);
        data = {
          feature: 'Recent Transfers',
          transfers: await api.getTransfers(specificTeam || undefined, specificPlayer || undefined)
        };
        break;

      case 'injuries':
        // Get current injuries
        let injuriesLeagueId = specificLeague || '39';
        console.log(`🏥 Getting current injuries for league ${injuriesLeagueId}`);
        data = {
          feature: 'Current Injuries',
          league: injuriesLeagueId,
          season,
          injuries: await api.getInjuries(injuriesLeagueId, season)
        };
        break;

      case 'predictions':
        // Get predictions for upcoming matches
        const predictionRequest = { type: 'betting_tip' as const, language: 'en' as const, maxResults: 1 };
        const predictionResult = await footballService.getSmartMatchesWithScoring(predictionRequest);
        
        if (predictionResult.bestMatches.length > 0) {
          const upcomingMatch = predictionResult.bestMatches[0];
          console.log(`🔮 Getting predictions for ${upcomingMatch.homeTeam.name} vs ${upcomingMatch.awayTeam.name}`);
          data = {
            feature: 'Match Predictions',
            fixture: upcomingMatch.id,
            selectedMatch: `${upcomingMatch.homeTeam.name} vs ${upcomingMatch.awayTeam.name}`,
            reason: 'Selected by smart betting tip algorithm',
            predictions: await api.getPredictions(upcomingMatch.id)
          };
        } else {
          data = { error: 'No suitable upcoming matches found for predictions' };
        }
        break;

      case 'odds':
        // Get live odds
        const oddsRequest = { type: 'betting_tip', language: 'en', maxResults: 1 };
        const oddsResult = await footballService.getSmartMatchesWithScoring(oddsRequest);
        
        if (oddsResult.bestMatches.length > 0) {
          const oddsMatch = oddsResult.bestMatches[0];
          console.log(`💰 Getting odds for ${oddsMatch.homeTeam.name} vs ${oddsMatch.awayTeam.name}`);
          data = {
            feature: 'Live Betting Odds',
            fixture: oddsMatch.id,
            selectedMatch: `${oddsMatch.homeTeam.name} vs ${oddsMatch.awayTeam.name}`,
            odds: await api.getOdds(oddsMatch.id)
          };
        } else {
          data = { error: 'No suitable matches found for odds' };
        }
        break;

      case 'countries':
        console.log(`🌍 Getting available countries`);
        data = {
          feature: 'Available Countries',
          countries: await api.getCountries()
        };
        break;

      case 'venues':
        const country = searchParams.get('country') || 'England';
        console.log(`🏟️ Getting venues for ${country}`);
        data = {
          feature: 'Stadium Venues',
          country,
          venues: await api.getVenues(country)
        };
        break;

      case 'seasons':
        const seasonsLeague = specificLeague || '39';
        console.log(`📅 Getting seasons for league ${seasonsLeague}`);
        data = {
          feature: 'Available Seasons',
          league: seasonsLeague,
          seasons: await api.getSeasons(seasonsLeague)
        };
        break;

      case 'coaches':
        // Get coaches from active teams
        let coachesTeamId = specificTeam;
        if (!coachesTeamId) {
          const smartRequest = { type: 'analysis', language: 'en', maxResults: 1 };
          const smartResult = await footballService.getSmartMatchesWithScoring(smartRequest);
          
          if (smartResult.bestMatches.length > 0) {
            coachesTeamId = smartResult.bestMatches[0].homeTeam.id;
          }
        }
        
        if (coachesTeamId) {
          console.log(`👨‍💼 Getting coaches for team ${coachesTeamId}`);
          data = {
            feature: 'Team Coaches',
            team: coachesTeamId,
            coaches: await api.getCoaches(coachesTeamId)
          };
        } else {
          data = { error: 'No team specified or found' };
        }
        break;

      default:
        data = {
          error: 'Unknown feature',
          availableFeatures: [
            'overview', 'smart-matches', 'standings', 'statistics', 
            'events', 'lineups', 'players', 'topscorers', 'transfers', 
            'injuries', 'predictions', 'odds', 'countries', 'venues', 
            'seasons', 'coaches'
          ]
        };
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      api: 'API-Football v3',
      season: currentSeason,
      data
    });

  } catch (error) {
    console.error('API-Football showcase error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action;
    
    if (action === 'get_fixtures_date_range') {
      const api = new APIFootballAPI();
      const fromDate = body.from_date;
      const toDate = body.to_date;
      const limit = body.limit || 100;
      
      console.log(`🔍 POST: Getting fixtures from ${fromDate} to ${toDate}`);
      
      // Get fixtures for the date range
      const matches = [];
      const startDate = new Date(fromDate);
      const endDate = new Date(toDate);
      
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        try {
          const dayFixtures = await api.getFixturesByDate(dateStr);
          if (dayFixtures && dayFixtures.length > 0) {
            matches.push(...dayFixtures);
          }
        } catch (error) {
          console.error(`Error fetching fixtures for ${dateStr}:`, error);
        }
      }
      
      console.log(`✅ Found ${matches.length} total fixtures`);
      
      return NextResponse.json({
        success: true,
        matches: matches.slice(0, limit),
        total: matches.length,
        dateRange: { from: fromDate, to: toDate }
      });
    }
    
    return NextResponse.json({ 
      error: 'Unsupported action',
      supportedActions: ['get_fixtures_date_range']
    }, { status: 400 });
    
  } catch (error) {
    console.error('Error in POST /api/api-football-showcase:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 