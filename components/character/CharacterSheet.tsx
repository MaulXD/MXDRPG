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
import { CharacterSheetCover } from "@/components/character/CharacterSheetCover";
import { CharacterPortraitFields } from "@/components/character/CharacterPortraitFields";
import { PortraitFields } from "@/components/character/PortraitFields";
import {
  CharacterIdentityEditor,
  CharacterStatsGrid,
} from "@/components/character/CharacterIdentityEditor";
import { LevelUpWizard } from "@/components/character/LevelUpWizard";
import { SubclassTrackPanel } from "@/components/character/SubclassTrackPanel";
import { CombatLoadoutPanel } from "@/components/character/CombatLoadoutPanel";
import { LootEconomyPanel } from "@/components/character/LootEconomyPanel";
import { CharacterSheetPopupHero } from "@/components/character/CharacterSheetPopupHero";
import {
  ATTRIBUTE_LABELS,
  attributeMod,
  CULINARY_LABELS,
  proficiencyBonus,
  type AttributeKey,
  type CulinaryKey,
} from "@/lib/character/rules";
import { portraitFocusToImgStyle, sanitizePortraitFocus } from "@/lib/media/portrait-focus";
import "./sheet.css";
import "./sheet-popup.css";

type Tab = "inventário" | "tesouro" | "habilidades" | "magias";

