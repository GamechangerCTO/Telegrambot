import { NextRequest, NextResponse } from 'next/server';
import { backgroundScheduler } from '@/lib/automation/background-scheduler';

export async function GET(request: NextRequest) {
  console.log('⏰ [CRON] Minute job started:', new Date().toISOString());
  
  try {
    // Verify this is a cron job
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('❌ [CRON] Unauthorized minute job attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = {
      timestamp: new Date().toISOString(),
      tasks: [] as any[]
    };

    // Quick health checks and urgent monitoring
    const healthStatus = await backgroundScheduler.getStats();
    results.tasks.push({
      task: 'system_health',
      status: 'completed',
      data: healthStatus
    });

    // Live updates monitoring (every minute during active hours)
    const currentHour = new Date().getUTCHours();
    if (currentHour >= 6 && currentHour <= 23) {
      const liveStatus = await backgroundScheduler.getLiveUpdatesStatus();
      results.tasks.push({
        task: 'live_monitoring',
        status: 'completed',
        data: liveStatus
      });
    }

    console.log('✅ [CRON] Minute job completed successfully');
    return NextResponse.json(results);

  } catch (error) {
    console.error('❌ [CRON] Minute job failed:', error);
    return NextResponse.json({ 
      error: 'Cron job failed',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 