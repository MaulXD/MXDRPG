import type { CharacterSheet } from "@/lib/character/types";
import type { BattleScene } from "@/lib/vtt/types";
import type { ChatMessage } from "./chat";
import type { CombatTrack } from "./combat";

export type { CombatTrack };

export type RoomActor = CharacterSheet & { revision: number };

export type RoomState = {
  roomId: string;
  scene: BattleScene;
  actors: Record<string, RoomActor>;
  combat: CombatTrack;
  chat: ChatMessage[];
  revision: number;
  updatedAt: number;
};

export type RoomSnapshot = {
  roomId: string;
  scene: BattleScene;
  actors: Record<string, RoomActor>;
  combat: CombatTrack;
  chat: ChatMessage[];
  revision: number;
};
