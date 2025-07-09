// Rate Limiter - Intelligent API request management
// Prevents 429 (Too Many Requests) errors by managing request timing

interface APILimits {
  requestsPerMinute: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
  burstLimit?: number; // Max requests in burst
}

interface RequestRecord {
  timestamp: number;
  endpoint?: string;
}

interface APIConfig {
  name: string;
  limits: APILimits;
  requests: RequestRecord[];
  lastRequest: number;
  errorCount: number;
  backoffUntil: number;
}

// API-specific rate limits (based on official documentation)
const API_CONFIGURATIONS: Record<string, APILimits> = {
  'football-data': {
    requestsPerMinute: 10,    // Free plan: 10/minute
    requestsPerDay: 100,      // Free plan: 100/day
    burstLimit: 3             // Don't burst more than 3 requests
  },
  'football-data-org': {     // Alias for football-data
    requestsPerMinute: 10,
    requestsPerDay: 100,
    burstLimit: 3
  },
  'api-football': {
    requestsPerMinute: 100,   // RapidAPI: varies by plan
    requestsPerDay: 1000,     // Typical limit
    burstLimit: 10
  },
  'apifootball': {
    requestsPerMinute: 60,    // APIfootball.com
    requestsPerDay: 1000,
    burstLimit: 5
  },
  'thesportsdb': {
    requestsPerMinute: 200,   // Free API - generous limits
    burstLimit: 20
  }
};

export class RateLimiter {
  private apis: Map<string, APIConfig>;
  private globalCooldown: number = 0;

  constructor() {
    this.apis = new Map();
    this.initializeAPIs();
    console.log('⏱️ Rate Limiter initialized for', this.apis.size, 'APIs');
  }

  private initializeAPIs() {
    for (const [apiName, limits] of Object.entries(API_CONFIGURATIONS)) {
      this.apis.set(apiName, {
        name: apiName,
        limits,
        requests: [],
        lastRequest: 0,
        errorCount: 0,
        backoffUntil: 0
      });
    }
  }

  /**
   * Check if request is allowed for specific API - AGGRESSIVE VERSION
   */
  async canMakeRequest(apiName: string, endpoint?: string): Promise<boolean> {
    const config = this.apis.get(apiName);
    if (!config) {
      console.log(`⚠️ Unknown API: ${apiName}, allowing request`);
      return true;
    }

    const now = Date.now();

    // AGGRESSIVE: Skip API if it has ANY recent errors
    if (config.errorCount >= 2) {
      console.log(`🚫 ${apiName} circuit breaker: ${config.errorCount} errors, skipping to prevent 429s`);
      return false;
    }

    // Check if we're in backoff period
    if (now < config.backoffUntil) {
      const waitTime = Math.ceil((config.backoffUntil - now) / 1000);
      console.log(`🚫 ${apiName} in backoff for ${waitTime}s more`);
      return false;
    }

    // Clean old requests (older than 1 minute)
    config.requests = config.requests.filter(req => 
      now - req.timestamp < 60000
    );

    // AGGRESSIVE: Use much stricter minute limits
    const requestsInLastMinute = config.requests.length;
    const conservativeLimit = Math.max(1, Math.floor(config.limits.requestsPerMinute * 0.5)); // Use 50% of limit
    if (requestsInLastMinute >= conservativeLimit) {
      console.log(`⏰ ${apiName} conservative rate limit: ${requestsInLastMinute}/${conservativeLimit} per minute (50% of ${config.limits.requestsPerMinute})`);
      return false;
    }

    // AGGRESSIVE: Much stricter burst limits
    if (config.limits.burstLimit) {
      const recentRequests = config.requests.filter(req => 
        now - req.timestamp < 30000 // Last 30 seconds instead of 10
      ).length;
      
      const conservativeBurst = Math.max(1, Math.floor(config.limits.burstLimit * 0.3)); // Use 30% of burst limit
      if (recentRequests >= conservativeBurst) {
        console.log(`💥 ${apiName} conservative burst limit: ${recentRequests}/${conservativeBurst} in 30s`);
        return false;
      }
    }

    // AGGRESSIVE: Minimum 10 seconds between requests instead of calculated time
    const timeSinceLastRequest = now - config.lastRequest;
    const aggressiveInterval = Math.max(10000, (60000 / config.limits.requestsPerMinute) * 2); // At least 10s or 2x normal interval
    
    if (timeSinceLastRequest < aggressiveInterval) {
      const waitTime = Math.ceil((aggressiveInterval - timeSinceLastRequest) / 1000);
      console.log(`⏳ ${apiName} aggressive spacing: needs ${waitTime}s between requests`);
      return false;
    }

    return true;
  }

