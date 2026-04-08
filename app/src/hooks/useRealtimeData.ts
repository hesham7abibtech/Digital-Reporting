'use client';

import { useEffect } from 'react';
import { useCollectionData, useDocumentData } from 'react-firebase-hooks/firestore';
import { collections } from '@/services/FirebaseService';
import type { Task, TeamMember, DashboardNavItem, ProjectMetadata } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useRealtimeData() {
  const [dbTasks, tasksLoading] = useCollectionData(collections.tasks, { idField: 'id' });
  const [dbMembers, membersLoading] = useCollectionData(collections.members, { idField: 'id' });
  const [dbRegistry, registryLoading] = useCollectionData(collections.registry, { idField: 'id' });
  
  // Also sync global project settings
  const [dbProject, projectLoading] = useDocumentData(doc(db, 'settings', 'project'), { idField: 'id' });

  const tasks = (dbTasks as Task[]) || [];
  const members = (dbMembers as TeamMember[]) || [];
  const registry = (dbRegistry as DashboardNavItem[]) || [];
  const project = (dbProject as ProjectMetadata) || null;

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
