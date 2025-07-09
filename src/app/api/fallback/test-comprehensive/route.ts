/**
 * 🧪 COMPREHENSIVE FALLBACK SYSTEM TEST
 * Test all content types with fallback mechanisms
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const language = (searchParams.get('language') as 'en' | 'am' | 'sw') || 'en';
    const testAll = searchParams.get('test_all') === 'true';

    console.log(`🧪 Testing comprehensive fallback system for language: ${language}`);

    const contentTypes = testAll ? 
      ['live', 'betting', 'news', 'analysis', 'polls', 'memes', 'daily_summary'] :
      ['live', 'betting', 'analysis']; // Core real-time types

    const testResults = [];

    // Test each content type
    for (const contentType of contentTypes) {
      console.log(`\n🔄 Testing ${contentType} content with fallback...`);
      
      try {
        const response = await fetch(`http://localhost:3001/api/unified-content?action=preview&type=${contentType}&language=${language}`, {
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
          contentType,
          success: result.success,
          contentGenerated: result.content_items?.length || result.preview_items?.length || 0,
          fallbackUsed: result.processing_info?.fallback_used || false,
          fallbackChain: result.processing_info?.fallback_chain || [],
          originalRequestType: result.processing_info?.original_request_type,
          finalContentType: result.processing_info?.final_content_type,
          fallbackReason: result.processing_info?.fallback_reason,
          dataSource: result.processing_info?.data_source || 'unknown',
          qualityScore: result.processing_info?.quality_score || 1.0,
          message: result.message,
          error: result.error
        };

        // Determine test outcome
        let testOutcome = 'unknown';
        if (analysis.success && analysis.contentGenerated > 0) {
          if (analysis.fallbackUsed) {
            testOutcome = 'fallback_success';
          } else {
            testOutcome = 'primary_success';
          }
        } else {
          testOutcome = 'failure';
        }

        // Sample content preview
        const contentPreview = result.content_items?.length > 0 ? {
          title: result.content_items[0].title || 'No title',
          type: result.content_items[0].type || contentType,
          preview: result.content_items[0].content?.substring(0, 150) + '...' || 'No content',
          language: result.content_items[0].language || language
        } : result.preview_items?.length > 0 ? {
          title: result.preview_items[0].title || 'No title',
          type: result.preview_items[0].type || contentType,
          preview: result.preview_items[0].preview || 'No preview',
          language: language
        } : null;

        testResults.push({
          contentType,
          testOutcome,
          analysis,
          contentPreview,
          rawResponse: {
            success: result.success,
            timestamp: result.timestamp,
            statistics: result.statistics,
            processing_info: result.processing_info
          }
        });

      } catch (error) {
        console.error(`❌ Error testing ${contentType}:`, error);
        testResults.push({
          contentType,
          testOutcome: 'test_error',
          analysis: {
            contentType,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          },
          contentPreview: null,
          rawResponse: null
        });
      }
    }

    // Analyze overall results
    const summary = {
      totalTests: testResults.length,
      primarySuccess: testResults.filter(r => r.testOutcome === 'primary_success').length,
      fallbackSuccess: testResults.filter(r => r.testOutcome === 'fallback_success').length,
      failures: testResults.filter(r => r.testOutcome === 'failure').length,
      testErrors: testResults.filter(r => r.testOutcome === 'test_error').length,
      
      // Fallback analysis
      fallbackTypes: testResults
        .filter(r => r.analysis.fallbackUsed)
        .map(r => ({
          from: r.analysis.originalRequestType,
          to: r.analysis.finalContentType,
          reason: r.analysis.fallbackReason,
          quality: r.analysis.qualityScore
        })),
      
      // Content type success rates
      successRates: contentTypes.reduce((acc, type) => {
        const typeResults = testResults.filter(r => r.contentType === type);
        const successes = typeResults.filter(r => 
          r.testOutcome === 'primary_success' || r.testOutcome === 'fallback_success'
        ).length;
        acc[type] = typeResults.length > 0 ? (successes / typeResults.length) * 100 : 0;
        return acc;
      }, {} as { [key: string]: number })
    };

    // System health assessment
    const systemHealth = {
      overallScore: ((summary.primarySuccess + summary.fallbackSuccess) / summary.totalTests) * 100,
      fallbackEffectiveness: summary.fallbackSuccess > 0 ? 
        (summary.fallbackSuccess / (summary.fallbackSuccess + summary.failures)) * 100 : 0,
      
      status: summary.failures === 0 ? 'excellent' :
              summary.failures <= 1 ? 'good' :
              summary.failures <= 2 ? 'fair' : 'needs_attention',
      
      recommendations: []
    };

    // Generate recommendations
    if (summary.failures > 0) {
      systemHealth.recommendations.push(
        `🔧 ${summary.failures} content type(s) failing - investigate data sources`
      );
    }
    
    if (summary.fallbackSuccess > summary.primarySuccess) {
      systemHealth.recommendations.push(
        '⚠️ High fallback usage - check primary data source availability'
      );
    }
    
    if (summary.primarySuccess === summary.totalTests) {
      systemHealth.recommendations.push(
        '✅ All content types working with primary data - excellent system health'
      );
    }
    
    if (systemHealth.fallbackEffectiveness > 80) {
      systemHealth.recommendations.push(
        '🔄 Fallback system performing excellently - graceful degradation working'
      );
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      test_parameters: {
        language,
        contentTypesTest: contentTypes,
        testAll
      },
      
      summary,
      
      system_health: systemHealth,
      
      detailed_results: testResults,
      
      fallback_insights: {
        mostCommonFallback: summary.fallbackTypes.length > 0 ? 
          summary.fallbackTypes.reduce((acc, curr) => {
            const key = `${curr.from} → ${curr.to}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {} as { [key: string]: number }) : {},
        
        averageQualityScore: summary.fallbackTypes.length > 0 ?
          summary.fallbackTypes.reduce((sum, f) => sum + (f.quality || 0), 0) / summary.fallbackTypes.length :
          0,
        
        fallbackReasons: [...new Set(summary.fallbackTypes.map(f => f.reason))]
      },
      
      next_steps: systemHealth.status === 'excellent' ? [
        '✅ System operating optimally',
        '📊 Monitor fallback patterns for insights',
        '🔄 Consider predictive fallback strategies'
      ] : systemHealth.status === 'good' ? [
        '📈 System performing well with minor issues',
        '🔧 Address failing content types',
        '📊 Monitor fallback effectiveness'
      ] : [
        '⚠️ System needs attention',
        '🔧 Investigate failing content types immediately',
        '📞 Check data source connectivity',
        '🔄 Verify fallback chain configuration'
      ]
    });

  } catch (error) {
    console.error('❌ Error in comprehensive fallback test:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to test comprehensive fallback system',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      contentTypes = ['live', 'betting', 'analysis'],
      language = 'en',
      action = 'preview',
      simulateFailures = false
    } = body;

    console.log(`🧪 Custom fallback test:`, { contentTypes, language, action, simulateFailures });

    const testResults = [];

    for (const contentType of contentTypes) {
      try {
        let apiUrl = `http://localhost:3001/api/unified-content?action=${action}&type=${contentType}&language=${language}`;
        
        // If simulating failures, we could modify the request or use special parameters
        if (simulateFailures) {
          apiUrl += '&simulate_failure=true';
        }

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            max_posts_per_channel: 1,
            simulate_failure: simulateFailures
          })
        });

        const result = await response.json();

        testResults.push({
          contentType,
          success: result.success,
          fallbackUsed: result.processing_info?.fallback_used || false,
          finalType: result.processing_info?.final_content_type || contentType,
          dataSource: result.processing_info?.data_source,
          contentGenerated: result.content_items?.length || result.preview_items?.length || 0,
          fullResult: result
        });

      } catch (error) {
        testResults.push({
          contentType,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          fallbackUsed: false
        });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      custom_test_results: testResults,
      
      test_summary: {
        totalRequests: contentTypes.length,
        successfulRequests: testResults.filter(r => r.success).length,
        fallbacksTriggered: testResults.filter(r => r.fallbackUsed).length,
        contentGenerated: testResults.reduce((sum, r) => sum + (r.contentGenerated || 0), 0)
      }
    });

  } catch (error) {
    console.error('❌ Error in custom fallback test:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process custom fallback test',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}