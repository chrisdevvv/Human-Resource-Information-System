import type { NextConfig } from "next";

const normalizeTarget = (value: string): string => value.replace(/\/+$/, "");
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const rawProxyTarget =
  process.env.API_PROXY_TARGET ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (IS_PRODUCTION ? "" : "http://localhost:3000");

const apiProxyTarget = /^https?:\/\//i.test(rawProxyTarget)
  ? normalizeTarget(rawProxyTarget)
  : "";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
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
