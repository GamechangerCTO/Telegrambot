import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Check if full automation is enabled in settings
    const { data: settings, error } = await supabase
      .from('automation_settings')
      .select('full_automation_enabled')
      .eq('organization_id', 'default')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching automation settings:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch automation settings' 
      }, { status: 500 });
    }

    // If no settings exist, create default
    if (!settings) {
      const { error: insertError } = await supabase
        .from('automation_settings')
        .insert([
          {
            organization_id: 'default',
            full_automation_enabled: false
          }
        ]);

      if (insertError) {
        console.error('Error creating automation settings:', insertError);
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to create automation settings' 
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        enabled: false
      });
    }

    return NextResponse.json({
      success: true,
      enabled: settings.full_automation_enabled || false
    });

  } catch (error) {
    console.error('Error in full automation status:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 