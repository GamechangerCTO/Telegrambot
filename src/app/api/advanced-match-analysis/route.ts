/**
 * 🏆 Advanced Match Analysis API - API לניתוח משחקים מתקדם
 * מתמחה בניתוח מעמיק של משחקים עם נתונים סטטיסטיים ואנליזה טקטית
 * Works with the unified football system and AI engines
 */

import { NextRequest, NextResponse } from 'next/server';
import { matchAnalysisGenerator } from '@/lib/content/match-analysis-generator';
import { unifiedFootballService } from '@/lib/content/unified-football-service';

export async function GET(request: NextRequest): Promise<NextResponse> {
  console.log('🏆 Advanced Match Analysis API - GET request received');
  
  try {
    const { searchParams } = new URL(request.url);
    const language = (searchParams.get('language') as 'en' | 'am' | 'sw') || 'en';
    const type = searchParams.get('type') || 'test';

    if (type === 'test') {
      console.log('🧪 Running API test...');
      
      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        endpoint: 'Advanced Match Analysis API',
        language: language,
        message: '🏆 Advanced Match Analysis API is working!',
        description: 'Ready to generate comprehensive match analysis with real data',
        available_endpoints: {
          GET: 'Test endpoint and available matches',
          POST: 'Generate match analysis content'
        },
        supported_languages: ['en', 'am', 'sw'],
        capabilities: [
          'Comprehensive team analysis',
          'Head-to-head historical data',
          'Tactical analysis and formations',
          'Key battles and matchups',
          'Match predictions',
          'Multi-language content generation'
        ]
      });
    }

    if (type === 'available-matches') {
      console.log(`🔍 Getting available matches for analysis in ${language}`);
      
      // Get available matches for analysis
      const bestMatch = await unifiedFootballService.getBestMatchForContent('analysis', language);
      
      if (!bestMatch) {
        return NextResponse.json({
          success: false,
          message: 'No matches available for analysis',
          language: language
        });
      }

      return NextResponse.json({
        success: true,
        language: language,
        message: `🏆 Found match available for advanced analysis`,
        match: {
          homeTeam: bestMatch.homeTeam.name,
          awayTeam: bestMatch.awayTeam.name,
          competition: bestMatch.competition.name,
          kickoff: bestMatch.kickoff,
          status: bestMatch.status,
          relevanceScore: bestMatch.relevance_score?.total || 0
        }
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Invalid type parameter. Use "test" or "available-matches"'
    });

  } catch (error) {
    console.error('🚨 Error in Advanced Match Analysis GET:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to process advanced match analysis request'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  console.log('🏆 Advanced Match Analysis API - POST request received');
  
  try {
    const body = await request.json();
    const {
      language = 'en',
      channelId = 'api_request',
      analysisDepth = 'comprehensive',
      focusAreas = ['statistics', 'tactics', 'h2h', 'predictions']
    } = body;

    console.log(`🎯 Generating advanced match analysis:`);
    console.log(`  - Language: ${language}`);
    console.log(`  - Analysis Depth: ${analysisDepth}`);
    console.log(`  - Focus Areas: ${focusAreas.join(', ')}`);

    // Generate comprehensive match analysis
    const analysisResult = await matchAnalysisGenerator.generateMatchAnalysis({
      language: language as 'en' | 'am' | 'sw',
      channelId: channelId,
      analysisDepth: analysisDepth as 'basic' | 'detailed' | 'comprehensive',
      focusAreas: focusAreas
    });

    if (!analysisResult) {
      return NextResponse.json({
        success: false,
        message: 'No suitable match found for analysis or generation failed',
        language: language,
        processing_time_ms: Date.now() - startTime
      });
    }

    const endTime = Date.now();
    const processingTime = (endTime - startTime) / 1000;

        return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      content_type: 'advanced_match_analysis',
      language: language,
      processing_info: {
        analysis_depth: analysisDepth,
        focus_areas: focusAreas,
        data_source: 'Match Analysis Generator',
        ai_processing: true,
        image_generation: !!analysisResult.imageUrl,
        processing_time_seconds: Math.round(processingTime)
      },
      analysis: {
        id: analysisResult.metadata.contentId,
        title: analysisResult.title,
        content: analysisResult.content,
        imageUrl: analysisResult.imageUrl,
        language: language,
        word_count: analysisResult.metadata.wordCount,
        generated_at: analysisResult.metadata.generatedAt,
        match_info: {
          homeTeam: analysisResult.analysis.homeTeam,
          awayTeam: analysisResult.analysis.awayTeam,
          competition: analysisResult.analysis.competition,
          venue: analysisResult.analysis.venue,
          kickoff: analysisResult.analysis.kickoff
        },
        predictions: {
          predicted_result: analysisResult.analysis.prediction.predictedResult,
          confidence: analysisResult.analysis.prediction.confidence,
          predicted_score: analysisResult.analysis.prediction.predictedScore,
          expected_goals: analysisResult.analysis.prediction.expectedGoals,
          expected_style: analysisResult.analysis.prediction.expectedStyle
        },
        key_insights: analysisResult.analysis.summary.keyPoints,
        main_storyline: analysisResult.analysis.summary.mainStoryline,
        x_factor: analysisResult.analysis.summary.x_factor,
        verdict: analysisResult.analysis.summary.verdict
      },
      statistics: {
        home_team: {
          name: analysisResult.analysis.teamAnalysis.home.name,
          form: analysisResult.analysis.teamAnalysis.home.form,
          win_percentage: analysisResult.analysis.teamAnalysis.home.statistics.winPercentage,
          goals_per_game: analysisResult.analysis.teamAnalysis.home.statistics.goalsPerGame,
          goals_against_per_game: analysisResult.analysis.teamAnalysis.home.statistics.goalsAgainstPerGame,
          playing_style: analysisResult.analysis.teamAnalysis.home.tactics.playingStyle,
          preferred_formation: analysisResult.analysis.teamAnalysis.home.tactics.preferredFormation
        },
        away_team: {
          name: analysisResult.analysis.teamAnalysis.away.name,
          form: analysisResult.analysis.teamAnalysis.away.form,
          win_percentage: analysisResult.analysis.teamAnalysis.away.statistics.winPercentage,
          goals_per_game: analysisResult.analysis.teamAnalysis.away.statistics.goalsPerGame,
          goals_against_per_game: analysisResult.analysis.teamAnalysis.away.statistics.goalsAgainstPerGame,
          playing_style: analysisResult.analysis.teamAnalysis.away.tactics.playingStyle,
          preferred_formation: analysisResult.analysis.teamAnalysis.away.tactics.preferredFormation
        }
      },
      head_to_head: {
        total_meetings: analysisResult.analysis.headToHead.totalMeetings,
        home_wins: analysisResult.analysis.headToHead.homeTeamWins,
        away_wins: analysisResult.analysis.headToHead.awayTeamWins,
        draws: analysisResult.analysis.headToHead.draws,
        average_goals: analysisResult.analysis.headToHead.averageGoals,
        recent_trend: analysisResult.analysis.headToHead.trends.recentTrend
      },
      key_battles: analysisResult.analysis.keyBattles.tactical.map(battle => ({
        area: battle.area,
        description: battle.description,
        advantage: battle.advantage
      })),
      message: `✅ Advanced match analysis generated successfully in ${processingTime.toFixed(1)} seconds`
    });

  } catch (error) {
    console.error('🚨 Error in Advanced Match Analysis POST:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to generate advanced match analysis',
      processing_time_ms: Date.now() - startTime
    }, { status: 500 });
  }
} 