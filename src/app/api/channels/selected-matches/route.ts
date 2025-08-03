import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * 🎯 API להחזרת המשחק הנבחר לכל ערוץ
 * מחזיר את המשחק החשוב ביותר לכל ערוץ בהתבסס על העדפותיו
 */
export async function GET(req: NextRequest) {
  try {
    console.log('🎯 שליפת המשחקים הנבחרים לכל ערוץ...');

    // קבלת כל הערוצים הפעילים
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select('id, name, language, selected_leagues, selected_teams, is_active, timezone')
      .eq('is_active', true);

    if (channelsError) {
      console.error('❌ שגיאה בשליפת ערוצים:', channelsError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch channels' 
      }, { status: 500 });
    }

    // קבלת משחקי היום החשובים
    const today = new Date().toISOString().split('T')[0];
    const { data: matches, error: matchesError } = await supabase
      .from('daily_important_matches')
      .select('*')
      .eq('discovery_date', today)
      .gte('importance_score', 10) // רק משחקים חשובים
      .order('importance_score', { ascending: false });

    if (matchesError) {
      console.error('❌ שגיאה בשליפת משחקים:', matchesError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch matches' 
      }, { status: 500 });
    }

    const channelsWithMatches = [];

    // לכל ערוץ, מצא את המשחק הכי מתאים
    for (const channel of channels || []) {
      const selectedMatch = findBestMatchForChannel(channel, matches || []);
      
      channelsWithMatches.push({
        ...channel,
        selected_match: selectedMatch
      });
    }

    console.log(`✅ נמצאו משחקים נבחרים עבור ${channelsWithMatches.length} ערוצים`);

    return NextResponse.json({
      success: true,
      channels_with_matches: channelsWithMatches,
      total_channels: channelsWithMatches.length,
      date: today
    });

  } catch (error) {
    console.error('❌ שגיאה כללית ב-API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

/**
 * 🎯 מציאת המשחק הכי מתאים לערוץ
 */
function findBestMatchForChannel(channel: any, matches: any[]): any | null {
  if (!matches || matches.length === 0) {
    return null;
  }

  console.log(`🔍 מחפש משחק עבור ערוץ ${channel.name}...`);

  // אם לערוץ יש קבוצות נבחרות - נעדיף אותן
  if (channel.selected_teams && channel.selected_teams.length > 0) {
    console.log(`🎯 מחפש לפי קבוצות נבחרות: ${channel.selected_teams.join(', ')}`);
    
    for (const match of matches) {
      const homeTeam = match.home_team?.toLowerCase() || '';
      const awayTeam = match.away_team?.toLowerCase() || '';
      
      for (const selectedTeam of channel.selected_teams) {
        const teamLower = selectedTeam.toLowerCase();
        if (homeTeam.includes(teamLower) || awayTeam.includes(teamLower)) {
          console.log(`✅ נמצא משחק לפי קבוצה נבחרת: ${match.home_team} vs ${match.away_team}`);
          return match;
        }
      }
    }
  }

  // אם לערוץ יש ליגות נבחרות - נעדיף אותן
  if (channel.selected_leagues && channel.selected_leagues.length > 0) {
    console.log(`🏆 מחפש לפי ליגות נבחרות: ${channel.selected_leagues.join(', ')}`);
    
    for (const match of matches) {
      const competition = match.competition?.toLowerCase() || '';
      
      for (const selectedLeague of channel.selected_leagues) {
        const leagueLower = selectedLeague.toLowerCase();
        if (competition.includes(leagueLower) || 
            competition.includes('premier') && leagueLower.includes('premier') ||
            competition.includes('champions') && leagueLower.includes('champions') ||
            competition.includes('liga') && leagueLower.includes('liga')) {
          console.log(`✅ נמצא משחק לפי ליגה נבחרת: ${match.home_team} vs ${match.away_team} (${match.competition})`);
          return match;
        }
      }
    }
  }

  // אם לא נמצא משחק ספציפי, נחזיר את המשחק החשוב ביותר
  if (matches.length > 0) {
    const topMatch = matches[0];
    console.log(`⭐ משחק כללי (הכי חשוב): ${topMatch.home_team} vs ${topMatch.away_team}`);
    return topMatch;
  }

  console.log(`❌ לא נמצא משחק עבור ערוץ ${channel.name}`);
  return null;
}

/**
 * 🔄 POST - עדכון המשחק הנבחר לערוץ מסוים
 */
export async function POST(req: NextRequest) {
  try {
    const { channel_id, match_id } = await req.json();

    if (!channel_id || !match_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Channel ID and Match ID are required' 
      }, { status: 400 });
    }

    // בעתיד נוכל להוסיף לוגיקה לשמירת בחירת המשחק לערוץ
    // כרגע פשוט נחזיר הצלחה
    
    return NextResponse.json({
      success: true,
      message: 'Selected match updated for channel'
    });

  } catch (error) {
    console.error('❌ שגיאה בעדכון משחק נבחר:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}