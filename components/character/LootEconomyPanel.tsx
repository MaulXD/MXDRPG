"use client";

import { useCallback, useEffect, useState } from "react";
import type { LootEconomy } from "@/lib/character/types";
import { LOOT_NAMES } from "@/lib/character/loot-catalog";
import { EMPTY_LOOT, loadLoot, saveLoot } from "@/lib/character/loot-storage";

type StackKind = "especiarias" | "minerios" | "tesouros";

const KIND_LABEL: Record<StackKind, string> = {
  especiarias: "Especiarias",
  minerios: "Minérios",
  tesouros: "Tesouros",
};

type Props = {
  characterId: string;
  seed?: LootEconomy;
  canEdit: boolean;
};

function bumpStack(
  loot: LootEconomy,
  kind: StackKind,
  id: string,
  delta: number
): LootEconomy {
  const stacks = { ...loot[kind] };
  const next = (stacks[id] ?? 0) + delta;
  if (next <= 0) delete stacks[id];
  else stacks[id] = next;
  return { ...loot, [kind]: stacks };
}

function StackSection({
  kind,
  loot,
  canEdit,
  onChange,
}: {
  kind: StackKind;
  loot: LootEconomy;
  canEdit: boolean;
  onChange: (next: LootEconomy) => void;
}) {
  const entries = Object.entries(loot[kind]).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="loot-section">
      <h4>{KIND_LABEL[kind]}</h4>
      {entries.length === 0 ? (
        <p className="loot-empty">Nenhum item.</p>
      ) : (
        <ul className="loot-list">
          {entries.map(([id, qty]) => (
            <li key={id} className="loot-row">
              <span className="loot-id">{id}</span>
              <span className="loot-name">{LOOT_NAMES[id] ?? id}</span>
              <span className="loot-qty">×{qty}</span>
              {canEdit ? (
                <span className="loot-actions">
                  <button type="button" className="btn btn-ghost loot-btn" onClick={() => onChange(bumpStack(loot, kind, id, -1))}>
                    −
                  </button>
                  <button type="button" className="btn btn-ghost loot-btn" onClick={() => onChange(bumpStack(loot, kind, id, 1))}>
                    +
                  </button>
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {canEdit ? (
        <AddStackRow
          prefix={kind === "especiarias" ? "ESP" : kind === "minerios" ? "MIN" : "TES"}
          onAdd={(id) => onChange(bumpStack(loot, kind, id, 1))}
        />
      ) : null}
    </div>
  );
}

function AddStackRow({ prefix, onAdd }: { prefix: string; onAdd: (id: string) => void }) {
  const [num, setNum] = useState("01");

  const add = () => {
    const n = num.padStart(2, "0").slice(-2);
    const id = `${prefix}-${n}`;
    if (LOOT_NAMES[id]) onAdd(id);
  };

  return (
    <div className="loot-add">
      <label>
        {prefix}-
        <input
          type="text"
          inputMode="numeric"
          maxLength={2}
          value={num}
          onChange={(e) => setNum(e.target.value.replace(/\D/g, "").slice(0, 2))}
          className="loot-add-input"
        />
      </label>
      <button type="button" className="btn btn-ghost" onClick={add}>
        + Adicionar
      </button>
    </div>
  );
}

export function LootEconomyPanel({ characterId, seed, canEdit }: Props) {
  const initial = seed ?? EMPTY_LOOT;
  const [loot, setLoot] = useState<LootEconomy>(initial);

  useEffect(() => {
    setLoot(loadLoot(characterId, initial));
  }, [characterId, initial]);

  const persist = useCallback(
    (next: LootEconomy) => {
      setLoot(next);
      saveLoot(characterId, next);
    },
    [characterId]
  );

  const setPo = (po: number) => persist({ ...loot, po: Math.max(0, Math.floor(po)) });

  return (
    <div className="loot-panel">
      <div className="loot-po">
        <label htmlFor="loot-po">Pecas de ouro (po)</label>
        {canEdit ? (
          <input
            id="loot-po"
            type="number"
            min={0}
            step={1}
            value={loot.po}
            onChange={(e) => setPo(Number(e.target.value) || 0)}
            className="loot-po-input"
          />
        ) : (
          <strong>{loot.po}</strong>
        )}
      </div>
      <p className="loot-hint">
        Trinchar, forrageio e OBJ-R — catálogo Cap. 5.6
      </p>
      <StackSection kind="especiarias" loot={loot} canEdit={canEdit} onChange={persist} />
      <StackSection kind="minerios" loot={loot} canEdit={canEdit} onChange={persist} />
      <StackSection kind="tesouros" loot={loot} canEdit={canEdit} onChange={persist} />
    </div>
  );
}
