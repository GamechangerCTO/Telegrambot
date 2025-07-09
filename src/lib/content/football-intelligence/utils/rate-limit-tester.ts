/**
 * 🧪 RATE LIMIT TESTER
 * Utility to test and demonstrate the improved rate limiting system
 */

import { FootballDataAPI } from '../api/football-data-api';
import { rateLimiter } from './rate-limiter';
import { apiCoordinator } from './api-coordinator';
import { apiRequestQueue } from './api-request-queue';

export class RateLimitTester {
  private footballDataAPI?: FootballDataAPI;

  constructor() {
    const apiKey = process.env.FOOTBALL_DATA_API_KEY;
    if (apiKey) {
      this.footballDataAPI = new FootballDataAPI(apiKey);
    }
  }

  /**
   * Test improved rate limiting with team searches
   */
  async testTeamSearches(teamNames: string[]): Promise<void> {
    if (!this.footballDataAPI) {
      console.log('❌ No Football-Data API key available for testing');
      return;
    }

    console.log(`🧪 Testing improved rate limiting with ${teamNames.length} team searches`);
    console.log('📊 Initial rate limiter status:', rateLimiter.getAllStatus());

    const startTime = Date.now();
    const results: any[] = [];

    // Test sequential team searches with new system
    for (const teamName of teamNames) {
      try {
        console.log(`\n🔍 Searching for: ${teamName}`);
        const result = await this.footballDataAPI.searchTeam(teamName);
        results.push({ teamName, result, success: !!result });
        
        // Show coordinator status
        const status = apiCoordinator.getStatus();
        console.log(`📊 Queue status: ${status.queueStatus.totalQueued} queued, ${status.ongoingRequests} ongoing`);
        
      } catch (error) {
        console.error(`❌ Search failed for ${teamName}:`, error);
        results.push({ teamName, result: null, success: false, error: error.message });
      }
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log(`\n📊 Test Results Summary:`);
    console.log(`⏱️ Total time: ${duration.toFixed(2)}s`);
    console.log(`✅ Successful searches: ${results.filter(r => r.success).length}/${results.length}`);
    console.log(`❌ Failed searches: ${results.filter(r => !r.success).length}/${results.length}`);
    console.log(`📈 Average time per search: ${(duration / teamNames.length).toFixed(2)}s`);
    
    // Show final rate limiter status
    console.log('\n📊 Final rate limiter status:', rateLimiter.getAllStatus());
    console.log('📊 Final coordinator status:', apiCoordinator.getStatus());
  }

  /**
   * Demonstrate the difference between old and new approaches
   */
  async demonstrateImprovement(): Promise<void> {
    console.log('\n🎯 Demonstrating Rate Limiting Improvements\n');
    
    console.log('🔧 Key improvements implemented:');
    console.log('1. ✅ Request queue system to coordinate API calls');
    console.log('2. ✅ Rate limiter enforcement at API level');
    console.log('3. ✅ Sequential team searches instead of parallel');
    console.log('4. ✅ Request deduplication to prevent duplicate calls');
    console.log('5. ✅ Proper backoff and retry mechanisms');
    console.log('6. ✅ Priority-based request handling');

    console.log('\n📊 Before improvements:');
    console.log('❌ Multiple parallel requests to same API');
    console.log('❌ No coordination between requests');
    console.log('❌ Rate limiter not enforced at API level');
    console.log('❌ No request queuing or prioritization');

    console.log('\n📊 After improvements:');
    console.log('✅ Coordinated sequential requests');
    console.log('✅ Request queue with priority handling');
    console.log('✅ Rate limiter enforced before every request');
    console.log('✅ Proper error handling and backoff');

    // Test with a few team names
    const testTeams = ['Real Madrid', 'Barcelona', 'Manchester City'];
    await this.testTeamSearches(testTeams);
  }

  /**
   * Monitor rate limiting in real-time
   */
  startRateLimitMonitoring(): NodeJS.Timeout {
    console.log('📊 Starting rate limit monitoring...');
    
    return setInterval(() => {
      const rateLimitStatus = rateLimiter.getAllStatus();
      const coordinatorStatus = apiCoordinator.getStatus();
      const queueStatus = apiRequestQueue.getQueueStatus();

      console.log('\n📊 Rate Limit Monitor:');
      console.log(`🔄 Queued requests: ${queueStatus.totalQueued}`);
      console.log(`⚡ Ongoing requests: ${coordinatorStatus.ongoingRequests}`);
      
      Object.entries(rateLimitStatus).forEach(([api, status]) => {
        const emoji = status.available ? '✅' : '⏳';
        console.log(`${emoji} ${api}: ${status.requestsThisMinute}/min, ${status.errorCount} errors`);
      });
    }, 5000); // Every 5 seconds
  }

  /**
   * Reset all rate limiting state
   */
  resetRateLimiting(): void {
    console.log('🔄 Resetting rate limiting state...');
    
    // Reset rate limiter
    ['football-data', 'football-data-org', 'api-football', 'apifootball', 'thesportsdb'].forEach(api => {
      rateLimiter.resetBackoff(api);
    });

    // Clear coordinator state
    apiCoordinator.clearOngoingRequests();

    // Clear queue
    apiRequestQueue.clearQueue();

    console.log('✅ Rate limiting state reset complete');
  }
}

// Export singleton instance
export const rateLimitTester = new RateLimitTester();