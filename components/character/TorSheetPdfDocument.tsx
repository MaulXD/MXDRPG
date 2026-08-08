"use client";

import {
  COMBAT_PROFICIENCY_LABEL,
  CULTURE_BY_ID,
  DISTINCTIVE_FEATURE_BY_ID,
  SHADOW_PATH_BY_ID,
  SKILLS,
  WEAPON_BY_ID,
  ARMOUR_BY_ID,
  SHIELD_BY_ID,
  CALLING_BY_ID,
  STARTING_REWARDS,
} from "@/lib/character/um-anel/data";
import { attributeTN, computeProtectionDice } from "@/lib/character/um-anel/rules";
import { torVirtueInfo } from "@/lib/character/um-anel/virtues";
import type { TorCharacterSheet, TorCombatProficiencyId } from "@/lib/character/um-anel/types";
import "./sheet-pdf.css";
import "./tor-sheet-pdf.css";

/**
 * Layout de impressão da ficha do Um Anel, capturado por
 * lib/character/export-sheet-pdf.ts (html2canvas → jsPDF).
 *
 * Segue os agrupamentos da ficha oficial (`the one ring/ficha-editavel-o-um-anel.pdf`):
 * identidade, Atributos com NA, Perícias por grupo, Proficiências de Combate,
 * recursos (Resistência/Esperança/Sombra/Fadiga), Equipamento de Guerra,
 * armadura, Recompensas e Virtudes.
 *
 * Não reproduz a ARTE da ficha oficial — só a estrutura de campos. A arte é da
 * Free League; o que o jogador precisa levar para a mesa são os valores.
 *
 * Regra de captura: html2canvas não resolve `color-mix()`, `oklch()` nem
 * `color()`. Este layout usa só hex e rgb() — há um teste
 * (`verify-sheet-pdf`) que verifica isso no CSS.
 */

type Props = {
  character: TorCharacterSheet;
};

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="tor-pdf__field">
      <span className="tor-pdf__field-label">{label}</span>
      <span className="tor-pdf__field-value">{value}</span>
    </div>
  );
}

function Box({ label, value, max }: { label: string; value: number; max?: number }) {
  return (
    <div className="tor-pdf__box">
      <span className="tor-pdf__box-label">{label}</span>
      <span className="tor-pdf__box-value">
        {value}
        {max != null ? <span className="tor-pdf__box-max"> / {max}</span> : null}
      </span>
    </div>
  );
}

const ATTR_LABEL = { forca: "Força", coracao: "Coração", argucia: "Astúcia" } as const;
const SKILL_GROUP_LABEL = { forca: "Força", coracao: "Coração", argucia: "Astúcia" } as const;

/** Pips em texto — html2canvas rasteriza, então caractere é mais fiel que CSS. */
function pips(value: number, max = 6): string {
  return "●".repeat(Math.max(0, Math.min(max, value))) + "○".repeat(Math.max(0, max - value));
}

