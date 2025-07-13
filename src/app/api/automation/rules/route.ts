import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Fetch all automation rules
export async function GET(request: NextRequest) {
  try {
    console.log('📋 Fetching automation rules...');

    const { data: rules, error } = await supabase
      .from('automation_rules')
      .select(`
        id,
        name,
        enabled,
        automation_type,
        content_type,
        config,
        last_run,
        success_count,
        error_count,
        created_at,
        updated_at,
        organization_id
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching automation rules:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch automation rules' 
      }, { status: 500 });
    }

    // Calculate stats for each rule
    const rulesWithStats = rules?.map(rule => ({
      ...rule,
      stats: {
        totalRuns: (rule.success_count || 0) + (rule.error_count || 0),
        successRate: rule.success_count && (rule.success_count + (rule.error_count || 0)) > 0 
          ? Math.round((rule.success_count / (rule.success_count + (rule.error_count || 0))) * 100)
          : 0,
        contentGenerated: rule.success_count || 0
      }
    })) || [];

    console.log(`✅ Found ${rulesWithStats.length} automation rules`);
    return NextResponse.json({
      success: true,
      rules: rulesWithStats
    });

  } catch (error) {
    console.error('❌ Error in automation rules GET:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      rules: []
    }, { status: 500 });
  }
}

// POST - Create new automation rule
export async function POST(request: NextRequest) {
  try {
    console.log('➕ Creating new automation rule...');
    
    const body = await request.json();
    const { name, automation_type, content_type, config, enabled = true } = body;

    // Validate required fields
    if (!name || !automation_type || !content_type) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: name, automation_type, content_type' 
      }, { status: 400 });
    }

    // Create the automation rule
    const newRule = {
      name,
      automation_type,
      content_type,
      config: config || {},
      enabled,
      organization_id: 'default',
      success_count: 0,
      error_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: rule, error } = await supabase
      .from('automation_rules')
      .insert([newRule])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating automation rule:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create automation rule' 
      }, { status: 500 });
    }

    console.log('✅ Automation rule created successfully:', rule.id);
    return NextResponse.json({
      success: true,
      message: 'Automation rule created successfully',
      rule: {
        ...rule,
        stats: {
          totalRuns: 0,
          successRate: 0,
          contentGenerated: 0
        }
      }
    });

  } catch (error) {
    console.error('❌ Error in automation rules POST:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// PUT - Update automation rule
export async function PUT(request: NextRequest) {
  try {
    console.log('🔄 Updating automation rule...');
    
    const body = await request.json();
    const { id, name, automation_type, content_type, config, enabled } = body;

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Rule ID is required' 
      }, { status: 400 });
    }

    // Update the automation rule
    const updateData = {
      ...(name && { name }),
      ...(automation_type && { automation_type }),
      ...(content_type && { content_type }),
      ...(config && { config }),
      ...(enabled !== undefined && { enabled }),
      updated_at: new Date().toISOString()
    };

    const { data: rule, error } = await supabase
      .from('automation_rules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating automation rule:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update automation rule' 
      }, { status: 500 });
    }

    console.log('✅ Automation rule updated successfully:', rule.id);
    return NextResponse.json({
      success: true,
      message: 'Automation rule updated successfully',
      rule
    });

  } catch (error) {
    console.error('❌ Error in automation rules PUT:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}