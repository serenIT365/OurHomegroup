import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@zoom/meetingsdk", "@zoom/videosdk"],
};

export default nextConfig;
