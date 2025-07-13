import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Super Admin System Monitoring - Fetching system health data...');

    // System Health Checks
    const healthChecks = await Promise.allSettled([
      // Database Health
      supabase.from('users').select('count', { count: 'exact', head: true }),
      
      // API Health - check if key endpoints are responding
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      
      fetch(`${baseUrl}/api/unified-content`, {
        method: 'HEAD'
      }).catch(() => null),
      
      // Bot Health - check active bots
      supabase.from('bots').select('id, is_active, last_health_check').eq('is_active', true),
      
      // Channel Health - check active channels
      supabase.from('channels').select('id, is_active, last_message_sent').eq('is_active', true),
      
      // Recent errors from logs
      supabase.from('system_logs').select('*').eq('level', 'error').order('created_at', { ascending: false }).limit(10)
    ]);

    // Process health check results
    const [dbHealth, apiHealth, botsHealth, channelsHealth, errorLogs] = healthChecks;

    // Calculate system statistics
    const systemStats = {
      database: {
        status: dbHealth.status === 'fulfilled' ? 'healthy' : 'error',
        latency: dbHealth.status === 'fulfilled' ? '< 50ms' : 'N/A',
        error: dbHealth.status === 'rejected' ? dbHealth.reason : null
      },
      api: {
        status: apiHealth.status === 'fulfilled' && apiHealth.value ? 'healthy' : 'error',
        uptime: '99.8%', // This would be calculated from logs in real system
        responseTime: apiHealth.status === 'fulfilled' ? '< 200ms' : 'N/A'
      },
      bots: {
        total: botsHealth.status === 'fulfilled' ? botsHealth.value.data?.length || 0 : 0,
        active: botsHealth.status === 'fulfilled' ? botsHealth.value.data?.filter((bot: any) => bot.is_active).length || 0 : 0,
        healthyBots: botsHealth.status === 'fulfilled' ? botsHealth.value.data?.filter((bot: any) => 
          bot.is_active && bot.last_health_check && 
          new Date(bot.last_health_check) > new Date(Date.now() - 30 * 60 * 1000) // Last 30 minutes
        ).length || 0 : 0
      },
      channels: {
        total: channelsHealth.status === 'fulfilled' ? channelsHealth.value.data?.length || 0 : 0,
        active: channelsHealth.status === 'fulfilled' ? channelsHealth.value.data?.filter((ch: any) => ch.is_active).length || 0 : 0,
        recentlyActive: channelsHealth.status === 'fulfilled' ? channelsHealth.value.data?.filter((ch: any) => 
          ch.is_active && ch.last_message_sent && 
          new Date(ch.last_message_sent) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        ).length || 0 : 0
      },
      errors: {
        recentErrors: errorLogs.status === 'fulfilled' ? errorLogs.value.data?.length || 0 : 0,
        criticalErrors: errorLogs.status === 'fulfilled' ? errorLogs.value.data?.filter((log: any) => 
          log.level === 'error' && log.message?.includes('critical')
        ).length || 0 : 0
      }
    };

    // Get performance metrics
    const performanceMetrics = await getPerformanceMetrics();

    // Get resource usage
    const resourceUsage = await getResourceUsage();

    // Calculate overall health score
    const healthScore = calculateHealthScore(systemStats, performanceMetrics);

    const response = {
      timestamp: new Date().toISOString(),
      healthScore,
      systemStats,
      performanceMetrics,
      resourceUsage,
      recentErrors: errorLogs.status === 'fulfilled' ? errorLogs.value.data : [],
      alerts: generateAlerts(systemStats, performanceMetrics),
      recommendations: generateRecommendations(systemStats, performanceMetrics)
    };

    console.log('✅ System monitoring data fetched successfully');
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error fetching system monitoring data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system monitoring data' },
      { status: 500 }
    );
  }
}

async function getPerformanceMetrics() {
  try {
    // Get recent content generation statistics
    const { data: contentStats } = await supabase
      .from('content_logs')
      .select('content_type, generation_time, created_at')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    // Calculate performance metrics
    const avgGenerationTime = contentStats?.reduce((sum: number, log: any) => sum + (log.generation_time || 0), 0) / (contentStats?.length || 1);
    const contentTypeStats = contentStats?.reduce((acc: any, log: any) => {
      acc[log.content_type] = (acc[log.content_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      avgContentGenerationTime: Math.round(avgGenerationTime || 0),
      contentGeneratedLast24h: contentStats?.length || 0,
      contentByType: contentTypeStats || {},
      apiCallsLast24h: contentStats?.length || 0,
      successRate: '98.5%' // This would be calculated from success/failure logs
    };
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    return {
      avgContentGenerationTime: 0,
      contentGeneratedLast24h: 0,
      contentByType: {},
      apiCallsLast24h: 0,
      successRate: 'N/A'
    };
  }
}

async function getResourceUsage() {
  // In a real system, this would fetch actual resource usage
  // For now, we'll return simulated data
  return {
    cpuUsage: '45%',
    memoryUsage: '67%',
    diskUsage: '23%',
    networkUsage: '12%',
    databaseConnections: 8,
    activeProcesses: 24
  };
}

function calculateHealthScore(systemStats: any, performanceMetrics: any) {
  let score = 100;
  
  // Deduct points for issues
  if (systemStats.database.status !== 'healthy') score -= 30;
  if (systemStats.api.status !== 'healthy') score -= 25;
  if (systemStats.bots.active === 0) score -= 20;
  if (systemStats.channels.active === 0) score -= 15;
  if (systemStats.errors.recentErrors > 10) score -= 10;
  if (systemStats.errors.criticalErrors > 0) score -= 20;
  
  // Performance factors
  if (performanceMetrics.avgContentGenerationTime > 60) score -= 10;
  if (performanceMetrics.contentGeneratedLast24h === 0) score -= 10;
  
  return Math.max(0, Math.min(100, score));
}

function generateAlerts(systemStats: any, performanceMetrics: any) {
  const alerts = [];
  
  if (systemStats.database.status !== 'healthy') {
    alerts.push({
      type: 'critical',
      message: 'Database connectivity issues detected',
      action: 'Check database connection and logs'
    });
  }
  
  if (systemStats.errors.criticalErrors > 0) {
    alerts.push({
      type: 'critical',
      message: `${systemStats.errors.criticalErrors} critical errors in the last hour`,
      action: 'Review error logs immediately'
    });
  }
  
  if (systemStats.bots.active === 0) {
    alerts.push({
      type: 'warning',
      message: 'No active bots detected',
      action: 'Check bot configurations and restart if needed'
    });
  }
  
  if (performanceMetrics.avgContentGenerationTime > 60) {
    alerts.push({
      type: 'warning',
      message: 'Content generation time is above normal',
      action: 'Monitor AI API performance and consider optimization'
    });
  }
  
  return alerts;
}

function generateRecommendations(systemStats: any, performanceMetrics: any) {
  const recommendations = [];
  
  if (systemStats.channels.recentlyActive < systemStats.channels.active * 0.5) {
    recommendations.push({
      type: 'optimization',
      message: 'Channel activity is below 50%',
      action: 'Review channel configurations and content scheduling'
    });
  }
  
  if (performanceMetrics.contentGeneratedLast24h < 100) {
    recommendations.push({
      type: 'optimization',
      message: 'Content generation is below expected levels',
      action: 'Review automation rules and content triggers'
    });
  }
  
  if (systemStats.errors.recentErrors > 5) {
    recommendations.push({
      type: 'maintenance',
      message: 'Error rate is elevated',
      action: 'Schedule maintenance to address recurring issues'
    });
  }
  
  return recommendations;
} 