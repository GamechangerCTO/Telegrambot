import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { 
  generateRandomPassword, 
  hashPassword, 
  validatePasswordStrength 
} from '@/lib/auth'

// Create service role client for admin operations (bypasses RLS)
const createServiceClient = () => {
  const supabaseUrl = 'https://ythsmnqclosoxiccchhh.supabase.co'
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0aHNtbnFjbG9zb3hpY2NjaGhoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE2NjMxOSwiZXhwIjoyMDY1NzQyMzE5fQ.WNEGkRDz0Ss_4QYUAI4VKhRWL0Q6o_dOJpYeYJ0qF50'
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Helper function לבדיקת הרשאות משתמש
async function checkUserPermissions(supabase: any, userId: string, organizationId: string, permission: string) {
  console.log('🔍 Checking permissions for:', { userId, organizationId, permission });
  
  // Special case: if this is the auth user ID for triroars@gmail.com, allow super admin access
  if (userId === '70b7d77a-6cdc-469a-b32a-8fca577576fc') {
    console.log('✅ Direct super admin access for auth user ID');
    return { 
      hasPermission: true, 
      user: { 
        id: userId, 
        role: 'super_admin', 
        organization_id: organizationId,
        email: 'triroars@gmail.com'
      } 
    }
  }
  
  // Get user role and organization
  let { data: user } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', userId)
    .single()
  
  // If user not found by ID, try to find by matching auth.users email (for ID mismatch cases)
  if (!user) {
    console.log('🔄 User not found by ID, trying to find by email from auth.users...');
    
    try {
      // Get email from auth.users
      const { data: authUser } = await supabase.auth.admin.getUserById(userId)
      console.log('🔍 Auth user data:', authUser);
      
      if (authUser.user?.email) {
        const { data: userByEmail } = await supabase
          .from('users')
          .select('id, role, organization_id')
          .eq('email', authUser.user.email)
          .single()
        
        if (userByEmail) {
          console.log('✅ Found user by email:', userByEmail);
          user = userByEmail;
        }
      }
    } catch (authError) {
      console.error('❌ Error getting auth user:', authError);
    }
  }
  
  console.log('👤 User found:', user);
  
  if (!user) {
    console.log('❌ User not found');
    return { hasPermission: false, error: 'User not found' }
  }
  
  // Super admin has all permissions across all organizations
  if (user.role === 'super_admin') {
    console.log('✅ Super admin bypass - permission granted');
    return { hasPermission: true, user }
  }
  
  // Check if user belongs to the organization
  if (user.organization_id !== organizationId) {
    console.log('❌ User does not belong to organization');
    return { hasPermission: false, error: 'User does not belong to this organization' }
  }
  
  // Get role permissions
  const { data: rolePermissions } = await supabase
    .from('role_permissions')
    .select(permission)
    .eq('role_name', user.role)
    .eq('organization_id', organizationId)
    .single()
  
  console.log('🔐 Role permissions:', rolePermissions);
  
  const hasPermission = rolePermissions?.[permission] || false
  
  console.log('🎯 Final permission result:', hasPermission);
  
  return { hasPermission, user, rolePermissions }
}

// GET - קבלת רשימת מנהלי בוטים (עם בקרת הרשאות)
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    
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
        bots(id, name, language_code, is_active, approval_status)
      `)
    
    // Super admin can see all organizations, others only their own
    // For now, super admin sees everything, others see their organization managers
    
    if (status) {
      console.log('🔍 Filtering by status:', status);
      query = query.eq('approval_status', status)
    }

    console.log('🔍 Executing managers query...');
    const { data: managers, error } = await query
      .order('created_at', { ascending: false })

    console.log('📊 Query results:', { managers, error, count: managers?.length });

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
  const requestId = Math.random().toString(36).substring(7);
  console.log(`🚀 POST /api/admin/managers started [${requestId}]`)
  
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    console.log(`📝 Request body received [${requestId}]:`, { 
      email: body.email, 
      name: body.name, 
      organization_id: body.organization_id,
      created_by_user_id: body.created_by_user_id 
    })
    
    const {
      email,
      name,
      phone,
      preferred_language = 'en',
      role = 'manager',
      organization_id,
      created_by_user_id, // Get from frontend
      notes
    } = body

    // Validate required fields
    if (!email || !name || !organization_id || !created_by_user_id) {
      return NextResponse.json({
        error: 'Missing required fields: email, name, organization_id, and created_by_user_id are required'
      }, { status: 400 })
    }

    // Check permissions
    const permissionCheck = await checkUserPermissions(
      supabase, 
      created_by_user_id, 
      organization_id,
      'can_create_managers'
    )

    if (!permissionCheck.hasPermission) {
      return NextResponse.json({ 
        error: 'Access denied', 
        details: permissionCheck.error || 'Only administrators can create bot managers'
      }, { status: 403 })
    }
    
    // Check if a user with this email already exists
    console.log(`🔍 Checking if email already exists [${requestId}]:`, email)
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single()
    
    console.log(`👥 Existing user check result [${requestId}]:`, existingUser)
    
    if (existingUser) {
      console.log(`❌ Email already exists in users table [${requestId}]`)
      return NextResponse.json({
        error: 'A user with this email already exists'
      }, { status: 409 })
    }

    // Also check if manager with this email exists
    console.log(`🔍 Checking if manager email already exists [${requestId}]:`, email)
    const { data: existingManager } = await supabase
      .from('managers')
      .select('id, email')
      .eq('email', email)
      .single()
    
    console.log(`👤 Existing manager check result [${requestId}]:`, existingManager)
    
    if (existingManager) {
      console.log(`❌ Email already exists in managers table [${requestId}]`)
      return NextResponse.json({
        error: 'A manager with this email already exists'
      }, { status: 409 })
    }
    
    // Handle password creation - always use simple initial password that passes validation
    const managerPassword = '123456aA!' // Simple initial password that admin can share (meets all requirements)
    
    // Validate the simple password (should pass now)
    const passwordValidation = validatePasswordStrength(managerPassword)
    if (!passwordValidation.valid) {
      console.error(`❌ Password validation failed [${requestId}]:`, passwordValidation.errors)
      return NextResponse.json({
        error: 'Initial password does not meet requirements',
        details: passwordValidation.errors
      }, { status: 500 })
    }

    // Hash the password
    const { hash: passwordHash, salt: passwordSalt } = await hashPassword(managerPassword)
    
    // Create user in Supabase Auth system first
    console.log(`🔍 Creating Supabase Auth user [${requestId}]...`)
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: managerPassword,
      email_confirm: true,
      user_metadata: {
        name,
        role: 'manager',
        organization_id
      }
    })

    if (authError || !authUser.user) {
      console.error(`❌ Error creating auth user [${requestId}]:`, authError)
      return NextResponse.json({ 
        error: 'Failed to create authentication account',
        details: authError?.message 
      }, { status: 500 })
    }

    console.log(`✅ Created Supabase Auth user [${requestId}]:`, authUser.user.id)

    // Auto-approve if created by super_admin, otherwise pending
    const approval_status = permissionCheck.user.role === 'super_admin' ? 'approved' : 'pending'
    const approved_by = permissionCheck.user.role === 'super_admin' ? created_by_user_id : null
    const approval_date = approval_status === 'approved' ? new Date().toISOString() : null

    // Check if manager was auto-created by trigger and update it
    console.log(`🔍 Checking if manager was auto-created by trigger [${requestId}]...`)
    const { data: existingManagerAfterAuth } = await supabase
      .from('managers')
      .select('id, email')
      .eq('email', email)
      .single()

    if (existingManagerAfterAuth) {
      console.log(`✅ Manager auto-created by trigger, updating it [${requestId}]...`)
      // Update the auto-created manager with our details
      const { data: manager, error } = await supabase
        .from('managers')
        .update({
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
          force_password_change: true,
          login_attempts: 0
        })
        .eq('email', email)
        .select(`*`)
        .single()

      console.log(`✅ Manager updated successfully [${requestId}]!`)

      if (error) {
        console.error(`Error updating manager [${requestId}]:`, error)
        return NextResponse.json({ 
          error: 'Failed to update manager',
          details: error.message || error.toString()
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        manager,
        email: email,
        password: managerPassword,
        message: approval_status === 'approved' 
          ? 'Bot manager created and approved successfully. Account ready for login with password: 123456aA!'
          : 'Bot manager created and pending approval. Authentication account created with password: 123456aA!',
        password_info: 'Initial password is 123456aA! - Manager must change password on first login.',
        auth_info: 'User created in Supabase Auth system - can login immediately with 123456aA!'
      }, { status: 201 })
    }
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - עדכון מנהל בוט (אישור/דחייה/עדכון פרטים)
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServiceClient()
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