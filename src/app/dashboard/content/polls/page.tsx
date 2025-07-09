'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { ContentType } from '@/types/database';

interface Channel {
  id: string;
  name: string;
  language: string;
  content_types: Record<string, boolean>;
  telegram_channel_username?: string;
}

interface PollOption {
  text: string;
  id: string;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  isAnonymous: boolean;
  type: 'regular' | 'quiz';
  allowsMultipleAnswers: boolean;
  correctOptionId?: number;
  explanation?: string;
  createdAt: string;
  status: 'draft' | 'sent' | 'scheduled';
}

interface SmartGenerationModal {
  isOpen: boolean;
  selectedChannel: Channel | null;
  selectedContentType: ContentType | null;
}

const CONTENT_TYPE_LABELS = {
  live_update: { name: 'Live Updates', icon: '⚽', description: 'Real-time match events' },
  news: { name: 'News Articles', icon: '📰', description: 'Latest football news' },
  summary: { name: 'Daily Summary', icon: '📊', description: 'Match summaries and wrap-ups' },
  betting_tip: { name: 'Betting Tips', icon: '🎯', description: 'Betting predictions and analysis' },
  poll: { name: 'Interactive Polls', icon: '📊', description: 'Fan polls and surveys' },
  polls: { name: 'Interactive Polls', icon: '📊', description: 'Fan polls and surveys' },
  coupon: { name: 'Betting Coupons', icon: '🎟️', description: 'Affiliate betting promotions' },
  coupons: { name: 'Betting Coupons', icon: '🎟️', description: 'Affiliate betting promotions' },
  meme: { name: 'Memes & Fun', icon: '😄', description: 'Entertaining football content' },
  image: { name: 'Images & Media', icon: '🖼️', description: 'Photos and visual content' },
  images: { name: 'Images & Media', icon: '🖼️', description: 'Photos and visual content' },
  lineup: { name: 'Team Lineups', icon: '👥', description: 'Starting lineups and formations' },
  trend: { name: 'Weekly Trends', icon: '📈', description: 'Statistics and insights' },
  live_scores: { name: 'Live Scores', icon: '⚽', description: 'Real-time match scores' },
  betting_tips: { name: 'Betting Tips', icon: '🎯', description: 'Betting predictions and tips' },
  daily_summary: { name: 'Daily Summary', icon: '📋', description: 'Daily football summary' },
  match_analysis: { name: 'Match Analysis', icon: '🔍', description: 'Detailed match analysis' }
};

