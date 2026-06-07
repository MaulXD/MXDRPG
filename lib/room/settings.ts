import type { BattleToken } from "@/lib/vtt/types";
import type { GmCreation } from "@/lib/room/gm-creations";

/** Preferências da mesa — só o mestre (ownerId) altera. */
export type RoomSettings = {
  /** Jogadores veem barra e valores de HP em tokens de monstro. */
  showMonsterHpToPlayers: boolean;
  /** Chat de combate mostra barra HP quando o alvo é monstro. */
  showMonsterHpInChat: boolean;
  /** Jogadores podem enviar ping no mapa (Alt+clique). */
  allowPlayerPing: boolean;
  /** Mestre age fora da iniciativa e controla qualquer token na vez. */
  gmBypassInitiative: boolean;
  /** Fichas criadas pelo mestre (templates editáveis, não são PCs de jogador). */
  gmCreations?: Record<string, GmCreation>;
};

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  showMonsterHpToPlayers: false,
  showMonsterHpInChat: false,
  allowPlayerPing: true,
  gmBypassInitiative: true,
};

export function normalizeRoomSettings(raw?: Partial<RoomSettings> | null): RoomSettings {
  return {
    showMonsterHpToPlayers:
      raw?.showMonsterHpToPlayers ?? DEFAULT_ROOM_SETTINGS.showMonsterHpToPlayers,
    showMonsterHpInChat:
      raw?.showMonsterHpInChat ?? DEFAULT_ROOM_SETTINGS.showMonsterHpInChat,
    allowPlayerPing: raw?.allowPlayerPing ?? DEFAULT_ROOM_SETTINGS.allowPlayerPing,
    gmBypassInitiative:
      raw?.gmBypassInitiative ?? DEFAULT_ROOM_SETTINGS.gmBypassInitiative,
    gmCreations: raw?.gmCreations,
  };
}

export function isMonsterToken(token: BattleToken): boolean {
  if (token.linked) return false;
  return Boolean(token.monsterEntryId || token.gmCreationId || token.gmCreatureStats);
}

/** Remove HP numérico do token (para snapshot de jogadores). */
export function redactMonsterHp(token: BattleToken): BattleToken {
  return {
    ...token,
    vida: undefined,
    vidaMax: undefined,
  };
}
