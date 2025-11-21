import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

   webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Suppress HMR warnings
      const originalEntry = config.entry;
      config.entry = async () => {
        const entries = await originalEntry();
        return entries;
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "example.com",
      },
    ],
  },
};

export default nextConfig;
