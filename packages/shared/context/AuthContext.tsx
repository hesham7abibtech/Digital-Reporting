'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabaseBrowser } from '@/lib/supabase';
import { rowToDoc } from '@/lib/supabaseData';
import { isSuperAdmin } from '@/lib/siteConfig';
import { UserProfile } from '@/lib/types';

/**
 * Supabase-backed auth. Exposes a Firebase-compatible `user` shim (`.uid`,
 * `.getIdToken()`, `.email`, `.emailVerified`) so existing consumers keep working
 * during the cutover, while the session/token/profile all come from Supabase.
 */
export interface AppUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
  getIdToken: () => Promise<string>;
  raw: Session['user'];
  [key: string]: any;
}

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  needsPasswordSetup: boolean;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, session: null, userProfile: null, loading: true,
  authError: null, needsPasswordSetup: false,
  logout: async () => {}, getToken: async () => null,
});

function toAppUser(session: Session | null): AppUser | null {
  if (!session?.user) return null;
  const u = session.user;
  return {
    uid: u.id,
    email: u.email ?? '',
    emailVerified: !!u.email_confirmed_at,
    displayName: (u.user_metadata?.name as string) ?? null,
    photoURL: (u.user_metadata?.avatar as string) ?? null,
    getIdToken: async () => {
      const { data } = await supabaseBrowser.auth.getSession();
      return data.session?.access_token ?? session.access_token;
    },
    raw: u,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const logout = useCallback(async () => {
    try {
      sessionStorage.clear();
      await supabaseBrowser.auth.signOut();
    } catch (e) {
      console.error('Sign-out error:', e);
    }
  }, []);

  const getToken = useCallback(async () => {
    const { data } = await supabaseBrowser.auth.getSession();
    return data.session?.access_token ?? null;
  }, []);

  // Session lifecycle
  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });
    const { data: sub } = supabaseBrowser.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (!sess) { setUserProfile(null); setLoading(false); }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Profile (realtime) + suspension enforcement
  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) return;
    let active = true;
    setLoading(true);
    setAuthError(null);

    const fetchProfile = async () => {
      const { data, error } = await supabaseBrowser.from('users').select('*').eq('id', uid).maybeSingle();
      if (!active) return;
      if (error) { setAuthError(error.message); setLoading(false); return; }
      if (data) {
        if (data.status === 'SUSPENDED' && !isSuperAdmin(session?.user?.email)) {
          setAuthError('ACCESS REVOKED: This account has been suspended by an administrator.');
          await logout();
          setLoading(false);
          return;
        }
        setUserProfile(rowToDoc<UserProfile>(data));
      } else {
        setUserProfile(null); // profile not provisioned yet
      }
      setLoading(false);
    };

    fetchProfile();
    const channel = supabaseBrowser
      .channel(`rt:users:${uid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users', filter: `id=eq.${uid}` }, fetchProfile)
      .subscribe();
    return () => { active = false; supabaseBrowser.removeChannel(channel); };
  }, [session, logout]);

  const user = toAppUser(session);
  const needsPasswordSetup = !!(
    session?.user?.app_metadata?.must_set_password || session?.user?.user_metadata?.must_set_password
  );

  return (
    <AuthContext.Provider value={{ user, session, userProfile, loading, authError, needsPasswordSetup, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
