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
        sizes: "32x32",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/favicon.png",
        sizes: "32x32",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
