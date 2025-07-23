import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

// Helper function לבדיקת הרשאות משתמש
async function checkUserPermissions(supabase: any, userId: string, organizationId: string, permission: string) {
  const { data: user } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', userId)
    .single()
  
  if (!user) {
    return { hasPermission: false, error: 'User not found' }
  }
  
  if (user.role === 'super_admin') {
    return { hasPermission: true, user }
  }
  
  if (user.organization_id !== organizationId) {
    return { hasPermission: false, error: 'User does not belong to this organization' }
  }
  
  const { data: rolePermissions } = await supabase
    .from('role_permissions')
    .select(permission)
    .eq('role_name', user.role)
    .eq('organization_id', organizationId)
    .single()
  
  const hasPermission = rolePermissions?.[permission] || false
  
  return { hasPermission, user, rolePermissions }
}

// GET - קבלת רשימת בוטים
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const managerId = searchParams.get('manager_id')
    const status = searchParams.get('status')
    const userId = searchParams.get('user_id')
    
    if (!userId || !organizationId) {
      return NextResponse.json({
        error: 'user_id and organization_id are required'
      }, { status: 400 })
    }
    
    // Check permissions
    const permissionCheck = await checkUserPermissions(
      supabase, userId, organizationId, 'can_view_bots'
    )
    
    if (!permissionCheck.hasPermission) {
      return NextResponse.json({
        error: permissionCheck.error || 'Insufficient permissions to view bots'
      }, { status: 403 })
    }
    
    let query = supabase
      .from('bots')
      .select(`
        *,
        manager:managers!inner(
          id, name, email, role, is_active,
          user:users!inner(id, name, email, organization_id)
        ),
        channels(id, name, telegram_channel_id, language, is_active),
        created_by_user:users!bots_created_by_fkey(id, name, email),
        approved_by_user:users!bots_approved_by_fkey(id, name, email)
      `)
    
    // Filter by organization through manager->user relationship
    if (permissionCheck.user.role !== 'super_admin') {
      query = query.eq('manager.user.organization_id', organizationId)
    }
    
    if (managerId) {
      query = query.eq('manager_id', managerId)
    }
    
    if (status) {
      query = query.eq('approval_status', status)
    }
    
    const { data: bots, error } = await query.order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching bots:', error)
      return NextResponse.json({ error: 'Failed to fetch bots' }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      bots,
      count: bots?.length || 0
    })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - יצירת בוט חדש (רק מנהלים מאושרים)
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    
    const {
      manager_id,
      name,
      telegram_token_encrypted,
      telegram_bot_username,
      language_code = 'en',
      max_posts_per_day = 10,
      organization_id,
      created_by_user_id,
      notes,
      // Channel data (since each bot gets exactly one channel)
      channel_name,
      telegram_channel_id,
      telegram_channel_username,
      channel_description
    } = body
    
    // Validation
    if (!manager_id || !name || !telegram_token_encrypted || !telegram_bot_username || 
        !organization_id || !created_by_user_id || !channel_name || !telegram_channel_id) {
      return NextResponse.json({
        error: 'Missing required fields'
      }, { status: 400 })
    }
    
    // Check if user is the manager or has permission to create bots
    const { data: manager } = await supabase
      .from('managers')
      .select(`
        id, user_id, is_active, approval_status,
        user:users(id, organization_id, role)
      `)
      .eq('id', manager_id)
      .single()
    
    if (!manager) {
      return NextResponse.json({ error: 'Manager not found' }, { status: 404 })
    }
    
    if (manager.approval_status !== 'approved' || !manager.is_active) {
      return NextResponse.json({
        error: 'Manager must be approved and active to create bots'
      }, { status: 403 })
    }
    
    // Check if user is the manager or admin
    const isManagerOwner = manager.user_id === created_by_user_id
    const permissionCheck = await checkUserPermissions(
      supabase, created_by_user_id, organization_id, 'can_create_bots'
    )
    
    if (!isManagerOwner && !permissionCheck.hasPermission) {
      return NextResponse.json({
        error: 'Only the manager or administrators can create bots for this manager'
      }, { status: 403 })
    }
    
    // Check if manager already has a bot (optional business rule)
    const { data: existingBot } = await supabase
      .from('bots')
      .select('id')
      .eq('manager_id', manager_id)
      .single()
    
    if (existingBot) {
      return NextResponse.json({
        error: 'Manager already has a bot. Each manager can only have one bot.'
      }, { status: 409 })
    }
    
    // Check if telegram username is unique
    const { data: existingBotUsername } = await supabase
      .from('bots')
      .select('id')
      .eq('telegram_bot_username', telegram_bot_username)
      .single()
    
    if (existingBotUsername) {
      return NextResponse.json({
        error: 'Telegram bot username already exists'
      }, { status: 409 })
    }
    
    // Check if telegram channel is unique
    const { data: existingChannel } = await supabase
      .from('channels')
      .select('id')
      .eq('telegram_channel_id', telegram_channel_id)
      .single()
    
    if (existingChannel) {
      return NextResponse.json({
        error: 'Telegram channel already exists'
      }, { status: 409 })
    }
    
    // Auto-approve if created by admin/super_admin, otherwise pending
    const approval_status = permissionCheck.hasPermission && !isManagerOwner ? 'approved' : 'pending'
    const approved_by = approval_status === 'approved' ? created_by_user_id : null
    const approval_date = approval_status === 'approved' ? new Date().toISOString() : null
    
    // Create bot
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .insert({
        manager_id,
        name,
        telegram_token_encrypted,
        telegram_bot_username,
        language_code,
        max_posts_per_day,
        is_active: approval_status === 'approved',
        created_by: created_by_user_id,
        approved_by,
        approval_status,
        approval_date,
        notes
      })
      .select('*')
      .single()
    
    if (botError) {
      console.error('Error creating bot:', botError)
      return NextResponse.json({ error: 'Failed to create bot' }, { status: 500 })
    }
    
    // Create the single channel for this bot
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .insert({
        bot_id: bot.id,
        name: channel_name,
        telegram_channel_id,
        telegram_channel_username,
        description: channel_description,
        language: language_code,
        is_active: approval_status === 'approved',
        auto_post: true,
        max_posts_per_day
      })
      .select('*')
      .single()
    
    if (channelError) {
      // Rollback bot creation
      await supabase.from('bots').delete().eq('id', bot.id)
      console.error('Error creating channel:', channelError)
      return NextResponse.json({ error: 'Failed to create channel for bot' }, { status: 500 })
    }
    
    // Fetch complete bot data with relationships
    const { data: completeBotData } = await supabase
      .from('bots')
      .select(`
        *,
        manager:managers(id, name, email),
        channels(id, name, telegram_channel_id, language, is_active),
        created_by_user:users!bots_created_by_fkey(id, name, email)
      `)
      .eq('id', bot.id)
      .single()
    
    return NextResponse.json({
      success: true,
      bot: completeBotData,
      channel,
      message: approval_status === 'approved' 
        ? 'Bot and channel created and approved successfully'
        : 'Bot and channel created and pending approval'
    }, { status: 201 })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - עדכון בוט (אישור/דחייה/עדכון פרטים)
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    
    const { 
      id, 
      approval_status, 
      notes, 
      approved_by_user_id,
      organization_id,
      ...otherUpdates 
    } = body
    
    if (!id || !approved_by_user_id || !organization_id) {
      return NextResponse.json({
        error: 'id, approved_by_user_id, and organization_id are required'
      }, { status: 400 })
    }
    
    // Check permissions
    const permissionCheck = await checkUserPermissions(
      supabase, approved_by_user_id, organization_id, 'can_edit_bots'
    )
    
    if (!permissionCheck.hasPermission) {
      return NextResponse.json({
        error: permissionCheck.error || 'Insufficient permissions to edit bots'
      }, { status: 403 })
    }
    
    // Prepare update data
    const updateData: any = {
      ...otherUpdates,
      updated_at: new Date().toISOString()
    }
    
    if (approval_status) {
      updateData.approval_status = approval_status
      updateData.approved_by = approved_by_user_id
      updateData.approval_date = new Date().toISOString()
      updateData.is_active = approval_status === 'approved'
      
      if (notes) {
        updateData.notes = notes
      }
    }
    
    const { data: bot, error } = await supabase
      .from('bots')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        manager:managers(id, name, email),
        channels(id, name, telegram_channel_id, language, is_active),
        approved_by_user:users!bots_approved_by_fkey(id, name, email)
      `)
      .single()
    
    if (error) {
      console.error('Error updating bot:', error)
      return NextResponse.json({ error: 'Failed to update bot' }, { status: 500 })
    }
    
    // Update channel status to match bot status
    if (approval_status) {
      await supabase
        .from('channels')
        .update({ is_active: approval_status === 'approved' })
        .eq('bot_id', id)
    }
    
    return NextResponse.json({
      success: true,
      bot,
      message: approval_status 
        ? `Bot ${approval_status} successfully`
        : 'Bot updated successfully'
    })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 