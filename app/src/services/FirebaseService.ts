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
import { db, storage } from '@/lib/firebase';
import { tasks as mockTasks, teamMembers as mockMembers, dashboardsRegistry as mockRegistry } from '@/lib/data';
import { Task, TeamMember, DashboardNavItem } from '@/lib/types';
import { 
  getFirestore, 
  terminate as firestoreTerminate,
  clearIndexedDbPersistence
} from 'firebase/firestore';

/**
 * Strips 'undefined' values from an object recursively.
 * Firestore setDoc/updateDoc fail if any field is undefined.
 */
function sanitizeData(data: any): any {
  if (data === null || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }

  return Object.fromEntries(
    Object.entries(data)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => [key, sanitizeData(value)])
  );
}

// ─── Realtime sync hooks usually live in components, but helpers here ───

export const collections = {
  tasks: collection(db, 'tasks'),
  members: collection(db, 'members'),
  registry: collection(db, 'registry'),
  users: collection(db, 'users'),
  settings: collection(db, 'settings'),
  departments: collection(db, 'departments'),
  broadcasts: collection(db, 'broadcasts'),
  bimReviews: collection(db, 'bimReviews'),
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
    projectId: 'PRJ-X01',
    companyName: 'KEO International Consultants',
    region: 'Middle East',
    statusLine: 'System Initialized',
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
  const cleanData = sanitizeData(task);
  await setDoc(taskDoc, cleanData, { merge: true });
}

export async function deleteTask(id: string) {
  await deleteDoc(doc(db, 'tasks', id));
}

export async function upsertMember(member: TeamMember) {
  const memberDoc = doc(collections.members, member.id);
  const cleanData = sanitizeData(member);
  await setDoc(memberDoc, cleanData, { merge: true });
}

export async function deleteMember(id: string) {
  await deleteDoc(doc(db, 'members', id));
}

export async function upsertRegistryItem(item: DashboardNavItem) {
  const registryDoc = doc(collections.registry, item.id);
  const cleanData = sanitizeData(item);
  await setDoc(registryDoc, cleanData, { merge: true });
}

export async function deleteRegistryItem(id: string) {
  await deleteDoc(doc(db, 'registry', id));
}

// ─── BIM Review Operations ────────────────────────────────────────

export async function upsertBimReview(review: any) {
  const reviewDoc = doc(collections.bimReviews, review.id);
  const cleanData = sanitizeData({
    ...review,
    updatedAt: new Date().toISOString()
  });
  
  if (!review.createdAt) {
    (cleanData as any).createdAt = new Date().toISOString();
  }

  await setDoc(reviewDoc, cleanData, { merge: true });
}

export async function deleteBimReview(id: string) {
  await deleteDoc(doc(db, 'bimReviews', id));
}

/**
 * Bulk Upsert BIM Reviews with Overwrite or Merge strategy
 */
export async function bulkUpsertBimReviews(reviews: any[], strategy: 'OVERWRITE' | 'MERGE') {
  const batch = writeBatch(db);

  if (strategy === 'OVERWRITE') {
    const { getDocs } = await import('firebase/firestore');
    const snapshot = await getDocs(collections.bimReviews);
    snapshot.docs.forEach(d => batch.delete(d.ref));
  }

  reviews.forEach((review) => {
    // Generate an ID if missing (for new imports)
    const reviewId = review.id || `bim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const reviewDoc = doc(collections.bimReviews, reviewId);
    
    const cleanData = sanitizeData({
      ...review,
      id: reviewId,
      updatedAt: new Date().toISOString(),
      createdAt: review.createdAt || new Date().toISOString()
    });
    batch.set(reviewDoc, cleanData, { merge: true });
  });

  await batch.commit();
}


// ─── Department Operations ────────────────────────────────────────

export async function upsertDepartment(dept: { id: string, name: string, abbreviation: string }) {
  const deptDoc = doc(db, 'departments', dept.id);
  const cleanData = sanitizeData({
    ...dept,
    updatedAt: new Date().toISOString()
  });
  
  // If it's a new department, set createdAt
  if (dept.id.startsWith('new-')) {
    (cleanData as any).createdAt = new Date().toISOString();
  }

  await setDoc(deptDoc, cleanData, { merge: true });
}

export async function deleteDepartment(id: string) {
  await deleteDoc(doc(db, 'departments', id));
}

// ─── User Profile Helpers ──────────────────────────────────────────

export async function getUserProfile(uid: string) {
  const userDoc = doc(db, 'users', uid);
  const snapshot = await getDoc(userDoc);
  return snapshot.exists() ? snapshot.data() : null;
}

export async function createUserProfile(uid: string, data: any) {
  const userDoc = doc(db, 'users', uid);
  const cleanData = sanitizeData({
    ...data,
    uid,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  await setDoc(userDoc, cleanData, { merge: true });
}

export async function updateUserProfile(uid: string, data: any) {
  const userDoc = doc(db, 'users', uid);
  const cleanData = sanitizeData({
    ...data,
    updatedAt: new Date().toISOString()
  });
  await updateDoc(userDoc, cleanData);
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

/**
 * Marks a broadcast as read by adding the user's ID to the readBy array
 */
export async function markBroadcastAsRead(id: string, userId: string) {
  const { arrayUnion, updateDoc, doc } = await import('firebase/firestore');
  const ref = doc(db, 'broadcasts', id);
  await updateDoc(ref, {
    readBy: arrayUnion(userId)
  });
}

// ─── Project Metadata Helpers ─────────────────────────────────────

export async function getProjectMetadata() {
  const projectDoc = doc(db, 'settings', 'project');
  const snapshot = await getDoc(projectDoc);
  return snapshot.exists() ? snapshot.data() : null;
}

export async function updateProjectMetadata(data: any) {
  const projectDoc = doc(db, 'settings', 'project');
  const cleanData = sanitizeData({
    ...data,
    updatedAt: new Date().toISOString()
  });
  await setDoc(projectDoc, cleanData, { merge: true });
}

export async function updateMetadataSuggestions(types: string[], cdes: string[]) {
  const metaDoc = doc(db, 'settings', 'taskMetadata');
  const snapshot = await getDoc(metaDoc);
  const currentData = snapshot.exists() ? snapshot.data() : { deliverableTypes: [], cdeEnvironments: [] };
  
  const updatedTypes = Array.from(new Set([...(currentData.deliverableTypes || []), ...types]));
  const updatedCdes = Array.from(new Set([...(currentData.cdeEnvironments || []), ...cdes]));
  
  await setDoc(metaDoc, {
    deliverableTypes: updatedTypes,
    cdeEnvironments: updatedCdes,
    updatedAt: new Date().toISOString()
  }, { merge: true });
}

export async function uploadFile(file: File, path: string) {
  // Cloudinary Direct Unsigned Upload
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary environment variables are missing. Please configure .env.local.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('public_id', path); // Optionally set the desired folder/filename

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Cloudinary upload failed: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.secure_url;
}



