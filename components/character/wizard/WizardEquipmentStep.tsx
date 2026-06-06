"use client";

import { useEffect } from "react";
import {
  describeStarterKit,
  getDefaultStarterKitId,
  getStarterOptionsForClass,
  previewStarterDefesa,
  STARTING_PO,
  type StarterKitOption,
} from "@/lib/character/starter-kits";
import type { CharacterAttributes } from "@/lib/character/types";
import { attributeMod } from "@/lib/character/rules";
import { getEntry } from "@/lib/compendium/registry";

type Props = {
  classe: string;
  attributes: CharacterAttributes;
  starterKitId: string;
  onChange: (kitId: string) => void;
};

function kitWeaponLabel(kit: StarterKitOption): string {
  if (!kit.combatLoadout) return "Sem arma principal";
  const entry = getEntry(kit.combatLoadout.packId, kit.combatLoadout.entryId);
  return entry?.name ?? "Arma";
}

function kitArmorLabel(kit: StarterKitOption): string {
  if (!kit.armorLoadout?.entryId) return "Sem armadura (10 + DES)";
  const entry = getEntry("equipamentos", kit.armorLoadout.entryId);
  return entry?.name ?? "Armadura";
}

export function WizardEquipmentStep({ classe, attributes, starterKitId, onChange }: Props) {
  const options = getStarterOptionsForClass(classe);
  const desMod = attributeMod(attributes.destreza);
  const activeId = options.some((o) => o.id === starterKitId)
    ? starterKitId
    : getDefaultStarterKitId(classe);

  useEffect(() => {
    if (!options.some((o) => o.id === starterKitId)) {
      onChange(getDefaultStarterKitId(classe));
    }
  }, [classe, starterKitId, onChange]);

  return (
    <>
      <p className="char-wizard-meta" style={{ marginBottom: "0.65rem" }}>
        Escolha um kit de acordo com as proficiências da sua classe. Você também recebe kit de
        trinchar, tocha, corda e <strong>{STARTING_PO} PO</strong> para compras na masmorra.
      </p>
      <div className="char-wizard-pick-grid char-wizard-pick-grid--wide" role="listbox" aria-label="Kit inicial">
        {options.map((kit) => {
          const ca = previewStarterDefesa(attributes, kit);
          const selected = activeId === kit.id;
          return (
            <button
              key={kit.id}
              type="button"
              role="option"
              aria-selected={selected}
              className={`char-wizard-pick ${selected ? "char-wizard-pick--on" : ""}`}
              onClick={() => onChange(kit.id)}
            >
              <div style={{ display: "flex", width: "100%", alignItems: "flex-start" }}>
                <span className="char-wizard-pick__icon" aria-hidden>
                  ⚔
                </span>
                <span className="char-wizard-pick__check" aria-hidden>
                  ✓
                </span>
              </div>
              <strong>{kit.label}</strong>
              <span>{kit.summary}</span>
              <span>
                {kitWeaponLabel(kit)} · {kitArmorLabel(kit)}
              </span>
              <span>
                CA estimada <strong>{ca}</strong>
                {!kit.armorLoadout ? ` (10 + DES ${desMod >= 0 ? "+" : ""}${desMod})` : null}
              </span>
              <span className="char-wizard-pick__detail">{describeStarterKit(kit)}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
