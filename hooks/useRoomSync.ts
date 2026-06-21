"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { IdentityPatch } from "@/lib/character/identity";
import type { LevelUpChoices } from "@/lib/character/level-up";
import type { CharacterSheet } from "@/lib/character/types";
import { normalizeCombatTrack } from "@/lib/room/combat";
import type { RoomActor, RoomSnapshot } from "@/lib/room/types";
import type { DungeonObject } from "@/lib/vtt/types";
import {
  applyRoomApiPayload,
  isRoomDelta,
  type RoomApiPayload,
} from "@/lib/room/room-delta";

const FETCH_TIMEOUT_MS = 12_000;

export type RoomMemberOnlineEvent = {
  userId: string;
  displayName: string;
};

type SyncOpts = {
  /** Código na URL (?invite=) — visitante assiste com SSE/GET */
  inviteCode?: string | null;
  /** Snapshot SSR — evita tela vazia ao abrir mesa (Fase 4) */
  initialSnapshot?: RoomSnapshot | null;
  /** Fallback poll se SSE falhar (ms) */
  pollIntervalMs?: number;
  /** Jogador logado na mesa — heartbeat de presença */
  presenceUser?: { id: string; name: string } | null;
  /** Outro participante entrou online (via SSE) */
  onMemberOnline?: (event: RoomMemberOnlineEvent) => void;
};

const PRESENCE_HEARTBEAT_MS = 15_000;
/** Agrupa rajadas de revision SSE em um único fetch. */
const REFRESH_DEBOUNCE_MS = 120;
const REFRESH_DEBOUNCE_COMBAT_MS = 0;
/** Poll de segurança mesmo com SSE aberto (ms). */
const SSE_BACKUP_POLL_MS = 10_000;
const SSE_BACKUP_POLL_COMBAT_MS = 1500;

export type RoomSyncStatus = "loading" | "live" | "polling" | "error";

function roomQuery(roomId: string, inviteCode?: string | null, sinceRev?: number): string {
  const q = new URLSearchParams();
  if (inviteCode?.trim()) q.set("invite", inviteCode.trim());
  if (sinceRev != null && sinceRev > 0) q.set("since", String(sinceRev));
  const s = q.toString();
  return s ? `?${s}` : "";
}

const COMBAT_POLL_INTERVAL_MS = 500;

