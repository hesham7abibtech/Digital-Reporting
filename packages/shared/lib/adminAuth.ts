/**
 * Authentication & authorization for admin/API routes — Supabase only.
 *
 * Verifies the caller's Supabase access token (JWT) via the service-role client,
 * then authorizes against their row in the Supabase `users` table. No Firestore,
 * no Firebase. Edge-compatible.
 */
import { getSupabaseAdmin } from './supabase';

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export interface VerifiedUser {
  uid: string;
  email?: string;
  profile: Record<string, any>;
}

function extractBearer(req: Request): string {
  const header = req.headers.get('Authorization') || req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) throw new AuthError('Missing or malformed Authorization header', 401);
  return header.slice('Bearer '.length).trim();
}

/** Verify the Supabase access token and load the caller's profile from `users`. */
export async function verifyUser(req: Request): Promise<VerifiedUser> {
  const token = extractBearer(req);
  const sb = getSupabaseAdmin();

  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) throw new AuthError('Invalid or expired session', 401);

  const { data: profile } = await sb.from('users').select('*').eq('id', data.user.id).maybeSingle();
  if (!profile) throw new AuthError('User profile not found', 403);
  if (profile.status === 'SUSPENDED') throw new AuthError('Account suspended', 403);

  return { uid: data.user.id, email: data.user.email ?? undefined, profile };
}

function isAdminProfile(p: Record<string, any>): boolean {
  return p?.is_admin === true || p?.role === 'OWNER' || p?.role === 'ADMIN';
}

/** Require an authenticated admin/owner. */
export async function verifyAdmin(req: Request): Promise<VerifiedUser> {
  const user = await verifyUser(req);
  if (!isAdminProfile(user.profile)) throw new AuthError('Insufficient permissions', 403);
  return user;
}

/** Require an authenticated user with BIM Reviews access (or admin). */
export async function verifyBimAccess(req: Request): Promise<VerifiedUser> {
  const user = await verifyUser(req);
  const p = user.profile;
  const hasAccess = isAdminProfile(p) || p?.access?.bimReviews === true;
  if (!hasAccess) throw new AuthError('No access to BIM Reviews', 403);
  return user;
}

/** Map an unknown error to a JSON Response with the right status. */
export function authErrorResponse(err: unknown): Response {
  if (err instanceof AuthError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  console.error('[adminAuth] Unexpected error:', err);
  return Response.json({ error: 'Internal authentication error' }, { status: 500 });
}
