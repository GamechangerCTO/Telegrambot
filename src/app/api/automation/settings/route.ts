import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Fetch automation settings
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching automation settings...');
    
    // Fetch automation settings from database
    const { data: settings, error } = await supabase
      .from('automation_settings')
      .select('*')
      .eq('organization_id', 'default')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error fetching automation settings:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch automation settings' 
      }, { status: 500 });
    }

    // If no settings exist, create default ones
    if (!settings) {
      console.log('📝 Creating default automation settings...');
      const defaultSettings = {
        organization_id: 'default',
        full_automation_enabled: false,
        content_generation_interval: 30,
        max_daily_content: 50,
        retry_failed_content: true,
        notify_on_errors: true,
        active_content_types: ['live', 'betting', 'news', 'coupons'],
        updated_at: new Date().toISOString()
      };

      const { data: newSettings, error: insertError } = await supabase
        .from('automation_settings')
        .insert([defaultSettings])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error creating automation settings:', insertError);
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to create automation settings' 
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        ...newSettings
      });
    }

    console.log('✅ Automation settings retrieved successfully');
    return NextResponse.json({
      success: true,
      ...settings
    });

  } catch (error) {
    console.error('❌ Error in automation settings GET:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// PUT - Update automation settings
export async function PUT(request: NextRequest) {
  try {
    console.log('🔄 Updating automation settings...');
    
    const body = await request.json();
    const { full_automation_enabled, ...otherSettings } = body;

    // Update settings in database
    const updateData = {
      ...otherSettings,
      full_automation_enabled: full_automation_enabled,
      updated_at: new Date().toISOString()
    };

    const { data: settings, error } = await supabase
      .from('automation_settings')
      .update(updateData)
      .eq('organization_id', 'default')
      .select()
      .single();

    if (error) {
      // If record doesn't exist, create it
      if (error.code === 'PGRST116') {
        console.log('📝 Creating new automation settings record...');
        const { data: newSettings, error: insertError } = await supabase
          .from('automation_settings')
          .insert([{
            organization_id: 'default',
            ...updateData
          }])
          .select()
          .single();

        if (insertError) {
          console.error('❌ Error creating automation settings:', insertError);
          return NextResponse.json({ 
            success: false, 
            error: 'Failed to create automation settings' 
          }, { status: 500 });
        }

        console.log('✅ Automation settings created successfully');
        return NextResponse.json({
          success: true,
          message: 'Automation settings created successfully',
          ...newSettings
        });
      }

      console.error('❌ Error updating automation settings:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update automation settings' 
      }, { status: 500 });
    }

    console.log('✅ Automation settings updated successfully');
    return NextResponse.json({
      success: true,
      message: 'Automation settings updated successfully',
      ...settings
    });

  } catch (error) {
    console.error('❌ Error in automation settings PUT:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}