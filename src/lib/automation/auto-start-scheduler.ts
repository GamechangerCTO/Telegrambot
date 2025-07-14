/**
 * 🚀 Auto-Start Scheduler - Automatic Background Scheduler Activation
 * 
 * This module automatically starts the background scheduler when the server starts
 * and ensures it keeps running in production environments.
 */

import { BackgroundScheduler } from './background-scheduler';

let globalScheduler: BackgroundScheduler | null = null;

/**
 * Initialize and start the background scheduler
 */
export function initializeScheduler(): void {
  console.log('🔄 Initializing Background Scheduler...');
  
  if (globalScheduler) {
    console.log('⚠️ Scheduler already running');
    return;
  }

  globalScheduler = new BackgroundScheduler();
  globalScheduler.start();
  
  console.log('✅ Background Scheduler auto-started successfully');
}

/**
 * Get the current scheduler instance
 */
export function getSchedulerInstance(): BackgroundScheduler | null {
  return globalScheduler;
}

/**
 * Start scheduler if not running
 */
export function ensureSchedulerRunning(): void {
  if (!globalScheduler) {
    initializeScheduler();
  } else if (!globalScheduler.isActive()) {
    console.log('🔄 Restarting stopped scheduler...');
    globalScheduler.start();
  }
}

/**
 * Auto-initialize on import (for server startup)
 */
if (typeof window === 'undefined') { // Server-side only
  // Wait 5 seconds after server start to allow everything to initialize
  setTimeout(() => {
    initializeScheduler();
  }, 5000);
} 