import { canManageRoom } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import { normalizeImageDataUrl } from "@/lib/media/image-normalize";
import { sanitizePortraitFocus } from "@/lib/media/portrait-focus";
import { normalizeRoomSettings, type RoomSettings } from "@/lib/room/settings";
import { applyExplorationPaDisplay } from "@/lib/combat/exploration-pa";
import { beginCombatTurnEconomyPa } from "./combat-turn";
import { enterCombatPaEconomy } from "@/lib/combat/turn-economy";
import { logCombatEvent } from "../combat-log";
import { getRoom, persistRoom, toSnapshot, type PersistRoomOpts } from "../internal/registry";
import type { RoomSnapshot } from "../types";

export type RoomSettingsPatch = Partial<RoomSettings> & {
  name?: string;
};

export async function patchRoomSettings(
  roomId: string,
  user: SessionUser | null,
  patch: RoomSettingsPatch
): Promise<RoomSnapshot | null> {
  const room = await getRoom(roomId);
  if (!room) return null;
  if (!canManageRoom(room, user)) return null;

  if (typeof patch.name === "string") {
    const label = patch.name.trim().slice(0, 80);
    if (label) {
      room.name = label;
      room.scene = { ...room.scene, name: label };
    }
  }

  const current = normalizeRoomSettings(room.settings);
  const settingsPatch: Partial<RoomSettings> = { ...patch };
  delete (settingsPatch as { name?: string }).name;

  if ("coverUrl" in patch) {
    if (patch.coverUrl === null || patch.coverUrl === "") {
      settingsPatch.coverUrl = null;
    } else if (typeof patch.coverUrl === "string") {
      settingsPatch.coverUrl =
        (await normalizeImageDataUrl(patch.coverUrl, { maxEdge: 1920 })) ?? patch.coverUrl;
    }
  }
  if ("coverFocus" in patch) {
    settingsPatch.coverFocus = sanitizePortraitFocus(patch.coverFocus);
  }

  room.settings = normalizeRoomSettings({
    ...current,
    ...settingsPatch,
  });

  let persistOpts: PersistRoomOpts | undefined;
  const wasCombat = current.combatActive;
  const nowCombat = room.settings.combatActive;

  if (!wasCombat && nowCombat) {
    if (room.combat?.order?.length) {
      beginCombatTurnEconomyPa(room);
      logCombatEvent(room, "combat_on", "Combate ligado — fila de turnos ativa", {
        detail: `rodada ${room.combat.round}`,
      });
    } else {
      enterCombatPaEconomy(room);
    }
    persistOpts = { skipAutoPass: true, skipAutoPassSchedule: true };
  } else if (wasCombat && !nowCombat) {
    room.combat = { ...room.combat, pendingAutoPass: undefined };
    applyExplorationPaDisplay(room);
    logCombatEvent(room, "combat_off", "Combate desligado — exploração", {
      detail: "PA só visual",
    });
  }

  const updated = await persistRoom(roomId, room, persistOpts);
  return toSnapshot(updated);
}
