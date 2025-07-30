'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Filter,
  Download,
  Eye,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface ExecutionLog {
  id: string;
  automation_rule_id: string;
  automation_rules?: {
    name: string;
    content_type: string;
  };
  status: 'success' | 'failed' | 'pending';
  content_generated: number;
  channels_updated: number;
  duration_ms: number;
  error_message?: string;
  metadata?: any;
  created_at: string;
}

interface ExecutionLogsTableProps {
  executions: ExecutionLog[];
  onRefresh: () => void;
}

export default function ExecutionLogsTable({ executions, onRefresh }: ExecutionLogsTableProps) {
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const filteredExecutions = executions.filter(execution => {
    if (filter === 'all') return true;
    return execution.status === filter;
  });

  const toggleExpanded = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-blue-600 border-blue-300">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  const getContentTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      'news': '📰',
      'betting': '🎲',
      'analysis': '📊',
      'live': '⚡',
      'polls': '🗳️',
      'coupons': '🎫',
      'summary': '📋'
    };
    return icons[type] || '📄';
  };

  // Calculate stats
  const stats = {
    total: executions.length,
    success: executions.filter(e => e.status === 'success').length,
    failed: executions.filter(e => e.status === 'failed').length,
    pending: executions.filter(e => e.status === 'pending').length,
    avgDuration: executions.length > 0 ? 
      Math.round(executions.reduce((sum, e) => sum + (e.duration_ms || 0), 0) / executions.length) : 0
  };

  const successRate = stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 0;

  if (executions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Execution Logs</h3>
            <p className="text-gray-600">
              No automation executions recorded for this channel yet
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Executions</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{stats.success}</div>
          <div className="text-sm text-gray-600">Successful</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          <div className="text-sm text-gray-600">Failed</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{successRate}%</div>
          <div className="text-sm text-gray-600">Success Rate</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">{formatDuration(stats.avgDuration)}</div>
          <div className="text-sm text-gray-600">Avg Duration</div>
        </div>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Execution Logs ({filteredExecutions.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="all">All Status</option>
                <option value="success">Success Only</option>
                <option value="failed">Failed Only</option>
              </select>
              <Button size="sm" variant="outline">
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
              <Button onClick={onRefresh} size="sm" variant="outline">
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredExecutions.map(execution => (
              <div key={execution.id} className="border rounded-lg">
                {/* Main Row */}
                <div 
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleExpanded(execution.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Expand/Collapse Icon */}
                      {expandedLogs.has(execution.id) ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}

                      {/* Status */}
                      <div className="flex items-center gap-2">
                        {getStatusIcon(execution.status)}
                        {getStatusBadge(execution.status)}
                      </div>

                      {/* Rule Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {getContentTypeIcon(execution.automation_rules?.content_type || '')}
                          </span>
                          <span className="font-medium text-sm truncate">
                            {execution.automation_rules?.name || 'Unknown Rule'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {execution.automation_rules?.content_type || 'Unknown Type'}
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="hidden md:flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <div className="font-medium">{execution.content_generated}</div>
                          <div className="text-xs text-gray-500">Content</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{execution.channels_updated}</div>
                          <div className="text-xs text-gray-500">Channels</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{formatDuration(execution.duration_ms || 0)}</div>
                          <div className="text-xs text-gray-500">Duration</div>
                        </div>
                      </div>

                      {/* Time */}
                      <div className="text-right text-sm">
                        <div className="font-medium">
                          {new Date(execution.created_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(execution.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedLogs.has(execution.id) && (
                  <div className="border-t bg-gray-50 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Execution Details */}
                      <div>
                        <h4 className="font-medium mb-2">Execution Details</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Rule ID:</span>
                            <span className="font-mono text-xs">{execution.automation_rule_id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Content Generated:</span>
                            <span>{execution.content_generated}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Channels Updated:</span>
                            <span>{execution.channels_updated}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Duration:</span>
                            <span>{formatDuration(execution.duration_ms || 0)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Error Details or Metadata */}
                      <div>
                        {execution.error_message ? (
                          <>
                            <h4 className="font-medium mb-2 text-red-600">Error Details</h4>
                            <div className="text-sm bg-red-50 border border-red-200 rounded p-3">
                              <p className="text-red-800">{execution.error_message}</p>
                            </div>
                          </>
                        ) : execution.metadata ? (
                          <>
                            <h4 className="font-medium mb-2">Metadata</h4>
                            <div className="text-xs bg-gray-100 border rounded p-3 font-mono overflow-auto max-h-32">
                              <pre>{JSON.stringify(execution.metadata, null, 2)}</pre>
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-gray-500 italic">
                            No additional details available
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}