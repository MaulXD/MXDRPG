import type { NextConfig } from "next";

const STATIC_PUBLIC_CACHE = "public, max-age=86400, stale-while-revalidate=604800";

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
      // P-09: imagens, texturas e o motor dos dados ficavam com max-age=0, e o navegador
      // perguntava ao servidor por cada arquivo a cada visita (~400 ms cada no oficial).
      // Os nomes não têm hash, então 1 dia + revalidação em segundo plano, sem immutable.
      // O sw.js fica de fora de propósito: service worker precisa chegar novo.
      ...["/assets/:path*", "/brand/:path*", "/icons/:path*", "/favicon.ico", "/favicon.png", "/icon.svg"].map(
        (source) => ({
          source,
          headers: [{ key: "Cache-Control", value: STATIC_PUBLIC_CACHE }],
        })
      ),
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
