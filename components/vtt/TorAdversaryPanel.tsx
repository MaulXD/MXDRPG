"use client";

import { useMemo, useRef, useState } from "react";
import { TOR_ADVERSARIES } from "@/lib/character/um-anel/adversaries";
import type { Axial } from "@/lib/vtt/grid-math";
import type { RoomSnapshot } from "@/lib/room/types";
import { spawnRoomTorAdversary } from "@/hooks/useRoomSync";
import { endTorAdversarySpawnDrag, startTorAdversarySpawnDrag } from "@/lib/vtt/tor-spawn-drag-ui";
import "@/components/compendium/compendium.css";
import "@/components/compendium/tor-compendium.css";

type Props = {
  roomId: string;
  spawnAxial: Axial | null;
  onPlaced: (snapshot: RoomSnapshot) => void;
};

const TIER_LABEL: Record<string, string> = {
  mob: "Bando",
  elite: "Elite",
  boss: "Chefe",
};

/** Bestiário próprio do Um Anel — nunca importa lib/vtt/monsters (bestiário Eldarin). */
export function TorAdversaryPanel({ roomId, spawnAxial, onPlaced }: Props) {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const dragGhostRef = useRef<HTMLElement | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TOR_ADVERSARIES;
    return TOR_ADVERSARIES.filter(
      (a) => a.name.toLowerCase().includes(q) || a.traits?.toLowerCase().includes(q)
    );
  }, [query]);

  async function invoke(adversaryId: string) {
    if (!spawnAxial || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const snapshot = await spawnRoomTorAdversary(roomId, adversaryId, spawnAxial.q, spawnAxial.r);
      const placed = snapshot.scene.tokens[snapshot.scene.tokens.length - 1];
      setMsg(`${placed?.name ?? "Adversário"} colocado na mesa.`);
      onPlaced(snapshot);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Falha ao invocar adversário");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="vtt-playable-panel">
      <p className="vtt-combat-hint vtt-playable-panel__lead">
        Bestiário do Um Anel — escolha um adversário e clique em Invocar pra colocar na célula alvo.
      </p>
      <p className="vtt-combat-hint">
        {spawnAxial ? `Célula alvo: q${spawnAxial.q}, r${spawnAxial.r}` : "Passe o mouse no mapa pra escolher a célula."}
      </p>
      <input
        type="search"
        className="comp-search"
        placeholder="Buscar por nome ou traço…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ margin: "0.5rem 0" }}
      />
      {msg ? <p className="sheet-inline-msg">{msg}</p> : null}
      {filtered.length === 0 ? (
        <p className="vtt-combat-hint">Nenhum adversário encontrado.</p>
      ) : (
        <ul className="vtt-playable-list" role="list">
          {filtered.map((a) => (
            <li key={a.id}>
              <div
                className="vtt-playable-card vtt-playable-card--draggable"
                draggable={!busy}
                title="Arraste pro mapa, ou use o botão Invocar"
                onDragStart={(e) => {
                  if (busy) {
                    e.preventDefault();
                    return;
                  }
                  startTorAdversarySpawnDrag(e, a.id, a.name, dragGhostRef);
                }}
                onDragEnd={() => endTorAdversarySpawnDrag(dragGhostRef)}
              >
                <div className="vtt-playable-card__main">
                  <div className="vtt-playable-card__body">
                    <div className="vtt-playable-card__head">
                      <strong>{a.name}</strong>
                      <span className="tor-compendium__tier">{TIER_LABEL[a.tier] ?? a.tier}</span>
                    </div>
                    {a.traits ? <span className="vtt-playable-card__meta">{a.traits}</span> : null}
                    <span className="vtt-playable-card__meta">
                      Resistência {a.endurance} · Bloqueio {a.parry || "—"} · Proteção {a.armour}d
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost vtt-spawn-sheet-btn"
                disabled={busy || !spawnAxial}
                onClick={() => void invoke(a.id)}
              >
                Invocar
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
