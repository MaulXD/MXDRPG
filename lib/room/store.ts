/**
 * Fachada da sala em memória — implementação em handlers/.
 * Imports externos continuam em `@/lib/room/store`.
 */

export { getRoom } from "./internal/registry";
export { getRoomSnapshot, createRoom, joinRoomByInvite, listRoomsForUser, getRoomMeta, getRoomActor } from "./handlers/room-lifecycle";
export { updateRoomActor, levelUpRoomActor } from "./handlers/actors";
export {
  updateRoomToken,
  moveRoomToken,
  spawnRoomMonster,
  repositionRoomToken,
  placeRoomActorOnHex,
  type MoveExecuteResult,
  type SpawnExecuteResult,
} from "./handlers/tokens";
export {
  rollRoomInitiative,
  advanceRoomTurn,
  setRoomCombatOrder,
  initCombatPaForRoom,
} from "./handlers/combat-turn";
export { addRoomChatMessage } from "./handlers/chat";
export { executeRoomAttack, type AttackExecuteResult } from "./handlers/combat-attack";
export { executeRoomAbility, type AbilityExecuteResult } from "./handlers/combat-ability";
export { executeRoomAreaSpell } from "./handlers/combat-area";
export { addRoomPing } from "./handlers/ping";
export { patchRoomScene, revealRoomHex, type ScenePatch } from "./handlers/scene";
export { patchRoomSettings, type RoomSettingsPatch } from "./handlers/settings";
export { syncAdventureActorsForRoom } from "./adventure-actors";
