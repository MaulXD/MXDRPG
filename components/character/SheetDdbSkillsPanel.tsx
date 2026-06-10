"use client";

import { useState } from "react";
import { SheetHoverTip } from "@/components/character/SheetHoverTip";
import {
  buildSheetQuickSkills,
  buildSheetReligionSkill,
  type SheetQuickSkill,
} from "@/lib/character/sheet-skills";
import { skillQuickActionTip } from "@/lib/character/sheet-tooltips";
import { ATTRIBUTE_LABELS } from "@/lib/character/rules";
import type { CharacterSheet } from "@/lib/character/types";
import { postRoomChat } from "@/hooks/useRoomSync";

type Props = {
  actor: CharacterSheet;
  roomId?: string;
  onRoll?: () => void;
};

export function SheetDdbSkillsPanel({ actor, roomId, onRoll }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const skills: SheetQuickSkill[] = [
    ...buildSheetQuickSkills(actor),
    buildSheetReligionSkill(actor),
  ];

  async function rollSkill(skill: SheetQuickSkill) {
    if (!roomId) return;
    setBusy(skill.def.id);
    try {
      const label =
        skill.passive != null
          ? `${skill.def.label} (passiva ${skill.passive})`
          : skill.def.label;
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
    <section className="sheet-ddb-panel sheet-ddb-panel--skills" aria-label="Perícias">
      <header className="sheet-ddb-panel__head">
        <span className="sheet-ddb-panel__icon" aria-hidden>
          ◫
        </span>
        <h3>Perícias</h3>
      </header>
      <ul className="sheet-ddb-skill-list">
        {skills.map((skill) => {
          const tip = skillQuickActionTip(skill, actor.identity.nivel);
          const value = skill.passive != null ? skill.passive : skill.display;
          return (
            <li key={skill.def.id}>
              <SheetHoverTip tip={tip}>
                <button
                  type="button"
                  className={`sheet-ddb-skill${skill.trained ? " is-trained" : ""}`}
                  disabled={!roomId || busy === skill.def.id}
                  onClick={() => void rollSkill(skill)}
                  aria-label={`${skill.def.label} ${value}`}
                >
                  <span
                    className={`sheet-ddb-skill__dot${skill.trained ? " is-on" : ""}`}
                    aria-hidden
                  />
                  <span className="sheet-ddb-skill__attr">
                    {ATTRIBUTE_LABELS[skill.def.attr]}
                  </span>
                  <span className="sheet-ddb-skill__name">{skill.def.label}</span>
                  <strong className="sheet-ddb-skill__mod">{value}</strong>
                </button>
              </SheetHoverTip>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
