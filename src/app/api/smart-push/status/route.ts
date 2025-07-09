import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * 📊 Smart Push Queue Status API
 * 
 * GET /api/smart-push/status - הצגת סטטוס התור והסטטיסטיקות
 */

export async function GET(request: NextRequest) {
  try {
    // Get queue statistics
    const [queueStats, deliveryStats, settingsData] = await Promise.all([
      // Queue statistics
      supabase
        .from('smart_push_queue')
        .select('status')
        .then(({ data, error }) => {
          if (error) throw error;
          const stats = data?.reduce((acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>) || {};
          
          return {
            pending: stats.pending || 0,
            processing: stats.processing || 0,
            completed: stats.completed || 0,
            failed: stats.failed || 0,
            total: data?.length || 0
          };
        }),

      // Delivery statistics (last 24 hours)
      supabase
        .from('smart_push_deliveries')
        .select('delivery_status, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .then(({ data, error }) => {
          if (error) throw error;
          const stats = data?.reduce((acc, item) => {
            acc[item.delivery_status] = (acc[item.delivery_status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>) || {};
          
          return {
            sent: stats.sent || 0,
            failed: stats.failed || 0,
            total: data?.length || 0
          };
        }),

      // System settings
      supabase
        .from('smart_push_settings')
        .select('key, value, is_active')
        .eq('is_active', true)
        .then(({ data, error }) => {
          if (error) throw error;
          return data?.reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
          }, {} as Record<string, string>) || {};
        })
    ]);

    // Get next scheduled items
    const { data: nextItems } = await supabase
      .from('smart_push_queue')
      .select(`
        id,
        content_type,
        scheduled_for,
        priority,
        channels (
          name,
          telegram_channel_username
        )
      `)
      .eq('status', 'pending')
      .order('scheduled_for', { ascending: true })
      .limit(5);

    const systemEnabled = settingsData.system_enabled === 'true';
    const processInterval = parseInt(settingsData.queue_processing_interval_seconds || '30');

    return NextResponse.json({
      success: true,
      data: {
        system: {
          enabled: systemEnabled,
          processing_interval_seconds: processInterval,
          last_processed_at: new Date().toISOString()
        },
        queue: queueStats,
        deliveries_24h: deliveryStats,
        next_scheduled: nextItems?.map(item => ({
          id: item.id,
          content_type: item.content_type,
          scheduled_for: item.scheduled_for,
          priority: item.priority,
          channel_name: item.channels?.name,
          channel_username: item.channels?.telegram_channel_username
        })) || [],
        settings: settingsData
      }
    });

  } catch (error) {
    console.error('Error getting smart push status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get system status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 