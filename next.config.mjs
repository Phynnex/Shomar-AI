/** @type {import('next').NextConfig} */
const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL && process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/+$/, '')) ||
  'https://shomar-production.up.railway.app';

const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  eslint: {
    ignoreDuringBuilds: true
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_BASE}/api/:path*`
      }
    ];
  }
};

export default nextConfig;
