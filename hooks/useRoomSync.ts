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
  deltaAffectsBattlefield,
  isRoomDelta,
  type RoomApiPayload,
} from "@/lib/room/room-delta";
import { clampSnapshotCombatMode } from "@/lib/vtt/combat-mode-pending";
import { RoomApiHttpError } from "@/lib/room/api-error";

const FETCH_TIMEOUT_MS = 20_000;
const SYNC_TRANSIENT_MAX = 4;
const SYNC_RETRY_BASE_MS = 1_500;

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
  /** Não abre SSE/poll — mesa já fornece sync (ex.: ficha popup) */
  disabled?: boolean;
};

export type RoomSyncBridge = {
  snapshot: RoomSnapshot | null;
  refresh: () => Promise<void>;
  applySnapshot: (
    data: RoomSnapshot,
    opts?: { force?: boolean; immediate?: boolean }
  ) => void;
};

const PRESENCE_HEARTBEAT_MS = 15_000;
/** Agrupa rajadas de revision SSE em um único fetch. */
const REFRESH_DEBOUNCE_MS = 150;
const REFRESH_DEBOUNCE_COMBAT_MS = 200;
/** Poll de segurança mesmo com SSE aberto (ms). */
const SSE_BACKUP_POLL_MS = 10_000;
const SSE_BACKUP_POLL_COMBAT_MS = 6000;
/** Reconexão SSE após queda (ms) — backoff até SSE_RECONNECT_MAX_MS. */
const SSE_RECONNECT_BASE_MS = 2000;
const SSE_RECONNECT_MAX_MS = 30_000;

export type RoomSyncStatus = "loading" | "live" | "polling" | "error";

function isTransientHttpStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

function isTransientSyncError(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  if (e.name === "AbortError") return true;
  const msg = e.message.toLowerCase();
  return (
    msg.includes("failed to fetch") ||
    msg.includes("network") ||
    msg.includes("load failed") ||
    msg.includes("networkerror")
  );
}

function resolveSyncStatus(sseLive: boolean, hasSnapshot: boolean): RoomSyncStatus {
  if (sseLive || hasSnapshot) return "live";
  return "polling";
}

function roomQuery(roomId: string, inviteCode?: string | null, sinceRev?: number): string {
  const q = new URLSearchParams();
  if (inviteCode?.trim()) q.set("invite", inviteCode.trim());
  if (sinceRev != null && sinceRev > 0) q.set("since", String(sinceRev));
  const s = q.toString();
  return s ? `?${s}` : "";
}

const COMBAT_POLL_INTERVAL_MS = 2500;

function prepareSnapshot(data: RoomSnapshot): RoomSnapshot {
  const tokens = Array.isArray(data.scene?.tokens) ? data.scene.tokens : [];
  return clampSnapshotCombatMode({
    ...data,
    scene: { ...data.scene, tokens },
    combat: normalizeCombatTrack(data.combat, tokens),
  });
}

