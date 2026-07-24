"use client";

import { useState } from "react";
import {
  ARMOUR_BY_ID,
  ATTRIBUTE_LABEL,
  CALLING_BY_ID,
  COMBAT_PROFICIENCY_LABEL,
  CULTURE_BY_ID,
  DISTINCTIVE_FEATURE_BY_ID,
  SHADOW_PATH_BY_ID,
  SHIELD_BY_ID,
  SKILLS,
  STANDARDS_OF_LIVING,
  STARTING_REWARDS,
  STARTING_VIRTUES,
  WEAPON_BY_ID,
} from "@/lib/character/um-anel/data";
import { rollTorCombatProficiencyCheck, rollTorSkillCheck } from "@/lib/character/um-anel/dice";
import { attributeTN } from "@/lib/character/um-anel/rules";
import type {
  TorCharacterSheet,
  TorCombatProficiencyId,
  TorResourcePatch,
  TorSkillId,
} from "@/lib/character/um-anel/types";
import "./tor-sheet.css";

type Props = {
  character: TorCharacterSheet;
  /** Mesa: habilita rolagem de dados e ajuste de recursos. Página solo: fica só leitura. */
  interactive?: boolean;
  onRoll?: (message: string) => void;
  onResourceChange?: (patch: TorResourcePatch) => void;
};

