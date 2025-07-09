/**
 * 🚦 API REQUEST QUEUE
 * Advanced queue system for coordinated API requests with rate limiting
 */

interface QueuedRequest {
  id: string;
  apiName: string;
  request: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
  priority: number;
  timestamp: number;
}

export class APIRequestQueue {
  private queue: QueuedRequest[] = [];
  private processing: Map<string, boolean> = new Map();
  private requestCounter = 0;

  /**
   * Add request to queue with priority  
   */
  async queueRequest<T>(
    apiName: string, 
    request: () => Promise<T>, 
    priority: number = 1
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        id: `${apiName}_${++this.requestCounter}_${Date.now()}`,
        apiName,
        request,
        resolve,
        reject,
        priority,
        timestamp: Date.now()
      };

      // Insert with priority (higher number = higher priority)
      const insertIndex = this.queue.findIndex(item => item.priority < priority);
      if (insertIndex === -1) {
        this.queue.push(queuedRequest);
      } else {
        this.queue.splice(insertIndex, 0, queuedRequest);
      }

      console.log(`📬 Queued ${apiName} request (priority: ${priority}, queue size: ${this.queue.length})`);
      
      // Start processing if not already running
      this.processQueue();
    });
  }

  /**
   * Process queue for all APIs
   */
  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) return;

    // Group by API to process independently
    const apiGroups = new Map<string, QueuedRequest[]>();
    this.queue.forEach(request => {
      if (!apiGroups.has(request.apiName)) {
        apiGroups.set(request.apiName, []);
      }
      apiGroups.get(request.apiName)!.push(request);
    });

    // Process each API queue independently
    const promises = Array.from(apiGroups.entries()).map(([apiName, requests]) => 
      this.processAPIQueue(apiName, requests)
    );

    await Promise.all(promises);
  }

  /**
   * Process queue for specific API
   */
  private async processAPIQueue(apiName: string, requests: QueuedRequest[]): Promise<void> {
    if (this.processing.get(apiName) || requests.length === 0) return;

    this.processing.set(apiName, true);
    console.log(`🔄 Processing ${requests.length} queued requests for ${apiName}`);

    try {
      for (const request of requests) {
        try {
          // Remove from queue
          this.queue = this.queue.filter(q => q.id !== request.id);
          
          // Execute request  
          const result = await request.request();
          request.resolve(result);
          
          console.log(`✅ Completed queued request for ${apiName}`);
          
        } catch (error) {
          console.error(`❌ Queued request failed for ${apiName}:`, error);
          request.reject(error);
        }
      }
    } finally {
      this.processing.set(apiName, false);
      
      // Check if more requests were added while processing
      if (this.queue.some(r => r.apiName === apiName)) {
        setTimeout(() => this.processQueue(), 100);
      }
    }
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    totalQueued: number;
    byAPI: Record<string, number>;
    processing: Record<string, boolean>;
  } {
    const byAPI: Record<string, number> = {};
    this.queue.forEach(request => {
      byAPI[request.apiName] = (byAPI[request.apiName] || 0) + 1;
    });

    const processing: Record<string, boolean> = {};
    this.processing.forEach((value, key) => {
      processing[key] = value;
    });

    return {
      totalQueued: this.queue.length,
      byAPI,
      processing
    };
  }

  /**
   * Clear queue for specific API
   */
  clearQueue(apiName?: string): void {
    if (apiName) {
      const removed = this.queue.filter(r => r.apiName === apiName);
      this.queue = this.queue.filter(r => r.apiName !== apiName);
      
      // Reject all removed requests
      removed.forEach(request => {
        request.reject(new Error(`Queue cleared for ${apiName}`));
      });
      
      console.log(`🗑️ Cleared ${removed.length} requests for ${apiName}`);
    } else {
      const count = this.queue.length;
      this.queue.forEach(request => {
        request.reject(new Error('Queue cleared'));
      });
      this.queue = [];
      console.log(`🗑️ Cleared all ${count} queued requests`);
    }
  }

  /**
   * Get next request for API (for priority processing)
   */
  getNextRequest(apiName: string): QueuedRequest | null {
    const apiRequests = this.queue.filter(r => r.apiName === apiName);
    if (apiRequests.length === 0) return null;

    // Sort by priority (desc) then timestamp (asc)
    apiRequests.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return a.timestamp - b.timestamp;
    });

    return apiRequests[0];
  }
}

// Singleton instance
export const apiRequestQueue = new APIRequestQueue();