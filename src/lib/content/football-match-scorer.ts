import { MatchData } from './unified-football-service';

/**
 * 🧠 SMART FOOTBALL MATCH SCORER - מערכת ניקוד חכם למשחקי כדורגל
 * 
 * מטרה: לדרג משחקים לפי רלוונטיות, פופולריות ועניין כדי לקבוע איזה תוכן הכי כדאי ליצור
 * משמש כבסיס לכל סוגי התוכן - חדשות, טיפים, סקרים, ניתוחים וכו'
 */

export interface ScoredMatch extends MatchData {
  relevance_score: {
    competition: number;
    teams: number;
    timing: number;
    stage: number;
    rivalry: number;
    total: number;
  };
  reasons: string[];
  content_suitability: {
    news: number;      // 0-100
    betting_tip: number;
    poll: number;
    analysis: number;
    daily_summary: number;
    weekly_summary: number;
    live_update: number;
  };
}

export interface MatchScoringOptions {
  content_type?: 'news' | 'betting_tip' | 'poll' | 'analysis' | 'daily_summary' | 'weekly_summary' | 'live_update' | 'all';
  min_score_threshold?: number;
  max_future_days?: number; // כמה ימים קדימה מקסימום
  language?: 'en' | 'am' | 'sw';
  user_preferences?: {
    favorite_leagues?: string[];
    favorite_teams?: string[];
    boost_score?: number;
  };
}

export class FootballMatchScorer {
  private _loggedCompetitions?: Set<string>;
  
  /**
   * 🏆 טבלת ניקוד ליגות לפי פופולריות עולמית
   */
  private readonly COMPETITION_SCORES: Record<string, number> = {
    // Level 10 - משחקים עולמיים
    'FIFA World Cup': 10,
    'WC': 10,
    'World Cup': 10,
    'FIFA Club World Cup': 10,
    'Club World Cup': 10,
    'FIFA Club World Cup 2025': 10,
    'FIFA Intercontinental Cup': 10,
    'Intercontinental Cup': 10,
    'CWC': 10,
    
    // Level 9 - ליגות עילית
    'UEFA Champions League': 9,
    'CL': 9,
    'Champions League': 9,
    'Premier League': 9,
    'PL': 9,
    'UEFA European Championship': 9,
    'EC': 9,
    'Euro': 9,
    
    // Level 8 - ליגות מובילות
    'Primera División': 8,
    'La Liga': 8,
    'PD': 8,
    'Serie A': 7,
    'SA': 7,
    'Bundesliga': 7,
    'BL1': 7,
    
    // Level 6 - ליגות איכותיות
    'Ligue 1': 6,
    'FL1': 6,
    'Série A': 6,  // ברזיל
    'BSA': 6,
    'UEFA Europa League': 6,
    'EL': 6,
    
    // Level 5 - ליגות בינוניות
    'Eredivisie': 5,
    'DED': 5,
    'Primeira Liga': 5, // פורטוגל
    'PPL': 5,
    'MLS': 4,
    
    // Level 4 - ליגות שניות
    'EFL Championship': 4,
    'ELC': 4,
    'Süper Lig': 4,
    'Super League': 4,
    
    // Default עבור ליגות לא מוכרות
    'unknown': 2
  };

  /**
   * 🌟 טבלת ניקוד קבוצות לפי פופולריות עולמית
   */
  private readonly TEAM_SCORES: Record<string, number> = {
    // Level 10 - מגה קלאבים
    'Real Madrid': 10,
    'FC Barcelona': 10,
    'Barcelona': 10,
    
    // Level 9 - קלאבי עילית
    'Manchester United': 9,
    'Manchester City': 9,
    'Paris Saint-Germain': 9,
    'PSG': 9,
    'Liverpool': 8,
    'Chelsea': 8,
    'Arsenal': 8,
    'Bayern Munich': 8,
    'Bayern München': 8,
    
    // Level 7 - קלאבים גדולים
    'Juventus': 7,
    'AC Milan': 7,
    'Inter Milan': 7,
    'Internazionale': 7,
    'Tottenham Hotspur': 7,
    'Atlético Madrid': 7,
    'Atletico Madrid': 7,
    'Borussia Dortmund': 7,
    
    // Level 6 - קלאבים מובילים
    'AS Roma': 6,
    'SSC Napoli': 6,
    'Napoli': 6,
    'Valencia CF': 6,
    'Valencia': 6,
    'Sevilla FC': 6,
    'Sevilla': 6,
    'Leicester City': 6,
    'West Ham United': 6,
    
    // Level 5 - קלאבים בינוניים
    'Newcastle United': 5,
    'Aston Villa': 5,
    'Brighton & Hove Albion': 5,
    'Crystal Palace': 5,
    'Everton': 4,
    'Southampton': 4,
    'Leeds United': 4,
    
    // Default עבור קבוצות לא מוכרות
    'unknown': 3
  };

