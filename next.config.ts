import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/compendio", destination: "/compendios", permanent: true },
      { source: "/compendio/:pack", destination: "/compendios/:pack", permanent: true },
      { source: "/biblioteca", destination: "/compendios", permanent: true },
      { source: "/biblioteca/:pack", destination: "/compendios/:pack", permanent: true },
      { source: "/rpg", destination: "/mesas", permanent: false },
    ];
  },
};

export default nextConfig;
