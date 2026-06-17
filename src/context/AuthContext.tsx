import React, { createContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import * as authService from '../services/authService';
import { GUEST_USER_ID } from '../constants/auth';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  effectiveUserId: string;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const mapSessionUser = (sessionUser: { id: string; email?: string | null }) => ({
    id: sessionUser.id,
    email: sessionUser.email || '',
  });

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ? mapSessionUser(session.user) : null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? mapSessionUser(session.user) : null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    await authService.signInWithGoogle();
  };

  const signInWithApple = async () => {
    await authService.signInWithApple();
  };

  const signOut = async () => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    setUser(null);
  };

  const isGuest = !user;
  const effectiveUserId = user?.id ?? GUEST_USER_ID;

  const value = useMemo(
    () => ({
      user,
      loading,
      isGuest,
      effectiveUserId,
      signInWithGoogle,
      signInWithApple,
      signOut,
      isAuthenticated: !!user,
    }),
    [user, loading, isGuest, effectiveUserId]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