export function useRoomSync(roomId: string, opts: SyncOpts = {}) {
  const inviteCode = opts.inviteCode ?? null;
  const initialSnapshot = opts.initialSnapshot ?? null;
  const basePollIntervalMs = opts.pollIntervalMs ?? 2000;
  const presenceUser = opts.presenceUser ?? null;
  const onMemberOnline = opts.onMemberOnline;
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(initialSnapshot);
  const [loading, setLoading] = useState(!initialSnapshot);
  const snapshotRef = useRef<RoomSnapshot | null>(initialSnapshot);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<RoomSyncStatus>("loading");
  const revisionRef = useRef(0);
  const query = useMemo(() => roomQuery(roomId, inviteCode), [roomId, inviteCode]);
  const sseReadyRef = useRef(false);
  const sseLiveRef = useRef(false);
  const onMemberOnlineRef = useRef(onMemberOnline);
  onMemberOnlineRef.current = onMemberOnline;

  const applySnapshot = useCallback(
    (data: RoomSnapshot, opts?: { force?: boolean; immediate?: boolean }) => {
      if (!opts?.force && data.revision < revisionRef.current) return;
      revisionRef.current = Math.max(revisionRef.current, data.revision);
      const tokens = Array.isArray(data.scene?.tokens) ? data.scene.tokens : [];
      const next: RoomSnapshot = {
        ...data,
        scene: { ...data.scene, tokens },
        combat: normalizeCombatTrack(data.combat, tokens),
      };
      snapshotRef.current = next;
      const commit = () => {
        setSnapshot(next);
        setSyncError(null);
        setLoading(false);
        if (opts?.immediate) setSyncStatus("live");
      };
      if (opts?.immediate) commit();
      else startTransition(commit);
    },
    []
  );

  const applyRoomResponse = useCallback(
    (payload: RoomApiPayload, opts?: { force?: boolean; immediate?: boolean }) => {
      const merged = applyRoomApiPayload(snapshotRef.current, payload);
      applySnapshot(merged, opts);
    },
    [applySnapshot]
  );

  const refreshImplRef = useRef<(() => Promise<void>) | null>(null);
  const refreshDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshInFlightRef = useRef(false);
  const refreshQueuedRef = useRef(false);

  const refresh = useCallback(async () => {
    if (refreshInFlightRef.current) {
      refreshQueuedRef.current = true;
      return;
    }
    refreshInFlightRef.current = true;
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
    try {
      const syncQuery = roomQuery(roomId, inviteCode, revisionRef.current);
      const res = await fetch(`/api/room/${roomId}${syncQuery}`, {
        cache: "no-store",
        signal: ac.signal,
      });
      if (res.status === 304) {
        const hdr = res.headers.get("X-Room-Revision");
        const rev = hdr ? parseInt(hdr, 10) : revisionRef.current;
        if (Number.isFinite(rev) && rev > 0) revisionRef.current = Math.max(revisionRef.current, rev);
        setSyncError(null);
        setSyncStatus(sseLiveRef.current ? "live" : "polling");
        sseReadyRef.current = true;
        return;
      }
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setSyncError(err.error ?? `Sync falhou (${res.status})`);
        return;
      }
      const data = (await res.json()) as RoomSnapshot;
      setSyncError(null);
      setSyncStatus(sseLiveRef.current ? "live" : "polling");
      const inCombat = data.settings?.combatActive === true;
      applySnapshot(data, { immediate: inCombat });
      sseReadyRef.current = true;
    } catch (e) {
      const msg =
        e instanceof Error && e.name === "AbortError"
          ? "Sync demorou demais — recarregue a página"
          : e instanceof Error
            ? e.message
            : "Falha de rede";
      setSyncError(msg);
      setSyncStatus("error");
    } finally {
      clearTimeout(timer);
      setLoading(false);
      refreshInFlightRef.current = false;
      if (refreshQueuedRef.current) {
        refreshQueuedRef.current = false;
        void refreshImplRef.current?.();
      }
    }
  }, [roomId, query, applySnapshot]);

  refreshImplRef.current = refresh;

  const scheduleRefresh = useCallback(() => {
    const inCombat = snapshotRef.current?.settings?.combatActive === true;
    if (inCombat) {
      if (refreshDebounceRef.current) {
        clearTimeout(refreshDebounceRef.current);
        refreshDebounceRef.current = null;
      }
      void refreshImplRef.current?.();
      return;
    }
    if (refreshDebounceRef.current) return;
    refreshDebounceRef.current = setTimeout(() => {
      refreshDebounceRef.current = null;
      void refreshImplRef.current?.();
    }, REFRESH_DEBOUNCE_MS);
  }, [refresh]);

  const initialSnapshotRef = useRef(initialSnapshot);
  initialSnapshotRef.current = initialSnapshot;

  useEffect(() => {
    const init = initialSnapshotRef.current;
    if (init) {
      revisionRef.current = init.revision;
      snapshotRef.current = init;
      applySnapshot(init, { force: true, immediate: true });
    } else {
      setLoading(true);
      revisionRef.current = 0;
    }
    setSyncError(null);
    setSyncStatus(init ? "polling" : "loading");
    sseReadyRef.current = false;
    sseLiveRef.current = false;
    void refresh();
  }, [roomId, query, refresh, applySnapshot]);

  const pollIntervalMs =
    snapshot?.settings?.combatActive === true ? COMBAT_POLL_INTERVAL_MS : basePollIntervalMs;
  const backupPollMs =
    snapshot?.settings?.combatActive === true ? SSE_BACKUP_POLL_COMBAT_MS : SSE_BACKUP_POLL_MS;

  useEffect(() => {
    if (typeof EventSource === "undefined") {
      const id = setInterval(refresh, pollIntervalMs);
      return () => clearInterval(id);
    }

    let es: EventSource | null = null;
    let pollId: ReturnType<typeof setInterval> | null = null;

    const startPoll = (ms: number) => {
      if (pollId) clearInterval(pollId);
      pollId = setInterval(refresh, ms);
    };

    const connect = () => {
      es?.close();
      const since = revisionRef.current;
      const eventsQ = new URLSearchParams();
      eventsQ.set("since", String(since));
      if (inviteCode?.trim()) eventsQ.set("invite", inviteCode.trim());

      es = new EventSource(`/api/room/${roomId}/events?${eventsQ.toString()}`);

      es.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data) as {
            type?: string;
            revision?: number;
            userId?: string;
            displayName?: string;
          };
          if (data.type === "revision" && typeof data.revision === "number") {
            sseLiveRef.current = true;
            setSyncStatus("live");
            if (data.revision > revisionRef.current) {
              scheduleRefresh();
            }
          }
          if (data.type === "connected" && typeof data.revision === "number") {
            sseLiveRef.current = true;
            setSyncStatus("live");
            if (data.revision > revisionRef.current) {
              scheduleRefresh();
            }
          }
          if (
            data.type === "member_online" &&
            typeof data.userId === "string" &&
            typeof data.displayName === "string"
          ) {
            onMemberOnlineRef.current?.({
              userId: data.userId,
              displayName: data.displayName,
            });
          }
        } catch {
          /* ignore parse */
        }
      };

      es.onerror = () => {
        sseLiveRef.current = false;
        setSyncStatus("polling");
        es?.close();
        es = null;
        startPoll(pollIntervalMs);
      };
    };

    connect();
    startPoll(backupPollMs);

    return () => {
      es?.close();
      if (pollId) clearInterval(pollId);
      if (refreshDebounceRef.current) {
        clearTimeout(refreshDebounceRef.current);
        refreshDebounceRef.current = null;
      }
    };
  }, [roomId, inviteCode, refresh, scheduleRefresh, pollIntervalMs, backupPollMs]);

  useEffect(() => {
    if (!presenceUser?.id) return;
    /* SSE (/events) envia heartbeat de presença — evita POST duplicado a cada 15s */
    if (typeof EventSource !== "undefined") return;

    const ping = () => {
      void fetch(`/api/room/${roomId}/presence${query}`, {
        method: "POST",
        credentials: "same-origin",
      }).catch(() => {
        /* rede instável */
      });
    };

    ping();
    const id = setInterval(ping, PRESENCE_HEARTBEAT_MS);
    return () => clearInterval(id);
  }, [roomId, query, presenceUser?.id]);

  return { snapshot, loading, syncError, syncStatus, refresh, applySnapshot, applyRoomResponse };
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
      | "portraitUrl"
      | "tokenImageUrl"
      | "portraitFocus"
      | "coverFocus"
      | "tokenFocus"
      | "name"
      | "biography"
      | "combatLoadout"
      | "armorLoadout"
      | "inventory"
      | "preparedSpellIds"
    >
  > & {
    identityPatch?: IdentityPatch;
  }
) {
  const res = await fetch(`/api/room/${roomId}/actors/${actorId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Falha ao salvar ficha");
  }
  return res.json() as Promise<{
    actor: RoomActor;
    scene: RoomSnapshot["scene"];
    revision: number;
  }>;
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

export async function postStructuredMeal(
  roomId: string,
  body: import("@/lib/culinary/types").StructuredMealInput
): Promise<RoomSnapshot> {
  const res = await fetch(`/api/room/${roomId}/culinary/meal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Falha ao preparar refeição");
  }
  const data = (await res.json()) as { snapshot: RoomSnapshot };
  return data.snapshot;
}

