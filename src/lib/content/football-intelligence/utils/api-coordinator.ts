/**
 * 🎯 API COORDINATOR
 * Centralized coordinator to prevent parallel requests and manage API usage
 */

import { rateLimiter } from './rate-limiter';
import { apiRequestQueue } from './api-request-queue';
import { intelligentWaiter } from './intelligent-waiter';

interface CoordinatedRequest {
  url: string;
  options?: RequestInit;
  apiName: string;
  priority?: number;
}

export class APICoordinator {
  private ongoingRequests: Map<string, Promise<Response>> = new Map();

  /**
   * Make coordinated request with rate limiting and deduplication
   */
  async makeRequest(params: CoordinatedRequest): Promise<Response> {
    const { url, options = {}, apiName, priority = 1 } = params;
    
    // Create request key for deduplication
    const requestKey = `${apiName}:${url}`;
    
    // Return ongoing request if same request is already in progress
    if (this.ongoingRequests.has(requestKey)) {
      console.log(`🔄 Reusing ongoing request: ${requestKey}`);
      return this.ongoingRequests.get(requestKey)!;
    }

    // Create the request promise
    const requestPromise = this.executeRequest(url, options, apiName, priority);
    
    // Store ongoing request
    this.ongoingRequests.set(requestKey, requestPromise);
    
    try {
      const response = await requestPromise;
      return response;
    } finally {
      // Clean up ongoing request
      this.ongoingRequests.delete(requestKey);
    }
  }

  /**
   * Execute the actual request with intelligent waiting and rate limiting
   */
  private async executeRequest(
    url: string, 
    options: RequestInit, 
    apiName: string, 
    priority: number
  ): Promise<Response> {
    // Queue the request for proper coordination
    return apiRequestQueue.queueRequest(
      apiName,
      async () => {
        // STEP 1: Check if API is immediately available
        let canRequest = await rateLimiter.canMakeRequest(apiName);
        
        // STEP 2: If not available, wait intelligently instead of failing
        if (!canRequest) {
          console.log(`⏳ ${apiName} not immediately available, intelligent waiting...`);
          
          // Try smart wait first (optimal timing)
          const smartWaitSuccess = await intelligentWaiter.smartWait(apiName);
          if (smartWaitSuccess) {
            canRequest = true;
            console.log(`✅ ${apiName} available after smart wait`);
          } else {
            // If smart wait doesn't work, try longer wait
            console.log(`⏳ ${apiName} smart wait failed, trying longer wait...`);
            const waitSuccess = await intelligentWaiter.waitForAPI(apiName, 15000); // 15 second max
            if (waitSuccess) {
              canRequest = true;
              console.log(`✅ ${apiName} available after extended wait`);
            } else {
              console.log(`❌ ${apiName} still unavailable after waiting, proceeding with fallback`);
              throw new Error(`Rate limited: ${apiName} unavailable after intelligent waiting`);
            }
          }
        }

        try {
          console.log(`📡 Making coordinated request to ${apiName}: ${url}`);
          const response = await fetch(url, options);

          // Record successful request
          rateLimiter.recordRequest(apiName);

          // Handle rate limit response
          if (response.status === 429) {
            console.log(`🚫 ${apiName} returned 429 - will wait longer next time`);
            rateLimiter.recordError(apiName, 429);
            throw new Error(`Rate limited by ${apiName} API: ${response.status}`);
          }

          // Handle other error responses
          if (!response.ok && response.status >= 500) {
            console.log(`💥 ${apiName} server error ${response.status}`);
            throw new Error(`Server error from ${apiName}: ${response.status}`);
          }

          return response;

        } catch (error) {
          const statusCode = error instanceof Error && error.message.includes('429') ? 429 : 500;
          
          // Record error for future rate limiting
          rateLimiter.recordError(apiName, statusCode);
          
          console.log(`❌ ${apiName} request failed - will wait longer for future requests`);
          throw error;
        }
      },
      priority
    );
  }

  /**
   * Make multiple coordinated requests with proper spacing
   */
  async makeSequentialRequests(requests: CoordinatedRequest[]): Promise<Response[]> {
    const results: Response[] = [];
    
    // Group by API to manage rate limits properly
    const apiGroups = new Map<string, CoordinatedRequest[]>();
    requests.forEach(request => {
      if (!apiGroups.has(request.apiName)) {
        apiGroups.set(request.apiName, []);
      }
      apiGroups.get(request.apiName)!.push(request);
    });

    // Process each API group with proper spacing
    for (const [apiName, apiRequests] of apiGroups) {
      console.log(`🔄 Processing ${apiRequests.length} requests for ${apiName}`);
      
      for (const request of apiRequests) {
        try {
          const response = await this.makeRequest(request);
          results.push(response);
          
          // Add small delay between requests to same API
          if (apiRequests.indexOf(request) < apiRequests.length - 1) {
            await this.sleep(1000); // 1 second between requests to same API
          }
        } catch (error) {
          console.error(`❌ Sequential request failed:`, error);
          // Continue with other requests even if one fails
        }
      }
    }

    return results;
  }

  /**
   * Get coordinator status
   */
  getStatus(): {
    ongoingRequests: number;
    requestKeys: string[];
    queueStatus: any;
    rateLimitStatus: any;
  } {
    return {
      ongoingRequests: this.ongoingRequests.size,
      requestKeys: Array.from(this.ongoingRequests.keys()),
      queueStatus: apiRequestQueue.getQueueStatus(),
      rateLimitStatus: rateLimiter.getAllStatus()
    };
  }

  /**
   * Clear all ongoing requests (useful for cleanup)
   */
  clearOngoingRequests(): void {
    console.log(`🗑️ Clearing ${this.ongoingRequests.size} ongoing requests`);
    this.ongoingRequests.clear();
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const apiCoordinator = new APICoordinator();