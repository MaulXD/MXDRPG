import type { CharacterSheet } from "@/lib/character/types";
import type { BattlePing, BattleScene } from "@/lib/vtt/types";
import type { ChatMessage } from "./chat";
import type { CombatTrack } from "./combat";
import type { CombatUndoEntry } from "./combat-undo";
import type { CombatLogEntry } from "./combat-log";
import type { GmCreation } from "./gm-creations";
import type { RoomSettings } from "./settings";

export type { CombatTrack };
export type { CombatUndoEntry };
export type { CombatLogEntry };

export type RoomActor = CharacterSheet & {
  revision: number;
  /** Instância de NPC criada pelo mestre (não sincroniza com ficha de jogador). */
  gmAuthored?: boolean;
  gmTemplateId?: string;
};

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
  /** Pilha de desfazer jogadas (só mestre na UI). */
  combatUndo?: CombatUndoEntry[];
  /** Histórico de PA/combate para o mestre (auditoria e debug). */
  combatLog?: CombatLogEntry[];
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
  /** Presente apenas para o mestre (snapshotForViewer). */
  combatUndo?: CombatUndoEntry[];
  combatLog?: CombatLogEntry[];
  /** Templates do mestre — só no snapshot do GM. */
  gmCreations?: Record<string, GmCreation>;
  chat: ChatMessage[];
  pings: BattlePing[];
  revision: number;
};
