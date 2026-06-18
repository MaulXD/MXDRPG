import type { Metadata } from "next";

export const SITE_NAME = "MXDRPG";

const LEGACY_DEFAULT_TITLE = /^Eldarin\s*[—–-]\s*VTT tático$/i;

/** Título completo da aba: `MXDRPG — Página`. */
export function formatTabTitle(pageTitle: string): string {
  const trimmed = pageTitle.trim();
  if (!trimmed || trimmed === SITE_NAME) return SITE_NAME;
  return `${SITE_NAME} — ${trimmed}`;
}

export function pageMetadata(pageTitle: string, description?: string): Metadata {
  const meta: Metadata = {
    title: { absolute: formatTabTitle(pageTitle) },
  };
  if (description) meta.description = description;
  return meta;
}

/** Rotas estáticas — fallback client-side se a aba não atualizar após navegação. */
export const STATIC_TAB_TITLES: Record<string, string> = {
  "/": "Seu HUB RPG",
  "/mesas": "Escolher RPG",
  "/eldarin": "Suas mesas",
  "/mesa": "Mesa virtual",
  "/compendios": "Compêndios",
  "/amigos": "Amigos",
  "/conta": "Seu perfil",
  "/sistema": "Como jogar",
  "/mundo": "Mundo",
  "/privacidade": "Privacidade",
  "/aplicativo": "Instalar aplicativo",
  "/instalar": "Implantação",
  "/admin": "Painel administrador",
  "/admin/mesas": "Mesas e membros",
  "/sign-in": "Entrar",
  "/sign-up": "Criar conta",
  "/entrar/apelido": "Escolher apelido",
  "/personagem/novo": "Novo personagem",
};

export function resolveStaticTabTitle(pathname: string): string | null {
  const path = pathname.split("?")[0].replace(/\/$/, "") || "/";
  const pageTitle = STATIC_TAB_TITLES[path];
  if (pageTitle) return formatTabTitle(pageTitle);
  if (path.startsWith("/sign-in")) return formatTabTitle("Entrar");
  if (path.startsWith("/sign-up")) return formatTabTitle("Criar conta");
  return null;
}

export function isLegacySiteTitle(title: string): boolean {
  return LEGACY_DEFAULT_TITLE.test(title.trim()) || /^Eldarin\s*[—–-]/i.test(title.trim());
}
