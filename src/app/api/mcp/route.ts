import { z } from 'zod';
import { createMcpHandler } from '@vercel/mcp-adapter';
import { supabase } from '@/lib/supabase';
import { ContentRouter } from '@/lib/content/api-modules/content-router';
import { TelegramDistributor } from '@/lib/content/api-modules/telegram-distributor';

const handler = createMcpHandler(
  server => {
    // 🎲 Demo tool: Roll dice
    server.tool(
      'roll_dice',
      'Rolls an N-sided die',
      { sides: z.number().int().min(2) },
      async ({ sides }) => {
        const value = 1 + Math.floor(Math.random() * sides);
        return { content: [{ type: 'text', text: `You rolled a ${value}!` }] };
      },
    );

    // 📰 Generate news content
    server.tool(
      'generate_news',
      'Generate football news content in specified language',
      {
        language: z.enum(['en', 'am', 'sw']).default('en'),
        maxItems: z.number().int().min(1).max(5).default(1),
        channelId: z.string().optional()
      },
      async ({ language, maxItems, channelId }) => {
        try {
          const contentRouter = new ContentRouter();
          const result = await contentRouter.generateContent({
            type: 'news',
            language: language as 'en' | 'am' | 'sw',
            maxItems,
            channelId: channelId || 'mcp-request'
          });

          if (result.contentItems && result.contentItems.length > 0) {
            const newsItems = result.contentItems.map(item => 
              `📰 ${item.title}\n${item.content}\n🔗 ${item.link || ''}`
            ).join('\n\n');
            
            return { 
              content: [{ 
                type: 'text', 
                text: `Generated ${result.contentItems.length} news items in ${language}:\n\n${newsItems}` 
              }] 
            };
          } else {
            return { 
              content: [{ 
                type: 'text', 
                text: `No news content generated. Processing info: ${JSON.stringify(result.processingInfo)}` 
              }] 
            };
          }
        } catch (error) {
          return { 
            content: [{ 
              type: 'text', 
              text: `Error generating news: ${error instanceof Error ? error.message : 'Unknown error'}` 
            }] 
          };
        }
      },
    );

    // 🎯 Generate betting content
    server.tool(
      'generate_betting',
      'Generate football betting tips and analysis',
      {
        language: z.enum(['en', 'am', 'sw']).default('en'),
        maxItems: z.number().int().min(1).max(3).default(1),
        channelId: z.string().optional()
      },
      async ({ language, maxItems, channelId }) => {
        try {
          const contentRouter = new ContentRouter();
          const result = await contentRouter.generateContent({
            type: 'betting',
            language: language as 'en' | 'am' | 'sw',
            maxItems,
            channelId: channelId || 'mcp-betting'
          });

          if (result.contentItems && result.contentItems.length > 0) {
            const bettingItems = result.contentItems.map(item => 
              `🎯 ${item.title}\n${item.content}\n${item.imageUrl ? `🖼️ ${item.imageUrl}` : ''}`
            ).join('\n\n');
            
            return { 
              content: [{ 
                type: 'text', 
                text: `Generated ${result.contentItems.length} betting tips in ${language}:\n\n${bettingItems}` 
              }] 
            };
          } else {
            return { 
              content: [{ 
                type: 'text', 
                text: `No betting content generated. Processing info: ${JSON.stringify(result.processingInfo)}` 
              }] 
            };
          }
        } catch (error) {
          return { 
            content: [{ 
              type: 'text', 
              text: `Error generating betting content: ${error instanceof Error ? error.message : 'Unknown error'}` 
            }] 
          };
        }
      },
    );

    // 📊 Generate polls
    server.tool(
      'generate_polls',
      'Generate interactive football polls',
      {
        language: z.enum(['en', 'am', 'sw']).default('en'),
        pollType: z.enum(['match_prediction', 'fan_opinion', 'player_comparison']).default('match_prediction'),
        channelId: z.string().optional()
      },
      async ({ language, pollType, channelId }) => {
        try {
          const contentRouter = new ContentRouter();
          const result = await contentRouter.generateContent({
            type: 'polls',
            language: language as 'en' | 'am' | 'sw',
            maxItems: 1,
            channelId: channelId || 'mcp-polls',
            customContent: {
              pollType,
              includeAnalysis: true,
              targetAudience: 'mixed',
              creativityLevel: 'high'
            }
          });

          if (result.contentItems && result.contentItems.length > 0) {
            const poll = result.contentItems[0];
            return { 
              content: [{ 
                type: 'text', 
                text: `Generated ${pollType} poll in ${language}:\n\n📊 ${poll.title}\n${poll.content}\n${poll.imageUrl ? `🖼️ ${poll.imageUrl}` : ''}` 
              }] 
            };
          } else {
            return { 
              content: [{ 
                type: 'text', 
                text: `No poll generated. Processing info: ${JSON.stringify(result.processingInfo)}` 
              }] 
            };
          }
        } catch (error) {
          return { 
            content: [{ 
              type: 'text', 
              text: `Error generating poll: ${error instanceof Error ? error.message : 'Unknown error'}` 
            }] 
          };
        }
      },
    );

    // 📋 Get automation stats
    server.tool(
      'get_automation_stats',
      'Get current automation system statistics',
      {},
      async () => {
        try {
          // Get automation rules
          const { data: rules, error: rulesError } = await supabase
            .from('automation_rules')
            .select('id, name, enabled, success_count, error_count, last_run')
            .eq('enabled', true);

          if (rulesError) {
            return { 
              content: [{ 
                type: 'text', 
                text: `Error fetching automation stats: ${rulesError.message}` 
              }] 
            };
          }

          // Get recent content generation
          const { data: content, error: contentError } = await supabase
            .from('generated_content')
            .select('content_type, language, created_at')
            .order('created_at', { ascending: false })
            .limit(10);

          const totalRules = rules?.length || 0;
          const activeRules = rules?.filter(r => r.enabled).length || 0;
          const totalSuccess = rules?.reduce((sum, r) => sum + (r.success_count || 0), 0) || 0;
          const totalErrors = rules?.reduce((sum, r) => sum + (r.error_count || 0), 0) || 0;
          const successRate = totalSuccess + totalErrors > 0 ? 
            Math.round((totalSuccess / (totalSuccess + totalErrors)) * 100) : 0;

          const recentContent = content?.map(c => 
            `${c.content_type} (${c.language}) - ${new Date(c.created_at).toLocaleString()}`
          ).join('\n') || 'No recent content';

          return { 
            content: [{ 
              type: 'text', 
              text: `📈 Automation Statistics:\n\n` +
                    `🤖 Active Rules: ${activeRules}/${totalRules}\n` +
                    `✅ Success Rate: ${successRate}%\n` +
                    `📊 Total Executions: ${totalSuccess + totalErrors}\n` +
                    `🎯 Successes: ${totalSuccess}\n` +
                    `❌ Errors: ${totalErrors}\n\n` +
                    `📝 Recent Content:\n${recentContent}` 
            }] 
          };
        } catch (error) {
          return { 
            content: [{ 
              type: 'text', 
              text: `Error getting automation stats: ${error instanceof Error ? error.message : 'Unknown error'}` 
            }] 
          };
        }
      },
    );

    // 📺 List active channels
    server.tool(
      'list_channels',
      'List all active Telegram channels',
      {},
      async () => {
        try {
          const { data: channels, error } = await supabase
            .from('channels')
            .select('id, channel_name, language, is_active, created_at')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

          if (error) {
            return { 
              content: [{ 
                type: 'text', 
                text: `Error fetching channels: ${error.message}` 
              }] 
            };
          }

          if (!channels || channels.length === 0) {
            return { 
              content: [{ 
                type: 'text', 
                text: `No active channels found` 
              }] 
            };
          }

          const channelList = channels.map(ch => 
            `📺 ${ch.channel_name} (${ch.language}) - Created: ${new Date(ch.created_at).toLocaleDateString()}`
          ).join('\n');

          return { 
            content: [{ 
              type: 'text', 
              text: `📺 Active Telegram Channels (${channels.length}):\n\n${channelList}` 
            }] 
          };
        } catch (error) {
          return { 
            content: [{ 
              type: 'text', 
              text: `Error listing channels: ${error instanceof Error ? error.message : 'Unknown error'}` 
            }] 
          };
        }
      },
    );

    // 🔄 Send content to Telegram
    server.tool(
      'send_to_telegram',
      'Send content directly to Telegram channels',
      {
        content: z.string().min(1),
        language: z.enum(['en', 'am', 'sw']).default('en'),
        contentType: z.enum(['news', 'betting', 'polls', 'analysis', 'live']).default('news'),
        targetChannels: z.array(z.string()).optional()
      },
      async ({ content, language, contentType, targetChannels }) => {
        try {
          const telegramDistributor = new TelegramDistributor();
          
          const contentData = {
            content_type: contentType,
            language,
            content_items: [{
              id: `mcp-${Date.now()}`,
              title: `MCP Generated ${contentType}`,
              content: content,
              language,
              created_at: new Date().toISOString(),
              content_type: contentType
            }]
          };

          const result = await telegramDistributor.sendContentToTelegram({
            content: contentData,
            language: language as 'en' | 'am' | 'sw',
            mode: contentType,
            targetChannels,
            includeImages: false
          });

          if (result.success) {
            return { 
              content: [{ 
                type: 'text', 
                text: `✅ Content sent successfully to ${result.channels} channels!\n\nSent: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"` 
              }] 
            };
          } else {
            return { 
              content: [{ 
                type: 'text', 
                text: `❌ Failed to send content: ${result.error}` 
              }] 
            };
          }
        } catch (error) {
          return { 
            content: [{ 
              type: 'text', 
              text: `Error sending to Telegram: ${error instanceof Error ? error.message : 'Unknown error'}` 
            }] 
          };
        }
      },
    );

    // 🏆 Get today's matches
    server.tool(
      'get_todays_matches',
      'Get today\'s important football matches',
      {},
      async () => {
        try {
          const today = new Date().toISOString().split('T')[0];
          
          const { data: matches, error } = await supabase
            .from('daily_important_matches')
            .select('home_team, away_team, competition, kickoff_time, importance_score, content_opportunities')
            .eq('match_date', today)
            .order('importance_score', { ascending: false });

          if (error) {
            return { 
              content: [{ 
                type: 'text', 
                text: `Error fetching matches: ${error.message}` 
              }] 
            };
          }

          if (!matches || matches.length === 0) {
            return { 
              content: [{ 
                type: 'text', 
                text: `No important matches found for today (${today})` 
              }] 
            };
          }

          const matchList = matches.map(match => 
            `⚽ ${match.home_team} vs ${match.away_team}\n` +
            `🏆 ${match.competition}\n` +
            `⏰ ${new Date(match.kickoff_time).toLocaleTimeString()}\n` +
            `📊 Importance: ${match.importance_score}/100\n` +
            `🎯 Opportunities: ${JSON.stringify(match.content_opportunities)}`
          ).join('\n\n');

          return { 
            content: [{ 
              type: 'text', 
              text: `🏆 Today's Important Matches (${matches.length}):\n\n${matchList}` 
            }] 
          };
        } catch (error) {
          return { 
            content: [{ 
              type: 'text', 
              text: `Error getting today's matches: ${error instanceof Error ? error.message : 'Unknown error'}` 
            }] 
          };
        }
      },
    );
  },
  {},
  { basePath: '/api' }
);

export { handler as GET, handler as POST };