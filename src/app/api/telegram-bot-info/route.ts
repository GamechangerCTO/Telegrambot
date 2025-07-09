import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Bot token is required' },
        { status: 400 }
      );
    }

    // Validate token format
    if (!token.includes(':') || token.length < 45) {
      return NextResponse.json(
        { error: 'Invalid bot token format' },
        { status: 400 }
      );
    }

    // Fetch bot info from Telegram API
    const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    
    if (!telegramResponse.ok) {
      return NextResponse.json(
        { error: 'Invalid bot token or Telegram API error' },
        { status: 400 }
      );
    }

    const telegramData = await telegramResponse.json();

    if (!telegramData.ok) {
      return NextResponse.json(
        { error: 'Invalid bot token' },
        { status: 400 }
      );
    }

    const botInfo = telegramData.result;

    // Return bot information
    return NextResponse.json({
      success: true,
      botInfo: {
        id: botInfo.id,
        first_name: botInfo.first_name,
        username: botInfo.username,
        can_join_groups: botInfo.can_join_groups,
        can_read_all_group_messages: botInfo.can_read_all_group_messages,
        supports_inline_queries: botInfo.supports_inline_queries,
        is_bot: botInfo.is_bot
      }
    });

  } catch (error) {
    console.error('Error fetching bot info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bot information' },
      { status: 500 }
    );
  }
} 