import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Check if full automation is enabled
    const { data: settings, error: settingsError } = await supabase
      .from('automation_settings')
      .select('full_automation_enabled')
      .eq('organization_id', 'default')
      .single();

    // If no settings found or error, assume automation is enabled for production
    const automationEnabled = settingsError ? true : (settings?.full_automation_enabled ?? true);
    
    if (!automationEnabled) {
      console.log('⚠️ Full automation is disabled in settings');
      return NextResponse.json({ 
        success: false, 
        message: 'Full automation is disabled' 
      });
    }
    
    console.log('✅ Full automation is enabled');
    console.log('🔧 Automation Engine Version: 2.0 - Production Logic Fixed');

    const results = {
      timestamp: new Date().toISOString(),
      cycles_run: 0,
      content_generated: 0,
      actions_taken: [] as any[]
    };

    console.log('🚀 Starting automation cycle...');

    // Get active channels and their bots for real delivery
    const { data: activeChannels } = await supabase
      .from('channels')
      .select(`
        id, name, telegram_channel_id, language, is_active,
        bots (
          id, name, telegram_bot_username, telegram_token_encrypted, is_active
        )
      `)
      .eq('is_active', true)
      .eq('bots.is_active', true);

    console.log(`📺 Found ${activeChannels?.length || 0} active channels with bots`);

    if (!activeChannels || activeChannels.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No active channels with bots found',
        results
      });
    }

    // Get active automation rules
    const { data: rules } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('enabled', true);

    console.log(`📋 Found ${rules?.length || 0} active automation rules`);

    if (!rules || rules.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active automation rules',
        results
      });
    }

    // Process each rule with real channel delivery
    for (const rule of rules) {
      try {
        console.log(`⚙️ Processing rule: ${rule.name} (${rule.content_type})`);
        
        // Find matching channels for this rule
        const matchingChannels = activeChannels.filter((channel: any) => {
          // Check if rule applies to this channel's language
          const ruleLanguages = Array.isArray(rule.languages) ? rule.languages : ['en'];
          const channelLanguage = channel.language || 'en';
          
          return ruleLanguages.includes(channelLanguage) || ruleLanguages.includes('all');
        });

        console.log(`🎯 Found ${matchingChannels.length} matching channels for rule: ${rule.name}`);

        if (matchingChannels.length === 0) {
          console.log(`⏭️ No matching channels for rule: ${rule.name}`);
          results.actions_taken.push({
            rule_id: rule.id,
            rule_name: rule.name,
            type: rule.automation_type,
            content_type: rule.content_type,
            status: 'skipped',
            reason: 'no_matching_channels',
            timestamp: new Date().toISOString()
          });
          continue;
        }

        const cycleResult = await processAutomationRule(rule, matchingChannels);
        if (cycleResult && typeof cycleResult === 'object' && 'content_generated' in cycleResult) {
          results.cycles_run++;
          results.content_generated += cycleResult.content_generated || 0;
          results.actions_taken.push(cycleResult.action);
          console.log(`✅ Successfully processed: ${rule.name}`);
        } else {
          console.log(`⏭️ Skipped rule: ${rule.name} (conditions not met)`);
          results.actions_taken.push({
            rule_id: rule.id,
            rule_name: rule.name,
            type: rule.automation_type,
            content_type: rule.content_type,
            status: 'skipped',
            reason: 'conditions_not_met',
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error(`❌ Error processing rule ${rule.id}:`, error);
        results.actions_taken.push({
          rule_id: rule.id,
          rule_name: rule.name,
          type: rule.automation_type,
          content_type: rule.content_type,
          status: 'error',
          error: (error as Error).message,
          timestamp: new Date().toISOString()
        });
      }
    }

    console.log(`🎯 Automation cycle completed: ${results.cycles_run} rules processed, ${results.content_generated} content generated`);

    return NextResponse.json({
      success: true,
      message: `Automation cycle completed. ${results.cycles_run} rules processed.`,
      results
    });

  } catch (error) {
    console.error('❌ Auto-scheduler error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Auto-scheduler failed',
      details: (error as Error).message
    }, { status: 500 });
  }
}

