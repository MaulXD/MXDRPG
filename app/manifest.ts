import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/site-metadata";

/** Identidade PWA — altere se precisar forçar reinstalação após rename do app. */
const PWA_ID = "mxdrpg";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: PWA_ID,
    name: SITE_NAME,
    short_name: SITE_NAME,
    description:
      "Mesa virtual no navegador: combate em grid, Pontos de Ação, fichas e compêndios Eldarin v4.",
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