export function TorSheetPdfDocument({ character }: Props) {
  const culture = CULTURE_BY_ID[character.culture];
  const calling = CALLING_BY_ID[character.calling];
  const shadowPath = SHADOW_PATH_BY_ID[character.shadowPathId];

  const proficiencies = (
    Object.keys(character.combatProficiencies) as TorCombatProficiencyId[]
  ).filter((id) => character.combatProficiencies[id] > 0);

  const totalLoad = character.load + character.fatigue;
  // Proteção é derivada da armadura, não campo persistido da ficha.
  const protectionDice = computeProtectionDice(character.armour);

  return (
    <div className="sheet-pdf-doc tor-pdf">
      <header className="tor-pdf__head">
        <div>
          <h1 className="tor-pdf__name">{character.name}</h1>
          <p className="tor-pdf__sub">
            {culture?.name ?? character.culture}
            {calling ? ` · ${calling.name}` : ""}
            {character.age ? ` · ${character.age} anos` : ""}
          </p>
        </div>
        <div className="tor-pdf__head-boxes">
          <Box label="Valor" value={character.valour} />
          <Box label="Sabedoria" value={character.wisdom} />
        </div>
      </header>

      {/* ── Atributos ────────────────────────────────────────────── */}
      <section className="tor-pdf__section">
        <h2>Atributos</h2>
        <div className="tor-pdf__attrs">
          {(["forca", "coracao", "argucia"] as const).map((a) => (
            <div key={a} className="tor-pdf__attr">
              <span className="tor-pdf__attr-label">{ATTR_LABEL[a]}</span>
              <span className="tor-pdf__attr-value">{character.attributes[a]}</span>
              <span className="tor-pdf__attr-tn">NA {attributeTN(character.attributes[a])}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Recursos ─────────────────────────────────────────────── */}
      <section className="tor-pdf__section">
        <h2>Recursos</h2>
        <div className="tor-pdf__boxes">
          <Box label="Resistência" value={character.endurance.value} max={character.endurance.max} />
          <Box label="Esperança" value={character.hope.value} max={character.hope.max} />
          <Box label="Sombra" value={character.shadow} />
          <Box label="Cicatrizes" value={character.shadowScars} />
          <Box label="Fadiga" value={character.fatigue} />
          <Box label="Carga total" value={totalLoad} />
          {/* Com o modificador do escudo, igual à ficha na tela e ao token de
              combate. O PDF imprimia `parry` puro, então o bônus do escudo não
              aparecia em nenhum número da ficha exportada. */}
          <Box label="Bloqueio" value={character.parry + character.shieldParryBonus} />
          <Box label="Proteção" value={protectionDice} />
        </div>
        <p className="tor-pdf__note">
          Carga total = Carga do equipamento ({character.load}) + Fadiga ({character.fatigue}).
          Exausto quando a Resistência atual for igual ou menor que a Carga total.
        </p>
        <div className="tor-pdf__conditions">
          <span className={character.conditions.weary ? "is-on" : undefined}>Exausto</span>
          <span className={character.conditions.miserable ? "is-on" : undefined}>Arrasado</span>
          <span className={character.conditions.wounded ? "is-on" : undefined}>Ferido</span>
          {character.injury ? <span className="is-on">{character.injury}</span> : null}
        </div>
      </section>

      {/* ── Perícias ─────────────────────────────────────────────── */}
      <section className="tor-pdf__section">
        <h2>Perícias</h2>
        <div className="tor-pdf__skill-groups">
          {(["forca", "coracao", "argucia"] as const).map((group) => (
            <div key={group} className="tor-pdf__skill-group">
              <h3>{SKILL_GROUP_LABEL[group]}</h3>
              <ul>
                {SKILLS.filter((s) => s.group === group).map((s) => {
                  const rating = character.skills[s.id] ?? 0;
                  const favoured = character.favouredSkills.includes(s.id);
                  return (
                    <li key={s.id}>
                      <span className="tor-pdf__skill-name">
                        {favoured ? "◆ " : ""}
                        {s.label}
                      </span>
                      <span className="tor-pdf__skill-pips">{pips(rating)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <p className="tor-pdf__note">◆ = Perícia Favorecida (rola 2 Dados de Proeza, pega o melhor).</p>
      </section>

      {/* ── Proficiências de Combate ─────────────────────────────── */}
      <section className="tor-pdf__section">
        <h2>Proficiências de Combate</h2>
        {proficiencies.length > 0 ? (
          <ul className="tor-pdf__inline">
            {proficiencies.map((id) => (
              <li key={id}>
                {COMBAT_PROFICIENCY_LABEL[id]} {pips(character.combatProficiencies[id])}
              </li>
            ))}
          </ul>
        ) : (
          <p className="tor-pdf__note">Nenhuma Proficiência de Combate.</p>
        )}
      </section>

      {/* ── Equipamento ──────────────────────────────────────────── */}
      <section className="tor-pdf__section">
        <h2>Equipamento de Guerra</h2>
        {character.warGear.length > 0 ? (
          <table className="tor-pdf__table">
            <thead>
              <tr>
                <th>Arma</th>
                <th>Dano</th>
                <th>Ferimento</th>
                <th>Carga</th>
              </tr>
            </thead>
            <tbody>
              {character.warGear.map((item, i) => {
                const w = WEAPON_BY_ID[item.weaponId];
                return (
                  <tr key={`${item.weaponId}-${i}`}>
                    <td>{w?.label ?? item.weaponId}</td>
                    <td>{w?.damage ?? "—"}</td>
                    <td>{w?.injury ?? "—"}</td>
                    <td>{w?.load ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="tor-pdf__note">Sem Equipamento de Guerra.</p>
        )}

        <div className="tor-pdf__armour">
          <Field
            label="Armadura"
            value={
              character.armour.armourId
                ? (ARMOUR_BY_ID[character.armour.armourId]?.label ?? character.armour.armourId)
                : "—"
            }
          />
          <Field label="Elmo" value={character.armour.helm ? "Sim" : "—"} />
          <Field
            label="Escudo"
            value={
              character.armour.shieldId
                ? (SHIELD_BY_ID[character.armour.shieldId]?.label ?? character.armour.shieldId)
                : "—"
            }
          />
        </div>
      </section>

      {/* ── Traços, Recompensas, Virtudes ────────────────────────── */}
      <section className="tor-pdf__section">
        <h2>Características</h2>
        <div className="tor-pdf__two-col">
          <div>
            <h3>Traços Distintivos</h3>
            <ul className="tor-pdf__list">
              {character.distinctiveFeatures.length > 0 ? (
                character.distinctiveFeatures.map((id) => (
                  <li key={id}>{DISTINCTIVE_FEATURE_BY_ID[id]?.label ?? id}</li>
                ))
              ) : (
                <li>—</li>
              )}
            </ul>

            <h3>Recompensas</h3>
            <ul className="tor-pdf__list">
              {/* A ficha guarda ids ("mao-firme"); imprimir o id cru levava
                  kebab-case pro papel, enquanto a ficha na tela mostrava o nome. */}
              {character.rewards.length > 0 ? (
                character.rewards.map((r, i) => (
                  <li key={i}>{STARTING_REWARDS.find((d) => d.id === r)?.label ?? r}</li>
                ))
              ) : (
                <li>—</li>
              )}
            </ul>
          </div>
          <div>
            <h3>Virtudes</h3>
            <ul className="tor-pdf__list">
              {character.virtues.length > 0 ? (
                character.virtues.map((v, i) => <li key={i}>{torVirtueInfo(v).label}</li>)
              ) : (
                <li>—</li>
              )}
            </ul>

            <h3>Caminho da Sombra</h3>
            <p className="tor-pdf__note">{shadowPath?.label ?? "—"}</p>

            <h3>Itens Úteis</h3>
            <ul className="tor-pdf__list">
              {character.usefulItems.length > 0 ? (
                character.usefulItems.map((it, i) => <li key={i}>{it}</li>)
              ) : (
                <li>—</li>
              )}
            </ul>
          </div>
        </div>
      </section>

      <footer className="tor-pdf__foot">
        O Um Anel 2ª ed. · ficha gerada por MXDRPG · Tesouro {character.treasure} · Irmandade{" "}
        {character.fellowship}
      </footer>
    </div>
  );
}
