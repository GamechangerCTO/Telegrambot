/**
 * 💾 FOOTBALL CACHE MANAGER
 * Professional caching system for team research data
 */

import { TeamResearch } from '../types/football-types';

export class FootballCacheManager {
  private cache: Map<string, TeamResearch> = new Map();
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  constructor() {
    console.log('💾 Football Cache Manager initialized');
    // Clear cache on startup for testing new systems
    this.cache.clear();
  }

  /**
   * Get cached team research
   */
  get(teamName: string, teamId?: string): TeamResearch | null {
    const cacheKey = this.getCacheKey(teamName, teamId);
    const cached = this.cache.get(cacheKey);
    
    if (cached && cached.lastUpdated && Date.now() - cached.lastUpdated < this.CACHE_DURATION) {
      console.log(`💾 Using cached data for ${teamName}`);
      return cached;
    }
    
    return null;
  }

  /**
   * Set team research in cache
   */
  set(teamName: string, research: TeamResearch, teamId?: string): void {
    const cacheKey = this.getCacheKey(teamName, teamId);
    research.lastUpdated = Date.now();
    this.cache.set(cacheKey, research);
    console.log(`💾 Cached data for ${teamName}`);
  }

  /**
   * Clear specific team from cache
   */
  delete(teamName: string, teamId?: string): void {
    const cacheKey = this.getCacheKey(teamName, teamId);
    this.cache.delete(cacheKey);
    console.log(`🗑️ Cleared cache for ${teamName}`);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    console.log('🧹 All cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Generate cache key
   */
  private getCacheKey(teamName: string, teamId?: string): string {
    return teamId ? `team_${teamName}_${teamId}` : `team_${teamName}`;
  }

  /**
   * Clean expired entries
   */
  cleanExpired(): number {
    let cleaned = 0;
    const now = Date.now();
    
    for (const [key, research] of this.cache.entries()) {
      if (research.lastUpdated && now - research.lastUpdated > this.CACHE_DURATION) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
    }
    
    return cleaned;
  }
} 