'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Plus, 
  Clock, 
  Zap, 
  Target,
  TestTube
} from 'lucide-react';

interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  automation_type: 'scheduled' | 'event_driven' | 'context_aware';
  content_type: string;
  schedule?: {
    frequency: string;
    times: string[];
    days?: string[];
  };
  languages: string[];
  channels: string[];
  created_at: string;
}

interface RuleManagerProps {
  rules: AutomationRule[];
  channelId: string;
  onExecuteRule: (ruleId: string) => void;
  onRefresh: () => void;
}

export default function RuleManager({ rules, channelId, onExecuteRule, onRefresh }: RuleManagerProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const getAutomationTypeInfo = (type: string) => {
    switch (type) {
      case 'scheduled':
        return { 
          icon: Clock, 
          label: 'Scheduled', 
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          description: 'Runs at specific times'
        };
      case 'event_driven':
        return { 
          icon: Zap, 
          label: 'Event-Driven', 
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          description: 'Triggered by events'
        };
      case 'context_aware':
        return { 
          icon: Target, 
          label: 'Context-Aware', 
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          description: 'Smart contextual triggers'
        };
      default:
        return { 
          icon: Settings, 
          label: type, 
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          description: 'Unknown type'
        };
    }
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

  const formatSchedule = (rule: AutomationRule) => {
    if (!rule.schedule) return 'No schedule';
    
    const { frequency, times, days } = rule.schedule;
    
    if (frequency === 'daily' && times) {
      return `Daily at ${times.join(', ')}`;
    }
    
    if (frequency === 'weekly' && times && days) {
      return `Weekly on ${days.join(', ')} at ${times.join(', ')}`;
    }
    
    if (frequency === 'custom' && times) {
      return `Custom: ${times.join(', ')}`;
    }
    
    return frequency;
  };

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    setLoading(ruleId);
    
    try {
      const response = await fetch(`/api/automation`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: ruleId,
          enabled: !enabled
        })
      });

      const result = await response.json();
      if (result.success) {
        onRefresh();
      } else {
        alert('Error updating rule: ' + result.error);
      }
    } catch (error) {
      console.error('Error toggling rule:', error);
      alert('Error updating rule');
    } finally {
      setLoading(null);
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this automation rule?')) {
      return;
    }

    setLoading(ruleId);
    
    try {
      const response = await fetch(`/api/automation?id=${ruleId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      if (result.success) {
        onRefresh();
      } else {
        alert('Error deleting rule: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
      alert('Error deleting rule');
    } finally {
      setLoading(null);
    }
  };

  const testRule = async (ruleId: string) => {
    setLoading(ruleId);
    
    try {
      onExecuteRule(ruleId);
    } finally {
      setLoading(null);
    }
  };

  // Group rules by type
  const rulesByType = rules.reduce((acc, rule) => {
    if (!acc[rule.automation_type]) acc[rule.automation_type] = [];
    acc[rule.automation_type].push(rule);
    return acc;
  }, {} as Record<string, AutomationRule[]>);

  const totalRules = rules.length;
  const activeRules = rules.filter(r => r.enabled).length;
  const inactiveRules = totalRules - activeRules;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{totalRules}</div>
          <div className="text-sm text-gray-600">Total Rules</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{activeRules}</div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-600">{inactiveRules}</div>
          <div className="text-sm text-gray-600">Inactive</div>
        </div>
      </div>

      {/* Rules by Type */}
      {Object.entries(rulesByType).map(([type, typeRules]) => {
        const typeInfo = getAutomationTypeInfo(type);
        const TypeIcon = typeInfo.icon;

        return (
          <Card key={type}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TypeIcon className={`w-5 h-5 ${typeInfo.color}`} />
                {typeInfo.label} Rules ({typeRules.length})
              </CardTitle>
              <p className="text-sm text-gray-600">{typeInfo.description}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {typeRules.map(rule => (
                  <div key={rule.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Rule Header */}
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg">
                            {getContentTypeIcon(rule.content_type)}
                          </span>
                          <h3 className="font-medium text-lg">{rule.name}</h3>
                          <Badge variant={rule.enabled ? "default" : "secondary"}>
                            {rule.enabled ? "Active" : "Inactive"}
                          </Badge>
                        </div>

                        {/* Rule Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Content Type:</span>
                            <div className="font-medium">
                              {getContentTypeIcon(rule.content_type)} {rule.content_type}
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-gray-600">Schedule:</span>
                            <div className="font-medium">{formatSchedule(rule)}</div>
                          </div>

                          <div>
                            <span className="text-gray-600">Languages:</span>
                            <div className="font-medium">
                              {rule.languages.join(', ').toUpperCase()}
                            </div>
                          </div>
                        </div>

                        {/* Created Date */}
                        <div className="text-xs text-gray-500 mt-2">
                          Created: {new Date(rule.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => testRule(rule.id)}
                          disabled={loading === rule.id}
                          title="Test Rule Now"
                        >
                          <TestTube className="w-4 h-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleRule(rule.id, rule.enabled)}
                          disabled={loading === rule.id}
                          title={rule.enabled ? "Disable Rule" : "Enable Rule"}
                        >
                          {rule.enabled ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          title="Edit Rule"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteRule(rule.id)}
                          disabled={loading === rule.id}
                          className="text-red-600 hover:text-red-700"
                          title="Delete Rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* No Rules State */}
      {totalRules === 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Settings className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Automation Rules</h3>
              <p className="text-gray-600 mb-4">
                No automation rules configured for this channel yet
              </p>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Create First Rule
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center pt-4 border-t">
        <Button variant="outline" onClick={onRefresh}>
          Refresh Rules
        </Button>
        
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create New Rule
        </Button>
      </div>
    </div>
  );
}