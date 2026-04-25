import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/backend/:path*',
        destination: 'https://shopeasy-k4rb.onrender.com/api/:path*',
      },
    ];
  },
};

export default nextConfig;