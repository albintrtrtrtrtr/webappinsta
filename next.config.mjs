/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [
        {
          source: '/en',
          destination: '/',
        },
        {
          source: '/en/:path*',
          destination: '/:path*',
        },
      ],
      fallback: [],
    };
  },
};

export default nextConfig;
