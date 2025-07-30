/**
 * 🚀 PERFORMANCE MONITORING SYSTEM
 * 
 * Monitors and optimizes content scheduler performance
 */

interface PerformanceMetrics {
  executionTime: number;
  contentGenerated: number;
  errorsCount: number;
  optimizationsApplied: string[];
  cacheHits: number;
  cacheMisses: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetricsHistory = 100; // Keep last 100 executions

  recordExecution(metrics: PerformanceMetrics) {
    this.metrics.push(metrics);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }
  }

  getPerformanceStats() {
    if (this.metrics.length === 0) {
      return {
        averageExecutionTime: 0,
        successRate: 0,
        totalContentGenerated: 0,
        optimizationEfficiency: 0
      };
    }

    const totalTime = this.metrics.reduce((sum, m) => sum + m.executionTime, 0);
    const totalContent = this.metrics.reduce((sum, m) => sum + m.contentGenerated, 0);
    const totalErrors = this.metrics.reduce((sum, m) => sum + m.errorsCount, 0);
    const totalCacheHits = this.metrics.reduce((sum, m) => sum + m.cacheHits, 0);
    const totalCacheRequests = this.metrics.reduce((sum, m) => sum + m.cacheHits + m.cacheMisses, 0);

    return {
      averageExecutionTime: Math.round(totalTime / this.metrics.length),
      successRate: Math.round(((this.metrics.length - totalErrors) / this.metrics.length) * 100),
      totalContentGenerated: totalContent,
      cacheHitRate: totalCacheRequests > 0 ? Math.round((totalCacheHits / totalCacheRequests) * 100) : 0,
      optimizationEfficiency: Math.round((this.metrics.filter(m => m.optimizationsApplied.length > 0).length / this.metrics.length) * 100)
    };
  }

  getRecentTrends() {
    const recent = this.metrics.slice(-10); // Last 10 executions
    
    if (recent.length < 2) {
      return { trend: 'insufficient_data' };
    }

    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));

    const avgTimeFirst = firstHalf.reduce((sum, m) => sum + m.executionTime, 0) / firstHalf.length;
    const avgTimeSecond = secondHalf.reduce((sum, m) => sum + m.executionTime, 0) / secondHalf.length;

    const improvementPercent = Math.round(((avgTimeFirst - avgTimeSecond) / avgTimeFirst) * 100);

    return {
      trend: improvementPercent > 10 ? 'improving' : improvementPercent < -10 ? 'degrading' : 'stable',
      improvementPercent,
      recentAverageTime: Math.round(avgTimeSecond)
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();
export type { PerformanceMetrics };