function Stepper({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number;
  max?: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="tor-sheet__resource tor-sheet__resource--stepper">
      <span>{label}</span>
      <div className="tor-sheet__stepper">
        <button type="button" onClick={() => onChange(Math.max(0, value - 1))} aria-label={`Diminuir ${label}`}>
          −
        </button>
        <strong>
          {value}
          {max !== undefined ? ` / ${max}` : ""}
        </strong>
        <button
          type="button"
          onClick={() => onChange(max !== undefined ? Math.min(max, value + 1) : value + 1)}
          aria-label={`Aumentar ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function TorCharacterSheetView({ character, interactive = false, onRoll, onResourceChange }: Props) {
  const culture = CULTURE_BY_ID[character.culture];
  const calling = CALLING_BY_ID[character.calling];
  const shadowPath = SHADOW_PATH_BY_ID[character.shadowPathId];
  const standard = STANDARDS_OF_LIVING.find((s) => s.id === character.standardOfLiving);
  const [lastRoll, setLastRoll] = useState<string | null>(null);

  const rewards = character.rewards.map((id) => STARTING_REWARDS.find((r) => r.id === id)).filter(Boolean);
  const virtues = character.virtues.map((id) => STARTING_VIRTUES.find((v) => v.id === id)).filter(Boolean);
  const features = character.distinctiveFeatures
    .map((id) => DISTINCTIVE_FEATURE_BY_ID[id.split(":")[0]!])
    .filter(Boolean);

  function rollSkill(skillId: TorSkillId) {
    const { message } = rollTorSkillCheck(character, skillId);
    setLastRoll(message);
    onRoll?.(message);
  }

  function rollCombat(profId: TorCombatProficiencyId) {
    const { message } = rollTorCombatProficiencyCheck(character, profId);
    setLastRoll(message);
    onRoll?.(message);
  }

  return (
    <div className="tor-sheet">
      <header className="tor-sheet__header">
        <div>
          <p className="tor-sheet__eyebrow">O Um Anel · {culture?.name}</p>
          <h1>{character.name}</h1>
          <p className="tor-sheet__sub">
            {calling?.name}
            {character.age ? ` · ${character.age} anos` : ""} · Padrão de Vida: {standard?.label}
          </p>
        </div>
      </header>

      {character.biography ? <p className="tor-sheet__bio">{character.biography}</p> : null}

      <section className="tor-sheet__resources">
        {interactive && onResourceChange ? (
          <>
            <Stepper
              label="Resistência"
              value={character.endurance.value}
              max={character.endurance.max}
              onChange={(v) => onResourceChange({ enduranceValue: v })}
            />
            <Stepper
              label="Esperança"
              value={character.hope.value}
              max={character.hope.max}
              onChange={(v) => onResourceChange({ hopeValue: v })}
            />
            <Stepper label="Sombra" value={character.shadow} onChange={(v) => onResourceChange({ shadow: v })} />
            <Stepper label="Fadiga" value={character.fatigue} onChange={(v) => onResourceChange({ fatigue: v })} />
          </>
        ) : (
          <>
            <div className="tor-sheet__resource">
              <span>Resistência</span>
              <strong>
                {character.endurance.value} / {character.endurance.max}
              </strong>
            </div>
            <div className="tor-sheet__resource">
              <span>Esperança</span>
              <strong>
                {character.hope.value} / {character.hope.max}
              </strong>
            </div>
            <div className="tor-sheet__resource">
              <span>Sombra</span>
              <strong>{character.shadow}</strong>
            </div>
            <div className="tor-sheet__resource">
              <span>Fadiga</span>
              <strong>{character.fatigue}</strong>
            </div>
          </>
        )}
        <div className="tor-sheet__resource">
          <span>Aparar</span>
          <strong>{character.parry + character.shieldParryBonus}</strong>
        </div>
        <div className="tor-sheet__resource">
          <span>Carga</span>
          <strong>{character.load}</strong>
        </div>
      </section>

      <section className="tor-sheet__conditions">
        {character.conditions.weary ? <span className="tor-sheet__pill">Cansado</span> : null}
        {character.conditions.miserable ? <span className="tor-sheet__pill">Deplorável</span> : null}
        {character.conditions.wounded ? <span className="tor-sheet__pill">Ferido</span> : null}
        {interactive && onResourceChange ? (
          <button
            type="button"
            className="tor-sheet__wound-toggle"
            onClick={() => onResourceChange({ wounded: !character.conditions.wounded })}
          >
            {character.conditions.wounded ? "Curar Ferimento" : "Marcar Ferido"}
          </button>
        ) : null}
      </section>

      {interactive && lastRoll ? <p className="tor-sheet__last-roll">{lastRoll}</p> : null}

      <section className="tor-sheet__attrs">
        {(["forca", "coracao", "argucia"] as const).map((attr) => (
          <div key={attr} className="tor-sheet__attr-col">
            <h3>
              {ATTRIBUTE_LABEL[attr]} <span>{character.attributes[attr]}</span>
            </h3>
            <p className="tor-sheet__tn">NA {attributeTN(character.attributes[attr])}</p>
            <ul>
              {SKILLS.filter((s) => s.group === attr).map((s) => (
                <li key={s.id} className={character.favouredSkills.includes(s.id) ? "is-favoured" : ""}>
                  <span>{s.label}</span>
                  <strong>{character.skills[s.id]}</strong>
                  {interactive ? (
                    <button type="button" className="tor-sheet__roll-btn" onClick={() => rollSkill(s.id)}>
                      Rolar
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="tor-sheet__combat">
        <h3>Proficiências de Combate</h3>
        <ul className="tor-sheet__combat-list">
          {(Object.keys(COMBAT_PROFICIENCY_LABEL) as TorCombatProficiencyId[]).map((id) => (
            <li key={id}>
              <span>{COMBAT_PROFICIENCY_LABEL[id]}</span>
              <strong>{character.combatProficiencies[id]}</strong>
              {interactive ? (
                <button type="button" className="tor-sheet__roll-btn" onClick={() => rollCombat(id)}>
                  Rolar
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="tor-sheet__grid-2">
        <div>
          <h3>Traços Distintivos</h3>
          <ul className="tor-sheet__tag-list">
            {features.map((f, i) => (
              <li key={i} title={f?.description}>
                {f?.label}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Recompensa &amp; Virtude</h3>
          <ul className="tor-sheet__tag-list">
            {rewards.map((r, i) => (
              <li key={`r-${i}`} title={r?.description}>
                {r?.label} (Valor {character.valour})
              </li>
            ))}
            {virtues.map((v, i) => (
              <li key={`v-${i}`} title={v?.description}>
                {v?.label} (Sabedoria {character.wisdom})
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="tor-sheet__grid-2">
        <div>
          <h3>Cultura</h3>
          <p>
            <strong>{culture?.blessingName}</strong> — {culture?.blessingText}
          </p>
        </div>
        <div>
          <h3>Caminho da Sombra</h3>
          <p>
            <strong>{shadowPath?.label}</strong> — {shadowPath?.description}
          </p>
        </div>
      </section>

      <section>
        <h3>Equipamento de Guerra</h3>
        {character.warGear.length === 0 ? (
          <p className="tor-sheet__empty">Nenhuma arma registrada ainda.</p>
        ) : (
          <table className="tor-sheet__table">
            <thead>
              <tr>
                <th>Arma</th>
                <th>Dano</th>
                <th>Ferimento</th>
                <th>Carga</th>
              </tr>
            </thead>
            <tbody>
              {character.warGear.map((item) => {
                const weapon = WEAPON_BY_ID[item.weaponId];
                return (
                  <tr key={item.instanceId}>
                    <td>{weapon?.label ?? item.weaponId}</td>
                    <td>{weapon?.damage}</td>
                    <td>{weapon?.injury ?? "—"}</td>
                    <td>{weapon?.load}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <div className="tor-sheet__grid-2" style={{ marginTop: "0.75rem" }}>
          <p>
            <strong>Armadura:</strong>{" "}
            {character.armour.armourId ? ARMOUR_BY_ID[character.armour.armourId]?.label : "Nenhuma"}
          </p>
          <p>
            <strong>Elmo:</strong> {character.armour.helm ? "Sim" : "Não"}
          </p>
          <p>
            <strong>Escudo:</strong>{" "}
            {character.armour.shieldId ? SHIELD_BY_ID[character.armour.shieldId]?.label : "Nenhum"}
          </p>
          <p>
            <strong>Tesouro:</strong>{" "}
            {interactive && onResourceChange ? (
              <span className="tor-sheet__stepper tor-sheet__stepper--inline">
                <button type="button" onClick={() => onResourceChange({ treasure: Math.max(0, character.treasure - 10) })}>
                  −
                </button>
                {character.treasure}
                <button type="button" onClick={() => onResourceChange({ treasure: character.treasure + 10 })}>
                  +
                </button>
              </span>
            ) : (
              character.treasure
            )}
          </p>
        </div>
      </section>

      <footer className="tor-sheet__footer">
        <span>Pontos de Aventura: {character.adventurePoints}</span>
        <span>Pontos de Perícia: {character.skillPoints}</span>
        <span>Nível de Companhia: {character.fellowship}</span>
      </footer>
    </div>
  );
}
