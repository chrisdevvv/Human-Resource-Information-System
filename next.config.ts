import type { NextConfig } from "next";

const normalizeTarget = (value: string): string => value.replace(/\/+$/, "");

const rawProxyTarget =
  process.env.API_PROXY_TARGET || process.env.NEXT_PUBLIC_API_BASE_URL || "";

const apiProxyTarget = /^https?:\/\//i.test(rawProxyTarget)
  ? normalizeTarget(rawProxyTarget)
  : "";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    if (!apiProxyTarget) {
      return [];
    }

    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
