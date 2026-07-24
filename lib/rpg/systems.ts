/** Sistemas de RPG disponíveis no hub MXDRPG. */

export type RpgSystemId = "eldarin" | "arcane" | "vtm" | "um-anel";

/** Sistema padrão — mesas legadas e criação atual no hub Eldarin. */
export const DEFAULT_RPG_SYSTEM_ID: RpgSystemId = "eldarin";

/** Capa padrão Eldarin (mesa VTT, hub e seletor de RPG). */
export const ELDARIN_DEFAULT_COVER_SRC = "/brand/rpg/eldarin-cover.png";

/** Capa placeholder — fantasia clássica (em breve). */
export const ARCANE_DEFAULT_COVER_SRC = "/brand/rpg/arcane-cover.png";

/** Capa padrão Vampiro: A Máscara (mesa VTT, hub e seletor de RPG). */
export const VTM_DEFAULT_COVER_SRC = "/brand/rpg/vtm-cover.png";

/** Capa padrão O Um Anel (mesa VTT, hub e seletor de RPG). */
export const UM_ANEL_DEFAULT_COVER_SRC = "/brand/rpg/um-anel-cover.webp";

const RPG_SYSTEM_IDS = new Set<RpgSystemId>(["eldarin", "arcane", "vtm", "um-anel"]);

export function normalizeRpgSystemId(raw: unknown): RpgSystemId {
  if (typeof raw === "string") {
    if (raw === "dnd") return "arcane";
    if (RPG_SYSTEM_IDS.has(raw as RpgSystemId)) return raw as RpgSystemId;
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

/** Mesas do sistema Eldarin (não confundir com o hub MXDRPG). */
export const ELDARIN_MESAS_PATH = "/rpg/eldarin";

/** Mesas do sistema O Um Anel. */
export const UM_ANEL_MESAS_PATH = "/rpg/um-anel";

export function rpgMesasPath(systemId: RpgSystemId = DEFAULT_RPG_SYSTEM_ID): string {
  const sys = RPG_SYSTEMS.find((s) => s.id === systemId);
  return sys?.href ?? MESAS_HUB_PATH;
}

export const RPG_SYSTEMS: RpgSystem[] = [
  {
    id: "eldarin",
    name: "Eldarin",
    shortName: "Eldarin",
    tagline: "Fantasia tática · grid quadrado · PA por turno",
    href: ELDARIN_MESAS_PATH,
    available: true,
    coverSrc: ELDARIN_DEFAULT_COVER_SRC,
    coverAlt: "Capa Eldarin — logotipo com dragão",
  },
  {
    id: "um-anel",
    name: "O Um Anel",
    shortName: "Um Anel",
    tagline: "Terra-média · perícias + Feat die · esperança e sombra",
    href: UM_ANEL_MESAS_PATH,
    available: true,
    coverSrc: UM_ANEL_DEFAULT_COVER_SRC,
    coverAlt: "Capa O Um Anel — anel dourado sobre fundo escuro",
  },
  {
    id: "arcane",
    name: "Espada & Arcano",
    shortName: "Espada & Arcano",
    tagline: "Em breve",
    href: null,
    available: false,
    coverSrc: ARCANE_DEFAULT_COVER_SRC,
    coverAlt: "Capa Espada & Arcano — fantasia clássica",
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
  if (pathname === ELDARIN_MESAS_PATH || pathname.startsWith(`${ELDARIN_MESAS_PATH}/`)) return true;
  if (pathname === "/eldarin" || pathname.startsWith("/eldarin/")) return true;
  if (pathname === "/rpg" || pathname.startsWith("/rpg/")) return true;
  if (pathname.startsWith("/aventura/")) return true;
  if (pathname.startsWith("/mesa/") && pathname !== "/mesa" && pathname !== "/mesa/demo") return true;
  return false;
}
