import { NextRequest, NextResponse } from 'next/server';
import { unifiedFootballService } from '../../../../lib/content/unified-football-service';
import { getSportsApiKeys } from '../../../../lib/api-keys';
import { FootballIntelligenceEngine } from '@/lib/content/football-intelligence-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, contentRequest, homeTeam, awayTeam, league } = body;

    if (action === 'test_thesportsdb') {
      console.log('🧪 Testing TheSportsDB integration...');
      
      // First, check if TheSportsDB is configured
      const apiKeys = await getSportsApiKeys();
      const theSportsDbApi = apiKeys['thesportsdb'];
      
      if (!theSportsDbApi) {
        return NextResponse.json({
          success: false,
          error: 'TheSportsDB not found in API keys configuration',
          availableApis: Object.keys(apiKeys)
        });
      }

      console.log('📋 TheSportsDB Configuration:', {
        name: theSportsDbApi.name,
        apiKey: theSportsDbApi.api_key,
        url: theSportsDbApi.api_url,
        isActive: theSportsDbApi.is_active,
        priority: theSportsDbApi.priority
      });

      // Test direct API call
      const leagueId = '4503'; // FIFA Club World Cup
      const season = '2025';
      const apiKey = theSportsDbApi.api_key;
      
      const testUrl = `https://www.thesportsdb.com/api/v1/json/${apiKey}/eventsseason.php?id=${leagueId}&s=${season}`;
      
      console.log('🔗 Testing direct API call:', testUrl);
      
      try {
        const response = await fetch(testUrl);
        const data = await response.json();
        
        console.log('✅ Direct API Response:', {
          status: response.status,
          eventsCount: data.events?.length || 0
        });

        // Test unified service
        const unifiedMatches = await unifiedFootballService.getSmartMatches(contentRequest);
        
        console.log('⚽ Unified Service Response:', {
          matchesCount: unifiedMatches.length,
          matches: unifiedMatches.slice(0, 3)
        });

        // Get system health
        const systemHealth = await unifiedFootballService.getSystemHealth();
        
        return NextResponse.json({
          success: true,
          timestamp: new Date().toISOString(),
          theSportsDbConfig: {
            name: theSportsDbApi.name,
            apiKey: theSportsDbApi.api_key,
            url: theSportsDbApi.api_url,
            isActive: theSportsDbApi.is_active,
            priority: theSportsDbApi.priority
          },
          directApiTest: {
            url: testUrl,
            status: response.status,
            eventsCount: data.events?.length || 0,
            sampleEvents: data.events?.slice(0, 3) || []
          },
          unifiedServiceTest: {
            matchesCount: unifiedMatches.length,
            matches: unifiedMatches,
            systemHealth
          },
          allAvailableApis: Object.keys(apiKeys)
        });
        
      } catch (directApiError) {
        console.error('❌ Direct API test failed:', directApiError);
        
        return NextResponse.json({
          success: false,
          error: 'Direct API call failed',
          details: directApiError instanceof Error ? directApiError.message : 'Unknown error',
          theSportsDbConfig: theSportsDbApi,
          testUrl
        });
      }
    }

    if (action === 'get_system_health') {
      const health = await unifiedFootballService.getSystemHealth();
      const apiKeys = await getSportsApiKeys();
      
      return NextResponse.json({
        success: true,
        systemHealth: health,
        availableApis: Object.keys(apiKeys),
        configuredApis: Object.values(apiKeys).map(api => ({
          name: api.name,
          isActive: api.is_active,
          priority: api.priority,
          hasKey: !!api.api_key
        }))
      });
    }

    if (action === 'test_smart_matches') {
      const matches = await unifiedFootballService.getSmartMatches(contentRequest);
      
      return NextResponse.json({
        success: true,
        contentRequest,
        matches,
        matchesCount: matches.length,
        timestamp: new Date().toISOString()
      });
    }

    if (homeTeam && awayTeam) {
      console.log('🧪 Testing new 5-match analysis system');
      
      const footballEngine = new FootballIntelligenceEngine();
      
      // Test the analysis with the new 5-match system
      const analysis = await footballEngine.analyzeMatch(homeTeam, awayTeam, league || 'Test League', 'en');
      
      const testResults = {
        success: true,
        timestamp: new Date().toISOString(),
        testType: '5-match analysis system',
        match: `${homeTeam} vs ${awayTeam}`,
        homeTeamStats: {
          name: analysis.homeTeamResearch.teamName,
          totalMatches: analysis.homeTeamResearch.seasonStats.played,
          wins: analysis.homeTeamResearch.seasonStats.wins,
          draws: analysis.homeTeamResearch.seasonStats.draws, 
          losses: analysis.homeTeamResearch.seasonStats.losses,
          winRate: analysis.homeTeamResearch.seasonStats.played > 0 
            ? Math.round((analysis.homeTeamResearch.seasonStats.wins / analysis.homeTeamResearch.seasonStats.played) * 100)
            : 0,
          goalsFor: analysis.homeTeamResearch.seasonStats.goalsFor,
          goalsAgainst: analysis.homeTeamResearch.seasonStats.goalsAgainst,
          avgGoalsPerGame: analysis.homeTeamResearch.seasonStats.played > 0
            ? (analysis.homeTeamResearch.seasonStats.goalsFor / analysis.homeTeamResearch.seasonStats.played).toFixed(1)
            : '0.0'
        },
        awayTeamStats: {
          name: analysis.awayTeamResearch.teamName,
          totalMatches: analysis.awayTeamResearch.seasonStats.played,
          wins: analysis.awayTeamResearch.seasonStats.wins,
          draws: analysis.awayTeamResearch.seasonStats.draws,
          losses: analysis.awayTeamResearch.seasonStats.losses,
          winRate: analysis.awayTeamResearch.seasonStats.played > 0 
            ? Math.round((analysis.awayTeamResearch.seasonStats.wins / analysis.awayTeamResearch.seasonStats.played) * 100)
            : 0,
          goalsFor: analysis.awayTeamResearch.seasonStats.goalsFor,
          goalsAgainst: analysis.awayTeamResearch.seasonStats.goalsAgainst,
          avgGoalsPerGame: analysis.awayTeamResearch.seasonStats.played > 0
            ? (analysis.awayTeamResearch.seasonStats.goalsFor / analysis.awayTeamResearch.seasonStats.played).toFixed(1)
            : '0.0'
        },
        probabilities: analysis.calculatedProbabilities,
        valueBets: analysis.valueBets,
        consistency: {
          homeMatchesAnalyzed: analysis.homeTeamResearch.seasonStats.played,
          awayMatchesAnalyzed: analysis.awayTeamResearch.seasonStats.played,
          isConsistent: analysis.homeTeamResearch.seasonStats.played === 5 && analysis.awayTeamResearch.seasonStats.played === 5,
          note: analysis.homeTeamResearch.seasonStats.played === 5 && analysis.awayTeamResearch.seasonStats.played === 5 
            ? '✅ Both teams analyzed with exactly 5 matches'
            : `⚠️ Inconsistent: Home ${analysis.homeTeamResearch.seasonStats.played} matches, Away ${analysis.awayTeamResearch.seasonStats.played} matches`
        }
      };

      return NextResponse.json(testResults);
    }

    return NextResponse.json({
      success: false,
      error: 'Unknown action',
      availableActions: ['test_thesportsdb', 'get_system_health', 'test_smart_matches']
    });

  } catch (error) {
    console.error('❌ Debug API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 