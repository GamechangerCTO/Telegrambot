import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * 🔗 CHANNEL BUTTON CONFIGURATION API
 * Manage button settings for individual channels
 */

interface ButtonConfigRequest {
  main_website?: string;
  betting_platform?: string;
  live_scores?: string;
  news_source?: string;
  social_media?: {
    telegram?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  affiliate_codes?: {
    betting?: string;
    bookmaker?: string;
    casino?: string;
  };
  channel_settings?: {
    enable_betting_links?: boolean;
    enable_affiliate_links?: boolean;
    enable_social_sharing?: boolean;
    enable_reaction_buttons?: boolean;
    enable_copy_buttons?: boolean;
    custom_website?: string;
  };
  custom_buttons?: Array<{
    text: string;
    type: string;
    action: string;
    url?: string;
  }>;
  template_applied?: string;
  template_name?: string;
  template_buttons?: Array<{
    text: string;
    type: string;
    action: string;
  }>;
}

/**
 * GET - Get channel button configuration
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const { channelId } = params;

    // Get channel button configuration
    const { data: channelData, error } = await supabase
      .from('channels')
      .select('id, name, language, button_config')
      .eq('id', channelId)
      .single();

    if (error) {
      console.error('❌ Error fetching channel button config:', error);
      return NextResponse.json({
        success: false,
        error: 'Channel not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      channel: {
        id: channelData.id,
        name: channelData.name,
        language: channelData.language
      },
      button_config: channelData.button_config || {},
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in button config GET:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * PUT - Update channel button configuration
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const { channelId } = params;
    const buttonConfig: ButtonConfigRequest = await request.json();

    console.log(`🔗 Updating button config for channel ${channelId}`);

    // Validate required fields
    if (!channelId) {
      return NextResponse.json({
        success: false,
        error: 'Channel ID is required'
      }, { status: 400 });
    }

    // Check if channel exists
    const { data: existingChannel, error: checkError } = await supabase
      .from('channels')
      .select('id, name')
      .eq('id', channelId)
      .single();

    if (checkError || !existingChannel) {
      return NextResponse.json({
        success: false,
        error: 'Channel not found'
      }, { status: 404 });
    }

    // Clean and structure the button configuration
    const cleanButtonConfig = {
      main_website: buttonConfig.main_website || '',
      betting_platform: buttonConfig.betting_platform || '',
      live_scores: buttonConfig.live_scores || '',
      news_source: buttonConfig.news_source || '',
      social_media: {
        telegram: buttonConfig.social_media?.telegram || '',
        twitter: buttonConfig.social_media?.twitter || '',
        facebook: buttonConfig.social_media?.facebook || '',
        instagram: buttonConfig.social_media?.instagram || ''
      },
      affiliate_codes: {
        betting: buttonConfig.affiliate_codes?.betting || '',
        bookmaker: buttonConfig.affiliate_codes?.bookmaker || '',
        casino: buttonConfig.affiliate_codes?.casino || ''
      },
      channel_settings: {
        enable_betting_links: buttonConfig.channel_settings?.enable_betting_links ?? true,
        enable_affiliate_links: buttonConfig.channel_settings?.enable_affiliate_links ?? true,
        enable_social_sharing: buttonConfig.channel_settings?.enable_social_sharing ?? true,
        enable_reaction_buttons: buttonConfig.channel_settings?.enable_reaction_buttons ?? true,
        enable_copy_buttons: buttonConfig.channel_settings?.enable_copy_buttons ?? true,
        custom_website: buttonConfig.channel_settings?.custom_website || null
      },
      custom_buttons: buttonConfig.custom_buttons || [],
      template_applied: buttonConfig.template_applied || null,
      template_name: buttonConfig.template_name || null,
      template_buttons: buttonConfig.template_buttons || [],
      updated_at: new Date().toISOString()
    };

    // Update channel button configuration
    const { error: updateError } = await supabase
      .from('channels')
      .update({ 
        button_config: cleanButtonConfig,
        updated_at: new Date().toISOString()
      })
      .eq('id', channelId);

    if (updateError) {
      console.error('❌ Error updating button config:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to update button configuration'
      }, { status: 500 });
    }

    console.log(`✅ Button config updated for channel ${existingChannel.name}`);

    return NextResponse.json({
      success: true,
      message: `Button configuration updated for ${existingChannel.name}`,
      channel: {
        id: existingChannel.id,
        name: existingChannel.name
      },
      button_config: cleanButtonConfig,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in button config PUT:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * DELETE - Reset channel button configuration to defaults
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { channelId: string } }
) {
  try {
    const { channelId } = params;

    console.log(`🗑️ Resetting button config for channel ${channelId}`);

    // Default button configuration
    const defaultButtonConfig = {
      main_website: 'https://africasportscenter.com',
      betting_platform: 'https://1xbet.com',
      live_scores: 'https://livescore.com',
      news_source: 'https://bbc.com/sport/football',
      social_media: {
        telegram: 'https://t.me/africansportdata',
        twitter: 'https://twitter.com/africasports',
        facebook: 'https://facebook.com/africasportscenter',
        instagram: 'https://instagram.com/africasportscenter'
      },
      affiliate_codes: {
        betting: 'AFRICA2024',
        bookmaker: 'SPORT123',
        casino: 'LUCKY777'
      },
      channel_settings: {
        enable_betting_links: true,
        enable_affiliate_links: true,
        enable_social_sharing: true,
        enable_reaction_buttons: true,
        enable_copy_buttons: true,
        custom_website: null
      },
      custom_buttons: [],
      template_applied: null,
      template_name: null,
      template_buttons: [],
      updated_at: new Date().toISOString()
    };

    // Reset to defaults
    const { error } = await supabase
      .from('channels')
      .update({ 
        button_config: defaultButtonConfig,
        updated_at: new Date().toISOString()
      })
      .eq('id', channelId);

    if (error) {
      console.error('❌ Error resetting button config:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to reset button configuration'
      }, { status: 500 });
    }

    console.log(`✅ Button config reset to defaults for channel ${channelId}`);

    return NextResponse.json({
      success: true,
      message: 'Button configuration reset to defaults',
      button_config: defaultButtonConfig,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in button config DELETE:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}