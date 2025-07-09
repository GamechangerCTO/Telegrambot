/**
 * 🧮 PROBABILITY CALCULATOR
 * Advanced probability calculation using professional formulas
 */

import { TeamResearch, Probabilities, HeadToHeadData } from '../types/football-types';

export class ProbabilityCalculator {

  /**
   * Calculate advanced probabilities using professional formula
   * Formula: Win Chance = (0.4 × H2H Win%) + (0.4 × Last 5 Games Win%) + (0.2 × Additional Factors)
   */
  static calculateAdvancedProbabilities(
    homeTeam: TeamResearch,
    awayTeam: TeamResearch,
    headToHead?: HeadToHeadData
  ): Probabilities {
    console.log(`🧮 Calculating probabilities using professional formula: ${homeTeam.teamName} vs ${awayTeam.teamName}`);
    
    // 📊 Component 1: Head-to-Head Record (40% weight)
    let homeH2HRate = 0.33; // Default if no H2H data
    let awayH2HRate = 0.33;
    
    if (headToHead && headToHead.totalMeetings > 0) {
      homeH2HRate = headToHead.homeWins / headToHead.totalMeetings;
      awayH2HRate = headToHead.awayWins / headToHead.totalMeetings;
      console.log(`📈 H2H Data: Home ${Math.round(homeH2HRate * 100)}% vs Away ${Math.round(awayH2HRate * 100)}% (${headToHead.totalMeetings} meetings)`);
    } else {
      console.log(`⚠️ No H2H data available, using default 33% for both teams`);
    }
    
    // 📊 Component 2: Last 5 Games Win Rate (40% weight)
    const homeLast5Rate = homeTeam.seasonStats.played >= 5 
      ? homeTeam.seasonStats.wins / Math.min(homeTeam.seasonStats.played, 5)
      : homeTeam.seasonStats.played > 0 
        ? homeTeam.seasonStats.wins / homeTeam.seasonStats.played 
        : 0.33;
    
    const awayLast5Rate = awayTeam.seasonStats.played >= 5 
      ? awayTeam.seasonStats.wins / Math.min(awayTeam.seasonStats.played, 5)
      : awayTeam.seasonStats.played > 0 
        ? awayTeam.seasonStats.wins / awayTeam.seasonStats.played 
        : 0.33;
    
    console.log(`📈 Last 5 Form: Home ${Math.round(homeLast5Rate * 100)}% vs Away ${Math.round(awayLast5Rate * 100)}%`);
    
    // 📊 Component 3: Additional Factors (20% weight)
    const additionalFactors = this.calculateAdditionalFactors(homeTeam, awayTeam);
    
    console.log(`🏠 Additional Factors: Home +${Math.round(additionalFactors.home * 100)}% vs Away ${Math.round(additionalFactors.away * 100)}%`);
    
    // 🎯 APPLY PROFESSIONAL FORMULA
    const homeWinChance = (0.4 * homeH2HRate) + (0.4 * homeLast5Rate) + (0.2 * additionalFactors.home);
    const awayWinChance = (0.4 * awayH2HRate) + (0.4 * awayLast5Rate) + (0.2 * additionalFactors.away);
    
    // Calculate draw probability (remaining probability)
    const drawChanceBase = 0.25; // Base 25% draw chance
    const totalWinChances = homeWinChance + awayWinChance;
    const drawChance = Math.max(0.15, Math.min(0.35, drawChanceBase + (0.5 - totalWinChances / 2)));
    
    // Normalize to 100% 
    const totalRaw = homeWinChance + awayWinChance + drawChance;
    const homeWin = Math.round((homeWinChance / totalRaw) * 100);
    const awayWin = Math.round((awayWinChance / totalRaw) * 100);
    const draw = 100 - homeWin - awayWin;
    
    console.log(`🎯 PROFESSIONAL FORMULA RESULTS:`);
    console.log(`📊 Home Raw Calc: (0.4 × ${Math.round(homeH2HRate*100)}%) + (0.4 × ${Math.round(homeLast5Rate*100)}%) + (0.2 × ${Math.round(additionalFactors.home*100)}%) = ${Math.round(homeWinChance*100)}%`);
    console.log(`📊 Away Raw Calc: (0.4 × ${Math.round(awayH2HRate*100)}%) + (0.4 × ${Math.round(awayLast5Rate*100)}%) + (0.2 × ${Math.round(additionalFactors.away*100)}%) = ${Math.round(awayWinChance*100)}%`);
    console.log(`📊 Draw Calc: Base 25% + Adjustment = ${Math.round(drawChance*100)}%`);
    console.log(`🎯 FINAL (After Normalization): Home ${homeWin}% | Draw ${draw}% | Away ${awayWin}%`);

    return {
      homeWin,
      draw,
      awayWin
    };
  }

