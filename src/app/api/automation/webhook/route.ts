import { NextRequest, NextResponse } from 'next/server';
import { FootballMatchScorer } from '@/lib/content/football-match-scorer';
import { BackgroundScheduler } from '@/lib/automation/background-scheduler';
import { contentSpamPreventer } from '@/lib/utils/content-spam-preventer';
import { unifiedFootballService } from '@/lib/content/unified-football-service';
import { supabase } from '@/lib/supabase';
import { POST as unifiedContentAPI } from '@/app/api/unified-content/route';

/**
 * 🔧 ENHANCED WEBHOOK HANDLER
 * Integrates GitHub Actions with existing systems
 */

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.WEBHOOK_SECRET}`;
    
    if (!authHeader || authHeader !== expectedAuth) {
      console.log('❌ Unauthorized webhook attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, timestamp, ...data } = await request.json();
    const requestId = `${action}-${Date.now()}`;
    
    console.log(`🚀 [${requestId}] Webhook action: ${action} at ${timestamp}`);

    let result;
    switch(action) {
      case 'discover-matches':
        result = await handleDiscoverMatches(data, requestId);
        break;
      case 'create-dynamic-schedule':
        result = await handleCreateDynamicSchedule(data, requestId);
        break;
      case 'schedule-fallback-content':
        result = await handleScheduleFallbackContent(data, requestId);
        break;
      case 'check-spam-limits':
        result = await handleCheckSpamLimits(data, requestId);
        break;
      case 'send-news':
        result = await handleSendNews(data, requestId);
        break;
      case 'daily-summary':
        result = await handleDailySummary(data, requestId);
        break;
      case 'weekly-summary':
        result = await handleWeeklySummary(data, requestId);
        break;
      case 'check-dynamic-schedule':
        result = await handleCheckDynamicSchedule(data, requestId);
        break;
      case 'execute-pending-content':
        result = await handleExecutePendingContent(data, requestId);
        break;
      case 'log-check':
        result = await handleLogCheck(data, requestId);
        break;
      case 'emergency-check':
        result = await handleEmergencyCheck(data, requestId);
        break;
      case 'report-failure':
        result = await handleReportFailure(data, requestId);
        break;
      case 'get-spam-stats':
        result = await handleGetSpamStats(data, requestId);
        break;
      case 'start-live-monitoring':
        result = await handleStartLiveMonitoring(data, requestId);
        break;
      case 'stop-live-monitoring':
        result = await handleStopLiveMonitoring(data, requestId);
        break;
      case 'get-live-stats':
        result = await handleGetLiveStats(data, requestId);
        break;
      default:
        console.log(`❓ [${requestId}] Unknown action: ${action}`);
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ [${requestId}] Completed in ${duration}ms:`, result);
    
    return NextResponse.json({ 
      success: true, 
      action, 
      requestId,
      result,
      duration,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Webhook error after ${duration}ms:`, error);
    
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * Handle match discovery using existing FootballMatchScorer
 */
async function handleDiscoverMatches(data: any, requestId: string) {
  console.log(`🔍 [${requestId}] Discovering matches using FootballMatchScorer...`);
  
  try {
    const scorer = new FootballMatchScorer();
    
    // Get top matches using your existing system  
    const todayStr = new Date().toISOString().split('T')[0];
    const todayMatches = await unifiedFootballService.getMatchesByDate(todayStr);
    
    const topMatches = await scorer.scoreMatches(todayMatches, {
      content_type: 'betting_tip',
      min_score_threshold: 15,
      language: 'en'
    });
    
    console.log(`📊 [${requestId}] Found ${topMatches.length} potential matches`);
    
    // Filter for really important matches (score > 15)
    const importantMatches = topMatches.filter((match: any) => match.relevance_score?.total > 15);
    
    console.log(`⭐ [${requestId}] ${importantMatches.length} important matches (score > 15)`);
    
    if (importantMatches.length > 0) {
      // Store the matches for dynamic scheduling
      await supabase.from('automation_logs').insert({
        automation_rule_id: `discovery-${Date.now()}`,
        run_type: 'match_discovery',
        status: 'success',
        content_generated: importantMatches.length,
        created_at: new Date().toISOString()
      });
    }
    
    return {
      topMatches: importantMatches.length,
      totalScanned: topMatches.length,
      matches: importantMatches.slice(0, 5).map((m: any) => ({
        teams: `${m.homeTeam?.name || m.homeTeam} vs ${m.awayTeam?.name || m.awayTeam}`,
        kickoff: m.kickoff,
        score: m.relevance_score?.total || 0,
        competition: m.competition?.name || m.competition
      }))
    };
    
  } catch (error: unknown) {
    console.error(`❌ [${requestId}] Match discovery failed:`, error);
    return { topMatches: 0, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Create dynamic schedule based on match times
 */
async function handleCreateDynamicSchedule(data: any, requestId: string) {
  console.log(`📊 [${requestId}] Creating dynamic schedule for ${data.matches_found} matches...`);
  
  try {
    // Use existing background scheduler logic
    const scheduler = new BackgroundScheduler();
    
    // This would ideally interface with your existing scheduling system
    // For now, we'll create a basic schedule structure
    const scheduleItems = [];
    
    const now = new Date();
    const bettingTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
    const analysisTime = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3 hours from now
    
    scheduleItems.push({
      type: 'betting',
      scheduled_time: bettingTime.toISOString(),
      description: 'Betting tips for top match'
    });
    
    scheduleItems.push({
      type: 'analysis', 
      scheduled_time: analysisTime.toISOString(),
      description: 'Match analysis for top match'
    });
    
    // Log the schedule creation
    await supabase.from('automation_logs').insert({
      automation_rule_id: `schedule-${Date.now()}`,
      run_type: 'dynamic_scheduling',
      status: 'success',
      content_generated: scheduleItems.length,
      created_at: new Date().toISOString()
    });
    
    return {
      scheduled_items: scheduleItems.length,
      items: scheduleItems
    };
    
  } catch (error: unknown) {
    console.error(`❌ [${requestId}] Schedule creation failed:`, error);
    return { scheduled_items: 0, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Schedule fallback content for days without important matches
 */
async function handleScheduleFallbackContent(data: any, requestId: string) {
  console.log(`📝 [${requestId}] Scheduling fallback content...`);
  
  const fallbackItems = [
    { type: 'news', time: '10:00', description: 'General football news' },
    { type: 'polls', time: '15:00', description: 'Weekly football poll' },
    { type: 'summary', time: '20:00', description: 'Weekly highlights' }
  ];
  
  return {
    fallback_items: fallbackItems.length,
    items: fallbackItems
  };
}

/**
 * Check spam limits using the new anti-spam system
 */
async function handleCheckSpamLimits(data: any, requestId: string) {
  console.log(`🛡️ [${requestId}] Checking spam limits for ${data.content_type}...`);
  
  try {
    const result = await contentSpamPreventer.canSendContent(
      data.content_type,
      'webhook-channel',
      'default'
    );
    
    console.log(`🔍 [${requestId}] Spam check result:`, result);
    
    return {
      allowed: result.allowed,
      reason: result.reason,
      waitTime: result.waitTime
    };
    
  } catch (error) {
    console.error(`❌ [${requestId}] Spam check failed:`, error);
    return { allowed: false, reason: 'System error', error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Send news using existing unified content system
 */
async function handleSendNews(data: any, requestId: string) {
  console.log(`📰 [${requestId}] Sending news for time slot ${data.time_slot}...`);
  
  try {
    // Check spam limits first
    const canSend = await contentSpamPreventer.canSendContent('news', 'webhook-channel');
    if (!canSend.allowed) {
      return { sent: false, reason: canSend.reason };
    }
    
    // Create request for unified content API
    const mockRequest = new Request('http://localhost/api/unified-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'news',
        language: data.language || '',
        auto_distribute: true
      })
    });
    
    // Use your existing unified content system
    const response = await unifiedContentAPI(mockRequest as any);
    const result = await response.json();
    
    if (result.success) {
      // Log the content sending
      await contentSpamPreventer.logContentSent('news', 'webhook-channel');
      
      return {
        sent: true,
        channels: result.distribution?.channels || 1,
        time_slot: data.time_slot
      };
    } else {
      return { sent: false, error: result.error };
    }
    
  } catch (error: unknown) {
    console.error(`❌ [${requestId}] News sending failed:`, error);
    return { sent: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Send daily summary
 */
async function handleDailySummary(data: any, requestId: string) {
  console.log(`📝 [${requestId}] Sending daily summary...`);
  
  try {
    const canSend = await contentSpamPreventer.canSendContent('summary', 'webhook-channel');
    if (!canSend.allowed) {
      return { sent: false, reason: canSend.reason };
    }
    
    // Use unified content API for summary
    const mockRequest = new Request('http://localhost/api/unified-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'daily_summary',
        language: data.language || '',
        auto_distribute: true
      })
    });
    
    const response = await unifiedContentAPI(mockRequest as any);
    const result = await response.json();
    
    if (result.success) {
      await contentSpamPreventer.logContentSent('summary', 'webhook-channel');
      return { sent: true, type: 'daily_summary' };
    } else {
      return { sent: false, error: result.error };
    }
    
  } catch (error) {
    console.error(`❌ [${requestId}] Daily summary failed:`, error);
    return { sent: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Send weekly summary
 */
async function handleWeeklySummary(data: any, requestId: string) {
  console.log(`📊 [${requestId}] Sending weekly summary...`);
  
  try {
    const canSend = await contentSpamPreventer.canSendContent('summary', 'webhook-channel');
    if (!canSend.allowed) {
      return { sent: false, reason: canSend.reason };
    }
    
    const mockRequest = new Request('http://localhost/api/unified-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'weekly_summary',
        language: data.language || '',
        auto_distribute: true
      })
    });
    
    const response = await unifiedContentAPI(mockRequest as any);
    const result = await response.json();
    
    if (result.success) {
      await contentSpamPreventer.logContentSent('summary', 'webhook-channel');
      return { sent: true, type: 'weekly_summary' };
    } else {
      return { sent: false, error: result.error };
    }
    
  } catch (error) {
    console.error(`❌ [${requestId}] Weekly summary failed:`, error);
    return { sent: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Check what dynamic content needs to be sent
 */
async function handleCheckDynamicSchedule(data: any, requestId: string) {
  console.log(`🎯 [${requestId}] Checking dynamic schedule...`);
  
  try {
    // This would integrate with your existing background scheduler
    // For now, we'll simulate checking for pending content
    
    const now = new Date();
    const currentHour = now.getHours();
    
    // Simple logic - in a real implementation, this would check your scheduling system
    const shouldSendBetting = currentHour >= 10 && currentHour <= 20; // Active hours
    const shouldSendAnalysis = currentHour >= 12 && currentHour <= 22;
    
    const pendingContent = [];
    
    if (shouldSendBetting && Math.random() > 0.7) { // 30% chance
      pendingContent.push({ type: 'betting', priority: 'high' });
    }
    
    if (shouldSendAnalysis && Math.random() > 0.8) { // 20% chance  
      pendingContent.push({ type: 'analysis', priority: 'medium' });
    }
    
    return {
      has_pending: pendingContent.length > 0,
      content_count: pendingContent.length,
      pending_items: pendingContent
    };
    
  } catch (error) {
    console.error(`❌ [${requestId}] Dynamic schedule check failed:`, error);
    return { has_pending: false, content_count: 0, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Execute pending content
 */
async function handleExecutePendingContent(data: any, requestId: string) {
  console.log(`⚡ [${requestId}] Executing pending content...`);
  
  try {
    // This would integrate with your existing execution system
    let executed = 0;
    
    // Simulate execution - in reality, this would call your content generators
    const types = ['betting', 'analysis'];
    
    for (const type of types) {
      const canSend = await contentSpamPreventer.canSendContent(type, 'webhook-channel');
      if (canSend.allowed) {
        executed++;
        await contentSpamPreventer.logContentSent(type, 'webhook-channel');
      }
    }
    
    return {
      executed_count: executed,
      success: executed > 0
    };
    
  } catch (error) {
    console.error(`❌ [${requestId}] Content execution failed:`, error);
    return { executed_count: 0, success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Log check for monitoring
 */
async function handleLogCheck(data: any, requestId: string) {
  console.log(`📝 [${requestId}] Logging check: ${data.result}`);
  
  await supabase.from('automation_logs').insert({
    automation_rule_id: `log-check-${Date.now()}`,
    run_type: 'system_check',
    status: 'success',
    content_generated: 0,
    created_at: new Date().toISOString()
  });
  
  return { logged: true, result: data.result };
}

/**
 * Handle emergency situations
 */
async function handleEmergencyCheck(data: any, requestId: string) {
  console.log(`🚨 [${requestId}] Emergency check: ${data.reason}`);
  
  await supabase.from('automation_logs').insert({
    automation_rule_id: `emergency-${Date.now()}`,
    run_type: 'emergency_check',
    status: 'failed',
    content_generated: 0,
    created_at: new Date().toISOString()
  });
  
  return { emergency_logged: true, reason: data.reason };
}

/**
 * Handle failure reporting
 */
async function handleReportFailure(data: any, requestId: string) {
  console.log(`💥 [${requestId}] Reporting failure: ${data.type}`);
  
  // Here you could send Telegram alerts to admin
  console.log(`🚨 FAILURE ALERT: ${data.type} - ${data.error || 'Unknown error'}`);
  
  return { reported: true, type: data.type };
}

/**
 * Get spam prevention stats
 */
async function handleGetSpamStats(data: any, requestId: string) {
  console.log(`📊 [${requestId}] Getting spam prevention stats...`);
  
  try {
    const stats = await contentSpamPreventer.getUsageStats();
    return stats;
  } catch (error) {
    console.error(`❌ [${requestId}] Error getting spam stats:`, error);
    return { error: 'Failed to get spam stats' };
  }
} 

/**
 * 🆕 Start live monitoring
 */
async function handleStartLiveMonitoring(data: any, requestId: string) {
  console.log(`🔴 [${requestId}] Starting live monitoring...`);
  
  try {
    const response = await fetch('http://localhost:3000/api/live-monitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'start_monitoring',
        intervalSeconds: data.intervalSeconds || 60
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      return { 
        started: true, 
        interval: data.intervalSeconds || 60,
        message: 'Live monitoring started successfully'
      };
    } else {
      return { 
        started: false, 
        error: result.message 
      };
    }
    
  } catch (error: unknown) {
    console.error(`❌ [${requestId}] Error starting live monitoring:`, error);
    return { 
      started: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 🆕 Stop live monitoring
 */
async function handleStopLiveMonitoring(data: any, requestId: string) {
  console.log(`🛑 [${requestId}] Stopping live monitoring...`);
  
  try {
    const response = await fetch('http://localhost:3000/api/live-monitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'stop_monitoring' })
    });
    
    const result = await response.json();
    
    if (result.success) {
      return { 
        stopped: true, 
        message: 'Live monitoring stopped successfully'
      };
    } else {
      return { 
        stopped: false, 
        error: result.message 
      };
    }
    
  } catch (error: unknown) {
    console.error(`❌ [${requestId}] Error stopping live monitoring:`, error);
    return { 
      stopped: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 🆕 Get live monitoring stats
 */
async function handleGetLiveStats(data: any, requestId: string) {
  console.log(`📊 [${requestId}] Getting live monitoring stats...`);
  
  try {
    const response = await fetch('http://localhost:3000/api/live-monitor?action=stats');
    const result = await response.json();
    
    if (result.success) {
      return {
        stats: result.data,
        message: 'Live stats retrieved successfully'
      };
    } else {
      return {
        stats: null,
        error: result.message
      };
    }
    
  } catch (error: unknown) {
    console.error(`❌ [${requestId}] Error getting live stats:`, error);
    return {
      stats: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 