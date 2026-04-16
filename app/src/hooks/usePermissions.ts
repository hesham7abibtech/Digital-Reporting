'use client';

import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { GroupPolicy, PolicyActions } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';
import { useMemo } from 'react';

/**
 * Universal Security & Permission Hook
 * Evaluates Role + Group Policy to determine authorization.
 */
export function usePermissions() {
  const { userProfile } = useAuth();
  
  // Fetch the user's assigned policy in real-time
  const [policySnapshot] = useDocument(
    userProfile?.policyId ? doc(db, 'policies', userProfile.policyId) : null
  );
  
  const policy = policySnapshot?.data() as GroupPolicy | undefined;

  return useMemo(() => {
    // 1. ADMIN Bypass: Absolute sovereignty across all modules for cleared personnel
    const isAdmin = !!userProfile?.isAdmin;

    /**
     * Determine if a specific module is visible.
     */
    const isVisible = (module: keyof GroupPolicy['modules']) => {
      if (isAdmin) return true;
      return !!policy?.modules[module]?.view;
    };

    /**
     * Determine if a user is authorized for a specific action within a module.
     */
    const can = (module: keyof GroupPolicy['modules'], action: keyof PolicyActions) => {
      if (isAdmin) return true;
      return !!policy?.modules[module]?.[action];
    };

    return {
      isAdmin,
      isVisible,
      can,
      policy,
      hasAdminAccess: isAdmin
    };
  }, [userProfile, policy]);
}
