/**
 * Edge-Native Notion REST Client (scoped to the BIM Reviews Report).
 *
 * Uses the Web `fetch` API only (no SDK) so it runs unchanged on the Cloudflare
 * Pages edge runtime, mirroring the approach in `firebase-rest.ts`.
 *
 * Credentials come exclusively from environment variables:
 *   - NOTION_TOKEN            Internal Integration Token (secret)
 *   - NOTION_BIM_DATABASE_ID  The BIM Reviews Report database id
 *   - NOTION_VERSION          Optional API version (default 2022-06-28)
 */

const NOTION_API = 'https://api.notion.com/v1';
const DEFAULT_VERSION = '2022-06-28';
const MAX_RETRIES = 5;
const PAGE_SIZE = 100; // Notion max

export interface NotionConfig {
  token: string;
  databaseId: string;
  version: string;
}

export interface NotionPage {
  id: string;
  created_time: string;
  last_edited_time: string;
  properties: Record<string, any>;
}

/** True only when both the token and the BIM database id are present. */
export function isNotionConfigured(): boolean {
  return Boolean(process.env.NOTION_TOKEN && process.env.NOTION_BIM_DATABASE_ID);
}

export function getNotionConfig(): NotionConfig {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_BIM_DATABASE_ID;
  if (!token) throw new Error('NOTION_TOKEN is not configured');
  if (!databaseId) throw new Error('NOTION_BIM_DATABASE_ID is not configured');
  return { token, databaseId, version: process.env.NOTION_VERSION || DEFAULT_VERSION };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Single Notion request with safe rate-limit handling:
 *  - honours `Retry-After` on HTTP 429
 *  - exponential backoff on 5xx
 *  - capped retries, then throws
 */
async function notionFetch(
  path: string,
  cfg: NotionConfig,
  body?: unknown,
): Promise<any> {
  let attempt = 0;

  while (true) {
    const res = await fetch(`${NOTION_API}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        'Notion-Version': cfg.version,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.ok) return res.json();

    const retriable = res.status === 429 || res.status >= 500;
    if (retriable && attempt < MAX_RETRIES) {
      const retryAfter = Number(res.headers.get('Retry-After'));
      const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : Math.min(1000 * 2 ** attempt, 8000); // 1s,2s,4s,8s cap
      attempt += 1;
      await sleep(waitMs);
      continue;
    }

    const text = await res.text().catch(() => '');
    throw new Error(`Notion request failed (${res.status}): ${text}`);
  }
}

/**
 * Query the configured BIM database, following pagination cursors until exhausted.
 * Returns the raw Notion pages (mapping to the domain model happens in bimSource.ts).
 */
export async function queryDatabasePages(cfg: NotionConfig): Promise<NotionPage[]> {
  const pages: NotionPage[] = [];
  let cursor: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const data = await notionFetch(`/databases/${cfg.databaseId}/query`, cfg, {
      page_size: PAGE_SIZE,
      ...(cursor ? { start_cursor: cursor } : {}),
    });

    for (const page of data.results ?? []) {
      pages.push({
        id: page.id,
        created_time: page.created_time,
        last_edited_time: page.last_edited_time,
        properties: page.properties ?? {},
      });
    }

    hasMore = Boolean(data.has_more);
    cursor = data.next_cursor || undefined;
    if (!cursor) hasMore = false;
  }

  return pages;
}

/** Lightweight connectivity/permission probe used by the admin status endpoint. */
export async function pingNotionDatabase(cfg: NotionConfig): Promise<{ ok: boolean; title?: string }> {
  const data = await notionFetch(`/databases/${cfg.databaseId}`, cfg);
  const title = (data.title ?? []).map((t: any) => t?.plain_text ?? '').join('') || undefined;
  return { ok: true, title };
}

// ─── Property extraction helpers ──────────────────────────────────
// Notion returns a typed object per property; these normalise the types we map.

/** Read a property as a single string regardless of its Notion type. */
export function propToString(prop: any): string {
  if (!prop) return '';
  switch (prop.type) {
    case 'title':
      return (prop.title ?? []).map((t: any) => t.plain_text ?? '').join('').trim();
    case 'rich_text':
      return (prop.rich_text ?? []).map((t: any) => t.plain_text ?? '').join('').trim();
    case 'select':
      return prop.select?.name ?? '';
    case 'status':
      return prop.status?.name ?? '';
    case 'multi_select':
      return (prop.multi_select ?? []).map((o: any) => o.name).join(', ');
    case 'people':
      return (prop.people ?? []).map((p: any) => p.name ?? p.id).join(', ');
    case 'date':
      return prop.date?.start ?? '';
    case 'url':
      return prop.url ?? '';
    case 'email':
      return prop.email ?? '';
    case 'phone_number':
      return prop.phone_number ?? '';
    case 'number':
      return prop.number != null ? String(prop.number) : '';
    case 'checkbox':
      return prop.checkbox ? 'true' : 'false';
    case 'unique_id':
      return prop.unique_id
        ? `${prop.unique_id.prefix ? prop.unique_id.prefix + '-' : ''}${prop.unique_id.number ?? ''}`
        : '';
    case 'formula':
      return prop.formula?.string ?? (prop.formula?.number != null ? String(prop.formula.number) : '');
    case 'created_time':
      return prop.created_time ?? '';
    case 'last_edited_time':
      return prop.last_edited_time ?? '';
    default:
      return '';
  }
}

/** Read a property as a string array (multi_select / people / newline / comma split). */
export function propToStringArray(prop: any): string[] {
  if (!prop) return [];
  switch (prop.type) {
    case 'multi_select':
      return (prop.multi_select ?? []).map((o: any) => o.name).filter(Boolean);
    case 'people':
      return (prop.people ?? []).map((p: any) => p.name ?? p.id).filter(Boolean);
    case 'relation':
      return (prop.relation ?? []).map((r: any) => r.id).filter(Boolean);
    default: {
      const s = propToString(prop);
      return s ? s.split(/\n|,(?!\s)/).map((x) => x.trim()).filter(Boolean) : [];
    }
  }
}

/** Read a date property as an ISO date (YYYY-MM-DD) or null. */
export function propToDate(prop: any): string | null {
  const s = propToString(prop);
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toISOString().split('T')[0];
}
