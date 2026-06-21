"use client";

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import type { ChatMessage } from "@/lib/room/chat";
import type { RoomSnapshot } from "@/lib/room/types";
import type { BattleToken } from "@/lib/vtt/types";
import type { CombatFxState } from "@/lib/vtt/combat-fx-types";
import type { TokenCombatFlash } from "@/components/vtt/CombatFxLayer";
import type { TokenCastFxKind } from "@/lib/vtt/token-cast-fx";
import { castFxDuration, type ActiveTokenCastFx } from "@/lib/vtt/token-cast-fx";
import {
  ingestNewCombatFx,
  isPendingCombatFx,
  findPendingAttackMessage,
  resolvePendingCombatFx,
} from "@/lib/vtt/combat-fx-sequence";
import type { RoomApiPayload } from "@/lib/room/room-delta";
import { useMesaChat } from "@/hooks/vtt/useMesaRoomSlice";

type TokenFlashState = { tokenId: string; kind: NonNullable<TokenCombatFlash> } | null;

type Opts = {
  roomId: string;
  snapshot: RoomSnapshot | null;
  applyCombatSnapshot: (snap: RoomSnapshot) => void;
  resolveRoomPayload: (payload: RoomApiPayload) => RoomSnapshot;
  pendingCombatSnapRef?: MutableRefObject<RoomSnapshot | null>;
};

/** Fila de FX de combate (dados, dano) desacoplada do canvas. */
export function useBattlefieldCombatFxQueue({
  roomId,
  snapshot,
  applyCombatSnapshot,
  resolveRoomPayload,
  pendingCombatSnapRef: pendingCombatSnapRefProp,
}: Opts) {
  const [combatFx, setCombatFx] = useState<CombatFxState | null>(null);
  const [tokenFlash, setTokenFlash] = useState<TokenFlashState>(null);
  const [tokenCastFx, setTokenCastFx] = useState<ActiveTokenCastFx[]>([]);

  const seenCombatRef = useRef<Set<string>>(new Set());
  const combatChatSeededRef = useRef(false);
  const combatFxQueueRef = useRef<CombatFxState[]>([]);
  const combatFxIdRef = useRef<string | null>(null);
  const pendingCombatSnapRefInternal = useRef<RoomSnapshot | null>(null);
  const pendingCombatSnapRef = pendingCombatSnapRefProp ?? pendingCombatSnapRefInternal;
  const playCombatFxFromSnapRef = useRef<(payload: RoomApiPayload) => void>(() => {});
  const chat = useMesaChat(roomId);
  const chatTokens = snapshot?.scene.tokens ?? [];

  const enqueueCombatFxFromChat = useCallback(
    (chat: ChatMessage[], tokens: BattleToken[]) => {
      const newMsgs = chat.filter(
        (m) => m.kind === "combat" && m.combat && !seenCombatRef.current.has(m.id)
      );
      if (!newMsgs.length) return;
      const { sequence, markSeen } = ingestNewCombatFx(newMsgs, seenCombatRef.current, tokens, {
        deferStateApplyForToken: () => true,
      });
      for (const id of markSeen) seenCombatRef.current.add(id);
      if (!sequence.length) return;
      combatFxQueueRef.current.push(...sequence);
      if (!combatFx) {
        const next = combatFxQueueRef.current.shift() ?? null;
        combatFxIdRef.current = next?.id ?? null;
        setCombatFx(next);
      }
    },
    [combatFx]
  );

  const playCombatFxFromSnap = useCallback(
    (payload: RoomApiPayload) => {
      const snap = resolveRoomPayload(payload);
      if (combatFx && isPendingCombatFx(combatFx)) {
        const msg = findPendingAttackMessage(snap.chat, combatFx, seenCombatRef.current);
        if (msg) {
          const resolved = resolvePendingCombatFx(combatFx, msg, snap.scene.tokens);
          if (resolved) {
            seenCombatRef.current.add(msg.id);
            combatFxIdRef.current = resolved.id;
            setCombatFx(resolved);
            return;
          }
        }
      }
      enqueueCombatFxFromChat(snap.chat, snap.scene.tokens);
    },
    [enqueueCombatFxFromChat, combatFx, resolveRoomPayload]
  );

  playCombatFxFromSnapRef.current = playCombatFxFromSnap;

  useEffect(() => {
    if (!chat.length) return;
    if (!combatChatSeededRef.current) {
      for (const msg of chat) {
        if (msg.kind === "combat" && msg.combat) seenCombatRef.current.add(msg.id);
      }
      combatChatSeededRef.current = true;
      return;
    }
    enqueueCombatFxFromChat(chat, chatTokens);
  }, [chat, chatTokens, enqueueCombatFxFromChat]);

  useEffect(() => {
    combatChatSeededRef.current = false;
    seenCombatRef.current = new Set();
    combatFxQueueRef.current = [];
    combatFxIdRef.current = null;
    pendingCombatSnapRef.current = null;
    setCombatFx(null);
    setTokenFlash(null);
    setTokenCastFx([]);
  }, [roomId]);

  const onCombatApplyState = useCallback(() => {
    const snap = pendingCombatSnapRef.current;
    if (!snap) return;
    pendingCombatSnapRef.current = null;
    applyCombatSnapshot(snap);
  }, [applyCombatSnapshot]);

  const onCombatFxDone = useCallback(() => {
    setTokenFlash(null);
    if (pendingCombatSnapRef.current) {
      const snap = pendingCombatSnapRef.current;
      pendingCombatSnapRef.current = null;
      applyCombatSnapshot(snap);
    }
    const next = combatFxQueueRef.current.shift() ?? null;
    combatFxIdRef.current = next?.id ?? null;
    setCombatFx(next);
  }, [applyCombatSnapshot]);

  const onCombatTokenFlash = useCallback(
    (tokenId: string | null, kind: import("@/lib/vtt/draw-battlefield").TokenFlashKind | null) => {
      if (tokenId && kind) setTokenFlash({ tokenId, kind });
      else setTokenFlash(null);
    },
    []
  );

  const onTokenCastFx = useCallback((tokenId: string, kind: TokenCastFxKind) => {
    const startedAt = Date.now();
    setTokenCastFx((prev) => [
      ...prev.filter((fx) => !(fx.tokenId === tokenId && fx.kind === kind)),
      {
        id: `castfx-${tokenId}-${startedAt}`,
        tokenId,
        kind,
        startedAt,
        durationMs: castFxDuration(kind),
      },
    ]);
  }, []);

  useEffect(() => {
    if (!tokenCastFx.length) return;
    const id = window.setInterval(() => {
      const now = Date.now();
      setTokenCastFx((prev) => {
        const next = prev.filter((fx) => now - fx.startedAt < fx.durationMs);
        return next.length === prev.length ? prev : next;
      });
    }, 120);
    return () => window.clearInterval(id);
  }, [tokenCastFx.length]);

  return {
    combatFx,
    setCombatFx,
    combatFxQueueRef,
    combatFxIdRef,
    seenCombatRef,
    tokenFlash,
    tokenCastFx,
    pendingCombatSnapRef,
    playCombatFxFromSnap,
    playCombatFxFromSnapRef,
    onCombatApplyState,
    onCombatFxDone,
    onCombatTokenFlash,
    onTokenCastFx,
  };
}
