import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { id, reason } = await request.json()

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Approval ID is required'
      }, { status: 400 })
    }

    // Get pending approval
    const { data: approval, error } = await supabase
      .from('pending_approvals')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !approval) {
      return NextResponse.json({
        success: false,
        error: 'Approval not found'
      }, { status: 404 })
    }

    // Update status to rejected
    const { error: updateError } = await supabase
      .from('pending_approvals')
      .update({
        status: 'rejected',
        rejection_reason: reason || 'No reason provided',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to reject content'
      }, { status: 500 })
    }

    // Log rejection event
    await supabase
      .from('automation_logs')
      .insert({
        run_type: 'manual_rejection',
        status: 'success',
        channels_updated: 0,
        content_generated: 0,
        metadata: {
          approval_id: id,
          rule_id: approval.rule_id,
          content_type: approval.content_type,
          language: approval.language,
          rejection_reason: reason
        }
      })

    return NextResponse.json({
      success: true,
      message: 'Content rejected successfully'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
} 