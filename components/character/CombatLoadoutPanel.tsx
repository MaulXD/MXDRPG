"use client";

import { useMemo, useState } from "react";
import type { CharacterSheet } from "@/lib/character/types";
import { listCombatActions } from "@/lib/combat/attack";
import type { CombatLoadout } from "@/lib/combat/types";
import { patchRoomActor } from "@/hooks/useRoomSync";

type Props = {
  actor: CharacterSheet;
  roomId: string;
  canEdit: boolean;
  onSaved: () => void;
};

export function CombatLoadoutPanel({ actor, roomId, canEdit, onSaved }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const actions = useMemo(() => listCombatActions(actor), [actor]);
  const weapons = actions.filter((a) => a.kind === "weapon" || a.kind === "unarmed");
  const spells = actions.filter((a) => a.kind === "spell");

  const loadout = actor.combatLoadout;
  const currentKey = loadout ? `${loadout.packId}:${loadout.entryId}` : "";

  async function pick(packId: CombatLoadout["packId"], entryId: string) {
    if (!canEdit || busy) return;
    setBusy(true);
    setErr(null);
    try {
      await patchRoomActor(roomId, actor.id, { combatLoadout: { packId, entryId } });
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Não foi possível salvar o loadout.");
    } finally {
      setBusy(false);
    }
  }

  if (!weapons.length && !spells.length) {
    return (
      <p className="sheet-track-empty">
        Adicione armas ou magias ao inventário para definir loadout de combate.
      </p>
    );
  }

  return (
    <div className="sheet-loadout">
      <p className="eyebrow">Loadout de combate</p>
      <label className="vtt-combat-select">
        Ação padrão na mesa
        <select
          value={currentKey}
          disabled={!canEdit || busy}
          onChange={(e) => {
            const [packId, entryId] = e.target.value.split(":");
            if (packId === "armas" || packId === "magias" || packId === "habilidades") {
              void pick(packId, entryId);
            }
          }}
        >
          <option value="">— automático —</option>
          {weapons.map((w) => (
            <option key={`${w.packId}:${w.entryId}`} value={`${w.packId}:${w.entryId}`}>
              {w.name}
            </option>
          ))}
          {spells.map((s) => (
            <option key={`${s.packId}:${s.entryId}`} value={`${s.packId}:${s.entryId}`}>
              {s.name} (magia)
            </option>
          ))}
        </select>
      </label>
      {err ? <p className="dice-err">{err}</p> : null}
    </div>
  );
}
