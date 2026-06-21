import type { ChatMessage } from "@/lib/room/chat";

/** Tolerância de relógio ao filtrar FX ao entrar na sala. */
export const COMBAT_FX_JOIN_GRACE_MS = 250;

/** Marca mensagens de combate já presentes no histórico — não dispara dados 3D. */
export function markHistoricalCombatChat(chat: ChatMessage[], seen: Set<string>): void {
  for (const msg of chat) {
    if (msg.kind === "combat" && msg.combat) seen.add(msg.id);
  }
}

/** Só anima jogadas ocorridas depois que o cliente abriu a mesa. */
export function isLiveCombatFxMessage(msg: ChatMessage, joinedAtMs: number): boolean {
  if (msg.kind !== "combat" || !msg.combat) return false;
  return msg.at >= joinedAtMs - COMBAT_FX_JOIN_GRACE_MS;
}

export function filterLiveCombatFxMessages(
  chat: ChatMessage[],
  seen: Set<string>,
  joinedAtMs: number
): ChatMessage[] {
  return chat.filter(
    (m) => isLiveCombatFxMessage(m, joinedAtMs) && !seen.has(m.id)
  );
}
