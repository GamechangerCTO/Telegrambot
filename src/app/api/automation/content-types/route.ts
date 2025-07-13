import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// PUT - Update content types configuration
export async function PUT(request: NextRequest) {
  try {
    console.log('🔄 Updating content types configuration... [Version 2.0]');
    
    const body = await request.json();
    const { contentTypes } = body;

    if (!Array.isArray(contentTypes)) {
      return NextResponse.json({ 
        success: false, 
        error: 'contentTypes must be an array' 
      }, { status: 400 });
    }

    // Extract active content type IDs
    const activeContentTypes = contentTypes
      .filter(ct => ct.enabled)
      .map(ct => ct.id);

    // Update automation settings
    const { data: settings, error } = await supabase
      .from('automation_settings')
      .update({
        active_content_types: activeContentTypes,
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', 'default')
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating content types:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update content types configuration' 
      }, { status: 500 });
    }

    // Also update automation rules to enable/disable based on content types
    for (const contentType of contentTypes) {
      await supabase
        .from('automation_rules')
        .update({ enabled: contentType.enabled })
        .eq('content_type', contentType.id)
        .eq('organization_id', 'default');
    }

    console.log('✅ Content types configuration updated successfully');
    return NextResponse.json({
      success: true,
      message: 'Content types configuration updated successfully',
      activeContentTypes
    });

  } catch (error) {
    console.error('❌ Error updating content types:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// GET - Fetch content types configuration
export async function GET(request: NextRequest) {
  try {
    console.log('🎯 Fetching content types configuration...');

    // Get automation settings to see which content types are active
    const { data: settings, error: settingsError } = await supabase
      .from('automation_settings')
      .select('active_content_types')
      .eq('organization_id', 'default')
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('❌ Error fetching automation settings:', settingsError);
    }

    const activeContentTypes = settings?.active_content_types || ['live', 'betting', 'news', 'coupons'];

    // Get recent performance data for each content type
    const { data: recentContent, error: contentError } = await supabase
      .from('generated_content')
      .select('content_type, created_at')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (contentError) {
      console.error('❌ Error fetching recent content:', contentError);
    }

    // Calculate performance metrics for each content type
    const contentMetrics = (recentContent || []).reduce((acc: any, content: any) => {
      const type = content.content_type;
      if (!acc[type]) {
        acc[type] = { count: 0, lastGenerated: null };
      }
      acc[type].count++;
      if (!acc[type].lastGenerated || new Date(content.created_at) > new Date(acc[type].lastGenerated)) {
        acc[type].lastGenerated = content.created_at;
      }
      return acc;
    }, {});

    // Define content types with their configurations
    const contentTypesConfig = [
      {
        id: 'live',
        name: 'Live Updates',
        emoji: '🔴',
        description: 'Real-time match updates and scores',
        enabled: activeContentTypes.includes('live'),
        performance: getPerformanceRating(contentMetrics['live']?.count || 0),
        lastGenerated: contentMetrics['live']?.lastGenerated
      },
      {
        id: 'betting',
        name: 'Betting Tips',
        emoji: '🎯',
        description: 'AI-powered betting predictions and analysis',
        enabled: activeContentTypes.includes('betting'),
        performance: getPerformanceRating(contentMetrics['betting']?.count || 0),
        lastGenerated: contentMetrics['betting']?.lastGenerated
      },
      {
        id: 'news',
        name: 'Football News',
        emoji: '📰',
        description: 'Latest news summaries from RSS feeds',
        enabled: activeContentTypes.includes('news'),
        performance: getPerformanceRating(contentMetrics['news']?.count || 0),
        lastGenerated: contentMetrics['news']?.lastGenerated
      },
      {
        id: 'analysis',
        name: 'Match Analysis',
        emoji: '📈',
        description: 'Deep tactical and statistical analysis',
        enabled: activeContentTypes.includes('analysis'),
        performance: getPerformanceRating(contentMetrics['analysis']?.count || 0),
        lastGenerated: contentMetrics['analysis']?.lastGenerated
      },
      {
        id: 'polls',
        name: 'Fan Polls',
        emoji: '📊',
        description: 'Interactive polls for fan engagement',
        enabled: activeContentTypes.includes('polls'),
        performance: getPerformanceRating(contentMetrics['polls']?.count || 0),
        lastGenerated: contentMetrics['polls']?.lastGenerated
      },
      {
        id: 'coupons',
        name: 'Smart Coupons',
        emoji: '🎫',
        description: 'Promotional content and offers',
        enabled: activeContentTypes.includes('coupons'),
        performance: getPerformanceRating(contentMetrics['coupons']?.count || 0),
        lastGenerated: contentMetrics['coupons']?.lastGenerated
      }
    ];

    console.log('✅ Content types configuration retrieved successfully');
    return NextResponse.json({
      success: true,
      contentTypes: contentTypesConfig
    });

  } catch (error) {
    console.error('❌ Error fetching content types:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch content types configuration',
      contentTypes: []
    }, { status: 500 });
  }
}

// Helper function to determine performance rating based on content count
function getPerformanceRating(count: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (count >= 20) return 'excellent';
  if (count >= 10) return 'good';
  if (count >= 3) return 'fair';
  return 'poor';
}