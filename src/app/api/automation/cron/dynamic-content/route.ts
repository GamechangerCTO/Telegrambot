import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ContentRouter } from '@/lib/content/api-modules/content-router';
import { TelegramDistributor } from '@/lib/content/api-modules/telegram-distributor';
import { performanceMonitor, type PerformanceMetrics } from '@/lib/automation/performance-monitor';

// 🚀 PERFORMANCE OPTIMIZATION: Cache for smart timing results
let smartTimingCache: {
  lastCheck: number;
  data: any;
} | null = null;

// 🚀 PERFORMANCE OPTIMIZATION: Cache for content patterns
let contentPatternsCache: {
  lastExecuted: { [key: string]: number };
  cooldownPeriods: { [key: string]: number };
} = {
  lastExecuted: {},
  cooldownPeriods: {
    'news': 2 * 60 * 60 * 1000, // 2 hours
    'polls': 3 * 60 * 60 * 1000, // 3 hours  
    'coupons': 4 * 60 * 60 * 1000, // 4 hours
    'betting': 1 * 60 * 60 * 1000 // 1 hour
  }
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * 🎯 SMART CONTENT SCHEDULER - MASTER CRON JOB
 * 
 * Universal content scheduler that replaces all specific cron endpoints.
 * Handles both match-based and general content scheduling intelligently.
 * 
 * Features:
 * - Match-based content scheduling (pre-match, live, post-match)
 * - General content scheduling (news, polls, coupons, smart-push)
 * - Channel-specific targeting with smart preferences
 * - Dynamic timing optimization based on engagement patterns
 * - Consolidated analytics and performance tracking
 * 
 * Flow:
 * 1. Check dynamic_content_schedule for due content (both match & general)
 * 2. Execute match-specific content using match data
 * 3. Execute general content using smart scheduling rules
 * 4. Apply channel-specific settings and preferences
 * 5. Send content via unified distribution system
 * 6. Update analytics and optimize future scheduling
 */

export async function POST(req: NextRequest) {
  console.log('🎯 Dynamic Content Cron: Starting optimized content execution...');

  try {
    const startTime = Date.now();
    let executedContent = 0;
    let errors = 0;

    // 🆕 SMART ADDITION: Check current time for scheduling patterns
    const currentHour = new Date().getUTCHours();
    const currentMinute = new Date().getUTCMinutes();
    console.log(`🕐 Optimized Scheduler executing at ${currentHour}:${currentMinute.toString().padStart(2, '0')} UTC`);

    // 🚀 PERFORMANCE OPTIMIZATION: Quick exit during low-activity periods
    const isLowActivityPeriod = currentHour >= 0 && currentHour <= 5; // 00:00-05:59 UTC
    if (isLowActivityPeriod) {
      console.log('😴 Low activity period detected - skipping execution for performance');
      return NextResponse.json({
        success: true,
        message: 'Skipped execution during low activity period',
        executed: 0,
        optimized: true,
        checked_at: new Date().toISOString()
      });
    }
    
    // 🎯 SMART QUERY: Check for scheduled content using existing content_schedules table
    const { data: dueContent, error: scheduleError } = await supabase
      .from('content_schedules')
      .select('*')
      .eq('is_active', true)
      .eq('hour', currentHour)
      .gte('minute', currentMinute - 5) // Within 5 minutes
      .lte('minute', currentMinute + 5)
      .order('content_priority', { ascending: false });

    if (scheduleError) {
      console.error('❌ Error fetching due content:', scheduleError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch scheduled content',
        details: scheduleError.message 
      }, { status: 500 });
    }

    // 🚀 OPTIMIZED GENERAL CONTENT: Execute with smart cooldown management
    // Always check optimized patterns regardless of scheduled content
    console.log('🔄 Checking optimized content patterns...');
    const generalContentResult = await executeOptimizedContentPatterns(currentHour, currentMinute);
    
    if (!dueContent || dueContent.length === 0) {
      console.log('ℹ️ No scheduled content due, using optimized content patterns only');
      
      if (generalContentResult.executed > 0) {
        const duration = Date.now() - startTime;
        
        // 🚀 PERFORMANCE MONITORING: Record optimized execution
        const performanceMetrics: PerformanceMetrics = {
          executionTime: duration,
          contentGenerated: generalContentResult.executed,
          errorsCount: 0,
          optimizationsApplied: generalContentResult.optimizations || [],
          cacheHits: smartTimingCache ? 1 : 0,
          cacheMisses: smartTimingCache ? 0 : 1,
          timestamp: Date.now()
        };
        performanceMonitor.recordExecution(performanceMetrics);

        console.log(`✅ Executed ${generalContentResult.executed} optimized content items`);
        
        const performanceStats = performanceMonitor.getPerformanceStats();
        
        return NextResponse.json({
          success: true,
          message: 'Optimized content patterns executed',
          executed: generalContentResult.executed,
          patterns: generalContentResult.patterns,
          optimizations_applied: generalContentResult.optimizations,
          performance_stats: performanceStats,
          duration_ms: duration,
          optimized: true,
          checked_at: new Date().toISOString()
        });
      }
      
      console.log('ℹ️ No content due for execution (optimized check)');
      return NextResponse.json({
        success: true,
        message: 'No content due for execution',
        executed: 0,
        optimized: true,
        checked_at: new Date().toISOString()
      });
    }

    console.log(`📋 Found ${dueContent.length} scheduled content items due for execution`);
    
    // Track total execution count including both scheduled and pattern-based content
    executedContent += generalContentResult.executed;

    // Process each due content item
    for (const contentItem of dueContent) {
      try {
        // 🎯 SMART EXECUTION: Handle scheduled content from content_schedules table
        const isMatchBased = false; // content_schedules is for general content, not match-specific
        
        console.log(`🎬 Executing SCHEDULED: ${contentItem.content_type} content at ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);

        // Mark execution time
        await supabase
          .from('content_schedules')
          .update({ 
            last_executed: new Date().toISOString(),
            next_execution: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Next day
          })
          .eq('id', contentItem.id);

        // Execute content generation with smart handling
        const executionResult = await executeScheduledContent(contentItem, isMatchBased);

        if (executionResult.success) {
          executedContent++;
          console.log(`✅ Successfully executed scheduled ${contentItem.content_type}`);
        } else {
          errors++;
          console.error(`❌ Failed to execute scheduled ${contentItem.content_type}:`, executionResult.error);
        }

      } catch (itemError) {
        console.error(`❌ Error processing content item ${contentItem.id}:`, itemError);
        
        // Log error
        console.error(`❌ Error processing scheduled content ${contentItem.id}:`, itemError);

        errors++;
      }
    }

    const duration = Date.now() - startTime;

    // 🚀 PERFORMANCE MONITORING: Record execution metrics
    const performanceMetrics: PerformanceMetrics = {
      executionTime: duration,
      contentGenerated: executedContent,
      errorsCount: errors,
      optimizationsApplied: ['scheduled_content_execution'],
      cacheHits: 0, // Will be populated by optimization functions
      cacheMisses: 0,
      timestamp: Date.now()
    };
    performanceMonitor.recordExecution(performanceMetrics);

    console.log(`🚀 Optimized Dynamic Content Cron completed: ${executedContent} executed, ${errors} errors in ${duration}ms`);

    const performanceStats = performanceMonitor.getPerformanceStats();
    console.log(`📊 Performance Stats: ${JSON.stringify(performanceStats)}`);

    return NextResponse.json({
      success: true,
      executed: executedContent,
      errors: errors,
      duration_ms: duration,
      processed_items: dueContent.length,
      performance_stats: performanceStats,
      optimized: true,
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
 * 🎯 SMART CONTENT EXECUTION - Enhanced for both match-based and general content
 */
async function executeScheduledContent(contentItem: any, isMatchBased: boolean = true) {
  try {
    let match = null;
    
    // 🎯 SMART MATCH FETCHING: Get match data if this is match-based content
    if (isMatchBased && contentItem.match_id) {
      const { data: matchData } = await supabase
        .from('daily_important_matches')
        .select('*')
        .eq('id', contentItem.match_id)
        .single();
      match = matchData;
    }
    const contentRouter = new ContentRouter();
    const telegramDistributor = new TelegramDistributor();

    // Prepare content request for ContentRouter with safe language handling
    const safeLanguage = contentItem.language || 'en'; // Default to English if undefined
    const contentRequest = {
      type: contentItem.content_type as any, // Map to ContentRouter's ContentType
      language: safeLanguage,
      maxItems: 1, // Generate single piece of content for this match
      channelId: 'scheduled-content',
      
      // 🎯 SMART CUSTOM CONTENT: Handle both match-based and general content
      customContent: isMatchBased ? {
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
      } : {
        // General content configuration
        general_content: true,
        subtype: contentItem.content_subtype,
        target_channels: contentItem.target_channels,
        scheduled_execution: true,
        schedule_id: contentItem.id,
        priority: contentItem.priority,
        scheduled_for: contentItem.scheduled_for
      }
    };

    if (isMatchBased && match) {
      console.log(`🎬 Generating ${contentItem.content_type} content for ${match.home_team} vs ${match.away_team}`);
    } else {
      console.log(`🎬 Generating ${contentItem.content_type} general content (scheduled for ${contentItem.scheduled_for})`);
    }

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
        language: safeLanguage as 'en' | 'am' | 'sw',
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

/**
 * 🚀 OPTIMIZED CONTENT PATTERNS - Performance Enhanced Version
 * 
 * Executes content with smart cooldown management and caching:
 * - News: 9:00, 15:00, 21:00 (with 3h cooldown)
 * - Polls: 7:00, 13:00, 19:00 (with 4h cooldown) 
 * - Coupons: 11:00, 17:00 (with 6h cooldown)
 * - Smart Push: Dynamic based on match importance (with 2h cooldown)
 */
async function executeOptimizedContentPatterns(currentHour: number, currentMinute: number) {
  console.log(`🚀 Checking optimized content patterns for ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);
  
  let executed = 0;
  const patterns = [];
  const optimizations = [];
  const contentRouter = new ContentRouter();
  const telegramDistributor = new TelegramDistributor();
  const now = Date.now();

  // 🚀 PERFORMANCE OPTIMIZATION: Check cooldown periods first
  const canExecuteContent = (contentType: string) => {
    const lastExecution = contentPatternsCache.lastExecuted[contentType] || 0;
    const cooldownPeriod = contentPatternsCache.cooldownPeriods[contentType] || 60 * 60 * 1000; // 1h default
    const timeSinceLastExecution = now - lastExecution;
    
    if (timeSinceLastExecution < cooldownPeriod) {
      const remainingMinutes = Math.ceil((cooldownPeriod - timeSinceLastExecution) / (60 * 1000));
      console.log(`⏰ ${contentType} still in cooldown - ${remainingMinutes} minutes remaining`);
      optimizations.push(`${contentType}_cooldown_active`);
      return false;
    }
    return true;
  };

  // 🚀 CACHED SMART TIMING: Use cache to avoid repeated calculations
  const smartTimingResult = await getCachedSmartTiming(currentHour, currentMinute);
  
  // 🚀 OPTIMIZATION: Execute only on scheduled times OR optimal periods
  // Expanded time windows for better coverage: 0-10, 20-40 minutes past the hour
  const isScheduledTime = currentMinute <= 10 || (currentMinute >= 20 && currentMinute <= 40);
  if (!isScheduledTime && !smartTimingResult.isOptimalTime) {
    optimizations.push('skipped_non_optimal_time');
    return { executed: 0, patterns: [], optimizations };
  }

  // 🆕 DYNAMIC BOOST: Increase content frequency during high-importance match periods
  const importanceBoost = smartTimingResult.importanceBoost;
  console.log(`🚀 Smart timing: ${smartTimingResult.reasoning} (boost: ${importanceBoost}x)`);

  // 📰 OPTIMIZED NEWS PATTERNS: Every 3 hours (9, 12, 15, 17, 18, 21) + importance boost
  if (([9, 12, 15, 17, 18, 21].includes(currentHour) || (importanceBoost >= 1.5 && smartTimingResult.isOptimalTime)) && canExecuteContent('news')) {
    console.log(`📰 Executing optimized news pattern at ${currentHour}:00`);
    
    // 🌍 Get all active channels to generate content for each language
    const { data: channels } = await supabase
      .from('channels')
      .select('id, language, name')
      .eq('is_active', true);

    if (channels && channels.length > 0) {
      // Group channels by language
      const languageGroups = channels.reduce((groups: any, channel: any) => {
        const lang = channel.language || 'en';
        if (!groups[lang]) groups[lang] = [];
        groups[lang].push(channel);
        return groups;
      }, {});

      // Generate content for each language
      for (const [language, languageChannels] of Object.entries(languageGroups)) {
        try {
          console.log(`📰 Generating news for ${languageChannels.length} channels in ${language}`);
          
          const newsResult = await contentRouter.generateContent({
            type: 'news',
            language: language as 'en' | 'am' | 'sw',
            maxItems: 1,
            channelId: 'optimized-scheduler',
            targetChannels: languageChannels.map((ch: any) => ch.id)
          });

          if (newsResult.contentItems && newsResult.contentItems.length > 0) {
            await telegramDistributor.sendContentToTelegram({
              content: newsResult.contentItems[0],
              language: language as 'en' | 'am' | 'sw',
              mode: 'optimized_scheduler_news',
              targetChannels: languageChannels.map((ch: any) => ch.id),
              includeImages: true
            });
            executed++;
            patterns.push(`news_${currentHour}h_${language}_optimized`);
            console.log(`✅ Optimized news pattern executed successfully for ${language}`);
          }
        } catch (error) {
          console.error(`❌ Optimized news pattern failed for ${language}:`, error);
        }
      }
      
      contentPatternsCache.lastExecuted['news'] = now;
      optimizations.push('news_cooldown_updated');
    }
  }

  // 📊 OPTIMIZED POLLS PATTERNS: Multiple times per day (7, 13, 17, 19) + importance boost
  if (([7, 13, 17, 19].includes(currentHour) || (importanceBoost >= 2 && smartTimingResult.isOptimalTime)) && canExecuteContent('polls')) {
    console.log(`📊 Executing optimized polls pattern at ${currentHour}:00`);
    
    // 🌍 Get all active channels to generate content for each language
    const { data: channels } = await supabase
      .from('channels')
      .select('id, language, name')
      .eq('is_active', true);

    if (channels && channels.length > 0) {
      // Group channels by language
      const languageGroups = channels.reduce((groups: any, channel: any) => {
        const lang = channel.language || 'en';
        if (!groups[lang]) groups[lang] = [];
        groups[lang].push(channel);
        return groups;
      }, {});

      // Generate content for each language
      for (const [language, languageChannels] of Object.entries(languageGroups)) {
        try {
          console.log(`📊 Generating polls for ${languageChannels.length} channels in ${language}`);
          
          const pollsResult = await contentRouter.generateContent({
            type: 'polls',
            language: language as 'en' | 'am' | 'sw',
            maxItems: 1,
            channelId: 'optimized-scheduler',
            targetChannels: languageChannels.map((ch: any) => ch.id)
          });

          if (pollsResult.contentItems && pollsResult.contentItems.length > 0) {
            await telegramDistributor.sendContentToTelegram({
              content: pollsResult.contentItems[0],
              language: language as 'en' | 'am' | 'sw',
              mode: 'optimized_scheduler_polls',
              targetChannels: languageChannels.map((ch: any) => ch.id),
              includeImages: true
            });
            executed++;
            patterns.push(`polls_${currentHour}h_${language}_optimized`);
            console.log(`✅ Optimized polls pattern executed successfully for ${language}`);
          }
        } catch (error) {
          console.error(`❌ Optimized polls pattern failed for ${language}:`, error);
        }
      }
      
      contentPatternsCache.lastExecuted['polls'] = now;
      optimizations.push('polls_cooldown_updated');
    }
  }

  // 🎫 OPTIMIZED COUPONS PATTERNS: 11:00, 17:00 (with cooldown protection)
  if ([11, 17].includes(currentHour) && canExecuteContent('coupons')) {
    console.log(`🎫 Executing optimized coupons pattern at ${currentHour}:00`);
    try {
      const couponsResult = await contentRouter.generateContent({
        type: 'coupons',
        language: 'en',
        maxItems: 1
      });

      if (couponsResult.contentItems && couponsResult.contentItems.length > 0) {
        await telegramDistributor.sendContentToTelegram({
          content: couponsResult.contentItems[0],
          language: 'en',
          mode: 'optimized_scheduler_coupons',
          includeImages: true
        });
        executed++;
        patterns.push(`coupons_${currentHour}h_optimized`);
        contentPatternsCache.lastExecuted['coupons'] = now;
        optimizations.push('coupons_cooldown_updated');
        console.log(`✅ Optimized coupons pattern executed successfully`);
      }
    } catch (error) {
      console.error(`❌ Optimized coupons pattern failed:`, error);
    }
  }

  // 📱 OPTIMIZED BETTING PATTERNS: Multiple times (15, 17, 19, 21) + live match periods
  if (([15, 17, 19, 21].includes(currentHour) || (importanceBoost >= 2.5 && smartTimingResult.isOptimalTime)) && canExecuteContent('betting')) {
    console.log(`📱 Executing optimized smart push pattern at ${currentHour}:00`);
    
    // 🌍 Get all active channels to generate content for each language
    const { data: channels } = await supabase
      .from('channels')
      .select('id, language, name')
      .eq('is_active', true);

    if (channels && channels.length > 0) {
      // Group channels by language
      const languageGroups = channels.reduce((groups: any, channel: any) => {
        const lang = channel.language || 'en';
        if (!groups[lang]) groups[lang] = [];
        groups[lang].push(channel);
        return groups;
      }, {});

      // Generate content for each language
      for (const [language, languageChannels] of Object.entries(languageGroups)) {
        try {
          console.log(`📱 Generating betting content for ${languageChannels.length} channels in ${language}`);
          
          // Smart push could be betting tips or analysis based on current matches
          const smartPushResult = await contentRouter.generateContent({
            type: 'betting',
            language: language as 'en' | 'am' | 'sw',
            maxItems: 1,
            channelId: 'optimized-scheduler',
            targetChannels: languageChannels.map((ch: any) => ch.id)
          });

          if (smartPushResult.contentItems && smartPushResult.contentItems.length > 0) {
            await telegramDistributor.sendContentToTelegram({
              content: smartPushResult.contentItems[0],
              language: language as 'en' | 'am' | 'sw',
              mode: 'optimized_scheduler_push',
              targetChannels: languageChannels.map((ch: any) => ch.id),
              includeImages: true
            });
            executed++;
            patterns.push(`smart_push_${currentHour}h_${language}_optimized`);
            console.log(`✅ Optimized smart push pattern executed successfully for ${language}`);
          }
        } catch (error) {
          console.error(`❌ Optimized smart push pattern failed for ${language}:`, error);
        }
      }
      
      contentPatternsCache.lastExecuted['betting'] = now;
      optimizations.push('betting_cooldown_updated');
    }
  }

  console.log(`🚀 Optimized content patterns completed: ${executed} executed, patterns: [${patterns.join(', ')}], optimizations: [${optimizations.join(', ')}]`);
  return { executed, patterns, optimizations };
}

/**
 * 🚀 CACHED SMART TIMING - Performance Enhanced Version
 * 
 * Uses caching to avoid repeated database queries and calculations.
 * Cache expires every 15 minutes for optimal balance of performance and accuracy.
 */
async function getCachedSmartTiming(currentHour: number, currentMinute: number) {
  const now = Date.now();
  const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes cache

  // 🚀 PERFORMANCE OPTIMIZATION: Return cached result if still valid
  if (smartTimingCache && (now - smartTimingCache.lastCheck) < CACHE_DURATION) {
    console.log('⚡ Using cached smart timing result');
    return smartTimingCache.data;
  }

  console.log('🔄 Calculating fresh smart timing data...');
  const timingResult = await checkSmartTiming(currentHour, currentMinute);
  
  // Update cache
  smartTimingCache = {
    lastCheck: now,
    data: timingResult
  };

  return timingResult;
}

/**
 * 🎯 SMART TIMING INTELLIGENCE - Core Calculation
 * 
 * Analyzes current context to determine optimal content timing:
 * - Match importance and proximity
 * - Historical engagement patterns
 * - Real-time events detection
 */
async function checkSmartTiming(currentHour: number, currentMinute: number) {
  try {
    // Check for high-importance matches happening soon
    const { data: importantMatches } = await supabase
      .from('daily_important_matches')
      .select('*')
      .eq('discovery_date', new Date().toISOString().split('T')[0])
      .gte('importance_score', 75) // High importance only
      .order('importance_score', { ascending: false });

    let importanceBoost = 1;
    let reasoning = 'Standard timing';
    let isOptimalTime = false;

    if (importantMatches && importantMatches.length > 0) {
      for (const match of importantMatches.slice(0, 3)) { // Check top 3 matches
        const kickoffTime = new Date(match.kickoff_time);
        const now = new Date();
        const hoursUntilKickoff = (kickoffTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        // 🔥 HIGH ENGAGEMENT PERIODS:
        // 2-4 hours before kickoff: 1.5x boost (build anticipation)
        // 30 minutes before kickoff: 2x boost (final rush)
        // During match: 3x boost (live engagement)
        // 2 hours after kickoff: 1.2x boost (post-match analysis)
        
        if (hoursUntilKickoff >= 2 && hoursUntilKickoff <= 4) {
          importanceBoost = Math.max(importanceBoost, 1.5);
          reasoning = `Pre-match anticipation period for ${match.home_team} vs ${match.away_team}`;
          isOptimalTime = true;
        } else if (hoursUntilKickoff >= 0.5 && hoursUntilKickoff <= 2) {
          importanceBoost = Math.max(importanceBoost, 2);
          reasoning = `Final rush period for ${match.home_team} vs ${match.away_team}`;
          isOptimalTime = true;
        } else if (hoursUntilKickoff >= -2 && hoursUntilKickoff <= 0) {
          importanceBoost = Math.max(importanceBoost, 3);
          reasoning = `Live match period for ${match.home_team} vs ${match.away_team}`;
          isOptimalTime = true;
        } else if (hoursUntilKickoff >= -4 && hoursUntilKickoff <= -2) {
          importanceBoost = Math.max(importanceBoost, 1.2);
          reasoning = `Post-match analysis period for ${match.home_team} vs ${match.away_team}`;
          isOptimalTime = true;
        }
      }
    }

    // 🕐 ENGAGEMENT TIME ANALYSIS: Peak hours get natural boost
    const peakHours = [7, 9, 12, 15, 19, 21]; // Based on typical engagement patterns
    if (peakHours.includes(currentHour)) {
      importanceBoost *= 1.1;
      if (reasoning === 'Standard timing') {
        reasoning = `Peak engagement hour (${currentHour}:00)`;
      }
    }

    // 🎮 WEEKEND BOOST: Higher engagement on weekends
    const isWeekend = [0, 6].includes(new Date().getDay());
    if (isWeekend) {
      importanceBoost *= 1.15;
      reasoning += isWeekend ? ' + Weekend boost' : '';
    }

    return {
      isOptimalTime,
      importanceBoost: Math.round(importanceBoost * 100) / 100, // Round to 2 decimals
      reasoning,
      matchContext: importantMatches?.slice(0, 2) || [] // Top 2 matches for context
    };

  } catch (error) {
    console.error('❌ Error in smart timing analysis:', error);
    return {
      isOptimalTime: false,
      importanceBoost: 1,
      reasoning: 'Fallback to standard timing',
      matchContext: []
    };
  }
}

// Allow GET for manual testing
export async function GET(req: NextRequest) {
  return POST(req);
} 