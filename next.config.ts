import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite (preview-mode in-process DB) ships WASM and must not be bundled.
  serverExternalPackages: ["@electric-sql/pglite"],
  experimental: {
    // Allow photo uploads via Server Actions (default limit is 1MB).
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
