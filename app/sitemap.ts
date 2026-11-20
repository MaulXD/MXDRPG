import type { MetadataRoute } from "next";

const SITE = "https://www.mxdrpg.com.br";

// Só páginas abertas sem sessão. /rpg/eldarin e /rpg/um-anel redirecionam para login, então ficam fora.
const PAGINAS_PUBLICAS = ["/", "/compendios", "/privacidade"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGINAS_PUBLICAS.map((caminho) => ({ url: `${SITE}${caminho}` }));
}
