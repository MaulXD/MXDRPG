"use client";

import { IconCheck, IconSword } from "@/components/ui/EldarinIcons";

import { useEffect, useMemo } from "react";
import {
  describeStarterEquipment,
  findMatchingStarterKitId,
  getDefaultStarterKitId,
  getStarterEquipmentPools,
  getStarterOptionsForClass,
  loadoutDraftFromKit,
  previewEquipmentDefesa,
  STARTING_PO,
  type StarterEquipmentDraft,
  type StarterKitOption,
} from "@/lib/character/starter-kits";
import type { CharacterAttributes } from "@/lib/character/types";
import { attributeMod } from "@/lib/character/rules";
import { entryTooltipText } from "@/lib/compendium/format";
import { getEntry } from "@/lib/compendium/registry";
import type { CompendiumPackId } from "@/lib/compendium/types";
import type { CombatLoadout } from "@/lib/combat/types";
import { WizardHoverTip } from "@/components/character/wizard/WizardHoverTip";

type Props = {
  classe: string;
  attributes: CharacterAttributes;
  starterKitId: string;
  equipment: StarterEquipmentDraft;
  onChange: (patch: { starterKitId: string; starterEquipment: StarterEquipmentDraft }) => void;
};

function combatLabel(loadout: CombatLoadout): string {
  const entry = getEntry(loadout.packId, loadout.entryId);
  return entry?.name ?? "Combate";
}

function entryLabel(
  packId: "equipamentos" | "magias" | "armas",
  entryId: string
): string {
  const entry = getEntry(packId, entryId);
  return entry?.name ?? entryId;
}

function entryTooltip(packId: CompendiumPackId, entryId: string): string | undefined {
  const entry = getEntry(packId, entryId);
  if (!entry) return undefined;
  const text = entryTooltipText(entry.system, entry.type, entry.name);
  return text || undefined;
}

function loadoutTooltip(loadout: CombatLoadout): string | undefined {
  const pack = loadout.packId as CompendiumPackId;
  if (pack !== "armas" && pack !== "magias" && pack !== "habilidades") return undefined;
  return entryTooltip(pack, loadout.entryId);
}

function toggleId(ids: string[], entryId: string, on: boolean): string[] {
  if (on) return ids.includes(entryId) ? ids : [...ids, entryId];
  return ids.filter((id) => id !== entryId);
}

function syncSpellsForCombat(
  equipment: StarterEquipmentDraft,
  combatLoadout: CombatLoadout | null
): string[] {
  let spells = [...equipment.spellEntryIds];
  if (combatLoadout?.packId === "magias") {
    if (!spells.includes(combatLoadout.entryId)) {
      spells = [...spells, combatLoadout.entryId];
    }
  }
  return spells;
}

function applyEquipment(
  classe: string,
  equipment: StarterEquipmentDraft,
  onChange: Props["onChange"]
) {
  const matchedKitId = findMatchingStarterKitId(classe, equipment);
  onChange({
    starterKitId: matchedKitId ?? "",
    starterEquipment: equipment,
  });
}

