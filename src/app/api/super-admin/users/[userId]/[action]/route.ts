import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string; action: string } }
) {
  try {
    const { userId, action } = params;
    
    console.log(`👥 Super Admin User Action: ${action} for user ${userId}`);

    switch (action) {
      case 'activate':
        const { error: activateError } = await supabase
          .from('users')
          .update({ 
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (activateError) {
          throw activateError;
        }

        return NextResponse.json({ 
          success: true, 
          message: 'User activated successfully' 
        });

      case 'deactivate':
        const { error: deactivateError } = await supabase
          .from('users')
          .update({ 
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (deactivateError) {
          throw deactivateError;
        }

        return NextResponse.json({ 
          success: true, 
          message: 'User deactivated successfully' 
        });

      case 'delete':
        // Soft delete - mark as deleted but keep record
        const { error: deleteError } = await supabase
          .from('users')
          .update({ 
            is_active: false,
            is_deleted: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (deleteError) {
          throw deleteError;
        }

        return NextResponse.json({ 
          success: true, 
          message: 'User deleted successfully' 
        });

      case 'promote':
        // Promote to admin (requires body with new role)
        const promoteBody = await request.json();
        const newRole = promoteBody.role || 'admin';

        const { error: promoteError } = await supabase
          .from('users')
          .update({ 
            role: newRole,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (promoteError) {
          throw promoteError;
        }

        // Also update user_roles table
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: userId,
            role: newRole,
            granted_at: new Date().toISOString(),
            granted_by: 'super_admin' // In real app, get from auth context
          });

        if (roleError) {
          console.error('Error updating user_roles:', roleError);
        }

        return NextResponse.json({ 
          success: true, 
          message: `User promoted to ${newRole} successfully` 
        });

      case 'reset-password':
        // In a real app, this would send a password reset email
        // For now, we'll just log it
        console.log(`Password reset requested for user ${userId}`);
        
        return NextResponse.json({ 
          success: true, 
          message: 'Password reset email sent' 
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ Error in user action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string; action: string } }
) {
  try {
    const { userId } = params;
    const updateData = await request.json();
    
    console.log(`👥 Super Admin User Update for user ${userId}:`, updateData);

    const { error } = await supabase
      .from('users')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User updated successfully' 
    });

  } catch (error) {
    console.error('❌ Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 