type Props = {
  character: CharacterSheetData;
  canEdit: boolean;
  compendium: Record<CompendiumPackId, CompendiumEntry[]>;
  roomId?: string;
  embedded?: boolean;
  /** Pop-up na mesa (layout estilo VTT) vs página inteira */
  variant?: "page" | "popup";
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
  variant = "page",
}: Props) {
  const [tab, setTab] = useState<Tab>("inventário");
  const [inventory, setInventory] = useState<InventoryItem[]>(character.inventory);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPack, setPickerPack] = useState<CompendiumPackId>("armas");
  const [selectedInvId, setSelectedInvId] = useState<string | null>(null);

  const { snapshot, refresh, applySnapshot } = useRoomSync(roomId);
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
    setSelectedInvId((cur) => (cur === instanceId ? null : cur));
  }

  useEffect(() => {
    setSelectedInvId(null);
  }, [tab, character.id]);

  useEffect(() => {
    function isTypingTarget(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) return false;
      return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
    }

    function onKey(e: KeyboardEvent) {
      if (e.key !== "Delete" || !canEdit || tab === "tesouro" || pickerOpen) return;
      if (isTypingTarget(e.target)) return;
      if (!selectedInvId) return;
      const row = filtered.find((r) => r.ref.instanceId === selectedInvId);
      if (!row) return;
      e.preventDefault();
      removeItem(selectedInvId);
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canEdit, tab, pickerOpen, selectedInvId, filtered, inventory]);

  const { identity, resources, movement, tactical } = live;
  const isPopup = variant === "popup";
  const hpPct =
    resources.vida.max > 0
      ? Math.round((resources.vida.value / resources.vida.max) * 100)
      : 0;
  const paPct =
    resources.pontosAcao.max > 0
      ? Math.round((resources.pontosAcao.value / resources.pontosAcao.max) * 100)
      : 0;
  const prof = proficiencyBonus(identity.nivel);
  const portraitFocus = sanitizePortraitFocus(live.portraitFocus);

  const tabPanel = (
    <>
      <div className="sheet-tabs">
        <button
          type="button"
          className={`sheet-tab ${tab === "inventário" ? "active" : ""}`}
          onClick={() => setTab("inventário")}
        >
          Inventário
        </button>
        <button
          type="button"
          className={`sheet-tab ${tab === "tesouro" ? "active" : ""}`}
          onClick={() => setTab("tesouro")}
        >
          Tesouro
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
          {tab === "inventário"
            ? "Inventário"
            : tab === "tesouro"
              ? "Tesouro e riquezas"
              : tab === "habilidades"
                ? "Habilidades"
                : "Magias"}
        </h2>
        {canEdit && tab !== "tesouro" ? (
          <button type="button" className="btn" onClick={() => setPickerOpen(true)}>
            + Compêndio
          </button>
        ) : null}
      </div>

      {tab === "tesouro" ? (
        <LootEconomyPanel
          characterId={character.id}
          seed={live.lootEconomy ?? character.lootEconomy}
          canEdit={canEdit}
        />
      ) : filtered.length === 0 ? (
        <div className="inv-empty">
          {tab === "inventário"
            ? "Nenhum item no inventário."
            : tab === "habilidades"
              ? "Nenhuma habilidade — use + Compêndio ou suba de nível na trilha de subclasse."
              : "Nenhuma magia preparada — adicione pelo compêndio."}
          {canEdit ? " Use + Compêndio para adicionar." : null}
        </div>
      ) : (
        <>
          {canEdit && filtered.length > 0 ? (
            <p className="vtt-combat-hint" style={{ marginBottom: "0.45rem" }}>
              Clique em um item e pressione <strong>Delete</strong> para remover.
            </p>
          ) : null}
          <ul className="inv-list">
            {filtered.map(({ ref, entry }) => (
              <InventoryRow
                key={ref.instanceId}
                entry={entry}
                quantity={ref.quantity}
                canEdit={canEdit}
                selected={selectedInvId === ref.instanceId}
                onSelect={() => setSelectedInvId(ref.instanceId)}
                onRemove={() => removeItem(ref.instanceId)}
              />
            ))}
          </ul>
        </>
      )}
    </>
  );

  const sidebarTools = (
    <>
      {inRoom ? (
        <div className={isPopup ? "sheet-popup-live" : "sheet-live"}>
          <span className="sheet-live-dot" aria-hidden />
          Sync mesa · rev {snapshot?.revision ?? 0}
        </div>
      ) : null}

      {!isPopup ? (
        <p className="sheet-meta" style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 0 }}>
          {formatXpProgress(identity.nivel, identity.xpTotal ?? 0)}
        </p>
      ) : null}

      {canEdit ? (
        <LevelUpWizard
          actor={live}
          roomId={roomId}
          canEdit={canEdit}
          onDone={refresh}
          onApplied={(patch) => {
            if (!snapshot) return;
            applySnapshot({
              ...snapshot,
              actors: { ...snapshot.actors, [patch.actor.id]: patch.actor },
              scene: patch.scene,
              revision: patch.revision,
            });
          }}
        />
      ) : null}

      {canEdit && inRoom && !isPopup ? (
        <PortraitFields
          roomId={roomId}
          actorId={character.id}
          portraitUrl={live.portraitUrl}
          portraitFocus={live.portraitFocus}
          coverFocus={live.coverFocus}
          tokenFocus={live.tokenFocus}
          tokenImageUrl={live.tokenImageUrl}
          canEdit={canEdit}
          onSaved={refresh}
        />
      ) : null}

      {isPopup && canEdit && inRoom ? (
        <Link
          href={`/personagem/${character.id}`}
          className="btn btn-ghost"
          style={{ width: "100%", fontSize: "0.8rem" }}
        >
          Editar retrato e identidade ↗
        </Link>
      ) : null}

      {canEdit && !inRoom ? (
        <CharacterPortraitFields
          characterId={character.id}
          portraitUrl={live.portraitUrl ?? character.portraitUrl}
          portraitFocus={live.portraitFocus ?? character.portraitFocus}
          coverFocus={live.coverFocus ?? character.coverFocus}
          tokenFocus={live.tokenFocus ?? character.tokenFocus}
          tokenImageUrl={live.tokenImageUrl ?? character.tokenImageUrl}
          canEdit={canEdit}
        />
      ) : null}

      {!isPopup && identity.talentos && identity.talentos.length > 0 ? (
        <ul className="sheet-rules-notes" style={{ marginBottom: "0.75rem" }}>
          {identity.talentos.map((t) => (
            <li key={`${t.level}-${t.id}`}>
              Nv {t.level}: {t.name}
            </li>
          ))}
        </ul>
      ) : null}

      <SubclassTrackPanel actor={live} popup={isPopup} />

      {inRoom ? (
        <CombatLoadoutPanel
          actor={live}
          roomId={roomId}
          canEdit={canEdit}
          onSaved={refresh}
        />
      ) : null}

      {canEdit && inRoom ? (
        <CharacterIdentityEditor
          actor={live}
          roomId={roomId}
          canEdit={canEdit}
          onSaved={refresh}
        />
      ) : null}

      {!isPopup ? (
        <>
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
        </>
      ) : null}

      {!embedded && !isPopup ? (
        <Link href={`/mesa/${roomId}`} className="btn btn-ghost" style={{ width: "100%", marginBottom: "0.75rem" }}>
          Ver na mesa
        </Link>
      ) : null}

      {character.biography ? (
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.55 }}>
          {character.biography}
        </p>
      ) : null}
    </>
  );

  const culinaryKeys = Object.keys(CULINARY_LABELS) as CulinaryKey[];

  if (isPopup) {
    const popupRightAside = (
      <>
        {inRoom ? (
          <div className="sheet-popup-live">
            <span className="sheet-live-dot" aria-hidden />
            Sync mesa · rev {snapshot?.revision ?? 0}
          </div>
        ) : null}

        <div className="sheet-popup-pills">
          {identity.raca ? <span className="sheet-popup-pill">{identity.raca}</span> : null}
          {identity.classe ? <span className="sheet-popup-pill">{identity.classe}</span> : null}
          {identity.subclasse ? (
            <span className="sheet-popup-pill sheet-popup-pill--accent">{identity.subclasse}</span>
          ) : null}
          {identity.antecedente ? (
            <span className="sheet-popup-pill">{identity.antecedente}</span>
          ) : null}
        </div>

        {canEdit ? (
          <LevelUpWizard
            actor={live}
            roomId={roomId}
            canEdit={canEdit}
            onDone={refresh}
            onApplied={(patch) => {
              if (!snapshot) return;
              applySnapshot({
                ...snapshot,
                actors: { ...snapshot.actors, [patch.actor.id]: patch.actor },
                scene: patch.scene,
                revision: patch.revision,
              });
            }}
          />
        ) : null}

        {canEdit && inRoom ? (
          <Link
            href={`/personagem/${character.id}`}
            className="btn btn-ghost"
            style={{ width: "100%", fontSize: "0.78rem" }}
          >
            Editar retrato e identidade ↗
          </Link>
        ) : null}

        <SubclassTrackPanel actor={live} popup />

        {inRoom ? (
          <CombatLoadoutPanel
            actor={live}
            roomId={roomId}
            canEdit={canEdit}
            onSaved={refresh}
          />
        ) : null}

        {canEdit && inRoom ? (
          <CharacterIdentityEditor
            actor={live}
            roomId={roomId}
            canEdit={canEdit}
            onSaved={refresh}
          />
        ) : null}
      </>
    );

    return (
      <div className="sheet-shell sheet-shell--popup">
        <CharacterSheetPopupHero
          name={live.name}
          identity={identity}
          portraitUrl={live.portraitUrl}
          portraitFocus={live.portraitFocus}
        />

        <div className="sheet-popup-attrs">
          {(Object.keys(ATTRIBUTE_LABELS) as AttributeKey[]).map((k) => (
            <div className="sheet-popup-attr" key={k}>
              <label>{ATTRIBUTE_LABELS[k]}</label>
              <strong>
                {attributeMod(live.attributes[k]) >= 0 ? "+" : ""}
                {attributeMod(live.attributes[k])}
              </strong>
              <span>{live.attributes[k]}</span>
            </div>
          ))}
        </div>

        <div className="sheet-popup-body">
          <aside className="sheet-popup-left">
            <div className="sheet-popup-portrait">
              {live.portraitUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={live.portraitUrl}
                  alt=""
                  style={portraitFocus ? portraitFocusToImgStyle(portraitFocus) : undefined}
                />
              ) : (
                <span className="sheet-popup-portrait__fallback">
                  {live.name.trim().slice(0, 2).toUpperCase() || "?"}
                </span>
              )}
            </div>

            <div className="sheet-popup-diamond" aria-label="Combate">
              <span className="sheet-popup-diamond__top">
                <em>Defesa</em>
                <strong>{tactical.defesa}</strong>
              </span>
              <span className="sheet-popup-diamond__left">
                <em>Inic.</em>
                <strong>
                  {tactical.iniciativa >= 0 ? "+" : ""}
                  {tactical.iniciativa}
                </strong>
              </span>
              <span className="sheet-popup-diamond__right">
                <em>Mov.</em>
                <strong>
                  {movement.walk}/{movement.run}
                </strong>
              </span>
              <span className="sheet-popup-diamond__bottom">
                <em>Prof.</em>
                <strong>+{prof}</strong>
              </span>
            </div>

            <div className="sheet-popup-resource">
              <div className="sheet-popup-resource__head">
                <span>Vida</span>
                <strong>
                  {resources.vida.value}/{resources.vida.max}
                </strong>
              </div>
              <div className="sheet-popup-bar">
                <span className="sheet-popup-bar-fill--hp" style={{ width: `${hpPct}%` }} />
              </div>
            </div>

            <div className="sheet-popup-resource">
              <div className="sheet-popup-resource__head">
                <span>Pontos de ação</span>
                <strong>
                  {resources.pontosAcao.value}/{resources.pontosAcao.max}
                </strong>
              </div>
              <div className="sheet-popup-bar">
                <span className="sheet-popup-bar-fill--pa" style={{ width: `${paPct}%` }} />
              </div>
            </div>
          </aside>

          <section className="sheet-popup-center sheet-panel">
            <h3 className="sheet-popup-section-title">Culinária</h3>
            <ul className="sheet-popup-skill-list">
              {culinaryKeys.map((k) => (
                <li className="sheet-popup-skill" key={k}>
                  <span className="sheet-popup-skill__abbr">CUL</span>
                  <span className="sheet-popup-skill__name">{CULINARY_LABELS[k]}</span>
                  <span className="sheet-popup-skill__bonus">
                    {live.culinary[k] >= 0 ? "+" : ""}
                    {live.culinary[k]}
                  </span>
                </li>
              ))}
            </ul>
            {tabPanel}
          </section>

          <aside className="sheet-popup-right">{popupRightAside}</aside>
        </div>

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

  return (
    <div className={`sheet-shell ${embedded ? "sheet-embedded" : ""}`}>
      <CharacterSheetCover
        name={live.name}
        identity={identity}
        portraitUrl={live.portraitUrl}
        portraitFocus={live.portraitFocus}
        coverFocus={live.coverFocus}
      />

      <aside className="sheet-sidebar glass">{sidebarTools}</aside>

      <section className="sheet-panel glass sheet-main">{tabPanel}</section>

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
  selected = false,
  onSelect,
  onRemove,
}: {
  entry: CompendiumEntry;
  quantity: number;
  canEdit: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onRemove: () => void;
}) {
  const color = TYPE_COLOR[entry.type] ?? "#00f5ff";
  const tags = entrySummary(entry.system, entry.type);

  return (
    <li
      className={`inv-row${selected ? " inv-row--selected" : ""}`}
      role={canEdit ? "button" : undefined}
      tabIndex={canEdit ? 0 : undefined}
      onClick={canEdit ? onSelect : undefined}
      onKeyDown={
        canEdit
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect?.();
              }
            }
          : undefined
      }
    >
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
        <button
          type="button"
          className="inv-remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
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