  /**
   * Wait until request is allowed
   */
  async waitForPermission(apiName: string, endpoint?: string): Promise<void> {
    let attempts = 0;
    const maxAttempts = 60; // Max 60 seconds wait
    
    while (!(await this.canMakeRequest(apiName, endpoint)) && attempts < maxAttempts) {
      await this.sleep(1000); // Wait 1 second
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      console.log(`⏰ ${apiName} rate limit timeout after ${maxAttempts}s`);
      throw new Error(`Rate limit timeout for ${apiName}`);
    }
  }

  /**
   * Record a successful request
   */
  recordRequest(apiName: string, endpoint?: string): void {
    const config = this.apis.get(apiName);
    if (!config) return;

    const now = Date.now();
    config.requests.push({
      timestamp: now,
      endpoint
    });
    config.lastRequest = now;
    config.errorCount = 0; // Reset error count on success
    
    console.log(`✅ ${apiName} request recorded (${config.requests.length}/${config.limits.requestsPerMinute} this minute)`);
  }

  /**
   * Record a failed request (429, 503, etc.)
   */
  recordError(apiName: string, statusCode: number): void {
    const config = this.apis.get(apiName);
    if (!config) return;

    config.errorCount++;
    
    if (statusCode === 429) { // Too Many Requests
      // Exponential backoff: 2^errorCount seconds, max 5 minutes
      const backoffSeconds = Math.min(Math.pow(2, config.errorCount), 300);
      config.backoffUntil = Date.now() + (backoffSeconds * 1000);
      
      console.log(`🚫 ${apiName} 429 error, backoff for ${backoffSeconds}s (error #${config.errorCount})`);
    } else if (statusCode >= 500) { // Server errors
      const backoffSeconds = Math.min(10 * config.errorCount, 60);
      config.backoffUntil = Date.now() + (backoffSeconds * 1000);
      
      console.log(`💥 ${apiName} server error (${statusCode}), backoff for ${backoffSeconds}s`);
    }
  }

  /**
   * Check if any APIs are currently available
   */
  async areAnyAPIsAvailable(): Promise<boolean> {
    for (const apiName of this.apis.keys()) {
      if (await this.canMakeRequest(apiName)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get list of currently available APIs
   */
  async getAvailableAPIs(): Promise<string[]> {
    const available: string[] = [];
    for (const apiName of this.apis.keys()) {
      if (await this.canMakeRequest(apiName)) {
        available.push(apiName);
      }
    }
    return available;
  }

  /**
   * Get API status
   */
  getAPIStatus(apiName: string): {
    available: boolean;
    requestsThisMinute: number;
    backoffUntil: number;
    errorCount: number;
  } {
    const config = this.apis.get(apiName);
    if (!config) {
      return {
        available: false,
        requestsThisMinute: 0,
        backoffUntil: 0,
        errorCount: 0
      };
    }

    const now = Date.now();
    const requestsThisMinute = config.requests.filter(req => 
      now - req.timestamp < 60000
    ).length;

    return {
      available: now >= config.backoffUntil && requestsThisMinute < config.limits.requestsPerMinute,
      requestsThisMinute,
      backoffUntil: config.backoffUntil,
      errorCount: config.errorCount
    };
  }

  /**
   * Get all APIs status
   */
  getAllStatus(): Record<string, ReturnType<typeof this.getAPIStatus>> {
    const status: Record<string, ReturnType<typeof this.getAPIStatus>> = {};
    
    for (const apiName of this.apis.keys()) {
      status[apiName] = this.getAPIStatus(apiName);
    }
    
    return status;
  }

  /**
   * Reset backoff for an API (useful for manual recovery)
   */
  resetBackoff(apiName: string): void {
    const config = this.apis.get(apiName);
    if (config) {
      config.backoffUntil = 0;
      config.errorCount = 0;
      console.log(`🔄 ${apiName} backoff reset`);
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Smart delay - waits appropriate time based on API limits
   */
  async smartDelay(apiName: string): Promise<void> {
    const config = this.apis.get(apiName);
    if (!config) return;

    const baseDelay = 60000 / config.limits.requestsPerMinute; // Time between requests
    const jitter = Math.random() * 1000; // Add 0-1s random delay
    
    await this.sleep(baseDelay + jitter);
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter(); 