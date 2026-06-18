import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readEnv } from './serverEnv';

/**
 * Server-only Supabase admin client (service_role key — bypasses RLS).
 *
 * Reads its URL + service-role key via `readEnv` so it works on Cloudflare Pages,
 * where secrets are on the request context rather than `process.env`.
 * NEVER import this into a client component.
 */
let _admin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('getSupabaseAdmin() must never run in the browser');
  }
  const url = readEnv('NEXT_PUBLIC_SUPABASE_URL');
  const key = readEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  if (!_admin) {
    _admin = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _admin;
}
