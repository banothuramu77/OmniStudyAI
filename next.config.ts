import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  allowedDevOrigins: ["10.10.37.185"],
};

export default nextConfig;