  /**
   * 🏟️ מערכת ניקוד יריבויות מיוחדות
   */
  private readonly RIVALRY_MATCHES: Array<{
    teams: string[];
    name: string;
    score: number;
  }> = [
    {
      teams: ['Real Madrid', 'FC Barcelona', 'Barcelona'],
      name: 'El Clásico',
      score: 3
    },
    {
      teams: ['Manchester United', 'Manchester City'],
      name: 'Manchester Derby',
      score: 2
    },
    {
      teams: ['Manchester United', 'Liverpool'],
      name: 'North West Derby',
      score: 2
    },
    {
      teams: ['Arsenal', 'Tottenham Hotspur', 'Tottenham'],
      name: 'North London Derby',
      score: 2
    },
    {
      teams: ['AC Milan', 'Inter Milan', 'Internazionale'],
      name: 'Derby della Madonnina',
      score: 2
    },
    {
      teams: ['Juventus', 'Inter Milan', 'Internazionale'],
      name: 'Derby d\'Italia',
      score: 2
    },
    {
      teams: ['Borussia Dortmund', 'Bayern Munich', 'Bayern München'],
      name: 'Der Klassiker',
      score: 2
    }
  ];

  /**
   * 🎯 נקודת הכניסה הראשית - ניקוד רשימת משחקים
   */
  async scoreMatches(matches: MatchData[], options: MatchScoringOptions = {}): Promise<ScoredMatch[]> {
    console.log(`🧠 Smart Football Scorer: Analyzing ${matches.length} matches`);
    console.log(`📊 === DETAILED MATCH SCORING LOG (${matches.length} matches) ===`);
    
    const scoredMatches: ScoredMatch[] = [];
    const now = new Date();
    
    for (const match of matches) {
      const scored = await this.scoreIndividualMatch(match, now, options);
      
      // סינון לפי threshold אם הוגדר
      if (options.min_score_threshold && scored.relevance_score.total < options.min_score_threshold) {
        continue;
      }
      
      // סינון לפי טווח זמן - הסרת משחקים מעל 14 יום
      const daysDiff = (match.kickoff.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      const maxDays = options.max_future_days || 14; // ברירת מחדל 14 יום
      
      if (daysDiff > maxDays) {
        console.log(`⏭️ Filtering out match ${match.homeTeam.name} vs ${match.awayTeam.name} (${Math.round(daysDiff)} days away)`);
        continue;
      }
      
      // סינון נוסף - משחקים עם ציון תזמון נמוך מדי (אופציונלי לפי סוג תוכן)
      const minTimingScore = this.getMinTimingScoreForContentType(options.content_type);
      if (scored.relevance_score.timing < minTimingScore) {
        console.log(`⏰ Filtering out match with low timing score: ${match.homeTeam.name} vs ${match.awayTeam.name} (score: ${scored.relevance_score.timing}, min required: ${minTimingScore} for ${options.content_type})`);
        continue;
      }
      
      // 🚨 STRICT FILTER: Content-specific time limits
      const hoursAgo = Math.abs(daysDiff) * 24;
      let maxHoursBack = 48; // Default: 48 hours for polls and daily summaries
      
      // Adjust max hours based on content type
      if (options.content_type === 'betting_tip') {
        maxHoursBack = 0; // No past matches for betting
      } else if (options.content_type === 'live_update') {
        maxHoursBack = 12; // 12 hours for live updates
      } else if (options.content_type === 'news') {
        maxHoursBack = 168; // 7 days for news
      } else if (options.content_type === 'analysis') {
        maxHoursBack = 120; // 5 days for analysis
      } else if (options.content_type === 'weekly_summary') {
        maxHoursBack = 168; // 7 days for weekly summary
      }
      
      if (daysDiff < 0 && hoursAgo > maxHoursBack) {
        console.log(`⏰ STRICT FILTER: Rejecting match ${match.homeTeam.name} vs ${match.awayTeam.name} (${hoursAgo.toFixed(1)} hours ago - too old for ${options.content_type}, max: ${maxHoursBack}h)`);
        continue;
      }
      
      // סינון משחקים שעברו - מותאם לסוג תוכן
      const maxPastDays = this.getMaxPastDaysForContentType(options.content_type);
      if (daysDiff < -maxPastDays) {
        console.log(`📅 Filtering out old match: ${match.homeTeam.name} vs ${match.awayTeam.name} (${Math.abs(daysDiff)} days ago, max allowed: ${maxPastDays} days for ${options.content_type})`);
        continue;
      }
      
      scoredMatches.push(scored);
    }
    
    // מיון לפי ניקוד כולל (גבוה לנמוך)
    scoredMatches.sort((a, b) => b.relevance_score.total - a.relevance_score.total);
    
    console.log(`✅ Smart Scorer: ${scoredMatches.length} matches passed filtering`);
    console.log(`🔝 Top match: ${scoredMatches[0]?.homeTeam.name} vs ${scoredMatches[0]?.awayTeam.name} (Score: ${scoredMatches[0]?.relevance_score.total})`);
    
    // לוג של 10 המשחקים הטובים ביותר
    console.log(`🏆 === TOP 10 MATCHES BY SCORE ===`);
    scoredMatches.slice(0, 10).forEach((match, index) => {
      console.log(`${index + 1}. ${match.homeTeam.name} vs ${match.awayTeam.name} - Score: ${match.relevance_score.total} | Competition: ${match.competition.name}`);
    });
    console.log(`🏆 === END OF TOP 10 ===`);
    
    return scoredMatches;
  }

  /**
   * 📊 ניקוד משחק בודד
   */
  private async scoreIndividualMatch(match: MatchData, now: Date, options: MatchScoringOptions): Promise<ScoredMatch> {
    const competitionScore = this.calculateCompetitionScore(match);
    const teamsScore = this.calculateTeamsScore(match, options.user_preferences);
    const timingScore = this.calculateTimingScore(match, now, options.content_type);
    const stageScore = this.calculateStageScore(match);
    const rivalryScore = this.calculateRivalryScore(match);
    
    const totalScore = competitionScore + teamsScore + timingScore + stageScore + rivalryScore;
    
    // ניקוד סופי מחושב
    
    const reasons = this.generateScoringReasons(match, {
      competition: competitionScore,
      teams: teamsScore,
      timing: timingScore,
      stage: stageScore,
      rivalry: rivalryScore,
      total: totalScore
    });

    const contentSuitability = this.calculateContentSuitability(match, totalScore, options.content_type);

    return {
      ...match,
      relevance_score: {
        competition: competitionScore,
        teams: teamsScore,
        timing: timingScore,
        stage: stageScore,
        rivalry: rivalryScore,
        total: totalScore
      },
      reasons,
      content_suitability: contentSuitability
    };
  }

  /**
   * 🏆 חישוב ניקוד תחרות
   */
  private calculateCompetitionScore(match: MatchData): number {
    const competitionName = match.competition.name;
    
    // מעקב על תחרויות שנראו (ללא לוג)
    if (!this._loggedCompetitions) {
      this._loggedCompetitions = new Set();
    }
    this._loggedCompetitions.add(competitionName);
    
    // בדיקה ישירה לפי שם
    if (this.COMPETITION_SCORES[competitionName]) {
      return this.COMPETITION_SCORES[competitionName];
    }
    
    // בדיקה חלקית לשם (למקרה של שמות מעט שונים)
    for (const [key, score] of Object.entries(this.COMPETITION_SCORES)) {
      if (competitionName.toLowerCase().includes(key.toLowerCase()) || 
          key.toLowerCase().includes(competitionName.toLowerCase())) {
        return score;
      }
    }
    
    return this.COMPETITION_SCORES['unknown'];
  }

  /**
   * 👥 חישוב ניקוד קבוצות
   */
  private calculateTeamsScore(match: MatchData, userPreferences?: { favorite_teams?: string[], boost_score?: number }): number {
    const homeScore = this.getTeamScore(match.homeTeam.name);
    const awayScore = this.getTeamScore(match.awayTeam.name);
    let totalTeamsScore = homeScore + awayScore;
    
    // בוסט למשתמשים עם העדפות
    if (userPreferences?.favorite_teams && userPreferences.boost_score) {
      const isFavoriteMatch = userPreferences.favorite_teams.some(fav => 
        match.homeTeam.name.includes(fav) || match.awayTeam.name.includes(fav)
      );
      if (isFavoriteMatch) {
        totalTeamsScore += userPreferences.boost_score;
      }
    }
    
    return totalTeamsScore;
  }

  /**
   * 🌟 קבלת ניקוד קבוצה בודדת
   */
  private getTeamScore(teamName: string): number {
    // בדיקה ישירה
    if (this.TEAM_SCORES[teamName]) {
      return this.TEAM_SCORES[teamName];
    }
    
    // בדיקה חלקית
    for (const [key, score] of Object.entries(this.TEAM_SCORES)) {
      if (teamName.toLowerCase().includes(key.toLowerCase()) || 
          key.toLowerCase().includes(teamName.toLowerCase())) {
        return score;
      }
    }
    
    return this.TEAM_SCORES['unknown'];
  }

  /**
   * 📅 קביעת מספר הימים המקסימלי אחורה לפי סוג תוכן
   */
  private getMaxPastDaysForContentType(contentType?: string): number {
    switch (contentType) {
      case 'news':
        return 7; // חדשות יכולות להיות על משחקים מהשבוע האחרון
      case 'analysis':
        return 5; // ניתוחים על משחקים שעברו עד 5 ימים
      case 'daily_summary':
        return 2; // סיכומים יומיים - עד 48 שעות אחורה
      case 'weekly_summary':
        return 7; // סיכומים שבועיים - השבוע שעבר
      case 'live_update':
        return 0.5; // עדכונים חיים - רק משחקים מהיום
      case 'betting_tip':
        return 0; // טיפים רק למשחקים עתידיים
      case 'poll':
        return 2; // פולים על משחקים מ-48 שעות אחורה או עתידיים
      default:
        return 3; // ברירת מחדל - 3 ימים
    }
  }

  /**
   * ⏰ קביעת ניקוד תזמון מינימלי לפי סוג תוכן
   */
  private getMinTimingScoreForContentType(contentType?: string): number {
    switch (contentType) {
      case 'news':
        return 1; // חדשות גמישות יותר
      case 'analysis':
        return 1; // ניתוחים גמישים
      case 'daily_summary':
        return 2; // סיכומים יומיים צריכים קצת יותר רלוונטיות
      case 'live_update':
        return 1; // עדכונים חיים - גמיש אם המשחק רלוונטי
      case 'betting_tip':
        return 2; // הימורים צריכים להיות רלוונטיים יותר
      case 'poll':
        return 1; // פולים גמישים
      default:
        return 1; // ברירת מחדל גמישה
    }
  }

  /**
   * ⏰ חישוב ניקוד תזמין - מותאם לסוג תוכן
   */
  private calculateTimingScore(match: MatchData, now: Date, contentType?: string): number {
    const timeDiff = match.kickoff.getTime() - now.getTime();
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    
    // ניקוד מיוחד לתוכן חי
    if (contentType === 'live_update') {
      if (match.status === 'LIVE' || match.status === 'IN_PLAY') {
        return 10; // ניקוד מקסימלי למשחקים חיים
      }
      if (Math.abs(daysDiff) < 0.5) { // תוך 12 שעות (עבר או עתיד)
        return 8;
      }
      return 1; // משחקים רחוקים פחות רלוונטיים לעדכונים חיים
    }
    
    // ניקוד לתוכן חדשות - גמיש יותר עם משחקים שעברו
    if (contentType === 'news') {
      if (daysDiff < 0) {
        // משחקים שכבר עברו
        const daysAgo = Math.abs(daysDiff);
        if (daysAgo <= 0.5) return 4; // תוך 12 שעות - ניקוד מופחת
        if (daysAgo <= 1) return 3; // אתמול - ניקוד נמוך יותר
        if (daysAgo <= 3) return 2; // 2-3 ימים אחורה - ניקוד נמוך
        return 0; // יותר מדי ישן לחדשות
      } else {
        // משחקים עתידיים - עדיפות גבוהה יותר
        if (daysDiff <= 1) return 8; // היום או מחר - ניקוד גבוה
        if (daysDiff <= 7) return 6; // השבוע הבא
        if (daysDiff <= 30) return 4; // החודש הבא
        return 2; // רחוק מדי
      }
    }
    
    // ניקוד לניתוחים - טוב גם למשחקים שעברו לאחרונה
    if (contentType === 'analysis') {
      if (daysDiff < 0) {
        const daysAgo = Math.abs(daysDiff);
        if (daysAgo <= 2) return 6; // 2 ימים אחורה
        if (daysAgo <= 5) return 4; // עד 5 ימים אחורה
        return 0;
      } else {
        if (daysDiff <= 7) return 5; // השבוע הבא
        if (daysDiff <= 14) return 3; // שבועיים
        return 1;
      }
    }
    
    // ניקוד להימורים - רק משחקים עתידיים
    if (contentType === 'betting_tip') {
      if (daysDiff < 0) return 0; // אין הימורים על עבר
      if (daysDiff <= 1) return 8; // היום או מחר
      if (daysDiff <= 7) return 6; // השבוע הבא
      if (daysDiff <= 14) return 4; // שבועיים
      return 2; // רחוק יותר
    }
    
    // ניקוד לסיכומים יומיים - על משחקים מ-48 שעות אחורה
    if (contentType === 'daily_summary') {
      if (daysDiff < 0) {
        const daysAgo = Math.abs(daysDiff);
        if (daysAgo <= 1) return 10; // אתמול - מושלם לסיכום יומי
        if (daysAgo <= 2) return 8; // 48 שעות אחורה - עדיין טוב
        return 0; // יותר מ-48 שעות - לא רלוונטי
      }
      return 0; // עתידיים - לא רלוונטי לסיכום יומי
    }
    
    // ניקוד לסיכומים שבועיים - על משחקים מהשבוע שעבר
    if (contentType === 'weekly_summary') {
      if (daysDiff < 0) {
        const daysAgo = Math.abs(daysDiff);
        if (daysAgo <= 1) return 8; // אתמול - חלק מהשבוע שעבר
        if (daysAgo <= 7) return 10; // השבוע שעבר - מושלם לסיכום שבועי
        return 0; // יותר מדי ישן
      }
      return 0; // עתידיים - לא רלוונטי לסיכום שבועי
    }
    
    // ניקוד לפולים - טוב גם למישחקים שעברו לאחרונה!
    if (contentType === 'poll') {
      if (daysDiff < 0) {
        const daysAgo = Math.abs(daysDiff);
        if (daysAgo <= 1) return 6; // אתמול - ניקוד גבוה לפולים!
        if (daysAgo <= 2) return 5; // 48 שעות אחורה - עדיין טוב לפולים
        if (daysAgo <= 3) return 4; // 2-3 ימים אחורה - עדיין טוב לפולים
        if (daysAgo <= 7) return 2; // עד שבוע - נמוך אבל עדיין משהו
        
        // סיום הניקוד לפולים על עבר
        
        return 0; // יותר מדי ישן
      } else {
        // משחקים עתידיים
        if (daysDiff <= 1) return 8; // היום או מחר
        if (daysDiff <= 7) return 6; // השבוע הבא
        if (daysDiff <= 14) return 4; // שבועיים
        return 2; // רחוק יותר
      }
    }
    
    // ניקוד כללי (ברירת מחדל)
    if (daysDiff < 0) {
      const daysAgo = Math.abs(daysDiff);
      if (daysAgo <= 1) return 4; // אתמול
      if (daysAgo <= 3) return 2; // 2-3 ימים אחורה
      return 0; // יותר מדי ישן
    }
    
    if (daysDiff <= 1) return 6;      // היום או מחר
    if (daysDiff <= 3) return 5;      // תוך 3 ימים
    if (daysDiff <= 7) return 4;      // השבוע
    if (daysDiff <= 14) return 3;     // תוך שבועיים
    if (daysDiff <= 30) return 2;     // החודש
    
    return 1; // רחוק מדי אבל עדיין קצת רלוונטי
  }

  /**
   * 🏟️ חישוב ניקוד שלב בטורניר
   */
  private calculateStageScore(match: MatchData): number {
    // זה יידרש הרחבה עתידית כאשר יהיה לנו מידע על שלבי טורניר
    // כרגע נחזיר ניקוד בסיסי
    return 1;
  }

  /**
   * ⚔️ חישוב ניקוד יריבות
   */
  private calculateRivalryScore(match: MatchData): number {
    const homeTeam = match.homeTeam.name;
    const awayTeam = match.awayTeam.name;
    
    for (const rivalry of this.RIVALRY_MATCHES) {
      const hasHomeTeam = rivalry.teams.some(team => 
        homeTeam.toLowerCase().includes(team.toLowerCase()) || 
        team.toLowerCase().includes(homeTeam.toLowerCase())
      );
      const hasAwayTeam = rivalry.teams.some(team => 
        awayTeam.toLowerCase().includes(team.toLowerCase()) || 
        team.toLowerCase().includes(awayTeam.toLowerCase())
      );
      
      if (hasHomeTeam && hasAwayTeam) {
        return rivalry.score;
      }
    }
    
    return 0;
  }

  /**
   * 📝 יצירת הסברים לניקוד
   */
  private generateScoringReasons(match: MatchData, scores: any): string[] {
    const reasons: string[] = [];
    
    if (scores.competition >= 8) {
      reasons.push(`🏆 Premium competition: ${match.competition.name}`);
    }
    
    if (scores.teams >= 15) {
      reasons.push(`⭐ Popular teams: ${match.homeTeam.name} vs ${match.awayTeam.name}`);
    }
    
    if (scores.timing >= 4) {
      const daysDiff = (match.kickoff.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      if (daysDiff <= 1) {
        reasons.push('⏰ Match nearby (today/tomorrow)');
      } else {
        reasons.push('�� Current match this week');
      }
    }
    
    if (scores.rivalry >= 2) {
      reasons.push('⚔️ Derby or special rivalry');
    }
    
    if (scores.total >= 25) {
      reasons.push('🔥 High interest match');
    }
    
    return reasons;
  }

  /**
   * 🎯 חישוב התאמה לסוגי תוכן שונים
   */
  private calculateContentSuitability(match: MatchData, totalScore: number, contentType?: string): ScoredMatch['content_suitability'] {
    const base = Math.min(totalScore * 3, 100); // המרה לסקלת 0-100
    
    const suitability = {
      news: base,
      betting_tip: match.status === 'SCHEDULED' ? base : Math.max(base - 30, 0), // טיפים רק למשחקים עתידיים
      poll: base * 0.9, // פולים תמיד טובים
      analysis: base * 0.95,
      daily_summary: base * 0.8,
      weekly_summary: base * 0.85,
      live_update: match.status === 'LIVE' ? 100 : Math.max(base - 50, 0) // עדכונים חיים רק למשחקים חיים
    };
    
    return suitability;
  }

  /**
   * 🎯 קבלת המשחקים הטובים ביותר לסוג תוכן ספציפי
   */
  async getBestMatchesForContentType(
    matches: MatchData[], 
    contentType: 'news' | 'betting_tip' | 'poll' | 'analysis' | 'daily_summary' | 'weekly_summary' | 'live_update',
    limit: number = 5
  ): Promise<ScoredMatch[]> {
    const options: MatchScoringOptions = {
      content_type: contentType,
      min_score_threshold: contentType === 'live_update' ? 15 : 20,
      max_future_days: contentType === 'news' ? 60 : 14 // חדשות יכולות להיות על משחקים רחוקים יותר
    };
    
    const scoredMatches = await this.scoreMatches(matches, options);
    
    // סינון נוסף לפי התאמה לסוג התוכן
    const filtered = scoredMatches.filter(match => {
      const suitability = match.content_suitability[contentType];
      return suitability >= 50; // סף מינימלי להתאמה
    });
    
    return filtered.slice(0, limit);
  }

  /**
   * 📊 סטטיסטיקות על תהליך הניקוד
   */
  generateScoringStats(scoredMatches: ScoredMatch[]): {
    total_matches: number;
    avg_score: number;
    top_competitions: string[];
    score_distribution: { range: string, count: number }[];
  } {
    if (scoredMatches.length === 0) {
      return {
        total_matches: 0,
        avg_score: 0,
        top_competitions: [],
        score_distribution: []
      };
    }
    
    const avgScore = scoredMatches.reduce((sum, match) => sum + match.relevance_score.total, 0) / scoredMatches.length;
    
    const competitions = scoredMatches.map(m => m.competition.name);
    const topCompetitions = [...new Set(competitions)].slice(0, 5);
    
    const scoreDistribution = [
      { range: '30+', count: scoredMatches.filter(m => m.relevance_score.total >= 30).length },
      { range: '25-29', count: scoredMatches.filter(m => m.relevance_score.total >= 25 && m.relevance_score.total < 30).length },
      { range: '20-24', count: scoredMatches.filter(m => m.relevance_score.total >= 20 && m.relevance_score.total < 25).length },
      { range: '15-19', count: scoredMatches.filter(m => m.relevance_score.total >= 15 && m.relevance_score.total < 20).length },
      { range: '<15', count: scoredMatches.filter(m => m.relevance_score.total < 15).length }
    ];
    
    return {
      total_matches: scoredMatches.length,
      avg_score: Math.round(avgScore * 10) / 10,
      top_competitions: topCompetitions,
      score_distribution: scoreDistribution
    };
  }
}

// ייצוא instance יחיד
export const footballMatchScorer = new FootballMatchScorer(); 