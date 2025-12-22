/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  // Keep server actions
  experimental: {
    serverActions: {
      allowedOrigins: ['*'],
    },
  },

  // Ignore TS errors during build (still valid)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Explicitly DISABLE Turbopack (this is the missing piece)
  turbopack: {
    enabled: false,
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

  // Webpack config for alias support
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
};

module.exports = nextConfig;
