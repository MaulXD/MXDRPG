"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CharacterSheet as CharacterSheetData, InventoryItem } from "@/lib/character/types";
import { formatXpProgress } from "@/lib/character/xp";
import { loadInventory, newInstanceId, saveInventory } from "@/lib/character/inventory-storage";
import type { CompendiumEntry, CompendiumPackId } from "@/lib/compendium/types";
import { CompendiumIcon } from "@/components/compendium/CompendiumIcon";
import { entryBookRef, entryDescriptionHtml, entrySummary, stripHtml } from "@/lib/compendium/format";
import { compendiumTypeColor } from "@/lib/compendium/icons";
import { isConsumableEntry } from "@/lib/compendium/consumables";
import { getEntry } from "@/lib/compendium/registry";
import { useImageNaturalSize } from "@/hooks/useImageNaturalSize";
import { patchRoomActor, useRoomSync } from "@/hooks/useRoomSync";
import {
  mergePortraitPatchIntoSnapshot,
  type RoomActorPatchResult,
} from "@/lib/character/portrait-persist-client";
import { firstPortraitDataUrl } from "@/lib/room/portrait-sync";
import { CharacterSheetCover } from "@/components/character/CharacterSheetCover";
import { PortraitEditorFields } from "@/components/character/PortraitEditorFields";
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
import { SpellPrepPanel } from "@/components/character/SpellPrepPanel";
import { LootEconomyPanel } from "@/components/character/LootEconomyPanel";
import {
  SheetPopupLoadoutBar,
  type LoadoutPatch,
} from "@/components/character/SheetPopupLoadoutBar";
import { SheetPopupPortrait } from "@/components/character/SheetPopupPortrait";
import { SheetPopupDdbView } from "@/components/character/SheetPopupDdbView";
import { SheetPopupV2View, type SheetV2TabId } from "@/components/character/SheetPopupV2View";
import { SheetFichaOverview } from "@/components/character/SheetFichaOverview";
import { SheetDdbDrawer } from "@/components/character/SheetDdbDrawer";
import { SheetDdbManagePanel } from "@/components/character/SheetDdbManagePanel";
import { SheetHoverTip } from "@/components/character/SheetHoverTip";
import { compendiumEntryTip } from "@/lib/character/sheet-tooltips";
import { PersonalBestiaryPanel } from "@/components/character/PersonalBestiaryPanel";
import {
  IconArmor,
  IconBackpack,
  IconBestiary,
  IconCoins,
  IconLightning,
  IconShield,
  IconSword,
  IconUser,
  IconWand,
} from "@/components/character/SheetPopupIcons";
import { IconFlask, IconHourglass } from "@/components/ui/EldarinIcons";
import { resolveActorDefesa } from "@/lib/character/armor-defense";
import {
  ATTRIBUTE_LABELS,
  attributeMod,
  proficiencyBonus,
  type AttributeKey,
} from "@/lib/character/rules";
import { SheetPdfExportButton } from "@/components/character/SheetPdfExportButton";
import { SheetEditRequestButton } from "@/components/character/SheetEditRequestButton";
import {
  usePlayerInventoryNotifications,
  usePlayerInventoryRequests,
} from "@/hooks/useInventoryItemRequest";
import { normalizeLegacyConsumables } from "@/lib/character/inventory-normalize";
import { inventoryRequestLabel } from "@/lib/character/inventory-item-request";
import { useSheetPdfDeepLink } from "@/hooks/useSheetPdfDeepLink";
import { OrnamentCard } from "@/components/ui/OrnamentCard";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { Portrait } from "@/components/vtt/Portrait";
import type { PortraitBundle } from "@/lib/media/image-upload-client";
import {
  patchCharacterRecord,
  persistInventoryToCharacter,
  persistLootEconomyToCharacter,
} from "@/lib/character/character-persist-client";
import { persistPortraitBundleToCharacter } from "@/lib/character/portrait-persist-client";
import type { IdentityPatch } from "@/lib/character/identity";
import type { LevelUpChoices } from "@/lib/character/level-up";
import type { CombatLoadout } from "@/lib/combat/types";
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
  /** Inventário: edição direta, solicitar ao mestre, ou somente leitura */
  inventoryEditMode?: "direct" | "request" | "readonly";
  /** Toolbar DDB — aviso à esquerda (ex.: somente leitura) */
  popupToolbarLeading?: ReactNode;
  /** Toolbar DDB — fechar, abrir página, etc. */
  popupToolbarTrailing?: ReactNode;
  /** Arrastar janela Foundry pela toolbar */
  popupToolbarDrag?: FoundryWindowDragHandlers;
  /** Ficha DDB em /personagem/:id (sem moldura Foundry) */
  standalonePage?: boolean;
  /** Popup: layout DDB (padrão) ou V2 estilo Foundry com abas laterais */
  popupLayout?: "ddb" | "v2";
  /** Mesa VTT — aplica retrato no snapshot compartilhado (mapa + ficha) */
  onRoomPortraitPatch?: (result: RoomActorPatchResult) => void;
};

