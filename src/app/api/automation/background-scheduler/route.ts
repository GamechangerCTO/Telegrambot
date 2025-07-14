import { NextRequest, NextResponse } from 'next/server';
import { getSchedulerInstance, ensureSchedulerRunning, initializeScheduler } from '@/lib/automation/auto-start-scheduler';

/**
 * GET - Get Background Scheduler status
 */
export async function GET(request: NextRequest) {
  try {
    // Ensure scheduler is running
    ensureSchedulerRunning();
    
    const scheduler = getSchedulerInstance();
    
    if (!scheduler) {
      return NextResponse.json({
        success: false,
        error: 'Failed to initialize scheduler'
      }, { status: 500 });
    }

    const stats = scheduler.getStats();
    
    return NextResponse.json({
      success: true,
      scheduler: {
        isRunning: scheduler.isActive(),
        status: scheduler.isActive() ? 'running' : 'stopped',
        ...stats
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'unknown error'
    }, { status: 500 });
  }
}

/**
 * POST - Start/stop Background Scheduler
 */
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    let scheduler = getSchedulerInstance();
    
    if (!scheduler) {
      initializeScheduler();
      scheduler = getSchedulerInstance();
    }

    if (!scheduler) {
      return NextResponse.json({
        success: false,
        error: 'Failed to initialize scheduler'
      }, { status: 500 });
    }

    switch (action) {
      case 'start':
        scheduler.start();
        return NextResponse.json({
          success: true,
          message: 'Background Scheduler started successfully',
          isRunning: scheduler.isActive()
        });

      case 'stop':
        scheduler.stop();
        return NextResponse.json({
          success: true,
          message: 'Background Scheduler stopped successfully',
          isRunning: scheduler.isActive()
        });

      case 'restart':
        scheduler.stop();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait one second
        scheduler.start();
        return NextResponse.json({
          success: true,
          message: 'Background Scheduler restarted successfully',
          isRunning: scheduler.isActive()
        });

      case 'status':
        const stats = scheduler.getStats();
        return NextResponse.json({
          success: true,
          scheduler: {
            isRunning: scheduler.isActive(),
            status: scheduler.isActive() ? 'running' : 'stopped',
            ...stats
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use "start", "stop", "restart", or "status"'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Error in Background Scheduler control:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'unknown error'
    }, { status: 500 });
  }
} 