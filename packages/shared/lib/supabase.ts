import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase clients for the Digital Reporting Dashboard (migration target).
 *
 *  - `supabaseBrowser`     : client-side, publishable key, session-only persistence
 *                            (mirrors the old Firebase browserSessionPersistence).
 *  - `getSupabaseAdmin()`  : server-only, service_role key, bypasses RLS.
 *                            NEVER import into client components.
 *  - `getSupabaseForToken` : server-side, RLS-respecting client acting as a user.
 *
 * Edge-compatible (uses global fetch) — safe on Cloudflare Pages route handlers.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const PUBLISHABLE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string;

// ── Browser (client components) ────────────────────────────────────
export const supabaseBrowser: SupabaseClient = createClient(URL, PUBLISHABLE, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // needed for set-password / recovery links
    storageKey: 'dr-auth',
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
  },
});

// ── Server admin (service_role — bypasses RLS) ─────────────────────
let _admin: SupabaseClient | null = null;
export function getSupabaseAdmin(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('getSupabaseAdmin() must never run in the browser');
  }
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  if (!_admin) {
    _admin = createClient(URL, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _admin;
}

// ── Server, scoped to a user's JWT (RLS-respecting) ────────────────
export function getSupabaseForToken(accessToken: string): SupabaseClient {
  return createClient(URL, PUBLISHABLE, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
