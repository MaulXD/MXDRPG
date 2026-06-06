"use client";

import { useMemo, useRef, useState } from "react";
import type { Axial } from "@/lib/vtt/hex-math";
import type { RoomSnapshot } from "@/lib/room/types";
import { listMonsterTemplates, scaleMonsterTemplate } from "@/lib/vtt/monsters";
import { CREATURE_SIZE_HEX_LABEL, CREATURE_SIZE_PT } from "@/lib/vtt/monster-sizes";
import type { MonsterSpawnVariant } from "@/lib/vtt/monster-scaling";
import { clearActiveSpawnDragPayload, writeMonsterSpawnDrag } from "@/lib/vtt/spawn-drag";
import { CompendiumIcon } from "@/components/compendium/CompendiumIcon";
import { compendiumTypeColor } from "@/lib/compendium/icons";
import { spawnRoomMonster } from "@/hooks/useRoomSync";

type Props = {
  roomId: string;
  spawnAxial: Axial | null;
  onSpawned: (snapshot: RoomSnapshot) => void;
};

const VARIANT_LABEL: Record<MonsterSpawnVariant, string> = {
  normal: "Padrão",
  elite: "Elite (+HP/PA/ameaça)",
  colossal: "Colossal (×2 HP, +PA)",
};

export function MonsterSpawnPanel({ roomId, spawnAxial, onSpawned }: Props) {
  const monsters = listMonsterTemplates();
  const [entryId, setEntryId] = useState(monsters[0]?.entryId ?? "");
  const [variant, setVariant] = useState<MonsterSpawnVariant>("normal");
  const [groupLevelDelta, setGroupLevelDelta] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const dragGhostRef = useRef<HTMLElement | null>(null);

  const spawnOpts = useMemo(
    () => ({
      variant,
      groupLevelDelta: groupLevelDelta || undefined,
    }),
    [variant, groupLevelDelta]
  );

  const preview = useMemo(() => {
    const base = monsters.find((m) => m.entryId === entryId);
    if (!base) return null;
    return scaleMonsterTemplate(base, { variant, groupLevelDelta });
  }, [monsters, entryId, variant, groupLevelDelta]);

  async function spawnAt(axial: Axial, monsterId: string) {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const snapshot = await spawnRoomMonster(roomId, monsterId, axial.q, axial.r, spawnOpts);
      const placed = snapshot.scene.tokens[snapshot.scene.tokens.length - 1];
      setMsg(`${placed?.name ?? "Monstro"} colocado na mesa.`);
      onSpawned(snapshot);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Falha ao invocar");
    } finally {
      setBusy(false);
    }
  }

  async function spawn() {
    if (!spawnAxial || !entryId) return;
    await spawnAt(spawnAxial, entryId);
  }

  function onDragStart(entry: string, name: string, e: React.DragEvent) {
    e.stopPropagation();
    writeMonsterSpawnDrag(e.dataTransfer, {
      entryId: entry,
      variant,
      groupLevelDelta,
    });
    dragGhostRef.current?.remove();
    const ghost = buildDragGhost(name);
    dragGhostRef.current = ghost;
    e.dataTransfer.setDragImage(ghost, 28, 18);
  }

  function onDragEnd() {
    dragGhostRef.current?.remove();
    dragGhostRef.current = null;
    clearActiveSpawnDragPayload();
  }

  const selected = monsters.find((m) => m.entryId === entryId);

  return (
    <div className="vtt-spawn-panel">
      <p className="vtt-eyebrow">Invocar monstro</p>
      <p className="vtt-combat-hint vtt-spawn-drag-hint">
        Arraste um monstro da lista para o tabuleiro (solte no hex). O token aparece como o Goblin —
        com nome, vida, PA e ações do compêndio.
      </p>

      <label className="vtt-combat-select">
        Variante (Cap. XII)
        <select value={variant} onChange={(e) => setVariant(e.target.value as MonsterSpawnVariant)}>
          {(Object.keys(VARIANT_LABEL) as MonsterSpawnVariant[]).map((v) => (
            <option key={v} value={v}>
              {VARIANT_LABEL[v]}
            </option>
          ))}
        </select>
      </label>

      <label className="vtt-combat-select">
        Ajuste ameaça do grupo
        <select
          value={groupLevelDelta}
          onChange={(e) => setGroupLevelDelta(Number(e.target.value))}
        >
          {[0, 1, 2, 3].map((n) => (
            <option key={n} value={n}>
              {n === 0 ? "Sem ajuste" : `+${n} ameaça (escala HP/PA)`}
            </option>
          ))}
        </select>
      </label>

      <p className="vtt-eyebrow" style={{ marginTop: "0.5rem" }}>
        Bestiário — arrastar
      </p>
      <ul className="vtt-spawn-drag-list" role="list">
        {monsters.map((m) => (
          <li key={m.entryId}>
            <div
              role="button"
              tabIndex={0}
              draggable
              className={`vtt-spawn-drag-card ${entryId === m.entryId ? "vtt-spawn-drag-card--active" : ""}`}
              onClick={() => setEntryId(m.entryId)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setEntryId(m.entryId);
                }
              }}
              onDragStart={(e) => onDragStart(m.entryId, m.name, e)}
              onDragEnd={onDragEnd}
              title={`Arrastar ${m.name} para o mapa`}
            >
              <span className="vtt-spawn-drag-grip" aria-hidden>
                ⠿
              </span>
              <CompendiumIcon
                entry={{ id: m.entryId, name: m.name, type: "npc", system: {} }}
                color={compendiumTypeColor("npc")}
                className="vtt-spawn-drag-avatar inv-icon"
              />
              <span className="vtt-spawn-drag-card-body">
                <strong>{m.name}</strong>
                <span>
                  nv{m.ameaca} · {CREATURE_SIZE_PT[m.creatureSize]} ({CREATURE_SIZE_HEX_LABEL[m.creatureSize]}) · CA{" "}
                  {m.defesa} · {m.vidaMax} HP
                </span>
              </span>
            </div>
          </li>
        ))}
      </ul>

      <label className="vtt-combat-select">
        Seleção rápida
        <select value={entryId} onChange={(e) => setEntryId(e.target.value)}>
          {monsters.map((m) => (
            <option key={m.entryId} value={m.entryId}>
              {m.name} · nv{m.ameaca}
            </option>
          ))}
        </select>
      </label>

      {selected && preview ? (
        <p className="vtt-spawn-meta">
          Preview: {preview.name} · {CREATURE_SIZE_PT[preview.creatureSize]} ({CREATURE_SIZE_HEX_LABEL[preview.creatureSize]}) · ameaça{" "}
          {preview.ameaca} · {preview.vidaMax} HP · PA {preview.paMax} · CA {preview.defesa}
        </p>
      ) : null}

      <p className="vtt-combat-hint">
        {spawnAxial
          ? `Hex alvo: q${spawnAxial.q}, r${spawnAxial.r}`
          : "Passe o mouse no mapa ou solte o monstro em um hex."}
      </p>

      <button type="button" className="btn" disabled={busy || !spawnAxial} onClick={spawn}>
        {busy ? "Invocando…" : "Colocar na mesa"}
      </button>

      {msg ? <p className="sheet-inline-msg">{msg}</p> : null}
    </div>
  );
}

function buildDragGhost(label: string): HTMLElement {
  const el = document.createElement("div");
  el.className = "vtt-spawn-drag-ghost";
  el.textContent = label;
  el.style.position = "fixed";
  el.style.left = "-9999px";
  el.style.top = "0";
  document.body.appendChild(el);
  return el;
}
