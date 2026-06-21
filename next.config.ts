import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/vendor/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, immutable" },
        ],
      },
      {
        source: "/:path*.woff2",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, immutable" }],
      },
    ];
  },
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
