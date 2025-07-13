import { NextRequest, NextResponse } from 'next/server';
import { TelegramSender } from '@/lib/content/telegram-sender';
import { supabase } from '@/lib/supabase';

// Function to decrypt/decode bot token (same logic as in other APIs)
function decryptBotToken(encryptedToken: string): string {
  try {
    // If token is already in correct format (contains ':' and has reasonable length)
    if (encryptedToken.includes(':') && encryptedToken.length > 20) {
      console.log('✅ Token already in correct format');
      return encryptedToken;
    }

    // Try to decode from base64
    try {
      const decoded = Buffer.from(encryptedToken, 'base64').toString('utf-8');
      if (decoded.includes(':') && decoded.length > 20) {
        console.log('🔓 Successfully decoded base64 token');
        return decoded;
      }
    } catch (decodeError) {
      console.log('⚠️ Failed to decode base64, using token as-is');
    }

    // Return original if no decryption worked
    return encryptedToken;
  } catch (error) {
    console.error('Token decryption error:', error);
    return encryptedToken;
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEBUG: בדיקת תקינות בוט וערוץ טלגרם');
    
    const telegramSender = new TelegramSender();
    
    // 1. קבלת נתוני בוט וערוץ מהמסד
    const { data: channelData, error: channelError } = await supabase
      .from('channels')
      .select(`
        id, 
        name,
        telegram_channel_id,
        telegram_channel_username,
        bot_id,
        is_active,
        language,
        bots:bot_id (
          name,
          telegram_bot_username,
          is_active,
          telegram_token_encrypted
        )
      `)
      .eq('name', 'AfircaSportCenter')
      .single();
    
    if (channelError || !channelData) {
      return NextResponse.json({
        error: 'ערוץ AfircaSportCenter לא נמצא במסד הנתונים',
        details: channelError?.message
      }, { status: 404 });
    }

    // @ts-ignore - Supabase types can be complex with joins
    const botData = Array.isArray(channelData.bots) ? channelData.bots[0] : channelData.bots;
    
    if (!botData || !botData.telegram_token_encrypted) {
      return NextResponse.json({
        error: 'טוקן בוט לא נמצא'
      }, { status: 404 });
    }

    // 2. פענוח הטוקן
    const encryptedToken = botData.telegram_token_encrypted;
    const decryptedToken = decryptBotToken(encryptedToken);
    
    console.log(`🔍 Token info - Original length: ${encryptedToken.length}, Decrypted length: ${decryptedToken.length}`);
    console.log(`🔍 Token format check - Contains colon: ${decryptedToken.includes(':')}`);
    
    // 3. בדיקת תקינות הבוט
    const botValidation = await telegramSender.validateBot(decryptedToken);
    
    // 4. בדיקת נגישות הערוץ
    const channelValidation = await telegramSender.getChannelInfo(
      decryptedToken, 
      channelData.telegram_channel_id
    );
    
    // 5. בדיקה עם username גם
    const channelValidationUsername = await telegramSender.getChannelInfo(
      decryptedToken,
      `@${channelData.telegram_channel_username}`
    );
    
    return NextResponse.json({
      message: 'בדיקת טלגרם הושלמה',
      timestamp: new Date().toISOString(),
      channel_data: {
        id: channelData.id,
        name: channelData.name,
        telegram_channel_id: channelData.telegram_channel_id,
        telegram_channel_username: channelData.telegram_channel_username,
        language: channelData.language,
        is_active: channelData.is_active
      },
      bot_data: {
        id: channelData.bot_id,
        name: botData.name,
        username: botData.telegram_bot_username,
        is_active: botData.is_active
      },
      token_info: {
        encrypted_length: encryptedToken.length,
        decrypted_length: decryptedToken.length,
        has_colon: decryptedToken.includes(':'),
        format_looks_valid: decryptedToken.includes(':') && decryptedToken.length > 40
      },
      validation_results: {
        bot_validation: botValidation,
        channel_validation_by_id: channelValidation,
        channel_validation_by_username: channelValidationUsername
      },
      suggested_fixes: {
        if_bot_invalid: 'הטוקן של הבוט פג תוקף או שגוי - צריך להחליף בהגדרות',
        if_channel_not_found: 'הבוט אינו מנהל של הערוץ או שהערוץ לא קיים',
        if_wrong_chat_id: 'ה-chat_id שגוי - נסה עם @ במקום ID'
      }
    });

  } catch (error) {
    console.error(`❌ Error in telegram debug:`, error);
    return NextResponse.json({
      error: 'שגיאה בבדיקת טלגרם',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 