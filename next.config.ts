import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite (preview-mode in-process DB) ships WASM and must not be bundled.
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
