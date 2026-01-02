import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["uploadthing", "@uploadthing/react"],
  
  // Empty turbopack config to silence the warning and let Next.js handle it
  turbopack: {},
  
  async rewrites() {
    const gateway = process.env.API_GATEWAY_URL ?? "http://localhost:4001";

    return [
      { source: "/auth/:path*", destination: `${gateway}/auth/:path*` },
      { source: "/users/:path*", destination: `${gateway}/users/:path*` },
      { source: "/me/:path*", destination: `${gateway}/me/:path*` },
    ];
  },
};

export default nextConfig;
