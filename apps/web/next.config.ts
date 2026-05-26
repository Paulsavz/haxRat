import type { NextConfig } from 'next'

const config: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'utf-8-validate': false,
        bufferutil: false,
        net: false,
        tls: false,
        fs: false,
      }
    }
    return config
  },
}

export default config
