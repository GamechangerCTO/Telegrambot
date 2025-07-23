import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

// GET - קבלת רשימת הפצות תוכן בין ארגונים
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const approvalStatus = searchParams.get('approval_status')
    const contentType = searchParams.get('content_type')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    let query = supabase
      .from('cross_org_content_distribution')
      .select(`
        *,
        original_content:content_items!original_content_id(id, title, content),
        source_organization:organizations!source_organization_id(id, name),
        target_organization:organizations!target_organization_id(id, name),
        source_bot:bots!source_bot_id(id, name),
        target_bot:bots!target_bot_id(id, name),
        source_channel:channels!source_channel_id(id, name),
        target_channel:channels!target_channel_id(id, name),
        partnership:organization_partnerships!partnership_id(id, partnership_type, status)
      `)
    
    if (organizationId) {
      query = query.or(`source_organization_id.eq.${organizationId},target_organization_id.eq.${organizationId}`)
    }
    
    if (approvalStatus) {
      query = query.eq('approval_status', approvalStatus)
    }
    
    if (contentType) {
      query = query.eq('content_type', contentType)
    }
    
    const { data: distributions, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('Error fetching content distributions:', error)
      return NextResponse.json({ error: 'Failed to fetch content distributions' }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      distributions,
      count: distributions?.length || 0
    })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - יצירת הפצת תוכן חדשה בין ארגונים
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    
    const {
      original_content_id,
      source_organization_id,
      target_organization_id,
      partnership_id,
      source_bot_id,
      target_bot_id,
      source_channel_id,
      target_channel_id,
      content_type,
      original_language,
      shared_language,
      sharing_method = 'api',
      modification_level = 'none',
      attribution_text
    } = body
    
    // Validation
    if (!original_content_id || !partnership_id || !source_bot_id || !target_bot_id) {
      return NextResponse.json({
        error: 'Missing required fields'
      }, { status: 400 })
    }
    
    // בדיקת הרשאות - הבוט מורשה לחלוק תוכן?
    const { data: permission } = await supabase
      .from('content_sharing_permissions')
      .select('*')
      .eq('partnership_id', partnership_id)
      .eq('bot_id', source_bot_id)
      .eq('can_share_outbound', true)
      .single()
    
    if (!permission) {
      return NextResponse.json({
        error: 'Source bot does not have permission to share content in this partnership'
      }, { status: 403 })
    }
    
    // בדיקת הגבלות יומיות
    const today = new Date().toISOString().split('T')[0]
    const { count: todayShares } = await supabase
      .from('cross_org_content_distribution')
      .select('id', { count: 'exact' })
      .eq('source_bot_id', source_bot_id)
      .eq('partnership_id', partnership_id)
      .gte('created_at', `${today}T00:00:00Z`)
      .lt('created_at', `${today}T23:59:59Z`)
    
    if (todayShares && todayShares >= permission.max_daily_shares) {
      return NextResponse.json({
        error: `Daily sharing limit reached (${permission.max_daily_shares})`
      }, { status: 429 })
    }
    
    // בדיקת איכות תוכן
    const { data: originalContent } = await supabase
      .from('content_items')
      .select('metadata')
      .eq('id', original_content_id)
      .single()
    
    const contentQualityScore = originalContent?.metadata?.quality_score || 5
    
    if (contentQualityScore < permission.min_quality_score) {
      return NextResponse.json({
        error: `Content quality score (${contentQualityScore}) below minimum required (${permission.min_quality_score})`
      }, { status: 400 })
    }
    
    // קביעת סטטוס אישור
    let approvalStatus = 'pending'
    if (permission.can_auto_approve && contentQualityScore >= (permission.auto_approval_threshold || 7)) {
      approvalStatus = 'auto_approved'
    }
    
    const { data: distribution, error } = await supabase
      .from('cross_org_content_distribution')
      .insert({
        original_content_id,
        source_organization_id,
        target_organization_id,
        partnership_id,
        source_bot_id,
        target_bot_id,
        source_channel_id,
        target_channel_id,
        content_type,
        original_language,
        shared_language,
        content_quality_score: Math.round(contentQualityScore),
        sharing_method,
        approval_status,
        modification_level,
        attribution_text,
        shared_at: approvalStatus === 'auto_approved' ? new Date().toISOString() : null
      })
      .select(`
        *,
        source_organization:organizations!source_organization_id(id, name),
        target_organization:organizations!target_organization_id(id, name),
        source_bot:bots!source_bot_id(id, name),
        target_bot:bots!target_bot_id(id, name)
      `)
      .single()
    
    if (error) {
      console.error('Error creating content distribution:', error)
      return NextResponse.json({ error: 'Failed to create content distribution' }, { status: 500 })
    }
    
    // אם אושר אוטומטית, ניצור גם workflow
    if (approvalStatus === 'auto_approved') {
      await supabase
        .from('content_approval_workflows')
        .insert({
          cross_org_distribution_id: distribution.id,
          partnership_id,
          workflow_type: 'auto',
          current_status: 'approved',
          ai_content_score: Math.round(contentQualityScore),
          submitted_at: new Date().toISOString(),
          reviewed_at: new Date().toISOString()
        })
    }
    
    return NextResponse.json({
      success: true,
      distribution,
      message: approvalStatus === 'auto_approved' 
        ? 'Content shared automatically' 
        : 'Content submitted for approval'
    }, { status: 201 })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - עדכון סטטוס הפצת תוכן (אישור/דחייה)
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    
    const { id, approval_status, reviewer_notes, approved_by } = body
    
    if (!id || !approval_status) {
      return NextResponse.json({ error: 'ID and approval_status are required' }, { status: 400 })
    }
    
    if (!['approved', 'rejected', 'pending'].includes(approval_status)) {
      return NextResponse.json({ error: 'Invalid approval status' }, { status: 400 })
    }
    
    const { data: distribution, error } = await supabase
      .from('cross_org_content_distribution')
      .update({
        approval_status,
        shared_at: approval_status === 'approved' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        source_organization:organizations!source_organization_id(id, name),
        target_organization:organizations!target_organization_id(id, name)
      `)
      .single()
    
    if (error) {
      console.error('Error updating distribution:', error)
      return NextResponse.json({ error: 'Failed to update distribution' }, { status: 500 })
    }
    
    // עדכון workflow
    await supabase
      .from('content_approval_workflows')
      .update({
        current_status: approval_status,
        reviewer_notes,
        reviewed_at: new Date().toISOString(),
        assigned_reviewer: approved_by
      })
      .eq('cross_org_distribution_id', id)
    
    return NextResponse.json({
      success: true,
      distribution,
      message: `Content ${approval_status} successfully`
    })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 