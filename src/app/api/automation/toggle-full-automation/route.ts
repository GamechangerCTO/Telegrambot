import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { enabled } = await request.json();

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid enabled value' 
      }, { status: 400 });
    }

    // Check if settings exist
    const { data: existingSettings, error: fetchError } = await supabaseServer
      .from('automation_settings')
      .select('*')
      .eq('organization_id', 'default')
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching automation settings:', fetchError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch automation settings' 
      }, { status: 500 });
    }

    // Update or insert settings
    if (existingSettings) {
      const { error: updateError } = await supabaseServer
        .from('automation_settings')
        .update({ 
          full_automation_enabled: enabled,
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', 'default');

      if (updateError) {
        console.error('Error updating automation settings:', updateError);
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to update automation settings' 
        }, { status: 500 });
      }
    } else {
      const { error: insertError } = await supabaseServer
        .from('automation_settings')
        .insert([
          {
            organization_id: 'default',
            full_automation_enabled: enabled
          }
        ]);

      if (insertError) {
        console.error('Error creating automation settings:', insertError);
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to create automation settings' 
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      enabled: enabled,
      message: `Full automation ${enabled ? 'enabled' : 'disabled'} successfully`
    });

  } catch (error) {
    console.error('Error in toggle full automation:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 