async function processAutomationRule(rule: any, channels: any[]) {
  const now = new Date();
  
  console.log(`🔍 DEBUG: processAutomationRule - Rule: ${rule.name}, Type: ${rule.automation_type}`);
  
  let result;
  switch (rule.automation_type) {
    case 'scheduled':
      result = await processScheduledRule(rule, channels, now);
      break;
    
    case 'event_driven':
      result = await processEventDrivenRule(rule, channels, now);
      break;
    
    case 'context_aware':
      result = await processContextAwareRule(rule, channels, now);
      break;
    
    default:
      console.log(`🔍 DEBUG: Unknown automation_type: ${rule.automation_type}`);
      result = null;
  }
  
  console.log(`🔍 DEBUG: processAutomationRule result:`, result ? 'SUCCESS' : 'NULL');
  return result;
}

async function processScheduledRule(rule: any, channels: any[], now: Date) {
  // Check if this is a local development environment or production deployment
  const isLocalDevelopment = !process.env.VERCEL && process.env.NODE_ENV === 'development';
  const isProductionDeployment = process.env.VERCEL && process.env.NODE_ENV === 'production';
  
  console.log(`🔍 DEBUG: processScheduledRule - NODE_ENV: ${process.env.NODE_ENV}, VERCEL: ${!!process.env.VERCEL}, isLocal: ${isLocalDevelopment}, isProd: ${isProductionDeployment}`);
  
  // In local development, always trigger for testing
  if (isLocalDevelopment) {
    console.log(`🎯 Local Development: triggering ${rule.content_type} content for ${channels.length} channels`);
    const success = await triggerRealContentGeneration(rule.content_type, channels);
    
    return {
      action: {
        rule_id: rule.id,
        rule_name: rule.name,
        type: 'scheduled',
        content_type: rule.content_type,
        status: success ? 'triggered' : 'failed',
        trigger_reason: 'local_development_immediate',
        channels_targeted: channels.map((c: any) => c.telegram_channel_id),
        timestamp: now.toISOString()
      },
      content_generated: success ? channels.length : 0
    };
  }

  // In production deployment, use proper scheduling logic
  if (isProductionDeployment) {
    console.log(`🏭 Production Mode: checking schedule conditions for ${rule.content_type}`);
    // Fall through to normal scheduling logic below
  }

  const schedule = rule.schedule || {};
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Check if it's time to run - wider window for production reliability
  if (schedule.times && schedule.times.length > 0) {
    const shouldRun = schedule.times.some((time: string) => {
      const [hour, minute] = time.split(':').map(Number);
      // Wider 60-minute window for production reliability
      const windowMinutes = isProductionDeployment ? 60 : 30;
      return currentHour === hour && currentMinute <= minute + windowMinutes;
    });
    
    if (shouldRun) {
      console.log(`⏰ Time-triggered: ${rule.content_type} at ${currentHour}:${currentMinute} for ${channels.length} channels`);
      const success = await triggerRealContentGeneration(rule.content_type, channels);
      
      return {
        action: {
          rule_id: rule.id,
          rule_name: rule.name,
          type: 'scheduled',
          content_type: rule.content_type,
          status: success ? 'triggered' : 'failed',
          trigger_reason: 'scheduled_time_match',
          channels_targeted: channels.map(c => c.telegram_channel_id),
          timestamp: now.toISOString()
        },
        content_generated: success ? channels.length : 0
      };
    }
  }
  
  return null;
}

