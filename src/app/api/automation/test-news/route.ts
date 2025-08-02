import { NextRequest, NextResponse } from 'next/server';
import { OptimizedNewsContentGenerator } from '@/lib/content/news-content-generator';
import { TelegramDistributor } from '@/lib/content/api-modules/telegram-distributor';

/**
 * 🧪 TEST NEWS GENERATION ENDPOINT
 * Test if news generation and Telegram distribution works
 */

export async function GET(request: NextRequest) {
  console.log('🧪 Testing news generation...');
  
  try {
    // Test news generation
    const newsGenerator = new OptimizedNewsContentGenerator();
    const newsResult = await newsGenerator.generateNewsContent({
      language: 'en',
      channelId: 'test-channel',
      maxResults: 1
    });
    
    if (!newsResult) {
      return NextResponse.json({
        success: false,
        error: 'News generation failed',
        step: 'news_generation'
      });
    }
    
    console.log('✅ News generated successfully');
    
    // Test Telegram distribution
    const telegramDistributor = new TelegramDistributor();
    const distributionResult = await telegramDistributor.sendContentToTelegram({
      content: {
        title: newsResult.title,
        content: newsResult.content,
        content_items: [newsResult]
      },
      language: 'en',
      mode: 'test_news',
      includeImages: true
    });
    
    return NextResponse.json({
      success: true,
      news_generated: !!newsResult,
      telegram_sent: distributionResult.success,
      news_title: newsResult.title,
      news_content_preview: newsResult.content.substring(0, 100) + '...',
      telegram_result: distributionResult,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}