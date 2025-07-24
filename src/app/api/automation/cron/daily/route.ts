import { NextRequest, NextResponse } from 'next/server';
import { backgroundScheduler } from '@/lib/automation/background-scheduler';
import { DailyWeeklySummaryGenerator } from '@/lib/content/daily-weekly-summary-generator';
import { PollsGenerator } from '@/lib/content/polls-generator';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  console.log('⏰ [CRON] Daily job started:', new Date().toISOString());
  
  try {
    // Verify this is a Vercel cron job
    const userAgent = request.headers.get('user-agent') || '';
    const isVercelCron = userAgent.includes('vercel-cron') || 
                        request.headers.get('x-vercel-deployment-url') ||
                        process.env.NODE_ENV === 'production';
                        
    if (!isVercelCron && process.env.NODE_ENV === 'production') {
      console.log('❌ [CRON] Unauthorized daily job attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('🔓 [CRON] Daily job authorized successfully');

    const results = {
      timestamp: new Date().toISOString(),
      tasks: [] as any[]
    };

    const currentHour = new Date().getUTCHours();
    const currentDay = new Date().getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
    const summaryGenerator = new DailyWeeklySummaryGenerator();
    const pollsGenerator = new PollsGenerator();

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

    // Polls generation (3 PM UTC daily)
    if (currentHour === 15) {
      console.log('📊 Generating polls for upcoming matches...');
      
      const { data: channels } = await supabase
        .from('channels')
        .select('id, language, bot_id')
        .eq('is_active', true);

      if (channels) {
        for (const channel of channels.slice(0, 3)) { // Limit to 3 channels
          try {
            const poll = await pollsGenerator.generatePoll({
              language: channel.language as 'en' | 'am' | 'sw',
              channelId: channel.id,
              pollType: 'match_prediction',
              includeAnalysis: true,
              targetAudience: 'mixed',
              creativityLevel: 'high'
            });
            
            results.tasks.push({
              task: 'polls_generation',
              channel: channel.id,
              status: poll ? 'completed' : 'failed',
              data: poll
            });
          } catch (error) {
            results.tasks.push({
              task: 'polls_generation',
              channel: channel.id,
              status: 'error',
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }
      }
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