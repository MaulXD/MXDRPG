"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { CharacterSheet as CharacterSheetData, InventoryItem } from "@/lib/character/types";
import { formatXpProgress } from "@/lib/character/xp";
import { loadInventory, newInstanceId, saveInventory } from "@/lib/character/inventory-storage";
import type { CompendiumEntry, CompendiumPackId } from "@/lib/compendium/types";
import { entrySummary } from "@/lib/compendium/format";
import { getEntry } from "@/lib/compendium/registry";
import { useRoomSync } from "@/hooks/useRoomSync";
import { PortraitFields } from "@/components/character/PortraitFields";
import {
  CharacterIdentityEditor,
  CharacterStatsGrid,
} from "@/components/character/CharacterIdentityEditor";
import { LevelUpWizard } from "@/components/character/LevelUpWizard";
import { SubclassTrackPanel } from "@/components/character/SubclassTrackPanel";
import { CombatLoadoutPanel } from "@/components/character/CombatLoadoutPanel";
import { proficiencyBonus } from "@/lib/character/rules";
import "./sheet.css";

type Tab = "inventario" | "habilidades" | "magias";

type Props = {
  character: CharacterSheetData;
  canEdit: boolean;
  compendium: Record<CompendiumPackId, CompendiumEntry[]>;
  roomId?: string;
  embedded?: boolean;
};

const PLAYER_PACKS: CompendiumPackId[] = ["armas", "habilidades", "magias", "equipamentos"];

const TYPE_COLOR: Record<string, string> = {
  arma: "#ffc14d",
  habilidade: "#b8ff3c",
  magia: "#8b5cf6",
  equipamento: "#94a3be",
};

