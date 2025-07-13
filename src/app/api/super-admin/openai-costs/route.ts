import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('💰 OpenAI Costs API - Fetching usage and costs...');

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get current date and calculate date ranges
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Format dates for database queries
    const currentMonthStart = new Date(currentYear, currentMonth - 1, 1).toISOString();
    const currentMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59).toISOString();
    const lastMonthStart = new Date(lastMonthYear, lastMonth - 1, 1).toISOString();
    const lastMonthEnd = new Date(lastMonthYear, lastMonth, 0, 23, 59, 59).toISOString();

    console.log('📅 Date ranges:', {
      currentMonth: `${currentMonthStart} to ${currentMonthEnd}`,
      lastMonth: `${lastMonthStart} to ${lastMonthEnd}`
    });

    // Fetch current month data from multiple sources
    const [currentMonthLogs, currentMonthPosts, currentMonthContentHistory] = await Promise.all([
      supabase
        .from('logs')
        .select('*')
        .in('action', ['telegram_send', 'content_generated', 'ai_generation'])
        .gte('created_at', currentMonthStart)
        .lte('created_at', currentMonthEnd),
      
      supabase
        .from('posts')
        .select('*')
        .in('status', ['sent', 'completed'])
        .gte('created_at', currentMonthStart)
        .lte('created_at', currentMonthEnd),
      
      supabase
        .from('channel_content_history')
        .select('*')
        .eq('delivery_status', 'sent')
        .gte('created_at', currentMonthStart)
        .lte('created_at', currentMonthEnd)
    ]);

    // Fetch last month data from multiple sources
    const [lastMonthLogs, lastMonthPosts, lastMonthContentHistory] = await Promise.all([
      supabase
        .from('logs')
        .select('*')
        .in('action', ['telegram_send', 'content_generated', 'ai_generation'])
        .gte('created_at', lastMonthStart)
        .lte('created_at', lastMonthEnd),
      
      supabase
        .from('posts')
        .select('*')
        .in('status', ['sent', 'completed'])
        .gte('created_at', lastMonthStart)
        .lte('created_at', lastMonthEnd),
      
      supabase
        .from('channel_content_history')
        .select('*')
        .eq('delivery_status', 'sent')
        .gte('created_at', lastMonthStart)
        .lte('created_at', lastMonthEnd)
    ]);

    // Handle errors
    if (currentMonthLogs.error) throw currentMonthLogs.error;
    if (currentMonthPosts.error) throw currentMonthPosts.error;
    if (currentMonthContentHistory.error) throw currentMonthContentHistory.error;
    if (lastMonthLogs.error) throw lastMonthLogs.error;
    if (lastMonthPosts.error) throw lastMonthPosts.error;
    if (lastMonthContentHistory.error) throw lastMonthContentHistory.error;

    // Calculate token usage based on content and estimated costs
    const calculateTokensAndCost = (logs: any[], posts: any[], contentHistory: any[]) => {
      let totalTokens = 0;
      let totalCost = 0;
      let totalRequests = 0;

      // Process logs
      (logs || []).forEach((log: any) => {
        const content = log.message || '';
        const estimatedTokens = Math.ceil(content.length / 4);
        const costPerToken = 0.00002; // Average GPT cost
        
        totalTokens += estimatedTokens;
        totalCost += estimatedTokens * costPerToken;
        totalRequests++;
      });

      // Process posts
      (posts || []).forEach((post: any) => {
        const content = post.content_text || post.content || '';
        const contentType = post.content_type || 'unknown';
        const estimatedTokens = Math.ceil(content.length / 4);
        
        let costPerToken = 0.00002; // Default cost
        switch (contentType) {
          case 'betting_tip':
          case 'match_analysis':
            costPerToken = 0.00003; // GPT-4 pricing
            break;
          case 'news':
          case 'poll':
            costPerToken = 0.000015; // GPT-3.5-turbo pricing
            break;
          case 'live_update':
            costPerToken = 0.00001; // Simpler content
            break;
        }

        totalTokens += estimatedTokens;
        totalCost += estimatedTokens * costPerToken;
        totalRequests++;
      });

      // Process content history
      (contentHistory || []).forEach((item: any) => {
        const content = item.content_text || '';
        const contentType = item.content_type || 'unknown';
        const generationTime = item.generation_time_ms || 0;
        const aiModel = item.ai_model_used || 'gpt-4';
        
        const estimatedTokens = Math.ceil(content.length / 4);
        
        let costPerToken = 0.00002;
        if (aiModel.includes('gpt-4')) {
          costPerToken = 0.00003;
        } else if (aiModel.includes('gpt-3.5')) {
          costPerToken = 0.000015;
        }

        // Add complexity multiplier based on generation time
        if (generationTime > 10000) { // Over 10 seconds
          costPerToken *= 1.5;
        }

        totalTokens += estimatedTokens;
        totalCost += estimatedTokens * costPerToken;
        totalRequests++;
      });

      return {
        tokens: totalTokens,
        cost: Math.round(totalCost * 100) / 100,
        requests: totalRequests
      };
    };

    // Calculate current month usage
    const currentMonthUsage = calculateTokensAndCost(
      currentMonthLogs.data || [],
      currentMonthPosts.data || [],
      currentMonthContentHistory.data || []
    );

    // Calculate last month usage
    const lastMonthUsage = calculateTokensAndCost(
      lastMonthLogs.data || [],
      lastMonthPosts.data || [],
      lastMonthContentHistory.data || []
    );

    // Calculate growth percentages
    const costGrowth = lastMonthUsage.cost > 0 ? 
      ((currentMonthUsage.cost - lastMonthUsage.cost) / lastMonthUsage.cost * 100) : 0;

    const usageGrowth = lastMonthUsage.tokens > 0 ? 
      ((currentMonthUsage.tokens - lastMonthUsage.tokens) / lastMonthUsage.tokens * 100) : 0;

    // Calculate daily breakdown for current month
    const dailyBreakdown = [];
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const currentDay = now.getDate();
    
    for (let day = Math.max(1, currentDay - 6); day <= currentDay; day++) {
      const dayStart = new Date(currentYear, currentMonth - 1, day).toISOString();
      const dayEnd = new Date(currentYear, currentMonth - 1, day, 23, 59, 59).toISOString();
      
      const dayLogs = (currentMonthLogs.data || []).filter((log: any) => 
        log.created_at >= dayStart && log.created_at <= dayEnd
      );
      const dayPosts = (currentMonthPosts.data || []).filter((post: any) => 
        post.created_at >= dayStart && post.created_at <= dayEnd
      );
      const dayContent = (currentMonthContentHistory.data || []).filter((item: any) => 
        item.created_at >= dayStart && item.created_at <= dayEnd
      );
      
      const dayUsage = calculateTokensAndCost(dayLogs, dayPosts, dayContent);
      
      dailyBreakdown.push({
        date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
        cost: dayUsage.cost,
        requests: dayUsage.requests,
        tokens: dayUsage.tokens
      });
    }

    // Calculate averages and projections
    const averageDailyCost = currentDay > 0 ? currentMonthUsage.cost / currentDay : 0;
    const projectedMonthlyCost = averageDailyCost * daysInMonth;

    // Determine budget status
    const getBudgetStatus = (cost: number) => {
      if (cost < 50) return 'within_budget';
      if (cost < 200) return 'approaching_limit';
      return 'over_budget';
    };

    // Get top content types
    const allContentTypes = [
      ...(currentMonthPosts.data || []).map((p: any) => p.content_type),
      ...(currentMonthContentHistory.data || []).map((c: any) => c.content_type)
    ].filter(Boolean);

    const contentTypeCounts = allContentTypes.reduce((acc: any, type: string) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const topContentTypes = Object.entries(contentTypeCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([type]) => type);

    const responseData = {
      currentMonth: {
        cost: currentMonthUsage.cost,
        tokens: currentMonthUsage.tokens,
        requests: currentMonthUsage.requests,
        averageDailyCost: Math.round(averageDailyCost * 100) / 100
      },
      lastMonth: {
        cost: lastMonthUsage.cost,
        tokens: lastMonthUsage.tokens,
        requests: lastMonthUsage.requests
      },
      growth: {
        cost: Math.round(costGrowth * 10) / 10,
        usage: Math.round(usageGrowth * 10) / 10
      },
      projections: {
        monthlyCost: Math.round(projectedMonthlyCost * 100) / 100,
        dailyAverage: Math.round(averageDailyCost * 100) / 100,
        daysRemaining: daysInMonth - currentDay
      },
      dailyBreakdown,
      summary: {
        status: getBudgetStatus(currentMonthUsage.cost),
        budgetUsed: Math.round((currentMonthUsage.cost / 500) * 100), // Assuming $500 monthly budget
        topModels: topContentTypes.length > 0 ? topContentTypes : ['gpt-4', 'gpt-3.5-turbo'],
        efficiency: Math.max(0, Math.round(100 - (costGrowth > 0 ? Math.min(costGrowth / 2, 50) : 0)))
      },
      metadata: {
        totalContentGenerated: currentMonthUsage.requests,
        averageTokensPerRequest: currentMonthUsage.requests > 0 ? 
          Math.round(currentMonthUsage.tokens / currentMonthUsage.requests) : 0,
        mostActiveContentType: topContentTypes[0] || 'unknown'
      }
    };

    console.log('✅ OpenAI Costs calculated from real database data:', {
      currentMonthCost: responseData.currentMonth.cost,
      totalRequests: responseData.currentMonth.requests,
      projectedCost: responseData.projections.monthlyCost,
      status: responseData.summary.status,
      topContentType: responseData.metadata.mostActiveContentType
    });

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ OpenAI Costs API Error:', error);
    
    // Return fallback data
    return NextResponse.json({
      currentMonth: {
        cost: 0,
        tokens: 0,
        requests: 0,
        averageDailyCost: 0
      },
      lastMonth: {
        cost: 0,
        tokens: 0,
        requests: 0
      },
      growth: {
        cost: 0,
        usage: 0
      },
      projections: {
        monthlyCost: 0,
        dailyAverage: 0,
        daysRemaining: 30
      },
      dailyBreakdown: [],
      summary: {
        status: 'no_data',
        budgetUsed: 0,
        topModels: ['gpt-4', 'gpt-3.5-turbo'],
        efficiency: 100
      },
      metadata: {
        totalContentGenerated: 0,
        averageTokensPerRequest: 0,
        mostActiveContentType: 'unknown'
      },
      error: 'Unable to fetch usage data',
      fallback: true
    }, { status: 500 });
  }
} 