const PLAYER_PACKS: CompendiumPackId[] = [
  "armas",
  "habilidades",
  "magias",
  "equipamentos",
  "consumiveis",
];

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
  inventoryEditMode: inventoryEditModeProp,
  popupToolbarLeading,
  popupToolbarTrailing,
  popupToolbarDrag,
  standalonePage = false,
  popupLayout = "ddb",
  onRoomPortraitPatch,
}: Props) {
  const canEditPortrait = canEditPortraitProp ?? canEdit;
  const inventoryEditMode =
    inventoryEditModeProp ?? (canEdit ? "direct" : "readonly");
  const canEditInventory = inventoryEditMode === "direct";
  const canRequestInventory = inventoryEditMode === "request";
  const canPickCompendium = canEditInventory || canRequestInventory;
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("inventário");
  const [v2Tab, setV2Tab] = useState<SheetV2TabId>("ficha");
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
    inventory: roomActor?.inventory?.length
      ? roomActor.inventory
      : (sheetBase.inventory ?? character.inventory),
    combatLoadout:
      roomActor?.combatLoadout ??
      sheetBase.combatLoadout ??
      character.combatLoadout ??
      null,
    armorLoadout:
      roomActor?.armorLoadout ??
      sheetBase.armorLoadout ??
      character.armorLoadout ??
      null,
    preparedSpellIds:
      roomActor?.preparedSpellIds ??
      sheetBase.preparedSpellIds ??
      character.preparedSpellIds,
  };
  const inRoom = Boolean(roomActor);
  const mesaPopup = variant === "popup" && roomId !== "demo";
  const portraitOnRoom = mesaPopup || inRoom;

  useEffect(() => {
    setLocalSheet(null);
  }, [
    character.id,
    character.combatLoadout,
    character.armorLoadout,
    character.inventory,
    character.lootEconomy,
    character.tactical?.defesa,
  ]);

  useEffect(() => {
    const seed = inRoom && roomActor?.inventory?.length
      ? roomActor.inventory
      : (sheetBase.inventory ?? character.inventory);
    setInventory(loadInventory(character.id, seed));
  }, [character.id, character.inventory, inRoom, roomActor?.inventory, sheetBase.inventory]);

  const [inventoryMsg, setInventoryMsg] = useState<string | null>(null);
  const inventoryRequestEnabled = canRequestInventory && Boolean(adventureId);
  const { requests: pendingInventoryRequests, refresh: refreshPendingInventory } =
    usePlayerInventoryRequests(character.id, inventoryRequestEnabled);
  const { requests: inventoryNotifications } = usePlayerInventoryNotifications(
    adventureId,
    inventoryRequestEnabled
  );
  const processedApprovedInventoryRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const newlyApproved = inventoryNotifications.filter(
      (r) =>
        r.characterId === character.id &&
        r.status === "approved" &&
        !processedApprovedInventoryRef.current.has(r.id)
    );
    if (!newlyApproved.length) return;
    newlyApproved.forEach((r) => processedApprovedInventoryRef.current.add(r.id));

    void (async () => {
      if (inRoom) {
        await refresh();
        return;
      }
      const res = await fetch(`/api/characters/${character.id}`, { credentials: "same-origin" });
      if (!res.ok) return;
      const data = (await res.json()) as { character?: CharacterSheetData };
      if (!data.character?.inventory) return;
      const normalized = normalizeLegacyConsumables(data.character.inventory);
      setInventory(loadInventory(character.id, normalized));
      saveInventory(character.id, normalized);
      setLocalSheet(data.character);
    })();
  }, [inventoryNotifications, character.id, inRoom, refresh]);

  const persistInventory = useCallback(
    (items: InventoryItem[]) => {
      setInventory(items);
      saveInventory(character.id, items);
      setInventoryMsg(null);
      void (async () => {
        try {
          if (inRoom) {
            await patchRoomActor(roomId, character.id, { inventory: items });
            await refresh();
            return;
          }
          const data = await persistInventoryToCharacter(character.id, items);
          if (data.character) {
            setLocalSheet(data.character);
            saveInventory(character.id, data.character.inventory);
          }
        } catch (e) {
          setInventoryMsg(e instanceof Error ? e.message : "Falha ao salvar inventário");
        }
      })();
    },
    [character.id, inRoom, roomId, refresh]
  );

  const persistLootEconomy = useCallback(
    async (loot: NonNullable<CharacterSheetData["lootEconomy"]>) => {
      const data = await persistLootEconomyToCharacter(character.id, loot);
      if (data.character) {
        setLocalSheet(data.character);
      }
    },
    [character.id]
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

  const applyCharacterResponse = useCallback((data: { character?: CharacterSheetData }) => {
    if (data.character) {
      setLocalSheet(data.character);
      return;
    }
  }, []);

  const patchCharacterApi = useCallback(
    async (body: Record<string, unknown>) => {
      const data = await patchCharacterRecord(character.id, body);
      applyCharacterResponse(data);
      return data;
    },
    [applyCharacterResponse, character.id]
  );

  const applyLocalPortraitFromActor = useCallback(
    (actor: RoomActorPatchResult["actor"]) => {
      setLocalSheet((prev) => ({
        ...(prev ?? character),
        portraitUrl: actor.portraitUrl,
        tokenImageUrl: actor.tokenImageUrl,
        portraitFocus: actor.portraitFocus,
        coverFocus: actor.coverFocus,
        tokenFocus: actor.tokenFocus,
      }));
    },
    [character]
  );

  const applyRoomPortraitPatch = useCallback(
    (result: RoomActorPatchResult) => {
      if (onRoomPortraitPatch) {
        onRoomPortraitPatch(result);
      } else if (snapshot) {
        applySnapshot(mergePortraitPatchIntoSnapshot(snapshot, result));
      } else {
        void refresh();
      }
      applyLocalPortraitFromActor(result.actor);
    },
    [applyLocalPortraitFromActor, applySnapshot, onRoomPortraitPatch, refresh, snapshot]
  );

  const persistPortraitBundle = useCallback(
    async (bundle: PortraitBundle) => {
      const data = await persistPortraitBundleToCharacter(character.id, bundle);
      applyCharacterResponse(data);
      if (!data.character) {
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
    [applyCharacterResponse, character]
  );

  const persistIdentityPatch = useCallback(
    async (patch: IdentityPatch) => {
      await patchCharacterApi({ identityPatch: patch });
    },
    [patchCharacterApi]
  );

  const levelUpCharacter = useCallback(
    async (choices: LevelUpChoices) => {
      const res = await fetch(`/api/characters/${character.id}/level-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(choices),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? `Erro ${res.status}`);
      }
      const data = (await res.json()) as { character?: CharacterSheetData };
      applyCharacterResponse(data);
    },
    [applyCharacterResponse, character.id]
  );

  const persistCombatLoadout = useCallback(
    async (loadout: CombatLoadout) => {
      await patchCharacterApi({ combatLoadout: loadout });
    },
    [patchCharacterApi]
  );

  const levelUpControl = canEdit ? (
    <LevelUpWizard
      actor={live}
      theme="ddb"
      roomId={inRoom ? roomId : undefined}
      canEdit={canEdit}
      onDone={inRoom ? refresh : () => router.refresh()}
      onApplied={
        inRoom
          ? (patch) => {
              if (!snapshot) return;
              applySnapshot({
                ...snapshot,
                actors: { ...snapshot.actors, [patch.actor.id]: patch.actor },
                scene: patch.scene,
                revision: patch.revision,
              });
            }
          : undefined
      }
      onLevelUp={!inRoom ? levelUpCharacter : undefined}
    />
  ) : null;

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
    const consumables = filtered.filter((r) => isConsumableEntry(r.entry));
    const gear = filtered.filter(
      (r) => r.entry.type === "equipamento" && !isConsumableEntry(r.entry)
    );
    const other = filtered.filter(
      (r) =>
        r.entry.type !== "arma" &&
        r.entry.type !== "equipamento" &&
        !isConsumableEntry(r.entry)
    );
    if (weapons.length) {
      sections.push({ id: "armas", label: "Armas", hint: "Corpo a corpo e à distância", items: weapons });
    }
    if (consumables.length) {
      sections.push({
        id: "consumiveis",
        label: "Consumíveis",
        hint: "Poções e elixires — use no anel de ações em combate",
        items: consumables,
      });
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


  async function addFromCompendium(entry: CompendiumEntry) {
    if (canRequestInventory) {
      if (!adventureId) {
        setInventoryMsg("Aventura não identificada para solicitar item");
        return;
      }
      setInventoryMsg(null);
      try {
        const res = await fetch(`/api/characters/${character.id}/inventory-request`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            packId: entry.packId,
            entryId: entry.id,
            adventureId,
            roomId: inRoom ? roomId : undefined,
            quantity: 1,
          }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          throw new Error(data.error ?? `Erro ${res.status}`);
        }
        setInventoryMsg(`Solicitação enviada ao mestre: ${entry.name}`);
        await refreshPendingInventory();
      } catch (e) {
        setInventoryMsg(e instanceof Error ? e.message : "Falha ao solicitar item");
      }
      setPickerOpen(false);
      return;
    }

    const existing = inventory.find((i) => i.packId === entry.packId && i.entryId === entry.id);
    if (existing) {
      persistInventory(
        inventory.map((i) =>
          i.instanceId === existing.instanceId ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      persistInventory([
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
    persistInventory(inventory.filter((i) => i.instanceId !== instanceId));
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
      if (!canEditInventory || tab === "tesouro" || tab === "bestiário" || pickerOpen) return;
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
  }, [canEditInventory, tab, pickerOpen, selectedInvId, filtered, inventory]);

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
    consumiveis: <IconFlask size={18} className="inv-section__icon" />,
    equipamentos: <IconArmor size={18} className="inv-section__icon" />,
    outros: <IconBackpack size={18} className="inv-section__icon" />,
  };

  const tabStrip = (
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
  );

  const tabBody = (
    <>
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
        {canPickCompendium && tab !== "tesouro" && tab !== "bestiário" ? (
          <div className="sheet-toolbar__actions">
            {tab === "inventário" ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setPickerPack("consumiveis");
                  setPickerOpen(true);
                }}
              >
                + Consumível
              </button>
            ) : null}
            <button
              type="button"
              className="btn"
              onClick={() => {
                if (tab === "habilidades") setPickerPack("habilidades");
                else if (tab === "magias") setPickerPack("magias");
                else setPickerPack("armas");
                setPickerOpen(true);
              }}
            >
              + Compêndio
            </button>
          </div>
        ) : null}
      </div>

      {inventoryMsg ? (
        <p className="sheet-inventory-msg" role="status">
          {inventoryMsg}
        </p>
      ) : null}

      {canRequestInventory && pendingInventoryRequests.length > 0 ? (
        <div className="sheet-inventory-pending sheet-inventory-pending--active" role="status">
          <p className="sheet-inventory-pending__title">
            <IconHourglass size={14} className="sheet-inventory-pending__icon" aria-hidden />
            Aguardando aprovação do mestre
          </p>
          <ul className="sheet-inventory-pending__list">
            {pendingInventoryRequests.map((r) => (
              <li key={r.id}>{inventoryRequestLabel(r)}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {tab === "tesouro" ? (
        <LootEconomyPanel
          characterId={character.id}
          seed={live.lootEconomy ?? character.lootEconomy}
          canEdit={canEdit}
          onPersist={!inRoom ? persistLootEconomy : undefined}
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
          {canPickCompendium
            ? canRequestInventory
              ? " Use + Compêndio para solicitar itens ao mestre."
              : " Use + Compêndio para adicionar."
            : null}
        </div>
      ) : tab === "magias" ? (
        <SpellPrepPanel
          actor={live}
          spells={filtered}
          canEdit={canEdit}
          roomId={inRoom ? roomId : undefined}
          onSaved={() => void refresh()}
          onPersistLocal={
            !inRoom
              ? (next) => {
                  void patchCharacterApi({ preparedSpellIds: next }).then(() => {
                    setLocalSheet((prev) => ({
                      ...(prev ?? character),
                      preparedSpellIds: next,
                    }));
                  });
                }
              : undefined
          }
        />
      ) : (
        <>
          {canEditInventory && filtered.length > 0 ? (
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
                        canEdit={canEditInventory}
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
                  canEdit={canEditInventory}
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

  const tabPanel = (
    <>
      {tabStrip}
      {tabBody}
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

      {levelUpControl}

      {canEditPortrait && !isPopup ? (
        inRoom ? (
          <PortraitEditorFields
            mode="room"
            roomId={roomId}
            actorId={character.id}
            portraitUrl={live.portraitUrl}
            portraitFocus={live.portraitFocus}
            coverFocus={live.coverFocus}
            tokenFocus={live.tokenFocus}
            tokenImageUrl={live.tokenImageUrl}
            canEdit={canEditPortrait}
            onSaved={refresh}
            onRoomPortraitSaved={applyRoomPortraitPatch}
          />
        ) : (
          <PortraitEditorFields
            mode="character"
            characterId={character.id}
            portraitUrl={live.portraitUrl ?? character.portraitUrl}
            portraitFocus={live.portraitFocus ?? character.portraitFocus}
            coverFocus={live.coverFocus ?? character.coverFocus}
            tokenFocus={live.tokenFocus ?? character.tokenFocus}
            tokenImageUrl={live.tokenImageUrl ?? character.tokenImageUrl}
            canEdit={canEditPortrait}
          />
        )
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

      {canEdit ? (
        <CombatLoadoutPanel
          actor={live}
          roomId={inRoom ? roomId : undefined}
          canEdit={canEdit}
          onSaved={inRoom ? refresh : () => router.refresh()}
          onSaveLoadout={!inRoom ? persistCombatLoadout : undefined}
        />
      ) : null}

      {canEdit ? (
        <CharacterIdentityEditor
          actor={live}
          roomId={inRoom ? roomId : undefined}
          canEdit={canEdit}
          onSaved={inRoom ? refresh : () => router.refresh()}
          onSaveIdentity={!inRoom ? persistIdentityPatch : undefined}
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
          onRefresh={inRoom ? refresh : () => router.refresh()}
          onSaveIdentity={!inRoom ? persistIdentityPatch : undefined}
          onSaveCombatLoadout={!inRoom ? persistCombatLoadout : undefined}
        />
      ) : null;

    const portraitNode = canEditPortrait ? (
      <SheetPopupPortrait
        actorId={character.id}
        roomId={portraitOnRoom ? roomId : undefined}
        name={live.name}
        portraitUrl={live.portraitUrl ?? character.portraitUrl}
        tokenImageUrl={live.tokenImageUrl ?? character.tokenImageUrl}
        portraitFocus={live.portraitFocus ?? character.portraitFocus}
        tokenFocus={live.tokenFocus ?? character.tokenFocus}
        canEdit={canEditPortrait}
        onSaved={portraitOnRoom ? () => undefined : () => router.refresh()}
        onRoomPortraitSaved={portraitOnRoom ? applyRoomPortraitPatch : undefined}
        onPersistBundle={portraitOnRoom ? undefined : persistPortraitBundle}
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
          progression={levelUpControl}
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
  const tip = compendiumEntryTip(entry);

  const rowBody = (
    <>
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
    </>
  );

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
      <SheetHoverTip tip={tip} className="inv-row__tip">
        <div className="inv-row__hit" tabIndex={0}>
          {rowBody}
        </div>
      </SheetHoverTip>
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
    consumiveis: "Consumíveis",
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