export function WizardEquipmentStep({
  classe,
  attributes,
  starterKitId,
  equipment,
  onChange,
}: Props) {
  const options = getStarterOptionsForClass(classe);
  const pools = useMemo(() => getStarterEquipmentPools(classe), [classe]);
  const desMod = attributeMod(attributes.destreza);
  const ca = previewEquipmentDefesa(attributes, equipment);
  const matchedKitId = findMatchingStarterKitId(classe, equipment);
  const highlightedPresetId = matchedKitId || starterKitId;

  useEffect(() => {
    if (!pools.combatOptions.length) return;
    const combatValid =
      equipment.combatLoadout &&
      pools.combatOptions.some(
        (o) =>
          o.packId === equipment.combatLoadout?.packId &&
          o.entryId === equipment.combatLoadout?.entryId
      );
    if (!combatValid) {
      const fallback = pools.combatOptions[0];
      const next: StarterEquipmentDraft = {
        ...equipment,
        combatLoadout: fallback,
        spellEntryIds: syncSpellsForCombat(equipment, fallback),
      };
      applyEquipment(classe, next, onChange);
    }
  }, [classe, equipment, onChange, pools.combatOptions]);

  const applyPreset = (kit: StarterKitOption) => {
    onChange({
      starterKitId: kit.id,
      starterEquipment: loadoutDraftFromKit(kit),
    });
  };

  return (
    <>
      <p className="char-wizard-meta" style={{ marginBottom: "0.65rem" }}>
        Use um <strong>preset</strong> para preencher tudo de uma vez ou monte arma, armadura e
        magias separadamente. Todo personagem recebe kit de trinchar, tocha, corda e{" "}
        <strong>{STARTING_PO} PO</strong>.
      </p>

      <h3 className="char-wizard-equip-section-title">Presets rápidos</h3>
      <div className="char-wizard-pick-grid char-wizard-pick-grid--wide" role="listbox" aria-label="Kit inicial">
        {options.map((kit) => {
          const selected = highlightedPresetId === kit.id;
          const kitCa = previewEquipmentDefesa(attributes, loadoutDraftFromKit(kit));
          return (
            <button
              key={kit.id}
              type="button"
              role="option"
              aria-selected={selected}
              className={`char-wizard-pick ${selected ? "char-wizard-pick--on" : ""}`}
              onClick={() => applyPreset(kit)}
            >
              <div style={{ display: "flex", width: "100%", alignItems: "flex-start" }}>
                <span className="char-wizard-pick__icon" aria-hidden>
                  <IconSword size={18} />
                </span>
                <span className="char-wizard-pick__check" aria-hidden>
                  <IconCheck size={12} />
                </span>
              </div>
              <strong>{kit.label}</strong>
              <span>{kit.summary}</span>
              <span>
                CA estimada <strong>{kitCa}</strong>
              </span>
            </button>
          );
        })}
      </div>

      <h3 className="char-wizard-equip-section-title">Montar equipamento</h3>
      <p className="char-wizard-meta char-wizard-equip-hint">
        Itens disponíveis são os mesmos dos presets da sua classe. CA atual:{" "}
        <strong>{ca}</strong>
        {!equipment.armorEntryId ? ` (10 + DES ${desMod >= 0 ? "+" : ""}${desMod})` : null}
      </p>

      {pools.combatOptions.length > 0 ? (
        <div className="char-wizard-equip-block">
          <p className="char-wizard-equip-block__label">Arma ou magia principal</p>
          <div className="char-wizard-equip-chip-grid" role="listbox" aria-label="Arma principal">
            {pools.combatOptions.map((loadout) => {
              const selected =
                equipment.combatLoadout?.packId === loadout.packId &&
                equipment.combatLoadout?.entryId === loadout.entryId;
              return (
                <button
                  key={`${loadout.packId}:${loadout.entryId}`}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`char-wizard-equip-chip ${selected ? "char-wizard-equip-chip--on" : ""}`}
                  onClick={() => {
                    const next: StarterEquipmentDraft = {
                      ...equipment,
                      combatLoadout: loadout,
                      spellEntryIds: syncSpellsForCombat(equipment, loadout),
                    };
                    applyEquipment(classe, next, onChange);
                  }}
                >
                  <WizardHoverTip text={loadoutTooltip(loadout)}>
                    <span>{combatLabel(loadout)}</span>
                  </WizardHoverTip>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {pools.sideWeaponEntryIds.length > 0 ? (
        <div className="char-wizard-equip-block">
          <p className="char-wizard-equip-block__label">Arma reserva (inventário)</p>
          <div className="char-wizard-equip-chip-grid" role="listbox" aria-label="Arma reserva">
            <button
              type="button"
              role="option"
              aria-selected={!equipment.sideWeaponEntryId}
              className={`char-wizard-equip-chip ${!equipment.sideWeaponEntryId ? "char-wizard-equip-chip--on" : ""}`}
              onClick={() =>
                applyEquipment(classe, { ...equipment, sideWeaponEntryId: null }, onChange)
              }
            >
              Nenhuma
            </button>
            {pools.sideWeaponEntryIds.map((entryId) => {
              const selected = equipment.sideWeaponEntryId === entryId;
              return (
                <button
                  key={entryId}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`char-wizard-equip-chip ${selected ? "char-wizard-equip-chip--on" : ""}`}
                  onClick={() =>
                    applyEquipment(classe, { ...equipment, sideWeaponEntryId: entryId }, onChange)
                  }
                >
                  <WizardHoverTip text={entryTooltip("armas", entryId)}>
                    <span>{entryLabel("armas", entryId)}</span>
                  </WizardHoverTip>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="char-wizard-equip-block">
        <p className="char-wizard-equip-block__label">Armadura</p>
        <div className="char-wizard-equip-chip-grid" role="listbox" aria-label="Armadura">
          <button
            type="button"
            role="option"
            aria-selected={!equipment.armorEntryId}
            className={`char-wizard-equip-chip ${!equipment.armorEntryId ? "char-wizard-equip-chip--on" : ""}`}
            onClick={() =>
              applyEquipment(classe, { ...equipment, armorEntryId: null }, onChange)
            }
          >
            Sem armadura
          </button>
          {pools.armorEntryIds.map((entryId) => {
            const selected = equipment.armorEntryId === entryId;
            return (
              <button
                key={entryId}
                type="button"
                role="option"
                aria-selected={selected}
                className={`char-wizard-equip-chip ${selected ? "char-wizard-equip-chip--on" : ""}`}
                onClick={() =>
                  applyEquipment(classe, { ...equipment, armorEntryId: entryId }, onChange)
                }
              >
                <WizardHoverTip text={entryTooltip("equipamentos", entryId)}>
                  <span>{entryLabel("equipamentos", entryId)}</span>
                </WizardHoverTip>
              </button>
            );
          })}
        </div>
      </div>

      {pools.spellEntryIds.length > 0 ? (
        <div className="char-wizard-equip-block">
          <p className="char-wizard-equip-block__label">Magias no grimório</p>
          <div className="char-wizard-equip-check-grid">
            {pools.spellEntryIds.map((entryId) => {
              const isPrimary =
                equipment.combatLoadout?.packId === "magias" &&
                equipment.combatLoadout.entryId === entryId;
              const checked = equipment.spellEntryIds.includes(entryId);
              return (
                <label key={entryId} className="char-wizard-equip-check">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={isPrimary}
                    onChange={(e) => {
                      const next: StarterEquipmentDraft = {
                        ...equipment,
                        spellEntryIds: toggleId(
                          equipment.spellEntryIds,
                          entryId,
                          e.target.checked
                        ),
                      };
                      applyEquipment(classe, next, onChange);
                    }}
                  />
                  <WizardHoverTip text={entryTooltip("magias", entryId)}>
                    <span>
                      {entryLabel("magias", entryId)}
                      {isPrimary ? " (principal)" : null}
                    </span>
                  </WizardHoverTip>
                </label>
              );
            })}
          </div>
        </div>
      ) : null}

      {pools.extraEntryIds.length > 0 ? (
        <div className="char-wizard-equip-block">
          <p className="char-wizard-equip-block__label">Itens extras</p>
          <div className="char-wizard-equip-check-grid">
            {pools.extraEntryIds.map((entryId) => {
              const checked = equipment.extraEntryIds.includes(entryId);
              return (
                <label key={entryId} className="char-wizard-equip-check">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const next: StarterEquipmentDraft = {
                        ...equipment,
                        extraEntryIds: toggleId(
                          equipment.extraEntryIds,
                          entryId,
                          e.target.checked
                        ),
                      };
                      applyEquipment(classe, next, onChange);
                    }}
                  />
                  <WizardHoverTip text={entryTooltip("equipamentos", entryId)}>
                    <span>{entryLabel("equipamentos", entryId)}</span>
                  </WizardHoverTip>
                </label>
              );
            })}
          </div>
        </div>
      ) : null}

      <p className="char-wizard-meta char-wizard-equip-summary">
        <strong>Resumo:</strong> {describeStarterEquipment(equipment)}
        {matchedKitId ? null : " · montagem personalizada"}
      </p>
    </>
  );
}