export function CharacterSheet({
  character,
  canEdit,
  compendium,
  roomId = "demo",
  embedded = false,
}: Props) {
  const [tab, setTab] = useState<Tab>("inventario");
  const [inventory, setInventory] = useState<InventoryItem[]>(character.inventory);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPack, setPickerPack] = useState<CompendiumPackId>("armas");

  const { snapshot, refresh } = useRoomSync(roomId);
  const live = snapshot?.actors[character.id] ?? character;
  const inRoom = Boolean(snapshot?.actors[character.id]);

  useEffect(() => {
    setInventory(loadInventory(character.id, character.inventory));
  }, [character.id, character.inventory]);

  const persist = useCallback(
    (items: InventoryItem[]) => {
      setInventory(items);
      saveInventory(character.id, items);
    },
    [character.id]
  );

  const resolved = useMemo(() => {
    return inventory
      .map((ref) => {
        const entry = getEntry(ref.packId, ref.entryId);
        if (!entry) return null;
        return { ref, entry };
      })
      .filter(Boolean) as Array<{ ref: InventoryItem; entry: CompendiumEntry }>;
  }, [inventory]);

  const filtered = useMemo(() => {
    if (tab === "habilidades") return resolved.filter((r) => r.entry.type === "habilidade");
    if (tab === "magias") return resolved.filter((r) => r.entry.type === "magia");
    return resolved;
  }, [resolved, tab]);


  function addFromCompendium(entry: CompendiumEntry) {
    const existing = inventory.find((i) => i.packId === entry.packId && i.entryId === entry.id);
    if (existing) {
      persist(
        inventory.map((i) =>
          i.instanceId === existing.instanceId ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      persist([
        ...inventory,
        {
          instanceId: newInstanceId(),
          packId: entry.packId,
          entryId: entry.id,
          quantity: 1,
        },
      ]);
    }
    setPickerOpen(false);
  }

  function removeItem(instanceId: string) {
    persist(inventory.filter((i) => i.instanceId !== instanceId));
  }

  const { identity, resources, movement, tactical } = live;

  return (
    <div className={`sheet-shell ${embedded ? "sheet-embedded" : ""}`}>
      <aside className="sheet-sidebar glass">
        {inRoom ? (
          <div className="sheet-live">
            <span className="sheet-live-dot" aria-hidden />
            Sync mesa · rev {snapshot?.revision ?? 0}
          </div>
        ) : null}

        {live.portraitUrl ? (
          <div className="sheet-hero-portrait">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={live.portraitUrl}
              alt={live.name}
              className="sheet-portrait-img-cover"
              style={{
                objectPosition:
                  live.portraitFocus
                    ? `${Math.round((live.portraitFocus.x ?? 0.5) * 100)}% ${Math.round((live.portraitFocus.y ?? 0.5) * 100)}%`
                    : "50% 50%",
              }}
            />
          </div>
        ) : null}

        <p className="eyebrow">Ficha</p>
        <h1 className="sheet-name">{live.name}</h1>
        <p className="sheet-meta">
          Nv {identity.nivel} · {identity.raca}
          {identity.linhagem ? ` (${identity.linhagem})` : ""} · {identity.classe}
          {identity.subclasse ? ` · ${identity.subclasse}` : ""}
        </p>
        <p className="sheet-meta sheet-meta-sub">
          {identity.antecedente} · Prof +{proficiencyBonus(identity.nivel)}
        </p>
        <p className="sheet-meta" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
          {formatXpProgress(identity.nivel, identity.xpTotal ?? 0)}
        </p>

        {inRoom ? (
          <PortraitFields
            roomId={roomId}
            actorId={character.id}
            portraitUrl={live.portraitUrl}
            portraitFocus={live.portraitFocus}
            tokenImageUrl={live.tokenImageUrl}
            canEdit={canEdit}
            onSaved={refresh}
          />
        ) : null}

        {identity.talentos && identity.talentos.length > 0 ? (
          <ul className="sheet-rules-notes" style={{ marginBottom: "0.75rem" }}>
            {identity.talentos.map((t) => (
              <li key={`${t.level}-${t.id}`}>
                Nv {t.level}: {t.name}
              </li>
            ))}
          </ul>
        ) : null}

        <SubclassTrackPanel actor={live} />

        {inRoom ? (
          <CombatLoadoutPanel
            actor={live}
            roomId={roomId}
            canEdit={canEdit}
            onSaved={refresh}
          />
        ) : null}

        {canEdit && inRoom ? (
          <>
            <CharacterIdentityEditor
              actor={live}
              roomId={roomId}
              canEdit={canEdit}
              onSaved={refresh}
            />
            <LevelUpWizard actor={live} roomId={roomId} canEdit={canEdit} onDone={refresh} />
          </>
        ) : null}

        <CharacterStatsGrid actor={live} />

        <div className="sheet-stat-grid">
          <div className="sheet-stat">
            <label>Vida</label>
            <strong>
              {resources.vida.value}/{resources.vida.max}
            </strong>
          </div>
          <div className="sheet-stat">
            <label>PA</label>
            <strong>
              {resources.pontosAcao.value}/{resources.pontosAcao.max}
            </strong>
          </div>
          <div className="sheet-stat">
            <label>Defesa</label>
            <strong>{tactical.defesa}</strong>
          </div>
          <div className="sheet-stat">
            <label>Movimento</label>
            <strong>
              {movement.walk}/{movement.run}
            </strong>
          </div>
        </div>

        {!embedded ? (
          <Link href={`/mesa/${roomId}`} className="btn btn-ghost" style={{ width: "100%", marginBottom: "0.75rem" }}>
            Ver na mesa
          </Link>
        ) : null}

        {character.biography ? (
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.55 }}>
            {character.biography}
          </p>
        ) : null}
      </aside>

      <section className="sheet-panel glass">
        <div className="sheet-tabs">
          <button
            type="button"
            className={`sheet-tab ${tab === "inventario" ? "active" : ""}`}
            onClick={() => setTab("inventario")}
          >
            Inventário
          </button>
          <button
            type="button"
            className={`sheet-tab ${tab === "habilidades" ? "active" : ""}`}
            onClick={() => setTab("habilidades")}
          >
            Habilidades
          </button>
          <button
            type="button"
            className={`sheet-tab ${tab === "magias" ? "active" : ""}`}
            onClick={() => setTab("magias")}
          >
            Magias
          </button>
        </div>

        <div className="sheet-toolbar">
          <h2 style={{ margin: 0, fontSize: "1.1rem", fontFamily: "var(--font-display)" }}>
            {tab === "inventario" ? "Inventário" : tab === "habilidades" ? "Habilidades" : "Magias"}
          </h2>
          {canEdit ? (
            <button type="button" className="btn" onClick={() => setPickerOpen(true)}>
              + Compêndio
            </button>
          ) : null}
        </div>

        {filtered.length === 0 ? (
          <div className="inv-empty">
            {tab === "inventario"
              ? "Nenhum item no inventário."
              : tab === "habilidades"
                ? "Nenhuma habilidade — use + Compêndio ou suba de nível na trilha de subclasse."
                : "Nenhuma magia preparada — adicione pelo compêndio."}
            {canEdit ? " Use + Compêndio para adicionar." : null}
          </div>
        ) : (
          <ul className="inv-list">
            {filtered.map(({ ref, entry }) => (
              <InventoryRow
                key={ref.instanceId}
                entry={entry}
                quantity={ref.quantity}
                canEdit={canEdit}
                onRemove={() => removeItem(ref.instanceId)}
              />
            ))}
          </ul>
        )}
      </section>

      {pickerOpen ? (
        <CompendiumPicker
          pack={pickerPack}
          packs={PLAYER_PACKS}
          compendium={compendium}
          onPickPack={setPickerPack}
          onPick={addFromCompendium}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}
    </div>
  );
}

