/**
 * ⚡ LIVE UPDATES GENERATOR
 * 
 * Flow for Live Updates Content:
 * 1. Get live/ongoing match → 2. Simulate real-time events → 3. Generate dynamic commentary → 4. Update statistics → 5. Create engaging updates → 6. Multi-language support
 * 
 * Key features:
 * - Real-time match event simulation
 * - Dynamic live commentary
 * - Live statistics tracking
 * - Score updates and match progression
 * - Engaging social media format
 * - Multi-language live updates
 */

import { unifiedFootballService } from './unified-football-service';
import { aiImageGenerator } from './ai-image-generator';
import { supabase } from '@/lib/supabase';

export type MatchEventType = 
  | 'goal' 
  | 'assist' 
  | 'yellow_card' 
  | 'red_card' 
  | 'substitution' 
  | 'penalty' 
  | 'penalty_miss' 
  | 'own_goal' 
  | 'corner' 
  | 'free_kick' 
  | 'offside' 
  | 'save' 
  | 'shot_blocked' 
  | 'half_time' 
  | 'full_time' 
  | 'injury_time' 
  | 'var_check' 
  | 'var_decision';

export interface MatchEvent {
  id: string;
  type: MatchEventType;
  minute: number;
  team: 'home' | 'away';
  player?: string;
  description: string;
  importance: 'HIGH' | 'MEDIUM' | 'LOW';
  impact: string; // How this affects the match
}

export interface LiveMatchStats {
  // Current score
  homeScore: number;
  awayScore: number;
  
  // Match time
  minute: number;
  period: 'first_half' | 'half_time' | 'second_half' | 'full_time' | 'extra_time';
  addedTime?: number;
  
  // Live statistics
  possession: { home: number; away: number };
  shots: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  corners: { home: number; away: number };
  fouls: { home: number; away: number };
  yellowCards: { home: number; away: number };
  redCards: { home: number; away: number };
  offsides: { home: number; away: number };
  
  // Recent events
  recentEvents: MatchEvent[];
  lastUpdate: string;
}

export interface LiveMatchData {
  // Basic match info
  homeTeam: string;
  awayTeam: string;
  competition: string;
  venue: string;
  kickoffTime: string;
  
  // Current state
  status: 'not_started' | 'live' | 'half_time' | 'finished' | 'postponed';
  currentStats: LiveMatchStats;
  
  // Match context
  matchImportance: 'HIGH' | 'MEDIUM' | 'LOW';
  preMatchInfo: {
    homeTeamForm: string;
    awayTeamForm: string;
    headToHeadRecord: string;
    keyPlayers: { home: string[]; away: string[] };
  };
}

export interface LiveUpdateRequest {
  language: 'en' | 'am' | 'sw';
  channelId: string;
  updateType?: 'score' | 'event' | 'stats' | 'commentary' | 'full_update';
  engagementLevel?: 'high' | 'medium' | 'low';
}

export interface GeneratedLiveUpdate {
  title: string;
  content: string;
  imageUrl?: string;
  matchData: LiveMatchData;
  updateType: string;
  aiEditedContent?: string;
  engagement: {
    emojis: string[];
    hashtags: string[];
    callToAction: string;
  };
  metadata: {
    language: string;
    generatedAt: string;
    contentId: string;
    matchMinute: number;
    eventImportance: string;
  };
}

export class LiveUpdatesGenerator {

  // Event probability weights for realistic simulation
  private readonly EVENT_PROBABILITIES = {
    goal: 0.08,          // ~2-3 goals per 90 minutes
    yellow_card: 0.12,   // ~4-5 cards per match
    red_card: 0.02,      // ~0.5 red cards per match
    corner: 0.25,        // ~8-10 corners per match
    substitution: 0.15,  // ~6 subs per match
    free_kick: 0.20,     // ~7-8 free kicks per match
    save: 0.18,          // ~6-7 saves per match
    shot_blocked: 0.15,  // ~5-6 blocked shots
    offside: 0.10,       // ~3-4 offsides per match
    var_check: 0.05,     // ~1-2 VAR checks per match
    penalty: 0.03        // ~0.8 penalties per match
  };

