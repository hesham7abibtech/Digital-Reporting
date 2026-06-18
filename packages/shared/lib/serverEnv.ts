import { getRequestContext } from '@cloudflare/next-on-pages';

/**
 * Read a runtime env var / secret on the server.
 *
 * On Cloudflare Pages (next-on-pages) the Pages vars AND (critically) the
 * ENCRYPTED secrets live on the per-request context — NOT on `process.env`.
 * Reading `process.env.SUPABASE_SERVICE_ROLE_KEY` there returns undefined, which
 * is why every admin API 500'd with "… is not configured". So: check the
 * request context first, then fall back to process.env (local dev / node /
 * build-inlined NEXT_PUBLIC_* values).
 *
 * SERVER-ONLY: never import this (or anything that imports it) into a client
 * component — it pulls in `@cloudflare/next-on-pages`.
 */
export function readEnv(key: string): string | undefined {
  try {
    const v = (getRequestContext().env as Record<string, unknown> | undefined)?.[key];
    if (typeof v === 'string' && v) return v;
  } catch {
    // Not inside a Cloudflare request (local dev, build step, tests).
  }
  const p = typeof process !== 'undefined' ? process.env?.[key] : undefined;
  return p || undefined;
}
