/**
 * 🩺 Dashboard Health Check API
 * Monitors dashboard connectivity to Supabase
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET() {
  const startTime = Date.now();
  
  try {
    const supabase = createClient();
    
    // Test basic connectivity
    const { data: healthCheck, error } = await supabase
      .from('bots')
      .select('count')
      .limit(1)
      .single();
    
    if (error) {
      throw error;
    }
    
    const responseTime = Date.now() - startTime;
    
    // Test additional table connectivity
    const tables = ['bots', 'channels', 'posts', 'automation_logs'];
    const tableTests = await Promise.allSettled(
      tables.map(async (table) => {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        return { table, count, status: 'healthy' };
      })
    );
    
    const tableStatus = tableTests.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          table: tables[index],
          count: 0,
          status: 'error',
          error: result.reason?.message || 'Unknown error'
        };
      }
    });
    
    const healthyTables = tableStatus.filter(t => t.status === 'healthy').length;
    const totalTables = tables.length;
    const healthScore = Math.round((healthyTables / totalTables) * 100);
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        responseTime: responseTime,
        healthScore: healthScore
      },
      tables: tableStatus,
      summary: {
        healthyTables,
        totalTables,
        status: healthScore >= 75 ? 'healthy' : 'degraded'
      }
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.error('❌ Dashboard health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        responseTime: responseTime,
        healthScore: 0
      },
      error: error instanceof Error ? error.message : 'Unknown error',
      summary: {
        healthyTables: 0,
        totalTables: 4,
        status: 'critical'
      }
    }, { status: 503 });
  }
}