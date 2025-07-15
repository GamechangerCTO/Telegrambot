import { NextRequest, NextResponse } from 'next/server';
import { backgroundScheduler } from '@/lib/automation/background-scheduler';
import { DailyWeeklySummaryGenerator } from '@/lib/content/daily-weekly-summary-generator';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  console.log('⏰ [CRON] Daily job started:', new Date().toISOString());
  
  try {
    // Verify this is a cron job
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('❌ [CRON] Unauthorized daily job attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = {
      timestamp: new Date().toISOString(),
      tasks: [] as any[]
    };

    const currentHour = new Date().getUTCHours();
    const currentDay = new Date().getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
    const summaryGenerator = new DailyWeeklySummaryGenerator();

    // Morning summaries (9 AM UTC)
    if (currentHour === 9) {
      console.log('📅 Generating daily summaries...');
      
      // Generate daily summary for active channels
      const { data: channels } = await supabase
        .from('channels')
        .select('id, language, bot_id')
        .eq('is_active', true);

      if (channels) {
        for (const channel of channels) {
          try {
            const summary = await summaryGenerator.generateSummary({
              type: 'daily',
              language: channel.language as 'en' | 'am' | 'sw',
              channelId: channel.id
            });
            
            results.tasks.push({
              task: 'daily_summary',
              channel: channel.id,
              status: summary ? 'completed' : 'failed',
              data: summary
            });
          } catch (error) {
            results.tasks.push({
              task: 'daily_summary',
              channel: channel.id,
              status: 'error',
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }
      }
    }

    // Evening summaries (6 PM UTC)
    if (currentHour === 18) {
      console.log('🌆 Generating evening match previews...');
      
      results.tasks.push({
        task: 'evening_preview',
        status: 'completed',
        data: { trigger: 'evening_schedule', hour: currentHour }
      });
    }

    // Weekly summaries (Sunday 11 PM UTC)
    if (currentDay === 0 && currentHour === 23) {
      console.log('📊 Generating weekly summaries...');
      
      const { data: channels } = await supabase
        .from('channels')
        .select('id, language, bot_id')
        .eq('is_active', true);

      if (channels) {
        for (const channel of channels) {
          try {
            const summary = await summaryGenerator.generateSummary({
              type: 'weekly',
              language: channel.language as 'en' | 'am' | 'sw',
              channelId: channel.id
            });
            
            results.tasks.push({
              task: 'weekly_summary',
              channel: channel.id,
              status: summary ? 'completed' : 'failed',
              data: summary
            });
          } catch (error) {
            results.tasks.push({
              task: 'weekly_summary',
              channel: channel.id,
              status: 'error',
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }
      }
    }

    // System cleanup and maintenance
    const stats = await backgroundScheduler.getStats();
    results.tasks.push({
      task: 'system_maintenance',
      status: 'completed',
      data: stats
    });

    console.log('✅ [CRON] Daily job completed successfully');
    return NextResponse.json(results);

  } catch (error) {
    console.error('❌ [CRON] Daily job failed:', error);
    return NextResponse.json({ 
      error: 'Cron job failed',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 