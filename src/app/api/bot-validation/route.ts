import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { botId } = await request.json();

    if (!botId) {
      return NextResponse.json(
        { error: 'Bot ID is required' },
        { status: 400 }
      );
    }

    // Use centralized Supabase client

    // בדיקת הבוט במסד הנתונים
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('*')
      .eq('id', botId)
      .single();

    if (botError || !bot) {
      return NextResponse.json(
        { error: 'Bot not found' },
        { status: 404 }
      );
    }

    const issues = [];
    const fixes = [];

    // בדיקה 1: האם הטוקן נשמר נכון
    if (!bot.telegram_token_encrypted) {
      issues.push('Missing telegram token');
    } else {
      // בדיקת תקינות הטוקן מול Telegram API
      try {
        // לוגיקה חכמה לפענוח הטוקן
        let botToken = bot.telegram_token_encrypted;
        
        // בדיקה אם הטוקן כבר בפורמט נכון (מכיל : ויש לו אורך סביר)
        if (!botToken.includes(':') || botToken.length < 20) {
          // אם לא, ננסה לפענח מ-base64
          try {
            const decoded = Buffer.from(botToken, 'base64').toString('utf-8');
            if (decoded.includes(':') && decoded.length > 20) {
              botToken = decoded;
              console.log(`🔓 Decoded base64 token for ${bot.name}`);
            }
          } catch (decodeError) {
            console.log(`⚠️ Failed to decode token for ${bot.name}, using as-is`);
          }
        } else {
          console.log(`✅ Token for ${bot.name} already in correct format`);
        }

        console.log(`🔍 Testing telegram token for ${bot.name}...`);
        const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
        const telegramData = await telegramResponse.json();
        
        console.log(`📊 Telegram API response for ${bot.name}:`, { ok: telegramData.ok, error: telegramData.description });
        
        if (!telegramData.ok) {
          issues.push(`Invalid telegram token - ${telegramData.description || 'bot not accessible'}`);
        } else {
          fixes.push('Telegram token is valid and bot is accessible');
        }
      } catch (error) {
        console.error(`❌ Token validation error for ${bot.name}:`, error);
        issues.push('Failed to validate telegram token');
      }
    }

    // בדיקה 2: האם יש ערוצים מקושרים לבוט
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select('*')
      .eq('bot_id', botId);

    if (channelsError) {
      issues.push('Failed to check bot channels');
    } else {
      if (channels.length === 0) {
        issues.push('No channels linked to this bot');
      } else {
        // בדיקת תקינות כל ערוץ
        for (const channel of channels) {
          if (!channel.telegram_channel_id) {
            issues.push(`Channel "${channel.name}" missing telegram_channel_id`);
          }
          if (!channel.is_active) {
            issues.push(`Channel "${channel.name}" is inactive`);
          }
        }
        fixes.push(`Found ${channels.length} channels linked to bot`);
      }
    }

    // בדיקה 3: האם הבוט פעיל
    if (!bot.is_active) {
      issues.push('Bot is inactive');
    } else {
      fixes.push('Bot is active');
    }

    // בדיקה 4: האם יש manager מקושר
    if (!bot.manager_id) {
      issues.push('Bot not linked to any manager');
    } else {
      console.log(`🔍 Checking manager with ID: ${bot.manager_id}`);
      
      const { data: manager, error: managerError } = await supabase
        .from('managers')
        .select('*')
        .eq('id', bot.manager_id)
        .single();

      console.log(`📊 Manager query result:`, { manager, managerError });

      if (managerError) {
        console.error('❌ Manager query error:', managerError);
        issues.push(`Failed to query manager: ${managerError.message}`);
      } else if (!manager) {
        console.log('❌ No manager found for ID:', bot.manager_id);
        issues.push('Bot linked to non-existent manager');
      } else if (!manager.is_active) {
        console.log('⚠️ Manager found but inactive:', manager);
        issues.push('Bot linked to inactive manager');
      } else {
        console.log('✅ Manager found and active:', manager.name);
        fixes.push('Bot properly linked to active manager');
      }
    }

    // תיקון אוטומטי של בעיות פשוטות
    const autoFixes = [];

    // אם הבוט לא פעיל, הפעל אותו
    if (!bot.is_active) {
      const { error: updateError } = await supabase
        .from('bots')
        .update({ is_active: true })
        .eq('id', botId);

      if (!updateError) {
        autoFixes.push('Activated bot');
      }
    }

    return NextResponse.json({
      success: true,
      bot: {
        id: bot.id,
        name: bot.name,
        telegram_bot_username: bot.telegram_bot_username,
        is_active: bot.is_active,
        language_code: bot.language_code
      },
      validation: {
        issues,
        fixes,
        autoFixes,
        isFullyFunctional: issues.length === 0
      }
    });

  } catch (error) {
    console.error('Error validating bot:', error);
    return NextResponse.json(
      { error: 'Failed to validate bot' },
      { status: 500 }
    );
  }
} 