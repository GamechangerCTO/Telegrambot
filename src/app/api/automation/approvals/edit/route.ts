import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PUT(request: NextRequest) {
  try {
    const { id, content } = await request.json()

    if (!id || !content) {
      return NextResponse.json({
        success: false,
        error: 'Approval ID and content are required'
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

    // Update content and status
    const { data: updatedApproval, error: updateError } = await supabase
      .from('pending_approvals')
      .update({
        edited_content: content,
        status: 'editing',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update content'
      }, { status: 500 })
    }

    // Log edit event
    await supabase
      .from('automation_logs')
      .insert({
        run_type: 'content_edit',
        status: 'success',
        channels_updated: 0,
        content_generated: 0,
        metadata: {
          approval_id: id,
          rule_id: approval.rule_id,
          content_type: approval.content_type,
          language: approval.language,
          edit_action: 'content_modified'
        }
      })

    return NextResponse.json({
      success: true,
      approval: updatedApproval,
      message: 'Content updated successfully'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
} 