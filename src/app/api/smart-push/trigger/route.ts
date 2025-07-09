import { NextRequest, NextResponse } from 'next/server';
import { smartCouponsGenerator } from '@/lib/content/smart-coupons-generator';
import { smartPushEngine } from '@/lib/content/smart-push-engine';
import { supabaseServer } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      trigger_type,  // 'after_content' | 'random_scheduled'
      content_type,  // 'betting_tips' | 'analysis' | 'news' | 'polls'
      content_id,
      channel_ids,
      language, 
      delay_minutes = 3,
      force_send = false
    } = body;

    console.log(`🎯 Smart Push Trigger received:`, {
      trigger_type,
      content_type,
      content_id,
      channel_ids: channel_ids?.length || 'all'
    });

    // Step 1: Get available channels if not specified
    let targetChannels = channel_ids;
    if (!targetChannels) {
      const { data: channels } = await supabaseServer
        .from('channels')
        .select('id, language')
        .eq('is_active', true);
      
      targetChannels = channels?.map(c => c.id) || [];
    }

    if (targetChannels.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No active channels found'
      });
    }

    // Step 2: Determine if we should send a coupon
    const shouldSendCoupon = await determineCouponSending(trigger_type, content_type, force_send);
    
    if (!shouldSendCoupon.send) {
      return NextResponse.json({
        success: true,
        message: `Coupon sending skipped: ${shouldSendCoupon.reason}`,
        sent_coupon: false,
        stats: {
          channels_eligible: targetChannels.length,
          coupon_sent: false,
          reason: shouldSendCoupon.reason
        }
      });
    }

    // Step 3: Find best coupon for this context
    const context = {
      contentType: mapContentTypeToContext(content_type),
      channelId: targetChannels[0], // Use first channel for context
      language: language || 'en',
      timeContext: {
        hour: new Date().getHours(),
        dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        isWeekend: [0, 6].includes(new Date().getDay())
      }
    };

    const generatedCoupon = await smartCouponsGenerator.getSmartCouponForContext(context);

    if (!generatedCoupon) {
      return NextResponse.json({
        success: true,
        message: 'No suitable coupon found for current context',
        sent_coupon: false,
        stats: {
          channels_eligible: targetChannels.length,
          coupon_sent: false,
          reason: 'No contextually relevant coupons available'
        }
      });
    }

    // Step 4: Schedule or immediate send
    if (trigger_type === 'after_content' && !force_send) {
      // Schedule delayed sending
      const scheduledAt = new Date(Date.now() + delay_minutes * 60 * 1000);
      
      const { data: queueItem, error } = await supabaseServer
        .from('smart_push_queue')
        .insert({
          primary_content_id: content_id,
          primary_content_type: content_type,
          channel_ids: targetChannels,
          language: language || 'en',
          scheduled_at: scheduledAt.toISOString(),
          delay_minutes,
          selected_coupon_id: generatedCoupon.couponData.id,
          context_data: {
            coupon_content: generatedCoupon.content,
            coupon_title: generatedCoupon.title,
            image_url: generatedCoupon.imageUrl,
            placement_reason: generatedCoupon.metadata.placementReason
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Error scheduling coupon:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to schedule coupon sending'
        });
      }
    
    return NextResponse.json({
      success: true,
        message: `Coupon scheduled for ${delay_minutes} minutes`,
        sent_coupon: false,
        scheduled: true,
        stats: {
          channels_eligible: targetChannels.length,
          coupon_scheduled: true,
          scheduled_at: scheduledAt.toISOString(),
          coupon_id: generatedCoupon.couponData.id,
          coupon_title: generatedCoupon.title
        }
      });
    } else {
      // Immediate send
      const sendResults = await sendCouponToChannels(generatedCoupon, targetChannels);
      
      return NextResponse.json({
        success: true,
        message: `Coupon sent immediately to ${sendResults.successful} channels`,
        sent_coupon: true,
        stats: {
          channels_eligible: targetChannels.length,
          channels_successful: sendResults.successful,
          channels_failed: sendResults.failed,
          coupon_id: generatedCoupon.couponData.id,
          coupon_title: generatedCoupon.title,
          total_impressions: sendResults.successful
        }
      });
    }

  } catch (error) {
    console.error('Error in smart push trigger:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

// GET endpoint to check smart push status
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'status') {
      // Get current queue status
      const { data: queueItems } = await supabaseServer
        .from('smart_push_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: todayDeliveries } = await supabaseServer
        .from('smart_push_deliveries')
        .select('*')
        .gte('sent_at', new Date().toISOString().split('T')[0]);

      return NextResponse.json({
        success: true,
        queue: {
          recent_items: queueItems || [],
          pending: queueItems?.filter(item => item.status === 'pending').length || 0,
          processing: queueItems?.filter(item => item.status === 'processing').length || 0,
          completed: queueItems?.filter(item => item.status === 'completed').length || 0
        },
        today_deliveries: {
          total: todayDeliveries?.length || 0,
          successful: todayDeliveries?.filter(d => d.delivery_status === 'sent').length || 0,
          failed: todayDeliveries?.filter(d => d.delivery_status === 'failed').length || 0
        }
      });
    }

    if (action === 'settings') {
      // Get smart push settings for all channels
      const { data: settings } = await supabaseServer
        .from('smart_push_settings')
        .select(`
          *,
          channels (
            id,
            name,
            language
          )
        `);
    
    return NextResponse.json({
      success: true,
        settings: settings || []
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action parameter'
    });

  } catch (error) {
    console.error('Error in smart push status:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

// Helper Functions

async function determineCouponSending(
  triggerType: string, 
  contentType: string, 
  forceSend: boolean
): Promise<{ send: boolean; reason: string }> {
  
  if (forceSend) {
    return { send: true, reason: 'Force send requested' };
  }

  // Check if it's a good time to send coupons
  const hour = new Date().getHours();
  if (hour < 6 || hour > 23) {
    return { send: false, reason: 'Outside active hours (6 AM - 11 PM)' };
  }

  // Content-based probability
  const contentProbabilities = {
    'betting_tips': 0.8,    // High probability after betting tips
    'analysis': 0.6,        // Medium probability after analysis  
    'news': 0.3,           // Lower probability after news
    'polls': 0.4,          // Medium probability after polls
    'live_updates': 0.2    // Low probability during live updates
  };

  // Random scheduling probability
  if (triggerType === 'random_scheduled') {
    return { send: true, reason: 'Scheduled random coupon delivery' };
  }

  const probability = contentProbabilities[contentType as keyof typeof contentProbabilities] || 0.3;
  const shouldSend = Math.random() < probability;

  return {
    send: shouldSend,
    reason: shouldSend 
      ? `Content-based trigger (${Math.round(probability * 100)}% chance)`
      : `Random probability not met (${Math.round(probability * 100)}% chance)`
  };
}

function mapContentTypeToContext(contentType: string): string {
  const mapping: { [key: string]: string } = {
    'betting_tips': 'betting_tip',
    'analysis': 'analysis',
    'news': 'news',
    'polls': 'poll',
    'live_updates': 'live_update'
  };
  return mapping[contentType] || contentType;
}

async function sendCouponToChannels(generatedCoupon: any, channelIds: string[]) {
  let successful = 0;
  let failed = 0;

  // Send to each channel (mock implementation)
  for (const channelId of channelIds) {
    try {
      // Get channel info
      const { data: channel } = await supabaseServer
        .from('channels')
        .select('*')
        .eq('id', channelId)
        .single();

      if (!channel || !channel.is_active) {
        failed++;
        continue;
      }

      // Prepare coupon message
      const message = `${generatedCoupon.title}\n\n${generatedCoupon.content}`;
      
      // Here you would send to Telegram Bot API
      // For now, we'll just log and track
      console.log(`📤 Sending coupon to channel ${channel.name}: ${generatedCoupon.title}`);
      
      // Track the delivery
      await supabaseServer
        .from('smart_push_deliveries')
        .insert({
          channel_id: channelId,
          coupon_id: generatedCoupon.couponData.id,
          delivery_status: 'sent',
          sent_at: new Date().toISOString()
        });

      successful++;

    } catch (error) {
      console.error(`Failed to send coupon to channel ${channelId}:`, error);
      failed++;
    }
  }

  return { successful, failed };
} 