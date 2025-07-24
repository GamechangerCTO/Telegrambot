import { NextRequest, NextResponse } from 'next/server';
import { unifiedFootballService } from '@/lib/content/unified-football-service';
import { FootballMatchScorer } from '@/lib/content/football-match-scorer';
import { smartContentScheduler } from '@/lib/automation/smart-content-scheduler';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  console.log('🌅 [CRON] Morning Discovery started:', new Date().toISOString());
  
  try {
    // Verify this is a Vercel cron job
    const userAgent = request.headers.get('user-agent') || '';
    const isVercelCron = userAgent.includes('vercel-cron') || 
                        request.headers.get('x-vercel-deployment-url') ||
                        process.env.NODE_ENV === 'production';
                        
    if (!isVercelCron && process.env.NODE_ENV === 'production') {
      console.log('❌ [CRON] Unauthorized morning discovery attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('🔓 [CRON] Morning discovery authorized successfully');

    const results = {
      timestamp: new Date().toISOString(),
      tasks: [] as any[]
    };

    // Step 1: Clean up yesterday's data
    await cleanupYesterdayMatches();
    
    // Step 2: Discover today's important matches
    const importantMatches = await discoverTodaysImportantMatches();
    results.tasks.push({
      task: 'match_discovery',
      status: 'completed',
      data: {
        matchesFound: importantMatches.length,
        matches: importantMatches.map(m => ({
          teams: `${m.home_team} vs ${m.away_team}`,
          kickoff: m.kickoff_time,
          score: m.importance_score,
          competition: m.competition
        }))
      }
    });

    // Step 3: Schedule dynamic content for each match
    let totalContentScheduled = 0;
    for (const match of importantMatches) {
      const scheduledItems = await scheduleContentForMatch(match);
      totalContentScheduled += scheduledItems;
      
      results.tasks.push({
        task: 'content_scheduling',
        match: `${match.home_team} vs ${match.away_team}`,
        status: 'completed',
        data: {
          contentItemsScheduled: scheduledItems,
          kickoffTime: match.kickoff_time,
          importanceScore: match.importance_score
        }
      });
    }

    // Step 4: Summary and next steps
    results.tasks.push({
      task: 'discovery_summary',
      status: 'completed',
      data: {
        totalMatches: importantMatches.length,
        totalContentScheduled,
        nextDiscovery: 'Tomorrow 6:00 AM UTC',
        systemStatus: 'Ready for dynamic content generation'
      }
    });

    console.log(`✅ [CRON] Morning discovery completed - ${importantMatches.length} matches, ${totalContentScheduled} content items scheduled`);
    return NextResponse.json(results);

  } catch (error) {
    console.error('❌ [CRON] Morning discovery failed:', error);
    return NextResponse.json({ 
      error: 'Morning discovery failed',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * Clean up yesterday's match data to keep database lean
 */
async function cleanupYesterdayMatches(): Promise<void> {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    console.log(`🧹 Cleaning up matches from ${yesterdayStr}`);

    // Delete old scheduled content first (due to foreign key)
    const { error: scheduleError } = await supabase
      .from('dynamic_content_schedule')
      .delete()
      .in('match_id', 
        supabase
          .from('daily_important_matches')
          .select('id')
          .eq('discovery_date', yesterdayStr)
      );

    if (scheduleError) {
      console.error('❌ Error cleaning up schedule:', scheduleError);
    }

    // Delete old matches
    const { error: matchesError } = await supabase
      .from('daily_important_matches')
      .delete()
      .eq('discovery_date', yesterdayStr);

    if (matchesError) {
      console.error('❌ Error cleaning up matches:', matchesError);
    } else {
      console.log('✅ Yesterday data cleaned up successfully');
    }

  } catch (error) {
    console.error('❌ Error in cleanup:', error);
  }
}

/**
 * Discover today's important matches using FootballMatchScorer
 */
async function discoverTodaysImportantMatches(): Promise<any[]> {
  try {
    console.log('🔍 Discovering today\'s important matches...');

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Get all matches for today
    const todayMatches = await unifiedFootballService.getMatchesByDate(today);
    console.log(`📅 Found ${todayMatches.length} total matches for ${today}`);

    if (todayMatches.length === 0) {
      console.log('📭 No matches found for today');
      return [];
    }

         // Score matches using FootballMatchScorer
     const scorer = new FootballMatchScorer();
     const scoredMatches = await scorer.scoreMatches(todayMatches, {
       content_type: 'all', // Find matches suitable for all content types
       min_score_threshold: 15, // Only important matches (15+ points)
       max_future_days: 1, // Only today's matches
       language: 'en'
     });

    console.log(`⭐ ${scoredMatches.length} matches meet importance threshold (15+)`);

    // Save important matches to database
    const savedMatches: any[] = [];
    
    for (const match of scoredMatches) {
      try {
        const matchData = {
          external_match_id: match.id || `${match.homeTeam?.name || match.homeTeam}_vs_${match.awayTeam?.name || match.awayTeam}_${today}`,
          home_team: match.homeTeam?.name || match.homeTeam,
          away_team: match.awayTeam?.name || match.awayTeam,
          home_team_id: match.homeTeam?.id,
          away_team_id: match.awayTeam?.id,
                     competition: match.competition?.name || match.competition,
           kickoff_time: match.kickoff,
           venue: `${match.homeTeam?.name || match.homeTeam} Stadium`,
          importance_score: match.relevance_score?.total || 15,
          score_breakdown: match.relevance_score || {},
          content_opportunities: determineContentOpportunities(match.relevance_score?.total || 15),
          discovery_date: today,
          api_source: 'unified_football_service',
          raw_match_data: match
        };

        const { data, error } = await supabase
          .from('daily_important_matches')
          .insert(matchData)
          .select()
          .single();

        if (error) {
          console.error(`❌ Error saving match ${matchData.home_team} vs ${matchData.away_team}:`, error);
        } else {
          savedMatches.push(data);
          console.log(`✅ Saved: ${data.home_team} vs ${data.away_team} (Score: ${data.importance_score})`);
        }

      } catch (error) {
        console.error(`❌ Error processing match:`, error);
      }
    }

    return savedMatches;

  } catch (error) {
    console.error('❌ Error in match discovery:', error);
    return [];
  }
}

/**
 * Determine what content types are suitable for this match
 */
function determineContentOpportunities(importanceScore: number): any {
  const opportunities = {
    poll: importanceScore >= 18,
    betting: importanceScore >= 15,
    analysis: importanceScore >= 20,
    live_updates: importanceScore >= 15,
    summary: importanceScore >= 15
  };

  // Add special opportunities for high-value matches
  if (importanceScore >= 25) {
    return {
      ...opportunities,
      premium_analysis: true,
      multiple_polls: true,
      live_commentary: true
    };
  }

  return opportunities;
}

/**
 * Schedule dynamic content for a specific match using SmartContentScheduler
 */
async function scheduleContentForMatch(match: any): Promise<number> {
  try {
    console.log(`📅 Scheduling content for ${match.home_team} vs ${match.away_team} (Score: ${match.importance_score})`);

    // Get active channels grouped by language
    const { data: channels } = await supabase
      .from('channels')
      .select('id, language')
      .eq('is_active', true);

    if (!channels || channels.length === 0) {
      console.log('⚠️ No active channels found');
      return 0;
    }

    // Group channels by language
    const targetChannels: { [language: string]: string[] } = {};
    const languages: string[] = [];

    for (const channel of channels) {
      const lang = channel.language || 'en';
      if (!targetChannels[lang]) {
        targetChannels[lang] = [];
        languages.push(lang);
      }
      targetChannels[lang].push(channel.id);
    }

    console.log(`🌍 Scheduling for languages: ${languages.join(', ')}`);

    // Use SmartContentScheduler to create intelligent schedule
    const scheduleItems = await smartContentScheduler.scheduleContentForMatch({
      match,
      languages,
      targetChannels
    });

    console.log(`✅ Smart scheduling created ${scheduleItems.length} content items`);
    return scheduleItems.length;

  } catch (error) {
    console.error(`❌ Error scheduling content for match:`, error);
    return 0;
  }
}

/**
 * Find appropriate timing template based on match importance
 */
async function findTimingTemplate(importanceScore: number): Promise<any> {
  try {
    // Check for weekend special (Saturday/Sunday)
    const now = new Date();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    
    if (isWeekend && importanceScore >= 18) {
      const { data: weekendTemplate } = await supabase
        .from('content_timing_templates')
        .select('*')
        .eq('name', 'Weekend Special')
        .eq('is_active', true)
        .single();
      
      if (weekendTemplate) {
        return weekendTemplate;
      }
    }

    // Find template by importance score
    const { data: template } = await supabase
      .from('content_timing_templates')
      .select('*')
      .lte('min_importance_score', importanceScore)
      .gte('max_importance_score', importanceScore)
      .eq('is_active', true)
      .order('min_importance_score', { ascending: false })
      .limit(1)
      .single();

    return template;

  } catch (error) {
    console.error('❌ Error finding timing template:', error);
    return null;
  }
}

/**
 * Calculate expected engagement score for content type and match importance
 */
function calculateExpectedEngagement(contentType: string, importanceScore: number): number {
  const baseScores = {
    poll: 70,
    betting: 85,
    analysis: 65,
    live_updates: 90,
    summary: 55
  };

  const baseScore = baseScores[contentType as keyof typeof baseScores] || 60;
  
  // Boost based on match importance
  const importanceBoost = Math.min(30, (importanceScore - 15) * 2);
  
  return Math.min(100, baseScore + importanceBoost);
} 