/**
 * 📊 BETTING PERFORMANCE API
 * Track and analyze betting tip performance
 */

import { NextRequest, NextResponse } from 'next/server';
// Mock implementation for betting performance tracker
const bettingPerformanceTracker = {
  getPerformanceMetrics: async (timeframe: string, filters: any) => ({
    totalTips: 150,
    settledTips: 135,
    winRate: 67.4,
    roi: 12.3,
    profitLoss: 1847.50,
    averageOdds: 2.15,
    averageConfidence: 74.2,
    marketPerformance: {
      'Match Winner': { tips: 45, wins: 32, winRate: 71.1, roi: 15.8 },
      'Over/Under 2.5': { tips: 38, wins: 24, winRate: 63.2, roi: 8.7 },
      'Both Teams Score': { tips: 35, wins: 23, winRate: 65.7, roi: 11.2 }
    },
    confidencePerformance: {
      high: { tips: 42, wins: 31, winRate: 73.8 },
      medium: { tips: 68, wins: 44, winRate: 64.7 },
      low: { tips: 25, wins: 15, winRate: 60.0 }
    },
    valuePerformance: {
      'Excellent': { tips: 22, wins: 17, winRate: 77.3, avgOdds: 2.45 },
      'Good': { tips: 48, wins: 31, winRate: 64.6, avgOdds: 2.12 },
      'Fair': { tips: 65, wins: 41, winRate: 63.1, avgOdds: 1.98 }
    }
  }),
  getRecentPerformanceSummary: async () => ({
    last7Days: { totalTips: 18, winRate: 72.2, roi: 18.5 },
    last30Days: { totalTips: 67, winRate: 65.7, roi: 13.1 },
    topPerformingMarkets: ['Match Winner', 'Asian Handicap'],
    improvementAreas: ['Draw Predictions', 'Low Odds Value Bets']
  }),
  recordBettingTip: async (tip: any, matchInfo: any) => 'tip_' + Date.now(),
  updateTipResult: async (tipId: string, result: any) => true,
  createBettingTipResultsTable: async () => true
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = (searchParams.get('timeframe') as 'week' | 'month' | 'quarter' | 'year' | 'all') || 'month';
    const language = searchParams.get('language') || undefined;
    const market = searchParams.get('market') || undefined;
    const channelId = searchParams.get('channel_id') || undefined;
    
    console.log(`📊 Fetching betting performance metrics for ${timeframe}`);

    // Get performance metrics
    const metrics = await bettingPerformanceTracker.getPerformanceMetrics(timeframe, {
      language,
      market,
      channelId
    });

    // Get recent performance summary
    const summary = await bettingPerformanceTracker.getRecentPerformanceSummary();

    // Calculate performance grade
    const performanceGrade = calculatePerformanceGrade(metrics);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      timeframe,
      filters: { language, market, channelId },
      
      overview: {
        totalTips: metrics.totalTips,
        settledTips: metrics.settledTips,
        winRate: `${metrics.winRate.toFixed(1)}%`,
        roi: `${metrics.roi > 0 ? '+' : ''}${metrics.roi.toFixed(1)}%`,
        profitLoss: metrics.profitLoss.toFixed(2),
        averageOdds: metrics.averageOdds.toFixed(2),
        averageConfidence: `${metrics.averageConfidence.toFixed(1)}%`,
        performanceGrade
      },

      detailed_metrics: {
        market_performance: Object.entries(metrics.marketPerformance).map(([market, perf]) => ({
          market,
          tips: perf.tips,
          wins: perf.wins,
          winRate: `${perf.winRate.toFixed(1)}%`,
          roi: `${perf.roi > 0 ? '+' : ''}${perf.roi.toFixed(1)}%`
        })).sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate)),

        confidence_performance: {
          high_confidence: {
            range: '80%+',
            tips: metrics.confidencePerformance.high.tips,
            wins: metrics.confidencePerformance.high.wins,
            winRate: `${metrics.confidencePerformance.high.winRate.toFixed(1)}%`
          },
          medium_confidence: {
            range: '60-79%',
            tips: metrics.confidencePerformance.medium.tips,
            wins: metrics.confidencePerformance.medium.wins,
            winRate: `${metrics.confidencePerformance.medium.winRate.toFixed(1)}%`
          },
          low_confidence: {
            range: '<60%',
            tips: metrics.confidencePerformance.low.tips,
            wins: metrics.confidencePerformance.low.wins,
            winRate: `${metrics.confidencePerformance.low.winRate.toFixed(1)}%`
          }
        },

        value_performance: Object.entries(metrics.valuePerformance).map(([rating, perf]: [string, any]) => ({
          value_rating: rating,
          tips: perf.tips,
          wins: perf.wins,
          winRate: `${perf.winRate.toFixed(1)}%`,
          averageOdds: perf.avgOdds.toFixed(2)
        })).sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate))
      },

      recent_trends: {
        last_7_days: {
          tips: summary.last7Days.totalTips,
          winRate: `${summary.last7Days.winRate.toFixed(1)}%`,
          roi: `${summary.last7Days.roi > 0 ? '+' : ''}${summary.last7Days.roi.toFixed(1)}%`
        },
        last_30_days: {
          tips: summary.last30Days.totalTips,
          winRate: `${summary.last30Days.winRate.toFixed(1)}%`,
          roi: `${summary.last30Days.roi > 0 ? '+' : ''}${summary.last30Days.roi.toFixed(1)}%`
        },
        top_performing_markets: summary.topPerformingMarkets,
        improvement_areas: summary.improvementAreas
      },

      insights: generatePerformanceInsights(metrics, summary),

      recommendations: generateRecommendations(metrics, summary)
    });

  } catch (error) {
    console.error('❌ Error fetching betting performance:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch betting performance data',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'record_tip':
        const tipId = await bettingPerformanceTracker.recordBettingTip(
          data.tip,
          data.matchInfo
        );
        return NextResponse.json({
          success: true,
          message: 'Betting tip recorded for tracking',
          tipId,
          timestamp: new Date().toISOString()
        });

      case 'update_result':
        await bettingPerformanceTracker.updateTipResult(
          data.tipId,
          data.result
        );
        return NextResponse.json({
          success: true,
          message: 'Tip result updated successfully',
          timestamp: new Date().toISOString()
        });

      case 'create_table':
        await bettingPerformanceTracker.createBettingTipResultsTable();
        return NextResponse.json({
          success: true,
          message: 'Database schema logged for betting tip results table',
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Error in betting performance POST:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process betting performance request',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * Calculate overall performance grade
 */
function calculatePerformanceGrade(metrics: any): string {
  const winRate = metrics.winRate;
  const roi = metrics.roi;
  
  // Weight win rate (60%) and ROI (40%)
  const score = (winRate * 0.6) + ((roi + 20) * 0.4); // Normalize ROI (-20 to +20 -> 0 to 40)
  
  if (score >= 75) return 'A+ (Excellent)';
  if (score >= 65) return 'A (Very Good)';
  if (score >= 55) return 'B+ (Good)';
  if (score >= 45) return 'B (Above Average)';
  if (score >= 35) return 'C+ (Average)';
  if (score >= 25) return 'C (Below Average)';
  return 'D (Needs Improvement)';
}

/**
 * Generate performance insights
 */
function generatePerformanceInsights(metrics: any, summary: any): string[] {
  const insights: string[] = [];
  
  if (metrics.winRate > 60) {
    insights.push(`🎯 Strong accuracy with ${metrics.winRate.toFixed(1)}% win rate`);
  } else if (metrics.winRate < 45) {
    insights.push(`⚠️ Win rate of ${metrics.winRate.toFixed(1)}% needs improvement`);
  }
  
  if (metrics.roi > 5) {
    insights.push(`💰 Profitable betting with ${metrics.roi.toFixed(1)}% ROI`);
  } else if (metrics.roi < -5) {
    insights.push(`📉 Negative ROI of ${metrics.roi.toFixed(1)}% requires strategy adjustment`);
  }
  
  // Confidence analysis
  const highConfWinRate = metrics.confidencePerformance.high.winRate;
  const medConfWinRate = metrics.confidencePerformance.medium.winRate;
  
  if (highConfWinRate > medConfWinRate + 10) {
    insights.push(`✅ High confidence tips performing well (${highConfWinRate.toFixed(1)}% vs ${medConfWinRate.toFixed(1)}%)`);
  } else if (highConfWinRate < medConfWinRate - 5) {
    insights.push(`🔍 High confidence tips underperforming - review selection criteria`);
  }
  
  // Market analysis
  const bestMarket = Object.entries(metrics.marketPerformance)
    .filter(([_, perf]: [string, any]) => perf.tips >= 3)
    .sort((a: any, b: any) => b[1].winRate - a[1].winRate)[0];
  
  if (bestMarket) {
    const marketData = bestMarket[1] as any;
    insights.push(`🏆 Best performing market: ${bestMarket[0]} (${marketData.winRate.toFixed(1)}% win rate)`);
  }
  
  return insights;
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(metrics: any, summary: any): string[] {
  const recommendations: string[] = [];
  
  if (metrics.winRate < 50) {
    recommendations.push('Focus on higher probability selections to improve win rate');
    recommendations.push('Consider reducing bet confidence thresholds');
  }
  
  if (metrics.roi < 0) {
    recommendations.push('Prioritize value bets over favorites to improve ROI');
    recommendations.push('Review and avoid consistently losing markets');
  }
  
  // Value rating recommendations
  if (metrics.valuePerformance.excellent?.tips > 0) {
    const excellentWinRate = metrics.valuePerformance.excellent.winRate;
    if (excellentWinRate > 65) {
      recommendations.push('Increase focus on "excellent" value bets - showing strong performance');
    }
  }
  
  // Market-specific recommendations
  const worstMarket = Object.entries(metrics.marketPerformance)
    .filter(([_, perf]: [string, any]) => perf.tips >= 5)
    .sort((a: any, b: any) => a[1].winRate - b[1].winRate)[0];
  
  if (worstMarket) {
    const marketData = worstMarket[1] as any;
    if (marketData.winRate < 40) {
      recommendations.push(`Consider reducing ${worstMarket[0]} bets (${marketData.winRate.toFixed(1)}% win rate)`);
    }
  }
  
  if (summary.improvementAreas.length > 0) {
    recommendations.push(...summary.improvementAreas.map((area: string) => `📈 ${area}`));
  }
  
  return recommendations;
}