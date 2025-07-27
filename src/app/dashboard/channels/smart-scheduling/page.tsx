'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Plus, Edit, Trash, Play, Pause } from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  language: string;
  telegram_channel_id: string;
  is_active: boolean;
}

interface ContentSchedule {
  id: string;
  channel_id: string;
  schedule_name: string;
  day_of_week: number | null;
  hour: number;
  minute: number;
  content_type: string;
  content_priority: number;
  is_active: boolean;
  timezone: string;
  delay_minutes_range: number[];
  next_execution: string;
  last_executed: string | null;
  channels: Channel;
}

const CONTENT_TYPES = [
  { value: 'news', label: 'חדשות', emoji: '📰', color: 'bg-blue-100 text-blue-800' },
  { value: 'betting', label: 'טיפים', emoji: '🎯', color: 'bg-green-100 text-green-800' },
  { value: 'analysis', label: 'ניתוח', emoji: '📊', color: 'bg-purple-100 text-purple-800' },
  { value: 'polls', label: 'סקרים', emoji: '🗳️', color: 'bg-orange-100 text-orange-800' },
  { value: 'live', label: 'עדכונים חיים', emoji: '⚡', color: 'bg-red-100 text-red-800' },
  { value: 'coupons', label: 'קופונים', emoji: '🎫', color: 'bg-yellow-100 text-yellow-800' }
];

const DAYS_OF_WEEK = [
  { value: null, label: 'יומי' },
  { value: 0, label: 'ראשון' },
  { value: 1, label: 'שני' },
  { value: 2, label: 'שלישי' },
  { value: 3, label: 'רביעי' },
  { value: 4, label: 'חמישי' },
  { value: 5, label: 'שישי' },
  { value: 6, label: 'שבת' }
];

