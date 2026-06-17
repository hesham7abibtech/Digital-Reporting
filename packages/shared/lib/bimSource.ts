/**
 * BIM Reviews Report — multi-source data strategy.
 *
 * Resolves the unified BIM Reviews dataset from Notion and/or the manual
 * Supabase store according to the admin-configured mode. Strictly scoped to
 * the "BIM Reviews Report" — it does not generalise to other report types.
 * Storage is Supabase only (no Firestore).
 */
import { BIMReview } from './types';
import { getSupabaseAdmin } from './supabase';
import {
  NotionConfig,
  NotionPage,
  pingNotionDatabase,
  propToDate,
  propToString,
  propToStringArray,
  queryDatabasePages,
} from './notion';

// ─── Configuration model ──────────────────────────────────────────
export type DataSourceMode = 'notion' | 'manual' | 'hybrid';
export type MergeStrategy = 'manual_override' | 'notion_override';
export type SyncFrequency = 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'manual';

export interface BimSourceConfig {
  /** Active data-source strategy. */
  mode: DataSourceMode;
  /** Master switch — when false, Notion is never read even in notion/hybrid mode. */
  notionSyncEnabled: boolean;
  /** How to resolve records that share the same ID across both sources. */
  mergeStrategy: MergeStrategy;
  /** How often Notion is re-fetched (drives the live cache freshness window). */
  syncFrequency: SyncFrequency;
  /** Optional clock time for scheduled syncs — 'HH:MM' (daily/weekly) or day-of-month (monthly). */
  syncTime?: string;
  updatedAt?: string;
  updatedBy?: string;
}

/** Cache-freshness window (ms) implied by each sync frequency. */
export function ttlForFrequency(freq?: SyncFrequency): number {
  switch (freq) {
    case 'hourly': return 60 * 60 * 1000;
    case 'daily': return 24 * 60 * 60 * 1000;
    case 'weekly': return 7 * 24 * 60 * 60 * 1000;
    case 'monthly': return 30 * 24 * 60 * 60 * 1000;
    case 'manual': return Number.MAX_SAFE_INTEGER; // never auto-refetch until a credential change / manual refresh
    case 'realtime':
    default: return 60 * 1000;
  }
}

export const BIM_SOURCE_CONFIG_PATH = 'bimReviewsSource'; // Supabase `settings` row id

export const DEFAULT_BIM_SOURCE_CONFIG: BimSourceConfig = {
  mode: 'notion',
  notionSyncEnabled: true,
  mergeStrategy: 'manual_override',
  syncFrequency: 'realtime',
  syncTime: '',
};

/** A unified record is a canonical BIMReview annotated with its origin. */
export type UnifiedBimReview = BIMReview & { source: 'notion' | 'manual' };

export interface UnifiedResult {
  mode: DataSourceMode;
  data: UnifiedBimReview[];
  sources: { notion: number; manual: number };
  notionActive: boolean;
  warnings: string[];
}

// ─── Notion -> BIMReview property mapping ─────────────────────────
type FieldKind = 'string' | 'array' | 'date';
interface FieldSpec { prop: string; kind: FieldKind }

/**
 * Default mapping of canonical BIMReview fields -> Notion property name.
 * Name your Notion columns to match these, or override names via the
 * NOTION_BIM_PROPERTY_MAP env var: {"Project":"Project Name", ...}
 */