export async function rollInitiative(roomId: string) {
  const res = await fetch(`/api/room/${roomId}/combat/roll-initiative`, { method: "POST" });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Falha ao rolar iniciativa");
  }
  return res.json() as Promise<RoomApiPayload>;
}

export async function nextCombatTurn(roomId: string, opts?: { force?: boolean }) {
  const res = await fetch(`/api/room/${roomId}/combat/next-turn`, {
    method: "POST",
    credentials: "same-origin",
    headers: opts?.force ? { "Content-Type": "application/json" } : undefined,
    body: opts?.force ? JSON.stringify({ force: true }) : undefined,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Falha ao avançar turno");
  }
  return res.json() as Promise<RoomApiPayload>;
}

export type GmCombatAction =
  | { action: "reset-pa"; tokenId: string }
  | { action: "defer-turn"; tokenId: string }
  | { action: "restore-order" }
  | { action: "set-order"; order: string[]; activeTokenId?: string }
  | { action: "set-active"; tokenId: string }
  | { action: "revert"; undoId: string }
  | { action: "restore-round"; round: number }
  | { action: "set-combat-mode"; active: boolean }
  | { action: "grant-xp-all"; amount: number }
  | { action: "level-up-all" }
  | { action: "set-hp"; tokenId: string; value: number; max?: number; temp?: number };

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

export type { RoomApiPayload };
export { applyRoomApiPayload, isRoomDelta };

export async function postRoomAttack(
  roomId: string,
  attackerTokenId: string,
  defenderTokenId: string,
  opts: {
    actionPack?: "armas" | "magias" | "habilidades";
    actionEntryId?: string;
    bypassTurn?: boolean;
    channelExtraPa?: number;
    defenderTokenIds?: string[];
  } = {}
) {
  const res = await fetch(`/api/room/${roomId}/combat/attack`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      attackerTokenId,
      defenderTokenId,
      defenderTokenIds: opts.defenderTokenIds,
      ...opts,
    }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Falha no ataque");
  }
  return res.json() as Promise<RoomApiPayload>;
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
  return res.json() as Promise<RoomApiPayload>;
}

