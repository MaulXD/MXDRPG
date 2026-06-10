"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CharacterSheet as CharacterSheetData, InventoryItem } from "@/lib/character/types";
import { formatXpProgress } from "@/lib/character/xp";
import { loadInventory, newInstanceId, saveInventory } from "@/lib/character/inventory-storage";
import type { CompendiumEntry, CompendiumPackId } from "@/lib/compendium/types";
import { CompendiumIcon } from "@/components/compendium/CompendiumIcon";
import { entryBookRef, entryDescriptionHtml, entrySummary, stripHtml } from "@/lib/compendium/format";
import { compendiumTypeColor } from "@/lib/compendium/icons";
import { getEntry } from "@/lib/compendium/registry";
import { useImageNaturalSize } from "@/hooks/useImageNaturalSize";
import { patchRoomActor, useRoomSync } from "@/hooks/useRoomSync";
import { firstPortraitDataUrl } from "@/lib/room/portrait-sync";
import { CharacterSheetCover } from "@/components/character/CharacterSheetCover";
import { CharacterPortraitFields } from "@/components/character/CharacterPortraitFields";
import { PortraitFields } from "@/components/character/PortraitFields";
import {
  CharacterIdentityEditor,
  CharacterStatsGrid,
} from "@/components/character/CharacterIdentityEditor";
import { LevelUpWizard } from "@/components/character/LevelUpWizard";
import { FutureLevelsPanel } from "@/components/character/FutureLevelsPanel";
import { CharacterReligionEditor } from "@/components/character/CharacterReligionEditor";
import { ReligionSheetPanel } from "@/components/character/ReligionSheetPanel";
import { WizardHoverTip } from "@/components/character/wizard/WizardHoverTip";
import { SubclassTrackPanel } from "@/components/character/SubclassTrackPanel";
import { CombatLoadoutPanel } from "@/components/character/CombatLoadoutPanel";
import { LootEconomyPanel } from "@/components/character/LootEconomyPanel";
import {
  SheetPopupLoadoutBar,
  type LoadoutPatch,
} from "@/components/character/SheetPopupLoadoutBar";
import { SheetPopupPortrait } from "@/components/character/SheetPopupPortrait";
import { SheetPopupDdbView } from "@/components/character/SheetPopupDdbView";
import { SheetDdbDrawer } from "@/components/character/SheetDdbDrawer";
import { SheetDdbManagePanel } from "@/components/character/SheetDdbManagePanel";
import { PersonalBestiaryPanel } from "@/components/character/PersonalBestiaryPanel";
import {
  IconArmor,
  IconBackpack,
  IconBestiary,
  IconCoins,
  IconLightning,
  IconSword,
  IconWand,
} from "@/components/character/SheetPopupIcons";
import { resolveActorDefesa } from "@/lib/character/armor-defense";
import {
  ATTRIBUTE_LABELS,
  attributeMod,
  proficiencyBonus,
  type AttributeKey,
} from "@/lib/character/rules";
import { SheetPdfExportButton } from "@/components/character/SheetPdfExportButton";
import { SheetEditRequestButton } from "@/components/character/SheetEditRequestButton";
import { useSheetPdfDeepLink } from "@/hooks/useSheetPdfDeepLink";
import { OrnamentCard } from "@/components/ui/OrnamentCard";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { Portrait } from "@/components/vtt/Portrait";
import type { PortraitBundle } from "@/lib/media/image-upload-client";
import { sanitizePortraitFocus } from "@/lib/media/portrait-focus";
import { isTypingTarget } from "@/lib/vtt/keyboard-guard";
import type { FoundryWindowDragHandlers } from "@/hooks/vtt/useFoundryWindowDrag";
import "./sheet.css";
import "./sheet-popup.css";

type Tab = "inventário" | "tesouro" | "habilidades" | "magias" | "bestiário";

