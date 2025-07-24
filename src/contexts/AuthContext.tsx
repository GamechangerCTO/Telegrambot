/**
 * TELEGRAM BOT MANAGER 2025 - Authentication Context
 * Optimized authentication system with minimal logging
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

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

      return newManager as Manager;
    } catch (error) {
      console.error('Error creating manager record:', error);
      return null;
    }
  };

  // Function to load manager data from database
  const loadManagerData = async (userId: string): Promise<Manager | null> => {
    try {
      // Reduced timeout for faster response
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Database query timeout')), 5000);
      });
      
      const queryPromise = supabase
        .from('managers')
        .select('id, user_id, name, email, role, created_at, updated_at')
        .eq('user_id', userId)
        .maybeSingle();
      
      const { data: managerData, error: managerError } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]);

      if (managerError) {
        // Only log significant errors, not warnings
        if (managerError.code === '42P01') {
          console.error('❌ AuthContext: managers table does not exist!');
        }
        return null;
      }
      
      // If no manager data found, try to create one
      if (!managerData && user) {
        const newManager = await createManagerRecord(user);
        if (newManager) {
          return newManager;
        }
        return null;
      }

      return managerData as Manager;
    } catch (error) {
      // Reduced logging - only log unexpected errors
      if (error instanceof Error && !error.message.includes('timeout')) {
        console.error('Error loading manager data:', error);
      }
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
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
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

    // Reduced timeout for better UX
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 2000);

    getInitialSession().finally(() => {
      clearTimeout(timeout);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
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
  const userRole = manager?.role || 'manager';
  const isManager = userRole === 'manager' || userRole === 'super_admin';
  const isSuperAdmin = userRole === 'super_admin';

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      // Load manager data from database
      if (data.user) {
        const managerData = await loadManagerData(data.user.id);
        if (managerData) {
          setManager(managerData);
        }
      }

      return { data };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, role = 'manager') => {
    try {
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
        }
      }

      return { data };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
      } else {
        setManager(null);
      }
    } catch (error) {
      console.error('Unexpected sign out error:', error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        return { error };
      }

      return { data };
    } catch (error) {
      return { error };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        return { error };
      }

      return { data };
    } catch (error) {
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