// Each canonical BIMReview field carries the SAME header aliases the Excel importer
// uses (see bimImportUtils). The Notion column names are matched to these
// automatically, so a Notion DB prepared like the Excel template maps with no config.
const FIELD_DEFS: Record<string, { aliases: string[]; kind: FieldKind }> = {
  'ID': { aliases: ['ID', 'record id', 'uid', 'reference'], kind: 'string' },
  'Precinct': { aliases: ['Precinct', 'site', 'location', 'area'], kind: 'array' },
  'Project': { aliases: ['Project', 'project name', 'project detail', 'development'], kind: 'string' },
  'Stakeholder': { aliases: ['Stakeholder', 'consultant', 'lead', 'party', 'company'], kind: 'string' },
  'Submitter': { aliases: ['Submitter', 'author', 'originator', 'submitted by', 'created by', 'owner'], kind: 'string' },
  'Milestone Submissions': { aliases: ['Milestone Submissions', 'description', 'milestone', 'deliverable'], kind: 'array' },
  'Submission Category': { aliases: ['Submission Category', 'category', 'submission type'], kind: 'array' },
  'Design Stage': { aliases: ['Design Stage', 'stage', 'phase'], kind: 'string' },
  'ACC Review ID': { aliases: ['ACC Review ID', 'review #', 'review id', 'acc id'], kind: 'string' },
  'InSite Review Status': { aliases: ['InSite Review Status', 'review status', 'gate status', 'insite status', 'status'], kind: 'string' },
  'InSite Review Due Date': { aliases: ['InSite Review Due Date', 'due date', 'review due date', 'due'], kind: 'date' },
  'InSite Reviewer': { aliases: ['InSite Reviewer', 'reviewer', 'reviewer name'], kind: 'array' },
  'InSite Review Output ACC URL': { aliases: ['InSite Review Output ACC URL', 'acc url', 'output url', 'link', 'url'], kind: 'string' },
  'General Comments': { aliases: ['General Comments', 'comments', 'comment', 'notes'], kind: 'string' },
};

const normName = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

function parseOverride(raw?: string): Record<string, string> {
  if (!raw) return {};
  try {
    const o = JSON.parse(raw);
    return o && typeof o === 'object' && !Array.isArray(o) ? o : {};
  } catch { return {}; }
}

/**
 * Resolve each field to a real Notion property name: explicit override first, then
 * an alias match against the database's actual property names, then the canonical
 * name as fallback. Pass the DB's property keys to enable auto-detection.
 */
function resolveFieldMap(propertyKeys: string[] = [], overrideJson?: string): Record<string, FieldSpec> {
  const override = parseOverride(overrideJson);
  const keys = propertyKeys.map((k) => ({ raw: k, n: normName(k) }));
  const out: Record<string, FieldSpec> = {};
  for (const [field, def] of Object.entries(FIELD_DEFS)) {
    let prop = typeof override[field] === 'string' ? override[field] : '';
    if (!prop) {
      for (const alias of def.aliases) {
        const na = normName(alias);
        const hit = keys.find((k) => k.n === na) || keys.find((k) => k.n.includes(na) || na.includes(k.n));
        if (hit) { prop = hit.raw; break; }
      }
    }
    out[field] = { prop: prop || def.aliases[0], kind: def.kind };
  }
  return out;
}

/** Look up a Notion property by name, case-insensitively. */
function findProp(properties: Record<string, any>, name: string): any {
  if (properties[name]) return properties[name];
  const lower = name.toLowerCase();
  const key = Object.keys(properties).find((k) => k.toLowerCase() === lower);
  return key ? properties[key] : undefined;
}

export function mapNotionPageToBimReview(
  page: NotionPage,
  fieldMap: Record<string, FieldSpec> = resolveFieldMap(),
): UnifiedBimReview {
  const props = page.properties || {};

  const readString = (field: string): string => {
    const spec = fieldMap[field];
    return spec ? propToString(findProp(props, spec.prop)) : '';
  };
  const readArray = (field: string): string[] => {
    const spec = fieldMap[field];
    return spec ? propToStringArray(findProp(props, spec.prop)) : [];
  };
  const readDate = (field: string): string | null => {
    const spec = fieldMap[field];
    return spec ? propToDate(findProp(props, spec.prop)) : null;
  };

  // Stable ID: mapped ID column, else fall back to the Notion page id so
  // records still merge/dedupe deterministically.
  const id = readString('ID') || page.id;

  return {
    id,
    'ID': id,
    'Precinct': readArray('Precinct'),
    'Project': readString('Project'),
    'Stakeholder': readString('Stakeholder'),
    'Submitter': readString('Submitter'),
    'Milestone Submissions': readArray('Milestone Submissions'),
    'Submission Category': readArray('Submission Category'),
    'Design Stage': readString('Design Stage'),
    'ACC Review ID': readString('ACC Review ID'),
    'InSite Review Status': readString('InSite Review Status'),
    'InSite Review Due Date': readDate('InSite Review Due Date'),
    'InSite Reviewer': readArray('InSite Reviewer'),
    'InSite Review Output ACC URL': readString('InSite Review Output ACC URL'),
    'General Comments': readString('General Comments'),
    createdAt: page.created_time,
    updatedAt: page.last_edited_time,
    source: 'notion',
  };
}

