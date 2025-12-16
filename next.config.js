const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // Use custom service worker
  sw: 'sw.js',
  // Disable workbox since we have custom service worker
  disableDevLogs: true,
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack configuration
  turbopack: {
    // Set root to current directory to avoid lockfile confusion
    root: __dirname,
  },
}

module.exports = withPWA(nextConfig)