  /**
   * Calculate additional factors (home advantage, form, etc.)
   */
  private static calculateAdditionalFactors(homeTeam: TeamResearch, awayTeam: TeamResearch): { home: number; away: number } {
    // Home Advantage
    const homeAdvantageBonus = 0.08; // 8% home advantage
    const awayDisadvantage = -0.03; // 3% away disadvantage
    
    // Match Importance (Cup finals, derbies, etc.)
    const matchImportanceBonus = 0.05; // 5% for important matches
    
    // Squad Load/Fatigue (European competitions, etc.)
    const fatigueFactorHome = -0.03; // Assume slight fatigue for both
    const fatigueFactorAway = -0.03;
    
    // Form factor based on recent performance
    const homeFormBonus = this.getFormBonus(homeTeam.recentForm.last5Performance);
    const awayFormBonus = this.getFormBonus(awayTeam.recentForm.last5Performance);
    
    // Calculate Additional Factors
    const homeAdditionalFactors = homeAdvantageBonus + matchImportanceBonus + fatigueFactorHome + homeFormBonus;
    const awayAdditionalFactors = awayDisadvantage + fatigueFactorAway + awayFormBonus;
    
    return {
      home: homeAdditionalFactors,
      away: awayAdditionalFactors
    };
  }

  /**
   * Get form bonus based on recent performance
   */
  private static getFormBonus(performance: number): number {
    if (performance >= 80) return 0.05; // Excellent form
    if (performance >= 60) return 0.02; // Good form
    if (performance >= 40) return 0.00; // Average form
    return -0.03; // Poor form
  }

  /**
   * Calculate goal-based probabilities
   */
  static calculateGoalProbabilities(homeTeam: TeamResearch, awayTeam: TeamResearch): {
    bothTeamsScore: number;
    over25Goals: number;
    under25Goals: number;
  } {
    // Prevent division by zero
    const homePlayed = Math.max(homeTeam.seasonStats.played, 1);
    const awayPlayed = Math.max(awayTeam.seasonStats.played, 1);
    
    // Calculate attack/defense ratios
    const homeAttackRatio = homeTeam.seasonStats.goalsFor / homePlayed;
    const homeDefenseRatio = homeTeam.seasonStats.goalsAgainst / homePlayed;
    const awayAttackRatio = awayTeam.seasonStats.goalsFor / awayPlayed;
    const awayDefenseRatio = awayTeam.seasonStats.goalsAgainst / awayPlayed;

    // Expected goals calculation
    const expectedHomeGoals = homeAttackRatio * (2 - Math.min(awayDefenseRatio / 1.5, 1));
    const expectedAwayGoals = awayAttackRatio * (2 - Math.min(homeDefenseRatio / 1.5, 1));
    const totalExpectedGoals = expectedHomeGoals + expectedAwayGoals;

    // Goal probabilities based on simplified Poisson
    const over25Prob = totalExpectedGoals > 2.3 ? 
      Math.min(0.8, 0.4 + (totalExpectedGoals - 2.3) * 0.15) : 
      Math.max(0.25, 0.4 - (2.3 - totalExpectedGoals) * 0.1);

    const bothTeamsScoreProb = 
      (homeAttackRatio > 0.8 && awayAttackRatio > 0.8) ? 
      Math.min(0.85, 0.5 + (homeAttackRatio + awayAttackRatio - 1.6) * 0.2) :
      Math.max(0.35, 0.5 - Math.abs(1.6 - homeAttackRatio - awayAttackRatio) * 0.1);

    return {
      bothTeamsScore: Math.round(bothTeamsScoreProb * 100),
      over25Goals: Math.round(over25Prob * 100),
      under25Goals: Math.round((1 - over25Prob) * 100)
    };
  }

  /**
   * Calculate confidence level based on data quality
   */
  static calculateConfidence(homeTeam: TeamResearch, awayTeam: TeamResearch, headToHead?: HeadToHeadData): number {
    let confidence = 50; // Base confidence
    
    // Add confidence based on data availability
    if (homeTeam.seasonStats.played > 10) confidence += 10;
    if (awayTeam.seasonStats.played > 10) confidence += 10;
    if (homeTeam.teamId && awayTeam.teamId) confidence += 20;
    if (homeTeam.recentForm.last5Games !== 'N/A') confidence += 10;
    if (headToHead && headToHead.totalMeetings > 3) confidence += 15;
    
    return Math.min(confidence, 95); // Max 95% confidence
  }

  /**
   * Assess risk level based on probabilities
   */
  static assessRiskLevel(probabilities: Probabilities): 'LOW' | 'MEDIUM' | 'HIGH' {
    const maxProb = Math.max(probabilities.homeWin, probabilities.draw, probabilities.awayWin);
    
    if (maxProb > 60) return 'LOW';
    if (maxProb > 45) return 'MEDIUM';
    return 'HIGH';
  }

  /**
   * Validate probabilities are realistic
   */
  static validateProbabilities(probabilities: Probabilities): Probabilities {
    // Check for NaN values
    const homeWin = isNaN(probabilities.homeWin) ? 33 : probabilities.homeWin;
    const draw = isNaN(probabilities.draw) ? 33 : probabilities.draw;
    const awayWin = isNaN(probabilities.awayWin) ? 33 : probabilities.awayWin;
    
    // Ensure realistic ranges (10%-80%)
    const normalizedHomeWin = Math.max(10, Math.min(80, homeWin));
    const normalizedAwayWin = Math.max(10, Math.min(80, awayWin));
    const normalizedDraw = Math.max(10, Math.min(50, draw));
    
    // Normalize to 100%
    const total = normalizedHomeWin + normalizedDraw + normalizedAwayWin;
    
    return {
      homeWin: Math.round((normalizedHomeWin / total) * 100),
      draw: Math.round((normalizedDraw / total) * 100),
      awayWin: Math.round((normalizedAwayWin / total) * 100)
    };
  }
} 