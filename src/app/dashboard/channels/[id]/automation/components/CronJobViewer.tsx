'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Play, 
  Pause,
  Server,
  Activity
} from 'lucide-react';

interface CronStatus {
  isRunning: boolean;
  lastExecution?: string;
  totalExecutions: number;
  liveUpdates: {
    isActive: boolean;
    isRunning: boolean;
    totalMatches: number;
    liveMatches: number;
    eventsProcessed: number;
    updatesGenerated: number;
    startTime?: string;
  };
}

interface CronJobViewerProps {
  channelId: string;
}

export default function CronJobViewer({ channelId }: CronJobViewerProps) {
  const [loading, setLoading] = useState(true);
  const [cronStatus, setCronStatus] = useState<CronStatus | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    loadCronStatus();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadCronStatus, 30000);
    return () => clearInterval(interval);
  }, [channelId]);

  const loadCronStatus = async () => {
    try {
      const response = await fetch(`/api/automation/channel/${channelId}?type=cron`);
      const result = await response.json();
      
      if (result.success) {
        setCronStatus(result.data);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Error loading cron status:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBackgroundScheduler = async () => {
    try {
      const response = await fetch('/api/automation/background-scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: cronStatus?.isRunning ? 'stop' : 'start'
        })
      });

      const result = await response.json();
      if (result.success) {
        loadCronStatus();
      }
    } catch (error) {
      console.error('Error toggling background scheduler:', error);
    }
  };

  const formatUptime = (startTime?: string) => {
    if (!startTime) return 'N/A';
    
    const start = new Date(startTime);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading cron status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Cron Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Background Scheduler Status
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={cronStatus?.isRunning ? "default" : "secondary"}>
                {cronStatus?.isRunning ? "Running" : "Stopped"}
              </Badge>
              <Button onClick={loadCronStatus} size="sm" variant="outline">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {cronStatus?.isRunning ? (
                  <CheckCircle className="w-8 h-8 text-green-500" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-500" />
                )}
              </div>
              <p className="text-sm text-gray-600">Scheduler Status</p>
              <p className="font-semibold">
                {cronStatus?.isRunning ? "Active" : "Inactive"}
              </p>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-sm text-gray-600">Last Execution</p>
              <p className="font-semibold text-sm">
                {cronStatus?.lastExecution ? 
                  new Date(cronStatus.lastExecution).toLocaleString() : 
                  'Never'
                }
              </p>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Activity className="w-8 h-8 text-purple-500" />
              </div>
              <p className="text-sm text-gray-600">Total Executions</p>
              <p className="font-semibold">{cronStatus?.totalExecutions || 0}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center">
            <Button 
              onClick={toggleBackgroundScheduler}
              variant={cronStatus?.isRunning ? "outline" : "default"}
              className={cronStatus?.isRunning ? "text-red-600 border-red-300" : ""}
            >
              {cronStatus?.isRunning ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Stop Scheduler
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Scheduler
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live Updates Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-500" />
            Live Updates Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">Status</p>
              <div className="flex items-center justify-center gap-1">
                {cronStatus?.liveUpdates.isActive ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="font-semibold text-sm">
                  {cronStatus?.liveUpdates.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="text-center p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">Live Matches</p>
              <p className="font-semibold">
                {cronStatus?.liveUpdates.liveMatches || 0}
              </p>
            </div>

            <div className="text-center p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">Events Processed</p>
              <p className="font-semibold">
                {cronStatus?.liveUpdates.eventsProcessed || 0}
              </p>
            </div>

            <div className="text-center p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">Updates Generated</p>
              <p className="font-semibold">
                {cronStatus?.liveUpdates.updatesGenerated || 0}
              </p>
            </div>
          </div>

          {cronStatus?.liveUpdates.startTime && (
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Uptime: {formatUptime(cronStatus.liveUpdates.startTime)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cron Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            Active Cron Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {CRON_JOBS.map(job => (
              <div key={job.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">{job.name}</h4>
                  <p className="text-sm text-gray-600">{job.description}</p>
                  <p className="text-xs text-gray-500 font-mono">{job.schedule}</p>
                </div>
                <div className="text-right">
                  <Badge variant={job.active ? "default" : "secondary"}>
                    {job.active ? "Active" : "Inactive"}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    Next: {job.nextRun}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Refresh Info */}
      <div className="text-center text-xs text-gray-500">
        Last refreshed: {lastRefresh.toLocaleTimeString()}
        <br />
        Auto-refresh every 30 seconds
      </div>
    </div>
  );
}

// Static cron jobs information
const CRON_JOBS = [
  {
    name: "Hourly Content Check",
    description: "Checks for scheduled content every hour",
    schedule: "0 * * * *",
    active: true,
    nextRun: "Next hour"
  },
  {
    name: "Live Updates Monitor", 
    description: "Monitors live matches every 3 minutes",
    schedule: "*/3 6-23 * * *",
    active: true,
    nextRun: "3 minutes"
  },
  {
    name: "Daily Summary Generator",
    description: "Generates daily summaries at 6 AM",
    schedule: "0 6 * * *",
    active: true,
    nextRun: "Tomorrow 6:00 AM"
  },
  {
    name: "Smart Push Scheduler",
    description: "Processes smart push campaigns",
    schedule: "*/15 * * * *",
    active: true,
    nextRun: "15 minutes"
  }
];