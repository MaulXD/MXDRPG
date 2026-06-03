"use client";

import { useMemo, useState } from "react";
import type { Axial } from "@/lib/vtt/hex-math";
import { listMonsterTemplates, scaleMonsterTemplate } from "@/lib/vtt/monsters";
import type { MonsterSpawnVariant } from "@/lib/vtt/monster-scaling";
import { spawnRoomMonster } from "@/hooks/useRoomSync";

type Props = {
  roomId: string;
  spawnAxial: Axial | null;
  onSpawned: () => void;
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

  const preview = useMemo(() => {
    const base = monsters.find((m) => m.entryId === entryId);
    if (!base) return null;
    return scaleMonsterTemplate(base, { variant, groupLevelDelta });
  }, [monsters, entryId, variant, groupLevelDelta]);

  async function spawn() {
    if (!spawnAxial || !entryId || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      await spawnRoomMonster(roomId, entryId, spawnAxial.q, spawnAxial.r, {
        variant,
        groupLevelDelta: groupLevelDelta || undefined,
      });
      setMsg("Monstro colocado na mesa.");
      onSpawned();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Falha ao invocar");
    } finally {
      setBusy(false);
    }
  }

  const selected = monsters.find((m) => m.entryId === entryId);

  return (
    <div className="vtt-spawn-panel">
      <p className="vtt-eyebrow">Invocar monstro</p>
      <label className="vtt-combat-select">
        Bestiário
        <select value={entryId} onChange={(e) => setEntryId(e.target.value)}>
          {monsters.map((m) => (
            <option key={m.entryId} value={m.entryId}>
              {m.name} · nv{m.ameaca} · {m.tier} · CA {m.defesa} · {m.vidaMax} HP
            </option>
          ))}
        </select>
      </label>

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

      {selected && preview ? (
        <p className="vtt-spawn-meta">
          Preview: {preview.name} · ameaça {preview.ameaca} · {preview.vidaMax} HP · PA{" "}
          {preview.paMax} · CA {preview.defesa}
        </p>
      ) : null}

      <p className="vtt-combat-hint">
        {spawnAxial
          ? `Hex alvo: q${spawnAxial.q}, r${spawnAxial.r} — passe o mouse no mapa ou confirme aqui.`
          : "Passe o mouse no mapa para escolher o hex."}
      </p>

      <button type="button" className="btn" disabled={busy || !spawnAxial} onClick={spawn}>
        {busy ? "Invocando…" : "Colocar na mesa"}
      </button>

      {msg ? <p className="sheet-inline-msg">{msg}</p> : null}
    </div>
  );
}