// ─── Merge logic (hybrid) ─────────────────────────────────────────
/**
 * Merge Notion + manual records, deduped by `ID`. On ID collision the winner is
 * decided by strategy: 'manual_override' (default) lets manual entries override
 * Notion; 'notion_override' does the reverse. Non-colliding records are appended.
 */
export function mergeReviews(
  notion: UnifiedBimReview[],
  manual: UnifiedBimReview[],
  strategy: MergeStrategy,
): UnifiedBimReview[] {
  const map = new Map<string, UnifiedBimReview>();
  const base = strategy === 'manual_override' ? notion : manual;
  const override = strategy === 'manual_override' ? manual : notion;
  for (const r of base) map.set(r.ID, r);
  for (const r of override) map.set(r.ID, r);
  return [...map.values()];
}

// ─── Notion credential resolution (Supabase secret > env fallback) ──
// The token lives in the Supabase `secrets` table (RLS denies all client access;
// only the service_role server client can read it). Never Firestore.
export const BIM_NOTION_SECRET_PATH = 'bimNotion'; // Supabase `secrets` row id

export interface NotionCredentials {
  token?: string;
  databaseId?: string;
  version?: string;
  propertyMap?: string;
  updatedAt?: string;
  updatedBy?: string;
}

interface NotionRuntime {
  config: NotionConfig;
  propMapJson?: string;
  source: 'supabase' | 'env' | 'mixed';
}

export async function getStoredNotionCredentials(): Promise<NotionCredentials> {
  const sb = getSupabaseAdmin();
  const { data } = await sb.from('secrets').select('data').eq('id', BIM_NOTION_SECRET_PATH).maybeSingle();
  return ((data?.data as NotionCredentials) || {});
}

/** Effective Notion runtime: stored Supabase secret takes priority, env is the fallback. */
async function resolveNotionRuntime(): Promise<NotionRuntime | null> {
  const stored = await getStoredNotionCredentials();
  const token = (stored.token?.trim() || process.env.NOTION_TOKEN || '').trim();
  const databaseId = (stored.databaseId?.trim() || process.env.NOTION_BIM_DATABASE_ID || '').trim();
  if (!token || !databaseId) return null;
  const version = (stored.version?.trim() || process.env.NOTION_VERSION || '2022-06-28').trim();
  const propMapJson = stored.propertyMap?.trim() || process.env.NOTION_BIM_PROPERTY_MAP;
  const source: NotionRuntime['source'] = stored.token?.trim()
    ? (process.env.NOTION_TOKEN ? 'mixed' : 'supabase')
    : 'env';
  return { config: { token, databaseId, version }, propMapJson, source };
}

export async function saveNotionCredentials(
  patch: { token?: string; databaseId?: string; version?: string; propertyMap?: string },
  updatedBy: string,
): Promise<void> {
  const current = await getStoredNotionCredentials();
  const next: NotionCredentials = { ...current, updatedAt: new Date().toISOString(), updatedBy };
  // Only overwrite the token when a non-empty value is supplied, so admins can
  // edit other fields without re-entering the secret.
  if (typeof patch.token === 'string' && patch.token.trim()) next.token = patch.token.trim();
  if (typeof patch.databaseId === 'string') next.databaseId = patch.databaseId.trim();
  if (typeof patch.version === 'string') next.version = patch.version.trim();
  if (typeof patch.propertyMap === 'string') next.propertyMap = patch.propertyMap.trim();
  const sb = getSupabaseAdmin();
  await sb.from('secrets').upsert({ id: BIM_NOTION_SECRET_PATH, data: next, updated_at: new Date().toISOString() });
  clearNotionCache();
}

export interface NotionConnectionInfo {
  configured: boolean;
  source: 'supabase' | 'env' | 'mixed' | 'none';
  hasStoredToken: boolean;
  tokenHint?: string; // masked, e.g. ntn_…12sU
  databaseId?: string;
  version?: string;
  propertyMapSet: boolean;
  tested: boolean; // whether a live Notion test was actually performed this call
  connection: { ok: boolean; title?: string; error?: string };
}

