'use client';

import { useEffect } from 'react';
import { useCollection, useDocument } from 'react-firebase-hooks/firestore';
import { collections } from '@/services/FirebaseService';
import type { Task, TeamMember, DashboardNavItem, ProjectMetadata, Department } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

export function useRealtimeData() {
  const { userProfile } = useAuth();
  
  // Reactive Security Handshake: Force query recreation when permissions change
  // This ensures that granting access in the Admin Portal instantly restarts the sync bridge
  const isApproved = userProfile?.isApproved === true || userProfile?.isAdmin === true;
  const hasDR = userProfile?.access?.deliverablesRegistry === true || userProfile?.isAdmin === true;
  const hasBIM = userProfile?.access?.bimReviews === true || userProfile?.isAdmin === true;

  const [tasksSnapshot, tasksLoading, tasksError] = useCollection(isApproved && hasDR ? collections.tasks : null);
  const [membersSnapshot, membersLoading, membersError] = useCollection(isApproved ? collections.members : null);
  const [registrySnapshot, registryLoading, registryError] = useCollection(isApproved ? collections.registry : null);
  const [departmentsSnapshot, departmentsLoading, departmentsError] = useCollection(isApproved ? collections.departments : null);
  const [bimReviewsSnapshot, bimReviewsLoading, bimReviewsError] = useCollection(isApproved && hasBIM ? collections.bimReviews : null);
  
  // Also sync global project settings
  const [projectSnapshot, projectLoading, projectError] = useDocument(doc(db, 'settings', 'project'));

  const tasks = tasksSnapshot ? tasksSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task)) : [];
  const members = membersSnapshot 
    ? membersSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as TeamMember)) 
    : [];
  const registry = registrySnapshot ? registrySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as DashboardNavItem)) : [];
  const departments = departmentsSnapshot ? departmentsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Department)) : [];
  const bimReviews = bimReviewsSnapshot ? bimReviewsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as any)) : [];
  const project = projectSnapshot?.exists() ? ({ id: projectSnapshot.id, ...projectSnapshot.data() } as ProjectMetadata) : null;

  useEffect(() => {
    // Permission errors during access transitions are expected and transient.
    // Firestore rules reject the existing listener BEFORE the client can unsubscribe.
    // Only log genuine mismatches (where the client thinks it has access but Firestore disagrees).
    if (isApproved) {
      if (tasksError && hasDR) console.warn('[REALTIME_SYNC] Tasks access handshake pending...');
      if (membersError) console.warn('[REALTIME_SYNC] Users access handshake pending...');
      if (registryError) console.warn('[REALTIME_SYNC] Registry access handshake pending...');
      if (departmentsError) console.warn('[REALTIME_SYNC] Departments access handshake pending...');
      if (bimReviewsError && hasBIM) console.warn('[REALTIME_SYNC] BIM access handshake pending...');
      if (projectError) console.warn('[REALTIME_SYNC] Project access handshake pending...');
    } else if (userProfile) {
      console.error('[REALTIME_SYNC] Clearance revoked: Active session restricted by security protocol.');
    }
    
    if (isApproved && !tasksLoading && !membersLoading && !registryLoading && !projectLoading && !departmentsLoading && !bimReviewsLoading &&
        !tasksError && !membersError && !registryError && !departmentsError && !bimReviewsError && !projectError) {
      console.log('[REALTIME_SYNC] Bridge established. Data hydrated.');
    }
  }, [isApproved, hasDR, hasBIM, tasksLoading, membersLoading, registryLoading, projectLoading, departmentsLoading, bimReviewsLoading, tasksError, membersError, registryError, departmentsError, bimReviewsError, projectError]);

  return {
    tasks,
    members,
    registry,
    departments,
    bimReviews,
    project,
    isLoading: !userProfile || tasksLoading || membersLoading || registryLoading || projectLoading || departmentsLoading || bimReviewsLoading,
    hasError: !!(tasksError || membersError || registryError || departmentsError || bimReviewsError || projectError),
    errors: { tasksError, membersError, registryError, departmentsError, bimReviewsError, projectError }
  };
};
