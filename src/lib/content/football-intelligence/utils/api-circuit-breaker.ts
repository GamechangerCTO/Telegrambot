/**
 * 🚫 API CIRCUIT BREAKER
 * Advanced circuit breaker pattern to completely disable problematic APIs
 */

interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
  successCount: number;
}

export class APICircuitBreaker {
  private circuits: Map<string, CircuitBreakerState> = new Map();
  private readonly failureThreshold = 3; // Open circuit after 3 failures
  private readonly recoveryTimeMs = 5 * 60 * 1000; // 5 minutes recovery time
  private readonly halfOpenSuccessThreshold = 2; // Need 2 successes to close circuit

  /**
   * Check if API is available (circuit is closed)
   */
  isAPIAvailable(apiName: string): boolean {
    const circuit = this.getCircuit(apiName);
    const now = Date.now();

    switch (circuit.state) {
      case 'CLOSED':
        return true;
        
      case 'OPEN':
        // Check if we can try again (move to HALF_OPEN)
        if (now >= circuit.nextAttemptTime) {
          console.log(`🔄 ${apiName} circuit moving to HALF_OPEN for testing`);
          circuit.state = 'HALF_OPEN';
          circuit.successCount = 0;
          return true;
        }
        const waitTime = Math.ceil((circuit.nextAttemptTime - now) / 1000);
        console.log(`🚫 ${apiName} circuit OPEN - blocked for ${waitTime}s more`);
        return false;
        
      case 'HALF_OPEN':
        return true;
        
      default:
        return true;
    }
  }

  /**
   * Record successful API call
   */
  recordSuccess(apiName: string): void {
    const circuit = this.getCircuit(apiName);

    if (circuit.state === 'HALF_OPEN') {
      circuit.successCount++;
      console.log(`✅ ${apiName} success in HALF_OPEN state (${circuit.successCount}/${this.halfOpenSuccessThreshold})`);
      
      if (circuit.successCount >= this.halfOpenSuccessThreshold) {
        console.log(`🟢 ${apiName} circuit CLOSED - API recovered`);
        circuit.state = 'CLOSED';
        circuit.failureCount = 0;
        circuit.successCount = 0;
      }
    } else if (circuit.state === 'CLOSED') {
      // Reset failure count on success
      circuit.failureCount = 0;
    }
  }

  /**
   * Record failed API call
   */
  recordFailure(apiName: string, statusCode?: number): void {
    const circuit = this.getCircuit(apiName);
    const now = Date.now();

    circuit.failureCount++;
    circuit.lastFailureTime = now;

    console.log(`❌ ${apiName} failure recorded (${circuit.failureCount}/${this.failureThreshold})`);

    // Immediate circuit open for 429 errors
    if (statusCode === 429) {
      console.log(`🚫 ${apiName} circuit OPENED immediately due to rate limit (429)`);
      circuit.state = 'OPEN';
      circuit.nextAttemptTime = now + this.recoveryTimeMs;
      return;
    }

    // Open circuit if threshold reached
    if (circuit.failureCount >= this.failureThreshold) {
      console.log(`🚫 ${apiName} circuit OPENED due to ${circuit.failureCount} failures`);
      circuit.state = 'OPEN';
      circuit.nextAttemptTime = now + this.recoveryTimeMs;
    }
  }

  /**
   * Get circuit state for API
   */
  private getCircuit(apiName: string): CircuitBreakerState {
    if (!this.circuits.has(apiName)) {
      this.circuits.set(apiName, {
        state: 'CLOSED',
        failureCount: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0,
        successCount: 0
      });
    }
    return this.circuits.get(apiName)!;
  }

  /**
   * Get all circuit states for monitoring
   */
  getCircuitStates(): Record<string, CircuitBreakerState> {
    const states: Record<string, CircuitBreakerState> = {};
    this.circuits.forEach((state, apiName) => {
      states[apiName] = { ...state };
    });
    return states;
  }

  /**
   * Manually reset circuit (for admin operations)
   */
  resetCircuit(apiName: string): void {
    const circuit = this.getCircuit(apiName);
    circuit.state = 'CLOSED';
    circuit.failureCount = 0;
    circuit.successCount = 0;
    circuit.nextAttemptTime = 0;
    console.log(`🔄 ${apiName} circuit manually reset to CLOSED`);
  }

  /**
   * Get list of available APIs (circuits that are not OPEN)
   */
  getAvailableAPIs(allAPIs: string[]): string[] {
    return allAPIs.filter(api => this.isAPIAvailable(api));
  }

  /**
   * Get status summary
   */
  getStatusSummary(): {
    totalAPIs: number;
    availableAPIs: number;
    openCircuits: string[];
    halfOpenCircuits: string[];
  } {
    const allStates = this.getCircuitStates();
    const openCircuits = Object.keys(allStates).filter(api => allStates[api].state === 'OPEN');
    const halfOpenCircuits = Object.keys(allStates).filter(api => allStates[api].state === 'HALF_OPEN');

    return {
      totalAPIs: this.circuits.size,
      availableAPIs: this.circuits.size - openCircuits.length,
      openCircuits,
      halfOpenCircuits
    };
  }
}

// Singleton instance
export const apiCircuitBreaker = new APICircuitBreaker();