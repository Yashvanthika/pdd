import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { apiFetch } from './api';
import { API_ENDPOINTS } from './endpoints';
import { requireSupabaseConfig, supabase } from './supabase';
import type { DonorProfile } from './types';

interface AuthContextValue {
  session: Session | null;
  profile: DonorProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  deleteProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const { profile: nextProfile } = await apiFetch<{ profile: DonorProfile }>(API_ENDPOINTS.me);
    setProfile(nextProfile);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      try {
        requireSupabaseConfig();
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(data.session);
        if (data.session) {
          await refreshProfile().catch(() => setProfile(null));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        refreshProfile().catch(() => setProfile(null));
      } else {
        setProfile(null);
      }
    });

    void boot();

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [refreshProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    requireSupabaseConfig();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      throw new Error('Enter your email and password.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    if (error) throw error;

    if (!data.session) {
      throw new Error('Unable to start a sign-in session.');
    }

    try {
      await refreshProfile();
      setSession(data.session);
    } catch (profileError: any) {
      await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
      throw new Error(profileError.message || 'Unable to load your donor profile.');
    }
  }, [refreshProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    requireSupabaseConfig();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
    if (error) throw error;
  }, []);

  const deleteProfile = useCallback(async () => {
    await apiFetch<{ ok: true }>(API_ENDPOINTS.me, { method: 'DELETE' });
    await signOut();
  }, [signOut]);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    profile,
    loading,
    signIn,
    signOut,
    refreshProfile,
    resetPassword,
    deleteProfile,
  }), [deleteProfile, loading, profile, refreshProfile, resetPassword, session, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }
  return value;
}
