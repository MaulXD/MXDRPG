"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { WizardProgress } from "@/components/character/wizard/WizardProgress";
import { WizardHoverTip } from "@/components/character/wizard/WizardHoverTip";
import {
  WizardPortraitStep,
  type WizardPortraitStepHandle,
} from "@/components/character/wizard/WizardPortraitStep";
import {
  ARMOUR_BY_ID,
  ARMOURS,
  CALLINGS,
  CULTURES,
  DISTINCTIVE_FEATURE_BY_ID,
  ENEMY_LORE_OPTIONS,
  HELM,
  SHIELD_BY_ID,
  SKILL_BY_ID,
  SKILL_LABEL,
  STARTING_REWARDS,
  STARTING_VIRTUES,
  COMBAT_PROFICIENCY_LABEL,
  ATTRIBUTE_LABEL,
  WEAPON_BY_ID,
  shieldsForCulture,
  weaponsForProficiency,
} from "@/lib/character/um-anel/data";
import type { TorCombatProficiencyId } from "@/lib/character/um-anel/types";
import {
  activeCombatProficiencies,
  EMPTY_TOR_WIZARD_DRAFT,
  validateTorWizardDraft,
  type TorCharacterWizardDraft,
} from "@/lib/character/um-anel/wizard-types";
import "@/components/character/wizard/wizard.css";

const STEPS = [
  "Conceito",
  "Cultura",
  "Atributos",
  "Chamado",
  "Combate",
  "Traços",
  "Dádivas",
  "Equipamento",
  "Retrato",
  "Revisão",
] as const;

const STEP_HINTS: Record<(typeof STEPS)[number], string> = {
  Conceito: "Nome do aventureiro — biografia é opcional.",
  Cultura: "A Cultura define bônus, perícias iniciais e proficiências de combate.",
  Atributos: "Escolha um dos seis conjuntos pré-definidos da Cultura.",
  Chamado: "O Chamado define o motivo do aventureiro estar na estrada.",
  Combate: "Escolha suas Proficiências de Combate iniciais.",
  Traços: "Escolha 2 Traços Distintivos da lista da Cultura.",
  Dádivas: "Toda ficha começa com 1 Recompensa e 1 Virtude.",
  Equipamento: "Uma arma por Proficiência de Combate e uma armadura inicial.",
  Retrato: "Envie uma imagem pro retrato e token — ou pule por agora.",
  Revisão: "Confira tudo e crie — você pode editar depois.",
};

function SkillPickLabel({ skillId }: { skillId: import("@/lib/character/um-anel/types").TorSkillId }) {
  return (
    <WizardHoverTip text={SKILL_BY_ID[skillId]?.description}>
      <strong>{SKILL_LABEL[skillId]}</strong>
    </WizardHoverTip>
  );
}

type Props = {
  slotsLeft: number;
  adventureId?: string | null;
  adventureName?: string | null;
  variant?: "page" | "mesa";
  onCreated?: (result: { characterId: string; name?: string }) => void;
};

function StepHead({ index, title }: { index: number; title: string }) {
  return (
    <div className="char-wizard-step-head">
      <p className="char-wizard-step-head__eyebrow">
        Passo {index + 1} de {STEPS.length}
      </p>
      <h2>{title}</h2>
      <p>{STEP_HINTS[title as (typeof STEPS)[number]]}</p>
    </div>
  );
}

