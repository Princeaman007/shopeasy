import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  async rewrites() {
    return [
      {
        source:      '/api/:path*',
        destination: 'https://shopeasy-k4rb.onrender.com/api/:path*',
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/api/proxy/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin',      value: '*'                                    },
          { key: 'Access-Control-Allow-Methods',     value: 'GET,POST,PUT,PATCH,DELETE,OPTIONS'    },
          { key: 'Access-Control-Allow-Headers',     value: 'Content-Type, Authorization'          },
          { key: 'Access-Control-Allow-Credentials', value: 'true'                                 },
        ],
      },
    ];
  },
};

export default nextConfig;