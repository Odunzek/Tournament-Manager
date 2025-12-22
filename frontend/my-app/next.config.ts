/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Production-ready server actions configuration
  experimental: {
    serverActions: {
      // In production, restrict to your actual domains
      allowedOrigins: process.env.NODE_ENV === 'production'
        ? [process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app']
        : ['*'],
    },
  },

  // TypeScript - set to false once all type errors are fixed
  typescript: {
    ignoreBuildErrors: true, // TODO: Fix type errors and set to false
  },

  // Image domains (this part is fine)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'gravatar.com' },
      { protocol: 'https', hostname: '**.gravatar.com' },
      { protocol: 'https', hostname: 'i.imgur.com' },
      { protocol: 'https', hostname: 'cdn.discordapp.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'robohash.org' },
    ],
  },

  // Security headers (also fine)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        ],
      },
    ];
  },

  // Turbopack configuration (Next.js 16+)
  turbopack: {},

  // Webpack config for alias support (fallback for non-Turbopack builds)
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
};

module.exports = nextConfig;
