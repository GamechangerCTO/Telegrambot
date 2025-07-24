import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { 
  generateRandomPassword, 
  hashPassword, 
  validatePasswordStrength 
} from '@/lib/auth'

// Helper function לבדיקת הרשאות משתמש
async function checkUserPermissions(supabase: any, userId: string, organizationId: string, permission: string) {
  // Get user role and organization
  const { data: user } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', userId)
    .single()
  
  if (!user) {
    return { hasPermission: false, error: 'User not found' }
  }
  
  // Super admin has all permissions across all organizations
  if (user.role === 'super_admin') {
    return { hasPermission: true, user }
  }
  
  // Check if user belongs to the organization
  if (user.organization_id !== organizationId) {
    return { hasPermission: false, error: 'User does not belong to this organization' }
  }
  
  // Get role permissions
  const { data: rolePermissions } = await supabase
    .from('role_permissions')
    .select(permission)
    .eq('role_name', user.role)
    .eq('organization_id', organizationId)
    .single()
  
  const hasPermission = rolePermissions?.[permission] || false
  
  return { hasPermission, user, rolePermissions }
}

// GET - קבלת רשימת מנהלי בוטים (עם בקרת הרשאות)
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const status = searchParams.get('status')
    const userId = searchParams.get('user_id') // Current user ID
    
    if (!userId || !organizationId) {
      return NextResponse.json({
        error: 'user_id and organization_id are required'
      }, { status: 400 })
    }
    
    // Check permissions
    const permissionCheck = await checkUserPermissions(
      supabase, userId, organizationId, 'can_view_managers'
    )
    
    if (!permissionCheck.hasPermission) {
      return NextResponse.json({
        error: permissionCheck.error || 'Insufficient permissions to view managers'
      }, { status: 403 })
    }
    
    let query = supabase
      .from('managers')
      .select(`
        *,
        user:users(id, name, email, role),
        created_by_user:users!managers_created_by_fkey(id, name, email),
        approved_by_user:users!managers_approved_by_fkey(id, name, email),
        bots(id, name, language_code, is_active, approval_status)
      `)
    
    // Super admin can see all organizations, others only their own
    if (permissionCheck.user.role !== 'super_admin') {
      // Filter by organization through user relationship
      query = query.eq('users.organization_id', organizationId)
    }
    
    if (status) {
      query = query.eq('approval_status', status)
    }
    
    const { data: managers, error } = await query.order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching managers:', error)
      return NextResponse.json({ error: 'Failed to fetch managers' }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      managers,
      count: managers?.length || 0
    })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - יצירת מנהל בוט חדש (רק אדמין או super_admin)
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    
    const {
      email,
      name,
      phone,
      preferred_language = 'en',
      role = 'manager',
      organization_id,
      created_by_user_id, // Current user creating the manager
      notes,
      password,         // Optional - if not provided, will generate random password
      generate_password = true // Whether to generate password automatically
    } = body
    
    // Validation
    if (!email || !name || !organization_id || !created_by_user_id) {
      return NextResponse.json({
        error: 'Missing required fields: email, name, organization_id, created_by_user_id'
      }, { status: 400 })
    }
    
    // Check permissions - only admin or super_admin can create managers
    const permissionCheck = await checkUserPermissions(
      supabase, created_by_user_id, organization_id, 'can_create_managers'
    )
    
    if (!permissionCheck.hasPermission) {
      return NextResponse.json({
        error: permissionCheck.error || 'Only administrators can create bot managers'
      }, { status: 403 })
    }
    
    // Check if a user with this email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single()
    
    if (existingUser) {
      return NextResponse.json({
        error: 'A user with this email already exists'
      }, { status: 409 })
    }
    
    // Handle password creation
    let managerPassword = password
    let passwordValidation: { valid: boolean; errors: string[] } = { valid: true, errors: [] }
    
    if (generate_password || !password) {
      // Generate random secure password
      managerPassword = generateRandomPassword(12)
    } else {
      // Validate provided password
      passwordValidation = validatePasswordStrength(password)
      if (!passwordValidation.valid) {
        return NextResponse.json({
          error: 'Password does not meet requirements',
          details: passwordValidation.errors
        }, { status: 400 })
      }
    }
    
    // Hash the password
    const { hash: passwordHash, salt: passwordSalt } = await hashPassword(managerPassword)
    
    // Create user in Supabase Auth system first
    let authUser: any
    try {
      const authResult = await supabase.auth.admin.createUser({
        email,
        password: managerPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name,
          role: 'bot_manager',
          preferred_language,
          created_by: created_by_user_id,
          organization_id,
          phone: phone || null
        }
      })
      
      if (authResult.error) {
        console.error('Supabase Auth user creation error:', authResult.error)
        return NextResponse.json({
          error: 'Failed to create user authentication account',
          details: authResult.error.message
        }, { status: 500 })
      }
      
      authUser = authResult.data
      console.log('Created Supabase Auth user:', authUser.user?.id)
      
    } catch (authCreateError) {
      console.error('Error creating Supabase Auth user:', authCreateError)
      return NextResponse.json({
        error: 'Failed to create authentication account'
      }, { status: 500 })
    }
    
    // Auto-approve if created by super_admin, otherwise pending
    const approval_status = permissionCheck.user.role === 'super_admin' ? 'approved' : 'pending'
    const approved_by = permissionCheck.user.role === 'super_admin' ? created_by_user_id : null
    const approval_date = approval_status === 'approved' ? new Date().toISOString() : null
    
    const { data: manager, error } = await supabase
      .from('managers')
      .insert({
        user_id: authUser.user?.id, // Use the ID of the newly created user
        email,
        name,
        preferred_language,
        role,
        is_active: approval_status === 'approved',
        created_by: created_by_user_id,
        approved_by,
        approval_status,
        approval_date,
        notes,
        // Password fields
        password_hash: passwordHash,
        password_salt: passwordSalt,
        password_set_at: new Date().toISOString(),
        force_password_change: !password, // Force change if password was generated
        login_attempts: 0
      })
      .select(`
        *,
        user:users(id, name, email, role),
        created_by_user:users!managers_created_by_fkey(id, name, email)
      `)
      .single()
    
    if (error) {
      console.error('Error creating manager:', error)
      return NextResponse.json({ error: 'Failed to create manager' }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      manager,
      password: generate_password || !password ? managerPassword : undefined, // Only return password if generated
      message: approval_status === 'approved' 
        ? 'Bot manager created and approved successfully. Account ready for login.'
        : 'Bot manager created and pending approval. Authentication account created.',
      password_info: generate_password || !password 
        ? 'Generated password is provided. Manager can login with email and this password.'
        : 'Manager can now login with email and the provided password.',
      auth_info: 'User created in Supabase Auth system - can login immediately'
    }, { status: 201 })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - עדכון מנהל בוט (אישור/דחייה/עדכון פרטים)
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
      supabase, approved_by_user_id, organization_id, 'can_edit_managers'
    )
    
    if (!permissionCheck.hasPermission) {
      return NextResponse.json({
        error: permissionCheck.error || 'Insufficient permissions to edit managers'
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
    
    const { data: manager, error } = await supabase
      .from('managers')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        user:users(id, name, email, role),
        approved_by_user:users!managers_approved_by_fkey(id, name, email)
      `)
      .single()
    
    if (error) {
      console.error('Error updating manager:', error)
      return NextResponse.json({ error: 'Failed to update manager' }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      manager,
      message: approval_status 
        ? `Manager ${approval_status} successfully`
        : 'Manager updated successfully'
    })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 