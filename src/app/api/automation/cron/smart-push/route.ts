import { NextRequest, NextResponse } from 'next/server';
import { SmartPushEngine } from '@/lib/content/smart-push-engine';

export async function GET(request: NextRequest) {
  console.log('⏰ [CRON] Smart push job started:', new Date().toISOString());
  
  try {
    // Verify this is a cron job
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('❌ [CRON] Unauthorized smart push attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = {
      timestamp: new Date().toISOString(),
      tasks: [] as any[]
    };

    const currentHour = new Date().getUTCHours();
    const smartPushEngine = new SmartPushEngine();

    // Smart push during peak hours (3 PM, 7 PM UTC)
    if ([15, 19].includes(currentHour)) {
      console.log(`💰 Triggering smart push for peak hour: ${currentHour}:00 UTC`);
      
      // Trigger smart push with high probability for peak hours
      const pushResult = await smartPushEngine.triggerSmartPush({
        primaryContentId: `cron_peak_${currentHour}`,
        primaryContentType: 'betting',
        channelIds: ['all'], // Will be resolved to all active channels
        language: 'en',
        contextData: {
          source: 'cron_peak_hour',
          hour: currentHour,
          probability: 0.85
        }
      });

      results.tasks.push({
        task: 'smart_push_trigger',
        status: 'completed',
        data: {
          hour: currentHour,
          trigger: 'peak_hour',
          result: pushResult
        }
      });
    }

    // Process smart push queue (always run during this cron)
    console.log('📋 Processing smart push queue...');
    const queueResult = await smartPushEngine.processQueue();
    
    results.tasks.push({
      task: 'queue_processing',
      status: 'completed',
      data: queueResult
    });

    // Get smart push status
    const queueStatus = await smartPushEngine.getQueueStatus();
    results.tasks.push({
      task: 'queue_status',
      status: 'completed',
      data: queueStatus
    });

    // Summary
    const summary = {
      currentHour,
      isPeakHour: [15, 19].includes(currentHour),
      queueProcessed: queueResult.processed,
      queueSuccessful: queueResult.successful,
      queueFailed: queueResult.failed,
      pendingItems: queueStatus.pending,
      nextCronRun: '2 hours'
    };

    results.tasks.push({
      task: 'smart_push_summary',
      status: 'completed',
      data: summary
    });

    console.log(`✅ [CRON] Smart push completed - Processed: ${queueResult.processed}, Success: ${queueResult.successful}`);
    return NextResponse.json(results);

  } catch (error) {
    console.error('❌ [CRON] Smart push failed:', error);
    return NextResponse.json({ 
      error: 'Smart push cron failed',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 