  /**
   * ⚡ MAIN FUNCTION - Generate live match update
   */
  async generateLiveUpdate(request: LiveUpdateRequest): Promise<GeneratedLiveUpdate | null> {
    console.log(`⚡ Generating live update in ${request.language}`);
    
    try {
      // Step 1: Get current live match or simulate one
      const liveMatch = await this.getCurrentLiveMatch(request.language);
      if (!liveMatch) {
        console.log(`❌ No live match available`);
        return null;
      }

      console.log(`✅ Live match: ${liveMatch.homeTeam} vs ${liveMatch.awayTeam} (${liveMatch.currentStats.minute}')`);

      // Step 2: Update match progression
      await this.updateMatchProgression(liveMatch);
      
      // Step 3: Generate specific update type
      const updateContent = await this.generateUpdateContent(liveMatch, request);
      
      // Step 4: Create engagement elements
      const engagement = this.createEngagementElements(liveMatch, request.language);
      
      // Step 5: Generate live update image
      const imageUrl = await this.generateLiveUpdateImage(liveMatch, updateContent.updateType);
      
      // Step 6: AI edit for excitement and engagement
      const aiEditedContent = await this.aiEditLiveContent(updateContent.content, liveMatch, request.language);
      
      // Step 7: Track live update
      await this.trackLiveUpdate(liveMatch, request.channelId);

      return {
        title: updateContent.title,
        content: updateContent.content,
        imageUrl,
        matchData: liveMatch,
        updateType: updateContent.updateType,
        aiEditedContent,
        engagement,
        metadata: {
          language: request.language,
          generatedAt: new Date().toISOString(),
          contentId: `live_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          matchMinute: liveMatch.currentStats.minute,
          eventImportance: updateContent.importance || 'MEDIUM'
        }
      };

    } catch (error) {
      console.error(`❌ Error generating live update:`, error);
      return null;
    }
  }

  /**
   * 🔴 Step 1: Get current live match (or create simulation)
   */
  private async getCurrentLiveMatch(language: 'en' | 'am' | 'sw'): Promise<LiveMatchData | null> {
    // In production, this would check for actual live matches from APIs
    // For now, we'll create a realistic simulation based on available matches
    
    const bestMatch = await unifiedFootballService.getBestMatchForContent('live_update', language);
    if (!bestMatch) return null;

    // Create live match simulation
    const liveMatch: LiveMatchData = {
      homeTeam: bestMatch.homeTeam.name,
      awayTeam: bestMatch.awayTeam.name,
      competition: bestMatch.competition.name,
      venue: `${bestMatch.homeTeam.name} Stadium`,
      kickoffTime: new Date().toISOString(),
      status: 'live',
      currentStats: this.initializeLiveStats(),
      matchImportance: this.determineMatchImportance(bestMatch.competition.name),
      preMatchInfo: {
        homeTeamForm: 'WWDLL',
        awayTeamForm: 'WLWWD',
        headToHeadRecord: 'Evenly matched in recent meetings',
        keyPlayers: {
          home: ['Star Striker', 'Creative Midfielder', 'Solid Defender'],
          away: ['Goal Machine', 'Playmaker', 'Rock at the Back']
        }
      }
    };

    return liveMatch;
  }

  /**
   * 📊 Initialize live match statistics
   */
  private initializeLiveStats(): LiveMatchStats {
    return {
      homeScore: 0,
      awayScore: 0,
      minute: Math.floor(Math.random() * 90) + 1, // Random current minute
      period: 'second_half',
      possession: { home: 50, away: 50 },
      shots: { home: 0, away: 0 },
      shotsOnTarget: { home: 0, away: 0 },
      corners: { home: 0, away: 0 },
      fouls: { home: 0, away: 0 },
      yellowCards: { home: 0, away: 0 },
      redCards: { home: 0, away: 0 },
      offsides: { home: 0, away: 0 },
      recentEvents: [],
      lastUpdate: new Date().toISOString()
    };
  }

  /**
   * ⏱️ Step 2: Update match progression with realistic events
   */
  private async updateMatchProgression(liveMatch: LiveMatchData): Promise<void> {
    const stats = liveMatch.currentStats;
    
    // Advance time slightly (1-3 minutes)
    stats.minute += Math.floor(Math.random() * 3) + 1;
    
    // Check for period changes
    if (stats.minute >= 45 && stats.period === 'first_half') {
      stats.period = 'half_time';
      stats.addedTime = Math.floor(Math.random() * 4) + 1;
    } else if (stats.minute >= 90 && stats.period === 'second_half') {
      stats.period = 'full_time';
    }

    // Generate realistic events based on current match state
    const newEvents = this.generateRealisticEvents(liveMatch);
    
    // Update statistics based on events
    this.updateStatsFromEvents(stats, newEvents);
    
    // Add events to recent events (keep last 5)
    stats.recentEvents = [...newEvents, ...stats.recentEvents].slice(0, 5);
    
    // Update possession (slight variation)
    this.updatePossession(stats);
    
    stats.lastUpdate = new Date().toISOString();
  }

  /**
   * 🎲 Generate realistic match events
   */
  private generateRealisticEvents(liveMatch: LiveMatchData): MatchEvent[] {
    const events: MatchEvent[] = [];
    const stats = liveMatch.currentStats;
    const minute = stats.minute;
    
    // Higher probability of events in certain minutes
    const eventProbabilityMultiplier = this.getEventProbabilityMultiplier(minute, stats.period);
    
    // Check each event type
    for (const [eventType, baseProbability] of Object.entries(this.EVENT_PROBABILITIES)) {
      const adjustedProbability = baseProbability * eventProbabilityMultiplier;
      
      if (Math.random() < adjustedProbability) {
        const event = this.createMatchEvent(
          eventType as MatchEventType, 
          minute, 
          liveMatch
        );
        
        if (event) {
          events.push(event);
        }
      }
    }

    return events;
  }

  /**
   * 📈 Get event probability multiplier based on match context
   */
  private getEventProbabilityMultiplier(minute: number, period: string): number {
    let multiplier = 1.0;
    
    // More events in final minutes
    if (minute > 85) multiplier *= 1.5;
    else if (minute > 70) multiplier *= 1.2;
    
    // More events in second half
    if (period === 'second_half') multiplier *= 1.1;
    
    // Fewer events during half time
    if (period === 'half_time') multiplier *= 0.1;
    
    return multiplier;
  }

  /**
   * ⚽ Create specific match event
   */
  private createMatchEvent(eventType: MatchEventType, minute: number, liveMatch: LiveMatchData): MatchEvent | null {
    const team = Math.random() < 0.5 ? 'home' : 'away';
    const teamName = team === 'home' ? liveMatch.homeTeam : liveMatch.awayTeam;
    
    const event: MatchEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type: eventType,
      minute,
      team,
      importance: this.getEventImportance(eventType),
      impact: '',
      description: '',
      player: this.getRandomPlayer(liveMatch, team)
    };

    // Generate specific event details
    switch (eventType) {
      case 'goal':
        event.description = `⚽ GOAL! ${teamName} takes the lead! ${event.player} finds the net with a brilliant finish!`;
        event.impact = `${teamName} now leads ${this.getUpdatedScore(liveMatch, team, 'goal')}`;
        event.importance = 'HIGH';
        break;
        
      case 'yellow_card':
        event.description = `🟨 Yellow card for ${event.player} (${teamName}) for a tactical foul`;
        event.impact = 'Player now on a booking - must be careful';
        break;
        
      case 'red_card':
        event.description = `🟥 RED CARD! ${event.player} is sent off! ${teamName} down to 10 men!`;
        event.impact = 'Major game changer - numerical disadvantage';
        event.importance = 'HIGH';
        break;
        
      case 'substitution':
        const newPlayer = this.getRandomPlayer(liveMatch, team);
        event.description = `🔄 Substitution: ${newPlayer} comes on for ${event.player} (${teamName})`;
        event.impact = 'Fresh legs introduced';
        break;
        
      case 'corner':
        event.description = `🚩 Corner kick for ${teamName} - good attacking opportunity`;
        event.impact = 'Set piece chance';
        break;
        
      case 'penalty':
        event.description = `🎯 PENALTY! ${teamName} awarded a spot kick! ${event.player} steps up...`;
        event.impact = 'Huge opportunity from 12 yards';
        event.importance = 'HIGH';
        break;
        
      case 'save':
        event.description = `🧤 Great save! The keeper denies ${event.player} with a fantastic stop`;
        event.impact = 'Crucial intervention keeps score level';
        break;
        
      case 'var_check':
        event.description = `📺 VAR check in progress - referee reviewing potential incident`;
        event.impact = 'Moment of tension as officials decide';
        event.importance = 'MEDIUM';
        break;
        
      default:
        return null;
    }

    return event;
  }

  /**
   * 📊 Update match statistics from events
   */
  private updateStatsFromEvents(stats: LiveMatchStats, events: MatchEvent[]): void {
    events.forEach(event => {
      const teamSide = event.team;
      
      switch (event.type) {
        case 'goal':
          if (teamSide === 'home') stats.homeScore++;
          else stats.awayScore++;
          stats.shots[teamSide]++;
          stats.shotsOnTarget[teamSide]++;
          break;
          
        case 'yellow_card':
          stats.yellowCards[teamSide]++;
          stats.fouls[teamSide]++;
          break;
          
        case 'red_card':
          stats.redCards[teamSide]++;
          stats.fouls[teamSide]++;
          break;
          
        case 'corner':
          stats.corners[teamSide]++;
          break;
          
        case 'save':
          const oppositeTeam = teamSide === 'home' ? 'away' : 'home';
          stats.shots[oppositeTeam]++;
          stats.shotsOnTarget[oppositeTeam]++;
          break;
          
        case 'shot_blocked':
          stats.shots[teamSide]++;
          break;
          
        case 'offside':
          stats.offsides[teamSide]++;
          break;
      }
    });
  }

  /**
   * ⚖️ Update possession based on match flow
   */
  private updatePossession(stats: LiveMatchStats): void {
    // Slight possession changes (±2-5%)
    const change = (Math.random() - 0.5) * 10; // -5 to +5
    
    stats.possession.home = Math.max(25, Math.min(75, stats.possession.home + change));
    stats.possession.away = 100 - stats.possession.home;
  }

  /**
   * 📝 Step 3: Generate update content based on type
   */
  private async generateUpdateContent(liveMatch: LiveMatchData, request: LiveUpdateRequest): Promise<{
    title: string;
    content: string;
    updateType: string;
    importance?: string;
  }> {
    const updateType = request.updateType || this.determineUpdateType(liveMatch);
    
    switch (updateType) {
      case 'score':
        return this.generateScoreUpdate(liveMatch, request.language);
      case 'event':
        return this.generateEventUpdate(liveMatch, request.language);
      case 'stats':
        return this.generateStatsUpdate(liveMatch, request.language);
      case 'commentary':
        return this.generateCommentaryUpdate(liveMatch, request.language);
      default:
        return this.generateFullUpdate(liveMatch, request.language);
    }
  }

  /**
   * ⚽ Generate score update
   */
  private generateScoreUpdate(liveMatch: LiveMatchData, language: 'en' | 'am' | 'sw'): {
    title: string;
    content: string;
    updateType: string;
    importance: string;
  } {
    const { homeTeam, awayTeam, currentStats } = liveMatch;
    const { homeScore, awayScore, minute, period } = currentStats;
    
    if (language === 'en') {
      const title = `⚽ LIVE: ${homeTeam} ${homeScore}-${awayScore} ${awayTeam}`;
      
      let content = `🔴 LIVE SCORE UPDATE\n\n`;
      content += `${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}\n`;
      content += `⏱️ ${minute}' (${this.getPeriodText(period)})\n\n`;
      
      // Add context based on score
      if (homeScore === awayScore) {
        content += `🤝 Level at ${liveMatch.venue}! Both teams fighting for the breakthrough.\n\n`;
      } else {
        const leader = homeScore > awayScore ? homeTeam : awayTeam;
        const scoreDiff = Math.abs(homeScore - awayScore);
        content += `🔥 ${leader} ${scoreDiff > 1 ? 'dominating' : 'leading'} in this thrilling encounter!\n\n`;
      }
      
      content += `📊 Match Stats:\n`;
      content += `• Possession: ${homeTeam} ${currentStats.possession.home}% - ${currentStats.possession.away}% ${awayTeam}\n`;
      content += `• Shots: ${currentStats.shots.home} - ${currentStats.shots.away}\n`;
      content += `• Corners: ${currentStats.corners.home} - ${currentStats.corners.away}\n\n`;
      
      content += `Stay tuned for more live updates! 📱`;
      
      return {
        title,
        content,
        updateType: 'score',
        importance: homeScore !== awayScore ? 'HIGH' : 'MEDIUM'
      };
    }
    
    // Simplified for other languages
    return {
      title: `⚽ ${homeTeam} ${homeScore}-${awayScore} ${awayTeam}`,
      content: `Live score update - ${minute}' minute`,
      updateType: 'score',
      importance: 'MEDIUM'
    };
  }

  /**
   * 🎯 Generate event update
   */
  private generateEventUpdate(liveMatch: LiveMatchData, language: 'en' | 'am' | 'sw'): {
    title: string;
    content: string;
    updateType: string;
    importance: string;
  } {
    const latestEvent = liveMatch.currentStats.recentEvents[0];
    
    if (!latestEvent) {
      return this.generateScoreUpdate(liveMatch, language);
    }
    
    if (language === 'en') {
      const title = `⚡ ${latestEvent.minute}' - ${latestEvent.description.split('!')[0]}!`;
      
      let content = `🔴 LIVE EVENT\n\n`;
      content += `${latestEvent.description}\n\n`;
      content += `⏱️ ${latestEvent.minute}' - ${latestEvent.impact}\n\n`;
      
      // Add current score
      content += `📊 Current Score:\n`;
      content += `${liveMatch.homeTeam} ${liveMatch.currentStats.homeScore} - ${liveMatch.currentStats.awayScore} ${liveMatch.awayTeam}\n\n`;
      
      // Add excitement based on event type
      if (latestEvent.type === 'goal') {
        content += `🔥 What a moment! The crowd erupts as the net bulges!\n\n`;
      } else if (latestEvent.type === 'red_card') {
        content += `😱 Game changer! This could turn the match on its head!\n\n`;
      } else if (latestEvent.type === 'penalty') {
        content += `🎯 High pressure moment from the penalty spot!\n\n`;
      }
      
      content += `Keep following for all the live action! ⚡`;
      
      return {
        title,
        content,
        updateType: 'event',
        importance: latestEvent.importance
      };
    }
    
    return {
      title: `⚡ ${latestEvent.minute}' - Event Update`,
      content: `Latest event: ${latestEvent.type}`,
      updateType: 'event',
      importance: latestEvent.importance
    };
  }

  /**
   * 📊 Generate statistics update
   */
  private generateStatsUpdate(liveMatch: LiveMatchData, language: 'en' | 'am' | 'sw'): {
    title: string;
    content: string;
    updateType: string;
    importance: string;
  } {
    const { homeTeam, awayTeam, currentStats } = liveMatch;
    
    if (language === 'en') {
      const title = `📊 ${currentStats.minute}' Stats Update`;
      
      let content = `📈 LIVE MATCH STATISTICS\n\n`;
      content += `${homeTeam} vs ${awayTeam} | ${currentStats.minute}'\n\n`;
      
      content += `⚽ Score: ${currentStats.homeScore} - ${currentStats.awayScore}\n\n`;
      
      content += `📊 Key Stats:\n`;
      content += `• Possession: ${currentStats.possession.home}% - ${currentStats.possession.away}%\n`;
      content += `• Total Shots: ${currentStats.shots.home} - ${currentStats.shots.away}\n`;
      content += `• Shots on Target: ${currentStats.shotsOnTarget.home} - ${currentStats.shotsOnTarget.away}\n`;
      content += `• Corners: ${currentStats.corners.home} - ${currentStats.corners.away}\n`;
      content += `• Fouls: ${currentStats.fouls.home} - ${currentStats.fouls.away}\n`;
      
      if (currentStats.yellowCards.home > 0 || currentStats.yellowCards.away > 0) {
        content += `• Yellow Cards: ${currentStats.yellowCards.home} - ${currentStats.yellowCards.away}\n`;
      }
      
      if (currentStats.redCards.home > 0 || currentStats.redCards.away > 0) {
        content += `• Red Cards: ${currentStats.redCards.home} - ${currentStats.redCards.away}\n`;
      }
      
      content += `\n📱 Stay tuned for more live updates!`;
      
      return {
        title,
        content,
        updateType: 'stats',
        importance: 'MEDIUM'
      };
    }
    
    return {
      title: `📊 ${currentStats.minute}' Statistics`,
      content: `Live statistics update`,
      updateType: 'stats',
      importance: 'MEDIUM'
    };
  }

  /**
   * 🎙️ Generate commentary update
   */
  private generateCommentaryUpdate(liveMatch: LiveMatchData, language: 'en' | 'am' | 'sw'): {
    title: string;
    content: string;
    updateType: string;
    importance: string;
  } {
    const { homeTeam, awayTeam, currentStats } = liveMatch;
    
    if (language === 'en') {
      const title = `🎙️ ${currentStats.minute}' Live Commentary`;
      
      let content = `🔴 LIVE COMMENTARY\n\n`;
      
      // Generate contextual commentary
      const commentary = this.generateContextualCommentary(liveMatch);
      content += `${commentary}\n\n`;
      
      content += `⚽ ${homeTeam} ${currentStats.homeScore} - ${currentStats.awayScore} ${awayTeam}\n`;
      content += `⏱️ ${currentStats.minute}' (${this.getPeriodText(currentStats.period)})\n\n`;
      
      // Add recent events context
      if (currentStats.recentEvents.length > 0) {
        content += `📝 Recent Action:\n`;
        currentStats.recentEvents.slice(0, 3).forEach(event => {
          content += `• ${event.minute}' - ${event.description.split('!')[0]}\n`;
        });
        content += `\n`;
      }
      
      content += `🔥 The intensity continues to build! Keep watching!`;
      
      return {
        title,
        content,
        updateType: 'commentary',
        importance: 'MEDIUM'
      };
    }
    
    return {
      title: `🎙️ ${currentStats.minute}' Commentary`,
      content: `Live match commentary`,
      updateType: 'commentary',
      importance: 'MEDIUM'
    };
  }

  /**
   * 📰 Generate full update
   */
  private generateFullUpdate(liveMatch: LiveMatchData, language: 'en' | 'am' | 'sw'): {
    title: string;
    content: string;
    updateType: string;
    importance: string;
  } {
    if (language === 'en') {
      const { homeTeam, awayTeam, currentStats } = liveMatch;
      const title = `🔴 LIVE: ${homeTeam} vs ${awayTeam} - Full Update`;
      
      let content = `🔴 LIVE MATCH UPDATE\n\n`;
      content += `${homeTeam} ${currentStats.homeScore} - ${currentStats.awayScore} ${awayTeam}\n`;
      content += `📍 ${liveMatch.venue} | ⏱️ ${currentStats.minute}'\n\n`;
      
      // Match context
      content += `🏆 ${liveMatch.competition}\n`;
      content += `🔥 ${liveMatch.matchImportance} importance encounter\n\n`;
      
      // Latest events
      if (currentStats.recentEvents.length > 0) {
        content += `⚡ Latest Events:\n`;
        currentStats.recentEvents.slice(0, 2).forEach(event => {
          content += `• ${event.minute}' - ${event.description}\n`;
        });
        content += `\n`;
      }
      
      // Key stats
      content += `📊 Match Stats:\n`;
      content += `• Possession: ${currentStats.possession.home}% - ${currentStats.possession.away}%\n`;
      content += `• Shots: ${currentStats.shots.home} - ${currentStats.shots.away}\n`;
      content += `• Corners: ${currentStats.corners.home} - ${currentStats.corners.away}\n\n`;
      
      // Commentary
      const commentary = this.generateContextualCommentary(liveMatch);
      content += `🎙️ ${commentary}\n\n`;
      
      content += `📱 Keep following for all live updates!`;
      
      return {
        title,
        content,
        updateType: 'full_update',
        importance: 'HIGH'
      };
    }
    
    return {
      title: `🔴 ${liveMatch.homeTeam} vs ${liveMatch.awayTeam}`,
      content: `Live match update`,
      updateType: 'full_update',
      importance: 'MEDIUM'
    };
  }

  /**
   * 🎙️ Generate contextual commentary
   */
  private generateContextualCommentary(liveMatch: LiveMatchData): string {
    const { homeTeam, awayTeam, currentStats } = liveMatch;
    const minute = currentStats.minute;
    const score = `${currentStats.homeScore}-${currentStats.awayScore}`;
    
    const commentaries = [
      `Both teams are giving everything in this intense ${minute}-minute battle!`,
      `The pace is relentless as ${homeTeam} and ${awayTeam} trade attacks!`,
      `What a match we have on our hands! ${score} and still so much to play for!`,
      `The crowd is on their feet as the intensity reaches fever pitch!`,
      `Every pass, every tackle matters in this crucial encounter!`,
      `${homeTeam} pushing forward while ${awayTeam} looks dangerous on the counter!`,
      `The atmosphere is electric as both teams refuse to give an inch!`,
      `This is why we love football - pure drama and excitement!`
    ];
    
    // Add score-specific commentary
    if (currentStats.homeScore === currentStats.awayScore) {
      commentaries.push(`It's all square at ${score} - who will find the breakthrough?`);
      commentaries.push(`Level pegging at ${score} - this match could go either way!`);
    } else {
      const leader = currentStats.homeScore > currentStats.awayScore ? homeTeam : awayTeam;
      const trailer = currentStats.homeScore > currentStats.awayScore ? awayTeam : homeTeam;
      commentaries.push(`${leader} holding the advantage but ${trailer} won't give up!`);
      commentaries.push(`${leader} looking confident while ${trailer} searches for an equalizer!`);
    }
    
    return commentaries[Math.floor(Math.random() * commentaries.length)];
  }

  /**
   * 🎭 Step 4: Create engagement elements
   */
  private createEngagementElements(liveMatch: LiveMatchData, language: 'en' | 'am' | 'sw'): {
    emojis: string[];
    hashtags: string[];
    callToAction: string;
  } {
    const emojis = ['⚽', '🔥', '⚡', '🚀', '💥', '🎯', '🔴', '📱'];
    
    const hashtags = [
      '#LiveFootball',
      '#MatchDay',
      `#${liveMatch.homeTeam.replace(/\s+/g, '')}`,
      `#${liveMatch.awayTeam.replace(/\s+/g, '')}`,
      `#${liveMatch.competition.replace(/\s+/g, '')}`,
      '#Football',
      '#LiveUpdate'
    ];
    
    const callToActions = {
      en: [
        'Stay tuned for more live updates! ⚡',
        'What do you think happens next? 🤔',
        'Keep following the action! 📱',
        'This match is getting intense! 🔥',
        'Who do you think will score next? ⚽'
      ],
      am: [
        'ለተጨማሪ ቀጥታ ዝማኔዎች ይከታተሉ! ⚡',
        'ወዲያው ምን እንደሚሆን ይከታተሉ! 📱'
      ],
      sw: [
        'Endelea kufuata matukio ya moja kwa moja! ⚡',
        'Fuatilia mchezo huu wa kusisimua! 📱'
      ]
    };
    
    return {
      emojis,
      hashtags,
      callToAction: callToActions[language][Math.floor(Math.random() * callToActions[language].length)]
    };
  }

  /**
   * 🖼️ Generate live update image
   */
  private async generateLiveUpdateImage(liveMatch: LiveMatchData, updateType: string): Promise<string | undefined> {
    const { homeTeam, awayTeam, competition, currentStats } = liveMatch;
    
    const prompt = `Live football match graphics: ${homeTeam} vs ${awayTeam} in ${competition}.
    Real-time score display showing ${currentStats.homeScore}-${currentStats.awayScore}, minute ${currentStats.minute},
    live broadcast graphics style, dynamic sports design, live TV aesthetic, exciting match moment,
    team colors, modern live sports graphics, high energy design, professional broadcast quality.`;

    try {
      const imageBuffer = await aiImageGenerator.generateImage(prompt);
      if (!imageBuffer) return undefined;

      const fileName = `live_update_${Date.now()}.png`;
      const { data, error } = await supabase.storage
        .from('content-images')
        .upload(fileName, imageBuffer, {
          contentType: 'image/png',
          cacheControl: '3600'
        });

      if (error) {
        console.error(`❌ Error uploading live update image:`, error);
        return undefined;
      }

      const { data: urlData } = supabase.storage
        .from('content-images')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error(`❌ Error generating live update image:`, error);
      return undefined;
    }
  }

  /**
   * 🤖 AI edit live content for excitement
   */
  private async aiEditLiveContent(content: string, liveMatch: LiveMatchData, language: 'en' | 'am' | 'sw'): Promise<string> {
    // Enhanced version with more excitement and engagement
    const enhanced = `${content}\n\n🔥 The drama continues! This is football at its finest!\n\n#LiveFootball #${liveMatch.homeTeam.replace(/\s+/g, '')}vs${liveMatch.awayTeam.replace(/\s+/g, '')} #MatchDay`;
    
    return enhanced;
  }

  /**
   * 📊 Track live update usage
   */
  private async trackLiveUpdate(liveMatch: LiveMatchData, channelId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('content_uniqueness')
        .insert({
          content_id: `${liveMatch.homeTeam}_${liveMatch.awayTeam}_live_${liveMatch.currentStats.minute}`,
          channel_id: channelId,
          content_type: 'live_update',
          used_at: new Date().toISOString(),
          variation_token: `LIVE_${Date.now()}_${liveMatch.currentStats.minute}`
        });

      if (error) {
        console.error(`❌ Error tracking live update:`, error);
      }
    } catch (error) {
      console.error(`❌ Error in trackLiveUpdate:`, error);
    }
  }

  // Helper methods
  private determineMatchImportance(competition: string): 'HIGH' | 'MEDIUM' | 'LOW' {
    const highImportance = ['Premier League', 'Champions League', 'Europa League', 'World Cup'];
    return highImportance.some(comp => competition.includes(comp)) ? 'HIGH' : 'MEDIUM';
  }

  private determineUpdateType(liveMatch: LiveMatchData): string {
    const recentEvents = liveMatch.currentStats.recentEvents;
    
    if (recentEvents.length > 0) {
      const latestEvent = recentEvents[0];
      if (latestEvent.importance === 'HIGH') return 'event';
    }
    
    // Random choice for variety
    const types = ['score', 'stats', 'commentary', 'full_update'];
    return types[Math.floor(Math.random() * types.length)];
  }

  private getEventImportance(eventType: MatchEventType): 'HIGH' | 'MEDIUM' | 'LOW' {
    const highImportance: MatchEventType[] = ['goal', 'red_card', 'penalty', 'penalty_miss', 'own_goal'];
    const mediumImportance: MatchEventType[] = ['yellow_card', 'substitution', 'var_check', 'var_decision'];
    
    if (highImportance.includes(eventType)) return 'HIGH';
    if (mediumImportance.includes(eventType)) return 'MEDIUM';
    return 'LOW';
  }

  private getRandomPlayer(liveMatch: LiveMatchData, team: 'home' | 'away'): string {
    const players = team === 'home' 
      ? liveMatch.preMatchInfo.keyPlayers.home 
      : liveMatch.preMatchInfo.keyPlayers.away;
    
    return players[Math.floor(Math.random() * players.length)];
  }

  private getUpdatedScore(liveMatch: LiveMatchData, scoringTeam: 'home' | 'away', eventType: string): string {
    const currentHome = liveMatch.currentStats.homeScore;
    const currentAway = liveMatch.currentStats.awayScore;
    
    if (eventType === 'goal') {
      if (scoringTeam === 'home') {
        return `${currentHome + 1}-${currentAway}`;
      } else {
        return `${currentHome}-${currentAway + 1}`;
      }
    }
    
    return `${currentHome}-${currentAway}`;
  }

  private getPeriodText(period: string): string {
    switch (period) {
      case 'first_half': return '1st Half';
      case 'half_time': return 'Half Time';
      case 'second_half': return '2nd Half';
      case 'full_time': return 'Full Time';
      case 'extra_time': return 'Extra Time';
      default: return 'Live';
    }
  }

  /**
   * 🎯 Get multiple live updates for active matches
   */
  async getActiveLiveUpdates(language: 'en' | 'am' | 'sw' = 'en', limit: number = 3): Promise<GeneratedLiveUpdate[]> {
    const updates: GeneratedLiveUpdate[] = [];
    
    try {
      for (let i = 0; i < limit; i++) {
        const update = await this.generateLiveUpdate({
          language,
          channelId: `demo_channel_${i}`,
          updateType: 'full_update'
        });
        
        if (update) {
          updates.push(update);
        }
      }
    } catch (error) {
      console.error(`❌ Error getting active live updates:`, error);
    }
    
    return updates;
  }

  /**
   * 📈 Get live update statistics
   */
  async getLiveUpdateStats(): Promise<{
    totalUpdates: number;
    averageEventsPerMatch: number;
    mostCommonEvents: string[];
    averageMinute: number;
  }> {
    // This would connect to database for actual stats
    return {
      totalUpdates: 0,
      averageEventsPerMatch: 0,
      mostCommonEvents: ['goal', 'yellow_card', 'corner'],
      averageMinute: 45
    };
  }
}

// Export singleton instance
export const liveUpdatesGenerator = new LiveUpdatesGenerator();