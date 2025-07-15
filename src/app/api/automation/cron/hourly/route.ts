import { NextRequest, NextResponse } from 'next/server';
import { backgroundScheduler } from '@/lib/automation/background-scheduler';
import { AutomationEngine } from '@/lib/automation/automation-engine';

export async function GET(request: NextRequest) {
  console.log('⏰ [CRON] Hourly job started:', new Date().toISOString());
  
  try {
    // Verify this is a cron job
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('❌ [CRON] Unauthorized hourly job attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = {
      timestamp: new Date().toISOString(),
      tasks: [] as any[]
    };

    // Execute hourly automation rules
    const automationEngine = new AutomationEngine();
    const automationResults = await automationEngine.executeActiveRules();
    results.tasks.push({
      task: 'automation_execution',
      status: 'completed',
      data: {
        rulesExecuted: automationResults.length,
        results: automationResults
      }
    });

    // Check for pending content and smart push opportunities
    const currentHour = new Date().getUTCHours();
    
    // Smart push during peak hours (9 AM, 3 PM, 7 PM UTC)
    if ([9, 15, 19].includes(currentHour)) {
      results.tasks.push({
        task: 'smart_push_trigger',
        status: 'scheduled',
        data: { hour: currentHour, trigger: 'peak_hour' }
      });
    }

    // Get system stats
    const stats = await backgroundScheduler.getStats();
    results.tasks.push({
      task: 'system_stats',
      status: 'completed',
      data: stats
    });

    console.log('✅ [CRON] Hourly job completed successfully');
    return NextResponse.json(results);

  } catch (error) {
    console.error('❌ [CRON] Hourly job failed:', error);
    return NextResponse.json({ 
      error: 'Cron job failed',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 