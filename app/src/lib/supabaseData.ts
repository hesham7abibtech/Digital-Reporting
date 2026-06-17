'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabaseBrowser } from './supabase';

/**
 * Supabase data layer — realtime reads + writes for the app, replacing the
 * Firestore client SDK. Tables store the full document in a `data` jsonb column
 * plus promoted columns for RLS/queries, so `rowToDoc` reconstructs the exact
 * document shape the UI already expects (incl. spaced keys like "InSite Review Status").
 */

// Legacy Firestore collection name → Supabase table.
export const TABLE: Record<string, string> = {
  tasks: 'tasks',
  members: 'members',
  registry: 'registry',
  departments: 'departments',
  broadcasts: 'broadcasts',
  bimReviews: 'bim_reviews',
  tickets: 'tickets',
  users: 'users',
  policies: 'group_policies',
  settings: 'settings',
  chat_sessions: 'chat_sessions',
  diagnostics: 'diagnostics',
};

/** Supabase row → app document shape `{ id, ...data }`. */
export function rowToDoc<T = any>(row: any): T {
  const doc: any = { ...(row?.data || {}), id: row?.id };
  // users carry the auth uid as the row id; expose it as `uid` for legacy code.
  if (row && Object.prototype.hasOwnProperty.call(row, 'firebase_uid')) {
    doc.uid = row.id;
    doc.firebase_uid = row.firebase_uid;
  }
  return doc as T;
}

/**
 * Live collection hook. Returns `{ docs, loading, error, refresh }` and keeps
 * `docs` in sync via a Supabase Realtime subscription (refetches on any change).
 * RLS scopes what each authenticated user can see — identical to firestore.rules.
 */
export function useSupabaseCollection<T = any>(collection: string | null) {
  const table = collection ? (TABLE[collection] || collection) : null;
  const [docs, setDocs] = useState<T[]>([]);
  const [loading, setLoading] = useState(!!table);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!table) { setDocs([]); setLoading(false); return; }
    const { data, error } = await supabaseBrowser.from(table).select('*');
    if (error) { setError(error.message); setLoading(false); return; }
    setError(null);
    setDocs((data || []).map((r) => rowToDoc<T>(r)));
    setLoading(false);
  }, [table]);

  useEffect(() => {
    if (!table) { setDocs([]); setLoading(false); return; }
    let active = true;
    fetchAll();
    const channel = supabaseBrowser
      .channel(`rt:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => { if (active) fetchAll(); })
      .subscribe();
    return () => { active = false; supabaseBrowser.removeChannel(channel); };
  }, [table, fetchAll]);

  return { docs, loading, error, refresh: fetchAll };
}

// ─── Firestore-snapshot-compatible hooks (drop-in for react-firebase-hooks) ──
// Lets the existing UI keep using `snapshot.docs.map(d => ({ id: d.id, ...d.data() }))`.
type SnapDoc<T> = { id: string; data: () => T };
export interface CompatSnapshot<T = any> { docs: SnapDoc<T>[]; size: number; empty: boolean; }

export function useCollectionCompat<T = any>(
  collection: string | null,
  opts?: { sortBy?: string; dir?: 'asc' | 'desc' },
): [CompatSnapshot<T> | null, boolean, string | undefined] {
  const { docs, loading, error } = useSupabaseCollection<any>(collection);
  let rows = docs;
  if (opts?.sortBy) {
    const key = opts.sortBy; const dir = opts.dir === 'desc' ? -1 : 1;
    rows = [...docs].sort((a, b) => (a?.[key] > b?.[key] ? dir : a?.[key] < b?.[key] ? -dir : 0));
  }
  const snapshot: CompatSnapshot<T> | null = collection
    ? { docs: rows.map((d) => ({ id: d.id, data: () => d as T })), size: rows.length, empty: rows.length === 0 }
    : null;
  return [snapshot, loading, error || undefined];
}

export function useDocCompat<T = any>(
  collection: string,
  id: string,
): [{ data: () => T | undefined; exists: boolean; id: string } | null, boolean] {
  const { doc, loading } = useSupabaseDoc<any>(collection, id);
  const snap = { id, exists: !!doc, data: () => (doc || undefined) as T | undefined };
  return [snap, loading];
}

/** Live single document (e.g. settings/project). */
export function useSupabaseDoc<T = any>(collection: string, id: string) {
  const table = TABLE[collection] || collection;
  const [doc, setDoc] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOne = useCallback(async () => {
    const { data } = await supabaseBrowser.from(table).select('*').eq('id', id).maybeSingle();
    setDoc(data ? rowToDoc<T>(data) : null);
    setLoading(false);
  }, [table, id]);

  useEffect(() => {
    let active = true;
    fetchOne();
    const channel = supabaseBrowser
      .channel(`rt:${table}:${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table, filter: `id=eq.${id}` }, () => { if (active) fetchOne(); })
      .subscribe();
    return () => { active = false; supabaseBrowser.removeChannel(channel); };
  }, [table, id, fetchOne]);

  return { doc, loading, refresh: fetchOne };
}

// ─── Writes (RLS-enforced: admin/owner per firestore.rules parity) ──────────
// Promoted columns that several tables filter/sort on, derived from the doc.
function promotedColumns(table: string, doc: any): Record<string, unknown> {
  switch (table) {
    case 'tasks': return { title: doc.title ?? null, status: doc.status ?? null, completion: doc.completion ?? null, precinct: doc.precinct ?? null, department: doc.department ?? null, submitter_id: doc.submitterId ?? null };
    case 'bim_reviews': return { project: doc.Project ?? null, status: doc['InSite Review Status'] ?? null };
    case 'members': return { name: doc.name ?? null, email: doc.email ?? null, role: doc.role ?? null, department: doc.department ?? null, status: doc.status ?? null };
    case 'registry': return { name: doc.name ?? null, category: doc.category ?? null, status: doc.status ?? null };
    case 'departments': return { name: doc.name ?? null, abbreviation: doc.abbreviation ?? null };
    case 'broadcasts': return { title: doc.title ?? null, type: doc.type ?? null, severity: doc.severity ?? null, read_by: doc.readBy ?? [] };
    case 'tickets': return { uid: doc.uid ?? null, email: doc.email ?? null, status: doc.status ?? null };
    case 'group_policies': return { name: doc.name ?? null, description: doc.description ?? null, modules: doc.modules ?? null };
    default: return {};
  }
}

/** Upsert a document (full doc kept in `data` + promoted columns). */
export async function saveDoc(collection: string, doc: any): Promise<void> {
  const table = TABLE[collection] || collection;
  const id = doc.id || doc.ID;
  const now = new Date().toISOString();
  const { id: _omit, ...rest } = doc;
  const row = { id, data: rest, updated_at: now, ...promotedColumns(table, doc) };
  const { error } = await supabaseBrowser.from(table).upsert(row);
  if (error) throw new Error(error.message);
}

export async function removeDoc(collection: string, id: string): Promise<void> {
  const table = TABLE[collection] || collection;
  const { error } = await supabaseBrowser.from(table).delete().eq('id', id);
  if (error) throw new Error(error.message);
}
