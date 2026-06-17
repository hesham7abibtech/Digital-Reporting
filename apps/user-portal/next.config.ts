import type { NextConfig } from "next";

import path from 'path';

const SECURITY_HEADERS = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

// Monorepo root — used as Turbopack's resolution root so the shared package
// (packages/shared) and hoisted node_modules resolve during build.
const MONOREPO_ROOT = path.resolve(__dirname, '../../');

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  // Anchor file-tracing to THIS app dir (not the monorepo root). On Cloudflare
  // Pages, @cloudflare/next-on-pages runs `vercel build` from this app dir; a
  // monorepo-root tracing root makes Vercel record the output as
  // `apps/user-portal/.next`, joined onto the app-dir cwd →
  // `apps/user-portal/apps/user-portal/.next` (ENOENT). Keeping it local avoids
  // the doubling. Build runs with --webpack (see package.json) so Turbopack's
  // "outputFileTracingRoot must equal turbopack.root" constraint doesn't apply.
  outputFileTracingRoot: __dirname,
  allowedDevOrigins: ['localhost', '127.0.0.1', '192.168.0.101', '192.168.0.193', '192.168.1.3', '192.168.8.113'],
  turbopack: {
    root: MONOREPO_ROOT,
  } as any,
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
