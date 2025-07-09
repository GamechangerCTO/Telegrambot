import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface PendingApproval {
  id?: string
  rule_id: string
  rule_name: string
  content_type: string
  language: string
  channels: string[]
  content: {
    text: string
    imageUrl?: string
    preview: string
    metadata?: any
  }
  ai_confidence: number
  estimated_engagement: string
  quality_score?: number
  status?: 'pending' | 'approved' | 'rejected' | 'editing'
  organization_id?: string
}

// GET - קבלת תוכן ממתין לאישור
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('org_id') || '00000000-0000-0000-0000-000000000001'
    const status = searchParams.get('status') || 'pending'
    const language = searchParams.get('language')
    const limit = parseInt(searchParams.get('limit') || '50')

    // בנית השאילתה
    let query = supabase
      .from('pending_approvals')
      .select('*')
      .eq('organization_id', orgId)
      .order('generated_at', { ascending: false })

    // סינון לפי סטטוס
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // סינון לפי שפה (אם נבחר)
    if (language) {
      query = query.eq('language', language)
    }

    // הגבלת מספר התוצאות
    query = query.limit(limit)

    const { data: approvals, error } = await query

    if (error) {
      console.error('❌ Error fetching pending approvals:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch pending approvals' 
      }, { status: 500 })
    }

    // קבלת סטטיסטיקות
    const { data: stats } = await supabase
      .from('pending_approvals_stats')
      .select('*')
      .eq('organization_id', orgId)
      .single()

    return NextResponse.json({
      success: true,
      approvals: approvals || [],
      stats: stats || {
        total_pending: 0,
        high_confidence_count: 0,
        average_confidence: 0,
        currently_pending: 0,
        total_approved: 0,
        total_rejected: 0,
        pending_last_24h: 0
      },
      total: approvals?.length || 0
    })

  } catch (error) {
    console.error('🚨 Pending Approvals API Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// POST - יצירת תוכן חדש הממתין לאישור
export async function POST(request: NextRequest) {
  try {
    const body: PendingApproval = await request.json()
    
    // ולידציה בסיסית
    if (!body.rule_name || !body.content_type || !body.content?.text) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: rule_name, content_type, or content.text'
      }, { status: 400 })
    }

    // הכנת נתונים להכנסה
    const approvalData = {
      rule_id: body.rule_id,
      rule_name: body.rule_name,
      content_type: body.content_type,
      language: body.language || 'en',
      channels: body.channels || [],
      content: body.content,
      ai_confidence: body.ai_confidence || 50,
      estimated_engagement: body.estimated_engagement || 'Medium',
      quality_score: body.quality_score,
      status: 'pending',
      organization_id: body.organization_id || '00000000-0000-0000-0000-000000000001',
      generated_at: new Date().toISOString()
    }

    const { data: newApproval, error } = await supabase
      .from('pending_approvals')
      .insert(approvalData)
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating pending approval:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to create pending approval'
      }, { status: 500 })
    }

    console.log('✅ Created new pending approval:', newApproval.id)

    return NextResponse.json({
      success: true,
      approval: newApproval,
      message: 'Pending approval created successfully'
    })

  } catch (error) {
    console.error('🚨 Create pending approval error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// PUT - עדכון תוכן ממתין לאישור
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Approval ID is required'
      }, { status: 400 })
    }

    // הוספת זמן עדכון
    const dataToUpdate = {
      ...updateData,
      updated_at: new Date().toISOString()
    }

    // אם זה עדכון של תוכן - שמירה בשדה נפרד
    if (updateData.content) {
      dataToUpdate.edited_content = updateData.content
      dataToUpdate.status = 'editing'
    }

    const { data: updatedApproval, error } = await supabase
      .from('pending_approvals')
      .update(dataToUpdate)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating pending approval:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to update pending approval'
      }, { status: 500 })
    }

    console.log('✅ Updated pending approval:', updatedApproval.id)

    return NextResponse.json({
      success: true,
      approval: updatedApproval,
      message: 'Pending approval updated successfully'
    })

  } catch (error) {
    console.error('🚨 Update pending approval error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// DELETE - מחיקת תוכן ממתין לאישור
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Approval ID is required'
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('pending_approvals')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('❌ Error deleting pending approval:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to delete pending approval'
      }, { status: 500 })
    }

    console.log('🗑️ Deleted pending approval:', id)

    return NextResponse.json({
      success: true,
      message: 'Pending approval deleted successfully'
    })

  } catch (error) {
    console.error('🚨 Delete pending approval error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
} 