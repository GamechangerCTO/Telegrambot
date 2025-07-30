'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Paperclip,
  Bot,
  User,
  ExternalLink 
} from 'lucide-react';

interface TimelineItem {
  id: string;
  type: 'automated' | 'manual';
  time: string;
  content_type: string;
  rule_name?: string;
  content?: string;
  status: 'pending' | 'executed' | 'failed' | 'cancelled';
  source: 'automation' | 'manual';
  link_url?: string;
  execution_id?: string;
}

interface DailyTimelineProps {
  timeline: TimelineItem[];
  onRefresh: () => void;
}

export default function DailyTimeline({ timeline, onRefresh }: DailyTimelineProps) {
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  // Generate 24-hour grid
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Group timeline items by hour
  const timelineByHour = timeline.reduce((acc, item) => {
    const hour = new Date(item.time).getHours();
    if (!acc[hour]) acc[hour] = [];
    acc[hour].push(item);
    return acc;
  }, {} as Record<number, TimelineItem[]>);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'executed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'pending': return 'bg-blue-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'executed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4 text-gray-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getContentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'news': '📰 News',
      'betting': '🎲 Betting',
      'analysis': '📊 Analysis',
      'live': '⚡ Live',
      'polls': '🗳️ Polls',
      'coupons': '🎫 Coupons',
      'summary': '📋 Summary',
      'custom': '📝 Custom',
      'marketing': '📢 Marketing',
      'announcement': '📣 Announcement'
    };
    return labels[type] || `📄 ${type}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Daily Timeline - {new Date().toLocaleDateString()}
          </CardTitle>
          <Button onClick={onRefresh} size="sm" variant="outline">
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Timeline Grid */}
        <div className="space-y-4">
          {/* Hours Grid */}
          <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 mb-4">
            {hours.map(hour => (
              <div key={hour} className="text-center">
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Timeline Bars */}
          <div className="grid grid-cols-12 gap-2 mb-6">
            {hours.map(hour => {
              const hourItems = timelineByHour[hour] || [];
              const isSelected = selectedHour === hour;
              
              return (
                <div 
                  key={hour}
                  className={`h-12 border rounded cursor-pointer transition-colors ${
                    isSelected ? 'ring-2 ring-blue-500' : ''
                  } ${hourItems.length > 0 ? 'border-gray-300' : 'border-gray-100'}`}
                  onClick={() => setSelectedHour(isSelected ? null : hour)}
                >
                  {/* Timeline items for this hour */}
                  <div className="h-full flex flex-col">
                    {hourItems.slice(0, 3).map((item, index) => (
                      <div
                        key={item.id}
                        className={`flex-1 ${getStatusColor(item.status)} ${
                          index === 0 ? 'rounded-t' : ''
                        } ${index === hourItems.length - 1 ? 'rounded-b' : ''} 
                        opacity-80 hover:opacity-100 transition-opacity relative group`}
                        title={`${getContentTypeLabel(item.content_type)} - ${item.status}`}
                      >
                        {/* Tooltip content */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {item.type === 'manual' ? (
                            <>
                              <User className="w-3 h-3 inline mr-1" />
                              Manual: {item.content?.slice(0, 30)}...
                            </>
                          ) : (
                            <>
                              <Bot className="w-3 h-3 inline mr-1" />
                              {item.rule_name}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    {hourItems.length > 3 && (
                      <div className="text-xs text-center text-gray-600 font-medium">
                        +{hourItems.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Hour Details */}
          {selectedHour !== null && timelineByHour[selectedHour] && (
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">
                {selectedHour.toString().padStart(2, '0')}:00 - {(selectedHour + 1).toString().padStart(2, '0')}:00
                ({timelineByHour[selectedHour].length} items)
              </h3>
              
              <div className="space-y-3">
                {timelineByHour[selectedHour].map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {/* Status Icon */}
                      {getStatusIcon(item.status)}
                      
                      {/* Type Icon */}
                      {item.type === 'manual' ? (
                        <User className="w-4 h-4 text-purple-600" />
                      ) : (
                        <Bot className="w-4 h-4 text-blue-600" />
                      )}
                      
                      {/* Content Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {getContentTypeLabel(item.content_type)}
                          </span>
                          <Badge variant="outline" size="sm">
                            {item.status}
                          </Badge>
                          {item.link_url && (
                            <Paperclip className="w-3 h-3 text-gray-500" />
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-600 mt-1">
                          {new Date(item.time).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {item.type === 'manual' ? (
                            <>
                              <span className="mx-1">•</span>
                              <span>{item.content?.slice(0, 50)}...</span>
                            </>
                          ) : (
                            <>
                              <span className="mx-1">•</span>
                              <span>Rule: {item.rule_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {item.link_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(item.link_url, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      )}
                      
                      {item.status === 'failed' && (
                        <Button size="sm" variant="outline">
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Legend</h4>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Executed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Failed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-500 rounded"></div>
                <span>Cancelled</span>
              </div>
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-600" />
                <span>Automated</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-purple-600" />
                <span>Manual</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}