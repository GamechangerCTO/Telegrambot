/**
 * 🕐 INTELLIGENT WAITER
 * Smart waiting system that waits for rate limits instead of blocking APIs
 */

import { rateLimiter } from './rate-limiter';

export class IntelligentWaiter {
  private maxWaitTime = 30000; // Maximum 30 seconds wait
  private checkInterval = 1000;  // Check every 1 second

  /**
   * Wait intelligently for API to become available
   */
  async waitForAPI(apiName: string, timeout: number = this.maxWaitTime): Promise<boolean> {
    const startTime = Date.now();
    let attempts = 0;
    
    console.log(`⏳ Intelligent waiting for ${apiName} API (max ${timeout/1000}s)`);

    while (Date.now() - startTime < timeout) {
      attempts++;
      
      // Check if API is now available
      const canRequest = await rateLimiter.canMakeRequest(apiName);
      if (canRequest) {
        console.log(`✅ ${apiName} API available after ${attempts} checks (${((Date.now() - startTime)/1000).toFixed(1)}s)`);
        return true;
      }

      // Get specific reason for waiting
      const status = rateLimiter.getAPIStatus(apiName);
      const timeRemaining = timeout - (Date.now() - startTime);
      
      if (status.backoffUntil > Date.now()) {
        const backoffTime = Math.ceil((status.backoffUntil - Date.now()) / 1000);
        console.log(`⏳ ${apiName} in backoff, waiting ${backoffTime}s more (attempt ${attempts})`);
      } else if (status.requestsThisMinute >= status.available) {
        console.log(`⏳ ${apiName} rate limited, waiting for minute reset (attempt ${attempts})`);
      } else {
        console.log(`⏳ ${apiName} waiting for general availability (attempt ${attempts})`);
      }

      // Wait before next check
      await this.sleep(Math.min(this.checkInterval, timeRemaining));
    }

    console.log(`⏰ ${apiName} wait timeout after ${timeout/1000}s`);
    return false;
  }

  /**
   * Wait for any of multiple APIs to become available
   */
  async waitForAnyAPI(apiNames: string[], timeout: number = this.maxWaitTime): Promise<string | null> {
    const startTime = Date.now();
    let attempts = 0;
    
    console.log(`⏳ Intelligent waiting for any API: ${apiNames.join(', ')} (max ${timeout/1000}s)`);

    while (Date.now() - startTime < timeout) {
      attempts++;
      
      // Check each API
      for (const apiName of apiNames) {
        const canRequest = await rateLimiter.canMakeRequest(apiName);
        if (canRequest) {
          console.log(`✅ ${apiName} API available after ${attempts} checks (${((Date.now() - startTime)/1000).toFixed(1)}s)`);
          return apiName;
        }
      }

      // Log status of all APIs
      if (attempts % 5 === 0) { // Every 5 attempts
        console.log(`⏳ Attempt ${attempts}: Checking ${apiNames.length} APIs...`);
        apiNames.forEach(apiName => {
          const status = rateLimiter.getAPIStatus(apiName);
          if (status.backoffUntil > Date.now()) {
            const backoffTime = Math.ceil((status.backoffUntil - Date.now()) / 1000);
            console.log(`  - ${apiName}: in backoff for ${backoffTime}s`);
          } else {
            console.log(`  - ${apiName}: ${status.requestsThisMinute} requests this minute`);
          }
        });
      }

      // Wait before next check
      const timeRemaining = timeout - (Date.now() - startTime);
      await this.sleep(Math.min(this.checkInterval, timeRemaining));
    }

    console.log(`⏰ No APIs became available within ${timeout/1000}s`);
    return null;
  }

  /**
   * Intelligent wait with exponential backoff
   */
  async waitWithBackoff(apiName: string, maxRetries: number = 5): Promise<boolean> {
    for (let retry = 0; retry < maxRetries; retry++) {
      const canRequest = await rateLimiter.canMakeRequest(apiName);
      if (canRequest) {
        if (retry > 0) {
          console.log(`✅ ${apiName} API available after ${retry} retries`);
        }
        return true;
      }

      // Exponential backoff: 2^retry seconds, but cap at 30 seconds
      const waitTime = Math.min(Math.pow(2, retry) * 1000, 30000);
      console.log(`⏳ ${apiName} retry ${retry + 1}/${maxRetries}, waiting ${waitTime/1000}s`);
      
      await this.sleep(waitTime);
    }

    console.log(`❌ ${apiName} still unavailable after ${maxRetries} retries`);
    return false;
  }

  /**
   * Smart wait based on API status
   */
  async smartWait(apiName: string): Promise<boolean> {
    const status = rateLimiter.getAPIStatus(apiName);
    
    // If API is available, return immediately
    if (status.available) {
      return true;
    }

    // Calculate optimal wait time
    let waitTime = 1000; // Default 1 second

    if (status.backoffUntil > Date.now()) {
      // Wait for backoff to end
      waitTime = status.backoffUntil - Date.now() + 500; // Add 500ms buffer
      console.log(`⏳ ${apiName} smart wait: backoff ends in ${waitTime/1000}s`);
    } else if (status.requestsThisMinute > 0) {
      // Wait based on rate limit reset
      const timeToReset = 60000 - (Date.now() % 60000); // Time until next minute
      waitTime = Math.min(timeToReset + 1000, 15000); // Max 15 seconds
      console.log(`⏳ ${apiName} smart wait: rate limit resets in ${waitTime/1000}s`);
    }

    // Cap wait time
    waitTime = Math.min(waitTime, 30000);
    
    if (waitTime > 1000) {
      console.log(`⏳ ${apiName} smart waiting ${waitTime/1000}s...`);
      await this.sleep(waitTime);
      
      // Check if API is now available
      return await rateLimiter.canMakeRequest(apiName);
    }

    return false;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calculate optimal wait time for API
   */
  getOptimalWaitTime(apiName: string): number {
    const status = rateLimiter.getAPIStatus(apiName);
    
    if (status.backoffUntil > Date.now()) {
      return status.backoffUntil - Date.now() + 500;
    }
    
    if (status.requestsThisMinute > 0) {
      const timeToReset = 60000 - (Date.now() % 60000);
      return Math.min(timeToReset + 1000, 15000);
    }
    
    return 1000; // Default 1 second
  }
}

// Singleton instance
export const intelligentWaiter = new IntelligentWaiter();