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
export function useSupabaseCollection<T = any>(collection: string) {
  const table = TABLE[collection] || collection;
  const [docs, setDocs] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const { data, error } = await supabaseBrowser.from(table).select('*');
    if (error) { setError(error.message); setLoading(false); return; }
    setError(null);
    setDocs((data || []).map((r) => rowToDoc<T>(r)));
    setLoading(false);
  }, [table]);

  useEffect(() => {
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
