"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { IdentityPatch } from "@/lib/character/identity";
import type { LevelUpChoices } from "@/lib/character/level-up";
import type { CharacterSheet } from "@/lib/character/types";
import type { RoomSnapshot } from "@/lib/room/types";

export function useRoomSync(roomId: string, intervalMs = 2000) {
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const revisionRef = useRef(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/room/${roomId}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as RoomSnapshot;
      if (data.revision !== revisionRef.current) {
        revisionRef.current = data.revision;
        setSnapshot(data);
      }
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs]);

  return { snapshot, loading, refresh };
}

export async function patchRoomToken(
  roomId: string,
  tokenId: string,
  patch: Record<string, unknown>
) {
  const res = await fetch(`/api/room/${roomId}/tokens/${tokenId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Falha ao sync token");
  return res.json();
}

export async function patchRoomActor(
  roomId: string,
  actorId: string,
  patch: Partial<
    Pick<
      CharacterSheet,
      "portraitUrl" | "tokenImageUrl" | "portraitFocus" | "name" | "biography" | "combatLoadout"
    >
  > & {
    identityPatch?: IdentityPatch;
  }
) {
  const res = await fetch(`/api/room/${roomId}/actors/${actorId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Falha ao salvar ficha");
  }
  return res.json();
}

export async function levelUpRoomActor(roomId: string, actorId: string, choices: LevelUpChoices = {}) {
  const res = await fetch(`/api/room/${roomId}/actors/${actorId}/level-up`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(choices),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Falha ao subir nível");
  }
  return res.json();
}

export async function rollInitiative(roomId: string) {
  const res = await fetch(`/api/room/${roomId}/combat/roll-initiative`, { method: "POST" });
  if (!res.ok) throw new Error("Falha ao rolar iniciativa");
  return res.json() as Promise<RoomSnapshot>;
}

export async function nextCombatTurn(roomId: string) {
  const res = await fetch(`/api/room/${roomId}/combat/next-turn`, { method: "POST" });
  if (!res.ok) throw new Error("Falha ao avançar turno");
  return res.json() as Promise<RoomSnapshot>;
}

export async function postRoomAttack(
  roomId: string,
  attackerTokenId: string,
  defenderTokenId: string,
  opts: {
    actionPack?: "armas" | "magias" | "habilidades";
    actionEntryId?: string;
    bypassTurn?: boolean;
  } = {}
) {
  const res = await fetch(`/api/room/${roomId}/combat/attack`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attackerTokenId, defenderTokenId, ...opts }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Falha no ataque");
  }
  return res.json() as Promise<RoomSnapshot>;
}

export async function postRoomAbility(
  roomId: string,
  attackerTokenId: string,
  defenderTokenId: string | null,
  opts: {
    actionEntryId?: string;
    bypassTurn?: boolean;
  } = {}
) {
  const res = await fetch(`/api/room/${roomId}/combat/ability`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attackerTokenId, defenderTokenId, ...opts }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Falha na habilidade");
  }
  return res.json() as Promise<RoomSnapshot>;
}

export async function moveRoomTokenBudget(
  roomId: string,
  tokenId: string,
  q: number,
  r: number,
  mode: "walk" | "run",
  bypassTurn = false
) {
  const res = await fetch(`/api/room/${roomId}/tokens/move`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tokenId, q, r, mode, bypassTurn }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Movimento inválido");
  }
  return res.json() as Promise<RoomSnapshot>;
}

export async function postRoomAreaSpell(
  roomId: string,
  casterTokenId: string,
  centerQ: number,
  centerR: number,
  opts: {
    actionEntryId?: string;
    bypassTurn?: boolean;
  } = {}
) {
  const res = await fetch(`/api/room/${roomId}/combat/area`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ casterTokenId, centerQ, centerR, ...opts }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Falha na magia de área");
  }
  return res.json() as Promise<RoomSnapshot>;
}

export async function spawnRoomMonster(
  roomId: string,
  monsterEntryId: string,
  q: number,
  r: number,
  opts?: { variant?: "normal" | "elite" | "colossal"; groupLevelDelta?: number }
) {
  const res = await fetch(`/api/room/${roomId}/tokens/spawn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ monsterEntryId, q, r, ...opts }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Falha ao invocar monstro");
  }
  return res.json() as Promise<RoomSnapshot>;
}

export async function postRoomChat(
  roomId: string,
  body: { text?: string; kind?: "chat" | "roll"; formula?: string }
) {
  const res = await fetch(`/api/room/${roomId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Falha ao enviar");
  }
  return res.json() as Promise<RoomSnapshot>;
}
