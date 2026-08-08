"use client";

import { useState } from "react";
import { SheetPopupPortrait } from "@/components/character/SheetPopupPortrait";
import {
  ARMOURS,
  ARMOUR_BY_ID,
  ATTRIBUTE_LABEL,
  CALLING_BY_ID,
  COMBAT_PROFICIENCY_LABEL,
  CULTURE_BY_ID,
  DISTINCTIVE_FEATURE_BY_ID,
  HELM,
  SHADOW_PATH_BY_ID,
  SHIELD_BY_ID,
  SKILLS,
  STANDARDS_OF_LIVING,
  STARTING_REWARDS,
  WEAPON_BY_ID,
  WEAPONS,
  shieldsForCulture,
  weaponsForCulture,
} from "@/lib/character/um-anel/data";
import { torVirtueInfo } from "@/lib/character/um-anel/virtues";
import {
  featDieRollPayload,
  rollTorCombatProficiencyCheck,
  rollTorSkillCheck,
  type TorFeatDieRollPayload,
} from "@/lib/character/um-anel/dice";
import { attributeTN } from "@/lib/character/um-anel/rules";
import type {
  TorCharacterSheet,
  TorCombatProficiencyId,
  TorResourcePatch,
  TorSkillId,
} from "@/lib/character/um-anel/types";
import { persistPortraitBundleToTorCharacter } from "@/lib/character/portrait-persist-client";
import type { PortraitBundle } from "@/lib/media/image-upload-client";
import type { PortraitFocus } from "@/lib/media/portrait-focus";
import "@/components/character/sheet-ddb.css";
import "./tor-sheet.css";
import dynamic from "next/dynamic";

const TorSheetPdfExportButton = dynamic(
  () =>
    import("@/components/character/TorSheetPdfExportButton").then(
      (m) => m.TorSheetPdfExportButton
    ),
  { ssr: false }
);

type Props = {
  character: TorCharacterSheet;
  /** Mesa: habilita rolagem de dados e ajuste de recursos. Página solo: fica só leitura. */
  interactive?: boolean;
  onRoll?: (message: string, featDie?: TorFeatDieRollPayload) => void;
  onResourceChange?: (patch: TorResourcePatch) => void;
  /** Habilita upload/edição de retrato + token (dono da ficha ou mestre). */
  canEditPortrait?: boolean;
};

type PortraitOverride = {
  portraitUrl: string | null;
  tokenImageUrl: string | null;
  portraitFocus: PortraitFocus | null;
  tokenFocus: PortraitFocus | null;
};

const PIP_MAX = 6;

/** Losangos de graduação, no estilo da ficha impressa oficial (favorecida = losangos vermelhos). */
function RatingPips({ value, favoured }: { value: number; favoured?: boolean }) {
  const filled = Math.min(value, PIP_MAX);
  const overflow = value - PIP_MAX;
  return (
    <span className={`tor-pips${favoured ? " is-favoured" : ""}`} aria-label={`Graduação ${value}`}>
      {Array.from({ length: PIP_MAX }, (_, i) => (
        <span key={i} className={`tor-pip${i < filled ? " tor-pip--on" : ""}`} aria-hidden />
      ))}
      {overflow > 0 ? <em className="tor-pips__overflow">+{overflow}</em> : null}
    </span>
  );
}

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

