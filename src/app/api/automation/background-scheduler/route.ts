import { NextRequest, NextResponse } from 'next/server';
import { backgroundScheduler } from '@/lib/automation/background-scheduler';

/**
 * GET - Get Background Scheduler status
 */
export async function GET(request: NextRequest) {
  try {
    const stats = await backgroundScheduler.getStats();
    
    return NextResponse.json({
      success: true,
      scheduler: {
        isRunning: backgroundScheduler.isActive(),
        status: backgroundScheduler.isActive() ? 'running' : 'stopped',
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

    switch (action) {
      case 'start':
        backgroundScheduler.start();
        return NextResponse.json({
          success: true,
          message: 'Background Scheduler started successfully',
          isRunning: backgroundScheduler.isActive()
        });

      case 'stop':
        backgroundScheduler.stop();
        return NextResponse.json({
          success: true,
          message: 'Background Scheduler stopped successfully',
          isRunning: backgroundScheduler.isActive()
        });

      case 'restart':
        backgroundScheduler.stop();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait one second
        backgroundScheduler.start();
        return NextResponse.json({
          success: true,
          message: 'Background Scheduler restarted successfully',
          isRunning: backgroundScheduler.isActive()
        });

      case 'status':
        const stats = await backgroundScheduler.getStats();
        return NextResponse.json({
          success: true,
          scheduler: {
            isRunning: backgroundScheduler.isActive(),
            status: backgroundScheduler.isActive() ? 'running' : 'stopped',
            ...stats
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Options: start, stop, restart, status'
        }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'unknown error'
    }, { status: 500 });
  }
} 