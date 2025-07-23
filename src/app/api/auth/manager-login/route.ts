import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { 
  verifyPassword, 
  logLoginAttempt, 
  updateFailedLoginAttempts,
  createManagerSession 
} from '@/lib/auth'

// POST - התחברות מנהל בוט
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    
    const { email, password } = body
    
    // Validation
    if (!email || !password) {
      return NextResponse.json({
        error: 'Email and password are required'
      }, { status: 400 })
    }
    
    // Get client info for security logging
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Find manager by email
    const { data: manager, error: managerError } = await supabase
      .from('managers')
      .select(`
        id, email, name, password_hash, password_salt, is_active, 
        approval_status, login_attempts, account_locked_until,
        force_password_change, last_login_at,
        user:users(id, organization_id, role, name)
      `)
      .eq('email', email)
      .single()
    
    if (managerError || !manager) {
      // Log failed attempt (email not found)
      await logLoginAttempt(
        email, 
        false, 
        ipAddress, 
        userAgent, 
        undefined, 
        'Email not found'
      )
      
      return NextResponse.json({
        error: 'Invalid email or password'
      }, { status: 401 })
    }
    
    // Check if account is locked
    if (manager.account_locked_until && 
        new Date(manager.account_locked_until) > new Date()) {
      await logLoginAttempt(
        email, 
        false, 
        ipAddress, 
        userAgent, 
        manager.id, 
        'Account locked'
      )
      
      const lockExpires = new Date(manager.account_locked_until)
      const minutesLeft = Math.ceil((lockExpires.getTime() - Date.now()) / (1000 * 60))
      
      return NextResponse.json({
        error: 'Account is temporarily locked',
        locked_until: manager.account_locked_until,
        minutes_left: minutesLeft
      }, { status: 423 })
    }
    
    // Check if manager is approved and active
    if (manager.approval_status !== 'approved' || !manager.is_active) {
      await logLoginAttempt(
        email, 
        false, 
        ipAddress, 
        userAgent, 
        manager.id, 
        'Account not approved or inactive'
      )
      
      return NextResponse.json({
        error: 'Account is not approved or has been deactivated'
      }, { status: 403 })
    }
    
    // Verify password
    if (!manager.password_hash) {
      await logLoginAttempt(
        email, 
        false, 
        ipAddress, 
        userAgent, 
        manager.id, 
        'No password set'
      )
      
      return NextResponse.json({
        error: 'Password not set. Please contact administrator.'
      }, { status: 403 })
    }
    
    const passwordValid = await verifyPassword(password, manager.password_hash)
    
    if (!passwordValid) {
      // Increment failed login attempts
      const { locked, attempts } = await updateFailedLoginAttempts(manager.id, true)
      
      await logLoginAttempt(
        email, 
        false, 
        ipAddress, 
        userAgent, 
        manager.id, 
        `Invalid password (attempt ${attempts})`
      )
      
      if (locked) {
        return NextResponse.json({
          error: 'Invalid password. Account has been locked for 30 minutes due to multiple failed attempts.'
        }, { status: 423 })
      }
      
      return NextResponse.json({
        error: 'Invalid email or password',
        attempts_remaining: Math.max(0, 5 - attempts)
      }, { status: 401 })
    }
    
    // Successful login - reset failed attempts
    await updateFailedLoginAttempts(manager.id, false)
    
    // Create session
    const sessionData = await createManagerSession(
      manager.id,
      ipAddress,
      userAgent
    )
    
    // Log successful login
    await logLoginAttempt(
      email, 
      true, 
      ipAddress, 
      userAgent, 
      manager.id
    )
    
    // Prepare response data (exclude sensitive info)
    const responseData = {
      success: true,
      manager: {
        id: manager.id,
        name: manager.name,
        email: manager.email,
        organization: manager.user.organization_id,
        role: manager.user.role,
        force_password_change: manager.force_password_change,
        last_login: manager.last_login_at
      },
      session: {
        token: sessionData.sessionToken,
        expires_at: sessionData.expiresAt
      },
      message: 'Login successful'
    }
    
    // Check if password change is required
    if (manager.force_password_change) {
      responseData.message = 'Login successful. Password change required.'
    }
    
    // Set secure HTTP-only cookie for session
    const response = NextResponse.json(responseData)
    
    response.cookies.set('manager_session', sessionData.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    })
    
    response.cookies.set('manager_refresh', sessionData.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    })
    
    return response
    
  } catch (error) {
    console.error('Manager login error:', error)
    return NextResponse.json({ 
      error: 'Internal server error during login' 
    }, { status: 500 })
  }
}

// DELETE - התנתקות מנהל בוט
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get session token from cookie or header
    const sessionToken = request.cookies.get('manager_session')?.value ||
                         request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!sessionToken) {
      return NextResponse.json({
        error: 'No session found'
      }, { status: 400 })
    }
    
    // Invalidate session in database
    await supabase
      .from('manager_sessions')
      .update({
        is_active: false,
        invalidated_at: new Date().toISOString(),
        invalidation_reason: 'User logout'
      })
      .eq('session_token', sessionToken)
    
    // Clear cookies
    const response = NextResponse.json({
      success: true,
      message: 'Logout successful'
    })
    
    response.cookies.delete('manager_session')
    response.cookies.delete('manager_refresh')
    
    return response
    
  } catch (error) {
    console.error('Manager logout error:', error)
    return NextResponse.json({ 
      error: 'Internal server error during logout' 
    }, { status: 500 })
  }
} 