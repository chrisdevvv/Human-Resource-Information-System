import type { NextConfig } from "next";

const normalizeTarget = (value: string): string => value.replace(/\/+$/, "");

const rawProxyTarget =
  process.env.API_PROXY_TARGET ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:3000";

const apiProxyTarget = /^https?:\/\//i.test(rawProxyTarget)
  ? normalizeTarget(rawProxyTarget)
  : "http://localhost:3000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
