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

// Monorepo root — so the shared package (packages/shared) and hoisted
// node_modules are included in build output tracing.
const MONOREPO_ROOT = path.resolve(__dirname, '../../');

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  outputFileTracingRoot: MONOREPO_ROOT,
  allowedDevOrigins: ['localhost', '127.0.0.1', '192.168.0.101', '192.168.0.193', '192.168.1.3', '192.168.8.113'],
  turbopack: {
    root: MONOREPO_ROOT,
  } as any,
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
