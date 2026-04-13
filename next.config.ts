import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "supabase.nexiasoluciones.com.mx",
      },
    ],
  },
};

export default nextConfig;
