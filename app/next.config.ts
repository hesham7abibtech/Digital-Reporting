import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ['localhost', '127.0.0.1', '192.168.0.101', '192.168.0.193', '192.168.1.3', '192.168.8.113'],
};

export default nextConfig;
