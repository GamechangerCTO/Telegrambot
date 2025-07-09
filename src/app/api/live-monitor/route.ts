/**
 * 🔴 Live Monitor API Endpoint
 * API לניהול מערכת עדכונים חיים
 */

import { NextRequest, NextResponse } from 'next/server';
import { LiveUpdatesGenerator } from '@/lib/content/live-updates-generator';

// יצירת instance יחיד של Monitor (Singleton pattern)
const liveMonitor = new LiveUpdatesGenerator();

/**
 * �� API לניהול מערכת עדכונים חיים - מחוברת למערכת בחירת המשחקים החכמה
 * 
 * תכונות:
 * ✅ מעקב אחרי משחקים מעניינים בלבד (דרך FootballMatchScorer)
 * ✅ זיהוי אירועים חיים (גולים, כרטיסים, התחלת/סיום משחק)
 * ✅ שליחת התראות לערוצים רלוונטיים
 * ✅ מניעת דאבל פוסטים
 */

export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json();

    switch (action) {
      case 'start_monitoring':
        const intervalSeconds = params.intervalSeconds || 60;
        const result = await liveMonitor.startMonitoring(intervalSeconds);
        return NextResponse.json({
          success: true,
          message: `🚀 Live monitoring started every ${intervalSeconds}s`,
          data: result
        });

      case 'stop_monitoring':
        const stopResult = await liveMonitor.stopMonitoring();
        return NextResponse.json({
          success: true,
          message: '🛑 Live monitoring stopped',
          data: stopResult
        });

      case 'get_stats':
        const stats = await liveMonitor.getMonitoringStats()
        return NextResponse.json({
          success: true,
          message: '📊 Monitoring statistics',
          data: stats
        })

      case 'test_notification':
        const { matchId, eventType, message } = params;
        if (!matchId || !eventType || !message) {
          return NextResponse.json({
            success: false,
            message: '❌ Missing required parameters: matchId, eventType, message'
          }, { status: 400 });
        }

        const testResult = await liveMonitor.testNotification(matchId, eventType, message);
        return NextResponse.json({
          success: testResult.success,
          message: testResult.success ? '🧪 Test notification sent' : '❌ Test failed',
          data: testResult
        });

      default:
        return NextResponse.json({
          success: false,
          message: `❌ Unknown action: ${action}. Available: start_monitoring, stop_monitoring, get_stats, test_notification`
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Live Monitor API Error:', error);
    return NextResponse.json({
      success: false,
      message: '❌ Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        const stats = await liveMonitor.getMonitoringStats();
        return NextResponse.json({
          success: true,
          message: '📊 Live monitoring statistics',
          data: {
            ...stats,
            description: 'Real-time monitoring of interesting matches only (powered by smart match scoring)',
            features: [
              'Smart match selection with FootballMatchScorer',
              'Real-time event detection (goals, cards, match start/end)',
              'Channel-specific notifications',
              'Anti-duplicate message system',
              'Multi-language support'
            ]
          }
        });

      case 'status':
        const isRunning = await liveMonitor.getMonitoringStats();
        return NextResponse.json({
          success: true,
          message: isRunning.isRunning ? '🟢 Live monitoring is active' : '🔴 Live monitoring is stopped',
          data: {
            isActive: isRunning.isRunning,
            systemType: 'Smart Live Monitor (AI-Enhanced)',
            connectedSystems: [
              'UnifiedFootballService (5 APIs)',
              'FootballMatchScorer (Smart Filtering)',
              'SmartContentGenerator (AI Content)',
              'TelegramSender (Multi-Channel)'
            ]
          }
        });

      case 'health':
        const healthStats = await liveMonitor.getMonitoringStats();
        return NextResponse.json({
          success: true,
          message: '💚 System health check',
          data: {
            status: healthStats.isRunning ? 'healthy' : 'stopped',
            totalMatches: healthStats.totalMatches,
            liveMatches: healthStats.liveMatches,
            recentEvents: healthStats.eventsLast24h,
            systemIntegration: 'Connected to smart match selection',
            lastCheck: new Date().toISOString()
          }
        });

      default:
        return NextResponse.json({
          success: true,
          message: '🔴 Live Match Monitor API - Smart System',
          data: {
            description: 'Monitor only interesting live matches based on smart scoring',
            endpoints: {
              POST: {
                'start_monitoring': 'Start monitoring with interval (30-300 seconds)',
                'stop_monitoring': 'Stop live monitoring',
                'get_stats': 'Get detailed statistics',
                'test_notification': 'Send test notification to channels'
              },
              GET: {
                'stats': 'Get monitoring statistics',
                'status': 'Check if monitoring is active',
                'health': 'System health check'
              }
            },
            smartFeatures: [
              'Only monitors matches with 15+ relevance score',
              'Filters by competition importance (Premier League: 9, Champions League: 9)',
              'Team popularity scoring (Man United: 9, Real Madrid: 10)',
              'Live match prioritization',
              'Intelligent event detection',
              'Multi-language content generation'
            ]
          }
        });
    }

  } catch (error) {
    console.error('❌ Live Monitor GET Error:', error);
    return NextResponse.json({
      success: false,
      message: '❌ Error processing request',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 