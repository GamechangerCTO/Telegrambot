#!/usr/bin/env node

/**
 * 🧹 Cleanup Duplicate Cron Jobs Script
 * 
 * This script removes duplicate automation logs that are causing spam.
 * Keeps the latest entry for each unique combination of rule and scheduled time.
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase client setup
const supabaseUrl = 'https://ythsmnqclosoxiccchhh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0aHNtbnFjbG9zb3hpY2NjaGhoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE2NjMxOSwiZXhwIjoyMDY1NzQyMzE5fQ.j_0bp2a0ZTKmcji5BWsYisDRE3gF-ar3UdkwVp_Rm1A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDuplicates() {
  console.log('🧹 Starting cleanup of duplicate automation logs...');
  
  try {
    // 1. Clean old pending/failed logs (older than 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const { data: oldLogs, error: deleteOldError } = await supabase
      .from('automation_logs')
      .delete()
      .in('status', ['pending', 'failed'])
      .lt('created_at', oneDayAgo.toISOString());

    if (deleteOldError) {
      console.error('❌ Error deleting old logs:', deleteOldError);
    } else {
      console.log('✅ Deleted old pending/failed logs older than 24 hours');
    }

    // 2. Find duplicates based on rule_name + content_type + scheduled_time
    console.log('🔍 Finding duplicate logs...');
    
    const { data: duplicates, error: findError } = await supabase
      .from('automation_logs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (findError) {
      console.error('❌ Error finding duplicates:', findError);
      return;
    }

    if (!duplicates || duplicates.length === 0) {
      console.log('✅ No pending logs found');
      return;
    }

    console.log(`📊 Found ${duplicates.length} pending logs, checking for duplicates...`);

    // Group by rule_name + content_type + scheduled_time
    const groups = new Map();
    
    for (const log of duplicates) {
      const key = `${log.rule_name || 'unknown'}-${log.content_type || 'unknown'}-${log.scheduled_time || 'no-time'}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(log);
    }

    // Find groups with duplicates and keep only the latest
    let totalToDelete = 0;
    const idsToDelete = [];

    for (const [key, logs] of groups) {
      if (logs.length > 1) {
        console.log(`🔄 Found ${logs.length} duplicates for: ${key}`);
        
        // Sort by created_at (newest first) and keep the first one
        logs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Mark all except the first for deletion
        for (let i = 1; i < logs.length; i++) {
          idsToDelete.push(logs[i].id);
          totalToDelete++;
        }
      }
    }

    if (idsToDelete.length === 0) {
      console.log('✅ No duplicates found to clean');
      return;
    }

    console.log(`🗑️ Will delete ${totalToDelete} duplicate logs...`);

    // Delete duplicates in batches (Supabase has limits)
    const batchSize = 100;
    for (let i = 0; i < idsToDelete.length; i += batchSize) {
      const batch = idsToDelete.slice(i, i + batchSize);
      
      const { error: deleteError } = await supabase
        .from('automation_logs')
        .delete()
        .in('id', batch);

      if (deleteError) {
        console.error(`❌ Error deleting batch ${Math.floor(i/batchSize) + 1}:`, deleteError);
      } else {
        console.log(`✅ Deleted batch ${Math.floor(i/batchSize) + 1}: ${batch.length} logs`);
      }
    }

    console.log('🎉 Cleanup completed successfully!');

    // Show final stats
    const { data: finalLogs, error: statsError } = await supabase
      .from('automation_logs')
      .select('content_type, status')
      .eq('status', 'pending');

    if (!statsError && finalLogs) {
      console.log(`📊 Remaining pending logs: ${finalLogs.length}`);
      
      const typeCount = {};
      finalLogs.forEach(log => {
        typeCount[log.content_type] = (typeCount[log.content_type] || 0) + 1;
      });
      
      console.log('📈 By type:', typeCount);
    }

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// Run the cleanup
cleanupDuplicates().then(() => {
  console.log('✅ Script completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});