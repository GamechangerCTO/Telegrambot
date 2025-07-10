import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Check if full automation is enabled
    const { data: settings } = await supabase
      .from('automation_settings')
      .select('full_automation_enabled')
      .eq('organization_id', 'default')
      .single();

    if (!settings?.full_automation_enabled) {
      return NextResponse.json({ 
        success: false, 
        message: 'Full automation is disabled' 
      });
    }

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
        if (cycleResult) {
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
  
  switch (rule.automation_type) {
    case 'scheduled':
      return await processScheduledRule(rule, channels, now);
    
    case 'event_driven':
      return await processEventDrivenRule(rule, channels, now);
    
    case 'context_aware':
      return await processContextAwareRule(rule, channels, now);
    
    default:
      return null;
  }
}

async function processScheduledRule(rule: any, channels: any[], now: Date) {
  // Always trigger in development or test mode for immediate feedback
  const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  
  if (isDevelopment) {
    console.log(`🎯 Development mode: triggering ${rule.content_type} content for ${channels.length} channels`);
    const success = await triggerRealContentGeneration(rule.content_type, channels);
    
    return {
      action: {
        rule_id: rule.id,
        rule_name: rule.name,
        type: 'scheduled',
        content_type: rule.content_type,
        status: success ? 'triggered' : 'failed',
        trigger_reason: 'development_mode_immediate',
        channels_targeted: channels.map(c => c.telegram_channel_id),
        timestamp: now.toISOString()
      },
      content_generated: success ? channels.length : 0
    };
  }

  const schedule = rule.schedule || {};
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Check if it's time to run - wider window for testing
  if (schedule.times && schedule.times.length > 0) {
    const shouldRun = schedule.times.some((time: string) => {
      const [hour, minute] = time.split(':').map(Number);
      return currentHour === hour && currentMinute <= minute + 15; // 15 minute window
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
  // In development or test mode, trigger for immediate feedback
  const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  
  if (isDevelopment) {
    console.log(`🎯 Development event: triggering ${rule.content_type} for ${channels.length} channels`);
    const success = await triggerRealContentGeneration(rule.content_type, channels);
    
    return {
      action: {
        rule_id: rule.id,
        rule_name: rule.name,
        type: 'event_driven',
        content_type: rule.content_type,
        status: success ? 'triggered' : 'failed',
        trigger_reason: 'development_simulated_event',
        channels_targeted: channels.map(c => c.telegram_channel_id),
        timestamp: now.toISOString()
      },
      content_generated: success ? channels.length : 0
    };
  }

  // Real event-driven logic would check for actual upcoming matches
  // TODO: Add real match detection logic here
  
  return null;
}

async function processContextAwareRule(rule: any, channels: any[], now: Date) {
  // Context-aware rules (like smart coupons) trigger based on recent content
  const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  
  if (isDevelopment) {
    console.log(`🎯 Development context: triggering ${rule.content_type} for ${channels.length} channels`);
    const success = await triggerRealContentGeneration(rule.content_type, channels);
    
    return {
      action: {
        rule_id: rule.id,
        rule_name: rule.name,
        type: 'context_aware',
        content_type: rule.content_type,
        status: success ? 'triggered' : 'failed',
        trigger_reason: 'development_context_simulation',
        channels_targeted: channels.map(c => c.telegram_channel_id),
        timestamp: now.toISOString()
      },
      content_generated: success ? channels.length : 0
    };
  }

  // Real context-aware logic would check recent content delivery
  // TODO: Add real context detection logic here
  
  return null;
}

async function triggerRealContentGeneration(contentType: string, channels: any[]) {
  try {
    console.log(`📤 Triggering real content generation: ${contentType} for ${channels.length} channels`);
    
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
        
        // Call the unified-content API to generate and send content
        const response = await fetch(process.env.NEXT_PUBLIC_BASE_URL + '/api/unified-content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contentType: contentType,
            language: language,
            target_channels: targetChannels,
            isAutomated: true // Mark as automated content
          })
        });

        if (!response.ok) {
          console.error(`❌ Failed to generate ${contentType} content in ${language}:`, response.statusText);
          totalSuccess = false;
          continue;
        }

        const result = await response.json();
        console.log(`✅ Successfully generated ${contentType} content in ${language}:`, result.message);

      } catch (error) {
        console.error(`❌ Error generating ${contentType} content in ${language}:`, error);
        totalSuccess = false;
      }
    }

    return totalSuccess;

  } catch (error) {
    console.error(`❌ Error in triggerRealContentGeneration:`, error);
    return false;
  }
} 