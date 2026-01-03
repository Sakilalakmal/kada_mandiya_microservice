import type { NextConfig } from "next";

const gateway = process.env.API_GATEWAY_URL ?? "http://localhost:4001";
const publicApiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? gateway).replace(/\/+$/, "");

const baseImagePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  { protocol: "https", hostname: "utfs.io", pathname: "/**" },
  { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
  { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
  { protocol: "http", hostname: "localhost", pathname: "/**" },
  { protocol: "https", hostname: "localhost", pathname: "/**" },
  { protocol: "http", hostname: "127.0.0.1", pathname: "/**" },
  { protocol: "https", hostname: "127.0.0.1", pathname: "/**" },
];

const apiHostPattern = (() => {
  try {
    const parsed = new URL(publicApiBase);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return {
      protocol: parsed.protocol.replace(":", "") as "http" | "https",
      hostname: parsed.hostname,
      port: parsed.port || undefined,
      pathname: "/**",
    };
  } catch {
    return null;
  }
})();

const seenPatterns = new Set<string>();
const remotePatterns = [...baseImagePatterns, apiHostPattern]
  .filter(Boolean)
  .filter((pattern) => {
    const key = `${pattern!.protocol}://${pattern!.hostname}:${pattern!.port ?? ""}${pattern!.pathname}`;
    if (seenPatterns.has(key)) return false;
    seenPatterns.add(key);
    return true;
  }) as NonNullable<NextConfig["images"]>["remotePatterns"];

const nextConfig: NextConfig = {
  transpilePackages: ["uploadthing", "@uploadthing/react"],

  // Empty turbopack config to silence the warning and let Next.js handle it
  turbopack: {},
  images: {
    remotePatterns,
  },
  env: {
    NEXT_PUBLIC_API_GATEWAY_URL: publicApiBase,
    NEXT_PUBLIC_API_BASE_URL: publicApiBase,
  },

  async rewrites() {
    return [
      { source: "/auth/:path*", destination: `${gateway}/auth/:path*` },
      { source: "/users/:path*", destination: `${gateway}/users/:path*` },
      { source: "/me/:path*", destination: `${gateway}/me/:path*` },
    ];
  },
};

export default nextConfig;
