import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['localhost', '127.0.0.1', '192.168.0.101', '192.168.0.193'],
};

export default nextConfig;