async function processEventDrivenRule(rule: any, channels: any[], now: Date) {
  // Check environment for proper automation logic
  const isLocalDevelopment = !process.env.VERCEL && process.env.NODE_ENV === 'development';
  const isProductionDeployment = process.env.VERCEL && process.env.NODE_ENV === 'production';
  
  console.log(`🔍 DEBUG: processEventDrivenRule - NODE_ENV: ${process.env.NODE_ENV}, VERCEL: ${!!process.env.VERCEL}, isLocal: ${isLocalDevelopment}, isProd: ${isProductionDeployment}`);
  
  // In local development, trigger for immediate feedback
  if (isLocalDevelopment) {
    console.log(`🎯 Local Development: triggering ${rule.content_type} for ${channels.length} channels`);
    const success = await triggerRealContentGeneration(rule.content_type, channels);
    
    return {
      action: {
        rule_id: rule.id,
        rule_name: rule.name,
        type: 'event_driven',
        content_type: rule.content_type,
        status: success ? 'triggered' : 'failed',
        trigger_reason: 'local_development_simulated_event',
        channels_targeted: channels.map((c: any) => c.telegram_channel_id),
        timestamp: now.toISOString()
      },
      content_generated: success ? channels.length : 0
    };
  }

  // In production deployment, use real event-driven logic
  if (isProductionDeployment) {
    console.log(`🏭 Production Mode: checking event conditions for ${rule.content_type}`);
    
    // Basic production logic - trigger event-driven content during active hours
    const currentHour = now.getHours();
    const isActiveHours = currentHour >= 6 && currentHour <= 23; // 6 AM to 11 PM
    
    if (isActiveHours) {
      console.log(`✅ Event conditions met for ${rule.content_type} during active hours (v2.0)`);
      const success = await triggerRealContentGeneration(rule.content_type, channels);
      
      return {
        action: {
          rule_id: rule.id,
          rule_name: rule.name,
          type: 'event_driven',
          content_type: rule.content_type,
          status: success ? 'triggered' : 'failed',
          trigger_reason: 'event_driven_active_hours',
          channels_targeted: channels.map((c: any) => c.telegram_channel_id),
          timestamp: now.toISOString()
        },
        content_generated: success ? channels.length : 0
      };
    }
    
    console.log(`⏰ Event conditions not met for ${rule.content_type} - outside active hours`);
  return null;
  }

  // Development fallback - more permissive
  console.log(`🔧 Development Mode: triggering ${rule.content_type} for testing`);
  const success = await triggerRealContentGeneration(rule.content_type, channels);
  
  return {
    action: {
      rule_id: rule.id,
      rule_name: rule.name,
      type: 'event_driven',
      content_type: rule.content_type,
      status: success ? 'triggered' : 'failed',
      trigger_reason: 'development_fallback',
      channels_targeted: channels.map((c: any) => c.telegram_channel_id),
      timestamp: now.toISOString()
    },
    content_generated: success ? channels.length : 0
  };
}

async function processContextAwareRule(rule: any, channels: any[], now: Date) {
  // Context-aware rules (like smart coupons) trigger based on recent content
  const isLocalDevelopment = !process.env.VERCEL && process.env.NODE_ENV === 'development';
  const isProductionDeployment = process.env.VERCEL && process.env.NODE_ENV === 'production';
  
  console.log(`🔍 DEBUG: processContextAwareRule - NODE_ENV: ${process.env.NODE_ENV}, VERCEL: ${!!process.env.VERCEL}, isLocal: ${isLocalDevelopment}, isProd: ${isProductionDeployment}`);
  
  // In local development, trigger for immediate feedback
  if (isLocalDevelopment) {
    console.log(`🎯 Local Development: triggering ${rule.content_type} for ${channels.length} channels`);
    const success = await triggerRealContentGeneration(rule.content_type, channels);
    
    return {
      action: {
        rule_id: rule.id,
        rule_name: rule.name,
        type: 'context_aware',
        content_type: rule.content_type,
        status: success ? 'triggered' : 'failed',
        trigger_reason: 'local_development_context_simulation',
        channels_targeted: channels.map((c: any) => c.telegram_channel_id),
        timestamp: now.toISOString()
      },
      content_generated: success ? channels.length : 0
    };
  }

  // In production deployment, use real context-aware logic
  if (isProductionDeployment) {
    console.log(`🏭 Production Mode: checking context conditions for ${rule.content_type}`);
    
    // Basic production logic - trigger context-aware content periodically
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Trigger every 2 hours during active time (8 AM to 8 PM)
    const isActiveTime = currentHour >= 8 && currentHour <= 20;
    const isContextTrigger = currentMinute >= 0 && currentMinute <= 30; // First 30 minutes of every hour
    
    if (isActiveTime && isContextTrigger) {
      console.log(`✅ Context conditions met for ${rule.content_type}`);
      const success = await triggerRealContentGeneration(rule.content_type, channels);
      
      return {
        action: {
          rule_id: rule.id,
          rule_name: rule.name,
          type: 'context_aware',
          content_type: rule.content_type,
          status: success ? 'triggered' : 'failed',
          trigger_reason: 'context_aware_active_window',
          channels_targeted: channels.map((c: any) => c.telegram_channel_id),
          timestamp: now.toISOString()
        },
        content_generated: success ? channels.length : 0
      };
    }
    
    console.log(`⏰ Context conditions not met for ${rule.content_type} - waiting for trigger window`);
  return null;
  }

  // Development fallback - more permissive
  console.log(`🔧 Development Mode: triggering ${rule.content_type} for testing`);
  const success = await triggerRealContentGeneration(rule.content_type, channels);
  
  return {
    action: {
      rule_id: rule.id,
      rule_name: rule.name,
      type: 'context_aware',
      content_type: rule.content_type,
      status: success ? 'triggered' : 'failed',
      trigger_reason: 'development_fallback',
      channels_targeted: channels.map((c: any) => c.telegram_channel_id),
      timestamp: now.toISOString()
    },
    content_generated: success ? channels.length : 0
  };
}

