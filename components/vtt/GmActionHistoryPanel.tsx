"use client";

import { useMemo, useState } from "react";
import type { CombatUndoKind } from "@/lib/room/combat-undo";
import type { CombatUndoEntry, RoomSnapshot } from "@/lib/room/types";
import { postGmCombatAction } from "@/hooks/useRoomSync";

type Props = {
  roomId: string;
  combatUndo?: CombatUndoEntry[];
  onUpdated: (snapshot: RoomSnapshot) => void;
};

const KIND_LABEL: Record<CombatUndoKind, string> = {
  move: "Movimento",
  attack: "Ataque",
  ability: "Habilidade",
  area: "Área",
};

function formatTime(at: number): string {
  return new Date(at).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function GmActionHistoryPanel({ roomId, combatUndo = [], onUpdated }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const entries = useMemo(
    () => [...combatUndo].sort((a, b) => b.at - a.at),
    [combatUndo]
  );

  async function revertTo(undoId: string) {
    if (busyId) return;
    setBusyId(undoId);
    setMsg(null);
    try {
      const snap = await postGmCombatAction(roomId, { action: "revert", undoId });
      onUpdated(snap);
      setMsg("Estado restaurado.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Falha ao reverter");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="vtt-panel vtt-gm-history">
      <p className="vtt-eyebrow">Histórico de ações</p>
      <p className="vtt-hint">
        Movimentos e ações de personagens e NPCs. Reverter até um ponto desfaz{" "}
        <strong>todas</strong> as jogadas posteriores. Nova iniciativa limpa o histórico.
      </p>

      {entries.length === 0 ? (
        <p className="vtt-hint">Nenhuma ação registrada nesta rodada.</p>
      ) : (
        <ol className="vtt-gm-history-list" aria-label="Histórico de combate">
          {entries.map((entry) => (
            <li key={entry.id} className="vtt-gm-history-item">
              <div className="vtt-gm-history-main">
                <span className={`vtt-gm-history-kind vtt-gm-history-kind--${entry.kind}`}>
                  {KIND_LABEL[entry.kind]}
                </span>
                <span className="vtt-gm-history-token">{entry.tokenName}</span>
                <time className="vtt-gm-history-time" dateTime={new Date(entry.at).toISOString()}>
                  {formatTime(entry.at)}
                </time>
              </div>
              <p className="vtt-gm-history-summary">{entry.summary}</p>
              <button
                type="button"
                className="btn btn-secondary vtt-gm-history-revert"
                disabled={busyId != null}
                title={`Restaurar o mapa ao estado antes de: ${entry.summary}`}
                onClick={() => void revertTo(entry.id)}
              >
                {busyId === entry.id ? "Revertendo…" : "↩ Reverter até aqui"}
              </button>
            </li>
          ))}
        </ol>
      )}

      {msg ? <p className="vtt-hint">{msg}</p> : null}
    </section>
  );
}