export function TorCharacterCreationWizard({
  slotsLeft,
  adventureId = null,
  adventureName = null,
  variant = "page",
  onCreated,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<TorCharacterWizardDraft>(EMPTY_TOR_WIZARD_DRAFT);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const portraitStepRef = useRef<WizardPortraitStepHandle>(null);
  const portraitStepIndex = STEPS.indexOf("Retrato");

  function patch(p: Partial<TorCharacterWizardDraft>) {
    setDraft((d) => ({ ...d, ...p }));
  }

  const culture = useMemo(
    () => CULTURES.find((c) => c.id === draft.culture) ?? null,
    [draft.culture]
  );
  const calling = useMemo(
    () => CALLINGS.find((c) => c.id === draft.calling) ?? null,
    [draft.calling]
  );

  function stepError(index: number): string | null {
    switch (STEPS[index]) {
      case "Conceito":
        return draft.name.trim() ? null : "Escolha um nome";
      case "Cultura":
        if (!draft.culture) return "Escolha uma Cultura";
        if (!draft.cultureFavouredSkill) return "Escolha a Perícia Favorecida da Cultura";
        return null;
      case "Atributos":
        if (draft.attributeOptionIndex === null) return "Escolha um conjunto de Atributos";
        if (draft.culture === "rangers" && !draft.rangerAttributeBonus) {
          return "Escolha o Atributo que recebe o bônus de Rangers";
        }
        return null;
      case "Chamado":
        if (!draft.calling) return "Escolha um Chamado";
        if (draft.favouredCallingSkills.length !== 2) return "Escolha 2 Perícias Favorecidas";
        if (draft.calling === "campeao" && !draft.enemyLoreChoice) return "Escolha o tipo de inimigo";
        return null;
      case "Combate":
        if (!draft.combatProficiencyChoiceA) return "Escolha a Proficiência principal";
        if (!draft.combatProficiencyChoiceB) return "Escolha a Proficiência adicional";
        return null;
      case "Traços":
        return draft.distinctiveFeatures.length === 2 ? null : "Escolha 2 Traços Distintivos";
      case "Dádivas":
        if (!draft.reward) return "Escolha uma Recompensa";
        if (!draft.virtue) return "Escolha uma Virtude";
        return null;
      case "Equipamento": {
        for (const prof of activeCombatProficiencies(draft)) {
          if (!draft.weaponChoices[prof]) return "Escolha uma arma pra cada Proficiência de Combate";
        }
        if (!draft.armourId) return "Escolha uma armadura inicial";
        return null;
      }
      default:
        return null;
    }
  }

  const invalidSteps = STEPS.map((_, i) => i).filter((i) => i < STEPS.length - 1 && stepError(i));

  function firstInvalidStep(): number | null {
    for (let i = 0; i < STEPS.length - 1; i++) if (stepError(i)) return i;
    return null;
  }

  function goToStep(i: number) {
    setStep(i);
  }

  async function flushPortraitStep(): Promise<boolean> {
    if (step !== portraitStepIndex) return true;
    const ok = (await portraitStepRef.current?.flushPending()) ?? true;
    if (!ok) {
      setErr(
        "Não foi possível salvar o retrato. Use uma imagem menor ou clique em Aplicar retrato + token."
      );
    }
    return ok;
  }

  async function next() {
    const e = stepError(step);
    if (e) {
      setShowValidation(true);
      setErr(e);
      return;
    }
    if (!(await flushPortraitStep())) return;
    setErr(null);
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  async function finish() {
    if (!(await flushPortraitStep())) return;
    const invalidAt = firstInvalidStep();
    if (invalidAt !== null) {
      setShowValidation(true);
      setStep(invalidAt);
      setErr(stepError(invalidAt));
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/tor-characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ ...draft, adventureId: adventureId ?? undefined }),
      });
      const data = (await res.json()) as {
        error?: string;
        character?: { id: string; name?: string };
        adventureId?: string | null;
      };
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar");
      if (!data.character?.id) throw new Error("Resposta inválida do servidor");
      const charId = data.character.id;

      if (onCreated) {
        onCreated({ characterId: charId, name: data.character.name });
        return;
      }

      const adv = data.adventureId ?? adventureId ?? null;
      const dest = adv
        ? `/aventura/${encodeURIComponent(adv)}?personagem=criado&char=${encodeURIComponent(charId)}`
        : `/personagem/${encodeURIComponent(charId)}`;
      router.push(dest);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro ao criar personagem");
    } finally {
      setBusy(false);
    }
  }

  function handleNextOrFinish() {
    if (step < STEPS.length - 1) void next();
    else void finish();
  }

  const stepLabel = STEPS[step];
  const validationErr = err ?? (showValidation ? stepError(step) : null);

  return (
    <div className={`char-wizard${variant === "mesa" ? " char-wizard--mesa-embed" : ""}`}>
      <header className="char-wizard-hero">
        <p className="char-wizard-hero__badge">
          O Um Anel · <strong>{slotsLeft}</strong> {slotsLeft === 1 ? "vaga" : "vagas"} na conta
          {adventureId ? (
            <>
              {" "}
              · campanha <strong>{adventureName ?? adventureId}</strong>
            </>
          ) : null}
        </p>
        <WizardProgress
          steps={STEPS}
          current={step}
          busy={busy}
          invalidSteps={invalidSteps}
          onGoTo={goToStep}
        />
        {showValidation && invalidSteps.length > 0 ? (
          <p className="char-wizard-validation-banner" role="alert">
            <strong>Pendente:</strong> {invalidSteps.map((i) => STEPS[i]).join(" · ")} — clique no passo
            para corrigir.
          </p>
        ) : null}
      </header>

      <div className="char-wizard-body">
        <div className="glass char-wizard-panel" role="group" aria-label={`Passo: ${stepLabel}`}>
          <div className="char-wizard-panel-inner">
            {stepLabel === "Conceito" ? (
              <>
                <StepHead index={0} title="Conceito" />
                <div className="char-wizard-field char-wizard-field--name">
                  <label htmlFor="tor-name">Nome do aventureiro</label>
                  <input
                    id="tor-name"
                    value={draft.name}
                    onChange={(e) => patch({ name: e.target.value })}
                    maxLength={80}
                    placeholder="Ex: Folco Bolseiro"
                    autoComplete="off"
                  />
                </div>
                <div className="char-wizard-field">
                  <label htmlFor="tor-age">Idade (opcional)</label>
                  <input
                    id="tor-age"
                    type="number"
                    min={1}
                    max={999}
                    value={draft.age ?? ""}
                    onChange={(e) => patch({ age: e.target.value ? Number(e.target.value) : null })}
                  />
                </div>
                <div className="char-wizard-field">
                  <label htmlFor="tor-bio">Biografia (opcional)</label>
                  <textarea
                    id="tor-bio"
                    value={draft.biography}
                    onChange={(e) => patch({ biography: e.target.value })}
                    rows={4}
                    maxLength={2000}
                    placeholder="Por que deixou sua terra natal?"
                  />
                </div>
              </>
            ) : null}

            {stepLabel === "Cultura" ? (
              <>
                <StepHead index={1} title="Cultura" />
                <div className="char-wizard-pick-grid char-wizard-pick-grid--wide">
                  {CULTURES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`char-wizard-pick${draft.culture === c.id ? " char-wizard-pick--on" : ""}`}
                      onClick={() =>
                        patch({
                          culture: c.id,
                          cultureFavouredSkill: null,
                          attributeOptionIndex: null,
                          rangerAttributeBonus: null,
                          combatProficiencyChoiceA: null,
                          combatProficiencyChoiceB: null,
                          distinctiveFeatures: [],
                        })
                      }
                    >
                      <span className="char-wizard-pick__head">
                        <strong>{c.name}</strong>
                        <span className="char-wizard-pick__check" aria-hidden>✓</span>
                      </span>
                      <span>{c.blessingName} — {c.blessingText}</span>
                    </button>
                  ))}
                </div>
                {culture ? (
                  <div className="char-wizard-field">
                    <label>Perícia Favorecida da Cultura</label>
                    <div className="char-wizard-pick-grid">
                      {culture.favouredChoice.map((skillId) => (
                        <button
                          key={skillId}
                          type="button"
                          className={`char-wizard-pick${draft.cultureFavouredSkill === skillId ? " char-wizard-pick--on" : ""}`}
                          onClick={() => patch({ cultureFavouredSkill: skillId })}
                        >
                          <SkillPickLabel skillId={skillId} />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}

            {stepLabel === "Atributos" ? (
              <>
                <StepHead index={2} title="Atributos" />
                {culture ? (
                  <div className="char-wizard-pick-grid">
                    {culture.attributeOptions.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`char-wizard-pick${draft.attributeOptionIndex === i ? " char-wizard-pick--on" : ""}`}
                        onClick={() => patch({ attributeOptionIndex: i })}
                      >
                        <strong>Conjunto {i + 1}</strong>
                        <span>
                          Força {opt.forca} · Coração {opt.coracao} · Astúcia {opt.argucia}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="char-wizard-meta">Escolha uma Cultura primeiro.</p>
                )}
                {culture?.id === "rangers" ? (
                  <div className="char-wizard-field">
                    <label>Reis dos Homens — +1 num Atributo à sua escolha</label>
                    <div className="char-wizard-pick-grid">
                      {(["forca", "coracao", "argucia"] as const).map((attr) => (
                        <button
                          key={attr}
                          type="button"
                          className={`char-wizard-pick${draft.rangerAttributeBonus === attr ? " char-wizard-pick--on" : ""}`}
                          onClick={() => patch({ rangerAttributeBonus: attr })}
                        >
                          <strong>{ATTRIBUTE_LABEL[attr]}</strong>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}

            {stepLabel === "Chamado" ? (
              <>
                <StepHead index={3} title="Chamado" />
                <div className="char-wizard-pick-grid char-wizard-pick-grid--wide">
                  {CALLINGS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`char-wizard-pick${draft.calling === c.id ? " char-wizard-pick--on" : ""}`}
                      onClick={() =>
                        patch({
                          calling: c.id,
                          favouredCallingSkills: [],
                          enemyLoreChoice: null,
                        })
                      }
                    >
                      <strong>{c.name}</strong>
                      <span>{DISTINCTIVE_FEATURE_BY_ID[c.traitId]?.label}</span>
                    </button>
                  ))}
                </div>
                {calling ? (
                  <div className="char-wizard-field">
                    <label>Escolha 2 Perícias Favorecidas</label>
                    <div className="char-wizard-pick-grid">
                      {calling.favouredSkillOptions.map((skillId) => {
                        const on = draft.favouredCallingSkills.includes(skillId);
                        return (
                          <button
                            key={skillId}
                            type="button"
                            className={`char-wizard-pick${on ? " char-wizard-pick--on" : ""}`}
                            onClick={() => {
                              if (on) {
                                patch({ favouredCallingSkills: draft.favouredCallingSkills.filter((s) => s !== skillId) });
                              } else if (draft.favouredCallingSkills.length < 2) {
                                patch({ favouredCallingSkills: [...draft.favouredCallingSkills, skillId] });
                              }
                            }}
                          >
                            <SkillPickLabel skillId={skillId} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                {calling?.enemyLoreChoice ? (
                  <div className="char-wizard-field">
                    <label>Conhecimento do Inimigo — tipo de inimigo</label>
                    <div className="char-wizard-pick-grid">
                      {ENEMY_LORE_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          className={`char-wizard-pick${draft.enemyLoreChoice === opt ? " char-wizard-pick--on" : ""}`}
                          onClick={() => patch({ enemyLoreChoice: opt })}
                        >
                          <strong>{opt}</strong>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}

            {stepLabel === "Combate" ? (
              <>
                <StepHead index={4} title="Combate" />
                {culture ? (
                  <>
                    <div className="char-wizard-field">
                      <label>Proficiência principal (rating 2)</label>
                      <div className="char-wizard-pick-grid">
                        {culture.combatProficiencyChoiceA.options.map((id: TorCombatProficiencyId) => (
                          <button
                            key={id}
                            type="button"
                            className={`char-wizard-pick${draft.combatProficiencyChoiceA === id ? " char-wizard-pick--on" : ""}`}
                            onClick={() => patch({ combatProficiencyChoiceA: id })}
                          >
                            <WizardHoverTip
                              text={`Armas: ${weaponsForProficiency(id, culture.id).map((w) => w.label).join(", ")}`}
                            >
                              <strong>{COMBAT_PROFICIENCY_LABEL[id]}</strong>
                            </WizardHoverTip>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="char-wizard-field">
                      <label>Proficiência adicional (rating 1)</label>
                      <div className="char-wizard-pick-grid">
                        {culture.combatProficiencyChoiceB.options.map((id: TorCombatProficiencyId) => (
                          <button
                            key={id}
                            type="button"
                            className={`char-wizard-pick${draft.combatProficiencyChoiceB === id ? " char-wizard-pick--on" : ""}`}
                            onClick={() => patch({ combatProficiencyChoiceB: id })}
                          >
                            <WizardHoverTip
                              text={`Armas: ${weaponsForProficiency(id, culture.id).map((w) => w.label).join(", ")}`}
                            >
                              <strong>{COMBAT_PROFICIENCY_LABEL[id]}</strong>
                            </WizardHoverTip>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="char-wizard-meta">Escolha uma Cultura primeiro.</p>
                )}
              </>
            ) : null}

            {stepLabel === "Traços" ? (
              <>
                <StepHead index={5} title="Traços" />
                {culture ? (
                  <div className="char-wizard-pick-grid">
                    {culture.distinctiveFeatureOptions.map((id) => {
                      const on = draft.distinctiveFeatures.includes(id);
                      const def = DISTINCTIVE_FEATURE_BY_ID[id];
                      return (
                        <button
                          key={id}
                          type="button"
                          className={`char-wizard-pick${on ? " char-wizard-pick--on" : ""}`}
                          onClick={() => {
                            if (on) {
                              patch({ distinctiveFeatures: draft.distinctiveFeatures.filter((f) => f !== id) });
                            } else if (draft.distinctiveFeatures.length < 2) {
                              patch({ distinctiveFeatures: [...draft.distinctiveFeatures, id] });
                            }
                          }}
                        >
                          <strong>{def?.label}</strong>
                          <span>{def?.description}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="char-wizard-meta">Escolha uma Cultura primeiro.</p>
                )}
              </>
            ) : null}

            {stepLabel === "Dádivas" ? (
              <>
                <StepHead index={6} title="Dádivas" />
                <div className="char-wizard-field">
                  <label>Recompensa inicial (VALOR)</label>
                  <div className="char-wizard-pick-grid">
                    {STARTING_REWARDS.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        className={`char-wizard-pick${draft.reward === r.id ? " char-wizard-pick--on" : ""}`}
                        onClick={() => patch({ reward: r.id })}
                      >
                        <strong>{r.label}</strong>
                        <span>{r.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="char-wizard-field">
                  <label>Virtude inicial (SABEDORIA)</label>
                  <div className="char-wizard-pick-grid">
                    {STARTING_VIRTUES.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        className={`char-wizard-pick${draft.virtue === v.id ? " char-wizard-pick--on" : ""}`}
                        onClick={() => patch({ virtue: v.id })}
                      >
                        <strong>{v.label}</strong>
                        <span>{v.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : null}

            {stepLabel === "Equipamento" ? (
              <>
                <StepHead index={7} title="Equipamento" />
                {culture ? (
                  <>
                    {activeCombatProficiencies(draft).map((prof) => (
                      <div key={prof} className="char-wizard-field">
                        <label>Arma — {COMBAT_PROFICIENCY_LABEL[prof]}</label>
                        <div className="char-wizard-pick-grid">
                          {weaponsForProficiency(prof, culture.id).map((w) => (
                            <button
                              key={w.id}
                              type="button"
                              className={`char-wizard-pick${draft.weaponChoices[prof] === w.id ? " char-wizard-pick--on" : ""}`}
                              onClick={() =>
                                patch({ weaponChoices: { ...draft.weaponChoices, [prof]: w.id } })
                              }
                            >
                              <strong>{w.label}</strong>
                              <span>
                                Dano {w.damage} · Ferimento {w.injury ?? "—"} · Carga {w.load}
                                {w.ranged ? " · À distância" : ""}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className="char-wizard-field">
                      <label>Armadura inicial</label>
                      <div className="char-wizard-pick-grid">
                        {ARMOURS.map((a) => (
                          <button
                            key={a.id}
                            type="button"
                            className={`char-wizard-pick${draft.armourId === a.id ? " char-wizard-pick--on" : ""}`}
                            onClick={() => patch({ armourId: a.id })}
                          >
                            <strong>{a.label}</strong>
                            <span>Proteção {a.protection} · Carga {a.load}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="char-wizard-field">
                      <label>Elmo</label>
                      <div className="char-wizard-pick-grid">
                        <button
                          type="button"
                          className={`char-wizard-pick${!draft.helm ? " char-wizard-pick--on" : ""}`}
                          onClick={() => patch({ helm: false })}
                        >
                          <strong>Sem elmo</strong>
                        </button>
                        <button
                          type="button"
                          className={`char-wizard-pick${draft.helm ? " char-wizard-pick--on" : ""}`}
                          onClick={() => patch({ helm: true })}
                        >
                          <strong>{HELM.label}</strong>
                          <span>Proteção {HELM.protection} · Carga {HELM.load}</span>
                        </button>
                      </div>
                    </div>

                    <div className="char-wizard-field">
                      <label>Escudo</label>
                      <div className="char-wizard-pick-grid">
                        <button
                          type="button"
                          className={`char-wizard-pick${!draft.shieldId ? " char-wizard-pick--on" : ""}`}
                          onClick={() => patch({ shieldId: null })}
                        >
                          <strong>Sem escudo</strong>
                        </button>
                        {shieldsForCulture(culture.id).map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            className={`char-wizard-pick${draft.shieldId === s.id ? " char-wizard-pick--on" : ""}`}
                            onClick={() => patch({ shieldId: s.id })}
                          >
                            <strong>{s.label}</strong>
                            <span>Bloqueio +{s.parryModifier} · Carga {s.load}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="char-wizard-meta">Escolha uma Cultura primeiro.</p>
                )}
              </>
            ) : null}

            {stepLabel === "Retrato" ? (
              <>
                <StepHead index={8} title="Retrato" />
                <WizardPortraitStep
                  ref={portraitStepRef}
                  portraitUrl={draft.portraitUrl}
                  tokenImageUrl={draft.tokenImageUrl}
                  portraitFocus={draft.portraitFocus}
                  tokenFocus={draft.tokenFocus}
                  onChange={(p) => patch(p)}
                />
              </>
            ) : null}

            {stepLabel === "Revisão" ? (
              <>
                <StepHead index={9} title="Revisão" />
                {(() => {
                  const invalid = validateTorWizardDraft(draft);
                  if (invalid) {
                    return <p className="char-wizard-err">{invalid} — volte e complete os passos pendentes.</p>;
                  }
                  return (
                    <dl className="char-wizard-review-list">
                      {draft.portraitUrl ? (
                        <>
                          <dt>Retrato</dt>
                          <dd>
                            <div className="char-wizard-review-portrait">
                              <img src={draft.portraitUrl} alt="" />
                            </div>
                          </dd>
                        </>
                      ) : null}
                      <dt>Nome</dt>
                      <dd>{draft.name}</dd>
                      <dt>Cultura</dt>
                      <dd>{culture?.name}</dd>
                      <dt>Chamado</dt>
                      <dd>{calling?.name}</dd>
                      <dt>Perícias Favorecidas</dt>
                      <dd>
                        {[draft.cultureFavouredSkill, ...draft.favouredCallingSkills]
                          .filter(Boolean)
                          .map((s) => SKILL_LABEL[s!])
                          .join(", ")}
                      </dd>
                      <dt>Traços Distintivos</dt>
                      <dd>{draft.distinctiveFeatures.map((id) => DISTINCTIVE_FEATURE_BY_ID[id]?.label).join(", ")}</dd>
                      <dt>Equipamento</dt>
                      <dd>
                        {Object.values(draft.weaponChoices)
                          .map((id) => WEAPON_BY_ID[id!]?.label)
                          .join(", ")}
                        {draft.armourId ? ` · ${ARMOUR_BY_ID[draft.armourId]?.label}` : ""}
                        {draft.helm ? ` · ${HELM.label}` : ""}
                        {draft.shieldId ? ` · ${SHIELD_BY_ID[draft.shieldId]?.label}` : ""}
                      </dd>
                    </dl>
                  );
                })()}
                <p className="char-wizard-meta">
                  Após criar, você pode editar tudo na ficha. Restam <strong>{slotsLeft}</strong>{" "}
                  {slotsLeft === 1 ? "vaga" : "vagas"} na conta.
                </p>
              </>
            ) : null}
          </div>

          {validationErr ? <p className="char-wizard-err">{validationErr}</p> : null}

          <footer className="char-wizard-footer">
            <p className="char-wizard-footer__hint">Passo {step + 1} de {STEPS.length}</p>
            <div className="char-wizard-footer__actions">
              {step > 0 ? (
                <button type="button" className="btn btn-secondary" onClick={back} disabled={busy}>
                  Voltar
                </button>
              ) : null}
              <button
                type="button"
                className="btn btn-primary-cta"
                onClick={handleNextOrFinish}
                disabled={busy || (step === STEPS.length - 1 && slotsLeft <= 0)}
              >
                {step < STEPS.length - 1
                  ? "Próximo"
                  : busy
                    ? "Criando…"
                    : "Criar personagem"}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
