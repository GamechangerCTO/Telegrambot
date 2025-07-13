/**
 * TELEGRAM BOT MANAGER 2025 - Authentication Context
 * Revolutionary role-based authentication system with database validation
 */

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Manager interface based on database structure
interface Manager {
  id: string;
  user_id: string | null;
  email: string;
  name: string;
  role: string | null;
  preferred_language: string | null;
  is_active: boolean | null;
  password_reset_required?: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  manager: Manager | null;
  isAuthenticated: boolean;
  isManager: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ data?: any; error?: any }>;
  signUp: (email: string, password: string, role?: string) => Promise<{ data?: any; error?: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ data?: any; error?: any }>;
  updatePassword: (password: string) => Promise<{ data?: any; error?: any }>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [manager, setManager] = useState<Manager | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to create manager record for existing users
  const createManagerRecord = async (user: User): Promise<Manager | null> => {
    try {
      console.log('🔧 AuthContext: Creating manager record for existing user:', user.email);
      
      const { data: newManager, error: createError } = await supabase
        .from('managers')
        .insert({
          user_id: user.id,
          email: user.email!,
          name: user.user_metadata?.full_name || user.email!.split('@')[0],
          role: user.user_metadata?.role || 'manager',
          preferred_language: 'en',
          is_active: true
        })
        .select()
        .single();

      if (createError) {
        console.error('Failed to create manager record:', createError);
        return null;
      }

      console.log('✅ AuthContext: Manager record created successfully');
      return newManager as Manager;
    } catch (error) {
      console.error('Error creating manager record:', error);
      return null;
    }
  };

  // Function to load manager data from database
  const loadManagerData = async (userId: string): Promise<Manager | null> => {
    try {
      console.log('🔍 AuthContext: Loading manager data for user:', userId);
      
      // Add timeout to prevent hanging - increased for production
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Database query timeout')), 10000);
      });
      
      const queryPromise = supabase
        .from('managers')
        .select('id, user_id, name, email, role, created_at, updated_at')
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors if no record
      
      const { data: managerData, error: managerError } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]);

      if (managerError) {
        console.warn('Database error loading manager:', managerError);
        
        // Check if this is a table access issue
        if (managerError.code === '42P01') {
          console.error('❌ AuthContext: managers table does not exist!');
        } else {
          console.error('❌ AuthContext: Database access error:', managerError.code, managerError.message);
        }
        
        return null;
      }
      
      // If no manager data found (maybeSingle returns null, not error)
      if (!managerData) {
        console.log('📝 AuthContext: No manager record found - attempting to create one');
        
        // Try to create manager record for existing auth user
        if (user) {
          const newManager = await createManagerRecord(user);
          if (newManager) {
            return newManager;
          }
        }
        return null;
      }

      console.log('✅ AuthContext: Manager data loaded:', {
        email: managerData.email,
        role: managerData.role,
        isActive: managerData.is_active
      });

      return managerData as Manager;
    } catch (error) {
      console.error('Error loading manager data:', error);
      return null;
    }
  };

  // Function to refresh user data
  const refreshUserData = async () => {
    if (!user?.id) return;
    
    const managerData = await loadManagerData(user.id);
    setManager(managerData);
  };

  useEffect(() => {
    console.log('🔍 AuthContext: Initializing authentication system...');
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        console.log('🔍 AuthContext: Initial session check', {
          hasSession: !!initialSession,
          user: initialSession?.user?.email || 'none',
          error: error?.message || 'none'
        });
        
        if (error) {
          console.error('Error getting initial session:', error);
        } else {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          // Load manager data if user exists
          if (initialSession?.user?.id) {
            const managerData = await loadManagerData(initialSession.user.id);
            setManager(managerData);
          }
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
      } finally {
        setLoading(false);
      }
    };

    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.warn('⚠️ AuthContext: Session check timeout, forcing loading to false');
      setLoading(false);
    }, 3000);

    getInitialSession().finally(() => {
      clearTimeout(timeout);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('🔍 AuthContext: Auth state changed', {
          event,
          hasSession: !!session,
          user: session?.user?.email || 'none'
        });
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Load manager data if user exists
        if (session?.user?.id) {
          const managerData = await loadManagerData(session.user.id);
          setManager(managerData);
        } else {
          setManager(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Computed properties based on database data
  const isAuthenticated = !!session && !!user;
  const userRole = manager?.role || 'manager'; // Use database role, not metadata
  const isManager = userRole === 'manager' || userRole === 'super_admin';
  const isSuperAdmin = userRole === 'super_admin';

  console.log('🔍 AuthContext: Current state:', {
    loading,
    isAuthenticated,
    user: user?.email || 'none',
    managerFromDB: !!manager,
    roleFromDB: userRole,
    isManager,
    isSuperAdmin
  });

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔍 AuthContext: Attempting sign in for:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        return { error };
      }

      console.log('✅ AuthContext: Sign in successful for:', email);
      
      // Load manager data from database
      if (data.user) {
        const managerData = await loadManagerData(data.user.id);
        if (managerData) {
          setManager(managerData);
          console.log('✅ AuthContext: Manager data set from database');
        } else {
          console.warn('⚠️ AuthContext: No manager record found for user');
        }
      }

      return { data };
    } catch (error) {
      console.error('Unexpected sign in error:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, role = 'manager') => {
    try {
      console.log('🔍 AuthContext: Attempting sign up for:', email, 'with role:', role);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role,
            full_name: email.split('@')[0]
          }
        }
      });

      if (error) {
        console.error('Sign up error:', error);
        return { error };
      }

      // Create manager record in database
      if (data.user) {
        const { error: managerError } = await supabase
          .from('managers')
          .insert({
            user_id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.full_name || email.split('@')[0],
            role: role,
            preferred_language: 'en',
            is_active: true
          });

        if (managerError) {
          console.error('Error creating manager record:', managerError);
        } else {
          console.log('✅ AuthContext: Manager record created in database');
        }
      }

      console.log('✅ AuthContext: Sign up successful for:', email);
      return { data };
    } catch (error) {
      console.error('Unexpected sign up error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('🔍 AuthContext: Signing out...');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
      } else {
        console.log('✅ AuthContext: Sign out successful');
        setManager(null); // Clear manager data
      }
    } catch (error) {
      console.error('Unexpected sign out error:', error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      console.log('🔍 AuthContext: Requesting password reset for:', email);
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        console.error('Password reset error:', error);
        return { error };
      }

      console.log('✅ AuthContext: Password reset email sent');
      return { data };
    } catch (error) {
      console.error('Unexpected password reset error:', error);
      return { error };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      console.log('🔍 AuthContext: Updating password...');
      
      const { data, error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Password update error:', error);
        return { error };
      }

      console.log('✅ AuthContext: Password updated successfully');
      return { data };
    } catch (error) {
      console.error('Unexpected password update error:', error);
      return { error };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    manager,
    isAuthenticated,
    isManager,
    isSuperAdmin,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext; 