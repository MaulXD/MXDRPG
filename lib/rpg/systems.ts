/** Sistemas de RPG disponíveis no hub MXDRPG. */

export type RpgSystemId = "eldarin" | "dnd" | "vtm";

/** Sistema padrão — mesas legadas e criação atual no hub Eldarin. */
export const DEFAULT_RPG_SYSTEM_ID: RpgSystemId = "eldarin";

/** Capa padrão Eldarin (mesa VTT, hub e seletor de RPG). */
export const ELDARIN_DEFAULT_COVER_SRC = "/brand/rpg/eldarin-cover.png";

/** Capa padrão D&D (mesa VTT, hub e seletor de RPG). */
export const DND_DEFAULT_COVER_SRC = "/brand/rpg/dnd-cover.png";

/** Capa padrão Vampiro: A Máscara (mesa VTT, hub e seletor de RPG). */
export const VTM_DEFAULT_COVER_SRC = "/brand/rpg/vtm-cover.png";

const RPG_SYSTEM_IDS = new Set<RpgSystemId>(["eldarin", "dnd", "vtm"]);

export function normalizeRpgSystemId(raw: unknown): RpgSystemId {
  if (typeof raw === "string" && RPG_SYSTEM_IDS.has(raw as RpgSystemId)) {
    return raw as RpgSystemId;
  }
  return DEFAULT_RPG_SYSTEM_ID;
}

export type RpgSystem = {
  id: RpgSystemId;
  name: string;
  shortName: string;
  tagline: string;
  /** Rota das mesas do sistema; null = em breve */
  href: string | null;
  available: boolean;
  coverSrc: string;
  coverAlt: string;
};

export const MESAS_HUB_PATH = "/mesas";

export const RPG_SYSTEMS: RpgSystem[] = [
  {
    id: "eldarin",
    name: "Eldarin",
    shortName: "Eldarin",
    tagline: "Fantasia tática · grid quadrado · PA por turno",
    href: "/eldarin",
    available: true,
    coverSrc: ELDARIN_DEFAULT_COVER_SRC,
    coverAlt: "Capa Eldarin — logotipo com dragão",
  },
  {
    id: "dnd",
    name: "Dungeons & Dragons",
    shortName: "D&D",
    tagline: "Em breve",
    href: null,
    available: false,
    coverSrc: DND_DEFAULT_COVER_SRC,
    coverAlt: "Capa Dungeons & Dragons",
  },
  {
    id: "vtm",
    name: "Vampiro: A Máscara",
    shortName: "Vampiro",
    tagline: "Em breve",
    href: null,
    available: false,
    coverSrc: VTM_DEFAULT_COVER_SRC,
    coverAlt: "Capa Vampiro: A Máscara",
  },
];

export function getDefaultRpgCover(systemId: RpgSystemId = DEFAULT_RPG_SYSTEM_ID): string {
  return RPG_SYSTEMS.find((s) => s.id === systemId)?.coverSrc ?? ELDARIN_DEFAULT_COVER_SRC;
}

/** Capa exibida na lista/VTT — só mantém upload do mestre; senão usa a capa padrão do sistema. */
export function resolveMesaCoverSrc(
  coverUrl?: string | null,
  systemId: RpgSystemId = DEFAULT_RPG_SYSTEM_ID
): string {
  const url = coverUrl?.trim();
  if (url?.startsWith("data:image/")) return url;
  return getDefaultRpgCover(systemId);
}

export function isMesasNavActive(pathname: string): boolean {
  if (pathname === MESAS_HUB_PATH || pathname.startsWith(`${MESAS_HUB_PATH}/`)) return true;
  if (pathname === "/eldarin" || pathname.startsWith("/eldarin/")) return true;
  if (pathname === "/rpg" || pathname.startsWith("/rpg/")) return true;
  if (pathname.startsWith("/aventura/")) return true;
  if (pathname.startsWith("/mesa/") && pathname !== "/mesa" && pathname !== "/mesa/demo") return true;
  return false;
}
