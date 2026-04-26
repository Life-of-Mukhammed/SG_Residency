import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Ensure JSON locale files are bundled at build time
  experimental: {
    // Treat all locales as server-side only unless client components import them
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options',        value: 'DENY' },
        ],
      },
    ];
  },

  // Redirect bare / to /<defaultLocale> (middleware handles the rest)
  async redirects() {
    return [];
  },
};

export default nextConfig;
