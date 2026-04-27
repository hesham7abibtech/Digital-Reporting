'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signOut,
  setPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { UserProfile } from '@/lib/types';
import { getFirebaseErrorMessage } from '@/lib/firebaseErrors';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';

// Removed local UserProfile interface in favor of types.ts definition

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  authError: null,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Enforce Strict Session Persistence (Zero localStorage leakage)
    setPersistence(auth, browserSessionPersistence).catch((err) => {
      console.error('Failed to set auth persistence:', err);
    });

    // 2. Tab Closure Protocol
    // browserSessionPersistence handles tab/window closure security,
    // ensuring the session is cleared when the portal is closed.
    // Explicit beforeunload signOut is avoided to support page refreshes.

    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      if (!authUser) {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let profileUnsubscribe: (() => void) | null = null;

    if (user) {
      setLoading(true);
      setAuthError(null);
      
      const userDocRef = doc(db, 'users', user.uid);
      profileUnsubscribe = onSnapshot(
        userDocRef,
        async (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            
            // 6. Security Protocol: Access Revocation
            // If the account status is set to SUSPENDED, immediately terminate the session.
            if (data.status === 'SUSPENDED') {
              console.warn('[SECURITY] Terminal access revoked. Terminating session.');
              await logout();
              const details = data.blockingDetails;
              const reasonMsg = details ? `Reason: ${details.reason} | Duration: ${details.duration}` : 'This account has been suspended by an administrator.';
              setAuthError(`ACCESS REVOKED: ${reasonMsg}`);
              setLoading(false);
              return;
            }

            // 5. Immediate State Release
            setUserProfile(data as UserProfile);

            // 3. Email Verification Sync Logic (Background)
            if (user.emailVerified && !data.isVerified) {
              updateDoc(userDocRef, { isVerified: true }).catch(e => console.error('BG Sync Error (Verification):', e));
            }

            // 4. Force override identity for Primary Owner (Background)
            if (data.email?.toLowerCase() === 'hesham.habib@insiteinternational.com' && (data.role !== 'OWNER' || !data.access?.deliverablesRegistry || !data.access?.bimReviews || !data.isAdmin)) {
              updateDoc(userDocRef, {
                role: 'OWNER',
                isAdmin: true,
                isApproved: true,
                access: {
                  deliverablesRegistry: true,
                  bimReviews: true,
                  ...data.access
                }
              }).catch(e => console.error('BG Sync Error (Owner Override):', e));
            }
          } else {
            // Document doesn't exist yet - this is expected during the first few seconds of registration.
            // We set profile to null but avoid setting an aggressive authError that blocks the transition.
            setUserProfile(null);
          }
          setLoading(false);
        },
        async (error: any) => {
          const errorCode = error?.code || '';
          
          // Permission errors can be transient during token refresh or session init.
          // Try refreshing the token before giving up.
          if (errorCode === 'permission-denied' && user) {
            try {
              await user.getIdToken(true); // Force token refresh
              console.warn('[AUTH] Token refreshed after permission challenge.');
              // The onSnapshot listener will automatically retry after token refresh
              return;
            } catch (refreshErr) {
              console.error('[AUTH] Token refresh failed:', refreshErr);
            }
          }
          
          console.error('Profile sync error:', error);
          setAuthError(getFirebaseErrorMessage(error));
          setLoading(false);
        }
      );
    }

    return () => {
      if (profileUnsubscribe) profileUnsubscribe();
    };
  }, [user]);

  const logout = async () => {
    try {
      // Clear all potential session flags and auth state
      sessionStorage.removeItem('dashboard_session');
      sessionStorage.removeItem('admin_session');
      sessionStorage.clear(); 
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, authError, logout }}>
      {children}
    </AuthContext.Provider>
  );
}


export const useAuth = () => useContext(AuthContext);

