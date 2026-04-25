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
  writeBatch,
  arrayUnion
} from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { tasks as mockTasks, teamMembers as mockMembers, dashboardsRegistry as mockRegistry } from '@/lib/data';
import { Task, TeamMember, DashboardNavItem } from '@/lib/types';
import { getApiEndpoint } from '@/lib/apiConfig';
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
  diagnostics: collection(db, 'diagnostics'),
  tickets: collection(db, 'tickets'),
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
    { id: 'admin-2', name: 'System Architect', email: 'architect@rehdigital.com', role: 'SUPER_ADMIN', status: 'ACTIVE' }
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

export async function atomicRenumberTask(oldId: string, newTask: Task) {
  const batch = writeBatch(db);
  const oldRef = doc(collections.tasks, oldId);
  const newRef = doc(collections.tasks, newTask.id);
  
  batch.delete(oldRef);
  batch.set(newRef, sanitizeData({
    ...newTask,
    updatedAt: new Date().toISOString()
  }));
  
  await batch.commit();
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

/**
 * Bulk Upsert Tasks with Overwrite or Append strategy
 */
export async function bulkUpsertTasks(tasks: Task[], strategy: 'OVERWRITE' | 'APPEND') {
  const batch = writeBatch(db);
  const { getDocs } = await import('firebase/firestore');

  if (strategy === 'OVERWRITE') {
    // 1. Purge existing records for a fresh slate
    const snapshot = await getDocs(collections.tasks);
    snapshot.docs.forEach(d => batch.delete(d.ref));

    // 2. Fetch departments for intelligent ID re-coding
    const deptsSnapshot = await getDocs(collections.departments);
    const departments = deptsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
    
    // 3. Track sequential counters per department abbreviation
    const counters: Record<string, number> = {};

    tasks.forEach((task) => {
      // Normalize department lookup
      const d = departments.find((dept: any) => dept.id === task.department || dept.name === task.department);
      const abbr = d?.abbreviation || (task.department ? String(task.department).slice(0, 3).toUpperCase() : 'GEN');
      
      if (!counters[abbr]) counters[abbr] = 100;
      const sequentialId = `REH - ${abbr} - ${counters[abbr]}`;
      counters[abbr]++;

      const taskDoc = doc(collections.tasks, sequentialId);
      const cleanData = sanitizeData({
        ...task,
        id: sequentialId,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(), // Fresh import, fresh record
        status: task.status || 'NOT_STARTED',
        completion: task.completion ?? 0
      });
      batch.set(taskDoc, cleanData, { merge: true });
    });
  } else {
    // Simple Append mode
    tasks.forEach((task) => {
      const taskId = task.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const taskDoc = doc(collections.tasks, taskId);
      
      const cleanData = sanitizeData({
        ...task,
        id: taskId,
        updatedAt: new Date().toISOString(),
        createdAt: task.createdAt || new Date().toISOString(),
        status: task.status || 'NOT_STARTED',
        completion: task.completion ?? 0
      });
      batch.set(taskDoc, cleanData, { merge: true });
    });
  }

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
  
  // 1. Bootstrapping: Auto-approve the primary administrator
  const isPrimaryAdmin = data.email?.toLowerCase() === 'hesham.habib@insiteinternational.com';
  
  const cleanData = sanitizeData({
    ...data,
    uid,
    role: isPrimaryAdmin ? 'OWNER' : 'TEAM_MATE',
    isVerified: false, 
    isApproved: isPrimaryAdmin, 
    isAdmin: isPrimaryAdmin,    // Grant administrative portal access
    access: {
      deliverablesRegistry: isPrimaryAdmin, // Grant feature access to primary admin
      bimReviews: isPrimaryAdmin
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  await setDoc(userDoc, cleanData, { merge: true });
}

export async function updateUserProfile(uid: string, data: any, triggerNotification: boolean = false) {
  const userDoc = doc(db, 'users', uid);
  const cleanData = sanitizeData({
    ...data,
    updatedAt: new Date().toISOString()
  });
  await updateDoc(userDoc, cleanData);

  if (triggerNotification && data.isApproved && data.email) {
    try {
      await fetch(getApiEndpoint('/api/mail'), {
        method: 'POST',
        body: JSON.stringify({
          type: 'ACCOUNT_APPROVED',
          to: data.email,
          payload: { name: data.name }
        })
      });
    } catch (err) {
      console.error('[SERVICE] Approval notification failed:', err);
    }
  }
}

export async function deleteUserProfile(uid: string) {
  await deleteDoc(doc(db, 'users', uid));
}

export async function logRegistrationEvent(uid: string, stage: string, status: 'success' | 'failure', details?: any) {
  try {
    // Session Propagation Grace Period:
    // Ensure Auth token is attached to Firestore headers
    await new Promise(resolve => setTimeout(resolve, 200));

    const diagDoc = doc(db, 'diagnostics', uid);
    
    await setDoc(diagDoc, {
      uid,
      lastUpdated: new Date().toISOString(),
      stages: arrayUnion({
        timestamp: new Date().toISOString(),
        stage,
        status,
        details: sanitizeData(details || {})
      })
    }, { merge: true });
  } catch (err) {
    console.error('Diagnostic log failure:', err);
  }
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
  try {
    const snapshot = await getDoc(metaDoc);
    const currentData = snapshot.exists() ? snapshot.data() : { deliverableTypes: [], cdeEnvironments: [] };
    
    const currentTypes = (currentData.deliverableTypes || []) as string[];
    const currentCdes = (currentData.cdeEnvironments || []) as string[];
    
    // Check if new entries actually need to be added
    const newTypes = types.filter(t => t && !currentTypes.includes(t));
    const newCdes = cdes.filter(c => c && !currentCdes.includes(c));
    
    if (newTypes.length === 0 && newCdes.length === 0) return; // Skip redundant write
    
    await setDoc(metaDoc, {
      deliverableTypes: Array.from(new Set([...currentTypes, ...newTypes])),
      cdeEnvironments: Array.from(new Set([...currentCdes, ...newCdes])),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Metadata update failure (non-critical):', err);
  }
}

// ─── Home Page CMS Helpers ─────────────────────────────────────────

export async function getHomePageConfig() {
  const homeDoc = doc(db, 'settings', 'homePage');
  const snapshot = await getDoc(homeDoc);
  return snapshot.exists() ? snapshot.data() : null;
}

export async function updateHomePageConfig(data: any) {
  const homeDoc = doc(db, 'settings', 'homePage');
  const cleanData = sanitizeData({
    ...data,
    updatedAt: new Date().toISOString()
  });
  await setDoc(homeDoc, cleanData, { merge: true });
}

export async function uploadFile(file: File, path: string): Promise<string> {
  // Cloudinary Direct Unsigned Upload
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary configuration missing in .env.local');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('public_id', path);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Cloudinary upload failed: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log(`[STORAGE] Successfully uploaded to Cloudinary: ${path}`);
    return data.secure_url;
  } catch (error: any) {
    console.error('[STORAGE] Cloudinary Upload Error:', error);
    throw error;
  }
}



