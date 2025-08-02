import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const { channelId } = params;

    // Get channel button configuration
    const { data: channel, error } = await supabase
      .from('channels')
      .select('id, name, websites, affiliate_code')
      .eq('id', channelId)
      .single();

    if (error || !channel) {
      return NextResponse.json(
        { success: false, error: 'Channel not found' },
        { status: 404 }
      );
    }

    // Parse existing websites configuration
    const websites = channel.websites || {};
    
    const buttonConfig = {
      main_website: websites.main_website || 'https://africasportscenter.com',
      betting_platform: websites.betting_platform || 'https://1xbet.com',
      live_scores: websites.live_scores || 'https://livescore.com',
      news_source: websites.news_source || 'https://bbc.com/sport/football',
      social_media: {
        telegram: websites.telegram || 'https://t.me/africansportdata',
        twitter: websites.twitter || 'https://twitter.com/africasports',
        facebook: websites.facebook || 'https://facebook.com/africasportscenter',
        instagram: websites.instagram || 'https://instagram.com/africasportscenter',
        youtube: websites.youtube || '',
        tiktok: websites.tiktok || ''
      },
      affiliate_codes: {
        betting: channel.affiliate_code || 'AFRICA2024',
        bookmaker: websites.bookmaker_code || 'SPORT123',
        casino: websites.casino_code || 'LUCKY777'
      },
      channel_settings: {
        enable_betting_links: websites.enable_betting_links !== false,
        enable_affiliate_links: websites.enable_affiliate_links !== false,
        enable_social_sharing: websites.enable_social_sharing !== false,
        enable_custom_buttons: websites.enable_custom_buttons !== false,
        custom_website: websites.custom_website || null
      },
      custom_buttons: websites.custom_buttons || [
        { text: '📊 Full Stats', type: 'callback', data: `stats_${channelId}`, enabled: true },
        { text: '⚽ Top Goals', type: 'callback', data: `goals_${channelId}`, enabled: true },
        { text: '🔥 Match Highlights', type: 'url', data: websites.main_website || 'https://africasportscenter.com', enabled: true },
        { text: '🏆 League Tables', type: 'url', data: websites.live_scores || 'https://livescore.com', enabled: true },
        { text: '📱 Share Summary', type: 'switch_inline', data: `summary_${channelId}`, enabled: true }
      ]
    };

    return NextResponse.json({
      success: true,
      buttonConfig,
      channelId,
      channelName: channel.name
    });

  } catch (error) {
    console.error('❌ Error fetching button links:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch button links' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const { channelId } = params;
    const body = await request.json();
    const { buttonConfig } = body;

    if (!buttonConfig) {
      return NextResponse.json(
        { success: false, error: 'Button configuration is required' },
        { status: 400 }
      );
    }

    // Prepare the update data
    const websitesData = {
      main_website: buttonConfig.main_website,
      betting_platform: buttonConfig.betting_platform,
      live_scores: buttonConfig.live_scores,
      news_source: buttonConfig.news_source,
      telegram: buttonConfig.social_media?.telegram,
      twitter: buttonConfig.social_media?.twitter,
      facebook: buttonConfig.social_media?.facebook,
      instagram: buttonConfig.social_media?.instagram,
      youtube: buttonConfig.social_media?.youtube,
      tiktok: buttonConfig.social_media?.tiktok,
      bookmaker_code: buttonConfig.affiliate_codes?.bookmaker,
      casino_code: buttonConfig.affiliate_codes?.casino,
      enable_betting_links: buttonConfig.channel_settings?.enable_betting_links,
      enable_affiliate_links: buttonConfig.channel_settings?.enable_affiliate_links,
      enable_social_sharing: buttonConfig.channel_settings?.enable_social_sharing,
      enable_custom_buttons: buttonConfig.channel_settings?.enable_custom_buttons,
      custom_website: buttonConfig.channel_settings?.custom_website,
      custom_buttons: buttonConfig.custom_buttons || [],
      updated_at: new Date().toISOString()
    };

    // Update the channel configuration
    const { data, error } = await supabase
      .from('channels')
      .update({
        websites: websitesData,
        affiliate_code: buttonConfig.affiliate_codes?.betting,
        updated_at: new Date().toISOString()
      })
      .eq('id', channelId)
      .select()
      .single();

    if (error) {
      console.error('Database update error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update button configuration' },
        { status: 500 }
      );
    }

    // Log the configuration change
    await supabase
      .from('logs')
      .insert({
        action: 'button_config_update',
        component: 'button_links_api',
        level: 'info',
        message: `Button links updated for channel ${channelId}`,
        metadata: {
          channel_id: channelId,
          updated_fields: Object.keys(websitesData),
          user_agent: request.headers.get('user-agent')
        },
        status: 'success'
      });

    return NextResponse.json({
      success: true,
      message: 'Button configuration updated successfully',
      channelId,
      updatedConfig: websitesData
    });

  } catch (error) {
    console.error('❌ Error updating button links:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update button links' },
      { status: 500 }
    );
  }
}

// Get button analytics for this channel
export async function POST(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const { channelId } = params;
    const body = await request.json();
    const { action, days = 7 } = body;

    if (action === 'analytics') {
      // Get button click analytics
      const { data: analytics, error } = await supabase
        .from('button_analytics')
        .select('*')
        .eq('channel_id', channelId)
        .gte('clicked_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('clicked_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Process analytics data
      const summary = analytics?.reduce((acc: any, click: any) => {
        const key = `${click.button_type}_${click.analytics_tag}`;
        if (!acc[key]) {
          acc[key] = {
            button_type: click.button_type,
            analytics_tag: click.analytics_tag,
            button_text: click.button_text,
            click_count: 0,
            unique_users: new Set(),
            urls: new Set()
          };
        }
        acc[key].click_count++;
        if (click.user_id) acc[key].unique_users.add(click.user_id);
        if (click.url_clicked) acc[key].urls.add(click.url_clicked);
        return acc;
      }, {}) || {};

      // Convert sets to counts
      const processedSummary = Object.values(summary).map((item: any) => ({
        ...item,
        unique_users: item.unique_users.size,
        unique_urls: item.urls.size,
        urls: Array.from(item.urls)
      }));

      return NextResponse.json({
        success: true,
        analytics: processedSummary,
        totalClicks: analytics?.length || 0,
        period: `${days} days`
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Error processing button analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}