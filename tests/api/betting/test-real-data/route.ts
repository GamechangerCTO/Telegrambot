/**
 * 🧪 BETTING REAL DATA TEST ENDPOINT
 * Test the enhanced betting system with real data integration
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

    console.log(`🧪 Testing enhanced betting system with real data integration`);
    console.log(`📊 Parameters: language=${language}, risk=${riskLevel}, odds=${includeOdds}`);

    // Test betting content generation with enhanced real data
    const result = await bettingContentGenerator.generateContent({
      language,
      maxItems: 2,
      includeOdds,
      includeImages,
      riskLevel
    });

    // Analyze the results
    const analysis = {
      dataSourceUsed: result.processingInfo.data_source,
      realOddsUsed: result.processingInfo.real_odds_used || false,
      bookmakers: result.processingInfo.bookmakers_analyzed || 0,
      contentGenerated: result.contentItems.length,
      averageConfidence: result.contentItems.reduce((sum, item) => 
        sum + (item.metadata?.totalConfidence || 0), 0) / result.contentItems.length,
      realDataAvailable: result.contentItems.some(item => 
        item.metadata?.dataSource === 'live_api')
    };

    // Extract betting tips for analysis
    const allTips = result.contentItems.flatMap(item => item.tips);
    const tipAnalysis = {
      totalTips: allTips.length,
      marketsUsed: [...new Set(allTips.map(tip => tip.market))],
      averageOdds: allTips.filter(tip => tip.odds > 0)
                          .reduce((sum, tip) => sum + tip.odds, 0) / 
                   allTips.filter(tip => tip.odds > 0).length,
      valueRatings: allTips.filter(tip => tip.value_rating)
                           .reduce((counts, tip) => {
                             counts[tip.value_rating!] = (counts[tip.value_rating!] || 0) + 1;
                             return counts;
                           }, {} as Record<string, number>),
      bookmakersUsed: [...new Set(allTips.map(tip => tip.bookmaker).filter(Boolean))]
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      test_parameters: {
        language,
        riskLevel,
        includeOdds,
        includeImages
      },
      system_analysis: analysis,
      betting_tips_analysis: tipAnalysis,
      sample_content: result.contentItems.map(item => ({
        id: item.id,
        title: item.title,
        match: `${item.homeTeam} vs ${item.awayTeam}`,
        competition: item.competition,
        dataSource: item.metadata?.dataSource,
        totalConfidence: item.metadata?.totalConfidence,
        tips: item.tips.map(tip => ({
          market: tip.market,
          selection: tip.selection,
          odds: tip.odds,
          confidence: tip.confidence,
          bookmaker: tip.bookmaker,
          valueRating: tip.value_rating,
          reasoning: tip.reasoning.substring(0, 100) + '...'
        })),
        regionalBookmakers: item.metadata?.regionalBookmakers?.length || 0,
        contentPreview: item.content.substring(0, 300) + '...'
      })),
      processing_info: result.processingInfo,
      recommendations: {
        dataQuality: analysis.realDataAvailable ? 
          '🟢 Excellent - Using live betting market data' : 
          '🟡 Good - Using enhanced AI analysis with realistic modeling',
        tipReliability: analysis.averageConfidence > 80 ? 
          '🟢 High confidence predictions' : 
          analysis.averageConfidence > 60 ? 
          '🟡 Moderate confidence predictions' : 
          '🔴 Lower confidence - consider additional analysis',
        valueAssessment: Object.keys(tipAnalysis.valueRatings).length > 0 ?
          `📊 Value ratings: ${JSON.stringify(tipAnalysis.valueRatings)}` :
          '⚠️ No value ratings available',
        nextSteps: [
          analysis.realOddsUsed ? 
            '✅ Real odds integration working' : 
            '🔧 Consider adding betting API credentials for live odds',
          '📈 Monitor tip performance over time',
          '🎯 Expand to more betting markets based on user preferences'
        ]
      }
    });

  } catch (error) {
    console.error('❌ Error testing betting system:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to test betting system',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      homeTeam = 'Manchester City', 
      awayTeam = 'Arsenal', 
      competition = 'Premier League',
      language = 'en',
      riskLevel = 'medium'
    } = body;

    console.log(`🧪 Testing specific match: ${homeTeam} vs ${awayTeam}`);

    // Test with specific match data
    const result = await bettingContentGenerator.generateContent({
      language: language as 'en' | 'am' | 'sw',
      maxItems: 1,
      includeOdds: true,
      includeImages: false,
      riskLevel: riskLevel as 'low' | 'medium' | 'high'
    });

    // Filter for the specific match or use the first one
    const matchContent = result.contentItems[0];

    if (!matchContent) {
      throw new Error('No betting content generated for the specified match');
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      match_analysis: {
        homeTeam: matchContent.homeTeam,
        awayTeam: matchContent.awayTeam,
        competition: matchContent.competition,
        totalTips: matchContent.tips.length,
        dataSource: matchContent.metadata?.dataSource,
        confidence: matchContent.metadata?.totalConfidence
      },
      betting_recommendations: matchContent.tips.map(tip => ({
        market: tip.market,
        selection: tip.selection,
        odds: tip.odds,
        confidence: `${tip.confidence}%`,
        bookmaker: tip.bookmaker || 'Multiple sources',
        valueRating: tip.value_rating || 'Not assessed',
        reasoning: tip.reasoning,
        impliedProbability: tip.implied_probability ? `${tip.implied_probability}%` : 'N/A'
      })),
      full_content: matchContent.content,
      market_data: matchContent.metadata?.marketData ? {
        totalBookmakers: matchContent.metadata.marketData.metadata.total_bookmakers,
        dataFreshness: matchContent.metadata.marketData.metadata.data_freshness,
        exchangeDataAvailable: matchContent.metadata.marketData.metadata.exchange_data_available
      } : null,
      regional_bookmakers: matchContent.metadata?.regionalBookmakers || []
    });

  } catch (error) {
    console.error('❌ Error testing specific match:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to test specific match',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}