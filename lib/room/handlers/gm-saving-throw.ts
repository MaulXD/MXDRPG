import { buildSheetSavingThrows } from "@/lib/character/sheet-skills";
import { ATTRIBUTE_LABELS, type AttributeKey } from "@/lib/character/rules";
import { formatD20Detail, rollD20 } from "@/lib/combat/d20";
import { formatRollModeWithSources, saveRollModeDetail } from "@/lib/combat/conditions";
import { canManageRoom } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import { isPlayerBattleToken, isPlayerRoomActor } from "@/lib/vtt/player-tokens";
import type { BattleToken } from "@/lib/vtt/types";
import { appendRoomChatMessage } from "./chat";
import { getRoom, persistRoom, toSnapshot } from "../internal/registry";
import type { RoomActor, RoomSnapshot, RoomState } from "../types";

export type GmSavingThrowTarget = {
  actorId: string;
  tokenId?: string;
};

export type GmSavingThrowRequest = {
  attribute: AttributeKey;
  targets: GmSavingThrowTarget[];
  dc?: number;
};

const ATTR_KEYS = Object.keys(ATTRIBUTE_LABELS) as AttributeKey[];

function assertGm(
  room: NonNullable<Awaited<ReturnType<typeof getRoom>>>,
  user: SessionUser | null | undefined
): string | null {
  if (!user) return "Faça login";
  if (!canManageRoom(room, user)) return "Só o mestre pode rolar salvaguardas";
  return null;
}

function formatMod(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function resolveRoomActor(room: RoomState, actorId: string): RoomActor | null {
  const key = actorId.trim();
  if (!key) return null;
  const direct = room.actors[key];
  if (direct && isPlayerRoomActor(direct)) return direct;
  return (
    Object.values(room.actors).find((a) => a.id === key && isPlayerRoomActor(a)) ?? null
  );
}

function findPlayerToken(
  tokens: BattleToken[],
  actors: Record<string, RoomActor>,
  actorId: string,
  tokenId?: string
): BattleToken | null {
  const playerTokens = tokens.filter((t) => isPlayerBattleToken(t, actors));
  if (tokenId) {
    return playerTokens.find((t) => t.id === tokenId) ?? null;
  }
  return playerTokens.find((t) => t.actorId === actorId) ?? null;
}

function formatGmSaveChatDetail(opts: {
  attributeLabel: string;
  d20Detail: string;
  mod: number;
  total: number;
  trained: boolean;
  dc?: number;
  success?: boolean;
  modeNote?: string;
}): string {
  const parts = [
    `Salv. ${opts.attributeLabel}: ${opts.d20Detail}${formatMod(opts.mod)} = ${opts.total}${
      opts.trained ? " (prof.)" : ""
    }`,
  ];
  if (opts.dc != null) {
    parts.push(`CD ${opts.dc}`);
    parts.push(opts.success ? "Sucesso" : "Falha");
  }
  if (opts.modeNote) parts.push(opts.modeNote);
  return parts.join(" · ");
}

export async function executeGmSavingThrows(
  roomId: string,
  body: GmSavingThrowRequest,
  user: SessionUser | null | undefined
): Promise<{ ok: true; snapshot: RoomSnapshot } | { ok: false; error: string }> {
  const room = await getRoom(roomId);
  if (!room) return { ok: false, error: "Sala não encontrada" };

  const denied = assertGm(room, user);
  if (denied) return { ok: false, error: denied };

  const attribute = body.attribute;
  if (!ATTR_KEYS.includes(attribute)) {
    return { ok: false, error: "Atributo de salvaguarda inválido" };
  }

  const targets = body.targets?.filter((t) => t.actorId?.trim()) ?? [];
  if (!targets.length) {
    return { ok: false, error: "Selecione ao menos um personagem" };
  }

  const dcRaw = body.dc;
  const dc =
    dcRaw != null && Number.isFinite(Number(dcRaw)) ? Math.floor(Number(dcRaw)) : undefined;
  if (dc != null && (dc < 1 || dc > 40)) {
    return { ok: false, error: "CD deve ser entre 1 e 40" };
  }

  const author = {
    authorId: user?.id ?? "gm",
    authorName: user?.nickname?.trim() || "Mestre",
    authorRole: "mestre" as const,
  };

  const tokens = room.scene.tokens ?? [];
  let rolled = 0;

  for (const target of targets) {
    const actorId = target.actorId.trim();
    const actor = resolveRoomActor(room, actorId);
    if (!actor) continue;

    const save = buildSheetSavingThrows(actor).find((s) => s.attr === attribute);
    if (!save) continue;

    const token = findPlayerToken(tokens, room.actors, actor.id, target.tokenId);

    const rollDetail = token ? saveRollModeDetail(token) : { mode: "normal" as const, sources: [] };
    const d20 = rollD20(rollDetail.mode);
    const total = d20.natural + save.mod;
    const modeNote = formatRollModeWithSources(rollDetail.mode, rollDetail.sources);
    const dcNote =
      dc != null ? ` · CD ${dc} ${total >= dc ? "✓" : "✗"}` : "";
    const profNote = save.trained ? " · proficiente" : "";
    const success = dc != null ? total >= dc : undefined;
    const summary = `${actor.name} — total ${total} (${formatD20Detail(d20)}${formatMod(save.mod)})${modeNote ? ` · ${modeNote}` : ""}${profNote}`;
    const detail = formatGmSaveChatDetail({
      attributeLabel: save.label,
      d20Detail: formatD20Detail(d20),
      mod: save.mod,
      total,
      trained: save.trained,
      dc,
      success,
      modeNote: modeNote || undefined,
    });

    if (token) {
      const hp = token.vida ?? actor.resources.vida.value;
      appendRoomChatMessage(room, {
        ...author,
        kind: "combat",
        text: summary,
        combat: {
          attackerTokenId: token.id,
          defenderTokenId: token.id,
          actionKind: "ability",
          weaponName: "Salvaguarda",
          resolution: "save",
          gmSavingThrow: true,
          saveNatural: d20.natural,
          saveTotal: total,
          saveDc: dc,
          saveSuccess: success,
          saveAttribute: save.label,
          saveRollMode: rollDetail.mode,
          damageTotal: null,
          defenderHpBefore: hp,
          defenderHpAfter: hp,
          detail,
        },
      });
    } else {
      appendRoomChatMessage(room, {
        ...author,
        kind: "roll",
        text: summary,
        roll: {
          formula: `1d20${formatMod(save.mod)}`,
          rolls: d20.secondary != null ? [d20.natural, d20.secondary] : [d20.natural],
          total,
        },
      });
    }
    rolled += 1;
  }

  if (!rolled) {
    return { ok: false, error: "Nenhum personagem válido para rolar" };
  }

  return { ok: true, snapshot: toSnapshot(await persistRoom(roomId, room)) };
}
