import type { NextConfig } from "next";
import { API_URL } from "./src/lib/api-config";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    return {
      fallback: [
        {
          source: "/api/:path*",
          destination: `${API_URL}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
