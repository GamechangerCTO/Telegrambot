/**
 * 🔄 BETTING TO NEWS FALLBACK TEST
 * Test the betting-to-news fallback system
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const language = (searchParams.get('language') as 'en' | 'am' | 'sw') || 'am';
    const action = searchParams.get('action') || 'preview';

    console.log(`🧪 Testing betting-to-news fallback for language: ${language}`);

    // Test the unified content API with betting type
    const response = await fetch(`http://localhost:3001/api/unified-content?action=${action}&type=betting&language=${language}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        max_posts_per_channel: 1
      })
    });

    const result = await response.json();

    // Analyze the result
    const analysis = {
      requestedType: 'betting',
      actualContentType: result.content_type,
      contentGenerated: result.content_items?.length || 0,
      fallbackUsed: result.processing_info?.fallback_used || false,
      bettingFallbackToNews: result.processing_info?.betting_fallback_to_news || false,
      dataSource: result.processing_info?.data_source || 'unknown',
      success: result.success,
      message: result.message
    };

    // Determine what happened
    let scenario = 'unknown';
    if (analysis.bettingFallbackToNews) {
      scenario = 'betting_fallback_to_news';
    } else if (analysis.contentGenerated > 0 && !analysis.fallbackUsed) {
      scenario = 'betting_success';
    } else if (analysis.contentGenerated === 0) {
      scenario = 'no_content_generated';
    }

    // Sample content preview
    const contentPreview = result.content_items?.length > 0 ? {
      title: result.content_items[0].title || 'No title',
      type: result.content_items[0].type || 'unknown',
      preview: result.content_items[0].content?.substring(0, 200) + '...' || 'No content',
      language: result.content_items[0].language || language
    } : null;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      test_scenario: scenario,
      
      analysis,
      
      content_preview: contentPreview,
      
      raw_response: result,
      
      interpretation: {
        betting_success: scenario === 'betting_success' ? 
          '✅ Betting tips generated successfully with real match data' : 
          null,
        betting_fallback: scenario === 'betting_fallback_to_news' ? 
          '🔄 No betting matches available - Successfully fell back to news content' : 
          null,
        no_content: scenario === 'no_content_generated' ? 
          '❌ Neither betting nor news content could be generated' : 
          null
      },
      
      recommendations: scenario === 'betting_fallback_to_news' ? [
        '✅ Fallback system working correctly',
        '📰 News content provided when betting unavailable', 
        '🎯 User still receives valuable football content',
        '🔄 System gracefully handles missing betting matches'
      ] : scenario === 'betting_success' ? [
        '✅ Betting system working correctly',
        '🎯 Real match data available for betting tips',
        '📊 Continue monitoring betting tip performance'
      ] : [
        '⚠️ Content generation issues detected',
        '🔧 Check football API connectivity',
        '📊 Verify data sources are working'
      ]
    });

  } catch (error) {
    console.error('❌ Error testing betting fallback:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to test betting fallback system',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      language = 'am',
      action = 'send_now',
      forceNoMatches = false 
    } = body;

    console.log(`🧪 Testing betting fallback with parameters:`, { language, action, forceNoMatches });

    // If forceNoMatches is true, we can simulate the no-matches scenario
    // For now, just test the normal flow
    
    const response = await fetch(`http://localhost:3001/api/unified-content?action=${action}&type=betting&language=${language}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        max_posts_per_channel: 1,
        target_channels: body.target_channels || null
      })
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      test_type: 'betting_fallback_post',
      
      request_parameters: { language, action, forceNoMatches },
      
      result_analysis: {
        contentGenerated: result.content_items?.length || 0,
        contentType: result.content_type,
        fallbackToNews: result.processing_info?.betting_fallback_to_news || false,
        dataSource: result.processing_info?.data_source,
        success: result.success,
        message: result.message
      },
      
      full_response: result
    });

  } catch (error) {
    console.error('❌ Error in betting fallback POST test:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process betting fallback test',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}