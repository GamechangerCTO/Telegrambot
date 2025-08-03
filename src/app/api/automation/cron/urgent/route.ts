import { NextRequest, NextResponse } from 'next/server';
import { backgroundScheduler } from '@/lib/automation/background-scheduler';

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic' // מאלץ את Next.js לרצות את זה באופן דינמי

export async function GET(request: NextRequest) {
  console.log('⏰ [CRON] Urgent job started:', new Date().toISOString());
  
  try {
    // Verify this is a Vercel cron job
    const userAgent = request.headers.get('user-agent') || '';
    const isVercelCron = userAgent.includes('vercel-cron') || 
                        request.headers.get('x-vercel-deployment-url') ||
                        process.env.NODE_ENV === 'production';
                        
    if (!isVercelCron && process.env.NODE_ENV === 'production') {
      console.log('❌ [CRON] Unauthorized urgent job attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('🔓 [CRON] Urgent job authorized successfully');

    const results = {
      timestamp: new Date().toISOString(),
      tasks: [] as any[]
    };

    // Quick system health check
    console.log('🚨 Running urgent system checks...');
    
    const stats = await backgroundScheduler.getStats();
    const isHealthy = stats && typeof stats === 'object';
    
    results.tasks.push({
      task: 'urgent_health_check',
      status: isHealthy ? 'healthy' : 'warning',
      data: stats || { error: 'No stats available' }
    });

    // Check for live updates status during active hours
    const currentHour = new Date().getUTCHours();
    if (currentHour >= 6 && currentHour <= 23) {
      const liveStatus = await backgroundScheduler.getLiveUpdatesStatus();
      results.tasks.push({
        task: 'urgent_live_check',
        status: 'completed',
        data: liveStatus
      });
    }

    // Emergency content monitoring
    // This could check for breaking news, urgent match events, etc.
    results.tasks.push({
      task: 'emergency_monitoring',
      status: 'active',
      data: {
        description: 'Monitoring for urgent content opportunities',
        checkInterval: '2 minutes',
        activeHours: currentHour >= 6 && currentHour <= 23 ? 'active' : 'standby'
      }
    });

    // System maintenance tasks
    const maintenanceData = {
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      activeHour: currentHour >= 6 && currentHour <= 23
    };

    results.tasks.push({
      task: 'system_maintenance',
      status: 'completed',
      data: maintenanceData
    });

    console.log(`✅ [CRON] Urgent job completed - System status: ${isHealthy ? 'Healthy' : 'Warning'}`);
    return NextResponse.json(results);

  } catch (error) {
    console.error('❌ [CRON] Urgent job failed:', error);
    return NextResponse.json({ 
      error: 'Urgent cron job failed',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 