'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
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

/** Active suspension surfaced to the login UI (reason + permanent vs timed). */
export interface SuspensionInfo {
  reason: string;
  type: 'permanent' | 'temporary';
  expiresAt: string | null; // ISO; null for permanent
}

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  suspension: SuspensionInfo | null;
  needsPasswordSetup: boolean;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, session: null, userProfile: null, loading: true,
  authError: null, suspension: null, needsPasswordSetup: false,
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
      // Only ever hand back a token from a live session. Falling back to the
      // captured `session.access_token` would emit a "zombie" token whose
      // session may have been revoked → GoTrue 403 "Session not found".
      const { data, error } = await supabaseBrowser.auth.getSession();
      if (error || !data.session) throw new Error('No active session — please sign in again.');
      return data.session.access_token;
    },
    raw: u,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [suspension, setSuspension] = useState<SuspensionInfo | null>(null);
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
    supabaseBrowser.auth.getSession().then(async ({ data }) => {
      // A cached session can be revoked server-side while its JWT is still
      // unexpired (logout elsewhere, password reset, session deletion). Validate
      // it against GoTrue; on a genuine auth rejection (401/403 — NOT a transient
      // network error) sign out so the user re-authenticates instead of looping
      // on a dead token. (Symptom: every API call → 403 "Session not found".)
      if (data.session) {
        const { error } = await supabaseBrowser.auth.getUser();
        const status = (error as any)?.status;
        if (error && (status === 401 || status === 403)) {
          await supabaseBrowser.auth.signOut();
          setSession(null);
          setUserProfile(null);
          setLoading(false);
          return;
        }
      }
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
        const profile = rowToDoc<UserProfile>(data);
        if (data.status === 'SUSPENDED' && !isSuperAdmin(session?.user?.email)) {
          // Distinguish a permanent ban from a timed one, and auto-lift a timed
          // suspension once its window has elapsed (admin can still purge it).
          const bd: any = (profile as any).blockingDetails || {};
          const expiresMs = bd.expiresAt ? new Date(bd.expiresAt).getTime() : null;
          const expired = expiresMs != null && expiresMs <= Date.now();
          if (!expired) {
            setSuspension({
              reason: bd.reason || 'No reason was provided by the administrator.',
              type: expiresMs ? 'temporary' : 'permanent',
              expiresAt: expiresMs ? bd.expiresAt : null,
            });
            setAuthError('ACCESS REVOKED: This account has been suspended by an administrator.');
            await logout();
            setLoading(false);
            return;
          }
          // expired timed suspension → allow through
        }
        setSuspension(null);
        setUserProfile(profile);
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

  // Memoize on `session` so consumers get a STABLE `user` reference between
  // renders. A fresh object here makes every `useEffect([user])` re-fire each
  // render → infinite "Maximum update depth exceeded" loops in consumers.
  const user = useMemo(() => toAppUser(session), [session]);
  const needsPasswordSetup = useMemo(() => !!(
    session?.user?.app_metadata?.must_set_password || session?.user?.user_metadata?.must_set_password
  ), [session]);

  const value = useMemo(
    () => ({ user, session, userProfile, loading, authError, suspension, needsPasswordSetup, logout, getToken }),
    [user, session, userProfile, loading, authError, suspension, needsPasswordSetup, logout, getToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
