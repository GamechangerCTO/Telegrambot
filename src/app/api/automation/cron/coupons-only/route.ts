import { NextRequest, NextResponse } from 'next/server';
import { SmartCouponsGenerator } from '@/lib/content/smart-coupons-generator';
import { TelegramDistributor } from '@/lib/content/api-modules/telegram-distributor';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  console.log('🎫 [CRON] Coupons-only job started:', new Date().toISOString());
  
  try {
    // Verify this is a Vercel cron job
    const userAgent = request.headers.get('user-agent') || '';
    const isVercelCron = userAgent.includes('vercel-cron') || 
                        request.headers.get('x-vercel-deployment-url') ||
                        process.env.NODE_ENV === 'production';
                        
    if (!isVercelCron && process.env.NODE_ENV === 'production') {
      console.log('❌ [CRON] Unauthorized coupons job attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('🔓 [CRON] Coupons job authorized successfully');

    const results = {
      timestamp: new Date().toISOString(),
      tasks: [] as any[]
    };

    const currentHour = new Date().getUTCHours();
    console.log(`🎫 Coupons generation at hour: ${currentHour}:00 UTC`);

    // Initialize generators
    const couponsGenerator = new SmartCouponsGenerator();
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
        message: 'No active channels available for coupons distribution',
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

    // Generate coupons for all channels
    try {
      console.log('🎫 Generating coupons for all channels...');
      
      let successfulGeneration = 0;
      let failedGeneration = 0;
      let successfulSending = 0;
      let failedSending = 0;

      for (const channel of channels) {
        try {
          // Step 1: Generate coupon content
          const now = new Date();
          const couponResult = await couponsGenerator.getSmartCouponForContext({
            contentType: hasMatchesToday ? 'betting' : 'news',
            channelId: channel.id,
            language: channel.language as 'en' | 'am' | 'sw',
            matchImportance: hasMatchesToday ? 'HIGH' : 'LOW',
            userEngagement: 'MEDIUM',
            timeContext: {
              hour: now.getHours(),
              dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
              isWeekend: now.getDay() === 0 || now.getDay() === 6
            }
          });

          if (couponResult) {
            successfulGeneration++;
            console.log(`✅ Generated coupon for ${channel.name}: "${couponResult.title}"`);
            
            // Step 2: Send to Telegram using TelegramDistributor
            try {
              const distributionResult = await telegramDistributor.sendContentToTelegram({
                content: {
                  content_type: 'smart_push',
                  language: channel.language,
                  content_items: [{
                    id: couponResult.metadata?.contentId || `coupon_${Date.now()}`,
                    type: 'smart_push',
                    title: couponResult.title,
                    content: couponResult.content,
                    language: channel.language,
                    imageUrl: couponResult.imageUrl,
                    metadata: couponResult.metadata
                  }]
                },
                language: channel.language as 'en' | 'am' | 'sw',
                mode: 'coupon',
                targetChannels: [channel.id],
                includeImages: true
              });

              if (distributionResult.success) {
                successfulSending++;
                console.log(`📤 Successfully sent coupon to ${channel.name}`);
                
                results.tasks.push({
                  task: 'coupon_generation_and_sending',
                  channel: {
                    id: channel.id,
                    name: channel.name,
                    language: channel.language
                  },
                  status: 'completed',
                  data: {
                    contentGenerated: true,
                    contentSent: true,
                    title: couponResult.title,
                    contentLength: couponResult.content.length,
                    imageGenerated: !!couponResult.imageUrl,
                    couponType: hasMatchesToday ? 'betting_focused' : 'general_sports',
                    channelsSent: distributionResult.channels,
                    telegramResults: distributionResult.results
                  }
                });
              } else {
                failedSending++;
                console.error(`❌ Failed to send coupon to ${channel.name}:`, distributionResult.error);
                
                results.tasks.push({
                  task: 'coupon_generation_and_sending',
                  channel: {
                    id: channel.id,
                    name: channel.name,
                    language: channel.language
                  },
                  status: 'generated_but_not_sent',
                  data: {
                    contentGenerated: true,
                    contentSent: false,
                    title: couponResult.title,
                    sendingError: distributionResult.error
                  }
                });
              }
            } catch (sendingError) {
              failedSending++;
              console.error(`❌ Error sending coupon to ${channel.name}:`, sendingError);
              
              results.tasks.push({
                task: 'coupon_generation_and_sending',
                channel: {
                  id: channel.id,
                  name: channel.name,
                  language: channel.language
                },
                status: 'sending_error',
                data: {
                  contentGenerated: true,
                  contentSent: false,
                  title: couponResult.title,
                  sendingError: sendingError instanceof Error ? sendingError.message : String(sendingError)
                }
              });
            }
          } else {
            failedGeneration++;
            results.tasks.push({
              task: 'coupon_generation_and_sending',
              channel: {
                id: channel.id,
                name: channel.name,
                language: channel.language
              },
              status: 'no_content',
              data: {
                reason: 'No suitable coupon content found or generated'
              }
            });
          }
        } catch (channelError) {
          failedGeneration++;
          console.error(`❌ Error generating coupon for channel ${channel.id}:`, channelError);
          results.tasks.push({
            task: 'coupon_generation_and_sending',
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
        task: 'coupons_generation_summary',
        status: 'completed',
        data: {
          totalChannels: channels.length,
          successfulGeneration,
          failedGeneration,
          successfulSending,
          failedSending,
          hasMatchesToday,
          currentHour,
          nextCouponsRun: getNextCouponsTime(currentHour)
        }
      });

      console.log(`✅ Coupons generation completed: ${successfulGeneration} generated, ${successfulSending} sent successfully`);

    } catch (error) {
      console.error('❌ Error in coupons generation process:', error);
      results.tasks.push({
        task: 'coupon_generation_and_sending',
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      });
    }

    console.log('✅ [CRON] Coupons-only job completed successfully');
    return NextResponse.json(results);

  } catch (error) {
    console.error('❌ [CRON] Coupons-only job failed:', error);
    return NextResponse.json({ 
      error: 'Coupons generation job failed',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * Calculate next coupons generation time for logging
 */
function getNextCouponsTime(currentHour: number): string {
  const couponsHours = [11, 17]; // 14:00, 20:00 Israel time
  const nextHour = couponsHours.find(hour => hour > currentHour) || couponsHours[0];
  
  if (nextHour > currentHour) {
    return `Today at ${nextHour}:00 UTC`;
  } else {
    return `Tomorrow at ${nextHour}:00 UTC`;
  }
} 