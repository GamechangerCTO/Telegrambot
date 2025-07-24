import { NextRequest, NextResponse } from 'next/server';
import { OptimizedNewsContentGenerator } from '@/lib/content/news-content-generator';
import { PollsGenerator } from '@/lib/content/polls-generator';
import { TelegramDistributor } from '@/lib/content/api-modules/telegram-distributor';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  console.log('📰 [CRON] News-only job started:', new Date().toISOString());
  
  try {
    // Verify this is a Vercel cron job
    const userAgent = request.headers.get('user-agent') || '';
    const isVercelCron = userAgent.includes('vercel-cron') || 
                        request.headers.get('x-vercel-deployment-url') ||
                        process.env.NODE_ENV === 'production';
                        
    if (!isVercelCron && process.env.NODE_ENV === 'production') {
      console.log('❌ [CRON] Unauthorized news job attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('🔓 [CRON] News job authorized successfully');

    const results = {
      timestamp: new Date().toISOString(),
      tasks: [] as any[]
    };

    const currentHour = new Date().getUTCHours();
    console.log(`📰 News generation at hour: ${currentHour}:00 UTC`);

    // Initialize generators
    const newsGenerator = new OptimizedNewsContentGenerator();
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
        message: 'No active channels available for content distribution',
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

    // Generate and send news content for all active channels
    try {
      console.log('📰 Generating and sending news content for all channels...');
      
      let successfulGeneration = 0;
      let failedGeneration = 0;
      let successfulSending = 0;
      let failedSending = 0;

      for (const channel of channels) {
        try {
          // Step 1: Generate news content
          const newsResult = await newsGenerator.generateNewsContent({
            language: channel.language as 'en' | 'am' | 'sw',
            channelId: channel.id,
            maxResults: 1,
            excludeUsedContent: true
          });

          if (newsResult) {
            successfulGeneration++;
            console.log(`✅ Generated news for ${channel.name}: "${newsResult.title}"`);
            
            // Step 2: Send to Telegram using TelegramDistributor
            try {
              const distributionResult = await telegramDistributor.sendContentToTelegram({
                content: {
                  content_type: 'news',
                  language: channel.language,
                  content_items: [{
                    id: newsResult.metadata?.contentId || `news_${Date.now()}`,
                    type: 'news',
                    title: newsResult.title,
                    content: newsResult.content,
                    language: channel.language,
                    imageUrl: newsResult.imageUrl,
                    metadata: newsResult.metadata
                  }]
                },
                language: channel.language as 'en' | 'am' | 'sw',
                mode: 'news',
                targetChannels: [channel.id],
                includeImages: true
              });

              if (distributionResult.success) {
                successfulSending++;
                console.log(`📤 Successfully sent news to ${channel.name}`);
                
                results.tasks.push({
                  task: 'news_generation_and_sending',
                  channel: {
                    id: channel.id,
                    name: channel.name,
                    language: channel.language
                  },
                  status: 'completed',
                  data: {
                    contentGenerated: true,
                    contentSent: true,
                    title: newsResult.title,
                    contentLength: newsResult.content.length,
                    imageGenerated: !!newsResult.imageUrl,
                    channelsSent: distributionResult.channels,
                    telegramResults: distributionResult.results
                  }
                });
              } else {
                failedSending++;
                console.error(`❌ Failed to send news to ${channel.name}:`, distributionResult.error);
                
                results.tasks.push({
                  task: 'news_generation_and_sending',
                  channel: {
                    id: channel.id,
                    name: channel.name,
                    language: channel.language
                  },
                  status: 'generated_but_not_sent',
                  data: {
                    contentGenerated: true,
                    contentSent: false,
                    title: newsResult.title,
                    sendingError: distributionResult.error
                  }
                });
              }
            } catch (sendingError) {
              failedSending++;
              console.error(`❌ Error sending news to ${channel.name}:`, sendingError);
              
              results.tasks.push({
                task: 'news_generation_and_sending',
                channel: {
                  id: channel.id,
                  name: channel.name,
                  language: channel.language
                },
                status: 'sending_error',
                data: {
                  contentGenerated: true,
                  contentSent: false,
                  title: newsResult.title,
                  sendingError: sendingError instanceof Error ? sendingError.message : String(sendingError)
                }
              });
            }
          } else {
            failedGeneration++;
            results.tasks.push({
              task: 'news_generation_and_sending',
              channel: {
                id: channel.id,
                name: channel.name,
                language: channel.language
              },
              status: 'no_content',
              data: {
                reason: 'No suitable news content found or generated'
              }
            });
          }
        } catch (channelError) {
          failedGeneration++;
          console.error(`❌ Error generating news for channel ${channel.id}:`, channelError);
          results.tasks.push({
            task: 'news_generation_and_sending',
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
        task: 'news_generation_summary',
        status: 'completed',
        data: {
          totalChannels: channels.length,
          successfulGeneration,
          failedGeneration,
          successfulSending,
          failedSending,
          hasMatchesToday,
          currentHour,
          nextNewsRun: getNextNewsTime(currentHour)
        }
      });

      console.log(`✅ News generation completed: ${successfulGeneration} generated, ${successfulSending} sent successfully`);

    } catch (error) {
      console.error('❌ Error in news generation process:', error);
      results.tasks.push({
        task: 'news_generation_and_sending',
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      });
    }

    // On days without matches, generate general polls for engagement
    if (!hasMatchesToday && currentHour === 15) { // Only at 3 PM to avoid spam
      try {
        console.log('📊 No matches today, generating general engagement polls...');
        
        for (const channel of channels.slice(0, 2)) { // Limit to 2 channels for polls
          try {
            const pollResult = await pollsGenerator.generatePoll({
              language: channel.language as 'en' | 'am' | 'sw',
              channelId: channel.id,
              pollType: 'fan_opinion'
            });

            results.tasks.push({
              task: 'general_poll_generation',
              channel: {
                id: channel.id,
                name: channel.name,
                language: channel.language
              },
              status: pollResult ? 'completed' : 'failed',
              data: pollResult || { reason: 'No poll generated' }
            });
          } catch (pollError) {
            console.error(`❌ Error generating poll for channel ${channel.id}:`, pollError);
            results.tasks.push({
              task: 'general_poll_generation',
              channel: {
                id: channel.id,
                name: channel.name,
                language: channel.language
              },
              status: 'error',
              error: pollError instanceof Error ? pollError.message : String(pollError)
            });
          }
        }
      } catch (error) {
        console.error('❌ Error in poll generation process:', error);
        results.tasks.push({
          task: 'general_poll_generation',
          status: 'error',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    console.log('✅ [CRON] News-only job completed successfully');
    return NextResponse.json(results);

  } catch (error) {
    console.error('❌ [CRON] News-only job failed:', error);
    return NextResponse.json({ 
      error: 'News generation job failed',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * Calculate next news generation time for logging
 */
function getNextNewsTime(currentHour: number): string {
  const newsHours = [9, 15, 21];
  const nextHour = newsHours.find(hour => hour > currentHour) || newsHours[0];
  
  if (nextHour > currentHour) {
    return `Today at ${nextHour}:00 UTC`;
  } else {
    return `Tomorrow at ${nextHour}:00 UTC`;
  }
} 