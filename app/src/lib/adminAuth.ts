/**
 * Authentication & authorization for BIM Reviews API routes (edge-compatible).
 *
 * Verifies Firebase ID tokens cryptographically (RS256 against Google's published
 * JWKs, with iss/aud/exp checks) — a hardening over decode-only checks — then
 * authorizes against the caller's Firestore `users/{uid}` profile.
 */
import { getSupabaseAdmin } from './supabase';

const PROJECT_ID = 'keodigitalreporting';
const ISSUER = `https://securetoken.google.com/${PROJECT_ID}`;
const JWK_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

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

// ─── JWK cache ────────────────────────────────────────────────────
let jwkCache: { at: number; keys: Record<string, JsonWebKey> } | null = null;
const JWK_TTL_MS = 60 * 60 * 1000; // 1h

async function getJwks(): Promise<Record<string, JsonWebKey>> {
  const now = Date.now();
  if (jwkCache && now - jwkCache.at < JWK_TTL_MS) return jwkCache.keys;

  const res = await fetch(JWK_URL);
  if (!res.ok) throw new AuthError('Unable to fetch token signing keys', 503);
  const data = await res.json();
  const keys: Record<string, JsonWebKey> = {};
  for (const k of data.keys ?? []) keys[k.kid] = k;
  jwkCache = { at: now, keys };
  return keys;
}

function base64UrlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(b64url.length / 4) * 4, '=');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function decodeJsonSegment(seg: string): any {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(seg)));
}

/** Cryptographically verify a Firebase ID token; returns its decoded payload. */
export async function verifyFirebaseIdToken(token: string): Promise<any> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new AuthError('Malformed token', 401);
  const [headerB64, payloadB64, sigB64] = parts;

  let header: any;
  let payload: any;
  try {
    header = decodeJsonSegment(headerB64);
    payload = decodeJsonSegment(payloadB64);
  } catch {
    throw new AuthError('Invalid token encoding', 401);
  }

  if (header.alg !== 'RS256' || !header.kid) throw new AuthError('Unexpected token algorithm', 401);

  const jwks = await getJwks();
  const jwk = jwks[header.kid];
  if (!jwk) throw new AuthError('Unknown token signing key', 401);

  const key = await crypto.subtle.importKey(
    'jwk',
    { ...jwk, alg: 'RS256', ext: true } as JsonWebKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    base64UrlToBytes(sigB64) as BufferSource,
    new TextEncoder().encode(`${headerB64}.${payloadB64}`),
  );
  if (!valid) throw new AuthError('Token signature verification failed', 401);

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) throw new AuthError('Token expired', 401);
  if (payload.iss !== ISSUER) throw new AuthError('Invalid token issuer', 401);
  if (payload.aud !== PROJECT_ID) throw new AuthError('Invalid token audience', 401);
  if (!payload.sub) throw new AuthError('Token missing subject', 401);

  return payload;
}

function extractBearer(req: Request): string {
  const header = req.headers.get('Authorization') || req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) throw new AuthError('Missing or malformed Authorization header', 401);
  return header.slice('Bearer '.length).trim();
}

/**
 * Verify the caller (Firebase ID token) and load their profile from the Supabase
 * `users` table by firebase_uid. No Firestore. Throws AuthError otherwise.
 */
export async function verifyUser(req: Request): Promise<VerifiedUser> {
  const token = extractBearer(req);
  const payload = await verifyFirebaseIdToken(token);
  const uid = payload.sub as string;

  const sb = getSupabaseAdmin();
  const { data: profile } = await sb.from('users').select('*').eq('firebase_uid', uid).maybeSingle();
  if (!profile) throw new AuthError('User profile not found', 403);

  // Suspended accounts are denied regardless of role.
  if (profile.status === 'SUSPENDED') throw new AuthError('Account suspended', 403);

  return { uid, email: payload.email, profile };
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
