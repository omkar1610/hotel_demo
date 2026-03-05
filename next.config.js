/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages deployment
  output: 'standalone',

  images: {
    // Allow Supabase storage images
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

module.exports = nextConfig
