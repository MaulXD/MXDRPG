"use client";

import type { CombatTrack } from "@/lib/room/combat";
import { activeTokenId, normalizeCombatTrack } from "@/lib/room/combat";
import { resolveLivingActiveTokenId } from "@/lib/room/combat-order";
import type { RoomSnapshot } from "@/lib/room/types";
import type { BattleToken } from "@/lib/vtt/types";
import { usePassTurn } from "@/hooks/vtt/usePassTurn";
import type { RoomApiPayload } from "@/hooks/useRoomSync";
import { useEndTurnConfirm } from "@/hooks/vtt/useEndTurnConfirm";
import { EndTurnConfirmDialog } from "@/components/vtt/EndTurnConfirmDialog";

type Props = {
  roomId: string;
  snapshot: RoomSnapshot | null | undefined;
  combat: CombatTrack;
  tokens: BattleToken[];
  canEndTurn: boolean;
  isGm?: boolean;
  onApplySnapshot: (payload: RoomApiPayload, opts?: { force?: boolean; immediate?: boolean }) => void;
};

export function EndTurnBar({
  roomId,
  snapshot,
  combat,
  tokens,
  canEndTurn,
  isGm = false,
  onApplySnapshot,
}: Props) {
  const { passTurn, busy, err } = usePassTurn(roomId, snapshot, onApplySnapshot);
  const track = normalizeCombatTrack(combat, tokens);
  const activeId = resolveLivingActiveTokenId(track, tokens) ?? activeTokenId(track);
  const activeToken = tokens.find((t) => t.id === activeId);
  const hasOrder = track.order.length > 0;

  const { requestEndTurn, dialog } = useEndTurnConfirm({
    passTurn,
    busy,
    snapshot,
    activeToken,
    round: track.round,
  });

  if (!canEndTurn || !hasOrder) return null;

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
        onClick={requestEndTurn}
      >
        {busy ? "Passando…" : "Passar turno"}
      </button>
      <EndTurnConfirmDialog {...dialog} />
      {isGm ? (
        <span className="vtt-end-turn-hint">Mestre · ou jogador na vez</span>
      ) : (
        <span className="vtt-end-turn-hint">Encerra sua vez</span>
      )}
      {err ? <p className="dice-err vtt-end-turn-err">{err}</p> : null}
    </div>
  );
}
