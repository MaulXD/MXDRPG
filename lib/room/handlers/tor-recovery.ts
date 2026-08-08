import { canManageRoom } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import { resolveCharacterAccount } from "@/lib/auth/account-user";
import { resolveTorCharacter, saveTorCharacter } from "@/lib/character/um-anel/characters";
import { computeLoad } from "@/lib/character/um-anel/rules";
import {
  applyTorBoutOfMadness,
  applyTorJourneyEndRecovery,
  applyTorProlongedRest,
  healTorShadowScar,
  TOR_HEAL_SCAR_COST,
  type TorSpiritState,
} from "@/lib/combat/um-anel/shadow";
import {
  applyTorSpiritualRecovery,
  TOR_SHADOW_RELIEF,
  type TorPhaseOutcome,
} from "@/lib/combat/um-anel/progression";
import { normalizeTorSession } from "@/lib/combat/um-anel/session-state";
import { appendRoomChatMessage } from "./chat";
import { getRoom, persistRoom, toSnapshot } from "../internal/registry";
import type { ChatMessage } from "../chat";
import type { RoomSnapshot, RoomState } from "../types";
import type { TorCharacterSheet } from "@/lib/character/um-anel/types";

export type TorRecoveryResult = { ok: true; snapshot: RoomSnapshot } | { ok: false; error: string };

export type TorRecoveryAction = "spiritual" | "rest" | "madness" | "heal-scar" | "journey-end";

function spiritStateFromSheet(sheet: TorCharacterSheet): TorSpiritState {
  return {
    shadow: sheet.shadow,
    shadowScars: sheet.shadowScars,
    hopeValue: sheet.hope.value,
    hopeMax: sheet.hope.max,
    fatigue: sheet.fatigue,
    enduranceValue: sheet.endurance.value,
    // Carga do EQUIPAMENTO, sem a Fadiga — `totalTorLoad` soma as duas lá dentro.
    load: computeLoad(sheet.warGear, sheet.armour, sheet.culture),
    flaws: sheet.shadowFlaws,
  };
}

/**
 * Recuperação e Acesso de Loucura — o que faltava para a Sombra ter saída.
 *
 * Antes disto, um herói cuja Sombra alcançasse a Esperança máxima ficava
 * **Desfavorecido para sempre**: o Acesso de Loucura é a única regra que zera a
 * Sombra nesse ponto, e ela existia no motor sem chamador nenhum. Mesma família
 * dos achados anteriores — motor testado, caminho inexistente.
 *
 * As quatro ações têm gatilhos diferentes no livro, e é por isso que ficam numa
 * rota só com um discriminador, em vez de quatro rotas: todas leem e gravam o
 * mesmo bloco espiritual da ficha.
 */
