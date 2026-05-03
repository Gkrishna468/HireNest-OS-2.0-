/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { User, Role } from '@/types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: Role) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check for Executive Session first
        const execSession = localStorage.getItem('hirenest_exec_session');
        if (execSession) {
          setUser(JSON.parse(execSession));
          setLoading(false);
          return;
        }

        if (!isSupabaseConfigured()) {
          setLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await resolveUser(session.user);
        }
      } catch (err) {
        console.error('Session check failed:', err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Use setTimeout to avoid React state update during render (OAuth redirect fix)
      setTimeout(async () => {
        if (session) {
          await resolveUser(session.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      }, 0);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const resolveUser = async (authUser: any) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profile) {
        setUser({
          id: authUser.id,
          email: authUser.email!,
          name: profile.name || authUser.user_metadata?.name || authUser.email!.split('@')[0],
          role: profile.role || 'viewer',
          companyId: profile.company_id,
          status: profile.status || 'active',
          isVerified: authUser.email_confirmed_at ? true : false,
          last_sign_in_at: authUser.last_sign_in_at
        });
      } else {
        // Fallback to metadata
        setUser({
          id: authUser.id,
          email: authUser.email!,
          name: authUser.user_metadata?.name || authUser.email!.split('@')[0],
          role: (authUser.user_metadata?.role as Role) || 'viewer',
          status: 'active',
          isVerified: authUser.email_confirmed_at ? true : false,
          last_sign_in_at: authUser.last_sign_in_at
        });
      }
    } catch (err) {
      console.error('User resolution failed:', err);
      setUser({
        id: authUser.id,
        email: authUser.email!,
        name: authUser.email!.split('@')[0],
        role: 'viewer',
        status: 'active',
      });
    }
  };

  const signIn = async (email: string, password: string) => {
    // STRATEGIC BYPASS: Mock users for dev speed
    if (
      (email === 'gopal@hirenestworkforce.com' && password === 'founding2026') ||
      (email === 'admin@hirenest.com' && password === 'admin123')
    ) {
      const execUser: User = { 
        id: '00000000-0000-4000-a000-000000000000', 
        email, 
        name: email === 'admin@hirenest.com' ? 'Admin User' : 'Gopala Krishna', 
        role: 'admin', 
        status: 'active' 
      };
      setUser(execUser);
      localStorage.setItem('hirenest_exec_session', JSON.stringify(execUser));
      toast.success('Executive access granted');
      return;
    }

    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please check your settings.');
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, name: string, role: Role) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    localStorage.removeItem('hirenest_exec_session');
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
