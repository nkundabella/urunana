import type { NextConfig } from "next";

const backendOrigin = (
  process.env.INTERNAL_API_URL || "http://localhost:4000"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  devIndicators: false,
  output: "standalone",
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendOrigin}/api/v1/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backendOrigin}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
