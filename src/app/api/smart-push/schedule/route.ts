import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * 🕒 Smart Push Scheduler API
 * 
 * Handles random scheduled coupon sending throughout the day
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      action,           // 'create_schedule' | 'trigger_random' | 'update_settings'
      channel_id,       // For channel-specific settings
      settings          // Schedule settings object
    } = body;

    console.log(`📅 Smart Push Scheduler: ${action}`);

    switch (action) {
      case 'create_schedule':
        return await createDailySchedule();
        
      case 'trigger_random':
        return await triggerRandomCoupon(channel_id);
        
      case 'update_settings':
        return await updateChannelSettings(channel_id, settings);
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in smart push scheduler:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'today_schedule') {
      // Get today's scheduled coupons
      const today = new Date().toISOString().split('T')[0];
      
      const { data: scheduled, error } = await supabase
        .from('smart_push_queue')
        .select(`
          *,
          channels!inner(name, language)
        `)
        .gte('scheduled_at', `${today}T00:00:00Z`)
        .lt('scheduled_at', `${today}T23:59:59Z`)
        .order('scheduled_at');

      if (error) throw error;

      return NextResponse.json({
        success: true,
        today_schedule: scheduled || [],
        summary: {
          total_scheduled: scheduled?.length || 0,
          pending: scheduled?.filter(s => s.status === 'pending').length || 0,
          completed: scheduled?.filter(s => s.status === 'completed').length || 0,
          failed: scheduled?.filter(s => s.status === 'failed').length || 0
        }
      });
    }

    if (action === 'channel_settings') {
      // Get all channel settings
      const { data: settings, error } = await supabase
        .from('smart_push_settings')
        .select(`
          *,
          channels!inner(id, name, language, is_active)
        `)
        .order('channels.name');

      if (error) throw error;

      return NextResponse.json({
        success: true,
        channel_settings: settings || []
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action parameter'
    });

  } catch (error) {
    console.error('Error getting schedule info:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

// Helper Functions

/**
 * Create automatic daily schedule for random coupon sending
 */
async function createDailySchedule() {
  try {
    // Get all active channels with smart push enabled
    const { data: channels } = await supabase
      .from('smart_push_settings')
      .select(`
        *,
        channels!inner(id, name, language, is_active)
      `)
      .eq('is_enabled', true)
      .eq('channels.is_active', true);

    if (!channels || channels.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No channels configured for smart push'
      });
    }

    const scheduleItems = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Create random schedule for each channel
    for (const channelSetting of channels) {
      const channel = channelSetting.channels;
      
      // Determine number of random coupons for today (based on settings)
      const maxCouponsToday = channelSetting.max_coupons_per_day || 3;
      const minGapHours = channelSetting.min_gap_hours || 2;
      
      // Generate random times throughout the day
      const randomTimes = generateRandomTimes(maxCouponsToday, minGapHours, channelSetting.blackout_hours);
      
      for (const randomTime of randomTimes) {
        const scheduledAt = new Date(today);
        scheduledAt.setHours(randomTime.hour, randomTime.minute, 0, 0);
        
        // Only schedule future times
        if (scheduledAt > now) {
          scheduleItems.push({
            primary_content_id: `random_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            primary_content_type: 'random_scheduled',
            channel_ids: [channel.id],
            language: channel.language || 'en',
            scheduled_at: scheduledAt.toISOString(),
            delay_minutes: 0, // No delay for random scheduled
            status: 'pending',
            context_data: {
              scheduled_type: 'random_daily',
              channel_name: channel.name,
              max_coupons_today: maxCouponsToday
            }
          });
        }
      }
    }

    if (scheduleItems.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No future schedule items to create (all times have passed)',
        scheduled_count: 0
      });
    }

    // Insert scheduled items
    const { data: inserted, error } = await supabase
      .from('smart_push_queue')
      .insert(scheduleItems)
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Created daily schedule with ${scheduleItems.length} random coupon deliveries`,
      scheduled_count: scheduleItems.length,
      channels_affected: channels.length,
      next_delivery: scheduleItems[0]?.scheduled_at
    });

  } catch (error) {
    console.error('Error creating daily schedule:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create schedule'
    });
  }
}

/**
 * Trigger immediate random coupon for a channel
 */
async function triggerRandomCoupon(channelId?: string) {
  try {
    // If no channel specified, pick a random active channel
    let targetChannelId = channelId;
    
    if (!targetChannelId) {
      const { data: channels } = await supabase
        .from('channels')
        .select('id')
        .eq('is_active', true);
      
      if (!channels || channels.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No active channels available'
        });
      }
      
      targetChannelId = channels[Math.floor(Math.random() * channels.length)].id;
    }

    // Trigger the smart push system
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const triggerResponse = await fetch(`${baseUrl}/api/smart-push/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trigger_type: 'random_scheduled',
        content_type: 'random_coupon',
        content_id: `random_${Date.now()}`,
        channel_ids: [targetChannelId],
        language: 'en', // Will be auto-detected
        delay_minutes: 0,
        force_send: true
      })
    });

    const result = await triggerResponse.json();
    
    return NextResponse.json({
      success: result.success,
      message: result.message || 'Random coupon triggered',
      coupon_sent: result.sent_coupon || false,
      stats: result.stats || {}
    });

  } catch (error) {
    console.error('Error triggering random coupon:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to trigger random coupon'
    });
  }
}

/**
 * Update channel-specific smart push settings
 */
async function updateChannelSettings(channelId: string, settings: any) {
  try {
    if (!channelId) {
      return NextResponse.json({
        success: false,
        error: 'Channel ID is required'
      });
    }

    const { data: updated, error } = await supabase
      .from('smart_push_settings')
      .upsert({
        channel_id: channelId,
        ...settings,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Channel settings updated successfully',
      settings: updated
    });

  } catch (error) {
    console.error('Error updating channel settings:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update settings'
    });
  }
}

/**
 * Generate random times for coupon delivery throughout the day
 */
function generateRandomTimes(maxCoupons: number, minGapHours: number, blackoutHours?: any): Array<{hour: number, minute: number}> {
  const times = [];
  const activeHours = getActiveHours(blackoutHours);
  
  for (let i = 0; i < maxCoupons; i++) {
    let attempts = 0;
    let validTime = null;
    
    while (!validTime && attempts < 50) {
      // Pick random hour from active hours
      const randomHour = activeHours[Math.floor(Math.random() * activeHours.length)];
      const randomMinute = Math.floor(Math.random() * 60);
      
      const newTime = { hour: randomHour, minute: randomMinute };
      
      // Check if this time has enough gap from existing times
      const hasEnoughGap = times.every(existingTime => {
        const timeDiff = Math.abs(
          (newTime.hour * 60 + newTime.minute) - 
          (existingTime.hour * 60 + existingTime.minute)
        ) / 60;
        return timeDiff >= minGapHours;
      });
      
      if (hasEnoughGap) {
        validTime = newTime;
      }
      
      attempts++;
    }
    
    if (validTime) {
      times.push(validTime);
    }
  }
  
  // Sort times chronologically
  return times.sort((a, b) => (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute));
}

/**
 * Get active hours based on blackout settings
 */
function getActiveHours(blackoutHours?: any): number[] {
  const allHours = Array.from({ length: 24 }, (_, i) => i);
  
  if (!blackoutHours) {
    // Default active hours: 6 AM to 11 PM
    return allHours.filter(hour => hour >= 6 && hour <= 23);
  }
  
  // Parse blackout hours (e.g., {"start": "23:00", "end": "06:00"})
  const startHour = parseInt(blackoutHours.start?.split(':')[0] || '23');
  const endHour = parseInt(blackoutHours.end?.split(':')[0] || '6');
  
  if (startHour < endHour) {
    // Same day blackout (e.g., 14:00 to 16:00)
    return allHours.filter(hour => hour < startHour || hour > endHour);
  } else {
    // Overnight blackout (e.g., 23:00 to 06:00)
    return allHours.filter(hour => hour > endHour && hour < startHour);
  }
} 