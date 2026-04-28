import type { NextConfig } from "next";

import path from 'path';

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ['localhost', '127.0.0.1', '192.168.0.101', '192.168.0.193', '192.168.1.3', '192.168.8.113'],
  turbopack: {
    root: path.resolve(__dirname),
  } as any,
};

export default nextConfig;