export async function executeRoomTorRecovery(
  roomId: string,
  characterId: string,
  action: TorRecoveryAction,
  user: SessionUser | null,
  author: Pick<ChatMessage, "authorId" | "authorName" | "authorRole">,
  opts: {
    room?: RoomState;
    /** Só `journey-end` — Vigor da montaria e resultado da rolagem de Viagem. */
    mountVigour?: number;
    travelRoll?: { passed: boolean; successIcons: number };
  } = {}
): Promise<TorRecoveryResult> {
  if (!user) return { ok: false, error: "Sem permissão" };

  const room = opts.room ?? (await getRoom(roomId, { skipAutoPass: true }));
  if (!room) return { ok: false, error: "Sala não encontrada" };
  if (room.rpgSystemId !== "um-anel") return { ok: false, error: "Mesa não é do Um Anel" };

  const sheet = await resolveTorCharacter(characterId);
  if (!sheet) return { ok: false, error: "Ficha não encontrada" };

  const isGm = canManageRoom(room, user);
  if (!isGm) {
    const account = await resolveCharacterAccount(user.id);
    if (account.canonicalId !== sheet.ownerId) return { ok: false, error: "Sem permissão" };
  }

  const state = spiritStateFromSheet(sheet);
  const fellowship = normalizeTorSession(room.torSession)?.fellowship;
  // Yule é a terceira Fase do ano — a mesma contagem que fecha o calendário.
  const isYule = (fellowship?.phasesThisYear ?? 0) >= 2;

  let next: TorCharacterSheet;
  let text: string;

  if (action === "journey-end") {
    // JOR-M02: tira Fadiga pelo Vigor da montaria e depois pela rolagem de
    // Viagem (1 no sucesso + 1 por ícone). O estado da jornada guarda se a
    // Companhia viajou montada; a rolagem de Viagem vem do painel.
    const r = applyTorJourneyEndRecovery(state, {
      mountVigour: opts.mountVigour,
      travelRoll: opts.travelRoll,
    });
    if (r.removed === 0) return { ok: false, error: `${sheet.name} não tem Fadiga para tirar` };
    next = { ...sheet, fatigue: r.state.fatigue };
    text = `${sheet.name} chega ao fim da jornada — perde ${r.removed} de Fadiga (agora ${r.state.fatigue})`;
  } else if (action === "rest") {
    const r = applyTorProlongedRest(state);
    if (r.fatigueRemoved === 0) return { ok: false, error: `${sheet.name} não tem Fadiga` };
    next = { ...sheet, fatigue: r.state.fatigue };
    text = `${sheet.name} faz um Descanso Prolongado — perde 1 de Fadiga (agora ${r.state.fatigue})`;
  } else if (action === "spiritual") {
    if (!fellowship) {
      return { ok: false, error: "Recuperação espiritual acontece na Fase de Companhia" };
    }
    const outcome: TorPhaseOutcome = fellowship.outcome;
    const r = applyTorSpiritualRecovery(state, {
      heartScore: sheet.attributes.coracao,
      isYule,
      outcome,
    });
    next = {
      ...sheet,
      hope: { ...sheet.hope, value: r.state.hopeValue },
      shadow: r.state.shadow,
    };
    text = `${sheet.name} — recuperação espiritual: +${r.hopeRecovered} Esperança${
      r.shadowRemoved > 0 ? `, −${r.shadowRemoved} Sombra` : ""
    } (limite ${TOR_SHADOW_RELIEF[outcome]} pelo resultado da Fase)${isYule ? " · Yule: Esperança cheia" : ""}`;
  } else if (action === "madness") {
    const r = applyTorBoutOfMadness(state, sheet.shadowPathId);
    if (!r.ok) return { ok: false, error: r.reason };
    next = { ...sheet, shadow: r.state.shadow, shadowFlaws: r.flawIndex };
    text = `${sheet.name} sofre um Acesso de Loucura — Sombra zerada, ganha a ${r.flawIndex}ª Falha${
      r.flawName ? ` (${r.flawName})` : ""
    }${r.shadowPathLabel ? ` do ${r.shadowPathLabel}` : ""}${
      r.atFinalFlaw ? " · QUARTA FALHA — o herói sucumbe à Sombra e sai de jogo" : ""
    }`;
  } else {
    const r = healTorShadowScar(state, {
      isYule,
      availableAdventurePoints: sheet.adventurePoints,
    });
    if (!r.ok) return { ok: false, error: r.reason };
    next = {
      ...sheet,
      shadowScars: r.state.shadowScars,
      adventurePoints: sheet.adventurePoints - r.spentAdventurePoints,
    };
    text = `${sheet.name} cura 1 Cicatriz de Sombra — ${TOR_HEAL_SCAR_COST} Pontos de Aventura (restam ${next.adventurePoints})`;
  }

  // Grava ANTES de anunciar: se a ficha recusar, a mesa não pode ter lido que
  // aconteceu.
  try {
    await saveTorCharacter(next);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Falha ao gravar a ficha" };
  }

  appendRoomChatMessage(room, { ...author, kind: "chat", text });

  try {
    return { ok: true, snapshot: toSnapshot(await persistRoom(roomId, room)) };
  } catch (e) {
    console.error("[tor-recovery] persistRoom failed:", e);
    return { ok: false, error: e instanceof Error ? e.message : "Falha ao salvar a mesa" };
  }
}
