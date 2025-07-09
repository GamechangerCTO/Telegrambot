/**
 * 💰 Betting Content API - Dedicated API for Betting Tips
 * API יעודי לטיפים של הימורים - עדיפות עסקית גבוהה
 */

import { NextRequest, NextResponse } from 'next/server';
import { BettingTipsGenerator } from '@/lib/content/betting-tips-generator';

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

    console.log(`💰 Generating betting content for ${language} (${maxItems} items)`);
    console.log(`🔍 Request body:`, body);
    console.log(`🔍 Search params:`, Object.fromEntries(searchParams.entries()));

    // Generate betting content using our existing generator
    const bettingContent = await bettingTipsGenerator.generateBettingTips({
      language,
      channelId: 'api_request', // Since this is a direct API call
      maxPredictions: maxItems,
      riskTolerance: 'moderate'
    });

    let contentItems = [];

    if (bettingContent) {
      contentItems.push({
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
      });
    }

    const processingTime = Date.now() - startTime;

    // Return success response
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      content_type: 'betting',
      language,
      mode: 'ai_enhanced',
      statistics: {
        channels_processed: 1,
        total_content_sent: contentItems.length,
        images_generated: contentItems.filter(item => item.imageUrl).length,
        processing_time_seconds: Math.round(processingTime / 1000),
        fallback_used: !bettingContent
      },
      processing_info: {
        data_source: 'Betting Tips Generator',
        ai_processing: true,
        image_generation: !!bettingContent?.imageUrl,
        fallback_used: !bettingContent
      },
      content_items: contentItems,
      message: bettingContent 
        ? `Generated ${contentItems.length} betting tips successfully`
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