/**
 * Canonical site identity for REH Digital.
 *
 * Every auth/recovery/redirect link is generated from these — never from raw
 * `window.location.origin` — so all emailed links and redirects carry the
 * rehdigital.com identity and can't be pointed elsewhere (open-redirect safe).
 *
 * Local testing: set NEXT_PUBLIC_SITE_URL=http://localhost:3000 in .env.local.
 * Production: NEXT_PUBLIC_SITE_URL=https://rehdigital.com (default if unset).
 */
const stripTrailing = (u: string) => u.replace(/\/+$/, '');

export const SITE_URL = stripTrailing(process.env.NEXT_PUBLIC_SITE_URL || 'https://rehdigital.com');
export const CONSOLE_URL = stripTrailing(process.env.NEXT_PUBLIC_CONSOLE_URL || 'https://console.rehdigital.com');

/** Absolute, branded URL on the user portal, e.g. authUrl('/auth/reset'). */
export function authUrl(path: string = '/auth/reset'): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Absolute, branded URL on the admin console. */
export function consoleUrl(path: string = '/'): string {
  return `${CONSOLE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