export default function SmartSchedulingPage() {
  const [schedules, setSchedules] = useState<ContentSchedule[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ContentSchedule>>({
    day_of_week: null,
    hour: 9,
    minute: 0,
    content_type: 'news',
    content_priority: 5,
    delay_minutes_range: [0, 30],
    schedule_name: 'New Schedule'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [schedulesRes, channelsRes] = await Promise.all([
        fetch('/api/content-schedules'),
        fetch('/api/channels')
      ]);
      
      if (schedulesRes.ok && channelsRes.ok) {
        const schedulesData = await schedulesRes.json();
        const channelsData = await channelsRes.json();
        
        setSchedules(schedulesData.data || []);
        setChannels(channelsData.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getContentTypeInfo = (type: string) => {
    return CONTENT_TYPES.find(ct => ct.value === type) || CONTENT_TYPES[0];
  };

  const getDayLabel = (dayOfWeek: number | null) => {
    const day = DAYS_OF_WEEK.find(d => d.value === dayOfWeek);
    return day ? day.label : 'יומי';
  };

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const formatNextExecution = (nextExecution: string) => {
    const date = new Date(nextExecution);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    
    if (diffMs < 0) return 'עבר';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours < 24) {
      return `בעוד ${diffHours}ש ${diffMinutes}ד`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `בעוד ${diffDays} ימים`;
    }
  };

  const toggleSchedule = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/content-schedules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !isActive })
      });
      
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error toggling schedule:', error);
    }
  };

  const startEdit = (schedule: ContentSchedule) => {
    setEditingId(schedule.id);
    setEditForm({
      day_of_week: schedule.day_of_week,
      hour: schedule.hour,
      minute: schedule.minute,
      content_type: schedule.content_type,
      content_priority: schedule.content_priority,
      schedule_name: schedule.schedule_name,
      delay_minutes_range: schedule.delay_minutes_range
    });
  };

  const saveSchedule = async () => {
    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId 
        ? { id: editingId, ...editForm }
        : { ...editForm };
        
      const response = await fetch('/api/content-schedules', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (response.ok) {
        setEditingId(null);
        setShowAddForm(false);
        setEditForm({
          day_of_week: null,
          hour: 9,
          minute: 0,
          content_type: 'news',
          content_priority: 5,
          delay_minutes_range: [0, 30],
          schedule_name: 'New Schedule'
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
    }
  };

  const deleteSchedule = async (id: string) => {
    if (!confirm('בטוח שברצונך למחוק את התזמון?')) return;
    
    try {
      const response = await fetch('/api/content-schedules', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="text-lg">טוען תזמונים חכמים...</div>
        </div>
      </div>
    );
  }

  // Group schedules by channel
  const schedulesByChannel = schedules.reduce((acc, schedule) => {
    const channelId = schedule.channel_id;
    if (!acc[channelId]) {
      acc[channelId] = [];
    }
    acc[channelId].push(schedule);
    return acc;
  }, {} as Record<string, ContentSchedule[]>);

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">📅 תזמון תוכן חכם</h1>
            <p className="text-gray-600">קבע בדיוק איזה תוכן ירוץ מתי לכל ערוץ</p>
          </div>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            הוסף תזמון
          </Button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingId) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {editingId ? 'עריכת תזמון' : 'הוספת תזמון חדש'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">ערוץ</label>
                <select
                  className="w-full p-2 border rounded"
                  value={editForm.channel_id || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, channel_id: e.target.value }))}
                  disabled={!!editingId}
                >
                  <option value="">בחר ערוץ</option>
                  {channels.map(channel => (
                    <option key={channel.id} value={channel.id}>
                      {channel.name} ({channel.language})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">שם התזמון</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={editForm.schedule_name || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, schedule_name: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">יום בשבוע</label>
                <select
                  className="w-full p-2 border rounded"
                  value={editForm.day_of_week === null ? 'null' : editForm.day_of_week?.toString()}
                  onChange={(e) => setEditForm(prev => ({ 
                    ...prev, 
                    day_of_week: e.target.value === 'null' ? null : parseInt(e.target.value)
                  }))}
                >
                  {DAYS_OF_WEEK.map(day => (
                    <option key={day.value || 'null'} value={day.value || 'null'}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">שעה</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    className="w-1/2 p-2 border rounded"
                    value={editForm.hour || 0}
                    onChange={(e) => setEditForm(prev => ({ ...prev, hour: parseInt(e.target.value) }))}
                  />
                  <input
                    type="number"
                    min="0"
                    max="59"
                    className="w-1/2 p-2 border rounded"
                    value={editForm.minute || 0}
                    onChange={(e) => setEditForm(prev => ({ ...prev, minute: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">סוג תוכן</label>
                <select
                  className="w-full p-2 border rounded"
                  value={editForm.content_type || 'news'}
                  onChange={(e) => setEditForm(prev => ({ ...prev, content_type: e.target.value }))}
                >
                  {CONTENT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.emoji} {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">עדיפות (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="w-full p-2 border rounded"
                  value={editForm.content_priority || 5}
                  onChange={(e) => setEditForm(prev => ({ ...prev, content_priority: parseInt(e.target.value) }))}
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <Button onClick={saveSchedule}>
                {editingId ? 'עדכן' : 'הוסף'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditingId(null);
                  setShowAddForm(false);
                }}
              >
                ביטול
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedules by Channel */}
      <div className="space-y-6">
        {Object.entries(schedulesByChannel).map(([channelId, channelSchedules]) => {
          const channel = channelSchedules[0]?.channels;
          if (!channel) return null;
          
          return (
            <Card key={channelId}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>{channel.name}</span>
                    <Badge variant="outline">{channel.language.toUpperCase()}</Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    {channelSchedules.length} תזמונים
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="grid gap-3">
                  {channelSchedules.map(schedule => {
                    const contentType = getContentTypeInfo(schedule.content_type);
                    
                    return (
                      <div key={schedule.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge className={contentType.color}>
                            {contentType.emoji} {contentType.label}
                          </Badge>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4" />
                            <span>{getDayLabel(schedule.day_of_week)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4" />
                            <span>{formatTime(schedule.hour, schedule.minute)}</span>
                          </div>
                          
                          <div className="text-sm text-gray-500">
                            {formatNextExecution(schedule.next_execution)}
                          </div>
                          
                          {schedule.last_executed && (
                            <div className="text-xs text-gray-400">
                              רץ לאחרונה: {new Date(schedule.last_executed).toLocaleDateString('he-IL')}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleSchedule(schedule.id, schedule.is_active)}
                          >
                            {schedule.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(schedule)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteSchedule(schedule.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {schedules.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">אין תזמונים</h3>
            <p className="text-gray-500 mb-4">
              התחל ליצור תזמונים חכמים לערוצים שלך
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              הוסף תזמון ראשון
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 