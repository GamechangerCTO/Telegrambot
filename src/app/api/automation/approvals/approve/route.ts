import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { TelegramSender } from '@/lib/content/telegram-sender'

// POST - אישור תוכן ושליחה לטלגרם
export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json()

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

    // Update status to approved
    const { error: updateError } = await supabase
      .from('pending_approvals')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to approve content'
      }, { status: 500 })
    }

    // TODO: Send to Telegram channels

    return NextResponse.json({
      success: true,
      message: 'Content approved successfully'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
} 