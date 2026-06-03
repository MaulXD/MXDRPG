import type { NextConfig } from "next";
import path from "node:path";

/** Monorepo: app em web/, package.json na raiz — evita aviso de workspace/lockfile no build */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, ".."),
};

export default nextConfig;