export function TorCharacterSheetView({
  character,
  interactive = false,
  onRoll,
  onResourceChange,
  canEditPortrait = false,
}: Props) {
  const culture = CULTURE_BY_ID[character.culture];
  const calling = CALLING_BY_ID[character.calling];
  const shadowPath = SHADOW_PATH_BY_ID[character.shadowPathId];
  const standard = STANDARDS_OF_LIVING.find((s) => s.id === character.standardOfLiving);
  const [lastRoll, setLastRoll] = useState<string | null>(null);
  /* Bônus de Esperança e Inspiração valem PARA A PRÓXIMA rolagem — por isso são
     estado do painel, marcados antes de clicar, e desmarcam depois de gastos. */
  const [spendHope, setSpendHope] = useState(false);
  const [inspired, setInspired] = useState(false);
  const [supported, setSupported] = useState(false);
  const [portraitOverride, setPortraitOverride] = useState<PortraitOverride | null>(null);

  const portraitUrl = portraitOverride ? portraitOverride.portraitUrl : character.portraitUrl ?? null;
  const tokenImageUrl = portraitOverride ? portraitOverride.tokenImageUrl : character.tokenImageUrl ?? null;
  const portraitFocus = portraitOverride ? portraitOverride.portraitFocus : character.portraitFocus ?? null;
  const tokenFocus = portraitOverride ? portraitOverride.tokenFocus : character.tokenFocus ?? null;

  async function persistPortrait(bundle: PortraitBundle) {
    await persistPortraitBundleToTorCharacter(character.id, bundle);
    setPortraitOverride({
      portraitUrl: bundle.portraitUrl,
      tokenImageUrl: bundle.tokenImageUrl,
      portraitFocus: bundle.portraitFocus,
      tokenFocus: bundle.tokenFocus,
    });
  }

  // Começa na primeira arma PERMITIDA à Cultura, não na primeira de WEAPONS.
  const allowedWeapons = weaponsForCulture(character.culture);
  const [addWeaponId, setAddWeaponId] = useState(allowedWeapons[0]?.id ?? "");

  function addWeapon() {
    const weapon = WEAPON_BY_ID[addWeaponId];
    if (!onResourceChange || !weapon) return;
    // Guarda de regra, não só de UI: Naugrim e Pequenos são proibições
    // permanentes. Filtrar só o <select> deixaria a porta aberta pra um id
    // antigo ou forjado equipar uma arma vetada — e a Carga e o Bloqueio
    // recalculados em normalize entrariam com o número errado.
    if (!allowedWeapons.some((w) => w.id === weapon.id)) return;
    onResourceChange({
      warGear: [
        ...character.warGear,
        { instanceId: crypto.randomUUID(), weaponId: weapon.id, twoHanded: weapon.twoHanded || undefined },
      ],
    });
  }

  function removeWeapon(instanceId: string) {
    onResourceChange?.({ warGear: character.warGear.filter((w) => w.instanceId !== instanceId) });
  }

  function setArmourId(armourId: string | null) {
    onResourceChange?.({ armour: { ...character.armour, armourId } });
  }

  function toggleHelm() {
    onResourceChange?.({ armour: { ...character.armour, helm: !character.armour.helm } });
  }

  function setShieldId(shieldId: string | null) {
    onResourceChange?.({ armour: { ...character.armour, shieldId } });
  }

  const rewards = character.rewards.map((id) => STARTING_REWARDS.find((r) => r.id === id)).filter(Boolean);
  // Resolve contra as Virtudes iniciais E as Culturais — antes só olhava
  // STARTING_VIRTUES e o `filter(Boolean)` fazia uma Virtude Cultural sumir da
  // ficha em silêncio. `torVirtueInfo` devolve o próprio id como rótulo quando
  // não conhece, então nada mais desaparece.
  const virtues = character.virtues.map((id) => torVirtueInfo(id));
  const features = character.distinctiveFeatures
    .map((id) => DISTINCTIVE_FEATURE_BY_ID[id.split(":")[0]!])
    .filter(Boolean);

  /**
   * Opções da rolagem e o desconto do ponto.
   *
   * A Esperança sai da ficha aqui, e não dentro de `rollTorCheck`: o motor é puro
   * e não sabe persistir. Descontar só depois de rolar mantém a ficha coerente
   * mesmo se a rolagem falhar por qualquer motivo.
   *
   * Inspirado **sem** gasto de Esperança não dá dado nenhum — é o benefício do
   * ponto que dobra —, então a caixa de Inspirado sozinha não desconta nada.
   */
  function rollOptions() {
    const canSpend = spendHope && character.hope.value > 0;
    // O ponto do Apoio sai da Esperança de QUEM APOIA, não deste herói — por
    // isso `supported` não desconta nada aqui; quem apoiou desconta na própria
    // ficha. Marcar aqui só reconhece o (1d) que já foi pago do outro lado.
    return { opts: { spendHope: canSpend, inspired, supported }, spent: canSpend };
  }

  function afterRoll(spent: boolean) {
    // As marcas desmarcam SEMPRE — valem para uma rolagem só. Sair cedo quando
    // não houve gasto deixaria o Apoio marcado para a rolagem seguinte, dando um
    // (1d) que ninguém pagou.
    if (spent) onResourceChange?.({ hopeValue: Math.max(0, character.hope.value - 1) });
    setSpendHope(false);
    setInspired(false);
    setSupported(false);
  }

  function rollSkill(skillId: TorSkillId) {
    const { opts, spent } = rollOptions();
    const { message, outcome } = rollTorSkillCheck(character, skillId, opts);
    setLastRoll(message);
    onRoll?.(message, featDieRollPayload(outcome.featDie));
    afterRoll(spent);
  }

  function rollCombat(profId: TorCombatProficiencyId) {
    const { opts, spent } = rollOptions();
    const { message, outcome } = rollTorCombatProficiencyCheck(character, profId, opts);
    setLastRoll(message);
    afterRoll(spent);
    onRoll?.(message, featDieRollPayload(outcome.featDie));
  }

  return (
    <div className="tor-sheet">
      <header className="tor-sheet__masthead tor-sheet__masthead--with-portrait">
        {portraitUrl || canEditPortrait ? (
          <div className="tor-sheet__masthead-portrait">
            <SheetPopupPortrait
              actorId={character.id}
              name={character.name}
              portraitUrl={portraitUrl}
              tokenImageUrl={tokenImageUrl}
              portraitFocus={portraitFocus}
              tokenFocus={tokenFocus}
              canEdit={canEditPortrait}
              onSaved={() => {}}
              onPersistBundle={persistPortrait}
              layout="ddb"
            />
          </div>
        ) : null}
        <div className="tor-sheet__masthead-text">
          <h1>{character.name}</h1>
          <p className="tor-sheet__masthead-meta">
            <span>{culture?.name}</span>
            <span aria-hidden>·</span>
            <span>{calling?.name}</span>
            {character.age ? (
              <>
                <span aria-hidden>·</span>
                <span>{character.age} anos</span>
              </>
            ) : null}
            <span aria-hidden>·</span>
            <span>Padrão de Vida: {standard?.label}</span>
          </p>
        </div>
        <div className="tor-sheet__masthead-actions">
          <TorSheetPdfExportButton character={character} className="tor-sheet__pdf-btn" />
        </div>
      </header>

      {character.biography ? <p className="tor-sheet__bio">{character.biography}</p> : null}

      <section className="tor-sheet__grid-2">
        <div className="tor-sheet__lore-card">
          <h3>{culture?.blessingName}</h3>
          <p>{culture?.blessingText}</p>
          {culture?.extraTraitName ? (
            <p className="tor-sheet__lore-extra">
              <strong>{culture.extraTraitName}:</strong> {culture.extraTraitText}
            </p>
          ) : null}
        </div>
        <div className="tor-sheet__lore-card">
          <h3>Caminho da Sombra</h3>
          <p>
            <strong>{shadowPath?.label}</strong> — {shadowPath?.description}
          </p>
        </div>
      </section>

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
          <span>Bloqueio</span>
          <strong>{character.parry + character.shieldParryBonus}</strong>
        </div>
        <div className="tor-sheet__resource">
          <span>Carga</span>
          <strong>{character.load}</strong>
        </div>
      </section>

      <section className="tor-sheet__conditions">
        {character.conditions.weary ? <span className="tor-sheet__pill">Exausto</span> : null}
        {character.conditions.miserable ? <span className="tor-sheet__pill">Arrasado</span> : null}
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

      {/* Marcado ANTES de rolar: o livro fala em "um herói-jogador a ponto de
          fazer uma rolagem". Só um ponto por rolagem — o livro é explícito em
          que não dá pra gastar vários. */}
      {interactive ? (
        <div className="tor-sheet__hope-bonus">
          <label>
            <input
              type="checkbox"
              checked={spendHope}
              disabled={character.hope.value <= 0}
              onChange={(e) => setSpendHope(e.target.checked)}
            />
            Gastar 1 Esperança na próxima rolagem (+1d)
          </label>
          <label>
            <input type="checkbox" checked={inspired} onChange={(e) => setInspired(e.target.checked)} />
            Inspirado — dobra o bônus (+2d)
          </label>
          <label>
            <input
              type="checkbox"
              checked={supported}
              onChange={(e) => setSupported(e.target.checked)}
            />
            Apoiado por um companheiro (+1d)
          </label>
          <span className="tor-sheet__hope-hint">
            Inspiração vem de invocar uma Característica Distintiva ou de uma Virtude Cultural.
            Sozinha não dá dado: é o benefício do ponto de Esperança que dobra. No Apoio, o ponto sai
            da Esperança de quem apoia — e só um companheiro pode apoiar cada rolagem.
          </span>
        </div>
      ) : null}

      {interactive && lastRoll ? <p className="tor-sheet__last-roll">{lastRoll}</p> : null}

      <section className="tor-sheet__attrs">
        {(["forca", "coracao", "argucia"] as const).map((attr) => (
          <div key={attr} className="tor-sheet__attr-col">
            <div className="tor-sheet__attr-badge">
              <span className="tor-sheet__attr-diamond">{character.attributes[attr]}</span>
              <div>
                <h3>{ATTRIBUTE_LABEL[attr]}</h3>
                <p className="tor-sheet__tn">NA {attributeTN(character.attributes[attr])}</p>
              </div>
            </div>
            <ul>
              {SKILLS.filter((s) => s.group === attr).map((s) => {
                const favoured = character.favouredSkills.includes(s.id);
                return (
                  <li key={s.id} className={favoured ? "is-favoured" : ""} title={s.description}>
                    <span className="tor-sheet__skill-name">{s.label}</span>
                    <RatingPips value={character.skills[s.id]} favoured={favoured} />
                    {interactive ? (
                      <button type="button" className="tor-sheet__roll-btn" onClick={() => rollSkill(s.id)}>
                        Rolar
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>

      <section className="tor-sheet__combat">
        <h3>Proficiências de Combate</h3>
        <ul className="tor-sheet__combat-list">
          {(Object.keys(COMBAT_PROFICIENCY_LABEL) as TorCombatProficiencyId[]).map((id) => (
            <li key={id} title={`Armas: ${WEAPONS.filter((w) => w.proficiency === id).map((w) => w.label).join(", ")}`}>
              <span className="tor-sheet__skill-name">{COMBAT_PROFICIENCY_LABEL[id]}</span>
              <RatingPips value={character.combatProficiencies[id]} />
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
              <li key={`v-${i}`} title={v.description}>
                {v.label} (Sabedoria {character.wisdom})
              </li>
            ))}
          </ul>
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
                {interactive && onResourceChange ? <th /> : null}
              </tr>
            </thead>
            <tbody>
              {character.warGear.map((item) => {
                const weapon = WEAPON_BY_ID[item.weaponId];
                return (
                  <tr key={item.instanceId} title={weapon?.notes}>
                    <td>{weapon?.label ?? item.weaponId}</td>
                    <td>{weapon?.damage}</td>
                    <td>{weapon?.injury ?? "—"}</td>
                    <td>{weapon?.load}</td>
                    {interactive && onResourceChange ? (
                      <td>
                        <button
                          type="button"
                          className="tor-sheet__gear-remove"
                          onClick={() => removeWeapon(item.instanceId)}
                          aria-label={`Remover ${weapon?.label ?? "arma"}`}
                        >
                          ×
                        </button>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {interactive && onResourceChange ? (
          <div className="tor-sheet__gear-add">
            <select value={addWeaponId} onChange={(e) => setAddWeaponId(e.target.value)}>
              {allowedWeapons.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.label}
                </option>
              ))}
            </select>
            <button type="button" className="btn btn-ghost" onClick={addWeapon}>
              + Adicionar arma
            </button>
          </div>
        ) : null}

        <div className="tor-sheet__grid-2" style={{ marginTop: "0.75rem" }}>
          <p>
            <strong>Armadura:</strong>{" "}
            {interactive && onResourceChange ? (
              <select
                value={character.armour.armourId ?? ""}
                onChange={(e) => setArmourId(e.target.value || null)}
              >
                <option value="">Nenhuma</option>
                {ARMOURS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
            ) : character.armour.armourId ? (
              ARMOUR_BY_ID[character.armour.armourId]?.label
            ) : (
              "Nenhuma"
            )}
          </p>
          <p>
            <strong>Elmo ({HELM.label}):</strong>{" "}
            {interactive && onResourceChange ? (
              <button type="button" className="btn btn-ghost" onClick={toggleHelm}>
                {character.armour.helm ? "Tirar" : "Vestir"}
              </button>
            ) : character.armour.helm ? (
              "Sim"
            ) : (
              "Não"
            )}
          </p>
          <p>
            <strong>Escudo:</strong>{" "}
            {interactive && onResourceChange ? (
              <select
                value={character.armour.shieldId ?? ""}
                onChange={(e) => setShieldId(e.target.value || null)}
              >
                <option value="">Nenhum</option>
                {shieldsForCulture(character.culture).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            ) : character.armour.shieldId ? (
              SHIELD_BY_ID[character.armour.shieldId]?.label
            ) : (
              "Nenhum"
            )}
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
