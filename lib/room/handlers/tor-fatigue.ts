import { canManageRoom } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import { resolveTorCharacter, patchTorCharacterResources } from "@/lib/character/um-anel/characters";
import { computeLoad } from "@/lib/character/um-anel/rules";
import { ARMOUR_BY_ID } from "@/lib/character/um-anel/data";
import {
  formatTorFatigueLine,
  torArmourWeight,
  torFatigueGain,
  TOR_FATIGUE_SOURCE_META,
  type TorFatigueSource,
} from "@/lib/combat/um-anel/fatigue";
import { applyTorFatigueGain, type TorSpiritState } from "@/lib/combat/um-anel/shadow";
import { appendRoomChatMessage } from "./chat";
import { getRoom, persistRoom, toSnapshot } from "../internal/registry";
import type { ChatMessage } from "../chat";
import type { RoomSnapshot, RoomState } from "../types";
import type { TorCharacterSheet } from "@/lib/character/um-anel/types";

export type TorFatigueResult = { ok: true; snapshot: RoomSnapshot } | { ok: false; error: string };

/** Quem recebe: a Companhia inteira (Evento de Jornada) ou um herói só. */
export type TorFatigueScope = { kind: "company" } | { kind: "token"; tokenId: string };

function spiritStateFromSheet(sheet: TorCharacterSheet): TorSpiritState {
  return {
    shadow: sheet.shadow,
    shadowScars: sheet.shadowScars,
    hopeValue: sheet.hope.value,
    hopeMax: sheet.hope.max,
    fatigue: sheet.fatigue,
    enduranceValue: sheet.endurance.value,
    // Carga do EQUIPAMENTO — `totalTorLoad` é quem soma a Fadiga por cima.
    load: computeLoad(sheet.warGear, sheet.armour, sheet.culture),
    flaws: sheet.shadowFlaws,
  };
}

/**
 * Fadiga de Viagem chegando à ficha.
 *
 * Antes disto a Fadiga só descia: Descanso Prolongado, Vigor da montaria e a
 * rolagem de VIAGEM tinham handler; o ganho não tinha nenhum. Como Exausto é
 * derivado (`Resistência ≤ Carga + Fadiga`), a condição nunca disparava sem
 * alguém digitar o número na mão.
 *
 * A Companhia é resolvida **aqui**, no servidor, e não pelo painel: quem conhece
 * a cena é a sala, e o ganho é por herói porque **Cram** e **Resistência do
 * Ranger** dependem da ficha de cada um.
 */
export async function executeRoomTorFatigue(
  roomId: string,
  scope: TorFatigueScope,
  input: { points: number; source: TorFatigueSource },
  user: SessionUser | null,
  author: Pick<ChatMessage, "authorId" | "authorName" | "authorRole">,
  opts: { room?: RoomState } = {}
): Promise<TorFatigueResult> {
  if (!user) return { ok: false, error: "Sem permissão" };

  const room = opts.room ?? (await getRoom(roomId, { skipAutoPass: true }));
  if (!room) return { ok: false, error: "Sala não encontrada" };
  if (room.rpgSystemId !== "um-anel") return { ok: false, error: "Mesa não é do Um Anel" };

  // Ganhar Fadiga é sempre ato do Mestre: vem do Evento de Jornada que ele
  // resolveu, da marcha forçada que ele contou, ou da cena que ele narrou.
  if (!canManageRoom(room, user)) return { ok: false, error: "Só o Mestre atribui Fadiga" };

  const points = Math.max(0, Math.min(10, Math.floor(input.points)));
  if (points === 0) return { ok: false, error: "Informe quantos pontos de Fadiga" };

  const heroes = room.scene.tokens.filter(
    (t) => t.torCombat?.kind === "hero" && Boolean(t.torCombat.torCharacterId)
  );
  const alvos =
    scope.kind === "token" ? heroes.filter((t) => t.id === scope.tokenId) : heroes;

  if (alvos.length === 0) {
    return {
      ok: false,
      error:
        scope.kind === "token"
          ? "Só heróis do Um Anel ganham Fadiga"
          : "Nenhum herói na cena para receber Fadiga",
    };
  }

  const linhas: string[] = [];
  const recusadas: string[] = [];

  for (const token of alvos) {
    const sheet = await resolveTorCharacter(token.torCombat!.torCharacterId!);
    if (!sheet) {
      recusadas.push(token.name);
      continue;
    }

    const armourId = sheet.armour.armourId;
    const gain = torFatigueGain(
      {
        virtues: sheet.virtues,
        // A tabela de armaduras vive em data.ts; a Virtude só precisa saber se é
        // Couro, nada, ou o resto — quem traduz é `torArmourWeight`.
        armour: torArmourWeight({
          equipped: Boolean(armourId),
          type: armourId ? ARMOUR_BY_ID[armourId]?.type : null,
        }),
        hasShield: Boolean(sheet.armour.shieldId),
      },
      { points, source: input.source }
    );
    const applied = applyTorFatigueGain(spiritStateFromSheet(sheet), gain.gained);

    if (gain.gained > 0) {
      // Grava ANTES de anunciar: a mesa não pode ler que a Fadiga subiu se a
      // ficha recusou a escrita.
      try {
        await patchTorCharacterResources(
          sheet.id,
          { fatigue: applied.state.fatigue },
          author.authorId
        );
      } catch {
        recusadas.push(token.name);
        continue;
      }
    }

    linhas.push(
      formatTorFatigueLine(token.name, gain, {
        fatigue: applied.state.fatigue,
        becameWeary: applied.becameWeary,
      })
    );
  }

  if (linhas.length === 0) {
    return { ok: false, error: "Nenhuma ficha aceitou a Fadiga — confira as permissões" };
  }

  const cabecalho =
    scope.kind === "company"
      ? `Fadiga de Viagem (${TOR_FATIGUE_SOURCE_META[input.source].label}, ${points} ponto${points === 1 ? "" : "s"})`
      : TOR_FATIGUE_SOURCE_META[input.source].label;

  appendRoomChatMessage(room, {
    ...author,
    kind: "chat",
    text:
      `${cabecalho} — ${linhas.join(" · ")}` +
      (recusadas.length > 0 ? ` · não aplicada a: ${recusadas.join(", ")}` : ""),
  });

  try {
    return { ok: true, snapshot: toSnapshot(await persistRoom(roomId, room)) };
  } catch (e) {
    console.error("[tor-fatigue] persistRoom failed:", e);
    return { ok: false, error: e instanceof Error ? e.message : "Falha ao salvar a mesa" };
  }
}
