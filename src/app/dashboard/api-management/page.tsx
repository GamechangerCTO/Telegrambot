/**
 * 🔧 API Management Dashboard - Modern Professional UI
 * Advanced API management with real-time status monitoring
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  PageLayout, 
  Card,
  StatusBadge, 
  LoadingSpinner
} from '@/components';

interface APIStatus {
  name: string;
  status: 'working' | 'limited' | 'error' | 'not_configured';
  description: string;
  keyLength?: number;
  lastTested?: string;
  details?: string;
}

interface BettingIntelligenceTest {
  systemStatus: 'HEALTHY' | 'ISSUES';
  components: Record<string, any>;
  testResults: any;
  recommendations: string[];
}

export default function APIManagementPage() {
  const [currentAPIs, setCurrentAPIs] = useState<APIStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<BettingIntelligenceTest | null>(null);
  const [activeTab, setActiveTab] = useState('current');

  useEffect(() => {
    loadCurrentAPIStatus();
  }, []);

  const loadCurrentAPIStatus = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/debug-football?api=all');
      if (response.ok) {
        const data = await response.json();
        
        const apis: APIStatus[] = [
          {
            name: 'football-data.org',
            status: data.results?.['football-data-org']?.status === 200 ? 'working' : 'error',
            description: 'Football matches and leagues data',
            keyLength: data.results?.['football-data-org']?.key_length,
            details: data.results?.['football-data-org']?.error || 'Football matches and competitions data'
          },
          {
            name: 'APIFootball.com',
            status: data.results?.['apifootball']?.status === 200 ? 'working' : 'error',
            description: 'Live scores and match data',
            keyLength: data.results?.['apifootball']?.key_length,
            details: data.results?.['apifootball']?.error || 'Live scores and match information'
          },
          {
            name: 'API-Football (RapidAPI)',
            status: data.results?.['api-football']?.status === 200 ? 'working' : 'limited',
            description: 'Comprehensive football database',
            keyLength: data.results?.['api-football']?.key_length,
            details: data.results?.['api-football']?.error || 'Comprehensive football database'
          },
          {
            name: 'SoccersAPI',
            status: data.results?.['soccersapi']?.status === 200 ? 'working' : 'error',
            description: 'Additional football data source',
            keyLength: data.results?.['soccersapi']?.key_length,
            details: data.results?.['soccersapi']?.error || 'Additional football data source'
          },
          {
            name: 'TheSportsDB',
            status: 'working',
            description: 'Free sports database (Club World Cup)',
            keyLength: 3,
            details: 'Free sports database'
          }
        ];
        
        setCurrentAPIs(apis);
      }
    } catch (error) {
      console.error('Error loading API status:', error);
      alert('Error loading API status');
    } finally {
      setLoading(false);
    }
  };

  const testBettingIntelligence = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/betting-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_system' })
      });
      
      if (response.ok) {
        const data = await response.json();
        setTestResults(data);
        
        if (data.systemStatus === 'HEALTHY') {
          alert('Betting intelligence system is working successfully! 🧠');
        } else {
          alert('There are issues with the betting intelligence system');
        }
      } else {
        alert('Error testing betting intelligence system');
      }
    } catch (error) {
      console.error('Error testing betting intelligence:', error);
      alert('Error testing betting intelligence system');
    } finally {
      setLoading(false);
    }
  };

  const generateTestTip = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/betting-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'generate_smart_tip',
          language: 'en'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          alert(`Tip generated successfully: ${data.tip.match}`);
          console.log('Generated tip:', data.tip);
        } else {
          alert('Cannot generate tip at the moment');
        }
      }
    } catch (error) {
      console.error('Error generating test tip:', error);
      alert('Error generating test tip');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: APIStatus['status']) => {
    switch (status) {
      case 'working': return 'green';
      case 'limited': return 'yellow';
      case 'error': return 'red';
      case 'not_configured': return 'gray';
      default: return 'gray';
    }
  };

  const getStatusText = (status: APIStatus['status']) => {
    switch (status) {
      case 'working': return 'Working ✅';
      case 'limited': return 'Limited ⚠️';
      case 'error': return 'Error ❌';
      case 'not_configured': return 'Not Configured ⚪';
      default: return 'Unknown';
    }
  };

  return (
    <PageLayout
      title="API Management"
      subtitle="Monitor and manage API integrations"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Settings', href: '/dashboard/settings' },
        { label: 'API Management', current: true }
      ]}
    >
      <div className="space-y-6">
        {/* API Status Overview */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Current API Status</h2>
            <button
              onClick={loadCurrentAPIStatus}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200 flex items-center space-x-2"
            >
              {loading ? <LoadingSpinner size="sm" /> : <span>🔄</span>}
              <span>Refresh</span>
            </button>
          </div>

          {loading && currentAPIs.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentAPIs.map((api, index) => (
                <Card key={index} variant="elevated" className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{api.name}</h3>
                    <StatusBadge 
                      status={api.status === 'working'}
                      activeText="Working"
                      inactiveText="Error"
                      variant={api.status === 'working' ? 'success' : 'error'}
                    />
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{api.description}</p>
                  
                  <div className="space-y-2 text-xs text-gray-500">
                    {api.keyLength && (
                      <div>Key Length: {api.keyLength} chars</div>
                    )}
                    {api.details && (
                      <div className="p-2 bg-gray-50 rounded text-xs">
                        {api.details}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        {/* Betting Intelligence Testing */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Betting Intelligence System</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={testBettingIntelligence}
              disabled={loading}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🧠</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Test System</h3>
                  <p className="text-sm text-gray-500">Check betting intelligence system health</p>
                </div>
              </div>
            </button>

            <button
              onClick={generateTestTip}
              disabled={loading}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Generate Test Tip</h3>
                  <p className="text-sm text-gray-500">Create a research-based betting tip</p>
                </div>
              </div>
            </button>
          </div>

          {testResults && (
            <Card variant="elevated" className="p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Test Results</h4>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span>System Status:</span>
                  <StatusBadge 
                    status={testResults.systemStatus === 'HEALTHY'}
                    activeText="Healthy"
                    inactiveText="Issues"
                    variant={testResults.systemStatus === 'HEALTHY' ? 'success' : 'error'}
                  />
                </div>
                
                {testResults.recommendations && testResults.recommendations.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Recommendations:</h5>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      {testResults.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          )}
        </Card>

        {/* API Stats */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">API Statistics</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {currentAPIs.filter(api => api.status === 'working').length}
              </div>
              <div className="text-sm text-green-800">Working APIs</div>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {currentAPIs.filter(api => api.status === 'error').length}
              </div>
              <div className="text-sm text-red-800">Error APIs</div>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {currentAPIs.filter(api => api.status === 'limited').length}
              </div>
              <div className="text-sm text-yellow-800">Limited APIs</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {currentAPIs.length}
              </div>
              <div className="text-sm text-blue-800">Total APIs</div>
            </div>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
} 