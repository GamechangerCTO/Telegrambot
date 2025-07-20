import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ContentRouter } from '@/lib/content/api-modules/content-router';
import { TelegramDistributor } from '@/lib/content/api-modules/telegram-distributor';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * 🎯 DYNAMIC CONTENT CRON JOB
 * 
 * Executes scheduled content based on match timing and importance.
 * Runs every 5-10 minutes to check for due content and generate it.
 * 
 * Flow:
 * 1. Check dynamic_content_schedule for due content
 * 2. Get match details from daily_important_matches
 * 3. Generate content using appropriate generators
 * 4. Send content to Telegram channels
 * 5. Update schedule status and analytics
 */

export async function POST(req: NextRequest) {
  console.log('🎯 Dynamic Content Cron: Starting scheduled content execution...');

  try {
    const startTime = Date.now();
    let executedContent = 0;
    let errors = 0;

    // Get content that's due for execution (within next 10 minutes)
    const { data: dueContent, error: scheduleError } = await supabase
      .from('dynamic_content_schedule')
      .select(`
        *,
        daily_important_matches(
          home_team,
          away_team,
          competition,
          kickoff_time,
          importance_score,
          external_match_id,
          content_opportunities
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', new Date(Date.now() + 10 * 60 * 1000).toISOString()) // Due within 10 minutes
      .gte('scheduled_for', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Not more than 5 minutes late
      .order('priority', { ascending: false })
      .order('scheduled_for', { ascending: true });

    if (scheduleError) {
      console.error('❌ Error fetching due content:', scheduleError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch scheduled content',
        details: scheduleError.message 
      }, { status: 500 });
    }

    if (!dueContent || dueContent.length === 0) {
      console.log('ℹ️ No content due for execution at this time');
      return NextResponse.json({
        success: true,
        message: 'No content due for execution',
        executed: 0,
        checked_at: new Date().toISOString()
      });
    }

    console.log(`📋 Found ${dueContent.length} content items due for execution`);

    // Process each due content item
    for (const contentItem of dueContent) {
      try {
        console.log(`🎬 Executing: ${contentItem.content_type} for ${contentItem.daily_important_matches.home_team} vs ${contentItem.daily_important_matches.away_team}`);

        // Mark as executing
        await supabase
          .from('dynamic_content_schedule')
          .update({ 
            status: 'executing',
            execution_started_at: new Date().toISOString()
          })
          .eq('id', contentItem.id);

        // Execute content generation
        const executionResult = await executeScheduledContent(contentItem);

        if (executionResult.success) {
          // Mark as completed
          await supabase
            .from('dynamic_content_schedule')
            .update({ 
              status: 'completed',
              execution_completed_at: new Date().toISOString(),
              execution_result: executionResult
            })
            .eq('id', contentItem.id);

          // Record analytics
          await recordContentAnalytics(contentItem, executionResult);
          
          executedContent++;
          console.log(`✅ Successfully executed ${contentItem.content_type}`);
        } else {
          // Mark as failed
          await supabase
            .from('dynamic_content_schedule')
            .update({ 
              status: 'failed',
              execution_completed_at: new Date().toISOString(),
              execution_result: executionResult
            })
            .eq('id', contentItem.id);

          errors++;
          console.error(`❌ Failed to execute ${contentItem.content_type}:`, executionResult.error);
        }

      } catch (itemError) {
        console.error(`❌ Error processing content item ${contentItem.id}:`, itemError);
        
        // Mark as failed
        await supabase
          .from('dynamic_content_schedule')
          .update({ 
            status: 'failed',
            execution_completed_at: new Date().toISOString(),
            execution_result: { 
              success: false, 
              error: itemError instanceof Error ? itemError.message : 'Unknown error' 
            }
          })
          .eq('id', contentItem.id);

        errors++;
      }
    }

    const duration = Date.now() - startTime;

    console.log(`🎯 Dynamic Content Cron completed: ${executedContent} executed, ${errors} errors in ${duration}ms`);

    return NextResponse.json({
      success: true,
      executed: executedContent,
      errors: errors,
      duration_ms: duration,
      processed_items: dueContent.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Dynamic Content Cron error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Dynamic content execution failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Execute scheduled content based on type and configuration
 */
async function executeScheduledContent(contentItem: any) {
  try {
    const match = contentItem.daily_important_matches;
    const contentRouter = new ContentRouter();
    const telegramDistributor = new TelegramDistributor();

    // Prepare content request for ContentRouter
    const contentRequest = {
      type: contentItem.content_type as any, // Map to ContentRouter's ContentType
      language: contentItem.language,
      maxItems: 1, // Generate single piece of content for this match
      channelId: 'scheduled-content',
      
      // Custom content data for match-specific generation
      customContent: {
        match_data: {
          home_team: match.home_team,
          away_team: match.away_team,
          competition: match.competition,
          kickoff_time: match.kickoff_time,
          importance_score: match.importance_score,
          external_match_id: match.external_match_id,
          content_opportunities: match.content_opportunities
        },
        subtype: contentItem.content_subtype,
        target_channels: contentItem.target_channels,
        scheduled_execution: true,
        schedule_id: contentItem.id,
        priority: contentItem.priority
      }
    };

    console.log(`🎬 Generating ${contentItem.content_type} content for ${match.home_team} vs ${match.away_team}`);

    // Step 1: Generate content using ContentRouter
    const result = await contentRouter.generateContent(contentRequest);

    if (!result.contentItems || result.contentItems.length === 0) {
      return {
        success: false,
        error: 'No content generated'
      };
    }

    console.log(`✅ Generated ${contentItem.content_type} content successfully`);

    // Step 2: Send content to Telegram channels
    let telegramResults = null;
    let sendingSuccess = false;

    try {
      const distributionResult = await telegramDistributor.sendContentToTelegram({
        content: {
          content_type: contentItem.content_type,
          language: contentItem.language,
          content_items: result.contentItems
        },
        language: contentItem.language as 'en' | 'am' | 'sw',
        mode: contentItem.content_type,
        targetChannels: contentItem.target_channels,
        includeImages: true
      });

      sendingSuccess = distributionResult.success;
      telegramResults = distributionResult.results;

      if (distributionResult.success) {
        console.log(`📤 Successfully sent ${contentItem.content_type} content to ${distributionResult.channels} channels`);
      } else {
        console.error(`❌ Failed to send ${contentItem.content_type} content:`, distributionResult.error);
      }
    } catch (sendingError) {
      console.error('❌ Error sending content to Telegram:', sendingError);
      sendingSuccess = false;
    }

    return {
      success: true,
      content_items: result.contentItems?.length || 0,
      content_generated: result.contentItems,
      content_sent: sendingSuccess,
      telegram_results: telegramResults,
      processing_info: result.processingInfo,
      content_details: {
        type: contentItem.content_type,
        subtype: contentItem.content_subtype,
        match: `${match.home_team} vs ${match.away_team}`,
        language: contentItem.language,
        scheduled_for: contentItem.scheduled_for,
        channels_sent: sendingSuccess ? (telegramResults?.length || 0) : 0
      }
    };

  } catch (error) {
    console.error('❌ Content execution error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Content generation failed'
    };
  }
}

/**
 * Record content analytics for performance tracking
 */
async function recordContentAnalytics(contentItem: any, executionResult: any) {
  try {
    const match = contentItem.daily_important_matches;
    const kickoffTime = new Date(match.kickoff_time);
    const now = new Date();
    const hoursBeforeKickoff = Math.round((kickoffTime.getTime() - now.getTime()) / (1000 * 60 * 60));

    // Determine content timing
    let contentTiming = 'pre_match';
    if (hoursBeforeKickoff <= 0) {
      contentTiming = hoursBeforeKickoff >= -2 ? 'live' : 'post_match';
    }

    await supabase
      .from('match_content_analytics')
      .insert({
        match_id: contentItem.match_id,
        schedule_id: contentItem.id,
        content_type: contentItem.content_type,
        channels_sent: contentItem.target_channels?.length || 0,
        content_timing: contentTiming,
        hours_before_kickoff: hoursBeforeKickoff,
        execution_duration_ms: 0, // Will be calculated later
        success: executionResult.success,
        created_at: new Date().toISOString()
      });

    console.log(`📊 Analytics recorded for ${contentItem.content_type} content`);

  } catch (analyticsError) {
    console.error('❌ Failed to record analytics:', analyticsError);
    // Don't fail the main execution for analytics errors
  }
}

// Allow GET for manual testing
export async function GET(req: NextRequest) {
  return POST(req);
} 