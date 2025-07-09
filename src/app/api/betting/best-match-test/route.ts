/**
 * 🎯 BEST MATCH BETTING TEST ENDPOINT
 * Test the enhanced betting system that focuses on the single best match
 */

import { NextRequest, NextResponse } from 'next/server';
import { BettingTipsGenerator } from '@/lib/content/betting-tips-generator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const language = (searchParams.get('language') as 'en' | 'am' | 'sw') || 'en';
    const riskLevel = (searchParams.get('risk') as 'low' | 'medium' | 'high') || 'medium';
    const includeOdds = searchParams.get('odds') !== 'false';
    const includeImages = searchParams.get('images') !== 'false';

    console.log(`🎯 Testing SINGLE BEST MATCH betting system`);
    console.log(`📊 Parameters: language=${language}, risk=${riskLevel}, odds=${includeOdds}`);

    // Test the enhanced betting content generator that focuses on best match
    const result = await bettingContentGenerator.generateContent({
      language,
      maxItems: 1, // Always 1 for best match mode
      includeOdds,
      includeImages,
      riskLevel
    });

    // Analyze the single best match result
    const bestMatchContent = result.contentItems[0];
    
    if (!bestMatchContent) {
      return NextResponse.json({
        success: false,
        error: 'No best match content generated',
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }

    const analysis = {
      matchSelected: `${bestMatchContent.homeTeam} vs ${bestMatchContent.awayTeam}`,
      competition: bestMatchContent.competition,
      matchDate: bestMatchContent.matchDate,
      dataSource: bestMatchContent.metadata?.dataSource,
      bestMatchMode: result.processingInfo.best_match_selected,
      selectionScore: result.processingInfo.match_selection_score,
      totalTips: bestMatchContent.tips.length,
      averageConfidence: bestMatchContent.metadata?.totalConfidence,
      realOddsUsed: result.processingInfo.real_odds_used,
      bookmakers: result.processingInfo.bookmakers_analyzed
    };

    // Extract betting tips analysis
    const tipsAnalysis = bestMatchContent.tips.map(tip => ({
      market: tip.market,
      selection: tip.selection,
      odds: tip.odds,
      confidence: `${tip.confidence}%`,
      bookmaker: tip.bookmaker || 'Multiple sources',
      valueRating: tip.value_rating || 'Not assessed',
      impliedProbability: tip.implied_probability ? `${tip.implied_probability}%` : 'N/A',
      reasoning: tip.reasoning
    }));

    // Determine content quality
    const contentQuality = analysis.realOddsUsed ? 
      '🟢 Excellent - Using live betting market data' : 
      '🟡 Good - Using enhanced AI analysis with realistic modeling';

    const confidenceAssessment = analysis.averageConfidence && analysis.averageConfidence > 80 ? 
      '🟢 High confidence predictions' : 
      analysis.averageConfidence && analysis.averageConfidence > 60 ? 
      '🟡 Moderate confidence predictions' : 
      '🔴 Lower confidence - additional analysis may be needed';

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      mode: 'SINGLE_BEST_MATCH',
      
      best_match_analysis: analysis,
      
      match_details: {
        homeTeam: bestMatchContent.homeTeam,
        awayTeam: bestMatchContent.awayTeam,
        competition: bestMatchContent.competition,
        matchDate: new Date(bestMatchContent.matchDate).toLocaleDateString(),
        matchTime: new Date(bestMatchContent.matchDate).toLocaleTimeString()
      },

      betting_tips: tipsAnalysis,

      content_preview: {
        title: bestMatchContent.title,
        contentLength: bestMatchContent.content.length,
        preview: bestMatchContent.content.substring(0, 500) + (bestMatchContent.content.length > 500 ? '...' : ''),
        hashtags: bestMatchContent.content.match(/#\w+/g) || []
      },

      quality_assessment: {
        dataQuality: contentQuality,
        tipReliability: confidenceAssessment,
        selectionMethod: analysis.bestMatchMode ? 
          '✅ Smart scoring system selected best match' : 
          '⚠️ Fallback match selection used',
        matchSuitability: analysis.selectionScore ? 
          `📊 Match score: ${analysis.selectionScore}/100` : 
          'No scoring data available'
      },

      regional_bookmakers: bestMatchContent.metadata?.regionalBookmakers || [],

      system_performance: {
        processingInfo: result.processingInfo,
        generatedAt: bestMatchContent.generated_at,
        contentId: bestMatchContent.id
      },

      recommendations: [
        analysis.realOddsUsed ? 
          '✅ Real odds integration working perfectly' : 
          '🔧 Consider adding betting API credentials for live odds',
        analysis.bestMatchMode ? 
          '✅ Smart match selection active' : 
          '⚠️ Check match scoring system configuration',
        '📈 Monitor tip performance over time for accuracy validation',
        '🎯 Single match focus provides maximum analysis depth'
      ]
    });

  } catch (error) {
    console.error('❌ Error testing best match betting system:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to test best match betting system',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      language = 'en',
      riskLevel = 'medium',
      forceMatch = null 
    } = body;

    console.log(`🧪 Testing best match betting with parameters:`, { language, riskLevel, forceMatch });

    // Generate content for the best match
    const result = await bettingContentGenerator.generateContent({
      language: language as 'en' | 'am' | 'sw',
      maxItems: 1,
      includeOdds: true,
      includeImages: false,
      riskLevel: riskLevel as 'low' | 'medium' | 'high'
    });

    const bestMatch = result.contentItems[0];

    if (!bestMatch) {
      throw new Error('No best match content generated');
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      
      selected_match: {
        teams: `${bestMatch.homeTeam} vs ${bestMatch.awayTeam}`,
        competition: bestMatch.competition,
        selectionScore: result.processingInfo.match_selection_score,
        bestMatchSelected: result.processingInfo.best_match_selected
      },

      comprehensive_analysis: {
        totalBettingTips: bestMatch.tips.length,
        markets: bestMatch.tips.map(tip => tip.market),
        averageOdds: bestMatch.tips.reduce((sum, tip) => sum + tip.odds, 0) / bestMatch.tips.length,
        averageConfidence: bestMatch.metadata?.totalConfidence,
        valueRatings: bestMatch.tips.map(tip => tip.value_rating).filter(Boolean)
      },

      detailed_tips: bestMatch.tips.map((tip, index) => ({
        tipNumber: index + 1,
        market: tip.market,
        selection: tip.selection,
        odds: tip.odds,
        confidence: tip.confidence,
        reasoning: tip.reasoning,
        bookmaker: tip.bookmaker,
        valueRating: tip.value_rating,
        impliedProbability: tip.implied_probability
      })),

      full_content: bestMatch.content,

      system_validation: {
        dataSource: bestMatch.metadata?.dataSource,
        realDataUsed: result.processingInfo.real_odds_used,
        bookmarkersAnalyzed: result.processingInfo.bookmakers_analyzed,
        aiProcessing: result.processingInfo.ai_processing,
        imageGeneration: result.processingInfo.image_generation
      }
    });

  } catch (error) {
    console.error('❌ Error in best match POST test:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process best match request',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}