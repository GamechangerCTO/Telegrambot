/**
 * TELEGRAM BOT MANAGER 2025 - Authentication Library
 * Simplified authentication without managers table
 */

import { createClient } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

/**
 * Check if user has super admin role
 */
export async function isSuperAdmin(user: User | null): Promise<boolean> {
  if (!user) return false;
  
  // Check role from user metadata
  const userRole = user.user_metadata?.role || 'manager';
  return userRole === 'super_admin';
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<{ user: User | null; isAuth: boolean }> {
  const supabase = createClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Authentication check failed:', error);
      return { user: null, isAuth: false };
    }
    
    return { user, isAuth: !!user };
  } catch (error) {
    console.error('Unexpected error during authentication check:', error);
    return { user: null, isAuth: false };
  }
}

/**
 * Get current user's role
 */
export async function getUserRole(user: User | null): Promise<string> {
  if (!user) return 'guest';
  
  // Get role from user metadata
  return user.user_metadata?.role || 'manager';
}

/**
 * Check user permissions based on role
 */
export async function hasPermission(user: User | null, permission: string): Promise<boolean> {
  if (!user) return false;
  
  const role = await getUserRole(user);
  
  // Define permissions by role
  const rolePermissions: Record<string, string[]> = {
    'super_admin': ['*'], // Super admin has all permissions
    'manager': [
      'view_dashboard',
      'manage_channels',
      'manage_bots',
      'create_content',
      'view_analytics'
    ],
    'guest': []
  };
  
  const permissions = rolePermissions[role] || [];
  
  // Super admin has all permissions
  if (permissions.includes('*')) return true;
  
  // Check specific permission
  return permissions.includes(permission);
}

/**
 * Validate session token (simplified without managers table)
 */
export async function validateSession(): Promise<{ isValid: boolean; user: User | null; role: string }> {
  const { user, isAuth } = await isAuthenticated();
  
  if (!isAuth || !user) {
    return { isValid: false, user: null, role: 'guest' };
  }
  
  const role = await getUserRole(user);
  
  return { isValid: true, user, role };
} 