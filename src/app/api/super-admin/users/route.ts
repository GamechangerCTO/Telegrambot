import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('👥 Super Admin Users API - Fetching users data...');

    // Fetch users with their roles and organizations
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        *,
        organizations (
          id,
          name,
          subscription_tier
        )
      `);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      throw usersError;
    }

    // Fetch user roles separately
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select(`
        *,
        users (
          id,
          email,
          name
        ),
        organizations (
          id,
          name
        )
      `);

    if (rolesError) {
      console.error('❌ Error fetching user roles:', rolesError);
      throw rolesError;
    }

    // Fetch bot managers
    const { data: managers, error: managersError } = await supabase
      .from('managers')
      .select(`
        *,
        users (
          id,
          email,
          name
        )
      `);

    if (managersError) {
      console.error('❌ Error fetching managers:', managersError);
      throw managersError;
    }

    // Fetch bots to see how many each manager has
    const { data: bots, error: botsError } = await supabase
      .from('bots')
      .select(`
        id,
        name,
        manager_id,
        is_active,
        total_posts_sent,
        created_at
      `);

    if (botsError) {
      console.error('❌ Error fetching bots:', botsError);
      throw botsError;
    }

    // Process and enrich user data
    const enrichedUsers = users?.map((user: any) => {
      // Find user roles
      const roles = userRoles?.filter((role: any) => role.users?.id === user.id) || [];
      
      // Find manager info if user is a manager
      const managerInfo = managers?.find((manager: any) => manager.users?.id === user.id);
      
      // Count bots if user is a manager
      const managedBots = managerInfo ? 
        bots?.filter((bot: any) => bot.manager_id === managerInfo.id) || [] : [];

      return {
        ...user,
        roles: roles.map((role: any) => ({
          role: role.role,
          organization: role.organizations?.name || 'System Wide',
          granted_at: role.granted_at,
          is_active: role.is_active
        })),
        manager_info: managerInfo ? {
          id: managerInfo.id,
          preferred_language: managerInfo.preferred_language,
          timezone: managerInfo.timezone,
          email_notifications: managerInfo.email_notifications,
          last_login_at: managerInfo.last_login_at
        } : null,
        managed_bots: managedBots.map((bot: any) => ({
          id: bot.id,
          name: bot.name,
          is_active: bot.is_active,
          total_posts_sent: bot.total_posts_sent,
          created_at: bot.created_at
        })),
        stats: {
          total_bots: managedBots.length,
          active_bots: managedBots.filter((bot: any) => bot.is_active).length,
          total_posts: managedBots.reduce((sum: number, bot: any) => sum + (bot.total_posts_sent || 0), 0)
        }
      };
    }) || [];

    // Calculate summary statistics
    const summary = {
      total_users: users?.length || 0,
      super_admins: userRoles?.filter((role: any) => role.role === 'super_admin').length || 0,
      admins: userRoles?.filter((role: any) => role.role === 'admin').length || 0,
      managers: userRoles?.filter((role: any) => role.role === 'manager').length || 0,
      bot_managers: managers?.length || 0,
      active_users: users?.filter((user: any) => user.is_active).length || 0,
      total_bots: bots?.length || 0,
      active_bots: bots?.filter((bot: any) => bot.is_active).length || 0,
      recent_registrations: users?.filter((user: any) => {
        const createdAt = new Date(user.created_at);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return createdAt > weekAgo;
      }).length || 0
    };

    // Get recent activity (last 10 users)
    const recentActivity = users?.slice(-10).map((user: any) => ({
      id: user.id,
      type: 'user_created',
      user_email: user.email,
      user_name: user.name,
      timestamp: user.created_at,
      details: {
        role: user.role,
        organization: user.organizations?.name
      }
    })) || [];

    const responseData = {
      users: enrichedUsers,
      summary,
      recent_activity: recentActivity.reverse(), // Show newest first
      filters: {
        roles: ['super_admin', 'admin', 'manager', 'editor', 'viewer'],
        subscription_tiers: ['free', 'basic', 'pro', 'enterprise'],
        activity_status: ['active', 'inactive']
      }
    };

    console.log('✅ Super Admin Users API - Successfully fetched data:', {
      total_users: summary.total_users,
      managers: summary.bot_managers,
      active_bots: summary.active_bots
    });

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ Super Admin Users API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch users data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('👥 Super Admin Users API - Creating/updating user...');

    const body = await request.json();
    const { action, user_data } = body;

    switch (action) {
      case 'create_user':
        // Generate temporary password
        const temporaryPassword = Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 6).toUpperCase();
        
        console.log('🔧 Creating user with temporary password:', temporaryPassword);
        
        // Create auth user with temporary password
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: user_data.email,
          password: temporaryPassword,
          email_confirm: true,
          user_metadata: {
            name: user_data.name,
            role: user_data.role || 'bot_manager',
            temporary_password: true, // Mark as temporary
            created_by: user_data.granted_by
          }
        });

        if (authError) throw authError;

        // Create user record in database
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([{
            id: authUser.user.id,
            email: user_data.email,
            name: user_data.name,
            role: user_data.role || 'bot_manager',
            organization_id: user_data.organization_id,
            preferred_language: user_data.preferred_language || 'en',
            timezone: user_data.timezone || 'UTC',
            is_active: true,
            password_reset_required: true // Mark password reset as required
          }])
          .select()
          .single();

        if (createError) throw createError;

        // Create manager record
        const { error: managerError } = await supabase
          .from('managers')
          .insert({
            user_id: authUser.user.id,
            email: user_data.email,
            name: user_data.name,
            role: user_data.role || 'bot_manager',
            preferred_language: user_data.preferred_language || 'en',
            is_active: true,
            password_reset_required: true
          });

        if (managerError) console.error('Error creating manager record:', managerError);

        // Generate password reset token
        const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: user_data.email,
          options: {
            redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'}/auth/setup-password`
          }
        });

        if (resetError) console.error('Error generating reset link:', resetError);

        console.log('✅ User created successfully with temporary password');
        
        return NextResponse.json({ 
          success: true, 
          user: newUser,
          temporary_password: temporaryPassword,
          reset_link: resetData?.properties?.hashed_token ? 
            `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'}/auth/setup-password?token=${resetData.properties.hashed_token}` : 
            null,
          message: 'User created successfully. Setup instructions will be sent via email.' 
        });

      case 'update_user':
        // Update existing user
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            name: user_data.name,
            role: user_data.role,
            is_active: user_data.is_active,
            preferred_language: user_data.preferred_language,
            timezone: user_data.timezone
          })
          .eq('id', user_data.id)
          .select()
          .single();

        if (updateError) throw updateError;

        return NextResponse.json({ 
          success: true, 
          user: updatedUser,
          message: 'User updated successfully' 
        });

      case 'assign_role':
        // Assign new role to user
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert([{
            user_id: user_data.user_id,
            role: user_data.role,
            organization_id: user_data.organization_id,
            granted_by: user_data.granted_by
          }]);

        if (roleError) throw roleError;

        return NextResponse.json({ 
          success: true,
          message: 'Role assigned successfully' 
        });

      case 'deactivate_user':
        // Deactivate user
        await supabase
          .from('users')
          .update({ is_active: false })
          .eq('id', user_data.id);

        // Deactivate all user roles
        await supabase
          .from('user_roles')
          .update({ is_active: false })
          .eq('user_id', user_data.id);

        return NextResponse.json({ 
          success: true,
          message: 'User deactivated successfully' 
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ Super Admin Users API POST Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process user action',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 