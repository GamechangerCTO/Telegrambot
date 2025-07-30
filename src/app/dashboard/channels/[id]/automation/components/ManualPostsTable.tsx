'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { 
  Edit, 
  Trash2, 
  ExternalLink, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Pause,
  Play,
  MessageSquare
} from 'lucide-react';

interface ManualPost {
  id: string;
  content: string;
  post_type: string;
  link_url?: string;
  scheduled_time: string;
  recurrence: string;
  status: 'scheduled' | 'sent' | 'failed' | 'cancelled';
  sent_at?: string;
  created_at: string;
}

interface ManualPostsTableProps {
  posts: ManualPost[];
  onRefresh: () => void;
}

export default function ManualPostsTable({ posts, onRefresh }: ManualPostsTableProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="text-blue-600 border-blue-300">Scheduled</Badge>;
      case 'sent':
        return <Badge variant="default" className="bg-green-100 text-green-800">Sent</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'cancelled':
        return <Pause className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPostTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'custom': '📝 Custom',
      'marketing': '📢 Marketing',
      'coupon': '🎫 Coupon',
      'announcement': '📣 Announcement'
    };
    return labels[type] || type;
  };

  const handleAction = async (postId: string, action: 'cancel' | 'delete' | 'resend') => {
    if (action === 'delete' && !confirm('Are you sure you want to delete this post?')) {
      return;
    }

    setLoading(postId);
    
    try {
      const response = await fetch(`/api/automation/manual-posts/${postId}`, {
        method: action === 'delete' ? 'DELETE' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: action !== 'delete' ? JSON.stringify({ action }) : undefined
      });

      const result = await response.json();
      
      if (result.success) {
        onRefresh();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error performing action:', error);
      alert('Error performing action');
    } finally {
      setLoading(null);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
    
    let dayLabel = '';
    if (isToday) dayLabel = 'Today';
    else if (isTomorrow) dayLabel = 'Tomorrow';
    else dayLabel = date.toLocaleDateString();
    
    return `${dayLabel} at ${date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
  };

  const getTimeStatus = (scheduledTime: string, status: string) => {
    const now = new Date();
    const scheduled = new Date(scheduledTime);
    
    if (status === 'sent' || status === 'cancelled') return null;
    
    if (scheduled < now && status === 'scheduled') {
      return <span className="text-red-600 text-xs">Overdue</span>;
    }
    
    if (scheduled > now) {
      const diff = scheduled.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours < 1) {
        return <span className="text-orange-600 text-xs">In {minutes}m</span>;
      } else if (hours < 24) {
        return <span className="text-blue-600 text-xs">In {hours}h {minutes}m</span>;
      }
    }
    
    return null;
  };

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Manual Posts</h3>
            <p className="text-gray-600">
              No manual posts scheduled for this channel yet
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Manual Posts ({posts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(post.status)}
                    <span className="text-sm font-medium">
                      {getPostTypeLabel(post.post_type)}
                    </span>
                    {getStatusBadge(post.status)}
                    {post.recurrence !== 'once' && (
                      <Badge variant="outline" size="sm">
                        {post.recurrence}
                      </Badge>
                    )}
                  </div>

                  {/* Content Preview */}
                  <div className="mb-3">
                    <p className="text-sm text-gray-900 line-clamp-2">
                      {post.content}
                    </p>
                    {post.link_url && (
                      <div className="mt-1">
                        <a 
                          href={post.link_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {post.link_url.length > 50 ? 
                            post.link_url.substring(0, 50) + '...' : 
                            post.link_url
                          }
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Timing Info */}
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDateTime(post.scheduled_time)}</span>
                    </div>
                    {getTimeStatus(post.scheduled_time, post.status)}
                    {post.sent_at && (
                      <span className="text-green-600">
                        Sent {formatDateTime(post.sent_at)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  {post.link_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(post.link_url, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  )}

                  {post.status === 'scheduled' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(post.id, 'cancel')}
                        disabled={loading === post.id}
                      >
                        <Pause className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    </>
                  )}

                  {post.status === 'failed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction(post.id, 'resend')}
                      disabled={loading === post.id}
                    >
                      <Play className="w-3 h-3" />
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction(post.id, 'delete')}
                    disabled={loading === post.id}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-blue-600">
                {posts.filter(p => p.status === 'scheduled').length}
              </div>
              <div className="text-xs text-gray-600">Scheduled</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-600">
                {posts.filter(p => p.status === 'sent').length}
              </div>
              <div className="text-xs text-gray-600">Sent</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-red-600">
                {posts.filter(p => p.status === 'failed').length}
              </div>
              <div className="text-xs text-gray-600">Failed</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-600">
                {posts.filter(p => p.status === 'cancelled').length}
              </div>
              <div className="text-xs text-gray-600">Cancelled</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}