import { canManageRoom } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import { resolveCharacterAccount } from "@/lib/auth/account-user";
import { resolveTorCharacter, saveTorCharacter } from "@/lib/character/um-anel/characters";
import { COMBAT_PROFICIENCY_LABEL, SKILL_LABEL, SKILLS } from "@/lib/character/um-anel/data";
import {
  canBuyTorProficiencyThisPhase,
  canBuyTorSkillThisPhase,
  canBuyTorValourOrWisdomThisPhase,
  emptyTorPhasePurchases,
  priceTorProficiencyRank,
  priceTorSkillRank,
  priceTorValourOrWisdomRank,
  torRankGrant,
  type TorPhasePurchases,
} from "@/lib/combat/um-anel/progression";
import { normalizeTorSession } from "@/lib/combat/um-anel/session-state";
import { appendRoomChatMessage } from "./chat";
import { getRoom, persistRoom, toSnapshot } from "../internal/registry";
import type { ChatMessage } from "../chat";
import type { RoomSnapshot, RoomState } from "../types";
import type {
  TorCharacterSheet,
  TorCombatProficiencyId,
  TorSkillId,
} from "@/lib/character/um-anel/types";

export type TorAdvanceResult = { ok: true; snapshot: RoomSnapshot } | { ok: false; error: string };

export type TorAdvanceBuy =
  | { kind: "skill"; skillId: string }
  | { kind: "proficiency"; proficiencyId: string }
  | { kind: "valour" }
  | { kind: "wisdom" };

const PROFICIENCY_IDS: TorCombatProficiencyId[] = ["machados", "arcos", "lancas", "espadas"];

/**
 * Gasta Pontos de Perícia / Aventura para subir um grau.
 *
 * O motor de preços (`progression.ts`) existia completo e testado, e **nada o
 * chamava**: o herói acumulava pontos e não tinha como gastá-los pelo app. Toda
 * a progressão dependia de editar a ficha na mão.
 *
 * O limite é por **Fase de Companhia** ("durante uma única Fase de Companhia, os
 * jogadores podem comprar no máximo um grau em cada Perícia"), e Valor e
 * Sabedoria competem entre si — só um dos dois por Fase. Por isso o registro do
 * que já foi comprado mora no estado da Fase, e não na ficha: fechar a Fase
 * constrói um estado novo e zera sozinho.
 *
 * Duas moedas diferentes, e o livro é explícito: **Perícia** custa Pontos de
 * Perícia; **Proficiência de Combate, Valor e Sabedoria** custam Pontos de
 * Aventura. Trocar as duas é o erro mais fácil aqui.
 */
export async function executeRoomTorAdvance(
  roomId: string,
  characterId: string,
  buy: TorAdvanceBuy,
  user: SessionUser | null,
  author: Pick<ChatMessage, "authorId" | "authorName" | "authorRole">,
  opts: { room?: RoomState } = {}
): Promise<TorAdvanceResult> {
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

  const session = normalizeTorSession(room.torSession);
  const fellowship = session?.fellowship;
  if (!fellowship) {
    return { ok: false, error: "Avanço só acontece durante uma Fase de Companhia" };
  }
  const purchases: TorPhasePurchases =
    fellowship.purchases?.[sheet.id] ?? emptyTorPhasePurchases();

  let next: TorCharacterSheet;
  let nextPurchases: TorPhasePurchases;
  let text: string;

  if (buy.kind === "skill") {
    const skillId = buy.skillId as TorSkillId;
    if (!SKILLS.some((s) => s.id === skillId)) return { ok: false, error: "Perícia inválida" };
    const limit = canBuyTorSkillThisPhase(purchases, skillId);
    if (!limit.ok) return { ok: false, error: limit.reason };
    const price = priceTorSkillRank(sheet.skills[skillId] ?? 0, sheet.skillPoints);
    if (!price.ok) return { ok: false, error: price.reason };

    next = {
      ...sheet,
      skills: { ...sheet.skills, [skillId]: price.newLevel },
      skillPoints: sheet.skillPoints - price.cost,
    };
    nextPurchases = {
      ...purchases,
      skillRanks: { ...purchases.skillRanks, [skillId]: 1 },
    };
    text = `${sheet.name} avança ${SKILL_LABEL[skillId]} para ${price.newLevel} — ${price.cost} Pontos de Perícia (restam ${next.skillPoints})`;
  } else if (buy.kind === "proficiency") {
    const profId = buy.proficiencyId as TorCombatProficiencyId;
    if (!PROFICIENCY_IDS.includes(profId)) return { ok: false, error: "Proficiência inválida" };
    const limit = canBuyTorProficiencyThisPhase(purchases, profId);
    if (!limit.ok) return { ok: false, error: limit.reason };
    const price = priceTorProficiencyRank(
      sheet.combatProficiencies[profId] ?? 0,
      sheet.adventurePoints
    );
    if (!price.ok) return { ok: false, error: price.reason };

    next = {
      ...sheet,
      combatProficiencies: { ...sheet.combatProficiencies, [profId]: price.newLevel },
      adventurePoints: sheet.adventurePoints - price.cost,
    };
    nextPurchases = {
      ...purchases,
      proficiencyRanks: { ...purchases.proficiencyRanks, [profId]: 1 },
    };
    text = `${sheet.name} avança ${COMBAT_PROFICIENCY_LABEL[profId]} para ${price.newLevel} — ${price.cost} Pontos de Aventura (restam ${next.adventurePoints})`;
  } else {
    const limit = canBuyTorValourOrWisdomThisPhase(purchases);
    if (!limit.ok) return { ok: false, error: limit.reason };
    const atual = buy.kind === "valour" ? sheet.valour : sheet.wisdom;
    const price = priceTorValourOrWisdomRank(atual, sheet.adventurePoints);
    if (!price.ok) return { ok: false, error: price.reason };

    next = {
      ...sheet,
      ...(buy.kind === "valour" ? { valour: price.newLevel } : { wisdom: price.newLevel }),
      adventurePoints: sheet.adventurePoints - price.cost,
    };
    nextPurchases = {
      ...purchases,
      ...(buy.kind === "valour" ? { boughtValour: true } : { boughtWisdom: true }),
    };

    // Novo grau concede algo: Valor dá Recompensa, Sabedoria dá Virtude — e a
    // Virtude Cultural só a partir de Sabedoria 2. A escolha em si é do jogador,
    // na ficha; aqui a mesa fica sabendo que há uma escolha pendente.
    const grant = torRankGrant(buy.kind, price.newLevel);
    const premio =
      grant.kind === "reward"
        ? "escolha uma Recompensa"
        : `escolha uma Virtude${grant.culturalAllowed ? " (Cultural liberada)" : ""}`;
    text = `${sheet.name} avança ${buy.kind === "valour" ? "Valor" : "Sabedoria"} para ${price.newLevel} — ${price.cost} Pontos de Aventura (restam ${next.adventurePoints}) · ${premio}`;
  }

  try {
    await saveTorCharacter(next);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Falha ao gravar a ficha" };
  }

  room.torSession = {
    ...(session ?? {}),
    fellowship: {
      ...fellowship,
      purchases: { ...(fellowship.purchases ?? {}), [sheet.id]: nextPurchases },
    },
  };

  appendRoomChatMessage(room, { ...author, kind: "chat", text });

  try {
    return { ok: true, snapshot: toSnapshot(await persistRoom(roomId, room)) };
  } catch (e) {
    console.error("[tor-advance] persistRoom failed:", e);
    return { ok: false, error: e instanceof Error ? e.message : "Falha ao salvar a mesa" };
  }
}
