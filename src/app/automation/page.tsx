'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Settings, Clock, Zap, Calendar, Users, Globe, ToggleLeft, ToggleRight, Info, Timer, Loader2, Square, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  type: 'full_auto' | 'manual_approval';
  automation_type: 'scheduled' | 'event_driven' | 'context_aware' | 'full_automation';
  content_type: string;
  config: any;
  next_run?: string;
  stats?: {
    totalRuns: number;
    successRate: number;
    contentGenerated: number;
  };
}

interface AutomationResult {
  rule_id: string;
  rule_name: string;
  type: string;
  content_type: string;
  status: 'triggered' | 'skipped' | 'error';
  trigger_reason?: string;
  timestamp: string;
  error?: string;
  channels_targeted?: string[];
}

interface CycleResults {
  timestamp: string;
  cycles_run: number;
  content_generated: number;
  actions_taken: AutomationResult[];
}

export default function AutomationPage() {
  const { isAuthenticated, isManager, isSuperAdmin, loading: authLoading } = useAuth();
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [isFullAutomationEnabled, setIsFullAutomationEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isRunningCycle, setIsRunningCycle] = useState(false);
  const [cycleProgress, setCycleProgress] = useState<string>('');
  const [cycleTimer, setCycleTimer] = useState(0);
  const [cycleResults, setCycleResults] = useState<CycleResults | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [automationLogs, setAutomationLogs] = useState<string[]>([]);
  const [activeChannels, setActiveChannels] = useState<any[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [executingRule, setExecutingRule] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [loadingFixtures, setLoadingFixtures] = useState(false);
  const [nextScheduledContent, setNextScheduledContent] = useState<{
    type: string;
    name: string;
    emoji: string;
    time: string;
    timeUntil: string;
    scheduledTime: string;
    match?: string;
  } | null>(null);
  const [schedulerStatus, setSchedulerStatus] = useState<any>(null);
  const [isSchedulerLoading, setIsSchedulerLoading] = useState(false);

  // Smart Content Configuration
  const SMART_CONTENT_CONFIG = {
    // Event-Driven (Match-Based)
    'betting': {
      name: 'Pre-Match Betting Tips',
      emoji: '🎯',
      automation_type: 'event_driven',
      description: '2-3 hours before matches',
      trigger: 'upcoming_matches',
      timing: 'before_match',
      hours_before: 2,
      min_importance: 'medium'
    },
    'analysis': {
      name: 'Pre-Match Analysis',
      emoji: '📈',
      automation_type: 'event_driven',
      description: '2-3 hours before important matches',
      trigger: 'upcoming_matches',
      timing: 'before_match',
      hours_before: 2,
      min_importance: 'high'
    },
    'polls': {
      name: 'Pre-Match Polls',
      emoji: '📊',
      automation_type: 'event_driven',
      description: 'Before big matches',
      trigger: 'upcoming_matches',
      timing: 'before_match',
      hours_before: 4,
      min_importance: 'high'
    },
    'live': {
      name: 'Live Updates',
      emoji: '🔴',
      automation_type: 'event_driven',
      description: 'During live matches',
      trigger: 'live_matches',
      timing: 'during_match',
      update_frequency: 15 // minutes
    },
    
    // Scheduled (Time-Based)
    'news': {
      name: 'Football News',
      emoji: '📰',
      automation_type: 'scheduled',
      description: 'RSS check every 3 hours',
      schedule: 'every_3_hours',
      times: ['09:00', '12:00', '15:00', '18:00', '21:00']
    },
    'daily_summary': {
      name: 'Daily Summary',
      emoji: '📋',
      automation_type: 'scheduled',
      description: 'End of day summary (after all matches)',
      schedule: 'daily',
      times: ['00:30']
    },
    
    // Context-Aware
    'smart_push': {
      name: 'Smart Coupons',
      emoji: '🎫',
      automation_type: 'context_aware',
      description: 'After content delivery',
      trigger: 'after_content',
      probability: {
        'news': 0.3,
        'analysis': 0.6,
        'betting': 0.8
      }
    }
  };

  useEffect(() => {
    fetchRules();
    checkFullAutomationStatus();
    fetchSystemStatus();
    fetchFixtures();
    calculateNextScheduledContent();
    fetchSchedulerStatus();
    
    // Auto-start scheduler if automation is enabled
    setTimeout(() => {
      if (isFullAutomationEnabled) {
        controlScheduler('start');
      }
    }, 2000); // Wait 2 seconds for other initializations
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunningCycle) {
      interval = setInterval(() => {
        setCycleTimer(prev => prev + 1);
      }, 1000);
    } else {
      setCycleTimer(0);
    }
    return () => clearInterval(interval);
  }, [isRunningCycle]);

  // Current time updater
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      calculateNextScheduledContent();
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Background Scheduler status updater
  useEffect(() => {
    const timer = setInterval(() => {
      fetchSchedulerStatus();
    }, 30000); // Refresh every 30 seconds
    return () => clearInterval(timer);
  }, []);

  // Calculate next scheduled content
  const calculateNextScheduledContent = () => {
    const now = new Date();
    
    // Define all scheduled content times
    const scheduledTimes = [
      { time: '00:30', type: 'daily_summary', name: 'Daily Summary', emoji: '📋' },
      { time: '09:00', type: 'news', name: 'Morning News', emoji: '📰' },
      { time: '12:00', type: 'news', name: 'Midday News', emoji: '📰' },
      { time: '15:00', type: 'news', name: 'Afternoon News', emoji: '📰' },
      { time: '18:00', type: 'news', name: 'Evening News', emoji: '📰' },
      { time: '21:00', type: 'news', name: 'Night News', emoji: '📰' }
    ];

    // Get match-based content opportunities
    const matchOpportunities: any[] = [];
    
    if (fixtures && fixtures.length > 0) {
      fixtures.forEach(day => {
        day.fixtures?.forEach((fixture: any) => {
          const matchTime = fixture.kickoff ? new Date(fixture.kickoff) : 
                          fixture.fixture?.date ? new Date(fixture.fixture.date) : null;
          
          if (matchTime && matchTime > now) {
            const timeDiff = matchTime.getTime() - now.getTime();
            const hoursUntilMatch = timeDiff / (1000 * 60 * 60);
            
            // Check if this is a significant match (relevance score > 60)
            const relevanceScore = fixture.relevance_score?.total || 0;
            const isSignificant = relevanceScore > 60;
            
            // Try multiple ways to get team names
            const homeTeam = fixture.home_team?.name || 
                           fixture.home_team || 
                           fixture.teams?.home?.name || 
                           fixture.homeTeam?.name ||
                           fixture.homeTeam ||
                           fixture.home?.name ||
                           'Home';
            const awayTeam = fixture.away_team?.name || 
                           fixture.away_team || 
                           fixture.teams?.away?.name || 
                           fixture.awayTeam?.name ||
                           fixture.awayTeam ||
                           fixture.away?.name ||
                           'Away';
            
            // Ensure we always have strings
            const homeTeamStr = typeof homeTeam === 'string' ? homeTeam : homeTeam?.name || 'Home';
            const awayTeamStr = typeof awayTeam === 'string' ? awayTeam : awayTeam?.name || 'Away';
            
            // Add betting tips opportunity (2-3 hours before)
            if (hoursUntilMatch <= 3 && hoursUntilMatch > 1) {
              const bettingTime = new Date(matchTime.getTime() - (2.5 * 60 * 60 * 1000));
              if (bettingTime > now) {
                matchOpportunities.push({
                  time: bettingTime.toTimeString().slice(0, 5),
                  type: 'betting',
                  name: `Betting Tips`,
                  emoji: '🎯',
                  match: `${homeTeamStr} vs ${awayTeamStr}`,
                  scheduledTime: bettingTime.toLocaleString('he-IL', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  }),
                  actualTime: bettingTime,
                  relevanceScore
                });
              }
            }
            
            // Add analysis opportunity for high-importance matches
            if (isSignificant && hoursUntilMatch <= 3 && hoursUntilMatch > 1) {
              const analysisTime = new Date(matchTime.getTime() - (2 * 60 * 60 * 1000));
              if (analysisTime > now) {
                matchOpportunities.push({
                  time: analysisTime.toTimeString().slice(0, 5),
                  type: 'analysis',
                  name: `Match Analysis`,
                  emoji: '📈',
                  match: `${homeTeamStr} vs ${awayTeamStr}`,
                  scheduledTime: analysisTime.toLocaleString('he-IL', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  }),
                  actualTime: analysisTime,
                  relevanceScore
                });
              }
            }
            
            // Add live update opportunity (at match time)
            if (hoursUntilMatch <= 0.5 && hoursUntilMatch > -2) {
              matchOpportunities.push({
                time: matchTime.toTimeString().slice(0, 5),
                type: 'live',
                name: `Live Updates`,
                emoji: '⚡',
                match: `${homeTeamStr} vs ${awayTeamStr}`,
                scheduledTime: matchTime.toLocaleString('he-IL', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                }),
                actualTime: matchTime,
                relevanceScore
              });
            }
          }
        });
      });
    }

    // Combine scheduled content with match opportunities
    const allOpportunities = [
      ...scheduledTimes.map(scheduled => {
        const [hours, minutes] = scheduled.time.split(':').map(Number);
        const scheduledTime = new Date(now);
        scheduledTime.setHours(hours, minutes, 0, 0);
        
        // If time has passed today, schedule for tomorrow
        if (scheduledTime < now) {
          scheduledTime.setDate(scheduledTime.getDate() + 1);
        }
        
        return {
          ...scheduled,
          scheduledTime: scheduledTime.toLocaleString('he-IL', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }),
          actualTime: scheduledTime,
          relevanceScore: 0
        };
      }),
      ...matchOpportunities
    ];

    // Find the next opportunity
    let nextScheduled = null;
    let minTimeDiff = Infinity;

    for (const opportunity of allOpportunities) {
      const timeDiff = opportunity.actualTime.getTime() - now.getTime();
      
      if (timeDiff > 0 && timeDiff < minTimeDiff) {
        minTimeDiff = timeDiff;
        nextScheduled = {
          ...opportunity,
          timeUntil: formatTimeUntil(timeDiff)
        };
      }
    }

    setNextScheduledContent(nextScheduled);
  };

  // Format time until next scheduled content
  const formatTimeUntil = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  // Get today's schedule
  const getTodaysSchedule = () => {
    const today = new Date();
    const schedule = [
      { time: '00:30', type: 'daily_summary', name: 'Daily Summary', emoji: '📋', description: 'End of day summary (after all matches)' },
      { time: '09:00', type: 'news', name: 'Morning News', emoji: '📰', description: 'Morning news update' },
      { time: '12:00', type: 'news', name: 'Midday News', emoji: '📰', description: 'Midday news update' },
      { time: '15:00', type: 'news', name: 'Afternoon News', emoji: '📰', description: 'Afternoon news update' },
      { time: '18:00', type: 'news', name: 'Evening News', emoji: '📰', description: 'Evening news update' },
      { time: '21:00', type: 'news', name: 'Night News', emoji: '📰', description: 'Night news update' }
    ];

    // Add today's matches to schedule
    const todaysMatches: any[] = [];
    if (fixtures && fixtures.length > 0) {
      fixtures.forEach(day => {
        day.fixtures?.forEach((fixture: any) => {
          const matchTime = fixture.kickoff ? new Date(fixture.kickoff) : 
                          fixture.fixture?.date ? new Date(fixture.fixture.date) : null;
          
          if (matchTime) {
            const matchDate = matchTime.toDateString();
            const todayDate = today.toDateString();
            
            if (matchDate === todayDate) {
              const relevanceScore = fixture.relevance_score?.total || 0;
              const isSignificant = relevanceScore > 60;
              
              // Add betting tips (2.5 hours before match)
              const bettingTime = new Date(matchTime.getTime() - (2.5 * 60 * 60 * 1000));
              if (bettingTime > today) {
                // Try multiple ways to get team names
                const homeTeam = fixture.home_team?.name || 
                               fixture.home_team || 
                               fixture.teams?.home?.name || 
                               fixture.homeTeam?.name ||
                               fixture.homeTeam ||
                               fixture.home?.name ||
                               'Home';
                const awayTeam = fixture.away_team?.name || 
                               fixture.away_team || 
                               fixture.teams?.away?.name || 
                               fixture.awayTeam?.name ||
                               fixture.awayTeam ||
                               fixture.away?.name ||
                               'Away';
                
                // Ensure we always have strings
                const homeTeamStr = typeof homeTeam === 'string' ? homeTeam : (homeTeam?.name || 'Home');
                const awayTeamStr = typeof awayTeam === 'string' ? awayTeam : (awayTeam?.name || 'Away');
                
                todaysMatches.push({
                  time: bettingTime.toTimeString().slice(0, 5),
                  type: 'betting',
                  name: 'Betting Tips',
                  emoji: '🎯',
                  description: `${homeTeamStr} vs ${awayTeamStr}`,
                  scheduledTime: bettingTime.toLocaleString('he-IL', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  }),
                  actualTime: bettingTime,
                  relevanceScore
                });
              }
              
              // Add analysis for significant matches (2 hours before)
              if (isSignificant) {
                const analysisTime = new Date(matchTime.getTime() - (2 * 60 * 60 * 1000));
                if (analysisTime > today) {
                  // Try multiple ways to get team names
                  const homeTeam = fixture.home_team?.name || 
                                 fixture.home_team || 
                                 fixture.teams?.home?.name || 
                                 fixture.homeTeam?.name ||
                                 fixture.homeTeam ||
                                 fixture.home?.name ||
                                 'Home';
                  const awayTeam = fixture.away_team?.name || 
                                 fixture.away_team || 
                                 fixture.teams?.away?.name || 
                                 fixture.awayTeam?.name ||
                                 fixture.awayTeam ||
                                 fixture.away?.name ||
                                 'Away';
                  
                  // Ensure we always have strings
                  const homeTeamStr = typeof homeTeam === 'string' ? homeTeam : (homeTeam?.name || 'Home');
                  const awayTeamStr = typeof awayTeam === 'string' ? awayTeam : (awayTeam?.name || 'Away');
                  
                  todaysMatches.push({
                    time: analysisTime.toTimeString().slice(0, 5),
                    type: 'analysis',
                    name: 'Match Analysis',
                    emoji: '📈',
                    description: `${homeTeamStr} vs ${awayTeamStr}`,
                    scheduledTime: analysisTime.toLocaleString('he-IL', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: false 
                    }),
                    actualTime: analysisTime,
                    relevanceScore
                  });
                }
              }
              
              // Add live updates (at match time)
              // Try multiple ways to get team names
              const homeTeam = fixture.home_team?.name || 
                             fixture.home_team || 
                             fixture.teams?.home?.name || 
                             fixture.homeTeam?.name ||
                             fixture.homeTeam ||
                             fixture.home?.name ||
                             'Home';
              const awayTeam = fixture.away_team?.name || 
                             fixture.away_team || 
                             fixture.teams?.away?.name || 
                             fixture.awayTeam?.name ||
                             fixture.awayTeam ||
                             fixture.away?.name ||
                             'Away';
              
              // Ensure we always have strings
              const homeTeamStr = typeof homeTeam === 'string' ? homeTeam : (homeTeam?.name || 'Home');
              const awayTeamStr = typeof awayTeam === 'string' ? awayTeam : (awayTeam?.name || 'Away');
              
              todaysMatches.push({
                time: matchTime.toTimeString().slice(0, 5),
                type: 'live',
                name: 'Live Updates',
                emoji: '⚡',
                description: `${homeTeamStr} vs ${awayTeamStr}`,
                scheduledTime: matchTime.toLocaleString('he-IL', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                }),
                actualTime: matchTime,
                relevanceScore
              });
            }
          }
        });
      });
    }

    // Combine and sort all schedule items
    const allScheduleItems = [
      ...schedule.map(item => {
        const [hours, minutes] = item.time.split(':').map(Number);
        const scheduledTime = new Date(today);
        scheduledTime.setHours(hours, minutes, 0, 0);
        
        const isPast = scheduledTime < today;
        const isNext = nextScheduledContent?.time === item.time;
        
        return {
          ...item,
          isPast,
          isNext,
          scheduledTime: scheduledTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }),
          actualTime: scheduledTime,
          relevanceScore: 0
        };
      }),
      ...todaysMatches.map(match => {
        const isPast = match.actualTime < today;
        const isNext = nextScheduledContent?.type === match.type && 
                      nextScheduledContent?.scheduledTime === match.scheduledTime;
        
        return {
          ...match,
          isPast,
          isNext
        };
      })
    ];

    // Sort by time
    return allScheduleItems.sort((a, b) => a.actualTime.getTime() - b.actualTime.getTime());
  };

  // Update schedule when fixtures change
  useEffect(() => {
    if (fixtures.length > 0) {
      calculateNextScheduledContent();
    }
  }, [fixtures]);

  // Auto-refresh fixtures every 2 minutes if there are live matches
  useEffect(() => {
    const hasLiveMatches = fixtures.some(day => 
      day.fixtures.some((fixture: any) => {
        const status = fixture.fixture?.status?.short;
        return status === 'LIVE' || status === '1H' || status === '2H';
      })
    );

    let interval: NodeJS.Timeout;
    if (hasLiveMatches) {
      interval = setInterval(() => {
        console.log('🔄 Auto-refreshing live scores...');
        fetchFixtures();
      }, 120000); // 2 minutes
    }

    return () => clearInterval(interval);
  }, [fixtures]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/automation');
      const data = await response.json();
      
      if (data.success && data.rules) {
        setAutomationRules(data.rules);
        showNotification('Automation rules loaded successfully');
      } else {
        showNotification('Error loading rules', 'error');
      }
    } catch (error) {
      showNotification('Server connection error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const checkFullAutomationStatus = async () => {
    try {
      const response = await fetch('/api/automation/full-automation-status');
      const data = await response.json();
      if (data.success) {
        setIsFullAutomationEnabled(data.enabled);
      }
    } catch (error) {
      console.error('Error checking full automation status:', error);
    }
  };

  const toggleFullAutomation = async () => {
    try {
      const response = await fetch('/api/automation/toggle-full-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !isFullAutomationEnabled })
      });
      
      const data = await response.json();
      if (data.success) {
        setIsFullAutomationEnabled(!isFullAutomationEnabled);
        showNotification(
          `Full automation ${!isFullAutomationEnabled ? 'enabled' : 'disabled'} successfully!`
        );
      }
    } catch (error) {
      showNotification('Error toggling full automation', 'error');
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const createSmartRule = async (contentType: string, config: any) => {
    try {
      const response = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: config.name,
          enabled: true,
          type: 'full_auto',
          automation_type: config.automation_type,
          content_type: contentType,
          config: config
        })
      });

      const data = await response.json();
      if (data.success) {
        showNotification(`${config.name} automation created successfully!`);
        fetchRules();
      } else {
        showNotification('Error creating automation', 'error');
      }
    } catch (error) {
      showNotification('Error creating automation', 'error');
    }
  };

  const handleExecuteRule = async (ruleId: string) => {
    setExecutingRule(ruleId);
    try {
      const response = await fetch('/api/automation/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId })
      });

      const data = await response.json();
      if (data.success) {
        showNotification(`Rule executed successfully! Generated ${data.data.contentGenerated} content items`);
      } else {
        showNotification('Error executing rule', 'error');
      }
    } catch (error) {
      showNotification('Error executing rule', 'error');
    } finally {
      setExecutingRule(null);
    }
  };

  const runAutomationCycle = async () => {
    setIsRunningCycle(true);
    setCycleProgress('Starting automation cycle...');
    setCycleTimer(0);
    setCycleResults(null);
    setShowResults(false);
    setAutomationLogs([]);

    // Start timer
    const timerInterval = setInterval(() => {
      setCycleTimer(prev => prev + 1);
    }, 1000);

    try {
      // Step 1: Check automation status
      setCycleProgress('🔍 Checking automation settings...');
      addAutomationLog('Checking if full automation is enabled...');
      
      const statusResponse = await fetch('/api/automation/full-automation-status');
      const statusData = await statusResponse.json();
      addAutomationLog(`Full automation status: ${statusData.enabled ? 'ENABLED' : 'DISABLED'}`);

      if (!statusData.enabled) {
        addAutomationLog('❌ Full automation is disabled - stopping cycle');
        setCycleProgress('❌ Full automation is disabled');
        return;
      }

      // Step 2: Load automation rules
      setCycleProgress('📋 Loading automation rules...');
      addAutomationLog('Loading active automation rules...');
      
      await fetchRules();
      const activeRules = automationRules.filter(rule => rule.enabled);
      addAutomationLog(`Found ${activeRules.length} active automation rules`);

      // Step 3: Check system status
      setCycleProgress('🏥 Checking system health...');
      addAutomationLog('Checking system health and active channels...');
      
      if (activeChannels.length === 0) {
        addAutomationLog('⚠️ No active channels found - fetching channel list...');
        await fetchSystemStatus();
      }
      
      addAutomationLog(`System ready: ${activeChannels.length} active channels, ${systemStatus?.activeBots || 0} active bots`);

      // Step 4: Process automation rules
      setCycleProgress('⚙️ Processing automation rules...');
      addAutomationLog('Starting automation rule processing...');

      const executeResponse = await fetch('/api/automation/auto-scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!executeResponse.ok) {
        throw new Error(`Automation failed: ${executeResponse.statusText}`);
      }

      const results = await executeResponse.json();
      addAutomationLog(`Automation cycle completed successfully`);
      addAutomationLog(`Rules processed: ${results.results?.cycles_run || 0}`);
      addAutomationLog(`Content generated: ${results.results?.content_generated || 0}`);

      // Step 5: Display results
      setCycleProgress('✅ Automation cycle completed!');
      setCycleResults(results.results);
      setShowResults(true);

      // Add detailed results to logs
      if (results.results?.actions_taken) {
        results.results.actions_taken.forEach((action: any) => {
          const status = action.status === 'triggered' ? '✅' : action.status === 'skipped' ? '⏭️' : '❌';
          addAutomationLog(`${status} ${action.rule_name}: ${action.status}`);
          if (action.channels_targeted) {
            addAutomationLog(`   📺 Targeted channels: ${action.channels_targeted.join(', ')}`);
          }
        });
      }

    } catch (error) {
      console.error('Error running automation cycle:', error);
      setCycleProgress('❌ Automation cycle failed');
      addAutomationLog(`❌ Error: ${(error as Error).message}`);
    } finally {
      clearInterval(timerInterval);
      setIsRunningCycle(false);
    }
  };

  const triggerInstantContent = async (contentType: string) => {
    console.log(`🚀 triggerInstantContent called with: ${contentType}`);
    
    // Add visual feedback immediately
    showNotification(`🚀 Generating ${contentType} content...`, 'success');
    
    try {
      // Build URL with correct parameters - unified-content expects type in URL params  
      // Don't send target_channels to let API auto-detect active channels and their languages
      const url = `/api/unified-content?action=send_now&type=${contentType}`;
      console.log(`📡 Making request to: ${url}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          max_posts_per_channel: 1,
          include_images: true
        })
      });
      
      console.log(`📥 Response status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`📋 Response data:`, data);
      
      if (data.success) {
        showNotification(`✅ ${contentType} content sent successfully! Channels: ${data.channelsReached || 0}`, 'success');
        addAutomationLog(`✅ Content sent: ${contentType} to ${data.channelsReached || 0} channels`);
      } else {
        const errorMsg = data.error || data.message || 'Unknown error';
        showNotification(`❌ Error sending ${contentType} content: ${errorMsg}`, 'error');
        addAutomationLog(`❌ Error sending ${contentType}: ${errorMsg}`);
      }
    } catch (error) {
      console.error('❌ Error sending content:', error);
      const errorMsg = error instanceof Error ? error.message : 'Network error';
      showNotification(`❌ Network error sending ${contentType} content: ${errorMsg}`, 'error');
      addAutomationLog(`❌ Network error sending ${contentType}: ${errorMsg}`);
    }
  };

  const addAutomationLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setAutomationLogs(prev => [...prev, logMessage]);
  };

  const fetchSystemStatus = async () => {
    try {
      // Fetch active channels and bots
      const response = await fetch('/api/dashboard/stats');
      if (response.ok) {
        const stats = await response.json();
        setSystemStatus(stats);
      }

      // Fetch channel details for automation display
      const channelResponse = await fetch('/api/channels');
      if (channelResponse.ok) {
        const channelData = await channelResponse.json();
        setActiveChannels(channelData.channels?.filter((c: any) => c.is_active) || []);
      }
    } catch (error) {
      console.error('Error fetching system status:', error);
    }
  };

  // Background Scheduler functions
  const fetchSchedulerStatus = async () => {
    try {
      setIsSchedulerLoading(true);
      const response = await fetch('/api/automation/background-scheduler');
      const data = await response.json();
      
      if (data.success) {
        setSchedulerStatus(data.scheduler);
      }
    } catch (error) {
      console.error('Error fetching scheduler status:', error);
    } finally {
      setIsSchedulerLoading(false);
    }
  };

  const controlScheduler = async (action: 'start' | 'stop' | 'restart') => {
    try {
      setIsSchedulerLoading(true);
      const response = await fetch('/api/automation/background-scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        showNotification(data.message, 'success');
        await fetchSchedulerStatus(); // Refresh status
      } else {
        showNotification(data.error || 'שגיאה בשליטה על הScheduler', 'error');
      }
    } catch (error) {
      console.error('Error controlling scheduler:', error);
      showNotification('שגיאה בשליטה על הScheduler', 'error');
    } finally {
      setIsSchedulerLoading(false);
    }
  };

  // Simple relevance scoring function
  const calculateMatchRelevanceScore = (match: any): number => {
    let score = 30; // Base score for all matches
    
    // League bonuses
    const leagueName = match.league?.name?.toLowerCase() || '';
    if (leagueName.includes('champions league')) score += 50;
    else if (leagueName.includes('premier league') || leagueName.includes('primera')) score += 40;
    else if (leagueName.includes('serie a') || leagueName.includes('bundesliga') || leagueName.includes('ligue 1')) score += 35;
    else if (leagueName.includes('europa league')) score += 30;
    else if (leagueName.includes('championship') || leagueName.includes('segunda')) score += 20;
    
    // Team popularity bonuses
    const homeTeam = match.teams?.home?.name?.toLowerCase() || '';
    const awayTeam = match.teams?.away?.name?.toLowerCase() || '';
    const popularTeams = ['real madrid', 'barcelona', 'manchester united', 'manchester city', 'liverpool', 'arsenal', 'chelsea', 'tottenham', 'juventus', 'ac milan', 'inter milan', 'bayern munich', 'borussia dortmund', 'psg', 'atletico madrid'];
    
    if (popularTeams.some(team => homeTeam.includes(team) || awayTeam.includes(team))) {
      score += 20;
    }
    
    // Cap at 100%
    return Math.min(score, 100);
  };

  const fetchFixtures = async () => {
    setLoadingFixtures(true);
    try {
      console.log('🏟️ Loading next week fixtures with smart scoring...');
      
      // Get today and next 7 days
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      // Call the api-football-showcase service to get matches for the next week
      const response = await fetch('/api/api-football-showcase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_fixtures_date_range',
          from_date: today.toISOString().split('T')[0],
          to_date: nextWeek.toISOString().split('T')[0],
          limit: 50
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.matches && data.matches.length > 0) {
          console.log(`✅ Got ${data.matches.length} matches from api-football-showcase`);
          showNotification(`✅ Loaded ${data.matches.length} matches successfully`, 'success');
          
          // Group matches by date and apply smart scoring
          const groupedByDate: { [key: string]: any[] } = {};
          
          data.matches.forEach((match: any) => {
            const matchDate = match.kickoff ? 
              new Date(match.kickoff).toISOString().split('T')[0] : 
              match.fixture?.date ? 
                new Date(match.fixture.date).toISOString().split('T')[0] : 
                new Date().toISOString().split('T')[0];
            
            if (!groupedByDate[matchDate]) {
              groupedByDate[matchDate] = [];
            }
            
            // Enhanced match scoring with reasons
            const relevanceScore = match.relevance_score?.total || calculateMatchRelevanceScore(match);
            const scoringReasons = match.reasons || [];
            
            // Add enhanced data for display
            match.content_suitability = {
              live_update: relevanceScore,
              news: relevanceScore * 0.9,
              betting_tip: relevanceScore * 0.8,
              poll: relevanceScore * 0.85
            };
            
            match.relevance_score = {
              total: relevanceScore,
              competition: match.relevance_score?.competition || 5,
              teams: match.relevance_score?.teams || 3,
              timing: match.relevance_score?.timing || 6,
              rivalry: match.relevance_score?.rivalry || 0
            };
            
            match.reasons = scoringReasons.length > 0 ? scoringReasons : [
              relevanceScore >= 25 ? '🔥 High interest match' : '⚽ Regular match',
              `Competition: ${match.league?.name || 'Unknown'}`,
              `Teams: ${match.teams?.home?.name} vs ${match.teams?.away?.name}`
            ];
            
            groupedByDate[matchDate].push(match);
          });
          
          // Sort matches within each day by relevance score
          const sortedFixtures = Object.entries(groupedByDate)
            .map(([date, dayFixtures]) => ({
              date,
              fixtures: dayFixtures
                .sort((a, b) => {
                  const scoreA = a.relevance_score?.total || 0;
                  const scoreB = b.relevance_score?.total || 0;
                  return scoreB - scoreA; // High to low
                })
                .slice(0, 3) // Show only top 3 matches per day
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 7); // Next 7 days
          
          setFixtures(sortedFixtures);
          
          // Log summary
          const totalMatches = sortedFixtures.reduce((sum, day) => sum + day.fixtures.length, 0);
          console.log(`📊 Displaying ${totalMatches} top matches across ${sortedFixtures.length} days (max 3 per day)`);
          
        } else {
          console.log('⚠️ Smart service failed, trying API-Football fallback...');
      await fetchFixturesAPIFootball();
        }
      } else {
        console.log('⚠️ Smart service unavailable, trying API-Football fallback...');
        await fetchFixturesAPIFootball();
      }
      
    } catch (error) {
      console.error('❌ Error fetching smart fixtures:', error);
      showNotification('❌ Error loading smart fixtures, trying fallback...', 'error');
      // Fallback to API-Football
      await fetchFixturesAPIFootball();
    } finally {
      setLoadingFixtures(false);
    }
  };

  const fetchFixturesAPIFootball = async () => {
    try {
      // Get fixtures for next 7 days using API-Football v3
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const response = await fetch('/api/api-football-showcase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_fixtures_date_range',
          from_date: today.toISOString().split('T')[0],
          to_date: nextWeek.toISOString().split('T')[0],
          limit: 100
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.matches) {
          // Apply simple scoring and group matches by date
          const groupedByDate: { [key: string]: any[] } = {};
          
          data.matches.forEach((match: any) => {
            const matchDate = match.kickoff ? 
              new Date(match.kickoff).toISOString().split('T')[0] : 
              match.fixture?.date ? 
                new Date(match.fixture.date).toISOString().split('T')[0] : 
                new Date().toISOString().split('T')[0];
            
            if (!groupedByDate[matchDate]) {
              groupedByDate[matchDate] = [];
            }
            
            // Apply basic intelligence scoring
            const relevanceScore = calculateMatchRelevanceScore(match);
            match.content_suitability = {
              live_update: relevanceScore
            };
            match.relevance_score = {
              total: relevanceScore
            };
            
            groupedByDate[matchDate].push(match);
          });
          
          // Convert to array format and sort by relevance score
          const sortedFixtures = Object.entries(groupedByDate)
            .map(([date, dayFixtures]) => ({
              date,
              fixtures: dayFixtures
                .sort((a, b) => {
                  const scoreA = a.content_suitability?.live_update || 0;
                  const scoreB = b.content_suitability?.live_update || 0;
                  return scoreB - scoreA;
                })
                .slice(0, 8) // Max 8 fixtures per day
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 7); // Max 7 days
          
          setFixtures(sortedFixtures);
        } else {
          // Final fallback to debug endpoint
          await fetchFixturesDebug();
        }
      } else {
        // Final fallback to debug endpoint
        await fetchFixturesDebug();
      }
    } catch (error) {
      console.error('Error fetching API-Football fixtures:', error);
      // Final fallback to debug endpoint
      await fetchFixturesDebug();
    }
  };

  const fetchFixturesDebug = async () => {
    try {
      const response = await fetch('/api/api-football-showcase?feature=smart-matches&content_type=analysis&max_results=20');
      if (response.ok) {
        const data = await response.json();
        // Get fixtures for next 7 days
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        const allFixtures = [];
        if (data.success && data.data && data.data.bestMatches) {
          // Process smart matches from api-football-showcase
          const matches = data.data.bestMatches;
          const groupedByDate: { [key: string]: any[] } = {};
          
          matches.forEach((matchDetail: any) => {
            const match = matchDetail.match;
            if (match && match.kickoff) {
              const matchDate = new Date(match.kickoff).toISOString().split('T')[0];
              if (!groupedByDate[matchDate]) {
                groupedByDate[matchDate] = [];
              }
              groupedByDate[matchDate].push({
                ...match,
                contentSuitability: matchDetail.contentSuitability,
                scoringReasons: matchDetail.scoringReasons
              });
            }
          });
          
          for (const [date, dayFixtures] of Object.entries(groupedByDate)) {
            const fixtureDate = new Date(date);
            if (fixtureDate >= now && fixtureDate <= nextWeek) {
              allFixtures.push({
                date,
                fixtures: dayFixtures
              });
            }
          }
        }
        
        // Sort by date and limit to important leagues
        const sortedFixtures = allFixtures
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .map(day => ({
            ...day,
            fixtures: day.fixtures
              .filter((f: any) => f.league?.name && f.teams?.home?.name && f.teams?.away?.name)
              .slice(0, 8) // Max 8 fixtures per day
          }))
          .slice(0, 7); // Max 7 days
        
        setFixtures(sortedFixtures);
      }
    } catch (error) {
      console.error('Error fetching debug fixtures:', error);
      setFixtures([]);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || (!isManager && !isSuperAdmin)) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">Access Denied</h1>
          <p className="text-gray-500">Manager permissions required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Smart Automation Center</h1>
          <p className="text-gray-600 mt-2">Intelligent content automation based on match events and schedules</p>
          {isSuperAdmin && (
            <Badge className="mt-2 bg-purple-100 text-purple-800">Super Admin</Badge>
          )}
        </div>
        
        {/* Current Time and Full Automation Toggle */}
        <div className="flex items-center gap-6">
          {/* Current Time Display */}
          <div className="text-center">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Clock className="w-4 h-4" />
              <span>Automation Time</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-mono font-bold text-blue-600">
                {currentTime.toLocaleTimeString('he-IL', { 
                  hour12: false, 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit' 
                })}
              </div>
              <div className="text-xs text-gray-400">
                {currentTime.toLocaleDateString('he-IL', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
          
          {/* Full Automation Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Full Automation</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullAutomation}
              className={`p-1 ${isFullAutomationEnabled ? 'text-green-600' : 'text-gray-400'}`}
            >
              {isFullAutomationEnabled ? (
                <ToggleRight className="w-8 h-8" />
              ) : (
                <ToggleLeft className="w-8 h-8" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`mb-6 p-4 rounded-lg relative ${
          notification.includes('Error') || notification.includes('❌') 
            ? 'bg-red-100 text-red-700 border border-red-200' 
            : 'bg-green-100 text-green-700 border border-green-200'
        }`}>
          <div className="flex justify-between items-center">
            <span>{notification}</span>
            <button 
              onClick={() => setNotification(null)}
              className="ml-4 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {/* 🤖 Compact Background Scheduler Control */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">Auto Scheduler</span>
            <div className={`w-2 h-2 rounded-full ${
              schedulerStatus?.isRunning ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="text-xs text-gray-600">
              {schedulerStatus?.isRunning ? 'Running' : 'Stopped'}
            </span>
          </div>
          
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => controlScheduler('start')}
              disabled={isSchedulerLoading || schedulerStatus?.isRunning}
              className="h-7 px-2 text-green-600 hover:text-green-700"
            >
              <Play className="w-3 h-3" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => controlScheduler('stop')}
              disabled={isSchedulerLoading || !schedulerStatus?.isRunning}
              className="h-7 px-2 text-red-600 hover:text-red-700"
            >
              <Square className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* 🕐 Compact Schedule Monitor */}
      <div className="mb-6 grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Current Time Widget */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-xl font-mono font-bold text-blue-800">
                  {currentTime.toLocaleTimeString('he-IL', { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit',
                    hour12: false 
                  })}
                </div>
                <div className="text-xs text-gray-600">
                  {currentTime.toLocaleDateString('he-IL', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Scheduled */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {nextScheduledContent && (
                  <>
                    <span className="text-2xl">{nextScheduledContent.emoji}</span>
                    <div>
                      <div className="font-semibold text-green-800 text-sm">{nextScheduledContent.name}</div>
                      <div className="text-xs text-gray-600">at {nextScheduledContent.scheduledTime}</div>
                      {nextScheduledContent.match && (
                        <div className="text-xs text-green-700 font-medium truncate max-w-24">
                          {nextScheduledContent.match}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Next in:</div>
                <div className="text-lg font-mono font-bold text-green-600">
                  {nextScheduledContent?.timeUntil || '--:--'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Progress */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-semibold text-blue-800 text-sm">Daily Progress</div>
                  <div className="text-xs text-gray-600">
                    {(() => {
                      const schedule = getTodaysSchedule();
                      const completedItems = schedule.filter(item => item.isPast).length;
                      const totalItems = schedule.length;
                      const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
                      
                      return `${completedItems}/${totalItems} items completed`;
                    })()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Progress:</div>
                <div className="text-lg font-mono font-bold text-blue-600">
                  {(() => {
                    const schedule = getTodaysSchedule();
                    const completedItems = schedule.filter(item => item.isPast).length;
                    const totalItems = schedule.length;
                    const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
                    
                    return `${percentage}%`;
                  })()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Matches Widget */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">⚽</span>
              <div className="font-semibold text-orange-800 text-sm">Today's Matches</div>
            </div>
            <div className="space-y-2 max-h-16 overflow-y-auto">
              {(() => {
                const today = new Date();
                const todayDate = today.toISOString().split('T')[0];
                
                
                // Find today's matches
                const todaysMatches = fixtures.flatMap(day => 
                  day.date === todayDate ? day.fixtures.slice(0, 2) : []
                );
                
                
                // If no matches today, show next matches
                if (todaysMatches.length === 0) {
                  const nextMatches = fixtures.flatMap(day => 
                    day.date > todayDate ? day.fixtures.slice(0, 2) : []
                  ).slice(0, 2);
                  
                  
                  if (nextMatches.length > 0) {
                    return (
                      <div className="space-y-2">
                        <div className="text-xs text-orange-600 font-medium">Next matches:</div>
                        {nextMatches.map((fixture: any, index: number) => {
                          
                          // Try multiple ways to get team names
                          const homeTeam = fixture.home_team?.name || 
                                         fixture.home_team || 
                                         fixture.teams?.home?.name || 
                                         fixture.homeTeam?.name ||
                                         fixture.homeTeam ||
                                         fixture.home?.name ||
                                         'Home';
                          const awayTeam = fixture.away_team?.name || 
                                         fixture.away_team || 
                                         fixture.teams?.away?.name || 
                                         fixture.awayTeam?.name ||
                                         fixture.awayTeam ||
                                         fixture.away?.name ||
                                         'Away';
                          
                          // Ensure we always have strings
                          const homeTeamStr = typeof homeTeam === 'string' ? homeTeam : (homeTeam?.name || 'Home');
                          const awayTeamStr = typeof awayTeam === 'string' ? awayTeam : (awayTeam?.name || 'Away');
                          
                          // Try multiple ways to get match time
                          const matchTime = fixture.kickoff || 
                                          fixture.fixture?.date || 
                                          fixture.date ||
                                          fixture.datetime;
                          
                          return (
                            <div key={index} className="text-xs">
                              <div className="font-medium text-orange-900 truncate">
                                {homeTeamStr} vs {awayTeamStr}
                              </div>
                              <div className="text-orange-600">
                                {matchTime ? 
                                  new Date(matchTime).toLocaleString('he-IL', { 
                                    weekday: 'short',
                                    hour: '2-digit', 
                                    minute: '2-digit',
                                    hour12: false 
                                  }) : 
                                  'TBD'
                                }
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                  return <div className="text-xs text-gray-500">No matches scheduled</div>;
                }
                
                // Show today's matches
                return todaysMatches.map((fixture: any, index: number) => {
                  
                  // Try multiple ways to get team names
                  const homeTeam = fixture.home_team?.name || 
                                 fixture.home_team || 
                                 fixture.teams?.home?.name || 
                                 fixture.homeTeam?.name ||
                                 fixture.homeTeam ||
                                 fixture.home?.name ||
                                 'Home';
                  const awayTeam = fixture.away_team?.name || 
                                 fixture.away_team || 
                                 fixture.teams?.away?.name || 
                                 fixture.awayTeam?.name ||
                                 fixture.awayTeam ||
                                 fixture.away?.name ||
                                 'Away';
                  
                  // Ensure we always have strings
                  const homeTeamStr = typeof homeTeam === 'string' ? homeTeam : (homeTeam?.name || 'Home');
                  const awayTeamStr = typeof awayTeam === 'string' ? awayTeam : (awayTeam?.name || 'Away');
                  
                  // Try multiple ways to get match time
                  const matchTime = fixture.kickoff || 
                                  fixture.fixture?.date || 
                                  fixture.date ||
                                  fixture.datetime;
                  
                  return (
                    <div key={index} className="text-xs">
                      <div className="font-medium text-orange-900 truncate">
                        {homeTeamStr} vs {awayTeamStr}
                      </div>
                      <div className="text-orange-600">
                        {matchTime ? 
                          new Date(matchTime).toLocaleString('he-IL', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: false 
                          }) : 
                          'TBD'
                        }
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* System Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="text-2xl">🏥</div>
            <div>
              <h2 className="text-lg font-semibold">System Status</h2>
              <p className="text-sm text-gray-600 font-normal">Current system health and active components</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{activeChannels.length}</div>
            <div className="text-sm text-blue-800">Active Channels</div>
            {activeChannels.length > 0 && (
              <div className="text-xs text-blue-600 mt-1">
                Languages: {[...new Set(activeChannels.map(c => c.language))].join(', ')}
              </div>
            )}
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{systemStatus?.activeBots || 0}</div>
            <div className="text-sm text-green-800">Active Bots</div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">{automationRules.filter(r => r.enabled).length}</div>
            <div className="text-sm text-purple-800">Active Rules</div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600">
              {isFullAutomationEnabled ? '✅' : '❌'}
            </div>
            <div className="text-sm text-orange-800">
              {isFullAutomationEnabled ? 'Auto Enabled' : 'Auto Disabled'}
            </div>
          </div>
        </div>
        </CardContent>
      </Card>

      {/* Active Channels Display */}
      {activeChannels.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📺 Active Channels</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeChannels.map((channel, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="font-medium text-gray-900">{channel.name}</div>
                <div className="text-sm text-gray-600">{channel.telegram_channel_id}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Language: {channel.language?.toUpperCase() || 'EN'} • 
                  Bot: {channel.bot_name || 'Unknown'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fixture Timetable */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-2xl">⚽</div>
              <div>
                <h2 className="text-lg font-semibold">Live Matches & Fixtures</h2>
                <p className="text-sm text-gray-600 font-normal">Smart match scoring and content suitability</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={fetchFixtures}
                disabled={loadingFixtures}
                variant="outline"
                size="sm"
              >
                {loadingFixtures ? 'Loading...' : 'Load Fixtures'}
              </Button>
              <Button
                onClick={runAutomationCycle}
                disabled={isRunningCycle}
                size="sm"
              >
                {isRunningCycle ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Running...</span>
                  </div>
                ) : (
                  <>🚀 Run Cycle</>
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
        
        {loadingFixtures ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-sm text-gray-500">Loading smart fixtures...</p>
          </div>
        ) : fixtures.length > 0 ? (
          <div className="max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-2 text-sm">
              {fixtures.map((day, dayIndex) => (
                <div key={dayIndex} className="border border-gray-300 rounded">
                  {/* Date Header */}
                  <div className="bg-gray-100 px-3 py-2 border-b border-gray-300 text-center font-medium">
                    <div className="text-xs text-gray-600">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="font-bold">
                      {new Date(day.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                  
                  {/* Top 3 Matches */}
                  <div className="p-2 space-y-2">
                    {day.fixtures.slice(0, 3).map((fixture: any, fixtureIndex: number) => {
                      const relevanceScore = fixture.content_suitability?.live_update || fixture.relevance_score?.total || 0;
                      const isLive = fixture.fixture?.status?.short === 'LIVE' || fixture.fixture?.status?.short === '1H' || fixture.fixture?.status?.short === '2H';
                      const isFinished = fixture.fixture?.status?.short === 'FT' || fixture.fixture?.status?.short === 'AET' || fixture.fixture?.status?.short === 'PEN';
                      // Try multiple score sources for better compatibility
                      const homeScore = fixture.goals?.home ?? fixture.score?.home ?? fixture.score?.fulltime?.home ?? 
                                       fixture.result?.home ?? null;
                      const awayScore = fixture.goals?.away ?? fixture.score?.away ?? fixture.score?.fulltime?.away ?? 
                                       fixture.result?.away ?? null;
                      // Show score if we have valid scores (including 0-0)
                      const hasScore = homeScore !== null && awayScore !== null && 
                                      typeof homeScore === 'number' && typeof awayScore === 'number';
                      
                      return (
                        <div key={fixtureIndex} className={`p-2 rounded text-xs border-l-2 ${
                          isLive ? 'bg-green-50 border-green-500' : 
                          isFinished ? 'bg-blue-50 border-blue-500' : 
                          'bg-gray-50 border-gray-300'
                        }`}>
                          {/* Team Names - Compact horizontal layout */}
                          <div className="font-medium text-gray-800 mb-1 flex items-center justify-center gap-1">
                            <span className="truncate max-w-[35%] text-right" title={fixture.homeTeam?.name || fixture.teams?.home?.name}>
                              {(fixture.homeTeam?.name || fixture.teams?.home?.name)?.length > 12 ? 
                                (fixture.homeTeam?.name || fixture.teams?.home?.name)?.substring(0, 12) + '...' : 
                                fixture.homeTeam?.name || fixture.teams?.home?.name}
                            </span>
                            <span className="text-gray-400 text-xs">vs</span>
                            <span className="truncate max-w-[35%] text-left" title={fixture.awayTeam?.name || fixture.teams?.away?.name}>
                              {(fixture.awayTeam?.name || fixture.teams?.away?.name)?.length > 12 ? 
                                (fixture.awayTeam?.name || fixture.teams?.away?.name)?.substring(0, 12) + '...' : 
                                fixture.awayTeam?.name || fixture.teams?.away?.name}
                            </span>
                          </div>
                          
                          {/* Score or Time */}
                          <div className="text-center mb-1">
                            {hasScore ? (
                              <div className={`font-bold ${
                                isLive ? 'text-green-700' : 
                                isFinished ? 'text-blue-700' : 
                                'text-gray-700'
                              }`}>
                                {homeScore} - {awayScore}
                                {isLive && (
                                  <div className="text-xs bg-red-500 text-white px-1 rounded mt-1">
                                    LIVE
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-gray-500">
                                {fixture.fixture?.date ? 
                                  new Date(fixture.fixture.date).toLocaleTimeString('en-US', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  }) : 
                                  'TBD'
                                }
                              </div>
                            )}
                          </div>
                          
                          {/* League */}
                          <div className="text-xs text-gray-500 text-center truncate mb-1">
                            {fixture.competition?.name || fixture.league?.name}
                          </div>
                          
                          {/* Match Status */}
                          <div className="text-xs text-gray-600 text-center mb-1">
                            {fixture.fixture?.status?.long || fixture.fixture?.status?.short || 'Scheduled'}
                          </div>
                          
                          {/* Round/Stage Info */}
                          {fixture.league?.round && (
                            <div className="text-xs text-gray-400 text-center mt-1 truncate">
                              {fixture.league.round}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                    {/* Show additional matches count */}
                    {day.fixtures.length > 3 && (
                      <div className="text-center text-xs text-gray-500 mt-2">
                        +{day.fixtures.length - 3} more
                      </div>
                    )}
                    
                    {/* Empty state for days with no matches */}
                    {day.fixtures.length === 0 && (
                      <div className="text-center text-xs text-gray-400 py-4">
                        No matches
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="mb-2">No fixtures found for the next week</p>
            <p className="text-sm text-gray-400 mb-4">
              Click "Load Fixtures" to fetch the latest match data from API-Football
            </p>
            <div className="flex justify-center gap-2">
              <Button onClick={fetchFixtures} size="sm" variant="outline">
                🔄 Refresh Data
              </Button>
              <Button onClick={() => window.location.reload()} size="sm" variant="ghost">
                🔃 Reload Page
              </Button>
            </div>
          </div>
        )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Instant Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(SMART_CONTENT_CONFIG).map(([key, config]) => (
              <Button
                key={key}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center hover:bg-blue-50 transition-colors"
                onClick={() => {
                  console.log(`🖱️ Button clicked for content type: ${key}`);
                  alert(`Button clicked: ${config.name} (${key})`);
                  triggerInstantContent(key);
                }}
              >
                <span className="text-2xl mb-1">{config.emoji}</span>
                <span className="text-xs text-center">{config.name}</span>
              </Button>
            ))}
            </div>
          </CardContent>
        </Card>

      {/* Smart Automation Setup */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Smart Automation Setup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            
            {/* Event-Driven Content */}
              <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Event-Driven Content (Match-Based)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(SMART_CONTENT_CONFIG)
                  .filter(([_, config]) => config.automation_type === 'event_driven')
                  .map(([key, config]) => (
                    <div key={key} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{config.emoji}</span>
                          <span className="font-medium">{config.name}</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => createSmartRule(key, config)}
                          disabled={automationRules.some(r => r.content_type === key)}
                        >
                          {automationRules.some(r => r.content_type === key) ? 'Active' : 'Enable'}
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{config.description}</p>
                      <div className="flex items-center gap-2">
                        <Info className="w-3 h-3 text-blue-500" />
                        <span className="text-xs text-blue-600">
                          {'timing' in config && config.timing === 'before_match' && 'hours_before' in config && 'min_importance' in config && `${config.hours_before} hours before ${config.min_importance} matches`}
                          {'timing' in config && config.timing === 'during_match' && 'update_frequency' in config && `Every ${config.update_frequency} minutes during live matches`}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Scheduled Content */}
              <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Scheduled Content (Time-Based)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(SMART_CONTENT_CONFIG)
                  .filter(([_, config]) => config.automation_type === 'scheduled')
                  .map(([key, config]) => (
                    <div key={key} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{config.emoji}</span>
                          <span className="font-medium">{config.name}</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => createSmartRule(key, config)}
                          disabled={automationRules.some(r => r.content_type === key)}
                        >
                          {automationRules.some(r => r.content_type === key) ? 'Active' : 'Enable'}
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{config.description}</p>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-600">
                          {'times' in config ? config.times?.join(', ') : ''}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Context-Aware Content */}
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Context-Aware Content
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {Object.entries(SMART_CONTENT_CONFIG)
                  .filter(([_, config]) => config.automation_type === 'context_aware')
                  .map(([key, config]) => (
                    <div key={key} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{config.emoji}</span>
                          <span className="font-medium">{config.name}</span>
      </div>
        <Button 
                          size="sm"
                          onClick={() => createSmartRule(key, config)}
                          disabled={automationRules.some(r => r.content_type === key)}
                        >
                          {automationRules.some(r => r.content_type === key) ? 'Active' : 'Enable'}
        </Button>
      </div>
                      <p className="text-sm text-gray-600 mb-2">{config.description}</p>
                      <div className="flex items-center gap-2">
                        <Users className="w-3 h-3 text-purple-500" />
                        <span className="text-xs text-purple-600">
                          {'probability' in config && config.probability 
                            ? `Probability: News ${(config.probability?.news || 0) * 100}%, Analysis ${(config.probability?.analysis || 0) * 100}%, Betting ${(config.probability?.betting || 0) * 100}%`
                            : 'Context-aware triggering'
                          }
                        </span>
                </div>
                    </div>
                  ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

      {/* Active Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Active Automation Rules ({automationRules.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
          {automationRules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No active automation rules</p>
              <p className="text-sm mt-2">Enable smart automation above to get started</p>
            </div>
          ) : (
              <div className="space-y-4">
              {automationRules.map((rule) => (
                <div 
                  key={rule.id} 
                  className={`border rounded-lg p-4 ${rule.enabled ? 'bg-green-50' : 'bg-gray-50'}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{rule.name}</h3>
                      <div className="flex gap-2 mt-2">
                        <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                          {rule.enabled ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">
                          {rule.automation_type?.replace('_', ' ')}
                      </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleExecuteRule(rule.id)}
                        disabled={executingRule === rule.id}
                      >
                        {executingRule === rule.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        Test Now
                      </Button>
                    </div>
                  </div>

                  {rule.next_run && (
                    <div className="mt-4 text-sm text-gray-600">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Next run: {new Date(rule.next_run).toLocaleString('en-US')}
        </div>
      )}

                  {rule.stats && (
                    <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold">{rule.stats.totalRuns}</div>
                        <div className="text-gray-600">Runs</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{rule.stats.successRate}%</div>
                        <div className="text-gray-600">Success</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{rule.stats.contentGenerated}</div>
                        <div className="text-gray-600">Content Generated</div>
                      </div>
                  </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Manual Testing */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🧪 Manual Testing & Execution</h2>
        
        <div className="space-y-4">
          <button
            onClick={runAutomationCycle}
            disabled={isRunningCycle}
            className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
              isRunningCycle
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isRunningCycle ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Running Automation Cycle...</span>
              </div>
            ) : (
              '🚀 Run Automation Cycle Now'
            )}
          </button>

          {/* Enhanced Progress Display with Real-time Logs */}
          {isRunningCycle && (
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="animate-pulse h-3 w-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-800 font-medium">{cycleProgress}</span>
                  <span className="text-blue-600 font-mono text-sm">{formatTime(cycleTimer)}</span>
            </div>
            
                {/* Real-time Logs */}
                {automationLogs.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-sm font-medium text-gray-700 mb-2">📋 Automation Logs:</div>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {automationLogs.slice(-10).map((log, index) => (
                        <div 
                          key={index} 
                          className="text-xs font-mono text-gray-600 bg-gray-50 rounded px-2 py-1 animate-fadeIn"
                        >
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Enhanced Results Display */}
          {showResults && cycleResults && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">🎯 Automation Results</h3>
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{cycleResults.cycles_run}</div>
                  <div className="text-xs text-green-700">Rules Processed</div>
                    </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{cycleResults.content_generated}</div>
                  <div className="text-xs text-green-700">Content Generated</div>
                    </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{cycleResults.actions_taken.length}</div>
                  <div className="text-xs text-green-700">Total Actions</div>
                  </div>
              </div>
              
              {/* Action Details */}
              {cycleResults.actions_taken.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-green-700">📋 Action Details:</div>
                  {cycleResults.actions_taken.map((action, index) => (
                    <div key={index} className="text-xs bg-white rounded p-2 border border-green-200">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{action.rule_name}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          action.status === 'triggered' ? 'bg-green-100 text-green-800' :
                          action.status === 'skipped' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {action.status}
                        </span>
                      </div>
                      {action.channels_targeted && (
                        <div className="text-gray-600 mt-1">
                          📺 Channels: {action.channels_targeted.join(', ')}
              </div>
                      )}
                      {action.trigger_reason && (
                        <div className="text-gray-500 mt-1">
                          💡 Reason: {action.trigger_reason}
        </div>
      )}
              </div>
                  ))}
              </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Automation Logs */}
      <div className="mt-8 bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="font-semibold text-gray-800 mb-3">Automation Logs</h4>
        <div className="max-h-60 overflow-y-auto pr-2">
          {automationLogs.map((log, index) => (
            <p key={index} className="text-sm text-gray-700 mb-1 last:mb-0">
              {log}
            </p>
          ))}
            </div>
          </div>
    </div>
  );
}