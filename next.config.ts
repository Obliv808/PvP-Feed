import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["rss-parser", "node-cron"],
};

export default nextConfig;
