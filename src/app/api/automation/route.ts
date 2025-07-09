import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { RuleExecutor } from '@/lib/automation/rule-executor'

interface AutomationRule {
  id?: string
  name: string
  enabled: boolean
  type: 'full_auto' | 'manual_approval'
  automation_type?: 'scheduled' | 'event_driven' | 'context_aware' | 'full_automation'
  content_type?: string
  config?: any
  schedule?: {
    frequency: 'hourly' | 'daily' | 'weekly' | 'custom'
    times: string[]
    days?: string[]
  }
  contentTypes?: string[]
  languages?: string[]
  channels?: string[]
  conditions?: {
    minMatchAvailability?: boolean
    weatherConditions?: string[]
    targetAudience?: string
  }
  organization_id?: string
}

// GET - קבלת חוקי אוטומציה
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('org_id') || '00000000-0000-0000-0000-000000000001' // Default org for now

    const { data: rules, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching automation rules:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch automation rules' 
      }, { status: 500 })
    }

    // חישוב סטטיסטיקות לכל חוק
    const rulesWithStats = rules?.map(rule => ({
      ...rule,
      stats: {
        totalRuns: 0, // Will be calculated separately
        successRate: 0, // Will be calculated separately  
        contentGenerated: 0 // Will be calculated separately
      },
      // חישוב זמן ההרצה הבאה
      nextRun: calculateNextRun(rule.schedule, rule.enabled, rule.automation_type)
    })) || []

    return NextResponse.json({
      success: true,
      rules: rulesWithStats,
      total: rulesWithStats.length
    })

  } catch (error) {
    console.error('🚨 Automation API Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// POST - יצירת חוק אוטומציה חדש
export async function POST(request: NextRequest) {
  try {
    const body: AutomationRule = await request.json()
    
    // ולידציה בסיסית - שונה לתמוך בlogic החדש
    if (!body.name) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: name'
      }, { status: 400 })
    }

    // אם יש contentTypes זה הAPI הישן, אם יש content_type זה החדש
    const contentTypes = body.contentTypes || (body.content_type ? [body.content_type] : [])
    
    const ruleData = {
      name: body.name,
      enabled: body.enabled ?? true,
      type: body.type || 'manual_approval',
      automation_type: body.automation_type || 'scheduled',
      content_type: body.content_type || (body.contentTypes?.[0]),
      config: body.config || {},
      schedule: body.schedule || { frequency: 'daily', times: ['09:00'] },
      content_types: contentTypes,
      languages: body.languages || ['en'],
      channels: body.channels || [],
      conditions: body.conditions || {},
      organization_id: body.organization_id || '00000000-0000-0000-0000-000000000001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: newRule, error } = await supabase
      .from('automation_rules')
      .insert(ruleData)
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating automation rule:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to create automation rule'
      }, { status: 500 })
    }

    console.log('✅ Created new automation rule:', newRule.name)

    return NextResponse.json({
      success: true,
      rule: {
        ...newRule,
        stats: { totalRuns: 0, successRate: 0, contentGenerated: 0 },
        nextRun: calculateNextRun(newRule.schedule, newRule.enabled, newRule.automation_type)
      },
      message: 'Automation rule created successfully'
    })

  } catch (error) {
    console.error('🚨 Create automation rule error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// PUT - עדכון חוק אוטומציה
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Rule ID is required'
      }, { status: 400 })
    }

    const { data: updatedRule, error } = await supabase
      .from('automation_rules')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating automation rule:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to update automation rule'
      }, { status: 500 })
    }

    console.log('✅ Updated automation rule:', updatedRule.name)

    return NextResponse.json({
      success: true,
      rule: updatedRule,
      message: 'Automation rule updated successfully'
    })

  } catch (error) {
    console.error('🚨 Update automation rule error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// DELETE - מחיקת חוק אוטומציה
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Rule ID is required'
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('automation_rules')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('❌ Error deleting automation rule:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to delete automation rule'
      }, { status: 500 })
    }

    console.log('🗑️ Deleted automation rule:', id)

    return NextResponse.json({
      success: true,
      message: 'Automation rule deleted successfully'
    })

  } catch (error) {
    console.error('🚨 Delete automation rule error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// פונקציה לחישוב זמן ההרצה הבאה
function calculateNextRun(schedule: any, enabled: boolean, automation_type?: string): string | null {
  if (!enabled) return null

  // אם זה event-driven או context-aware, אין זמן קבוע
  if (automation_type === 'event_driven') {
    return 'Before matches (event-driven)'
  }
  
  if (automation_type === 'context_aware') {
    return 'After content delivery (context-aware)'
  }

  const now = new Date()
  const nextRun = new Date()

  switch (schedule.frequency) {
    case 'hourly':
      nextRun.setHours(nextRun.getHours() + 1, 0, 0, 0)
      break

    case 'daily':
      if (schedule.times?.length > 0) {
        const [hour, minute] = schedule.times[0].split(':')
        nextRun.setHours(parseInt(hour), parseInt(minute), 0, 0)
        
        // אם השעה כבר עברה היום, עבור למחר
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1)
        }
      }
      break

    case 'weekly':
      nextRun.setDate(nextRun.getDate() + 7)
      if (schedule.times?.length > 0) {
        const [hour, minute] = schedule.times[0].split(':')
        nextRun.setHours(parseInt(hour), parseInt(minute), 0, 0)
      }
      break

    case 'custom':
      if (schedule.times?.length > 0) {
        // מצא את השעה הבאה היום או מחר
        const currentTime = now.getHours() * 60 + now.getMinutes()
        
        for (const time of schedule.times) {
          const [hour, minute] = time.split(':')
          const timeInMinutes = parseInt(hour) * 60 + parseInt(minute)
          
          if (timeInMinutes > currentTime) {
            nextRun.setHours(parseInt(hour), parseInt(minute), 0, 0)
            return nextRun.toISOString()
          }
        }
        
        // אם כל השעות עברו היום, קח את השעה הראשונה של מחר
        const [hour, minute] = schedule.times[0].split(':')
        nextRun.setDate(nextRun.getDate() + 1)
        nextRun.setHours(parseInt(hour), parseInt(minute), 0, 0)
      }
      break

    default:
      return null
  }

  return nextRun.toISOString()
} 