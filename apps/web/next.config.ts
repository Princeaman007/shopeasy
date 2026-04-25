import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://shopeasy-k4rb.onrender.com/api/:path*',
      },
    ];
  },
};

export default nextConfig;