export function useRoomSync(roomId: string, opts: SyncOpts = {}) {
  const disabled = opts.disabled ?? false;
  const inviteCode = opts.inviteCode ?? null;
  const initialSnapshot = opts.initialSnapshot ?? null;
  const basePollIntervalMs = opts.pollIntervalMs ?? 2000;
  const presenceUser = opts.presenceUser ?? null;
  const onMemberOnline = opts.onMemberOnline;
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(() =>
    initialSnapshot ? prepareSnapshot(initialSnapshot) : null
  );
  const [loading, setLoading] = useState(!initialSnapshot);
  const snapshotRef = useRef<RoomSnapshot | null>(
    initialSnapshot ? prepareSnapshot(initialSnapshot) : null
  );
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<RoomSyncStatus>("loading");
  const revisionRef = useRef(initialSnapshot?.revision ?? 0);
  const query = useMemo(() => roomQuery(roomId, inviteCode), [roomId, inviteCode]);
  const sseReadyRef = useRef(false);
  const sseLiveRef = useRef(false);
  const fallbackPollIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollIntervalRef = useRef(basePollIntervalMs);
  const backupPollRef = useRef(SSE_BACKUP_POLL_MS);
  const onMemberOnlineRef = useRef(onMemberOnline);
  onMemberOnlineRef.current = onMemberOnline;

  const applySnapshot = useCallback(
    (data: RoomSnapshot, opts?: { force?: boolean; immediate?: boolean }) => {
      if (!opts?.force && data.revision < revisionRef.current) return;
      revisionRef.current = Math.max(revisionRef.current, data.revision);
      const next = prepareSnapshot(data);
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
      const immediate =
        opts?.immediate ??
        (isRoomDelta(payload) ? deltaAffectsBattlefield(payload) : true);
      applySnapshot(merged, { force: opts?.force, immediate });
    },
    [applySnapshot]
  );

  const refreshImplRef = useRef<(() => Promise<void>) | null>(null);
  const refreshDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshInFlightRef = useRef(false);
  const refreshQueuedRef = useRef(false);
  const syncFailStreakRef = useRef(0);
  const syncRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSyncRetryTimer = useCallback(() => {
    if (syncRetryTimerRef.current) {
      clearTimeout(syncRetryTimerRef.current);
      syncRetryTimerRef.current = null;
    }
  }, []);

  const noteSyncSuccess = useCallback(() => {
    syncFailStreakRef.current = 0;
    clearSyncRetryTimer();
    setSyncError(null);
  }, [clearSyncRetryTimer]);

  const scheduleSyncRetry = useCallback((delayMs: number) => {
    clearSyncRetryTimer();
    syncRetryTimerRef.current = setTimeout(() => {
      syncRetryTimerRef.current = null;
      void refreshImplRef.current?.();
    }, delayMs);
  }, [clearSyncRetryTimer]);

  const noteSyncFailure = useCallback(
    (message: string, opts?: { transient?: boolean; forceFull?: boolean }) => {
      const hasSnapshot = Boolean(snapshotRef.current);
      const transient = opts?.transient ?? false;

      if (transient && hasSnapshot) {
        syncFailStreakRef.current += 1;
        if (opts?.forceFull && syncFailStreakRef.current >= SYNC_TRANSIENT_MAX) {
          revisionRef.current = 0;
          syncFailStreakRef.current = 0;
          scheduleSyncRetry(400);
          setSyncStatus(resolveSyncStatus(sseLiveRef.current, true));
          return;
        }
        if (syncFailStreakRef.current < SYNC_TRANSIENT_MAX) {
          scheduleSyncRetry(
            Math.min(10_000, SYNC_RETRY_BASE_MS * syncFailStreakRef.current)
          );
          setSyncStatus(resolveSyncStatus(sseLiveRef.current, true));
          return;
        }
      }

      setSyncError(message);
      setSyncStatus("error");
    },
    [scheduleSyncRetry]
  );

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
        noteSyncSuccess();
        setSyncStatus(resolveSyncStatus(sseLiveRef.current, Boolean(snapshotRef.current)));
        sseReadyRef.current = true;
        return;
      }
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        const msg = err.error ?? `Sync falhou (${res.status})`;
        if (isTransientHttpStatus(res.status) && snapshotRef.current) {
          noteSyncFailure(msg, {
            transient: true,
            forceFull: res.status >= 500,
          });
        } else {
          setSyncError(msg);
          setSyncStatus("error");
        }
        return;
      }
      const data = (await res.json()) as RoomApiPayload;
      noteSyncSuccess();
      applyRoomResponse(data);
      setSyncStatus(resolveSyncStatus(sseLiveRef.current, Boolean(snapshotRef.current)));
      sseReadyRef.current = true;
    } catch (e) {
      const msg =
        e instanceof Error && e.name === "AbortError"
          ? "Sync demorou demais — tentando de novo…"
          : e instanceof Error
            ? e.message
            : "Falha de rede";
      if (isTransientSyncError(e) && snapshotRef.current) {
        noteSyncFailure(msg, { transient: true, forceFull: true });
      } else {
        setSyncError(msg);
        setSyncStatus("error");
      }
    } finally {
      clearTimeout(timer);
      setLoading(false);
      refreshInFlightRef.current = false;
      if (refreshQueuedRef.current) {
        refreshQueuedRef.current = false;
        void refreshImplRef.current?.();
      }
    }
  }, [roomId, inviteCode, applyRoomResponse, noteSyncSuccess, noteSyncFailure]);

  refreshImplRef.current = refresh;

  const scheduleRefresh = useCallback(() => {
    const inCombat = snapshotRef.current?.settings?.combatActive === true;
    const debounceMs = inCombat ? REFRESH_DEBOUNCE_COMBAT_MS : REFRESH_DEBOUNCE_MS;
    if (refreshDebounceRef.current) return;
    refreshDebounceRef.current = setTimeout(() => {
      refreshDebounceRef.current = null;
      void refreshImplRef.current?.();
    }, debounceMs);
  }, [refresh]);

  const initialSnapshotRef = useRef(initialSnapshot);
  initialSnapshotRef.current = initialSnapshot;

  useEffect(() => {
    if (disabled) return;
    const init = initialSnapshotRef.current;
    if (init) {
      const prepared = prepareSnapshot(init);
      revisionRef.current = prepared.revision;
      snapshotRef.current = prepared;
      setSyncStatus("live");
      setLoading(false);
    } else {
      setLoading(true);
      revisionRef.current = 0;
      setSyncStatus("loading");
      void refresh();
    }
    setSyncError(null);
    sseReadyRef.current = false;
    sseLiveRef.current = false;
    syncFailStreakRef.current = 0;
    clearSyncRetryTimer();
  }, [roomId, inviteCode, disabled, clearSyncRetryTimer]);

  useEffect(() => {
    pollIntervalRef.current =
      snapshotRef.current?.settings?.combatActive === true
        ? COMBAT_POLL_INTERVAL_MS
        : basePollIntervalMs;
    backupPollRef.current =
      snapshotRef.current?.settings?.combatActive === true
        ? SSE_BACKUP_POLL_COMBAT_MS
        : SSE_BACKUP_POLL_MS;

    if (disabled || sseLiveRef.current || !fallbackPollIdRef.current) return;
    clearInterval(fallbackPollIdRef.current);
    fallbackPollIdRef.current = setInterval(() => {
      void refreshImplRef.current?.();
    }, pollIntervalRef.current);
  }, [snapshot?.settings?.combatActive, basePollIntervalMs, disabled]);

  useEffect(() => {
    if (disabled) return;
    if (typeof EventSource === "undefined") {
      const id = setInterval(refresh, pollIntervalRef.current);
      return () => clearInterval(id);
    }

    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempt = 0;

    const stopFallbackPoll = () => {
      if (fallbackPollIdRef.current) {
        clearInterval(fallbackPollIdRef.current);
        fallbackPollIdRef.current = null;
      }
    };

    const startFallbackPoll = () => {
      stopFallbackPoll();
      fallbackPollIdRef.current = setInterval(() => {
        void refreshImplRef.current?.();
      }, pollIntervalRef.current);
    };

    const scheduleReconnect = () => {
      if (reconnectTimer) return;
      const delay = Math.min(
        SSE_RECONNECT_MAX_MS,
        SSE_RECONNECT_BASE_MS * 2 ** Math.min(reconnectAttempt, 4)
      );
      reconnectAttempt += 1;
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, delay);
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
            reconnectAttempt = 0;
            sseLiveRef.current = true;
            setSyncStatus("live");
            stopFallbackPoll();
            if (data.revision > revisionRef.current) {
              scheduleRefresh();
            }
          }
          if (data.type === "connected" && typeof data.revision === "number") {
            reconnectAttempt = 0;
            sseLiveRef.current = true;
            setSyncStatus("live");
            stopFallbackPoll();
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
        setSyncStatus(resolveSyncStatus(false, Boolean(snapshotRef.current)));
        es?.close();
        es = null;
        startFallbackPoll();
        scheduleReconnect();
      };
    };

    connect();
    const backupDelay = setTimeout(() => {
      if (!sseLiveRef.current) startFallbackPoll();
    }, 8000);

    return () => {
      clearTimeout(backupDelay);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      es?.close();
      stopFallbackPoll();
      clearSyncRetryTimer();
      if (refreshDebounceRef.current) {
        clearTimeout(refreshDebounceRef.current);
        refreshDebounceRef.current = null;
      }
    };
  }, [roomId, inviteCode, refresh, scheduleRefresh, disabled, clearSyncRetryTimer]);

  useEffect(() => {
    if (disabled) return;
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      void refreshImplRef.current?.();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [disabled]);

  useEffect(() => {
    if (disabled) return;
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
  }, [roomId, query, presenceUser?.id, disabled]);

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

async function throwRoomApiError(res: Response, fallback: string): Promise<never> {
  const err = (await res.json().catch(() => ({}))) as { error?: string };
  throw new RoomApiHttpError(err.error ?? fallback, res.status);
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
  if (!res.ok) await throwRoomApiError(res, "Falha ao salvar ficha");
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
  if (!res.ok) await throwRoomApiError(res, "Falha ao subir nível");
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
  if (!res.ok) await throwRoomApiError(res, "Falha ao preparar refeição");
  const data = (await res.json()) as { snapshot: RoomSnapshot };
  return data.snapshot;
}

export async function rollInitiative(roomId: string) {
  const res = await fetch(`/api/room/${roomId}/combat/roll-initiative`, { method: "POST" });
  if (!res.ok) await throwRoomApiError(res, "Falha ao rolar iniciativa");
  return res.json() as Promise<RoomApiPayload>;
}

export async function nextCombatTurn(roomId: string, opts?: { force?: boolean }) {
  const res = await fetch(`/api/room/${roomId}/combat/next-turn`, {
    method: "POST",
    credentials: "same-origin",
    headers: opts?.force ? { "Content-Type": "application/json" } : undefined,
    body: opts?.force ? JSON.stringify({ force: true }) : undefined,
  });
  if (!res.ok) await throwRoomApiError(res, "Falha ao avançar turno");
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
  if (!res.ok) await throwRoomApiError(res, "Falha no controle do mestre");
  return res.json() as Promise<RoomApiPayload>;
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
  if (!res.ok) await throwRoomApiError(res, "Falha no ataque");
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
  if (!res.ok) await throwRoomApiError(res, "Falha na habilidade");
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
  if (!res.ok) await throwRoomApiError(res, "Falha ao usar consumível");
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
  if (!res.ok) await throwRoomApiError(res, "Movimento inválido");
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
  if (!res.ok) await throwRoomApiError(res, "Falha na magia de área");
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
  if (!res.ok) await throwRoomApiError(res, "Falha ao invocar monstro");
  return res.json() as Promise<RoomSnapshot>;
}

export async function deleteRoomToken(roomId: string, tokenId: string) {
  const res = await fetch(`/api/room/${roomId}/tokens/${tokenId}`, {
    method: "DELETE",
    credentials: "same-origin",
  });
  if (!res.ok) await throwRoomApiError(res, "Falha ao remover token");
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
  if (!res.ok) await throwRoomApiError(res, "Falha ao reposicionar");
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
  if (!res.ok) await throwRoomApiError(res, "Falha ao criar template");
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
  if (!res.ok) await throwRoomApiError(res, "Falha ao salvar template");
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
  if (!res.ok) await throwRoomApiError(res, "Falha ao excluir template");
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
  if (!res.ok) await throwRoomApiError(res, "Falha ao colocar na mesa");
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
  if (!res.ok) await throwRoomApiError(res, "Falha ao posicionar personagem");
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
  if (!res.ok) await throwRoomApiError(res, "Falha ao pingar");
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
  if (!res.ok) await throwRoomApiError(res, "Falha ao salvar configurações");
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
  if (!res.ok) await throwRoomApiError(res, "Falha ao atualizar mapa");
  return res.json() as Promise<RoomSnapshot>;
}

export async function revealRoomCell(roomId: string, q: number, r: number) {
  const res = await fetch(`/api/room/${roomId}/scene`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ revealCell: { q, r } }),
  });
  if (!res.ok) await throwRoomApiError(res, "Falha ao revelar célula");
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
  if (!res.ok) await throwRoomApiError(res, "Falha ao enviar");
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
  if (!res.ok) await throwRoomApiError(res, "Falha ao ajustar progresso");
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
  if (!res.ok) await throwRoomApiError(res, "Falha ao rolar salvaguarda");
  return res.json() as Promise<RoomSnapshot>;
}
