/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    localPatterns: [
      {
        pathname: '/api/storage/presigned',
        search: '?path=*',
      },
      {
        pathname: '/api/storage/**',
        search: '**',
      },
      {
        pathname: '/**',
        search: '**',
      },
    ],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
