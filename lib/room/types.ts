import type { CharacterSheet } from "@/lib/character/types";
import type { BattlePing, BattleScene } from "@/lib/vtt/types";
import type { ChatMessage } from "./chat";
import type { CombatTrack } from "./combat";
import type { RoomSettings } from "./settings";

export type { CombatTrack };

export type RoomActor = CharacterSheet & { revision: number };

export type RoomState = {
  roomId: string;
  /** Aventura à qual esta mesa pertence. */
  adventureId: string;
  /** Dono da mesa — único com poderes de mestre nesta sala */
  ownerId: string;
  name: string;
  /** Código para jogadores entrarem (Roll20: link de convite) */
  inviteCode: string;
  memberIds: string[];
  settings: RoomSettings;
  scene: BattleScene;
  actors: Record<string, RoomActor>;
  combat: CombatTrack;
  chat: ChatMessage[];
  pings: BattlePing[];
  revision: number;
  updatedAt: number;
};

export type RoomListItem = {
  roomId: string;
  adventureId: string;
  name: string;
  ownerId: string;
  inviteCode: string;
  isOwner: boolean;
  updatedAt: number;
};

export type RoomSnapshot = {
  roomId: string;
  settings: RoomSettings;
  scene: BattleScene;
  actors: Record<string, RoomActor>;
  combat: CombatTrack;
  chat: ChatMessage[];
  pings: BattlePing[];
  revision: number;
};
