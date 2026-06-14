"use client";

import { useMemo, useState } from "react";
import type { CharacterSheet, InventoryItem } from "@/lib/character/types";
import type { CompendiumEntry } from "@/lib/compendium/types";
import {
  countPreparedLeveled,
  isCantrip,
  isCasterClass,
  maxPreparedSpells,
  spellInClassList,
  spellLevelLabel,
  spellMeta,
  togglePreparedSpell,
  classSpellPrepMode,
} from "@/lib/character/spell-prep";
import {
  classSpellAccess,
  sharedSpellPools,
  spellListsForClass,
} from "@/lib/character/spell-lists";
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

  const classe = actor.identity.classe;
  const limit = maxPreparedSpells(actor);
  const showLimit = isCasterClass(classe);
  const prepared = actor.preparedSpellIds ?? [];
  const preparedLeveled = countPreparedLeveled(actor);
  const prepMode = classSpellPrepMode(classe);
  const access = classSpellAccess(classe);
  const listLabels = spellListsForClass(classe).map((l) => l.label);

  const eligibleSpells = useMemo(
    () => spells.filter(({ entry }) => spellInClassList(classe, entry.id)),
    [spells, classe]
  );

  const sharedPools = useMemo(() => {
    const pools = sharedSpellPools();
    return Object.values(pools).filter((pool) =>
      pool.entryIds.some((id) => eligibleSpells.some((s) => s.entry.id === id))
    );
  }, [eligibleSpells]);

  const grouped = useMemo(() => {
    const map = new Map<number, Array<{ ref: InventoryItem; entry: CompendiumEntry }>>();
    for (const row of eligibleSpells) {
      const lv = spellMeta(row.entry.id).level;
      const list = map.get(lv) ?? [];
      list.push(row);
      map.set(lv, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.entry.name.localeCompare(b.entry.name, "pt-BR"));
    }
    return [...map.entries()].sort(([a], [b]) => a - b);
  }, [eligibleSpells]);

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

  const modeHint =
    prepMode === "prepare"
      ? "Marque as magias preparadas para o dia."
      : prepMode === "known"
        ? "Magias conhecidas — truques sempre disponíveis."
        : prepMode === "learn"
          ? "Grimório — escolha o que preparar entre as magias aprendidas."
          : null;

  return (
    <div className="spell-prep">
      <p className="spell-prep__hint">
        {modeHint ?? "Magias da classe."} Truques ficam sempre disponíveis. Na mesa, ao conjurar,
        escolha na lista preparada.
      </p>
      {listLabels.length > 0 ? (
        <p className="spell-prep__hint">
          Listas: <strong>{listLabels.join(" · ")}</strong>
        </p>
      ) : null}
      {sharedPools.length > 0 ? (
        <p className="spell-prep__hint">
          Compartilhadas:{" "}
          {sharedPools.map((p) => (
            <span key={p.label}>
              <strong>{p.label}</strong>
              {p.description ? ` — ${p.description}` : null}
              {" · "}
            </span>
          ))}
        </p>
      ) : null}
      {showLimit ? (
        <p className="spell-prep__count">
          {access?.mode === "known" ? "Conhecidas" : "Preparadas"}:{" "}
          <strong>{preparedLeveled}</strong> / {limit}
          {prepared.length === 0 && access?.mode !== "known"
            ? " · nenhuma marcada = todas elegíveis disponíveis"
            : null}
        </p>
      ) : null}
      {err ? <p className="dice-err">{err}</p> : null}

      {grouped.length === 0 ? (
        <p className="spell-prep__hint">Nenhuma magia elegível no inventário para esta classe.</p>
      ) : null}

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
                      disabled={!canEdit || busy || cantrip || prepMode === "known"}
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
