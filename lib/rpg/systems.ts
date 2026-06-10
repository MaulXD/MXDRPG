/** Sistemas de RPG disponíveis no hub MXDRPG. */

export type RpgSystemId = "eldarin" | "dnd" | "vtm";

/** Sistema padrão — mesas legadas e criação atual no hub Eldarin. */
export const DEFAULT_RPG_SYSTEM_ID: RpgSystemId = "eldarin";

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
    tagline: "Fantasia tática · grid hex · PA por turno",
    href: "/eldarin",
    available: true,
    coverSrc: "/brand/rpg/eldarin-cover.svg",
    coverAlt: "Capa Eldarin — fantasia tática em grid hexagonal",
  },
  {
    id: "dnd",
    name: "Dungeons & Dragons",
    shortName: "D&D",
    tagline: "Em breve",
    href: null,
    available: false,
    coverSrc: "/brand/rpg/dnd-cover.svg",
    coverAlt: "Capa Dungeons & Dragons — em breve no MXDRPG",
  },
  {
    id: "vtm",
    name: "Vampiro: A Máscara",
    shortName: "Vampiro",
    tagline: "Em breve",
    href: null,
    available: false,
    coverSrc: "/brand/rpg/vtm-cover.svg",
    coverAlt: "Capa Vampiro: A Máscara — em breve no MXDRPG",
  },
];

export function isMesasNavActive(pathname: string): boolean {
  if (pathname === MESAS_HUB_PATH || pathname.startsWith(`${MESAS_HUB_PATH}/`)) return true;
  if (pathname === "/eldarin" || pathname.startsWith("/eldarin/")) return true;
  if (pathname === "/rpg" || pathname.startsWith("/rpg/")) return true;
  if (pathname.startsWith("/aventura/")) return true;
  if (pathname.startsWith("/mesa/") && pathname !== "/mesa" && pathname !== "/mesa/demo") return true;
  return false;
}
