/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack configuration
  turbopack: {
    // Set root to current directory to avoid lockfile confusion
    root: __dirname,
  },
}

module.exports = nextConfig
