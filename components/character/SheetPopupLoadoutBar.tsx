"use client";

import { useMemo, useState } from "react";
import { IconArmor, IconSword } from "@/components/character/SheetPopupIcons";
import { getEntry } from "@/lib/compendium/registry";
import { isArmorEntry } from "@/lib/character/armor-defense";
import { listCombatActions } from "@/lib/combat/attack";
import type { CharacterSheet, InventoryItem } from "@/lib/character/types";
import type { CompendiumEntry } from "@/lib/compendium/types";
import { patchRoomActor } from "@/hooks/useRoomSync";

type Props = {
  actor: CharacterSheet;
  inventory: InventoryItem[];
  roomId: string;
  canEdit: boolean;
  onSaved: () => void;
};

function resolveInventory(
  inventory: InventoryItem[]
): Array<{ ref: InventoryItem; entry: CompendiumEntry }> {
  return inventory
    .map((ref) => {
      const entry = getEntry(ref.packId, ref.entryId);
      if (!entry) return null;
      return { ref, entry };
    })
    .filter(Boolean) as Array<{ ref: InventoryItem; entry: CompendiumEntry }>;
}

export function SheetPopupLoadoutBar({ actor, inventory, roomId, canEdit, onSaved }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const resolved = useMemo(() => resolveInventory(inventory), [inventory]);
  const weapons = useMemo(() => {
    const fromInv = resolved.filter((r) => r.entry.type === "arma");
    const actions = listCombatActions(actor).filter((a) => a.kind === "weapon" || a.kind === "unarmed");
    const seen = new Set<string>();
    const out: Array<{ key: string; label: string }> = [];
    for (const a of actions) {
      const key = `${a.packId}:${a.entryId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ key, label: a.name });
    }
    for (const r of fromInv) {
      const key = `${r.entry.packId}:${r.entry.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ key, label: r.entry.name });
    }
    return out;
  }, [actor, resolved]);

  const armors = useMemo(
    () =>
      resolved
        .filter((r) => r.entry.packId === "equipamentos" && isArmorEntry(r.entry))
        .map((r) => ({ key: r.entry.id, label: r.entry.name })),
    [resolved]
  );

  const weaponKey = actor.combatLoadout
    ? `${actor.combatLoadout.packId}:${actor.combatLoadout.entryId}`
    : "";
  const armorKey = actor.armorLoadout?.entryId ?? "";

  async function save(patch: Parameters<typeof patchRoomActor>[2]) {
    if (!canEdit || busy) return;
    setBusy(true);
    setErr(null);
    try {
      await patchRoomActor(roomId, actor.id, patch);
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Não foi possível salvar equipamento.");
    } finally {
      setBusy(false);
    }
  }

  if (!weapons.length && !armors.length) {
    return (
      <section className="sheet-popup-loadout sheet-popup-loadout--empty">
        <p>Adicione armas e armaduras ao inventário para equipar na mesa.</p>
      </section>
    );
  }

  return (
    <section className="sheet-popup-loadout" aria-label="Equipamento ativo">
      <p className="sheet-popup-loadout__eyebrow">Em uso na mesa</p>
      <div className="sheet-popup-loadout__grid">
        <label className="sheet-popup-loadout__field">
          <span className="sheet-popup-loadout__label">
            <IconSword size={15} />
            Arma / ação
          </span>
          <select
            value={weaponKey}
            disabled={!canEdit || busy || !weapons.length}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) {
                void save({ combatLoadout: null });
                return;
              }
              const [packId, entryId] = v.split(":");
              if (packId === "armas" || packId === "magias" || packId === "habilidades") {
                void save({ combatLoadout: { packId, entryId } });
              }
            }}
          >
            <option value="">— automático —</option>
            {weapons.map((w) => (
              <option key={w.key} value={w.key}>
                {w.label}
              </option>
            ))}
          </select>
        </label>

        <label className="sheet-popup-loadout__field">
          <span className="sheet-popup-loadout__label">
            <IconArmor size={15} />
            Armadura
          </span>
          <select
            value={armorKey}
            disabled={!canEdit || busy || !armors.length}
            onChange={(e) => {
              const entryId = e.target.value;
              if (!entryId) {
                void save({ armorLoadout: null });
                return;
              }
              void save({ armorLoadout: { packId: "equipamentos", entryId } });
            }}
          >
            <option value="">Sem armadura (10 + DES)</option>
            {armors.map((a) => (
              <option key={a.key} value={a.key}>
                {a.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {err ? <p className="sheet-popup-loadout__err">{err}</p> : null}
    </section>
  );
}
