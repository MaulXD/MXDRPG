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
  removeRoomToken,
  type MoveExecuteResult,
  type SpawnExecuteResult,
  type RemoveTokenResult,
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
export { executeGmCombatAction, type GmCombatAction } from "./handlers/combat-gm";
export { addRoomPing } from "./handlers/ping";
export { patchRoomScene, revealRoomHex, type ScenePatch } from "./handlers/scene";
export { patchRoomSettings, type RoomSettingsPatch } from "./handlers/settings";
export {
  createRoomGmCreation,
  updateRoomGmCreation,
  deleteRoomGmCreation,
  spawnRoomGmCreation,
} from "./handlers/gm-creations";
export { syncAdventureActorsForRoom } from "./adventure-actors";