function maskToken(token: string): string {
  if (token.length <= 8) return '••••';
  return `${token.slice(0, 4)}…${token.slice(-4)}`;
}

/**
 * Masked connection status for the admin UI — never returns the raw token, never throws.
 * Performs a LIVE Notion test ONLY when `opts.test` is set (Save / Re-test); a plain
 * page load returns status without contacting Notion (so visiting never shows a 404).
 */
export async function getNotionConnectionInfo(opts: { test?: boolean } = {}): Promise<NotionConnectionInfo> {
  const stored = await getStoredNotionCredentials();
  const rt = await resolveNotionRuntime();
  const info: NotionConnectionInfo = {
    configured: rt !== null,
    source: rt?.source ?? 'none',
    hasStoredToken: Boolean(stored.token?.trim()),
    propertyMapSet: Boolean(stored.propertyMap?.trim() || process.env.NOTION_BIM_PROPERTY_MAP),
    tested: false,
    connection: { ok: false },
  };
  if (!rt) return info;
  info.tokenHint = maskToken(rt.config.token);
  info.databaseId = rt.config.databaseId;
  info.version = rt.config.version;
  if (opts.test) {
    info.tested = true;
    try {
      const ping = await pingNotionDatabase(rt.config);
      info.connection = { ok: ping.ok, title: ping.title };
    } catch (e: any) {
      info.connection = { ok: false, error: e?.message || 'Notion connection failed' };
    }
  }
  return info;
}

// ─── Source readers ───────────────────────────────────────────────
const NOTION_CACHE_TTL_MS = 60_000;
let notionCache: { key: string; at: number; data: UnifiedBimReview[] } | null = null;

/** Fetch + map Notion reviews, memoised in-isolate for the configured freshness window. */
async function getNotionReviews(rt: NotionRuntime, ttlMs: number = NOTION_CACHE_TTL_MS): Promise<UnifiedBimReview[]> {
  const now = Date.now();
  if (notionCache && notionCache.key === rt.config.databaseId && now - notionCache.at < ttlMs) {
    return notionCache.data;
  }
  const pages = await queryDatabasePages(rt.config);
  // Auto-detect the column→field mapping from the database's real property names.
  const keys = new Set<string>();
  for (const p of pages) for (const k of Object.keys(p.properties || {})) keys.add(k);
  const fieldMap = resolveFieldMap([...keys], rt.propMapJson);
  const data = pages.map((p) => mapNotionPageToBimReview(p, fieldMap));
  notionCache = { key: rt.config.databaseId, at: now, data };
  return data;
}

/** All manually-entered/imported reviews from the Supabase `bim_reviews` table. */
async function getManualReviews(): Promise<UnifiedBimReview[]> {
  const sb = getSupabaseAdmin();
  const { data: rows } = await sb.from('bim_reviews').select('id, data');
  return (rows || []).map((row: any) => {
    const r = (row.data || {}) as Partial<BIMReview>;
    return {
      id: r.ID || row.id,
      'ID': r.ID || row.id,
      'Precinct': r['Precinct'] ?? [],
      'Project': r['Project'] ?? '',
      'Stakeholder': r['Stakeholder'] ?? '',
      'Submitter': r['Submitter'] ?? '',
      'Milestone Submissions': r['Milestone Submissions'] ?? [],
      'Submission Category': r['Submission Category'] ?? [],
      'Design Stage': r['Design Stage'] ?? '',
      'ACC Review ID': r['ACC Review ID'] ?? '',
      'InSite Review Status': r['InSite Review Status'] ?? '',
      'InSite Review Due Date': r['InSite Review Due Date'] ?? null,
      'InSite Reviewer': r['InSite Reviewer'] ?? [],
      'InSite Review Output ACC URL': r['InSite Review Output ACC URL'] ?? '',
      'General Comments': r['General Comments'] ?? '',
      createdAt: r.createdAt ?? '',
      updatedAt: r.updatedAt ?? '',
      source: 'manual',
    } as UnifiedBimReview;
  });
}

export function clearNotionCache() {
  notionCache = null;
}

