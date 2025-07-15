import { NextRequest, NextResponse } from 'next/server';
import { backgroundScheduler } from '@/lib/automation/background-scheduler';
import { AutomationEngine } from '@/lib/automation/automation-engine';
import { BettingTipsGenerator } from '@/lib/content/betting-tips-generator';
import { OptimizedNewsContentGenerator } from '@/lib/content/news-content-generator';
import { MatchAnalysisGenerator } from '@/lib/content/match-analysis-generator';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  console.log('⏰ [CRON] Hourly job started:', new Date().toISOString());
  
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
    
    console.log('🔓 [CRON] Hourly job authorized successfully');

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

    // Initialize generators
    const bettingGenerator = new BettingTipsGenerator();
    const newsGenerator = new OptimizedNewsContentGenerator();
    const analysisGenerator = new MatchAnalysisGenerator();
    
    const currentHour = new Date().getUTCHours();

    // Betting tips generation (every hour during active time)
    if (currentHour >= 8 && currentHour <= 22) {
      try {
        console.log('🎯 Generating betting tips...');
        
        // Get active channels for betting content
        const { data: channels } = await supabase
          .from('channels')
          .select('id, language, bot_id')
          .eq('is_active', true);

        if (channels && channels.length > 0) {
          // Generate betting tips for each channel
          for (const channel of channels.slice(0, 2)) { // Limit to 2 channels per hour
            const bettingResult = await bettingGenerator.generateBettingTips({
              language: channel.language as 'en' | 'am' | 'sw',
              channelId: channel.id,
              maxPredictions: 3,
              riskTolerance: 'moderate'
            });

            results.tasks.push({
              task: 'betting_tips_generation',
              channel: channel.id,
              status: bettingResult ? 'completed' : 'failed',
              data: bettingResult
            });
          }
        }
      } catch (error) {
        results.tasks.push({
          task: 'betting_tips_generation',
          status: 'error',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // News content generation (every 2 hours)
    if (currentHour % 2 === 0) {
      try {
        console.log('📰 Generating news content...');
        
        const { data: channels } = await supabase
          .from('channels')
          .select('id, language, bot_id')
          .eq('is_active', true);

        if (channels && channels.length > 0) {
          for (const channel of channels.slice(0, 3)) { // Limit to 3 channels per hour
            const newsResult = await newsGenerator.generateNewsContent({
              language: channel.language as 'en' | 'am' | 'sw',
              channelId: channel.id,
              maxResults: 1,
              excludeUsedContent: true
            });

            results.tasks.push({
              task: 'news_generation',
              channel: channel.id,
              status: newsResult ? 'completed' : 'failed',
              data: newsResult
            });
          }
        }
      } catch (error) {
        results.tasks.push({
          task: 'news_generation',
          status: 'error',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Match analysis generation (every 3 hours during peak time)
    if ([9, 12, 15, 18, 21].includes(currentHour)) {
      try {
        console.log('⚽ Generating match analysis...');
        
        const { data: channels } = await supabase
          .from('channels')
          .select('id, language, bot_id')
          .eq('is_active', true);

        if (channels && channels.length > 0) {
          // Generate match analysis for each channel
          for (const channel of channels.slice(0, 2)) { // Limit to 2 channels
            const analysisResult = await analysisGenerator.generateMatchAnalysis({
              language: channel.language as 'en' | 'am' | 'sw',
              channelId: channel.id,
              analysisDepth: 'detailed',
              focusAreas: ['statistics', 'predictions', 'h2h']
            });

            results.tasks.push({
              task: 'match_analysis_generation',
              channel: channel.id,
              status: analysisResult ? 'completed' : 'failed',
              data: analysisResult
            });
          }
        }
      } catch (error) {
        results.tasks.push({
          task: 'match_analysis_generation',
          status: 'error',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    // Check for pending content and smart push opportunities
    
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