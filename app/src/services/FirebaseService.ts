import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { tasks as mockTasks, teamMembers as mockMembers, dashboardsRegistry as mockRegistry } from '@/lib/data';
import { Task, TeamMember, DashboardNavItem } from '@/lib/types';

// ─── Realtime sync hooks usually live in components, but helpers here ───

export const collections = {
  tasks: collection(db, 'tasks'),
  members: collection(db, 'members'),
  registry: collection(db, 'registry'),
  users: collection(db, 'users'),
  settings: collection(db, 'settings'),
};

/**
 * Seed the database with initial mock data
 * Warning: This will overwrite or duplicate if not careful. 
 * Designed for initial setup.
 */
/**
 * Seed the database with the absolute minimum production baseline.
 * Sets up initial project identity and administrative access.
 */
/*
export async function seedDatabase() {
  const batch = writeBatch(db);

  // 1. Initial Project Identity Baseline
  const projectDoc = doc(db, 'settings', 'project');
  const initialMetadata = {
    id: 'project-info',
    projectName: 'Digital Reporting Hub',
    projectId: 'NODE-001',
    companyName: 'KEO International Consultants',
    region: 'Middle East',
    statusLine: 'System Node Initialized',
    statusColor: '#3b82f6',
    ownerLogoUrl: '',
    logoUrl: '',
    updatedAt: new Date().toISOString()
  };
  batch.set(projectDoc, initialMetadata, { merge: true });

  // 2. Primary Administrative Access Vectors
  const adminUsers = [
    { id: 'admin-1', name: 'Hesham Habib', email: 'Hesham.habib@insiteinternational.com', role: 'OWNER', status: 'ACTIVE' },
    { id: 'admin-2', name: 'System Architect', email: 'architect@keodigital.com', role: 'SUPER_ADMIN', status: 'ACTIVE' }
  ];

  adminUsers.forEach((user) => {
    const userDoc = doc(collections.users, user.id);
    batch.set(userDoc, {
      ...user,
      uid: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  });

  await batch.commit();
  console.log('Production baseline initialized successfully');
}
*/

// ─── CRUD Operations ───────────────────────────────────────────────

export async function upsertTask(task: Task) {
  const taskDoc = doc(collections.tasks, task.id);
  await setDoc(taskDoc, task, { merge: true });
}

export async function deleteTask(id: string) {
  await deleteDoc(doc(db, 'tasks', id));
}

export async function upsertMember(member: TeamMember) {
  const memberDoc = doc(collections.members, member.id);
  await setDoc(memberDoc, member, { merge: true });
}

export async function deleteMember(id: string) {
  await deleteDoc(doc(db, 'members', id));
}

export async function upsertRegistryItem(item: DashboardNavItem) {
  const registryDoc = doc(collections.registry, item.id);
  await setDoc(registryDoc, item, { merge: true });
}

export async function deleteRegistryItem(id: string) {
  await deleteDoc(doc(db, 'registry', id));
}

// ─── User Profile Helpers ──────────────────────────────────────────

export async function getUserProfile(uid: string) {
  const userDoc = doc(db, 'users', uid);
  const snapshot = await getDoc(userDoc);
  return snapshot.exists() ? snapshot.data() : null;
}

export async function createUserProfile(uid: string, data: any) {
  const userDoc = doc(db, 'users', uid);
  await setDoc(userDoc, {
    ...data,
    uid,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }, { merge: true });
}

export async function updateUserProfile(uid: string, data: any) {
  const userDoc = doc(db, 'users', uid);
  await updateDoc(userDoc, {
    ...data,
    updatedAt: new Date().toISOString()
  });
}

export async function deleteUserProfile(uid: string) {
  await deleteDoc(doc(db, 'users', uid));
}

/**
 * Perform a bulk delete operation on a specific collection
 */
export async function bulkDelete(collectionName: string, ids: string[]) {
  const batch = writeBatch(db);
  ids.forEach((id) => {
    const docRef = doc(db, collectionName, id);
    batch.delete(docRef);
  });
  await batch.commit();
}

// ─── Project Metadata Helpers ─────────────────────────────────────

export async function getProjectMetadata() {
  const projectDoc = doc(db, 'settings', 'project');
  const snapshot = await getDoc(projectDoc);
  return snapshot.exists() ? snapshot.data() : null;
}

export async function updateProjectMetadata(data: any) {
  const projectDoc = doc(db, 'settings', 'project');
  await setDoc(projectDoc, {
    ...data,
    updatedAt: new Date().toISOString()
  }, { merge: true });
}

export async function uploadFile(file: File, path: string) {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}



