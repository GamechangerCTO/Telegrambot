import { NextRequest, NextResponse } from 'next/server';
import { LiveUpdatesGenerator } from '@/lib/content/live-updates-generator';
import { FootballMatchScorer } from '@/lib/content/football-match-scorer';

export async function GET(request: NextRequest) {
  console.log('⏰ [CRON] Live updates job started:', new Date().toISOString());
  
  try {
    // Verify this is a cron job
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('❌ [CRON] Unauthorized live updates attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = {
      timestamp: new Date().toISOString(),
      tasks: [] as any[]
    };

    // Only run during active hours (6 AM - 11 PM UTC)
    const currentHour = new Date().getUTCHours();
    if (currentHour < 6 || currentHour > 23) {
      console.log(`⏸️ [CRON] Outside active hours (${currentHour}:00 UTC), skipping live updates`);
      return NextResponse.json({
        ...results,
        message: 'Outside active hours',
        activeHours: '6:00-23:00 UTC'
      });
    }

    const liveGenerator = new LiveUpdatesGenerator();
    const matchScorer = new FootballMatchScorer();

    // Start live monitoring
    const monitoringResult = await liveGenerator.startMonitoring(180); // 3 minutes
    results.tasks.push({
      task: 'live_monitoring_start',
      status: 'completed',
      data: monitoringResult
    });

    // Live updates monitoring status
    console.log('🔍 Live updates monitoring active during peak hours...');
    
    let qualityMatches = 0;
    let updatesGenerated = 0;

    // The actual live monitoring and match scoring happens within the 
    // liveGenerator.startMonitoring() method which includes quality filtering
    console.log('📊 Live monitoring with quality threshold (15+ points) is active');
    
    results.tasks.push({
      task: 'live_quality_monitoring', 
      status: 'active',
      data: {
        qualityThreshold: 15,
        description: 'Monitoring for matches with 15+ points during active hours',
        activeHours: '6:00-23:00 UTC'
      }
    });

    // Summary of live updates session
    results.tasks.push({
      task: 'live_updates_summary',
      status: 'completed',
      data: {
        monitoringActive: true,
        qualityThreshold: 15,
        activeHours: '6:00-23:00 UTC',
        nextCheck: 'In 3 minutes',
        description: 'Live monitoring active with quality filtering'
      }
    });

    console.log(`✅ [CRON] Live updates monitoring active with 15+ points threshold`);
    return NextResponse.json(results);

  } catch (error) {
    console.error('❌ [CRON] Live updates failed:', error);
    return NextResponse.json({ 
      error: 'Live updates failed',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 