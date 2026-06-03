import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /** Repo root tem livros/vinite — evita warning de lockfile errado na Vercel */
  outputFileTracingRoot: path.join(__dirname, ".."),
};

export default nextConfig;
