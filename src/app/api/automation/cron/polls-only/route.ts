import { NextRequest, NextResponse } from 'next/server';
import { PollsGenerator } from '@/lib/content/polls-generator';
import { TelegramDistributor } from '@/lib/content/api-modules/telegram-distributor';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic' // מאלץ את Next.js לרצות את זה באופן דינמי

export async function GET(request: NextRequest) {
  console.log('📊 [CRON] Polls-only job started:', new Date().toISOString());
  
  try {
    // Verify this is a Vercel cron job
    const userAgent = request.headers.get('user-agent') || '';
    const isVercelCron = userAgent.includes('vercel-cron') || 
                        request.headers.get('x-vercel-deployment-url') ||
                        process.env.NODE_ENV === 'production';
                        
    if (!isVercelCron && process.env.NODE_ENV === 'production') {
      console.log('❌ [CRON] Unauthorized polls job attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('🔓 [CRON] Polls job authorized successfully');

    const results = {
      timestamp: new Date().toISOString(),
      tasks: [] as any[]
    };

    const currentHour = new Date().getUTCHours();
    console.log(`📊 Polls generation at hour: ${currentHour}:00 UTC`);

    // Initialize generators
    const pollsGenerator = new PollsGenerator();
    const telegramDistributor = new TelegramDistributor();

    // Get active channels for content distribution
    const { data: channels } = await supabase
      .from('channels')
      .select('id, language, bot_id, name')
      .eq('is_active', true);

    if (!channels || channels.length === 0) {
      console.log('⚠️ No active channels found');
      return NextResponse.json({
        success: false,
        message: 'No active channels available for polls distribution',
        results
      });
    }

    console.log(`📺 Found ${channels.length} active channels`);

    // Check if there are any important matches today
    const today = new Date().toISOString().split('T')[0];
    const { data: todaysMatches } = await supabase
      .from('daily_important_matches')
      .select('*')
      .eq('discovery_date', today);

    const hasMatchesToday = todaysMatches && todaysMatches.length > 0;
    console.log(`⚽ Today's matches: ${hasMatchesToday ? todaysMatches.length : 0}`);

    // Generate polls based on match availability
    try {
      console.log('📊 Generating polls for all channels...');
      
      let successfulGeneration = 0;
      let failedGeneration = 0;
      let successfulSending = 0;
      let failedSending = 0;

      for (const channel of channels) {
        try {
          // Step 1: Generate poll content
          const pollResult = await pollsGenerator.generatePoll({
            language: channel.language as 'en' | 'am' | 'sw',
            channelId: channel.id,
            pollType: hasMatchesToday ? 'match_prediction' : 'fan_opinion'
          });

          if (pollResult) {
            successfulGeneration++;
            console.log(`✅ Generated poll for ${channel.name}: "${pollResult.title}"`);
            
            // Step 2: Send to Telegram using TelegramDistributor
            try {
              const distributionResult = await telegramDistributor.sendContentToTelegram({
                content: {
                  content_type: 'poll',
                  language: channel.language,
                  content_items: [{
                    id: pollResult.metadata?.contentId || `poll_${Date.now()}`,
                    type: 'poll',
                    title: pollResult.title,
                    content: pollResult.content,
                    language: channel.language,
                    poll_config: pollResult.telegramPollPayload,
                    metadata: pollResult.metadata
                  }]
                },
                language: channel.language as 'en' | 'am' | 'sw',
                mode: 'poll',
                targetChannels: [channel.id],
                includeImages: false
              });

              if (distributionResult.success) {
                successfulSending++;
                console.log(`📤 Successfully sent poll to ${channel.name}`);
                
                results.tasks.push({
                  task: 'poll_generation_and_sending',
                  channel: {
                    id: channel.id,
                    name: channel.name,
                    language: channel.language
                  },
                  status: 'completed',
                  data: {
                    contentGenerated: true,
                    contentSent: true,
                    question: pollResult.title,
                    options: pollResult.telegramPollPayload?.options,
                    pollType: hasMatchesToday ? 'match_prediction' : 'fan_opinion',
                    channelsSent: distributionResult.channels,
                    telegramResults: distributionResult.results
                  }
                });
              } else {
                failedSending++;
                console.error(`❌ Failed to send poll to ${channel.name}:`, distributionResult.error);
                
                results.tasks.push({
                  task: 'poll_generation_and_sending',
                  channel: {
                    id: channel.id,
                    name: channel.name,
                    language: channel.language
                  },
                  status: 'generated_but_not_sent',
                  data: {
                    contentGenerated: true,
                    contentSent: false,
                    question: pollResult.title,
                    sendingError: distributionResult.error
                  }
                });
              }
            } catch (sendingError) {
              failedSending++;
              console.error(`❌ Error sending poll to ${channel.name}:`, sendingError);
              
              results.tasks.push({
                task: 'poll_generation_and_sending',
                channel: {
                  id: channel.id,
                  name: channel.name,
                  language: channel.language
                },
                status: 'sending_error',
                data: {
                  contentGenerated: true,
                  contentSent: false,
                  question: pollResult.title,
                  sendingError: sendingError instanceof Error ? sendingError.message : String(sendingError)
                }
              });
            }
          } else {
            failedGeneration++;
            results.tasks.push({
              task: 'poll_generation_and_sending',
              channel: {
                id: channel.id,
                name: channel.name,
                language: channel.language
              },
              status: 'no_content',
              data: {
                reason: 'No suitable poll content found or generated'
              }
            });
          }
        } catch (channelError) {
          failedGeneration++;
          console.error(`❌ Error generating poll for channel ${channel.id}:`, channelError);
          results.tasks.push({
            task: 'poll_generation_and_sending',
            channel: {
              id: channel.id,
              name: channel.name,
              language: channel.language
            },
            status: 'error',
            error: channelError instanceof Error ? channelError.message : String(channelError)
          });
        }
      }

      // Summary statistics
      results.tasks.push({
        task: 'polls_generation_summary',
        status: 'completed',
        data: {
          totalChannels: channels.length,
          successfulGeneration,
          failedGeneration,
          successfulSending,
          failedSending,
          hasMatchesToday,
          currentHour,
          nextPollsRun: getNextPollsTime(currentHour)
        }
      });

      console.log(`✅ Polls generation completed: ${successfulGeneration} generated, ${successfulSending} sent successfully`);

    } catch (error) {
      console.error('❌ Error in polls generation process:', error);
      results.tasks.push({
        task: 'poll_generation_and_sending',
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      });
    }

    console.log('✅ [CRON] Polls-only job completed successfully');
    return NextResponse.json(results);

  } catch (error) {
    console.error('❌ [CRON] Polls-only job failed:', error);
    return NextResponse.json({ 
      error: 'Polls generation job failed',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * Calculate next polls generation time for logging
 */
function getNextPollsTime(currentHour: number): string {
  const pollsHours = [7, 13, 19]; // 10:00, 16:00, 22:00 Israel time
  const nextHour = pollsHours.find(hour => hour > currentHour) || pollsHours[0];
  
  if (nextHour > currentHour) {
    return `Today at ${nextHour}:00 UTC`;
  } else {
    return `Tomorrow at ${nextHour}:00 UTC`;
  }
} 