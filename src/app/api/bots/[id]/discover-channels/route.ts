import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const botId = params.id;

    // Get bot information
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .select('*')
      .eq('id', botId)
      .single();

    if (botError || !bot) {
      return NextResponse.json({
        success: false,
        error: 'Bot not found'
      }, { status: 404 });
    }

    // Decrypt bot token
    let botToken = bot.telegram_token_encrypted;
    
    // Smart token decoding logic
    if (!botToken.includes(':') || botToken.length < 20) {
      try {
        const decoded = Buffer.from(botToken, 'base64').toString('utf-8');
        if (decoded.includes(':') && decoded.length > 20) {
          botToken = decoded;
          console.log(`🔓 Decoded base64 token for ${bot.name}`);
        }
      } catch (decodeError) {
        console.log(`⚠️ Failed to decode token for ${bot.name}, using as-is`);
      }
    }

    // Discover channels by calling Telegram API to get chat administrators
    const discovered = [];
    const errors = [];

    try {
      // Get bot information first
      const botInfoResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      const botInfo = await botInfoResponse.json();

      if (!botInfo.ok) {
        return NextResponse.json({
          success: false,
          error: 'Invalid bot token or bot not accessible',
          details: botInfo.description
        }, { status: 400 });
      }

      console.log(`🤖 Bot ${bot.name} is valid: @${botInfo.result.username}`);

      // Try to get updates to find channels the bot was added to
      const updatesResponse = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?limit=100`);
      const updates = await updatesResponse.json();

      if (updates.ok && updates.result) {
        const channelIds = new Set();
        
        for (const update of updates.result) {
          // Look for channel_post or my_chat_member updates
          if (update.channel_post?.chat) {
            const chat = update.channel_post.chat;
            if (chat.type === 'channel') {
              channelIds.add(chat.id);
            }
          }
          
          if (update.my_chat_member?.chat) {
            const chat = update.my_chat_member.chat;
            if (chat.type === 'channel' && update.my_chat_member.new_chat_member?.status === 'administrator') {
              channelIds.add(chat.id);
            }
          }
        }

        // Get detailed info for each discovered channel
        for (const channelId of channelIds) {
          try {
            const chatResponse = await fetch(`https://api.telegram.org/bot${botToken}/getChat?chat_id=${channelId}`);
            const chatInfo = await chatResponse.json();

            if (chatInfo.ok) {
              const chat = chatInfo.result;
              
              // Check if channel already exists in our database
              const { data: existingChannel } = await supabase
                .from('channels')
                .select('id')
                .eq('telegram_channel_id', chat.id.toString())
                .single();

              if (!existingChannel) {
                discovered.push({
                  telegram_channel_id: chat.id.toString(),
                  name: chat.title,
                  telegram_channel_username: chat.username || null,
                  description: chat.description || null,
                  member_count: chat.members_count || null,
                  type: chat.type,
                  language: bot.language_code, // Default to bot's language
                  can_be_added: true
                });
              } else {
                discovered.push({
                  telegram_channel_id: chat.id.toString(),
                  name: chat.title,
                  telegram_channel_username: chat.username || null,
                  description: chat.description || null,
                  member_count: chat.members_count || null,
                  type: chat.type,
                  language: bot.language_code,
                  can_be_added: false,
                  reason: 'Channel already exists in system'
                });
              }
            }
          } catch (error) {
            console.error(`❌ Error getting info for channel ${channelId}:`, error);
            errors.push(`Failed to get info for channel ${channelId}`);
          }
        }
      }

      return NextResponse.json({
        success: true,
        bot: {
          id: bot.id,
          name: bot.name,
          telegram_username: botInfo.result.username
        },
        discovered_channels: discovered,
        errors: errors,
        message: `Found ${discovered.length} channels for bot @${botInfo.result.username}`
      });

    } catch (error) {
      console.error('❌ Error discovering channels:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to discover channels',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error in discover channels API:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Auto-add discovered channels to the system
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const botId = params.id;
    const body = await request.json();

    if (!body.channels || !Array.isArray(body.channels)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid channels data'
      }, { status: 400 });
    }

    const results = [];

    for (const channelData of body.channels) {
      try {
        const { data: newChannel, error: channelError } = await supabase
          .from('channels')
          .insert({
            bot_id: botId,
            name: channelData.name,
            telegram_channel_id: channelData.telegram_channel_id,
            telegram_channel_username: channelData.telegram_channel_username,
            description: channelData.description,
            language: channelData.language || 'en',
            is_active: true,
            auto_post: true,
            max_posts_per_day: 5,
            post_frequency_hours: 6,
            member_count: channelData.member_count || 0,
            total_posts_sent: 0,
            content_types: ['news', 'polls', 'betting_tips'] // Default content types
          })
          .select()
          .single();

        if (channelError) {
          results.push({
            channel_name: channelData.name,
            success: false,
            error: channelError.message
          });
        } else {
          results.push({
            channel_name: channelData.name,
            success: true,
            channel_id: newChannel.id
          });
        }
      } catch (error) {
        results.push({
          channel_name: channelData.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Added ${successCount} channels successfully, ${errorCount} failed`,
      results
    });

  } catch (error) {
    console.error('❌ Error auto-adding channels:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to add channels'
    }, { status: 500 });
  }
} 