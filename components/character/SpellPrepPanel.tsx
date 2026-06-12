"use client";

import { useMemo, useState } from "react";
import type { CharacterSheet, InventoryItem } from "@/lib/character/types";
import type { CompendiumEntry } from "@/lib/compendium/types";
import {
  countPreparedLeveled,
  isCantrip,
  isCasterClass,
  maxPreparedSpells,
  spellLevelLabel,
  spellMeta,
  togglePreparedSpell,
} from "@/lib/character/spell-prep";
import { patchRoomActor } from "@/hooks/useRoomSync";

type Props = {
  actor: CharacterSheet;
  spells: Array<{ ref: InventoryItem; entry: CompendiumEntry }>;
  canEdit: boolean;
  roomId?: string;
  onSaved: () => void;
  onPersistLocal?: (preparedSpellIds: string[]) => void;
};

export function SpellPrepPanel({
  actor,
  spells,
  canEdit,
  roomId,
  onSaved,
  onPersistLocal,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const limit = maxPreparedSpells(actor);
  const showLimit = isCasterClass(actor.identity.classe);
  const prepared = actor.preparedSpellIds ?? [];
  const preparedLeveled = countPreparedLeveled(actor);

  const grouped = useMemo(() => {
    const map = new Map<number, Array<{ ref: InventoryItem; entry: CompendiumEntry }>>();
    for (const row of spells) {
      const lv = spellMeta(row.entry.id).level;
      const list = map.get(lv) ?? [];
      list.push(row);
      map.set(lv, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.entry.name.localeCompare(b.entry.name, "pt-BR"));
    }
    return [...map.entries()].sort(([a], [b]) => a - b);
  }, [spells]);

  async function setPrepared(entryId: string, on: boolean) {
    if (!canEdit || busy) return;
    setErr(null);
    let next: string[];
    try {
      next = togglePreparedSpell(actor, entryId, on);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Não foi possível preparar");
      return;
    }
    setBusy(true);
    try {
      if (onPersistLocal) {
        onPersistLocal(next);
      } else if (roomId) {
        await patchRoomActor(roomId, actor.id, { preparedSpellIds: next });
      }
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha ao salvar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="spell-prep">
      <p className="spell-prep__hint">
        Estilo D&amp;D: marque as magias <strong>preparadas</strong> para o dia. Truques ficam sempre
        disponíveis. Na mesa, ao conjurar, você escolhe na lista (não usa mais só a primeira do inventário).
      </p>
      {showLimit ? (
        <p className="spell-prep__count">
          Preparadas: <strong>{preparedLeveled}</strong> / {limit}
          {prepared.length === 0 ? " · nenhuma marcada = todas do grimório disponíveis" : null}
        </p>
      ) : null}
      {err ? <p className="dice-err">{err}</p> : null}

      {grouped.map(([level, rows]) => (
        <section key={level} className="spell-prep__level">
          <h3 className="spell-prep__level-title">{spellLevelLabel(level)}</h3>
          <ul className="spell-prep__list">
            {rows.map(({ ref, entry }) => {
              const meta = spellMeta(entry.id);
              const cantrip = isCantrip(entry.id);
              const isOn = cantrip || prepared.includes(entry.id);
              return (
                <li key={ref.instanceId} className="spell-prep__row">
                  <label className="spell-prep__label">
                    <input
                      type="checkbox"
                      checked={isOn}
                      disabled={!canEdit || busy || cantrip}
                      onChange={(e) => void setPrepared(entry.id, e.target.checked)}
                    />
                    <span>
                      <strong>{entry.name}</strong>
                      {meta.school ? (
                        <span className="spell-prep__school"> · {meta.school}</span>
                      ) : null}
                      {cantrip ? <span className="spell-prep__tag"> truque</span> : null}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
