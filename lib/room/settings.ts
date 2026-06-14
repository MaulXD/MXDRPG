import { sanitizePortraitFocus, type PortraitFocus } from "@/lib/media/portrait-focus";
import { isTokenDefeated } from "@/lib/vtt/token-hp-display";
import type { BattleToken } from "@/lib/vtt/types";

/** Configurações da mesa — só o mestre (ownerId) altera. */
export type RoomSettings = {
  /** Modo combate: PA, iniciativa e ordem de turno. */
  combatActive: boolean;
  /** Delay do auto-passe quando PA = 0 (ms). */
  autoPassDelayMs: number;
  /** XP automático ao derrotar monstros. */
  xpFromMonstersEnabled: boolean;
  showMonsterHpToPlayers: boolean;
  showMonsterHpInChat: boolean;
  allowPlayerPing: boolean;
  showUsernameOnTokenNameplate: boolean;
  /** @deprecated Sempre falso — ações só na vez de cada token. Mantido no schema do banco. */
  gmBypassInitiative: boolean;
  gmCreations?: Record<string, import("@/lib/room/gm-creations").GmCreation>;
  coverUrl?: string | null;
  coverFocus?: import("@/lib/media/portrait-focus").PortraitFocus | null;
};

export const DEFAULT_AUTO_PASS_DELAY_MS = 1500;

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  combatActive: false,
  autoPassDelayMs: DEFAULT_AUTO_PASS_DELAY_MS,
  xpFromMonstersEnabled: true,
  showMonsterHpToPlayers: false,
  showMonsterHpInChat: false,
  allowPlayerPing: true,
  showUsernameOnTokenNameplate: false,
  gmBypassInitiative: false,
};

export function normalizeRoomSettings(raw?: Partial<RoomSettings> | null): RoomSettings {
  const delay =
    typeof raw?.autoPassDelayMs === "number" && raw.autoPassDelayMs >= 0
      ? Math.min(10_000, Math.round(raw.autoPassDelayMs))
      : DEFAULT_ROOM_SETTINGS.autoPassDelayMs;
  return {
    combatActive: raw?.combatActive ?? DEFAULT_ROOM_SETTINGS.combatActive,
    autoPassDelayMs: delay,
    xpFromMonstersEnabled:
      raw?.xpFromMonstersEnabled ?? DEFAULT_ROOM_SETTINGS.xpFromMonstersEnabled,
    showMonsterHpToPlayers:
      raw?.showMonsterHpToPlayers ?? DEFAULT_ROOM_SETTINGS.showMonsterHpToPlayers,
    showMonsterHpInChat:
      raw?.showMonsterHpInChat ?? DEFAULT_ROOM_SETTINGS.showMonsterHpInChat,
    allowPlayerPing: raw?.allowPlayerPing ?? DEFAULT_ROOM_SETTINGS.allowPlayerPing,
    showUsernameOnTokenNameplate:
      raw?.showUsernameOnTokenNameplate ?? DEFAULT_ROOM_SETTINGS.showUsernameOnTokenNameplate,
    gmBypassInitiative: false,
    gmCreations: raw?.gmCreations,
    coverUrl:
      typeof raw?.coverUrl === "string" && raw.coverUrl.trim() ? raw.coverUrl.trim() : null,
    coverFocus: sanitizePortraitFocus(raw?.coverFocus),
  };
}

export function isMonsterToken(token: BattleToken): boolean {
  if (token.linked) return false;
  return Boolean(token.monsterEntryId || token.gmCreationId || token.gmCreatureStats);
}

/** Remove HP numérico do token (para snapshot de jogadores). */
export function redactMonsterHp(token: BattleToken): BattleToken {
  const defeated = isTokenDefeated(token);
  return {
    ...token,
    vida: undefined,
    vidaMax: undefined,
    vidaTemp: undefined,
    defeated: defeated ? true : undefined,
  };
}
