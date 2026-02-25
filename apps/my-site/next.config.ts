import type { NextConfig } from "next";
import { join } from "path";

const nextConfig: NextConfig = {
  images: {
    // 开发环境禁用图片优化以避免网络问题
    unoptimized: process.env.NODE_ENV === "development",
    // 允许所有外部图片源
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

  // 生产环境优化
  compress: true,

  // 实验性功能（可选）
  experimental: {
    // optimizePackageImports: ['date-fns'],
    turbopackUseSystemTlsCerts: true,
  },
  turbopack: {
    root: join(__dirname, "../..")
  }
};

export default nextConfig;
