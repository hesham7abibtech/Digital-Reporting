'use client';

import { useEffect } from 'react';
import { useCollection, useDocument } from 'react-firebase-hooks/firestore';
import { collections } from '@/services/FirebaseService';
import type { Task, TeamMember, DashboardNavItem, ProjectMetadata } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useRealtimeData() {
  const [tasksSnapshot, tasksLoading] = useCollection(collections.tasks);
  const [membersSnapshot, membersLoading] = useCollection(collections.members);
  const [registrySnapshot, registryLoading] = useCollection(collections.registry);
  
  // Also sync global project settings
  const [projectSnapshot, projectLoading] = useDocument(doc(db, 'settings', 'project'));

  const tasks = tasksSnapshot ? tasksSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task)) : [];
  const members = membersSnapshot ? membersSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as TeamMember)) : [];
  const registry = registrySnapshot ? registrySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as DashboardNavItem)) : [];
  const project = projectSnapshot?.exists() ? ({ id: projectSnapshot.id, ...projectSnapshot.data() } as ProjectMetadata) : null;

  useEffect(() => {
    if (!tasksLoading && !membersLoading && !registryLoading && !projectLoading) {
      console.log('[REALTIME_SYNC] Bridge established. Data hydrated.');
    }
  }, [tasksLoading, membersLoading, registryLoading, projectLoading]);

  return {
    tasks,
    members,
    registry,
    project,
    isLoading: tasksLoading || membersLoading || registryLoading || projectLoading
  };
}