type Props = {
  character: CharacterSheetData;
  canEdit: boolean;
  /** Retrato/token — pode ser true para o mestre mesmo com ficha somente leitura */
  canEditPortrait?: boolean;
  compendium: Record<CompendiumPackId, CompendiumEntry[]>;
  roomId?: string;
  embedded?: boolean;
  /** Pop-up na mesa (layout estilo VTT) vs página inteira */
  variant?: "page" | "popup";
  /** Oculta botão inline (legado — popup na mesa usa toolbar DDB) */
  hidePdfExport?: boolean;
  /** Botão de solicitar edição ao mestre (fichas em campanha) */
  showEditRequest?: boolean;
  /** Toolbar DDB — aviso à esquerda (ex.: somente leitura) */
  popupToolbarLeading?: ReactNode;
  /** Toolbar DDB — fechar, abrir página, etc. */
  popupToolbarTrailing?: ReactNode;
  /** Arrastar janela Foundry pela toolbar */
  popupToolbarDrag?: FoundryWindowDragHandlers;
  /** Ficha DDB em /personagem/:id (sem moldura Foundry) */
  standalonePage?: boolean;
};

const PLAYER_PACKS: CompendiumPackId[] = ["armas", "habilidades", "magias", "equipamentos"];

export function CharacterSheet({
  character,
  canEdit,
  canEditPortrait: canEditPortraitProp,
  compendium,
  roomId = "demo",
  embedded = false,
  variant = "page",
  hidePdfExport = false,
  showEditRequest = false,
  popupToolbarLeading,
  popupToolbarTrailing,
  popupToolbarDrag,
  standalonePage = false,
}: Props) {
  const canEditPortrait = canEditPortraitProp ?? canEdit;
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("inventário");
  const [inventory, setInventory] = useState<InventoryItem[]>(character.inventory);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPack, setPickerPack] = useState<CompendiumPackId>("armas");
  const [selectedInvId, setSelectedInvId] = useState<string | null>(null);
  const [localSheet, setLocalSheet] = useState<CharacterSheetData | null>(null);
  const [bestiaryCount, setBestiaryCount] = useState<number | undefined>(undefined);

  const adventureId = character.adventureId?.trim() || null;
  const showBestiaryTab = Boolean(adventureId);

  const { snapshot, refresh, applySnapshot } = useRoomSync(roomId);
  const sheetBase = localSheet ?? character;
  const roomActor = snapshot?.actors[character.id];
  const liveRaw = roomActor ?? sheetBase;
  const live: CharacterSheetData = {
    ...liveRaw,
    inventory: roomActor?.inventory?.length ? roomActor.inventory : character.inventory,
    combatLoadout: roomActor?.combatLoadout ?? character.combatLoadout ?? null,
    armorLoadout: roomActor?.armorLoadout ?? character.armorLoadout ?? null,
  };
  const inRoom = Boolean(roomActor);

  useEffect(() => {
    setLocalSheet(null);
  }, [character.id, character.combatLoadout, character.armorLoadout, character.tactical?.defesa]);

  useEffect(() => {
    const seed =
      inRoom && live.inventory?.length ? live.inventory : character.inventory;
    setInventory(loadInventory(character.id, seed));
  }, [character.id, character.inventory, inRoom, live.inventory]);

  const persist = useCallback(
    (items: InventoryItem[]) => {
      setInventory(items);
      saveInventory(character.id, items);
      void (async () => {
        try {
          if (inRoom) {
            await patchRoomActor(roomId, character.id, { inventory: items });
            await refresh();
          } else {
            const res = await fetch(`/api/characters/${character.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ inventory: items }),
            });
            if (!res.ok) {
              const err = (await res.json().catch(() => ({}))) as { error?: string };
              throw new Error(err.error ?? "Falha ao salvar inventário");
            }
          }
        } catch (e) {
          console.error("[ficha] inventário não persistiu:", e);
        }
      })();
    },
    [character.id, inRoom, roomId, refresh]
  );

  const saveLoadoutPatch = useCallback(
    async (patch: LoadoutPatch) => {
      if (inRoom) {
        await patchRoomActor(roomId, character.id, patch);
        await refresh();
        return;
      }
      const res = await fetch(`/api/characters/${character.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Falha ao salvar equipamento");
      }
      const data = (await res.json()) as { character?: CharacterSheetData };
      if (data.character) setLocalSheet(data.character);
    },
    [character.id, inRoom, roomId, refresh]
  );

  const persistPortraitBundle = useCallback(
    async (bundle: PortraitBundle) => {
      const res = await fetch(`/api/characters/${character.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portraitUrl: bundle.portraitUrl,
          tokenImageUrl: bundle.tokenImageUrl,
          portraitFocus: bundle.portraitFocus,
          coverFocus: bundle.coverFocus,
          tokenFocus: bundle.tokenFocus,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `Erro ${res.status}`);
      }
      const data = (await res.json()) as { character?: CharacterSheetData };
      if (data.character) {
        setLocalSheet(data.character);
      } else {
        setLocalSheet((prev) => ({
          ...(prev ?? character),
          portraitUrl: bundle.portraitUrl,
          tokenImageUrl: bundle.tokenImageUrl,
          portraitFocus: bundle.portraitFocus,
          coverFocus: bundle.coverFocus,
          tokenFocus: bundle.tokenFocus,
        }));
      }
    },
    [character]
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

  const tabCounts = useMemo(
    () => ({
      inventário: resolved.filter(
        (r) => r.entry.type !== "magia" && r.entry.type !== "habilidade"
      ).length,
      habilidades: resolved.filter((r) => r.entry.type === "habilidade").length,
      magias: resolved.filter((r) => r.entry.type === "magia").length,
    }),
    [resolved]
  );

  const filtered = useMemo(() => {
    if (tab === "habilidades") return resolved.filter((r) => r.entry.type === "habilidade");
    if (tab === "magias") return resolved.filter((r) => r.entry.type === "magia");
    return resolved.filter((r) => r.entry.type !== "magia" && r.entry.type !== "habilidade");
  }, [resolved, tab]);

  const inventorySections = useMemo(() => {
    if (tab !== "inventário") return [];
    const sections: Array<{
      id: string;
      label: string;
      hint?: string;
      items: Array<{ ref: InventoryItem; entry: CompendiumEntry }>;
    }> = [];
    const weapons = filtered.filter((r) => r.entry.type === "arma");
    const gear = filtered.filter((r) => r.entry.type === "equipamento");
    const other = filtered.filter(
      (r) => r.entry.type !== "arma" && r.entry.type !== "equipamento"
    );
    if (weapons.length) {
      sections.push({ id: "armas", label: "Armas", hint: "Corpo a corpo e à distância", items: weapons });
    }
    if (gear.length) {
      sections.push({
        id: "equipamentos",
        label: "Armaduras e equipamento",
        hint: "Vestíveis e utilitários de masmorra",
        items: gear,
      });
    }
    if (other.length) {
      sections.push({ id: "outros", label: "Outros itens", items: other });
    }
    return sections;
  }, [filtered, tab]);


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
    if (!showBestiaryTab && tab === "bestiário") {
      setTab("inventário");
    }
  }, [showBestiaryTab, tab]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      if (!canEdit || tab === "tesouro" || tab === "bestiário" || pickerOpen) return;
      if (isTypingTarget(e.target)) return;
      if (!selectedInvId) return;
      const row = filtered.find((r) => r.ref.instanceId === selectedInvId);
      if (!row) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      removeItem(selectedInvId);
    }

    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [canEdit, tab, pickerOpen, selectedInvId, filtered, inventory]);

  const { identity, resources, movement, tactical } = live;
  const isPopup = variant === "popup";
  const isStandalonePopup = isPopup && standalonePage;
  const hpPct =
    resources.vida.max > 0
      ? Math.round((resources.vida.value / resources.vida.max) * 100)
      : 0;
  const prof = proficiencyBonus(identity.nivel);
  const portraitFocus = sanitizePortraitFocus(live.portraitFocus);
  const linkedToken = snapshot?.scene.tokens.find(
    (t) => t.linked && t.actorId === character.id
  );
  const popupPortraitSrc = firstPortraitDataUrl(
    live.portraitUrl,
    live.tokenImageUrl,
    character.portraitUrl,
    character.tokenImageUrl,
    linkedToken?.imageUrl
  );
  const offlinePopupPortraitSize = useImageNaturalSize(
    isPopup && !inRoom ? popupPortraitSrc : null
  );
  const displayDefesa = resolveActorDefesa(live);

  const onMesaPage =
    typeof window !== "undefined" && window.location.pathname.startsWith("/mesa/");

  const scrollToQuickBar = useCallback((actorId: string) => {
    if (actorId !== character.id) return;
    document
      .querySelector(".sheet-popup-quickbar")
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [character.id]);

  useSheetPdfDeepLink({
    enabled: isPopup && !onMesaPage,
    roomId: inRoom ? roomId : undefined,
    combat: snapshot?.combat,
    tokens: snapshot?.scene.tokens,
    actors: snapshot?.actors,
    openSheet: scrollToQuickBar,
    onRolled: refresh,
  });

  const tabTitles: Record<Tab, string> = {
    inventário: "Inventário",
    tesouro: "Tesouro e riquezas",
    habilidades: "Habilidades",
    magias: "Magias",
    bestiário: "Bestiário pessoal",
  };

  const sheetTabs: Array<{
    id: Tab;
    label: string;
    icon: ReactNode;
    count?: number;
  }> = [
    {
      id: "inventário",
      label: "Inventário",
      icon: <IconBackpack size={16} className="sheet-tab__icon" />,
      count: tabCounts.inventário,
    },
    {
      id: "tesouro",
      label: "Tesouro",
      icon: <IconCoins size={16} className="sheet-tab__icon" />,
    },
    {
      id: "habilidades",
      label: "Habilidades",
      icon: <IconLightning size={16} className="sheet-tab__icon" />,
      count: tabCounts.habilidades,
    },
    {
      id: "magias",
      label: "Magias",
      icon: <IconWand size={16} className="sheet-tab__icon" />,
      count: tabCounts.magias,
    },
    ...(showBestiaryTab
      ? [
          {
            id: "bestiário" as const,
            label: "Bestiário Pessoal",
            icon: <IconBestiary size={16} className="sheet-tab__icon" />,
            count: bestiaryCount,
          },
        ]
      : []),
  ];

  const sectionIcons: Record<string, ReactNode> = {
    armas: <IconSword size={18} className="inv-section__icon" />,
    equipamentos: <IconArmor size={18} className="inv-section__icon" />,
    outros: <IconBackpack size={18} className="inv-section__icon" />,
  };

  const tabPanel = (
    <>
      <div className="sheet-tabs" role="tablist" aria-label="Inventário e recursos">
        {sheetTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`sheet-tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.icon}
            <span className="sheet-tab__label">{t.label}</span>
            {t.count && t.count > 0 ? (
              <span className="sheet-tab__count">{t.count}</span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="sheet-toolbar">
        <h2
          className={isPopup ? "sheet-popup-panel-title" : undefined}
          style={
            isPopup
              ? undefined
              : { margin: 0, fontSize: "1.1rem", fontFamily: "var(--font-display)" }
          }
        >
          {tabTitles[tab]}
        </h2>
        {canEdit && tab !== "tesouro" && tab !== "bestiário" ? (
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
      ) : tab === "bestiário" && adventureId ? (
        <PersonalBestiaryPanel
          adventureId={adventureId}
          roomId={roomId}
          characterName={live.name}
          onCountChange={setBestiaryCount}
        />
      ) : filtered.length === 0 ? (
        <div className="inv-empty">
          {tab === "inventário"
            ? "Nenhuma arma ou equipamento — magias e habilidades ficam nas abas próprias."
            : tab === "habilidades"
              ? "Nenhuma habilidade — use + Compêndio ou suba de nível na trilha de subclasse."
              : "Nenhuma magia preparada — adicione pelo compêndio."}
          {canEdit ? " Use + Compêndio para adicionar." : null}
        </div>
      ) : (
        <>
          {canEdit && filtered.length > 0 ? (
            <p className="inv-hint">
              Clique em um item e pressione <strong>Delete</strong> para remover.
            </p>
          ) : null}
          {tab === "inventário" ? (
            <div className="inv-sections">
              {inventorySections.map((section) => (
                <section key={section.id} className="inv-section">
                  <header className="inv-section__head">
                    {sectionIcons[section.id] ?? null}
                    <span className="inv-section__count">{section.items.length}</span>
                  </header>
                  <SectionDivider title={section.label} />
                  {section.hint ? (
                    <p className="inv-section__hint">{section.hint}</p>
                  ) : null}
                  <ul className="inv-list">
                    {section.items.map(({ ref, entry }) => (
                      <InventoryRow
                        key={ref.instanceId}
                        entry={entry}
                        quantity={ref.quantity}
                        canEdit={canEdit}
                        selected={selectedInvId === ref.instanceId}
                        showDetail
                        onSelect={() => setSelectedInvId(ref.instanceId)}
                        onRemove={() => removeItem(ref.instanceId)}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <ul className="inv-list">
              {filtered.map(({ ref, entry }) => (
                <InventoryRow
                  key={ref.instanceId}
                  entry={entry}
                  quantity={ref.quantity}
                  canEdit={canEdit}
                  selected={selectedInvId === ref.instanceId}
                  showDetail
                  onSelect={() => setSelectedInvId(ref.instanceId)}
                  onRemove={() => removeItem(ref.instanceId)}
                />
              ))}
            </ul>
          )}
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

      {canEditPortrait && inRoom && !isPopup ? (
        <PortraitFields
          roomId={roomId}
          actorId={character.id}
          portraitUrl={live.portraitUrl}
          portraitFocus={live.portraitFocus}
          coverFocus={live.coverFocus}
          tokenFocus={live.tokenFocus}
          tokenImageUrl={live.tokenImageUrl}
          canEdit={canEditPortrait}
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

      {canEditPortrait && !inRoom ? (
        <CharacterPortraitFields
          characterId={character.id}
          portraitUrl={live.portraitUrl ?? character.portraitUrl}
          portraitFocus={live.portraitFocus ?? character.portraitFocus}
          coverFocus={live.coverFocus ?? character.coverFocus}
          tokenFocus={live.tokenFocus ?? character.tokenFocus}
          tokenImageUrl={live.tokenImageUrl ?? character.tokenImageUrl}
          canEdit={canEditPortrait}
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

      {canEdit ? (
        <SheetPopupLoadoutBar
          actor={live}
          inventory={inventory}
          canEdit={canEdit}
          onSaved={inRoom ? refresh : () => undefined}
          savePatch={saveLoadoutPatch}
          eyebrow={inRoom ? "Em uso na mesa" : "Equipamento ativo"}
        />
      ) : null}

      <section className="sheet-section">
        <SectionDivider title="Devotion" />
        <ReligionSheetPanel religiao={live.identity.religiao} />
        {canEdit && !inRoom ? (
          <CharacterReligionEditor
            characterId={character.id}
            religiao={live.identity.religiao ?? "sem-deus"}
          />
        ) : null}
      </section>
      <FutureLevelsPanel actor={live} compact={isPopup} />

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
            <div className="sheet-stat sheet-stat--hp">
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
              <strong>{displayDefesa}</strong>
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

  if (isPopup) {
    const managePanel =
      canEdit || inRoom ? (
        <SheetDdbManagePanel
          character={character}
          live={live}
          roomId={roomId}
          adventureId={adventureId}
          inRoom={inRoom}
          canEdit={canEdit}
          snapshotRevision={snapshot?.revision}
          onRefresh={refresh}
          onLevelApplied={(patch) => {
            if (!snapshot) return;
            applySnapshot({
              ...snapshot,
              actors: { ...snapshot.actors, [patch.actor.id]: patch.actor },
              scene: patch.scene,
              revision: patch.revision,
            });
          }}
        />
      ) : null;

    const portraitNode = canEditPortrait ? (
      <SheetPopupPortrait
        actorId={character.id}
        roomId={inRoom ? roomId : undefined}
        name={live.name}
        portraitUrl={live.portraitUrl ?? character.portraitUrl}
        tokenImageUrl={live.tokenImageUrl ?? character.tokenImageUrl}
        portraitFocus={live.portraitFocus ?? character.portraitFocus}
        tokenFocus={live.tokenFocus ?? character.tokenFocus}
        canEdit={canEditPortrait}
        onSaved={inRoom ? refresh : () => router.refresh()}
        onPersistBundle={inRoom ? undefined : persistPortraitBundle}
        layout="ddb"
      />
    ) : (
      <Portrait
        tier="hero"
        frameless
        imageSrc={popupPortraitSrc}
        initials={
          popupPortraitSrc ? undefined : live.name.trim().slice(0, 2).toUpperCase() || "?"
        }
        alt={live.name}
        focus={portraitFocus ?? undefined}
        imgW={offlinePopupPortraitSize.w}
        imgH={offlinePopupPortraitSize.h}
        className="portrait--ddb"
      />
    );

    const toolbarNode =
      !hidePdfExport || showEditRequest ? (
        <>
          {showEditRequest && adventureId ? (
            <SheetEditRequestButton
              characterId={character.id}
              adventureId={adventureId}
              roomId={inRoom ? roomId : undefined}
              variant={popupToolbarDrag || isStandalonePopup ? "ddb-toolbar" : "inline"}
            />
          ) : null}
          {!hidePdfExport ? (
            <SheetPdfExportButton
              character={live}
              inventory={inventory}
              characterId={character.id}
              roomId={inRoom ? roomId : undefined}
              variant={popupToolbarDrag || isStandalonePopup ? "ddb-toolbar" : "default"}
              compact={!!popupToolbarDrag || isStandalonePopup}
            />
          ) : null}
        </>
      ) : null;

    return (
      <>
        <SheetPopupDdbView
          character={live}
          displayDefesa={displayDefesa}
          profBonus={prof}
          hpPct={hpPct}
          portrait={portraitNode}
          toolbar={toolbarNode}
          toolbarLeading={popupToolbarLeading}
          toolbarTrailing={popupToolbarTrailing}
          toolbarDrag={popupToolbarDrag}
          standalone={isStandalonePopup}
          inRoom={inRoom}
          roomId={roomId}
          onRoll={refresh}
          loadout={
            canEdit ? (
              <SheetPopupLoadoutBar
                actor={live}
                inventory={inventory}
                canEdit={canEdit}
                onSaved={inRoom ? refresh : () => undefined}
                savePatch={saveLoadoutPatch}
                eyebrow={inRoom ? "Em uso na mesa" : "Equipamento ativo"}
              />
            ) : null
          }
          drawer={
            <SheetDdbDrawer manage={managePanel}>{tabPanel}</SheetDdbDrawer>
          }
        />

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
      </>
    );
  }

  return (
    <div className={`sheet-shell ${embedded ? "sheet-embedded" : ""}`}>
      <CharacterSheetCover
        name={live.name}
        identity={identity}
        portraitUrl={live.portraitUrl}
        portraitFocus={live.portraitFocus}
      />

      <OrnamentCard className="sheet-sidebar">{sidebarTools}</OrnamentCard>

      <OrnamentCard className="sheet-panel sheet-main">{tabPanel}</OrnamentCard>

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
  showDetail = false,
  onSelect,
  onRemove,
}: {
  entry: CompendiumEntry;
  quantity: number;
  canEdit: boolean;
  selected?: boolean;
  showDetail?: boolean;
  onSelect?: () => void;
  onRemove: () => void;
}) {
  const color = compendiumTypeColor(entry.type);
  const tags = entrySummary(entry.system, entry.type);
  const descriptionHtml = entryDescriptionHtml(entry.system);
  const descriptionText = stripHtml(descriptionHtml);
  const { catalogId, bookRef } = entryBookRef(entry.system);

  return (
    <li
      className={`inv-row${selected ? " inv-row--selected" : ""}${showDetail ? " inv-row--detail" : ""}`}
      role={canEdit ? "button" : undefined}
      tabIndex={canEdit ? 0 : undefined}
      onClick={canEdit ? onSelect : undefined}
      onKeyDown={
        canEdit
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect?.();
                return;
              }
              if (e.key === "Delete" || e.key === "Backspace") {
                e.preventDefault();
                e.stopPropagation();
                onRemove();
              }
            }
          : undefined
      }
    >
      <CompendiumIcon entry={entry} color={color} className="inv-icon" />
      <div className="inv-row__body">
        <h4>{entry.name}</h4>
        <p className="inv-row__tags">{tags.slice(0, 4).join(" · ")}</p>
        {showDetail && descriptionText ? (
          <p className="inv-row__desc">{descriptionText}</p>
        ) : null}
        {showDetail && (catalogId || bookRef) ? (
          <p className="inv-row__ref">
            {catalogId ? <span className="inv-row__ref-id">{catalogId}</span> : null}
            {catalogId && bookRef ? " · " : null}
            {bookRef ? <span className="inv-row__ref-book">{bookRef}</span> : null}
          </p>
        ) : null}
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
                <span className="picker-item__main">
                  <CompendiumIcon entry={entry} color={compendiumTypeColor(entry.type)} className="inv-icon" />
                  <span>{entry.name}</span>
                </span>
                <span className="inv-type">{entry.type}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