export default function PollsManagementPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [smartModal, setSmartModal] = useState<SmartGenerationModal>({
    isOpen: false,
    selectedChannel: null,
    selectedContentType: null
  });

  // New poll form state
  const [newPoll, setNewPoll] = useState({
    question: '',
    options: ['', '', '', ''],
    isAnonymous: true,
    type: 'regular' as 'regular' | 'quiz',
    allowsMultipleAnswers: false,
    correctOptionId: undefined as number | undefined,
    explanation: ''
  });

  const [isCreating, setIsCreating] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load channels with their content types
      const { data: channelsData } = await supabase
        .from('channels')
        .select('id, name, language, content_types, telegram_channel_username')
        .eq('is_active', true);

      setChannels(channelsData || []);
      
      // Load existing polls (mock data for now)
      const mockPolls: Poll[] = [
        {
          id: '1',
          question: 'Who will win the Premier League this season?',
          options: [
            { id: '1', text: 'Manchester City' },
            { id: '2', text: 'Arsenal' },
            { id: '3', text: 'Liverpool' },
            { id: '4', text: 'Chelsea' }
          ],
          isAnonymous: true,
          type: 'regular',
          allowsMultipleAnswers: false,
          createdAt: new Date().toISOString(),
          status: 'sent'
        }
      ];
      setPolls(mockPolls);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSmartGeneration = (channel: Channel) => {
    setSmartModal({
      isOpen: true,
      selectedChannel: channel,
      selectedContentType: null
    });
  };

  const handleContentTypeSelect = (contentType: ContentType) => {
    setSmartModal(prev => ({
      ...prev,
      selectedContentType: contentType
    }));
  };

  const executeSmartGeneration = async () => {
    if (!smartModal.selectedChannel || !smartModal.selectedContentType) return;

    try {
      setLoading(true);
      setError(null);

      let response;
      
      if (smartModal.selectedContentType === 'poll') {
        // Use the new simple poll generator
        response = await fetch('/api/simple-polls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language: smartModal.selectedChannel.language,
            channel_id: smartModal.selectedChannel.id,
            auto_send: true
          })
        });
      } else {
        // Generate other content types
        response = await fetch('/api/unified-content?action=send_now&mode=ai_enhanced', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content_categories: [smartModal.selectedContentType],
            target_channels: [smartModal.selectedChannel.id],
            max_posts_per_channel: 1
          })
        });
      }

      const result = await response.json();

      if (result.success) {
        const contentLabel = CONTENT_TYPE_LABELS[smartModal.selectedContentType]?.name || smartModal.selectedContentType;
        
        if (smartModal.selectedContentType === 'poll') {
          const pollType = result.poll?.type || 'poll';
          const pollTypeText = pollType === 'match' ? 'match-based' : 
                               pollType === 'news' ? 'news-based' : 'general';
          setSuccess(`🗳️ Smart ${pollTypeText} poll generated and sent to ${smartModal.selectedChannel.name}!`);
          loadData(); // Reload polls
        } else {
          setSuccess(`✅ ${contentLabel} content generated and sent successfully to ${smartModal.selectedChannel.name}!`);
        }
      } else {
        throw new Error(result.error || 'Failed to generate content');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate content');
    } finally {
      setLoading(false);
      setSmartModal({ isOpen: false, selectedChannel: null, selectedContentType: null });
    }
  };

  const handleCreatePoll = async () => {
    try {
      setIsCreating(true);
      setError(null);

      // Validate form
      if (!newPoll.question.trim()) {
        throw new Error('Poll question is required');
      }

      const validOptions = newPoll.options.filter(opt => opt.trim().length > 0);
      if (validOptions.length < 2) {
        throw new Error('At least 2 options are required');
      }

      // Test the poll generation via unified content API
      const response = await fetch('/api/unified-content?action=send_now&mode=ai_enhanced&content_type=poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poll_data: {
            question: newPoll.question,
            options: validOptions,
            type: newPoll.type,
            isAnonymous: newPoll.isAnonymous,
            allowsMultipleAnswers: newPoll.allowsMultipleAnswers,
            correctOptionId: newPoll.correctOptionId,
            explanation: newPoll.explanation
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(`Poll created and sent successfully! ${result.message}`);
        // Reset form
        setNewPoll({
          question: '',
          options: ['', '', '', ''],
          isAnonymous: true,
          type: 'regular',
          allowsMultipleAnswers: false,
          correctOptionId: undefined,
          explanation: ''
        });
        loadData(); // Reload polls list
      } else {
        throw new Error(result.error || 'Failed to create poll');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create poll');
    } finally {
      setIsCreating(false);
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...newPoll.options];
    newOptions[index] = value;
    setNewPoll(prev => ({ ...prev, options: newOptions }));
  };



  const getAvailableContentTypes = (channel: Channel): ContentType[] => {
    const contentTypes = channel.content_types || {};
    return Object.keys(contentTypes)
      .filter(type => contentTypes[type])
      .filter(type => CONTENT_TYPE_LABELS[type as ContentType]) as ContentType[];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">🗳️ Smart Polls Management</h1>
              <p className="text-blue-100">Intelligent polls based on upcoming matches, news, and general topics</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{polls.length}</div>
              <div className="text-sm text-blue-200">Total Polls</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
            <div className="flex">
              <div className="ml-3">
                <p className="text-red-700">❌ {error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
            <div className="flex">
              <div className="ml-3">
                <p className="text-green-700">✅ {success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Smart Generation Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="mr-3">🧠</span>
            Smart Content Generation
          </h2>
          <p className="text-gray-600 mb-6">
            Select a channel and content type. Polls are now generated intelligently based on upcoming matches, breaking news, or engaging general topics.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.map((channel) => (
              <div key={channel.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{channel.name}</h3>
                    <p className="text-sm text-gray-500">
                      {channel.telegram_channel_username && `@${channel.telegram_channel_username}`}
                    </p>
                    <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {channel.language.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-2">
                    {getAvailableContentTypes(channel).length} content types enabled
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {getAvailableContentTypes(channel).slice(0, 3).map((type) => (
                      <span key={type} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {CONTENT_TYPE_LABELS[type]?.icon} {CONTENT_TYPE_LABELS[type]?.name}
                      </span>
                    ))}
                    {getAvailableContentTypes(channel).length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                        +{getAvailableContentTypes(channel).length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleSmartGeneration(channel)}
                  disabled={loading || getAvailableContentTypes(channel).length === 0}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                >
                  <span className="mr-2">🚀</span>
                  SMART GENERATION
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Manual Poll Creation */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="mr-3">✍️</span>
            Create Custom Poll
          </h2>
          
          <div className="space-y-6">
            {/* Question */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poll Question
              </label>
              <input
                type="text"
                value={newPoll.question}
                onChange={(e) => setNewPoll(prev => ({ ...prev, question: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your poll question..."
              />
            </div>

            {/* Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poll Options
              </label>
              <div className="space-y-2">
                {newPoll.options.map((option, index) => (
                  <input
                    key={index}
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Option ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Poll Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={newPoll.isAnonymous}
                  onChange={(e) => setNewPoll(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="anonymous" className="ml-2 block text-sm text-gray-900">
                  Anonymous Poll
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="multiple"
                  checked={newPoll.allowsMultipleAnswers}
                  onChange={(e) => setNewPoll(prev => ({ ...prev, allowsMultipleAnswers: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="multiple" className="ml-2 block text-sm text-gray-900">
                  Multiple Answers
                </label>
              </div>

              <div>
                <select
                  value={newPoll.type}
                  onChange={(e) => setNewPoll(prev => ({ ...prev, type: e.target.value as 'regular' | 'quiz' }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="regular">Regular Poll</option>
                  <option value="quiz">Quiz Poll</option>
                </select>
              </div>
            </div>

            {/* Quiz Settings */}
            {newPoll.type === 'quiz' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-medium text-amber-800 mb-3">Quiz Settings</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-amber-700 mb-1">
                      Correct Answer
                    </label>
                    <select
                      value={newPoll.correctOptionId || ''}
                      onChange={(e) => setNewPoll(prev => ({ 
                        ...prev, 
                        correctOptionId: e.target.value ? parseInt(e.target.value) : undefined 
                      }))}
                      className="w-full px-3 py-2 border border-amber-300 rounded-lg"
                    >
                      <option value="">Select correct answer...</option>
                      {newPoll.options.map((option, index) => (
                        option.trim() && (
                          <option key={index} value={index}>
                            Option {index + 1}: {option}
                          </option>
                        )
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-amber-700 mb-1">
                      Explanation (optional)
                    </label>
                    <textarea
                      value={newPoll.explanation}
                      onChange={(e) => setNewPoll(prev => ({ ...prev, explanation: e.target.value }))}
                      className="w-full px-3 py-2 border border-amber-300 rounded-lg"
                      rows={2}
                      placeholder="Explain why this is the correct answer..."
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleCreatePoll}
              disabled={isCreating}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center font-medium"
            >
              {isCreating ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                <span className="mr-2">🗳️</span>
              )}
              {isCreating ? 'Creating Poll...' : 'Create & Send Poll'}
            </button>
          </div>
        </div>



        {/* Recent Polls */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">📊</span>
            Recent Polls
          </h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading polls...</p>
            </div>
          ) : polls.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🗳️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No polls created yet</h3>
              <p className="text-gray-500">Create your first poll using the smart generation or manual creation above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {polls.map((poll) => (
                <div key={poll.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-gray-900 text-lg">{poll.question}</h3>
                    <span className={`px-3 py-1 text-sm rounded-full ${
                      poll.status === 'sent' ? 'bg-green-100 text-green-800' :
                      poll.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {poll.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 mb-4">
                    {poll.options.map((option) => (
                      <div key={option.id} className="px-3 py-2 bg-gray-50 rounded-lg text-sm border border-gray-100">
                        {option.text}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      {poll.type === 'quiz' ? '🧠 Quiz' : '📊 Poll'}
                    </span>
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      {poll.isAnonymous ? '👤 Anonymous' : '📝 Public'}
                    </span>
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      {poll.allowsMultipleAnswers ? '☑️ Multiple' : '⭕ Single'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Smart Generation Modal */}
      {smartModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">🚀 Smart Content Generation</h2>
                <button
                  onClick={() => setSmartModal({ isOpen: false, selectedChannel: null, selectedContentType: null })}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <p className="text-gray-600 mt-2">
                Select content type for <strong>{smartModal.selectedChannel?.name}</strong>
              </p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getAvailableContentTypes(smartModal.selectedChannel!).map((contentType) => {
                  const typeInfo = CONTENT_TYPE_LABELS[contentType];
                  const isSelected = smartModal.selectedContentType === contentType;
                  const isPoll = contentType === 'poll';
                  
                  return (
                    <button
                      key={contentType}
                      onClick={() => handleContentTypeSelect(contentType)}
                      className={`p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 shadow-md' 
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      } ${isPoll ? 'ring-2 ring-purple-200' : ''}`}
                    >
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-3">{typeInfo.icon}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900">{typeInfo.name}</h3>
                          {isPoll && (
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                              Auto RSS-based
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{typeInfo.description}</p>
                      {isPoll && (
                        <p className="text-xs text-purple-600 mt-2">
                          🎯 Smart polls based on upcoming matches, news, or general topics
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSmartModal({ isOpen: false, selectedChannel: null, selectedContentType: null })}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeSmartGeneration}
                  disabled={!smartModal.selectedContentType || loading}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <span className="mr-2">🚀</span>
                  )}
                  {loading ? 'Generating...' : 'Generate & Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 