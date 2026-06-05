"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { IdentityPatch } from "@/lib/character/identity";
import type { LevelUpChoices } from "@/lib/character/level-up";
import type { CharacterSheet } from "@/lib/character/types";
import type { RoomActor, RoomSnapshot } from "@/lib/room/types";

const FETCH_TIMEOUT_MS = 12_000;

type SyncOpts = {
  /** Código na URL (?invite=) — visitante assiste com SSE/GET */
  inviteCode?: string | null;
  /** Fallback poll se SSE falhar (ms) */
  pollIntervalMs?: number;
};

function roomQuery(roomId: string, inviteCode?: string | null): string {
  const q = new URLSearchParams();
  if (inviteCode?.trim()) q.set("invite", inviteCode.trim());
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function useRoomSync(roomId: string, opts: SyncOpts = {}) {
  const inviteCode = opts.inviteCode ?? null;
  const pollIntervalMs = opts.pollIntervalMs ?? 4000;
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const revisionRef = useRef(0);
  const query = useMemo(() => roomQuery(roomId, inviteCode), [roomId, inviteCode]);
  const sseReadyRef = useRef(false);

  const applySnapshot = useCallback((data: RoomSnapshot) => {
    revisionRef.current = data.revision;
    setSnapshot(data);
    setSyncError(null);
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(`/api/room/${roomId}${query}`, {
        cache: "no-store",
        signal: ac.signal,
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setSyncError(err.error ?? `Sync falhou (${res.status})`);
        return;
      }
      const data = (await res.json()) as RoomSnapshot;
      setSyncError(null);
      applySnapshot(data);
      sseReadyRef.current = true;
    } catch (e) {
      const msg =
        e instanceof Error && e.name === "AbortError"
          ? "Sync demorou demais — recarregue a página"
          : e instanceof Error
            ? e.message
            : "Falha de rede";
      setSyncError(msg);
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }, [roomId, query, applySnapshot]);

  useEffect(() => {
    setLoading(true);
    setSyncError(null);
    sseReadyRef.current = false;
    revisionRef.current = 0;
    void refresh();
  }, [roomId, query, refresh]);

  useEffect(() => {
    if (loading || !sseReadyRef.current) return;

    if (typeof EventSource === "undefined") {
      const id = setInterval(refresh, pollIntervalMs);
      return () => clearInterval(id);
    }

    let es: EventSource | null = null;
    let pollId: ReturnType<typeof setInterval> | null = null;

    const startPoll = () => {
      if (pollId) return;
      pollId = setInterval(refresh, pollIntervalMs);
    };

    const connect = () => {
      const since = revisionRef.current;
      const eventsQ = new URLSearchParams();
      eventsQ.set("since", String(since));
      if (inviteCode?.trim()) eventsQ.set("invite", inviteCode.trim());

      es = new EventSource(`/api/room/${roomId}/events?${eventsQ.toString()}`);

      es.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data) as { type?: string; revision?: number };
          if (data.type === "revision" && typeof data.revision === "number") {
            if (data.revision > revisionRef.current) {
              void refresh();
            }
          }
          if (data.type === "connected" && typeof data.revision === "number") {
            if (data.revision > revisionRef.current) {
              void refresh();
            }
          }
        } catch {
          /* ignore parse */
        }
      };

      es.onerror = () => {
        es?.close();
        es = null;
        startPoll();
      };
    };

    connect();

    return () => {
      es?.close();
      if (pollId) clearInterval(pollId);
    };
  }, [roomId, inviteCode, refresh, pollIntervalMs, loading]);

  return { snapshot, loading, syncError, refresh, applySnapshot };
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

export type LevelUpRoomResponse = {
  actor: RoomActor;
  scene: RoomSnapshot["scene"];
  revision: number;
};

export async function levelUpRoomActor(
  roomId: string,
  actorId: string,
  choices: LevelUpChoices = {}
): Promise<LevelUpRoomResponse> {
  const res = await fetch(`/api/room/${roomId}/actors/${actorId}/level-up`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(choices),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Falha ao subir nível");
  }
  return res.json() as Promise<LevelUpRoomResponse>;
}

export async function rollInitiative(roomId: string) {
  const res = await fetch(`/api/room/${roomId}/combat/roll-initiative`, { method: "POST" });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Falha ao rolar iniciativa");
  }
  return res.json() as Promise<RoomSnapshot>;
}

