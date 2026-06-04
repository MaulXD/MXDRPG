import type { BattleToken } from "@/lib/vtt/types";

/** Preferências da mesa — só o mestre (ownerId) altera. */
export type RoomSettings = {
  /** Jogadores veem barra e valores de HP em tokens de monstro. */
  showMonsterHpToPlayers: boolean;
  /** Chat de combate mostra barra HP quando o alvo é monstro. */
  showMonsterHpInChat: boolean;
  /** Jogadores podem enviar ping no mapa (Alt+clique). */
  allowPlayerPing: boolean;
};

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  showMonsterHpToPlayers: false,
  showMonsterHpInChat: false,
  allowPlayerPing: true,
};

export function normalizeRoomSettings(raw?: Partial<RoomSettings> | null): RoomSettings {
  return {
    showMonsterHpToPlayers:
      raw?.showMonsterHpToPlayers ?? DEFAULT_ROOM_SETTINGS.showMonsterHpToPlayers,
    showMonsterHpInChat:
      raw?.showMonsterHpInChat ?? DEFAULT_ROOM_SETTINGS.showMonsterHpInChat,
    allowPlayerPing: raw?.allowPlayerPing ?? DEFAULT_ROOM_SETTINGS.allowPlayerPing,
  };
}

export function isMonsterToken(token: BattleToken): boolean {
  return Boolean(token.monsterEntryId);
}

/** Remove HP numérico do token (para snapshot de jogadores). */
export function redactMonsterHp(token: BattleToken): BattleToken {
  return {
    ...token,
    vida: undefined,
    vidaMax: undefined,
  };
}
