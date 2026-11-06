import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server in .next/standalone, used by the Docker image
  output: "standalone",
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
