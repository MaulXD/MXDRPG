"use client";

import { useState } from "react";
import type { CombatTrack } from "@/lib/room/combat";
import { activeTokenId, normalizeCombatTrack } from "@/lib/room/combat";
import { resolveLivingActiveTokenId } from "@/lib/room/combat-order";
import type { BattleToken } from "@/lib/vtt/types";
import { nextCombatTurn } from "@/hooks/useRoomSync";

type Props = {
  roomId: string;
  combat: CombatTrack;
  tokens: BattleToken[];
  canEndTurn: boolean;
  isGm?: boolean;
  onUpdate: () => void;
  onSnapshot?: (snap: import("@/lib/room/types").RoomSnapshot) => void;
};

export function EndTurnBar({
  roomId,
  combat,
  tokens,
  canEndTurn,
  isGm = false,
  onUpdate,
  onSnapshot,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const track = normalizeCombatTrack(combat, tokens);
  const activeId = resolveLivingActiveTokenId(track, tokens) ?? activeTokenId(track);
  const activeToken = tokens.find((t) => t.id === activeId);
  const hasOrder = track.order.length > 0;

  if (!canEndTurn || !hasOrder) return null;

  async function handleEndTurn() {
    setBusy(true);
    setErr(null);
    try {
      const snap = await nextCombatTurn(roomId, { force: true });
      onSnapshot?.(snap);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Não foi possível passar o turno");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="vtt-end-turn-bar" role="region" aria-label="Passar turno">
      <div className="vtt-end-turn-copy">
        <span className="vtt-end-turn-label">Rodada {track.round}</span>
        {activeToken ? (
          <span className="vtt-end-turn-active">
            Turno de: <strong>{activeToken.name}</strong>
          </span>
        ) : null}
      </div>
      <button
        type="button"
        className="btn vtt-end-turn-btn"
        disabled={busy}
        onClick={() => void handleEndTurn()}
      >
        {busy ? "Passando…" : "Passar turno"}
      </button>
      {isGm ? (
        <span className="vtt-end-turn-hint">Mestre · ou jogador na vez</span>
      ) : roomId === "demo" ? (
        <span className="vtt-end-turn-hint">Demo — avança o combate para todos</span>
      ) : (
        <span className="vtt-end-turn-hint">Encerra sua vez</span>
      )}
      {err ? <p className="dice-err vtt-end-turn-err">{err}</p> : null}
    </div>
  );
}
