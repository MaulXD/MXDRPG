"use client";

import { useState, type ComponentType } from "react";
import {
  IconEye,
  IconLightning,
  IconSearch,
  IconTemple,
} from "@/components/character/SheetPopupIcons";
import { WizardHoverTip } from "@/components/character/wizard/WizardHoverTip";
import { religionDisplayName } from "@/lib/character/pantheon";
import { religionBonusTooltip } from "@/lib/character/religion-tooltips";
import { buildSheetQuickSkills, type SheetQuickSkill } from "@/lib/character/sheet-skills";
import type { CharacterSheet } from "@/lib/character/types";
import { postRoomChat } from "@/hooks/useRoomSync";

type Props = {
  actor: CharacterSheet;
  roomId?: string;
  onRoll?: () => void;
};

const SKILL_ICONS: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  percepcao: IconEye,
  investigacao: IconSearch,
  iniciativa: IconLightning,
  religiao: IconTemple,
};

function skillTip(skill: SheetQuickSkill): string {
  const trained = skill.trained ? "treinada" : "não treinada";
  if (skill.passive != null) {
    return `${skill.def.label} (${trained}) — passiva ${skill.passive} · rolagem ${skill.rollFormula}`;
  }
  return `${skill.def.label} (${trained}) — ${skill.rollFormula}`;
}

export function SheetPopupQuickBar({ actor, roomId, onRoll }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const skills = buildSheetQuickSkills(actor);
  const religiao = actor.identity.religiao;
  const religionName = religiao ? religionDisplayName(religiao) : "Sem deus";
  const religionTip = religiao ? religionBonusTooltip(religiao) : "Sem bônus de devotion";

  async function rollSkill(skill: SheetQuickSkill) {
    if (!roomId) return;
    setBusy(skill.def.id);
    try {
      const label = skill.passive != null ? `${skill.def.label} (passiva ${skill.passive})` : skill.def.label;
      await postRoomChat(roomId, {
        kind: "roll",
        formula: skill.rollFormula,
        text: `${actor.name} — ${label}`,
      });
      onRoll?.();
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="sheet-popup-quickbar" aria-label="Perícias e ações rápidas">
      <p className="sheet-popup-quickbar__eyebrow">Ações rápidas</p>
      <div className="sheet-popup-quickbar__row">
        {skills.map((skill) => {
          const Icon = SKILL_ICONS[skill.def.id] ?? IconEye;
          return (
            <WizardHoverTip key={skill.def.id} text={skillTip(skill)}>
              <button
                type="button"
                className={`sheet-popup-quickbtn ${skill.trained ? "is-trained" : ""}`}
                disabled={!roomId || busy === skill.def.id}
                onClick={() => void rollSkill(skill)}
                title={skill.def.label}
              >
                <Icon size={17} className="sheet-popup-quickbtn__icon" />
                <span className="sheet-popup-quickbtn__label">{skill.def.short}</span>
                <strong className="sheet-popup-quickbtn__mod">
                  {skill.passive != null ? skill.passive : skill.display}
                </strong>
              </button>
            </WizardHoverTip>
          );
        })}

        <WizardHoverTip text={religionTip}>
          <div className="sheet-popup-quickbtn sheet-popup-quickbtn--religion" title="Devotion">
            <IconTemple size={17} className="sheet-popup-quickbtn__icon" />
            <span className="sheet-popup-quickbtn__label">Religião</span>
            <strong className="sheet-popup-quickbtn__mod sheet-popup-quickbtn__mod--text">
              {religionName}
            </strong>
          </div>
        </WizardHoverTip>
      </div>
    </section>
  );
}
