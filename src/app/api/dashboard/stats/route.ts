/**
 * 📊 Dashboard Statistics API
 * Provides real-time dashboard data from Supabase
 */

import { NextRequest, NextResponse } from 'next/server';
import { dashboardService } from '@/lib/dashboard/dashboard-service';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Fetching dashboard statistics...');
    
    const { searchParams } = new URL(request.url);
    const includeMetrics = searchParams.get('metrics') === 'true';
    const includeActivity = searchParams.get('activity') === 'true';
    
    // Fetch data in parallel based on query parameters
    const promises = [dashboardService.getDashboardStats()];
    
    if (includeMetrics) {
      promises.push(dashboardService.getPerformanceMetrics());
    }
    
    if (includeActivity) {
      promises.push(dashboardService.getRecentActivity());
    }
    
    const results = await Promise.all(promises);
    
    const response: any = {
      success: true,
      stats: results[0],
      timestamp: new Date().toISOString()
    };
    
    if (includeMetrics && results[1]) {
      response.metrics = results[1];
    }
    
    if (includeActivity && results[includeMetrics ? 2 : 1]) {
      response.activity = results[includeMetrics ? 2 : 1];
    }
    
    console.log('✅ Dashboard statistics fetched successfully', {
      totalBots: response.stats.totalBots,
      totalChannels: response.stats.totalChannels,
      includeMetrics,
      includeActivity
    });
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching dashboard statistics:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch dashboard statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshCache = false } = body;
    
    if (refreshCache) {
      console.log('🔄 Refreshing dashboard cache...');
      
      // Force refresh all dashboard data
      const [stats, metrics, activity] = await Promise.all([
        dashboardService.getDashboardStats(),
        dashboardService.getPerformanceMetrics(),
        dashboardService.getRecentActivity()
      ]);
      
      return NextResponse.json({
        success: true,
        message: 'Dashboard cache refreshed successfully',
        stats,
        metrics,
        activity,
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid request parameters'
    }, { status: 400 });
    
  } catch (error) {
    console.error('❌ Error in dashboard POST request:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process dashboard request',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}