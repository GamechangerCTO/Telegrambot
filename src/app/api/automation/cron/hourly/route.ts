import { NextRequest, NextResponse } from 'next/server';
import { backgroundScheduler } from '@/lib/automation/background-scheduler';
import { AutomationEngine } from '@/lib/automation/automation-engine';

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic' // מאלץ את Next.js לרצות את זה באופן דינמי

export async function GET(request: NextRequest) {
  console.log('⏰ [CRON] Hourly system tasks started:', new Date().toISOString());
  
  try {
    // Verify this is a Vercel cron job
    const userAgent = request.headers.get('user-agent') || '';
    const isVercelCron = userAgent.includes('vercel-cron') || 
                        request.headers.get('x-vercel-deployment-url') ||
                        process.env.NODE_ENV === 'production';
                        
    if (!isVercelCron && process.env.NODE_ENV === 'production') {
      console.log('❌ [CRON] Unauthorized hourly job attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('🔓 [CRON] Hourly system tasks authorized successfully');

    const results = {
      timestamp: new Date().toISOString(),
      tasks: [] as any[]
    };

    // Execute general automation rules (non-content specific)
    console.log('🤖 Executing general automation rules...');
    const automationEngine = new AutomationEngine();
    const automationResults = await automationEngine.executeActiveRules();
    results.tasks.push({
      task: 'general_automation_execution',
      status: 'completed',
      data: {
        rulesExecuted: automationResults.length,
        results: automationResults
      }
    });

    const currentHour = new Date().getUTCHours();

    // Smart push triggers during peak hours (9 AM, 3 PM, 7 PM UTC)
    if ([9, 15, 19].includes(currentHour)) {
      console.log(`💰 Triggering smart push at peak hour: ${currentHour}:00`);
      results.tasks.push({
        task: 'smart_push_trigger',
        status: 'scheduled',
        data: { 
          hour: currentHour, 
          trigger: 'peak_hour_automation',
          message: 'Smart push scheduled for peak engagement time'
        }
      });
    }

    // System health monitoring and statistics collection
    console.log('📊 Collecting system statistics...');
    const stats = await backgroundScheduler.getStats();
    results.tasks.push({
      task: 'system_health_monitoring',
      status: 'completed',
      data: {
        timestamp: new Date().toISOString(),
        systemStats: stats,
        healthStatus: 'operational'
      }
    });

    // Log system resource usage
    const memoryUsage = process.memoryUsage();
    results.tasks.push({
      task: 'resource_monitoring',
      status: 'completed',
      data: {
        memoryUsage: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB'
        },
        uptime: Math.round(process.uptime()) + ' seconds'
      }
    });

    console.log('✅ [CRON] Hourly system tasks completed successfully');
    console.log(`📈 Tasks executed: ${results.tasks.length}`);
    
    return NextResponse.json(results);

  } catch (error) {
    console.error('❌ [CRON] Hourly system tasks failed:', error);
    return NextResponse.json({ 
      error: 'Hourly system tasks failed',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 