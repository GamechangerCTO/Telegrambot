/**
 * 💰 Betting Content API - Enhanced with Full Telegram Features
 * API יעודי לטיפים של הימורים עם כל תכונות הטלגרם המתקדמות
 */

import { NextRequest, NextResponse } from 'next/server';
import { BettingTipsGenerator } from '@/lib/content/betting-tips-generator';
import { enhancedTelegramAPI } from '@/lib/telegram/enhanced-telegram-api';
import { channelResolver } from '@/lib/content/api-modules/channel-resolver';

const bettingTipsGenerator = new BettingTipsGenerator();

export async function GET(request: NextRequest) {
  return await handleRequest(request);
}

export async function POST(request: NextRequest) {
  return await handleRequest(request);
}

async function handleRequest(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    // Parse request parameters
    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    
    const language = (body.language || searchParams.get('language') || 'en') as 'en' | 'am' | 'sw';
    const maxItems = parseInt(body.max_posts_per_channel || searchParams.get('max_items') || '2');
    const targetChannels = body.target_channels || [];
    const sendToChannel = body.send_to_channel || false; // New parameter to actually send

    console.log(`💰 Generating enhanced betting content for ${language} (${maxItems} items)`);
    console.log(`🔍 Request body:`, body);
    console.log(`🔍 Target channels:`, targetChannels);

    // Resolve channel information for enhanced features
    let channelInfo = null;
    if (targetChannels.length > 0) {
      const resolution = await channelResolver.resolveTargetChannels({
        target_channels: targetChannels,
        language,
        body
      });
      channelInfo = resolution.resolvedChannels[0]; // Use first channel for configuration
    }

    // Generate betting content with enhanced channel context
    const bettingContent = await bettingTipsGenerator.generateBettingTips({
      language,
      channelId: targetChannels[0] || 'api_request',
      maxPredictions: maxItems,
      riskTolerance: 'moderate',
      // Enhanced features from channel configuration
      selectedLeagues: channelInfo?.selected_leagues || [],
      selectedTeams: channelInfo?.selected_teams || [],
      affiliateCode: channelInfo?.affiliate_code,
      channelName: channelInfo?.name
    });

    let contentItems = [];
    let telegramResults = [];

    if (bettingContent) {
      const contentItem = {
        id: `betting_tip_${Date.now()}`,
        type: 'betting',
        title: bettingContent.title,
        content: bettingContent.content,
        language: language,
        imageUrl: bettingContent.imageUrl,
        metadata: {
          language: language,
          source: 'Betting Tips Generator',
          contentId: bettingContent.metadata.contentId,
          generatedAt: bettingContent.metadata.generatedAt,
          match: {
            homeTeam: bettingContent.analysis.homeTeam,
            awayTeam: bettingContent.analysis.awayTeam,
            competition: bettingContent.analysis.competition
          },
          analysis: bettingContent.analysis,
          confidenceLevel: bettingContent.metadata.confidenceLevel,
          riskLevel: bettingContent.metadata.riskLevel
        }
      };
      
      contentItems.push(contentItem);

      // 🚀 NEW: Send to Telegram with enhanced features if requested
      if (sendToChannel && targetChannels.length > 0) {
        console.log(`📤 Sending enhanced betting content to ${targetChannels.length} channels`);
        
        for (const channelId of targetChannels) {
          try {
            // Prepare tips data for enhanced telegram API
            const tips = bettingContent.analysis.predictions.map(pred => ({
              type: pred.type,
              prediction: pred.prediction,
              odds: pred.expectedOdds || pred.odds_estimate || 'TBD',
              confidence: pred.confidence,
              risk: pred.risk_level
            }));

            // Get website URL from channel configuration or use default
            const websiteUrl = channelInfo?.websites?.[0]?.url || 
                              (channelInfo?.affiliate_code ? `https://1xbet.com/?code=${channelInfo.affiliate_code}` : undefined);

            // Send with full enhanced Telegram features
            const telegramResult = await enhancedTelegramAPI.sendBettingTips({
              chat_id: channelId,
              match: {
                home: bettingContent.analysis.homeTeam,
                away: bettingContent.analysis.awayTeam,
                competition: bettingContent.analysis.competition
              },
              tips: tips,
              language: language as 'en' | 'am' | 'sw' | 'fr' | 'ar',
              image_url: bettingContent.imageUrl,
              affiliate_code: channelInfo?.affiliate_code,
              website_url: websiteUrl
            });

            telegramResults.push({
              channel_id: channelId,
              success: true,
              message_id: telegramResult.message_id,
              features_used: ['interactive_buttons', 'copy_text', 'web_app', 'inline_sharing']
            });

            console.log(`✅ Enhanced betting content sent to ${channelId}`);
          } catch (error) {
            console.error(`❌ Failed to send to ${channelId}:`, error);
            telegramResults.push({
              channel_id: channelId,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      }
    }

    const processingTime = Date.now() - startTime;

    // Return enhanced success response
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      content_type: 'betting',
      language,
      mode: 'enhanced_telegram_api',
      statistics: {
        channels_processed: targetChannels.length || 1,
        total_content_generated: contentItems.length,
        telegram_messages_sent: telegramResults.filter(r => r.success).length,
        telegram_failures: telegramResults.filter(r => !r.success).length,
        images_generated: contentItems.filter(item => item.imageUrl).length,
        processing_time_seconds: Math.round(processingTime / 1000),
        fallback_used: !bettingContent
      },
      processing_info: {
        data_source: 'Betting Tips Generator',
        ai_processing: true,
        image_generation: !!bettingContent?.imageUrl,
        telegram_enhanced_features: sendToChannel,
        channel_specific_branding: !!channelInfo,
        affiliate_integration: !!channelInfo?.affiliate_code,
        website_integration: !!channelInfo?.websites?.length,
        fallback_used: !bettingContent
      },
      content_items: contentItems,
      telegram_results: telegramResults,
      channel_configuration: channelInfo ? {
        name: channelInfo.name,
        language: channelInfo.language,
        affiliate_code: channelInfo.affiliate_code,
        websites: channelInfo.websites || [],
        selected_leagues: channelInfo.selected_leagues?.length || 0,
        smart_scheduling: channelInfo.smart_scheduling
      } : null,
      enhanced_features_used: sendToChannel ? [
        'interactive_buttons',
        'rich_html_formatting', 
        'copy_to_clipboard',
        'inline_sharing',
        'web_app_integration',
        'channel_specific_branding',
        'affiliate_links',
        'reaction_tracking'
      ] : [],
      message: bettingContent 
        ? `Generated ${contentItems.length} enhanced betting tips${sendToChannel ? ` and sent to ${telegramResults.filter(r => r.success).length} channels` : ''}`
        : 'No betting content available at this time'
    });

  } catch (error) {
    console.error('❌ Error in betting content API:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to generate betting content: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 