import { NextRequest, NextResponse } from 'next/server';

/**
 * 🔍 Vercel Automation Status Checker
 * 
 * Diagnoses why automation might not be working in Vercel production
 */
export async function GET(request: NextRequest) {
  try {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: !!process.env.VERCEL,
        VERCEL_URL: process.env.VERCEL_URL || 'not-set',
        deployment_type: process.env.VERCEL ? 'vercel-production' : 'local-development'
      },
      cron_endpoints: {
        minute: '/api/automation/cron/minute',
        hourly: '/api/automation/cron/hourly', 
        daily: '/api/automation/cron/daily'
      },
      vercel_config: {
        crons_configured: true, // Based on vercel.json
        max_duration: '60s for cron, 180s for content generation'
      }
    };

    // Test database connection
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data, error } = await supabase
        .from('automation_rules')
        .select('count(*)')
        .single();
      
      diagnostics.database = {
        status: error ? 'error' : 'connected',
        error: error?.message,
        tables_accessible: !error
      };
    } catch (dbError) {
      diagnostics.database = {
        status: 'error',
        error: dbError instanceof Error ? dbError.message : 'Unknown database error'
      };
    }

    // Check automation settings
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data: settings } = await supabase
        .from('automation_settings')
        .select('full_automation_enabled')
        .eq('organization_id', 'default')
        .single();
      
      diagnostics.automation_settings = {
        full_automation_enabled: settings?.full_automation_enabled || false,
        settings_exist: !!settings
      };
    } catch (settingsError) {
      diagnostics.automation_settings = {
        error: settingsError instanceof Error ? settingsError.message : 'Unknown settings error'
      };
    }

    // Manual test of cron endpoints
    const cronTests: any = {};
    
    try {
      // Test minute cron
      const minuteResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/automation/cron/minute`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Vercel-Status-Checker'
        }
      });
      cronTests.minute = {
        status: minuteResponse.status,
        ok: minuteResponse.ok,
        url: `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/automation/cron/minute`
      };
    } catch (error) {
      cronTests.minute = {
        error: error instanceof Error ? error.message : 'Fetch failed'
      };
    }

    diagnostics.cron_tests = cronTests;

    // Recommendations based on findings
    const recommendations = [];
    
    if (!diagnostics.automation_settings.full_automation_enabled) {
      recommendations.push('🔧 Enable full automation in settings');
    }
    
    if (diagnostics.database.status === 'error') {
      recommendations.push('🗃️ Fix database connection issues');
    }
    
    if (!process.env.VERCEL) {
      recommendations.push('🚀 This is running locally - deploy to Vercel for cron jobs');
    }
    
    if (process.env.VERCEL && !process.env.VERCEL_URL) {
      recommendations.push('🌐 VERCEL_URL environment variable not set');
    }

    diagnostics.recommendations = recommendations;

    return NextResponse.json({
      success: true,
      ...diagnostics
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 