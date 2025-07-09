'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function WeeklySummariesPage() {
  const [loading, setLoading] = useState(false);
  const [summaries, setSummaries] = useState<any[]>([]);
  const [responseMessage, setResponseMessage] = useState('');

  useEffect(() => {
    fetchWeeklySummaries();
  }, []);

  const fetchWeeklySummaries = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('content_type', 'weekly_summary')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setSummaries(data || []);
    } catch (error) {
      console.error('Error fetching weekly summaries:', error);
    }
  };

  const generateWeeklySummary = async () => {
    setLoading(true);
    setResponseMessage('Generating weekly summary...');
    
    try {
      const response = await fetch('/api/unified-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send_now',
          type: 'weekly_summary',
          mode: 'ai_enhanced',
          max_posts_per_channel: 1,
          include_images: true
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setResponseMessage('✅ Weekly summary generated and sent successfully!');
        fetchWeeklySummaries(); // Refresh the list
      } else {
        setResponseMessage(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error generating weekly summary:', error);
      setResponseMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const getNextSundayAt10AM = () => {
    const now = new Date();
    const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + daysUntilSunday);
    nextSunday.setHours(10, 0, 0, 0);
    return nextSunday;
  };

  const getCurrentWeekNumber = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.ceil(diff / oneWeek);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Weekly Summaries</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive weekly football analysis covering the previous week (Sunday to Saturday)
          </p>
        </div>
        <button
          onClick={generateWeeklySummary}
          disabled={loading}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate Weekly Summary'}
        </button>
      </div>

      {/* Response Message */}
      {responseMessage && (
        <div className={`p-4 rounded-lg ${
          responseMessage.startsWith('✅') ? 'bg-green-50 text-green-800' :
          responseMessage.startsWith('❌') ? 'bg-red-50 text-red-800' :
          'bg-blue-50 text-blue-800'
        }`}>
          {responseMessage}
        </div>
      )}

      {/* Weekly Summary Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">🕙 Next Automated Run</h3>
          <p className="text-2xl font-bold text-purple-600">
            {getNextSundayAt10AM().toLocaleDateString('he-IL')}
          </p>
          <p className="text-sm text-gray-600">Sunday at 10:00 AM</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">📅 Current Week</h3>
          <p className="text-2xl font-bold text-blue-600">
            Week {getCurrentWeekNumber()}
          </p>
          <p className="text-sm text-gray-600">of {new Date().getFullYear()}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">📊 Total Summaries</h3>
          <p className="text-2xl font-bold text-green-600">{summaries.length}</p>
          <p className="text-sm text-gray-600">Generated summaries</p>
        </div>
      </div>

      {/* Weekly Summary Features */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">📋 Weekly Summary Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900">📈 Past Week Analysis</h3>
            <p className="text-sm text-blue-700">Comprehensive review of the previous week's matches across all major leagues</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-medium text-green-900">📊 Week Statistics</h3>
            <p className="text-sm text-green-700">Goals, cards, clean sheets, and performance metrics from completed matches</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <h3 className="font-medium text-purple-900">🔍 Week Review</h3>
            <p className="text-sm text-purple-700">Analysis of key moments and decisions from the past week</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <h3 className="font-medium text-orange-900">🌍 Multi-Language</h3>
            <p className="text-sm text-orange-700">Available in English, Amharic, and Swahili</p>
          </div>
        </div>
      </div>

      {/* Recent Weekly Summaries */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">📋 Recent Weekly Summaries</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {summaries.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <p>No weekly summaries generated yet.</p>
              <p className="text-sm mt-2">Click "Generate Weekly Summary" to create your first one!</p>
            </div>
          ) : (
            summaries.map((summary) => (
              <div key={summary.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{summary.title}</h3>
                    <p className="text-sm text-gray-600">
                      {summary.language.toUpperCase()} • {new Date(summary.created_at).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      summary.status === 'sent' ? 'bg-green-100 text-green-800' :
                      summary.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {summary.status}
                    </span>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      View Details
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-gray-700 line-clamp-2">
                  {summary.content.substring(0, 150)}...
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 