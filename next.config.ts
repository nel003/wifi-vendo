import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals as any[]), "serialport"];
    }
    return config;
  },
  env: {
    TZ: "Asia/Manila", // Set timezone for server-side rendering
  },
};

export default nextConfig;