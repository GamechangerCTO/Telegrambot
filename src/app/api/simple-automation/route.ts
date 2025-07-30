import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { simpleContentGenerator } from '@/lib/content/simple-content-generator';

// GET - קבלת סטטוס אוטומציה של כל הערוצים
export async function GET() {
  try {
    const supabase = createClient();
    
    const { data: channels, error } = await supabase
      .from('channels')
      .select('id, name, language, is_active, content_types, automation_hours, last_content_sent, channel_id')
      .order('name');

    if (error) throw error;

    return NextResponse.json({
      success: true,
      channels: channels || []
    });
  } catch (error) {
    console.error('Error fetching automation status:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בטעינת נתוני האוטומציה' },
      { status: 500 }
    );
  }
}

// POST - הפעלת/השבתת אוטומציה לערוץ ספציפי או פרסום ידני
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, channelId, contentType } = body;

    const supabase = createClient();

    switch (action) {
      case 'toggle_automation':
        // החלף סטטוס אוטומציה
        const { data: channel, error: fetchError } = await supabase
          .from('channels')
          .select('is_active')
          .eq('id', channelId)
          .single();

        if (fetchError) throw fetchError;

        const { error: updateError } = await supabase
          .from('channels')
          .update({ is_active: !channel.is_active })
          .eq('id', channelId);

        if (updateError) throw updateError;

        return NextResponse.json({
          success: true,
          message: `אוטומציה ${!channel.is_active ? 'הופעלה' : 'הושבתה'} בהצלחה`
        });

      case 'send_content':
        // שלח תוכן ידני לערוץ באמצעות הגנרטורים החדשים
        console.log(`🎯 מתחיל יצירת תוכן ${contentType} לערוץ ${channelId}`);
        
        const contentResult = await simpleContentGenerator.generateForSpecificChannels(
          [channelId], 
          contentType
        );

        if (!contentResult.success || contentResult.contentItems.length === 0) {
          throw new Error('שגיאה ביצירת התוכן');
        }

        // שלח את התוכן לטלגרם
        const contentItem = contentResult.contentItems[0];
        const telegramResult = await sendToTelegram(contentItem);

        if (!telegramResult.success) {
          throw new Error('שגיאה בשליחת התוכן לטלגרם');
        }

        // עדכן זמן שליחה אחרונה
        await supabase
          .from('channels')
          .update({ 
            last_content_sent: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', channelId);

        return NextResponse.json({
          success: true,
          message: 'התוכן נשלח בהצלחה',
          data: {
            content: contentItem.content,
            language: contentItem.language,
            channel: contentItem.channel.name
          }
        });

      case 'get_channel_status':
        // קבל סטטוס ערוץ ספציפי
        const { data: channelData, error: channelError } = await supabase
          .from('channels')
          .select('*')
          .eq('id', channelId)
          .single();

        if (channelError) throw channelError;

        return NextResponse.json({
          success: true,
          channel: channelData
        });

      default:
        return NextResponse.json(
          { success: false, error: 'פעולה לא מוכרת' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Simple automation error:', error);
    return NextResponse.json(
      { success: false, error: 'שגיאה בביצוע הפעולה' },
      { status: 500 }
    );
  }
}

// פונקציה לשליחת תוכן לטלגרם
async function sendToTelegram(contentItem: any): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    
    // קבל פרטי בוט מהמסד נתונים
    const { data: channelWithBot, error } = await supabase
      .from('channels')
      .select(`
        id,
        channel_id,
        bots!inner(
          telegram_token_encrypted,
          is_active
        )
      `)
      .eq('id', contentItem.channel.id)
      .eq('bots.is_active', true)
      .single();

    if (error || !channelWithBot) {
      throw new Error('לא נמצא בוט פעיל לערוץ');
    }

    const botToken = (channelWithBot as any).bots.telegram_token_encrypted;
    const channelId = channelWithBot.channel_id;

    // 🌙 Smart silent messaging for night hours (11 PM - 6 AM UTC)
    const currentHour = new Date().getUTCHours();
    const isNightTime = currentHour >= 23 || currentHour < 6;
    
    console.log(`⏰ Simple automation - UTC hour: ${currentHour}, Night time: ${isNightTime}`);

    // שלח הודעה לטלגרם
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: channelId,
        text: contentItem.content,
        parse_mode: 'HTML',
        disable_notification: isNightTime  // 🔇 Silent messages during night hours
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(`שגיאה בשליחה לטלגרם: ${result.description || 'שגיאה לא ידועה'}`);
    }

    console.log(`✅ תוכן נשלח בהצלחה לערוץ ${contentItem.channel.name}`);
    return { success: true };

  } catch (error) {
    console.error('❌ שגיאה בשליחה לטלגרם:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'שגיאה לא ידועה'
    };
  }
} 