async function triggerRealContentGeneration(contentType: string, channels: any[]) {
  try {
    console.log(`📤 Triggering real content generation: ${contentType} for ${channels.length} channels`);
    console.log(`🔍 DEBUG: triggerRealContentGeneration - Starting for contentType: ${contentType}`);
    
    // Group channels by language for efficient generation
    const channelsByLanguage = channels.reduce((acc, channel) => {
      const language = channel.language || 'en';
      if (!acc[language]) acc[language] = [];
      acc[language].push(channel);
      return acc;
    }, {} as Record<string, any[]>);

    console.log(`🌍 Languages detected:`, Object.keys(channelsByLanguage));

    let totalSuccess = true;

    // Generate content for each language group
    for (const [language, languageChannels] of Object.entries(channelsByLanguage) as [string, any[]][]) {
      try {
        console.log(`🎯 Generating ${contentType} content in ${language} for ${languageChannels.length} channels`);
        
        // Build target channels list for unified-content API
        const targetChannels = languageChannels.map((channel: any) => channel.telegram_channel_id).join(',');
        
        console.log(`🔍 DEBUG: Calling unified-content API directly (no HTTP)`);
        
        const requestBody = {
          contentType: contentType,
          language: language,
          target_channels: targetChannels,
          isAutomated: true // Mark as automated content
        };
        
        console.log(`🔍 DEBUG: Request body:`, requestBody);
        
        // 🚀 Use direct content generation instead of HTTP requests
        console.log(`🔍 DEBUG: Using direct content generation for ${contentType} in ${language}`);
        
        const { contentRouter } = await import('@/lib/content/api-modules/content-router');
        
        const contentResult = await contentRouter.generateContent({
          contentType: contentType,
          language: language,
          channelIds: languageChannels.map(c => c.id),
          isAutomationExecution: true
        });

        if (!contentResult.success) {
          console.error(`❌ Failed to generate ${contentType} content in ${language}:`, contentResult.error);
          totalSuccess = false;
          continue;
        }

        console.log(`✅ Successfully generated ${contentType} content in ${language}:`, contentResult.message || 'Success');
        
        // If content was generated, distribute it to channels
        if (contentResult.content_items && contentResult.content_items.length > 0) {
          const { TelegramDistributor } = await import('@/lib/content/api-modules/telegram-distributor');
          const telegramDistributor = new TelegramDistributor();
          
          const distributionResult = await telegramDistributor.sendContentToTelegram({
            content: {
              content_type: contentType,
              content_items: contentResult.content_items
            },
            language: language as any,
            mode: 'automation',
            targetChannels: languageChannels.map(c => c.telegram_channel_id),
            includeImages: true,
            manualExecution: false,
            isAutomationExecution: true
          });
          
          console.log(`📤 Distribution result: ${distributionResult.success ? 'Success' : 'Failed'} for ${distributionResult.channels} channels`);
        }

      } catch (error) {
        console.error(`❌ Error generating ${contentType} content in ${language}:`, error);
        totalSuccess = false;
      }
    }

    console.log(`🔍 DEBUG: triggerRealContentGeneration - Final result: ${totalSuccess}`);
    return totalSuccess;

  } catch (error) {
    console.error(`❌ Error in triggerRealContentGeneration:`, error);
    console.log(`🔍 DEBUG: triggerRealContentGeneration - ERROR:`, error);
    return false;
  }
} 