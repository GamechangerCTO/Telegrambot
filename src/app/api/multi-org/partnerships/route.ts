import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

// GET - קבלת רשימת שותפויות
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const status = searchParams.get('status')
    
    let query = supabase
      .from('organization_partnerships')
      .select(`
        *,
        organization:organizations!organization_partnerships_organization_id_fkey(id, name),
        partner_organization:organizations!organization_partnerships_partner_organization_id_fkey(id, name),
        network:content_sharing_networks(id, name, network_type)
      `)
    
    if (organizationId) {
      query = query.or(`organization_id.eq.${organizationId},partner_organization_id.eq.${organizationId}`)
    }
    
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data: partnerships, error } = await query.order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching partnerships:', error)
      return NextResponse.json({ error: 'Failed to fetch partnerships' }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      partnerships,
      count: partnerships?.length || 0
    })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - יצירת שותפות חדשה
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    
    const {
      network_id,
      organization_id,
      partner_organization_id,
      partnership_type = 'mutual',
      daily_share_limit = 20,
      priority_level = 5,
      can_modify_content = false,
      requires_attribution = true,
      requires_manual_approval = true,
      auto_approval_threshold = 8,
      agreement_start_date,
      agreement_end_date,
      revenue_share_percentage = 0,
      approved_by
    } = body
    
    // Validation
    if (!network_id || !organization_id || !partner_organization_id) {
      return NextResponse.json({
        error: 'Missing required fields: network_id, organization_id, partner_organization_id'
      }, { status: 400 })
    }
    
    // בדיקה שהשותפות לא קיימת כבר
    const { data: existingPartnership } = await supabase
      .from('organization_partnerships')
      .select('id')
      .eq('network_id', network_id)
      .eq('organization_id', organization_id)
      .eq('partner_organization_id', partner_organization_id)
      .single()
    
    if (existingPartnership) {
      return NextResponse.json({
        error: 'Partnership already exists between these organizations in this network'
      }, { status: 409 })
    }
    
    const { data: partnership, error } = await supabase
      .from('organization_partnerships')
      .insert({
        network_id,
        organization_id,
        partner_organization_id,
        partnership_type,
        status: 'pending', // תמיד מתחיל כ-pending
        daily_share_limit,
        priority_level,
        can_modify_content,
        requires_attribution,
        requires_manual_approval,
        auto_approval_threshold,
        agreement_start_date,
        agreement_end_date,
        revenue_share_percentage,
        approved_by
      })
      .select(`
        *,
        organization:organizations!organization_partnerships_organization_id_fkey(id, name),
        partner_organization:organizations!organization_partnerships_partner_organization_id_fkey(id, name),
        network:content_sharing_networks(id, name)
      `)
      .single()
    
    if (error) {
      console.error('Error creating partnership:', error)
      return NextResponse.json({ error: 'Failed to create partnership' }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      partnership,
      message: 'Partnership created successfully'
    }, { status: 201 })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - עדכון שותפות
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    
    const { id, ...updates } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Partnership ID is required' }, { status: 400 })
    }
    
    const { data: partnership, error } = await supabase
      .from('organization_partnerships')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        organization:organizations!organization_partnerships_organization_id_fkey(id, name),
        partner_organization:organizations!organization_partnerships_partner_organization_id_fkey(id, name),
        network:content_sharing_networks(id, name)
      `)
      .single()
    
    if (error) {
      console.error('Error updating partnership:', error)
      return NextResponse.json({ error: 'Failed to update partnership' }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      partnership,
      message: 'Partnership updated successfully'
    })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 