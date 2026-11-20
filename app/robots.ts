import type { MetadataRoute } from "next";

const SITE = "https://www.mxdrpg.com.br";

// Área logada e rotas de API ficam fora do índice.
const FORA_DO_INDICE = ["/api/", "/admin", "/mesa/", "/conta", "/aventura/", "/painel", "/personagem/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: FORA_DO_INDICE },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
