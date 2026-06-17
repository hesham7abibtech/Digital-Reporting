'use client';

import { useAuth } from '@/context/AuthContext';
import { GroupPolicy, PolicyActions } from '@/lib/types';
import { useDocCompat } from '@/lib/supabaseData';
import { useMemo } from 'react';

/**
 * Universal Security & Permission Hook
 * Evaluates Role + Group Policy to determine authorization.
 */
export function usePermissions() {
  const { userProfile } = useAuth();
  
  // Fetch the user's assigned policy in real-time (Supabase group_policies)
  const [policySnapshot] = useDocCompat('policies', userProfile?.policyId || '');
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
