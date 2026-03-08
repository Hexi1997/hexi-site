import type { NextConfig } from "next";
import { join } from "path";

const nextConfig: NextConfig = {
  images: {
    // Disable image optimization in development to avoid network issues
    unoptimized: process.env.NODE_ENV === "development",
    // Allow all remote image sources
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },

  // Production optimizations
  compress: true,

  turbopack: {
    root: join(__dirname, "../..")
  }
};

export default nextConfig;
