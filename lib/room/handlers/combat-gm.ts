import { canManageRoom } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import {
  deferTokenToEndOfOrder,
  gmResetTokenPaInRoom,
  restoreNaturalCombatOrder,
} from "../combat-gm";
import { revertCombatUndo } from "../combat-undo";
import { appendRoomChatMessage } from "./chat";
import { getRoom, persistRoom, toSnapshot } from "../internal/registry";
import type { RoomSnapshot } from "../types";

export type GmCombatAction =
  | { action: "reset-pa"; tokenId: string }
  | { action: "defer-turn"; tokenId: string }
  | { action: "restore-order" }
  | { action: "revert"; undoId: string };

function assertGm(
  room: NonNullable<Awaited<ReturnType<typeof getRoom>>>,
  user: SessionUser | null | undefined
): string | null {
  if (room.roomId === "demo") return null;
  if (!user) return "Faça login";
  if (!canManageRoom(room, user)) return "Só o mestre pode usar este controle";
  return null;
}

export async function executeGmCombatAction(
  roomId: string,
  body: GmCombatAction,
  user: SessionUser | null | undefined
): Promise<{ ok: true; snapshot: RoomSnapshot } | { ok: false; error: string }> {
  const room = await getRoom(roomId);
  if (!room) return { ok: false, error: "Sala não encontrada" };

  const denied = assertGm(room, user);
  if (denied) return { ok: false, error: denied };

  const author = {
    authorId: user?.id ?? "gm",
    authorName: user?.name ?? "Mestre",
    authorRole: "mestre" as const,
  };

  switch (body.action) {
    case "reset-pa": {
      const tokenId = body.tokenId?.trim();
      if (!tokenId) return { ok: false, error: "Token inválido" };
      const token = room.scene.tokens.find((t) => t.id === tokenId);
      if (!token) return { ok: false, error: "Token não encontrado" };

      const refreshed = gmResetTokenPaInRoom(room, tokenId);
      if (!refreshed) return { ok: false, error: "Falha ao resetar PA" };

      appendRoomChatMessage(room, {
        ...author,
        kind: "system",
        text: `Mestre restaurou os PA de ${token.name} (${refreshed.pa}/${refreshed.paMax}).`,
      });
      break;
    }

    case "defer-turn": {
      const tokenId = body.tokenId?.trim();
      if (!tokenId) return { ok: false, error: "Token inválido" };
      const token = room.scene.tokens.find((t) => t.id === tokenId);
      if (!token) return { ok: false, error: "Token não encontrado" };
      if (!room.combat.order.includes(tokenId)) {
        return { ok: false, error: "Token fora da ordem de combate" };
      }

      room.combat = deferTokenToEndOfOrder(room.combat, tokenId);
      appendRoomChatMessage(room, {
        ...author,
        kind: "system",
        text: `Mestre adiou ${token.name} para o fim da rodada.`,
      });
      break;
    }

    case "restore-order": {
      if (!room.combat.orderOverridden) {
        return { ok: false, error: "A ordem já está na iniciativa natural" };
      }
      if (!restoreNaturalCombatOrder(room)) {
        return { ok: false, error: "Sem ordem natural salva — role iniciativa" };
      }
      appendRoomChatMessage(room, {
        ...author,
        kind: "system",
        text: "Mestre restaurou a ordem natural de iniciativa.",
      });
      break;
    }

    case "revert": {
      const undoId = body.undoId?.trim();
      if (!undoId) return { ok: false, error: "Jogada inválida" };
      const entry = revertCombatUndo(room, undoId);
      if (!entry) return { ok: false, error: "Jogada não encontrada ou já desfeita" };

      appendRoomChatMessage(room, {
        ...author,
        kind: "system",
        text: `Mestre reverteu: ${entry.tokenName} — ${entry.summary}`,
      });
      break;
    }

    default:
      return { ok: false, error: "Ação inválida" };
  }

  return { ok: true, snapshot: toSnapshot(await persistRoom(roomId, room)) };
}
