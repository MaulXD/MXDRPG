import { canManageRoom } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import { patchTorCharacterResources } from "@/lib/character/um-anel/characters";
import { rollTorCheck, featDieRollPayload } from "@/lib/character/um-anel/dice";
import {
  formatTorHazardMessage,
  resolveTorHazard,
  torPoisonHealingPenalty,
  TOR_HAZARD_LEVEL_META,
  TOR_HAZARD_SOURCE_META,
  type TorHazardLevel,
  type TorHazardSource,
} from "@/lib/combat/um-anel/hazards";
import { appendRoomChatMessage } from "./chat";
import { getRoom, persistRoom, toSnapshot } from "../internal/registry";
import type { ChatMessage } from "../chat";
import type { RoomSnapshot, RoomState } from "../types";

export type TorHazardResult = { ok: true; snapshot: RoomSnapshot } | { ok: false; error: string };

export type TorHazardAction =
  | { kind: "apply"; source: TorHazardSource; level: TorHazardLevel }
  /** Rolagem de CURA no início do dia — a graduação é de quem trata, não do doente. */
  | { kind: "cure-poison"; healerRank: number };

/** ND padrão de mesa, o mesmo que os painéis de Jornada e Conselho usam. */
const DEFAULT_TN = 14;

/**
 * Fontes de Dano fora do combate — Frio Extremo, Queda, Fogo, Asfixia, Veneno.
 *
 * O capítulo 8 traz o sistema inteiro e **nada dele estava no motor**: o único
 * jeito de um herói perder Resistência no app era levar um golpe. Afogar,
 * queimar, cair e envenenar não existiam.
 *
 * A rolagem acontece no servidor pelo mesmo motivo do ataque: é ela que grava a
 * Resistência na ficha, e um número vindo do cliente é um número que o cliente
 * escolhe.
 */
export async function executeRoomTorHazard(
  roomId: string,
  tokenId: string,
  action: TorHazardAction,
  user: SessionUser | null,
  author: Pick<ChatMessage, "authorId" | "authorName" | "authorRole">,
  opts: { room?: RoomState } = {}
): Promise<TorHazardResult> {
  if (!user) return { ok: false, error: "Sem permissão" };

  const room = opts.room ?? (await getRoom(roomId, { skipAutoPass: true }));
  if (!room) return { ok: false, error: "Sala não encontrada" };
  if (room.rpgSystemId !== "um-anel") return { ok: false, error: "Mesa não é do Um Anel" };

  // Quem expõe a Companhia ao frio, ao fogo ou ao veneno é o Mestre — é ele quem
  // narra a cena. O jogador não se envenena sozinho.
  if (!canManageRoom(room, user)) return { ok: false, error: "Só o Mestre aplica Fontes de Dano" };

  const tokens = [...room.scene.tokens];
  const idx = tokens.findIndex((t) => t.id === tokenId);
  const token = idx >= 0 ? tokens[idx] : undefined;
  const combat = token?.torCombat;
  if (!token || combat?.kind !== "hero") {
    return { ok: false, error: "Fontes de Dano só se aplicam a heróis do Um Anel" };
  }

  let text: string;
  let featValue: number;
  let nextVida = token.vida ?? token.vidaMax ?? 0;
  let nextPoison: TorHazardLevel | undefined = combat.poison;
  let nextWounded = combat.wounded;

  if (action.kind === "cure-poison") {
    if (!combat.poison) return { ok: false, error: `${token.name} não está envenenado` };
    // A penalidade é do veneno do DOENTE e entra como Dado de Sucesso perdido —
    // cumulativo e com piso em zero, não Desfavorecida.
    const penalidade = torPoisonHealingPenalty(combat.poison);
    const roll = rollTorCheck({
      rank: Math.max(0, Math.floor(action.healerRank)),
      tn: DEFAULT_TN,
      bonusDice: -penalidade,
    });
    featValue = featDieRollPayload(roll.featDie).value;
    if (roll.success) nextPoison = undefined;
    text =
      `Rolagem de CURA em ${token.name} (veneno ${TOR_HAZARD_LEVEL_META[combat.poison].label}` +
      (penalidade > 0 ? `, perde (${penalidade}d)` : "") +
      `): ${roll.success ? "sucesso — o veneno é neutralizado" : "falha — o veneno continua"}`;
  } else {
    const meta = TOR_HAZARD_LEVEL_META[action.level];
    // A INVERSÃO da tabela: Favorecida ajuda o herói aqui, porque o melhor
    // resultado é a Runa (Ileso) e o pior é o Olho (zero).
    const roll = rollTorCheck({
      rank: 0,
      tn: 0,
      favoured: meta.featRoll === "favoured",
      illFavoured: meta.featRoll === "illFavoured",
    });
    featValue = featDieRollPayload(roll.featDie).value;

    const outcome = resolveTorHazard({
      source: action.source,
      level: action.level,
      featDie: roll.featDie,
    });

    nextVida = outcome.reducedToZero ? 0 : Math.max(0, nextVida - outcome.loss);
    if (nextVida <= 0 && outcome.atZero === "ferido") nextWounded = true;

    if (action.source === "veneno") {
      // A Runa cura; qualquer outro resultado mantém (ou instala) o veneno.
      nextPoison = outcome.poisonCured ? undefined : action.level;
    }

    text =
      formatTorHazardMessage(token.name, outcome, { endurance: nextVida }) +
      ` · ${TOR_HAZARD_SOURCE_META[action.source].cadence}`;
  }

  tokens[idx] = {
    ...token,
    vida: nextVida,
    defeated: nextVida <= 0 || undefined,
    torCombat: {
      ...combat,
      wounded: nextWounded,
      // `undefined` some do objeto ao serializar: é assim que o veneno é curado.
      poison: nextPoison,
    },
  };
  room.scene = { ...room.scene, tokens };

  // Sincroniza a ficha. Falhar aqui não desfaz o que aconteceu no mapa — mesmo
  // critério do ataque.
  if (combat.torCharacterId) {
    try {
      await patchTorCharacterResources(
        combat.torCharacterId,
        { enduranceValue: nextVida, wounded: nextWounded },
        author.authorId
      );
    } catch (e) {
      console.error("[tor-hazard] falha ao sincronizar a ficha:", e);
    }
  }

  // Mesmo formato que a rota de chat usa para o d12 do Um Anel: `roll` com
  // `system`, que é o que faz o dado sair com o glyph certo (ver RoomChat.tsx).
  appendRoomChatMessage(room, {
    ...author,
    kind: "chat",
    text,
    roll: { formula: "1d12", rolls: [featValue], total: featValue, system: room.rpgSystemId },
  });

  try {
    return { ok: true, snapshot: toSnapshot(await persistRoom(roomId, room)) };
  } catch (e) {
    console.error("[tor-hazard] persistRoom failed:", e);
    return { ok: false, error: e instanceof Error ? e.message : "Falha ao salvar a mesa" };
  }
}
