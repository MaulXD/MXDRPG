import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Eldarin — VTT tático hexagonal",
    short_name: "Eldarin",
    description:
      "Mesa virtual no navegador: combate hex, Pontos de Ação, fichas e compêndios Eldarin v4.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#120c0a",
    theme_color: "#4a1520",
    lang: "pt-BR",
    categories: ["games", "entertainment"],
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/favicon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
