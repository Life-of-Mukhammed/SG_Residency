import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['*'],
  },
  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
  },
};

export default nextConfig;
