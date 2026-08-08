import { canManageRoom } from "@/lib/auth/room-access";
import type { SessionUser } from "@/lib/auth/types";
import { resolveCharacterAccount } from "@/lib/auth/account-user";
import { resolveTorCharacter, patchTorCharacterResources } from "@/lib/character/um-anel/characters";
import { computeLoad } from "@/lib/character/um-anel/rules";
import {
  applyTorShadowGain,
  formatTorShadowGainMessage,
  hardenTorWill,
  TOR_SHADOW_SOURCES,
  type TorShadowSource,
  type TorSpiritState,
} from "@/lib/combat/um-anel/shadow";
import { appendRoomChatMessage } from "./chat";
import { getRoom, persistRoom, toSnapshot } from "../internal/registry";
import type { ChatMessage } from "../chat";
import type { RoomSnapshot, RoomState } from "../types";
import type { TorCharacterSheet } from "@/lib/character/um-anel/types";

export type TorShadowResult = { ok: true; snapshot: RoomSnapshot } | { ok: false; error: string };

function spiritStateFromSheet(sheet: TorCharacterSheet): TorSpiritState {
  return {
    shadow: sheet.shadow,
    shadowScars: sheet.shadowScars,
    hopeValue: sheet.hope.value,
    hopeMax: sheet.hope.max,
    fatigue: sheet.fatigue,
    enduranceValue: sheet.endurance.value,
    // Carga do EQUIPAMENTO, sem a Fadiga — quem soma as duas é `totalTorLoad`.
    // Recalculada da ficha em vez de lida de `sheet.load` para não depender de o
    // campo ter sido normalizado depois da última troca de equipamento.
    load: computeLoad(sheet.warGear, sheet.armour, sheet.culture),
    flaws: 0,
  };
}

function isShadowSource(v: unknown): v is TorShadowSource {
  return typeof v === "string" && (TOR_SHADOW_SOURCES as readonly string[]).includes(v);
}

/**
 * Sombra na mesa — ganho por Pavor/Ganância/Malfeito/Feitiçaria e Endurecer a
 * Vontade.
 *
 * O motor (`lib/combat/um-anel/shadow.ts`) existia completo e testado desde
 * cedo, e **nada o chamava**: a Sombra só mudava se alguém editasse a ficha na
 * mão. Isso deixava sem gatilho duas condições que o combate já usa — Arrasado
 * (o Olho vira falha automática) e Desfavorecido (dois Dados de Proeza, fica o
 * pior).
 *
 * Quem ganha Sombra é decisão do Mestre (é ele quem narra o Pavor e julga o
 * Malfeito), então o ganho exige gerenciar a mesa. **Endurecer a Vontade** é do
 * jogador: troca toda a Sombra atual por uma Cicatriz, e é escolha de quem
 * carrega o herói.
 */
export async function executeRoomTorShadow(
  roomId: string,
  tokenId: string,
  action: { kind: "gain"; source: string; points: number; scars?: number } | { kind: "harden" },
  user: SessionUser | null,
  author: Pick<ChatMessage, "authorId" | "authorName" | "authorRole">,
  opts: { room?: RoomState } = {}
): Promise<TorShadowResult> {
  if (!user) return { ok: false, error: "Sem permissão" };

  const room = opts.room ?? (await getRoom(roomId, { skipAutoPass: true }));
  if (!room) return { ok: false, error: "Sala não encontrada" };
  if (room.rpgSystemId !== "um-anel") return { ok: false, error: "Mesa não é do Um Anel" };

  const token = room.scene.tokens.find((t) => t.id === tokenId);
  const combat = token?.torCombat;
  if (!token || combat?.kind !== "hero" || !combat.torCharacterId) {
    return { ok: false, error: "Só heróis do Um Anel têm Sombra" };
  }

  const sheet = await resolveTorCharacter(combat.torCharacterId);
  if (!sheet) return { ok: false, error: "Ficha não encontrada" };

  const isGm = canManageRoom(room, user);
  const account = await resolveCharacterAccount(user.id);
  const isOwner = account.canonicalId === sheet.ownerId;

  // Ganhar Sombra é ato do Mestre: é ele quem narra o Pavor e julga o Malfeito.
  if (action.kind === "gain" && !isGm) return { ok: false, error: "Só o Mestre atribui Sombra" };
  // Endurecer a Vontade é escolha de quem joga o herói (o Mestre também pode,
  // para conduzir a mesa de quem faltou).
  if (action.kind === "harden" && !isGm && !isOwner) return { ok: false, error: "Sem permissão" };

  const state = spiritStateFromSheet(sheet);
  let shadow: number;
  let shadowScars: number;
  let text: string;

  if (action.kind === "harden") {
    const result = hardenTorWill(state);
    if (!result.ok) return { ok: false, error: result.reason };
    shadow = result.state.shadow;
    shadowScars = result.state.shadowScars;
    text = `${token.name} endurece a vontade — troca ${result.removed} de Sombra por 1 Cicatriz (agora ${shadow}+${shadowScars}/${state.hopeMax})`;
  } else {
    if (!isShadowSource(action.source)) return { ok: false, error: "Fonte de Sombra inválida" };
    const points = Math.max(0, Math.min(10, Math.floor(action.points)));
    if (points === 0 && !action.scars) return { ok: false, error: "Informe quantos pontos" };
    const input = {
      source: action.source,
      points,
      scars: Math.max(0, Math.min(4, Math.floor(action.scars ?? 0))),
    };
    const result = applyTorShadowGain(state, input);
    shadow = result.state.shadow;
    shadowScars = result.state.shadowScars;
    text = formatTorShadowGainMessage(token.name, input, result);
  }

  // Grava ANTES de anunciar: se a ficha recusar, a mesa não pode ter lido no
  // chat que a Sombra subiu.
  try {
    await patchTorCharacterResources(sheet.id, { shadow, shadowScars }, author.authorId);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Falha ao gravar a Sombra na ficha",
    };
  }

  appendRoomChatMessage(room, { ...author, kind: "chat", text });

  try {
    return { ok: true, snapshot: toSnapshot(await persistRoom(roomId, room)) };
  } catch (e) {
    console.error("[tor-shadow] persistRoom failed:", e);
    return { ok: false, error: e instanceof Error ? e.message : "Falha ao salvar a mesa" };
  }
}