export async function nextCombatTurn(roomId: string) {
  const res = await fetch(`/api/room/${roomId}/combat/next-turn`, {
    method: "POST",
    credentials: "same-origin",
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Falha ao avançar turno");
  }
  return res.json() as Promise<RoomSnapshot>;
}

export type GmCombatAction =
  | { action: "reset-pa"; tokenId: string }
  | { action: "defer-turn"; tokenId: string }
  | { action: "restore-order" }
  | { action: "revert"; undoId: string };

export async function postGmCombatAction(roomId: string, body: GmCombatAction) {
  const res = await fetch(`/api/room/${roomId}/combat/gm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Falha no controle do mestre");
  }
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
    channelExtraPa?: number;
  } = {}
) {
  const res = await fetch(`/api/room/${roomId}/combat/attack`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
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
    credentials: "same-origin",
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
    credentials: "same-origin",
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
    areaDirection?: number;
    channelExtraPa?: number;
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
    credentials: "same-origin",
    body: JSON.stringify({ monsterEntryId, q, r, ...opts }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Falha ao invocar monstro");
  }
  return res.json() as Promise<RoomSnapshot>;
}

export async function deleteRoomToken(roomId: string, tokenId: string) {
  const res = await fetch(`/api/room/${roomId}/tokens/${tokenId}`, {
    method: "DELETE",
    credentials: "same-origin",
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Falha ao remover token");
  }
  return res.json() as Promise<RoomSnapshot>;
}

export async function repositionRoomToken(
  roomId: string,
  tokenId: string,
  q: number,
  r: number
) {
  const res = await fetch(`/api/room/${roomId}/tokens/reposition`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ tokenId, q, r }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Falha ao reposicionar");
  }
  return res.json() as Promise<RoomSnapshot>;
}

export async function createGmCreation(
  roomId: string,
  body: {
    mode?: "blank" | "monster" | "actor";
    name?: string;
    creationKind?: "creature" | "npc";
    monsterEntryId?: string;
    actorId?: string;
  }
) {
  const res = await fetch(`/api/room/${roomId}/gm/creations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Falha ao criar template");
  }
  return res.json() as Promise<{
    creation: import("@/lib/room/gm-creations").GmCreation;
    snapshot: RoomSnapshot;
  }>;
}

export async function updateGmCreation(
  roomId: string,
  creationId: string,
  patch: Record<string, unknown>
) {
  const res = await fetch(`/api/room/${roomId}/gm/creations/${creationId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Falha ao salvar template");
  }
  return res.json() as Promise<{
    creation: import("@/lib/room/gm-creations").GmCreation;
    snapshot: RoomSnapshot;
  }>;
}

export async function deleteGmCreation(roomId: string, creationId: string) {
  const res = await fetch(`/api/room/${roomId}/gm/creations/${creationId}`, {
    method: "DELETE",
    credentials: "same-origin",
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Falha ao excluir template");
  }
  const data = (await res.json()) as { snapshot: RoomSnapshot };
  return data.snapshot;
}

export async function spawnGmCreation(
  roomId: string,
  creationId: string,
  q: number,
  r: number
) {
  const res = await fetch(`/api/room/${roomId}/tokens/spawn-gm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ creationId, q, r }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Falha ao colocar na mesa");
  }
  return res.json() as Promise<RoomSnapshot>;
}

export async function placeRoomActorOnHex(
  roomId: string,
  actorId: string,
  q: number,
  r: number
) {
  const res = await fetch(`/api/room/${roomId}/tokens/place-actor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ actorId, q, r }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Falha ao posicionar personagem");
  }
  return res.json() as Promise<RoomSnapshot>;
}

export async function postRoomPing(
  roomId: string,
  q: number,
  r: number,
  color?: string
) {
  const res = await fetch(`/api/room/${roomId}/ping`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ q, r, color }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Falha ao pingar");
  }
  return res.json() as Promise<RoomSnapshot>;
}

export type ScenePatchBody = {
  mapImageUrl?: string | null;
  mapImageScale?: number;
  mapImageOffsetX?: number;
  mapImageOffsetY?: number;
  fogEnabled?: boolean;
  revealedHexes?: string[];
};

export type RoomSettingsPatchBody = {
  name?: string;
  showMonsterHpToPlayers?: boolean;
  showMonsterHpInChat?: boolean;
  allowPlayerPing?: boolean;
  gmBypassInitiative?: boolean;
};

export async function patchRoomSettings(roomId: string, patch: RoomSettingsPatchBody) {
  const res = await fetch(`/api/room/${roomId}/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Falha ao salvar configurações");
  }
  const data = (await res.json()) as { snapshot: RoomSnapshot };
  return data.snapshot;
}

export async function patchRoomScene(roomId: string, patch: ScenePatchBody) {
  const res = await fetch(`/api/room/${roomId}/scene`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Falha ao atualizar mapa");
  }
  return res.json() as Promise<RoomSnapshot>;
}

export async function revealRoomHex(roomId: string, q: number, r: number) {
  const res = await fetch(`/api/room/${roomId}/scene`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ revealHex: { q, r } }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Falha ao revelar hex");
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
