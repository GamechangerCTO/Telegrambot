import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

// POST - התחברות דרך Supabase Auth (הדרך הרגילה)
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    
    const { email, password, action = 'signin' } = body
    
    if (action === 'signin') {
      // התחברות רגילה דרך Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        return NextResponse.json({
          error: error.message,
          code: error.status
        }, { status: error.status || 400 })
      }
      
      // בדיקה שהמשתמש הוא מנהל בוט
      const { data: manager } = await supabase
        .from('managers')
        .select(`
          id, name, email, is_active, approval_status,
          user:users(id, organization_id, role)
        `)
        .eq('email', email)
        .single()
      
      if (!manager) {
        // התנתקות מ-Supabase Auth כי המשתמש לא מנהל בוט
        await supabase.auth.signOut()
        return NextResponse.json({
          error: 'Access denied. This account is not authorized as a bot manager.'
        }, { status: 403 })
      }
      
      if (manager.approval_status !== 'approved' || !manager.is_active) {
        await supabase.auth.signOut()
        return NextResponse.json({
          error: 'Manager account is not approved or has been deactivated.'
        }, { status: 403 })
      }
      
      return NextResponse.json({
        success: true,
        user: data.user,
        session: data.session,
        manager: {
          id: manager.id,
          name: manager.name,
          email: manager.email,
          organization_id: manager.user?.organization_id,
          role: manager.user?.role
        },
        message: 'Login successful via Supabase Auth'
      })
      
    } else if (action === 'signout') {
      // התנתקות
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        return NextResponse.json({
          error: error.message
        }, { status: 400 })
      }
      
      return NextResponse.json({
        success: true,
        message: 'Logout successful'
      })
      
    } else if (action === 'session') {
      // בדיקת session נוכחי
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session) {
        return NextResponse.json({
          valid: false,
          error: 'No valid session'
        }, { status: 401 })
      }
      
      return NextResponse.json({
        valid: true,
        user: session.user,
        session: session
      })
    }
    
    return NextResponse.json({
      error: 'Invalid action'
    }, { status: 400 })
    
  } catch (error) {
    console.error('Supabase Auth API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// GET - בדיקת session נוכחי
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      return NextResponse.json({
        valid: false,
        error: 'No valid session'
      }, { status: 401 })
    }
    
    // בדיקה שהמשתמש הוא מנהל בוט מאושר
    const { data: manager } = await supabase
      .from('managers')
      .select(`
        id, name, email, is_active, approval_status,
        user:users(id, organization_id, role)
      `)
      .eq('email', session.user.email)
      .single()
    
    if (!manager || manager.approval_status !== 'approved' || !manager.is_active) {
      return NextResponse.json({
        valid: false,
        error: 'Manager account not found or not approved'
      }, { status: 403 })
    }
    
    return NextResponse.json({
      valid: true,
      user: session.user,
      session: session,
      manager: {
        id: manager.id,
        name: manager.name,
        email: manager.email,
        organization_id: manager.user?.organization_id,
        role: manager.user?.role
      }
    })
    
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ 
      valid: false,
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 