// ─── Unified resolver ─────────────────────────────────────────────
export async function getUnifiedBimReviews(config: BimSourceConfig): Promise<UnifiedResult> {
  const warnings: string[] = [];

  if (config.mode === 'manual') {
    const manual = await getManualReviews();
    return { mode: 'manual', data: manual, sources: { notion: 0, manual: manual.length }, notionActive: false, warnings };
  }

  // notion/hybrid resolve credentials (Supabase secret > env) once.
  const rt = await resolveNotionRuntime();
  const notionUsable = config.notionSyncEnabled && rt !== null;
  const ttl = ttlForFrequency(config.syncFrequency);

  if (config.notionSyncEnabled && rt === null) {
    warnings.push('Notion sync is enabled but no Notion credentials are configured (Admin → API Connections).');
  }

  if (config.mode === 'notion') {
    if (!notionUsable) {
      if (!config.notionSyncEnabled) warnings.push('Notion sync is disabled; returning no Notion data.');
      return { mode: 'notion', data: [], sources: { notion: 0, manual: 0 }, notionActive: false, warnings };
    }
    const notion = await getNotionReviews(rt!, ttl);
    return { mode: 'notion', data: notion, sources: { notion: notion.length, manual: 0 }, notionActive: true, warnings };
  }

  // hybrid
  const manual = await getManualReviews();
  let notion: UnifiedBimReview[] = [];
  if (notionUsable) {
    notion = await getNotionReviews(rt!, ttl);
  } else if (!config.notionSyncEnabled) {
    warnings.push('Notion sync is disabled; hybrid mode is serving manual data only.');
  }
  const merged = mergeReviews(notion, manual, config.mergeStrategy);
  return {
    mode: 'hybrid',
    data: merged,
    sources: { notion: notion.length, manual: manual.length },
    notionActive: notionUsable,
    warnings,
  };
}

// ─── Config persistence (Supabase `settings` row 'bimReviewsSource') ─────
export async function getBimSourceConfig(): Promise<BimSourceConfig> {
  const sb = getSupabaseAdmin();
  const { data } = await sb.from('settings').select('data').eq('id', BIM_SOURCE_CONFIG_PATH).maybeSingle();
  const parsed = (data?.data as Partial<BimSourceConfig>) || {};
  const FREQS: SyncFrequency[] = ['realtime', 'hourly', 'daily', 'weekly', 'monthly', 'manual'];
  return {
    mode: (['notion', 'manual', 'hybrid'].includes(parsed.mode as string) ? parsed.mode : DEFAULT_BIM_SOURCE_CONFIG.mode) as DataSourceMode,
    notionSyncEnabled: typeof parsed.notionSyncEnabled === 'boolean' ? parsed.notionSyncEnabled : DEFAULT_BIM_SOURCE_CONFIG.notionSyncEnabled,
    mergeStrategy: (['manual_override', 'notion_override'].includes(parsed.mergeStrategy as string) ? parsed.mergeStrategy : DEFAULT_BIM_SOURCE_CONFIG.mergeStrategy) as MergeStrategy,
    syncFrequency: (FREQS.includes(parsed.syncFrequency as SyncFrequency) ? parsed.syncFrequency : DEFAULT_BIM_SOURCE_CONFIG.syncFrequency) as SyncFrequency,
    syncTime: typeof parsed.syncTime === 'string' ? parsed.syncTime : '',
    updatedAt: parsed.updatedAt,
    updatedBy: parsed.updatedBy,
  };
}

export async function saveBimSourceConfig(
  patch: Partial<Pick<BimSourceConfig, 'mode' | 'notionSyncEnabled' | 'mergeStrategy' | 'syncFrequency' | 'syncTime'>>,
  updatedBy: string,
): Promise<BimSourceConfig> {
  const current = await getBimSourceConfig();
  const next: BimSourceConfig = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
  const sb = getSupabaseAdmin();
  await sb.from('settings').upsert({ id: BIM_SOURCE_CONFIG_PATH, data: next, updated_at: new Date().toISOString() });
  // a frequency change should take effect immediately
  if (patch.syncFrequency !== undefined) clearNotionCache();
  return next;
}

/** Connection status for the admin status endpoint (never throws). */
export async function getNotionStatus(): Promise<{ configured: boolean; ok: boolean; title?: string; error?: string }> {
  const info = await getNotionConnectionInfo({ test: true });
  return { configured: info.configured, ok: info.connection.ok, title: info.connection.title, error: info.connection.error };
}
