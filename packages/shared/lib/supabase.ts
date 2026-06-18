import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase clients for the Digital Reporting Dashboard (migration target).
 *
 *  - `supabaseBrowser`     : client-side, publishable key, session-only persistence
 *                            (mirrors the old Firebase browserSessionPersistence).
 *  - `getSupabaseAdmin()`  : MOVED to `./supabaseAdmin` (server-only) so this
 *                            client-safe module never pulls in next-on-pages.
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

// ── Server admin (service_role) moved to ./supabaseAdmin (server-only) ──

// ── Server, scoped to a user's JWT (RLS-respecting) ────────────────
export function getSupabaseForToken(accessToken: string): SupabaseClient {
  return createClient(URL, PUBLISHABLE, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
