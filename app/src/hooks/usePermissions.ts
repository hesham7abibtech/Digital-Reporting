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
    // 1. OWNER Bypass: Absolute sovereignty across all modules
    const isOwner = userProfile?.role === 'OWNER';

    /**
     * Determine if a specific module is visible.
     */
    const isVisible = (module: keyof GroupPolicy['modules']) => {
      if (isOwner) return true;
      return !!policy?.modules[module]?.view;
    };

    /**
     * Determine if a user is authorized for a specific action within a module.
     */
    const can = (module: keyof GroupPolicy['modules'], action: keyof PolicyActions) => {
      if (isOwner) return true;
      return !!policy?.modules[module]?.[action];
    };

    return {
      isOwner,
      isVisible,
      can,
      policy,
      userRole: userProfile?.role,
      hasAdminAccess: isOwner || userProfile?.role === 'ADMIN'
    };
  }, [userProfile, policy]);
}
