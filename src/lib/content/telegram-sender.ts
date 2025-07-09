import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'
import { aiImageGenerator } from './ai-image-generator'

/**
 * Telegram Sender for distributing content to channels
 * Handles bot token management and message sending
 */

interface TelegramSendOptions {
  botToken: string
  channelId: string
  content: string
  imageUrl?: string
  inlineKeyboard?: Array<Array<{text: string, url?: string, callback_data?: string}>>
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2'
  disablePreview?: boolean
  poll?: {
    question: string
    options: string[]
    isAnonymous?: boolean
    type?: 'regular' | 'quiz'
    allowsMultipleAnswers?: boolean
    correctOptionId?: number
    explanation?: string
    openPeriod?: number
    closeDate?: number
  }
}

interface TelegramResponse {
  success: boolean
  messageId?: number
  error?: string
  timestamp: Date
}

export class TelegramSender {
  constructor() {
    // Use centralized Supabase client
  }

  async sendMessage(options: TelegramSendOptions): Promise<TelegramResponse> {
    try {
      const { botToken, channelId, content, imageUrl, inlineKeyboard, parseMode = 'HTML', disablePreview = false, poll } = options

      // בדיקת תקינות הפרמטרים
      if (!botToken || !channelId) {
        throw new Error('Missing required parameters: botToken or channelId')
      }

      // אם יש פרמטר poll, שולחים סקר במקום טקסט
      if (poll) {
        if (!poll.question || !poll.options || poll.options.length < 2) {
          throw new Error('Poll must have a question and at least 2 options')
        }
        return await this.sendPoll(botToken, channelId, poll)
      }

      // אם אין תוכן (content), זה שגיאה (אלא אם יש poll)
      if (!content) {
        throw new Error('Missing required parameter: content')
      }

      const telegramApiUrl = `https://api.telegram.org/bot${botToken}`
      
      let response: any
      
      if (imageUrl) {
        // שליחת תמונה עם טקסט
        response = await this.sendPhoto(telegramApiUrl, channelId, content, imageUrl, inlineKeyboard, parseMode)
      } else {
        // שליחת טקסט בלבד
        response = await this.sendTextMessage(telegramApiUrl, channelId, content, inlineKeyboard, parseMode, disablePreview)
      }

      if (response.ok) {
        const result = await response.json()
        
        // שמירת לוג הצלחה במסד הנתונים
        await this.logMessage({
          channel_id: channelId,
          content: content.substring(0, 500), // חיתוך התוכן לשמירה
          telegram_message_id: result.result.message_id,
          status: 'sent',
          sent_at: new Date().toISOString()
        })

        return {
          success: true,
          messageId: result.result.message_id,
          timestamp: new Date()
        }
      } else {
        const errorData = await response.json()
        const errorMessage = errorData.description || 'Unknown Telegram API error'
        
        // שמירת לוג שגיאה
        await this.logMessage({
          channel_id: channelId,
          content: content.substring(0, 500),
          status: 'failed',
          error_message: errorMessage,
          sent_at: new Date().toISOString()
        })

        return {
          success: false,
          error: errorMessage,
          timestamp: new Date()
        }
      }
    } catch (error) {
      console.error('🚨 Telegram sending error:', error)
      
      // שמירת לוג שגיאה כללית
      await this.logMessage({
        channel_id: options.channelId,
        content: options.content ? options.content.substring(0, 500) : 'Poll content',
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        sent_at: new Date().toISOString()
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date()
      }
    }
  }

  private async sendPhoto(
    apiUrl: string,
    chatId: string,
    caption: string,
    photoUrl: string,
    keyboard?: Array<Array<{text: string, url?: string, callback_data?: string}>>,
    parseMode: string = 'HTML'
  ) {
    try {
      console.log('📷 Attempting to send photo via Telegram:', photoUrl);
      
      // Download the image first to send as buffer instead of URL
      const imageResponse = await fetch(photoUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.status} ${imageResponse.statusText}`);
      }
      
      const imageBuffer = await imageResponse.arrayBuffer();
      const imageBlob = new Blob([imageBuffer], { type: 'image/png' });
      
      console.log(`📊 Image downloaded successfully: ${imageBuffer.byteLength} bytes`);
      
      // Create FormData to send image as file
      const formData = new FormData();
      formData.append('chat_id', chatId);
      formData.append('photo', imageBlob, 'image.png');
      formData.append('caption', caption);
      formData.append('parse_mode', parseMode);

      if (keyboard && keyboard.length > 0) {
        formData.append('reply_markup', JSON.stringify({
          inline_keyboard: keyboard
        }));
      }

      return fetch(`${apiUrl}/sendPhoto`, {
        method: 'POST',
        body: formData // Using FormData instead of JSON
      });
      
    } catch (error) {
      console.error('❌ Error in sendPhoto:', error);
      // Fallback to URL method if file upload fails
      console.log('🔄 Falling back to URL method...');
      
      const payload: any = {
        chat_id: chatId,
        photo: photoUrl,
        caption: caption,
        parse_mode: parseMode
      }

      if (keyboard && keyboard.length > 0) {
        payload.reply_markup = {
          inline_keyboard: keyboard
        }
      }

      return fetch(`${apiUrl}/sendPhoto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
    }
  }

  private async sendTextMessage(
    apiUrl: string,
    chatId: string,
    text: string,
    keyboard?: Array<Array<{text: string, url?: string, callback_data?: string}>>,
    parseMode: string = 'HTML',
    disablePreview: boolean = false
  ) {
    const payload: any = {
      chat_id: chatId,
      text: text,
      parse_mode: parseMode,
      disable_web_page_preview: disablePreview
    }

    if (keyboard && keyboard.length > 0) {
      payload.reply_markup = {
        inline_keyboard: keyboard
      }
    }

    return fetch(`${apiUrl}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })
  }

  async sendToMultipleChannels(
    channels: Array<{botToken: string, channelId: string, name: string}>,
    content: string,
    imageUrl?: string,
    keyboard?: Array<Array<{text: string, url?: string, callback_data?: string}>>
  ): Promise<{
    success: number
    failed: number
    results: Array<{channelName: string, success: boolean, error?: string, messageId?: number}>
  }> {
    const results = []
    let successCount = 0
    let failedCount = 0

    for (const channel of channels) {
      console.log(`📤 Sending to channel: ${channel.name}`)
      
      const result = await this.sendMessage({
        botToken: channel.botToken,
        channelId: channel.channelId,
        content,
        imageUrl,
        inlineKeyboard: keyboard
      })

      if (result.success) {
        successCount++
        results.push({
          channelName: channel.name,
          success: true,
          messageId: result.messageId
        })
        console.log(`✅ Successfully sent to ${channel.name}`)
      } else {
        failedCount++
        results.push({
          channelName: channel.name,
          success: false,
          error: result.error
        })
        console.log(`❌ Failed to send to ${channel.name}: ${result.error}`)
      }

      // השהייה קצרה בין שליחות
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return {
      success: successCount,
      failed: failedCount,
      results
    }
  }

  private async logMessage(messageData: {
    channel_id: string
    content: string
    telegram_message_id?: number
    status: 'sent' | 'failed'
    error_message?: string
    sent_at: string
  }) {
    try {
      await supabase.from('logs').insert({
        action: 'telegram_send',
        component: 'telegram_sender',
        level: messageData.status === 'sent' ? 'info' : 'error',
        message: `Message ${messageData.status}: ${messageData.content.substring(0, 100)}`,
        metadata: messageData,
        status: messageData.status === 'sent' ? 'success' : 'failed',
        error_details: messageData.error_message
      })
    } catch (error) {
      console.error('Failed to log message:', error)
    }
  }

  // פונקציה לבדיקת תקינות הבוט
  async validateBot(botToken: string): Promise<{valid: boolean, botInfo?: any, error?: string}> {
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`)
      const data = await response.json()
      
      if (data.ok) {
        return {
          valid: true,
          botInfo: data.result
        }
      } else {
        return {
          valid: false,
          error: data.description
        }
      }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // פונקציה לקבלת מידע על הערוץ
  async getChannelInfo(botToken: string, channelId: string): Promise<{success: boolean, info?: any, error?: string}> {
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/getChat?chat_id=${channelId}`)
      const data = await response.json()
      
      if (data.ok) {
        return {
          success: true,
          info: data.result
        }
      } else {
        return {
          success: false,
          error: data.description
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * 🗳️ שליחת סקר אמיתי ב-Telegram
   */
  private async sendPoll(
    botToken: string,
    chatId: string,
    pollData: {
      question: string
      options: string[]
      isAnonymous?: boolean
      type?: 'regular' | 'quiz'
      allowsMultipleAnswers?: boolean
      correctOptionId?: number
      explanation?: string
      openPeriod?: number
      closeDate?: number
    }
  ): Promise<TelegramResponse> {
    try {
      const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendPoll`

      // הכנת payload לפי הדוקומנטציה של Telegram
      const payload: any = {
        chat_id: chatId,
        question: pollData.question,
        options: JSON.stringify(pollData.options), // צריך להיות JSON string
        is_anonymous: pollData.isAnonymous !== false, // ברירת מחדל true
        type: pollData.type || 'regular',
        allows_multiple_answers: pollData.allowsMultipleAnswers || false
      }

      // עבור quiz polls
      if (pollData.type === 'quiz' && pollData.correctOptionId !== undefined) {
        payload.correct_option_id = pollData.correctOptionId
        if (pollData.explanation) {
          payload.explanation = pollData.explanation
        }
      }

      // זמני פתיחה וסגירה
      if (pollData.openPeriod) {
        payload.open_period = pollData.openPeriod
      }
      if (pollData.closeDate) {
        payload.close_date = pollData.closeDate
      }

      console.log('🗳️ Sending poll with payload:', JSON.stringify(payload, null, 2))

      const response = await fetch(telegramApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const result = await response.json()
        
        // שמירת לוג הצלחה במסד הנתונים
        await this.logMessage({
          channel_id: chatId,
          content: `Poll: ${pollData.question}`,
          telegram_message_id: result.result.message_id,
          status: 'sent',
          sent_at: new Date().toISOString()
        })

        console.log('✅ Poll sent successfully!')
        return {
          success: true,
          messageId: result.result.message_id,
          timestamp: new Date()
        }
      } else {
        const errorData = await response.json()
        const errorMessage = errorData.description || 'Unknown Telegram API error'
        
        console.error('❌ Poll sending failed:', errorMessage)
        
        // שמירת לוג שגיאה
        await this.logMessage({
          channel_id: chatId,
          content: `Poll: ${pollData.question}`,
          status: 'failed',
          error_message: errorMessage,
          sent_at: new Date().toISOString()
        })

        return {
          success: false,
          error: errorMessage,
          timestamp: new Date()
        }
      }
    } catch (error) {
      console.error('🚨 Poll sending error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date()
      }
    }
  }
}

export const telegramSender = new TelegramSender()
export type { TelegramSendOptions, TelegramResponse } 