export async function consumeRoomItem(
  roomId: string,
  tokenId: string,
  instanceId: string,
  opts: { bypassTurn?: boolean } = {}
) {
  const res = await fetch(`/api/room/${roomId}/combat/consume`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ tokenId, instanceId, ...opts }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Falha ao usar consumível");
  }
  return res.json() as Promise<RoomApiPayload>;
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
  return res.json() as Promise<RoomApiPayload>;
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
    credentials: "same-origin",
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

export async function placeRoomActorOnCell(
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
  revealedCells?: string[];
  dungeonObjects?: DungeonObject[];
  mapMarkups?: import("@/lib/vtt/types").MapMarkup[];
};

export type RoomSettingsPatchBody = {
  name?: string;
  combatActive?: boolean;
  autoPassDelayMs?: number;
  xpFromMonstersEnabled?: boolean;
  showMonsterHpToPlayers?: boolean;
  showMonsterHpInChat?: boolean;
  allowPlayerPing?: boolean;
  showUsernameOnTokenNameplate?: boolean;
  gmBypassInitiative?: boolean;
  coverUrl?: string | null;
  coverFocus?: import("@/lib/media/portrait-focus").PortraitFocus | null;
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

export async function revealRoomCell(roomId: string, q: number, r: number) {
  const res = await fetch(`/api/room/${roomId}/scene`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ revealCell: { q, r } }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Falha ao revelar célula");
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

export async function gmActorProgress(
  roomId: string,
  body:
    | { action: "grant-xp"; actorId: string; amount: number }
    | { action: "set-level"; actorId: string; level: number }
    | { action: "set-hp"; actorId: string; value: number; max?: number }
): Promise<RoomSnapshot> {
  const res = await fetch(`/api/room/${roomId}/gm/actor-progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Falha ao ajustar progresso");
  }
  return res.json() as Promise<RoomSnapshot>;
}

export async function gmSavingThrows(
  roomId: string,
  body: import("@/lib/room/handlers/gm-saving-throw").GmSavingThrowRequest,
  inviteCode?: string | null
): Promise<RoomSnapshot> {
  const q = inviteCode?.trim() ? `?invite=${encodeURIComponent(inviteCode.trim())}` : "";
  const res = await fetch(`/api/room/${roomId}/gm/saving-throw${q}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Falha ao rolar salvaguarda");
  }
  return res.json() as Promise<RoomSnapshot>;
}
