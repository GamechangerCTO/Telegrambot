import { NextRequest, NextResponse } from 'next/server'
import { validateManagerSession } from '@/lib/auth'

export const runtime = 'nodejs'

// GET - בדיקת תוקף session
export async function GET(request: NextRequest) {
  try {
    // Get session token from cookie or header
    const sessionToken = request.cookies.get('manager_session')?.value ||
                         request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!sessionToken) {
      return NextResponse.json({
        valid: false,
        error: 'No session found'
      }, { status: 401 })
    }
    
    // Validate session
    const sessionResult = await validateManagerSession(sessionToken)
    
    if (!sessionResult.valid) {
      const response = NextResponse.json({
        valid: false,
        error: sessionResult.error
      }, { status: 401 })
      
      // Clear invalid cookies
      response.cookies.delete('manager_session')
      response.cookies.delete('manager_refresh')
      
      return response
    }
    
    // Return manager info (excluding sensitive data)
    return NextResponse.json({
      valid: true,
      manager: {
        id: sessionResult.manager.id,
        name: sessionResult.manager.name,
        email: sessionResult.manager.email,
        organization_id: sessionResult.manager.user.organization_id,
        role: sessionResult.manager.user.role,
        is_active: sessionResult.manager.is_active,
        approval_status: sessionResult.manager.approval_status
      },
      session: {
        expires_at: sessionResult.session.expires_at,
        last_accessed: sessionResult.session.last_accessed_at
      }
    })
    
  } catch (error) {
    console.error('Session validation error:', error)
    return NextResponse.json({ 
      valid: false,
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 