function InventoryRow({
  entry,
  quantity,
  canEdit,
  onRemove,
}: {
  entry: CompendiumEntry;
  quantity: number;
  canEdit: boolean;
  onRemove: () => void;
}) {
  const color = TYPE_COLOR[entry.type] ?? "#00f5ff";
  const tags = entrySummary(entry.system, entry.type);

  return (
    <li className="inv-row">
      <div className="inv-icon" style={{ background: `${color}22`, color }}>
        {entry.name.charAt(0)}
      </div>
      <div>
        <h4>{entry.name}</h4>
        <p>{tags.slice(0, 3).join(" · ")}</p>
      </div>
      <span className="inv-type">{entry.type}</span>
      {quantity > 1 ? <span className="inv-type">×{quantity}</span> : null}
      {canEdit ? (
        <button type="button" className="inv-remove" onClick={onRemove}>
          Remover
        </button>
      ) : null}
    </li>
  );
}

function CompendiumPicker({
  pack,
  packs,
  compendium,
  onPickPack,
  onPick,
  onClose,
}: {
  pack: CompendiumPackId;
  packs: CompendiumPackId[];
  compendium: Record<CompendiumPackId, CompendiumEntry[]>;
  onPickPack: (p: CompendiumPackId) => void;
  onPick: (e: CompendiumEntry) => void;
  onClose: () => void;
}) {
  const PACK_LABEL: Record<CompendiumPackId, string> = {
    armas: "Armas",
    habilidades: "Habilidades",
    magias: "Magias",
    equipamentos: "Equipamentos",
    monstros: "Monstros",
  };

  const entries = compendium[pack] ?? [];

  return (
    <div className="picker-overlay" onClick={onClose} role="presentation">
      <div className="picker-modal glass" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-toolbar">
          <h3 style={{ margin: 0 }}>Adicionar do compêndio</h3>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Fechar
          </button>
        </div>
        <div className="picker-tabs">
          {packs.map((p) => (
            <button
              key={p}
              type="button"
              className={`sheet-tab ${p === pack ? "active" : ""}`}
              onClick={() => onPickPack(p)}
            >
              {PACK_LABEL[p]}
            </button>
          ))}
        </div>
        <ul className="picker-list">
          {entries.map((entry) => (
            <li key={entry.id}>
              <button type="button" className="picker-item" onClick={() => onPick(entry)}>
                <span>{entry.name}</span>
                <span className="inv-type">{entry.type}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
