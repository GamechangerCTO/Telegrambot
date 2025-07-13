import { NextRequest, NextResponse } from 'next/server';
import { TelegramSender } from '@/lib/content/telegram-sender';
import { apiResponse } from '@/lib/utils/api-utils';

export async function POST(request: NextRequest) {
  try {
    const { botToken, channelId, message } = await request.json();

    if (!botToken || !channelId || !message) {
      return apiResponse.badRequest('Missing required fields: botToken, channelId, message');
    }

    console.log('🧪 Testing Telegram send with:', {
      botToken: botToken.substring(0, 10) + '...',
      channelId,
      messageLength: message.length
    });

    const telegramSender = new TelegramSender();
    
    const result = await telegramSender.sendMessage({
      botToken,
      channelId,
      content: message,
      parseMode: 'HTML'
    });

    if (result.success) {
      return apiResponse.success({
        sent: true,
        messageId: result.messageId,
        timestamp: result.timestamp
      });
    } else {
      return apiResponse.error(`Telegram send failed: ${result.error}`, 400);
    }

  } catch (error: any) {
    console.error('❌ Telegram test error:', error);
    return apiResponse.internalError(`Telegram test failed: ${error.message}`);
  }
}