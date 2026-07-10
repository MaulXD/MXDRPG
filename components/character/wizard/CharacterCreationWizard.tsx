"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { IconCheck, IconStar } from "@/components/ui/EldarinIcons";
import { useRouter } from "next/navigation";
import { SubclassTrackCard } from "@/components/character/wizard/SubclassTrackCard";
import { WizardHoverTip } from "@/components/character/wizard/WizardHoverTip";
import { WizardEquipmentStep } from "@/components/character/wizard/WizardEquipmentStep";
import {
  WizardPortraitStep,
  type WizardPortraitStepHandle,
} from "@/components/character/wizard/WizardPortraitStep";
import { ReligionPickGrid } from "@/components/character/ReligionPickGrid";
import { religionDisplayName } from "@/lib/character/pantheon";
import { WizardPickIcon } from "@/components/character/wizard/WizardPickIcon";
import { WizardProgress } from "@/components/character/wizard/WizardProgress";
import {
  classIconColor,
  lineageIconColor,
  raceIconColor,
  resolveClassIcon,
  resolveLineageIcon,
  resolveRaceIcon,
} from "@/lib/character/wizard-icons";
import {
  sanitizeWizardDraftForSave,
  validateWizardDraft,
} from "@/lib/character/build-from-wizard";
import { validateDisplayName } from "@/lib/moderation/display-name";
import { characterToWizardDraft } from "@/lib/character/wizard-from-character";
import type { CharacterSheet } from "@/lib/character/types";
import type { SheetEditScope } from "@/lib/character/sheet-edit-request";
import {
  EMPTY_WIZARD_DRAFT,
  type CharacterWizardDraft,
} from "@/lib/character/wizard-types";
import {
  ATTR_ORDER,
  POINT_BUY_MAX_BEFORE_RACIAL,
  POINT_BUY_POOL,
  attributesAfterRacial,
  canDecreasePointBuy,
  canIncreasePointBuy,
  defaultPointBuyScores,
  getRacialBonuses,
  pointBuyCost,
  suggestedPointBuyForClassAndRace,
  totalPointBuyCost,
  validatePointBuy,
} from "@/lib/character/point-buy";
import {
  classAttributeFocusRank,
  classAttributeFocusSummary,
} from "@/lib/character/class-scales";
import { ANTECEDENTE_META } from "@/lib/character/wizard-meta";
import { ANTECEDENTE_SKILL_DEFS } from "@/lib/character/sheet-skills";
import { subclassTrackIntroTooltip } from "@/lib/character/subclass-wizard-tooltips";
import {
  antecedenteGainDescription,
  classFeaturesAtLevelOne,
  classSurvivalPassiveTooltip,
  linhagemTraitLines,
  racialTraitDescription,
} from "@/lib/character/wizard-tooltips";
import { buildWizardPreview } from "@/lib/character/wizard-preview";
import {
  describeStarterEquipment,
  findMatchingStarterKitId,
  getDefaultStarterEquipment,
  getDefaultStarterKitId,
  resolveStarterKitOption,
  validateStarterEquipment,
} from "@/lib/character/starter-kits";
import { listSubclassOptions } from "@/lib/character/level-up-ui";
import {
  ATTRIBUTE_LABELS,
  CLASS_LIST,
  RACE_LIST,
  attributeMod,
  getClass,
  getRace,
  hpMaxFor,
} from "@/lib/character/rules";
import "@/components/character/wizard/wizard.css";
import "@/components/world/world-lore.css";

const STEPS = [
  "Conceito",
  "Raça",
  "Classe",
  "Atributos",
  "Antecedente",
  "Equipamento",
  "Religião",
  "Retrato",
  "Revisão",
] as const;

const STEP_HINTS: Record<(typeof STEPS)[number], string> = {
  Conceito: "Dê um nome memorável — a biografia pode ficar para depois.",
  Raça: "Escolha uma carta; passe o mouse nos traços para ver detalhes.",
  Classe: "Define vida, proficiências e caminhos no nível 2.",
  Atributos:
    "27 pontos no total — a sugestão prioriza o foco da classe (Cap. 4); ajuste livremente com +/−.",
  Antecedente: "História e ganhos do antecedente — itens extras somam ao kit de equipamento.",
  Equipamento: "Escolha arma e armadura dentro das proficiências da classe; a CA já considera o kit.",
  Religião: "Cartas com bônus ao passar o mouse — Sem Deus também tem vantagens próprias.",
  Retrato: "Opcional agora — uma imagem vira retrato e token na mesa.",
  Revisão: "Confira tudo e crie — você pode editar depois na ficha.",
};

const STEP_SHORTCUTS: Partial<Record<(typeof STEPS)[number], string>> = {
  Atributos: "Enter avança quando o pool estiver zerado",
  Retrato: "Pode pular e adicionar imagem depois",
};

type EditMode = {
  scope: SheetEditScope;
  existingCharacter: CharacterSheet;
  requestId: string;
};

type Props = {
  slotsLeft: number;
  /** Ficha vinculada a esta aventura. */
  adventureId?: string | null;
  adventureName?: string | null;
  /** @deprecated use adventureId */
  roomId?: string | null;
  roomName?: string | null;
  editMode?: EditMode;
  /** Wizard embutido na mesa VTT — layout compacto, sem sair da página. */
  variant?: "page" | "mesa";
  /** Após criar na mesa — não redireciona para hub/aventura. */
  onCreated?: (result: { characterId: string; name?: string }) => void;
};

type PointBuyMode = "suggested" | "custom" | "baseline";

function pickInitial(label: string): string {
  const t = label.trim();
  return t ? t[0]!.toUpperCase() : "?";
}

function StepHead({
  index,
  title,
  hint,
}: {
  index: number;
  title: string;
  hint: string;
}) {
  return (
    <div className="char-wizard-step-head">
      <p className="char-wizard-step-head__eyebrow">
        Passo {index + 1} de {STEPS.length}
      </p>
      <h2>{title}</h2>
      <p>{hint}</p>
    </div>
  );
}

export function CharacterCreationWizard({
  slotsLeft,
  adventureId: adventureIdProp = null,
  adventureName = null,
  roomId = null,
  roomName = null,
  editMode,
  variant = "page",
  onCreated,
}: Props) {
  const adventureId = adventureIdProp ?? roomId ?? editMode?.existingCharacter.adventureId ?? null;
  const label = adventureName ?? roomName;
  const router = useRouter();
  const isEdit = Boolean(editMode);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<CharacterWizardDraft>(() => {
    if (editMode?.existingCharacter) {
      return characterToWizardDraft(editMode.existingCharacter);
    }
    return {
      ...EMPTY_WIZARD_DRAFT,
      pointBuy: suggestedPointBuyForClassAndRace(
        EMPTY_WIZARD_DRAFT.classe,
        EMPTY_WIZARD_DRAFT.raca,
        EMPTY_WIZARD_DRAFT.linhagem
      ),
    };
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [pointBuyMode, setPointBuyMode] = useState<PointBuyMode>("suggested");
  const nameInputRef = useRef<HTMLInputElement>(null);
  const portraitStepRef = useRef<WizardPortraitStepHandle>(null);
  const pointBuyClassRaceRef = useRef({
    classe: EMPTY_WIZARD_DRAFT.classe,
    raca: EMPTY_WIZARD_DRAFT.raca,
    linhagem: EMPTY_WIZARD_DRAFT.linhagem as string | null,
  });

  const raceDef = getRace(draft.raca);
  const classDef = getClass(draft.classe);
  const pbSpent = totalPointBuyCost(draft.pointBuy);
  const pbLeft = POINT_BUY_POOL - pbSpent;

  const finalAttrs = useMemo(
    () => attributesAfterRacial(draft.pointBuy, draft.raca, draft.linhagem),
    [draft.pointBuy, draft.raca, draft.linhagem]
  );

  const previewHp = hpMaxFor(draft.classe, 1, attributeMod(finalAttrs.constituicao));
  const previewLines = useMemo(() => buildWizardPreview(draft), [draft]);
  const subclassTracks = useMemo(
    () => listSubclassOptions(draft.classe),
    [draft.classe]
  );

  useEffect(() => {
    const prev = pointBuyClassRaceRef.current;
    const next = {
      classe: draft.classe,
      raca: draft.raca,
      linhagem: draft.linhagem,
    };
    const classRaceChanged =
      prev.classe !== next.classe ||
      prev.raca !== next.raca ||
      prev.linhagem !== next.linhagem;
    pointBuyClassRaceRef.current = next;

    if (pointBuyMode !== "suggested" || !classRaceChanged) return;
    setDraft((d) => ({
      ...d,
      pointBuy: suggestedPointBuyForClassAndRace(d.classe, d.raca, d.linhagem),
    }));
  }, [pointBuyMode, draft.classe, draft.raca, draft.linhagem]);

  function applySuggestedPointBuy() {
    setPointBuyMode("suggested");
    setDraft((d) => ({
      ...d,
      pointBuy: suggestedPointBuyForClassAndRace(d.classe, d.raca, d.linhagem),
    }));
  }

  function resetPointBuyBaseline() {
    setPointBuyMode("baseline");
    setDraft((d) => ({
      ...d,
      pointBuy: defaultPointBuyScores(),
    }));
  }

  const racialBonuses = useMemo(
    () => getRacialBonuses(draft.raca, draft.linhagem),
    [draft.raca, draft.linhagem]
  );

  useEffect(() => {
    if (step === 0) nameInputRef.current?.focus();
  }, [step]);

  function patch(p: Partial<CharacterWizardDraft>) {
    setDraft((d) => ({ ...d, ...p }));
  }

  function setAttr(key: (typeof ATTR_ORDER)[number], delta: number) {
    setDraft((d) => {
      const cur = d.pointBuy[key];
      if (delta > 0 && !canIncreasePointBuy(d.pointBuy, key)) return d;
      if (delta < 0 && !canDecreasePointBuy(d.pointBuy, key)) return d;
      return {
        ...d,
        pointBuy: {
          ...d.pointBuy,
          [key]: Math.max(8, Math.min(POINT_BUY_MAX_BEFORE_RACIAL, cur + delta)),
        },
      };
    });
    setPointBuyMode("custom");
  }

  function stepError(index: number): string | null {
    if (index === 0) {
      const checked = validateDisplayName(draft.name);
      if (!checked.ok) return checked.error;
      return null;
    }
    if (index === 1) {
      if (draft.raca === "Meio-Humano" && !draft.linhagem) return "Escolha a linhagem";
      return null;
    }
    if (index === 3) return validatePointBuy(draft.pointBuy);
    if (index === 4) {
      if (!draft.antecedente) return "Escolha antecedente";
      if (draft.antecedente === "Aventureiro" && !draft.escolhaPericiaAntecedente) {
        return "Aventureiro: escolha a perícia";
      }
      return null;
    }
    if (index === 5) {
      return validateStarterEquipment(draft.classe, draft.starterEquipment);
    }
    if (index === 6) {
      if (!draft.religiao) return "Escolha devotion ou Sem Deus";
      return null;
    }
    return null;
  }

  function firstInvalidStep(): number | null {
    for (let i = 0; i < STEPS.length - 1; i++) {
      const e = stepError(i);
      if (e) return i;
    }
    const v = validateWizardDraft(draft);
    if (!v) return null;
    if (v.includes("pontos") || v.includes("Atributo")) return 3;
    if (v.includes("linhagem") || v.includes("raça")) return 1;
    if (v.includes("antecedente")) return 4;
    if (v.includes("equipamento") || v.includes("kit")) return 5;
    if (v.includes("devotion") || v.includes("religi")) return 6;
    if (v.includes("classe")) return 2;
    if (v.includes("Nome")) return 0;
    return 8;
  }

  const invalidSteps = useMemo(() => {
    if (!showValidation) return [];
    const out: number[] = [];
    for (let i = 0; i < STEPS.length - 1; i++) {
      if (stepError(i)) out.push(i);
    }
    return out;
  }, [showValidation, draft]);

  function goToStep(index: number) {
    if (busy || index < 0 || index >= STEPS.length) return;
    setErr(null);
    setStep(index);
  }

  async function flushPortraitStep(): Promise<boolean> {
    if (step !== 7) return true;
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
    setStep(Math.min(step + 1, STEPS.length - 1));
  }

  function back() {
    setErr(null);
    setStep((s) => Math.max(0, s - 1));
  }

  function handlePanelKeyDown(e: KeyboardEvent) {
    if (e.key !== "Enter" || busy) return;
    if (e.target instanceof HTMLTextAreaElement) return;
    if (step === 3 && pbLeft !== 0) return;
    e.preventDefault();
    if (step < STEPS.length - 1) void next();
    else void finish();
  }

  const stepLabel = STEPS[step]!;
  const footerHint = STEP_SHORTCUTS[stepLabel] ?? STEP_HINTS[stepLabel];
  const nameInitial = draft.name.trim()[0]?.toUpperCase() ?? "?";
  const poolPct = Math.min(100, (pbSpent / POINT_BUY_POOL) * 100);

  async function finish() {
    if (!(await flushPortraitStep())) return;
    const invalidAt = firstInvalidStep();
    if (invalidAt !== null) {
      setShowValidation(true);
      const message = stepError(invalidAt) ?? validateWizardDraft(draft);
      setStep(invalidAt);
      setErr(message ?? (isEdit ? "Revise os passos antes de salvar" : "Revise os passos antes de criar"));
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const payload = sanitizeWizardDraftForSave(draft);

      if (isEdit && editMode) {
        const res = await fetch(`/api/characters/${editMode.existingCharacter.id}/edit-save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            requestId: editMode.requestId,
            draft: payload,
          }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Erro ao salvar");
        router.push(`/personagem/${editMode.existingCharacter.id}`);
        router.refresh();
        return;
      }

      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          ...payload,
          adventureId: adventureId ?? undefined,
          roomId: adventureId ?? undefined,
        }),
      });
      let data: {
        error?: string;
        character?: { id: string; name?: string };
        adventureId?: string | null;
        mesaRoomId?: string | null;
      } = {};
      try {
        data = (await res.json()) as typeof data;
      } catch {
        if (!res.ok) throw new Error(res.status === 413 ? "Dados muito grandes — pule o retrato ou use imagem menor" : `Erro ${res.status}`);
      }
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar");
      if (!data.character?.id) throw new Error("Resposta inválida do servidor");
      const charId = data.character.id;

      if (onCreated) {
        onCreated({ characterId: charId, name: data.character.name });
        return;
      }

      const adv = data.adventureId ?? adventureId ?? null;
      const mesa = data.mesaRoomId ?? null;

      const dest = mesa
        ? `/mesa/${encodeURIComponent(mesa)}`
        : adv
          ? `/aventura/${encodeURIComponent(adv)}?personagem=criado&char=${encodeURIComponent(charId)}`
          : `/personagem/${encodeURIComponent(charId)}`;

      router.push(dest);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`char-wizard${variant === "mesa" ? " char-wizard--mesa-embed" : ""}`}>
      <header className="char-wizard-hero">
        <p className="char-wizard-hero__badge">
          Eldarin · <strong>{slotsLeft}</strong> {slotsLeft === 1 ? "vaga" : "vagas"} na conta
          {adventureId ? (
            <>
              {" "}
              · campanha <strong>{label ?? adventureId}</strong>
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

      {isEdit && editMode?.scope === "full_rebuild" ? (
        <p className="char-wizard-edit-banner" role="note">
          Ao salvar, a ficha volta ao <strong>nível 1</strong> (subclasse e talentos zerados). Seu XP
          permanece — use <strong>Subir de nível</strong> na ficha para escolher subclasse, talentos e
          bônus de cada nível de novo.
        </p>
      ) : null}

      <div className="char-wizard-body">
        <div
          className="glass char-wizard-panel"
          onKeyDown={handlePanelKeyDown}
          role="group"
          aria-label={`Passo: ${stepLabel}`}
        >
          <div className="char-wizard-panel-inner">
        {step === 0 ? (
          <>
            <StepHead index={0} title="Conceito" hint={STEP_HINTS.Conceito} />
            <div
              className={`char-wizard-field char-wizard-field--name${showValidation && stepError(0) ? " char-wizard-field--invalid" : ""}`}
            >
              <label htmlFor="char-name">Nome do personagem</label>
              <input
                id="char-name"
                ref={nameInputRef}
                value={draft.name}
                onChange={(e) => patch({ name: e.target.value })}
                maxLength={80}
                required
                placeholder="Ex: Lyra das Profundezas"
                autoComplete="off"
              />
            </div>
            <div className="char-wizard-field">
              <label htmlFor="char-bio">Biografia (opcional)</label>
              <textarea
                id="char-bio"
                value={draft.biography}
                onChange={(e) => patch({ biography: e.target.value })}
                rows={4}
                maxLength={2000}
                placeholder="Por que está nas masmorras?"
              />
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <StepHead index={1} title="Raça" hint={STEP_HINTS["Raça"]} />
            <div className="char-wizard-pick-grid" role="listbox" aria-label="Raça">
              {RACE_LIST.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  role="option"
                  aria-selected={draft.raca === r.id}
                  className={`char-wizard-pick ${draft.raca === r.id ? "char-wizard-pick--on" : ""}`}
                  onClick={() => {
                    const def = getRace(r.id);
                    const linhagem =
                      r.id === "Meio-Humano"
                        ? draft.linhagem ?? def?.linhagens?.[0]?.id ?? null
                        : null;
                    patch({ raca: r.id, linhagem });
                  }}
                >
                  <div style={{ display: "flex", width: "100%", alignItems: "flex-start" }}>
                    <WizardPickIcon kind={resolveRaceIcon(r.id)} color={raceIconColor(r.id)} />
                    <span className="char-wizard-pick__check" aria-hidden>
                      <IconCheck size={14} />
                    </span>
                  </div>
                  <strong>{r.id}</strong>
                  <span>
                    <WizardHoverTip text={racialTraitDescription(r.traits[0])}>
                      {r.traits[0]}
                    </WizardHoverTip>
                  </span>
                </button>
              ))}
            </div>
            {draft.raca === "Meio-Humano" ? (
              <div
                className={
                  showValidation && stepError(1)
                    ? "char-wizard-step-block--invalid"
                    : undefined
                }
              >
                <p className="char-wizard-meta" style={{ marginBottom: "0.5rem" }}>
                  Escolha a linhagem — define bônus de atributo e traço permanente.
                </p>
                <div className="char-wizard-pick-grid" role="listbox" aria-label="Linhagem">
                  {(raceDef?.linhagens ?? []).map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      role="option"
                      aria-selected={draft.linhagem === l.id}
                      className={`char-wizard-pick ${draft.linhagem === l.id ? "char-wizard-pick--on" : ""}`}
                      onClick={() => patch({ linhagem: l.id })}
                    >
                      <div style={{ display: "flex", width: "100%", alignItems: "flex-start" }}>
                        <WizardPickIcon
                          kind={resolveLineageIcon(l.id)}
                          color={lineageIconColor(l.id)}
                        />
                        <span className="char-wizard-pick__check" aria-hidden>
                          <IconCheck size={14} />
                        </span>
                      </div>
                      <strong>{l.id}</strong>
                      <span>
                        {linhagemTraitLines(l.trait).map((tr, i) => (
                          <span key={tr.name}>
                            {i > 0 ? " · " : null}
                            <WizardHoverTip text={tr.description}>{tr.name}</WizardHoverTip>
                          </span>
                        ))}
                      </span>
                      <span>
                        {Object.entries(l.attributeBonus)
                          .map(([k, v]) => `${ATTRIBUTE_LABELS[k as keyof typeof ATTRIBUTE_LABELS]} +${v}`)
                          .join(" · ")}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {raceDef ? (
              <>
                <p className="char-wizard-meta" style={{ marginTop: "0.75rem", marginBottom: "0.35rem" }}>
                  Habilidades raciais — passe o mouse para ver o efeito:
                </p>
                <ul className="char-wizard-notes">
                  {raceDef.traits.map((t) => (
                    <li key={t}>
                      <WizardHoverTip text={racialTraitDescription(t)}>{t}</WizardHoverTip>
                    </li>
                  ))}
                </ul>
                {draft.raca === "Meio-Humano" && draft.linhagem ? (
                  <>
                    <p className="char-wizard-meta" style={{ marginTop: "0.5rem", marginBottom: "0.35rem" }}>
                      Traços da {draft.linhagem}:
                    </p>
                    <ul className="char-wizard-notes">
                      {linhagemTraitLines(
                        raceDef.linhagens?.find((l) => l.id === draft.linhagem)?.trait ?? ""
                      ).map((tr) => (
                        <li key={tr.name}>
                          <WizardHoverTip text={tr.description}>{tr.name}</WizardHoverTip>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
                <p className="char-wizard-meta" style={{ marginTop: "0.5rem" }}>
                  Marcos raciais e talentos de classe aparecem na ficha em{" "}
                  <strong>Níveis futuros</strong>.
                </p>
              </>
            ) : null}
          </>
        ) : null}

        {step === 2 ? (
          <>
            <StepHead index={2} title="Classe" hint={STEP_HINTS.Classe} />
            <div className="char-wizard-pick-grid" role="listbox" aria-label="Classe">
              {CLASS_LIST.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="option"
                  aria-selected={draft.classe === c.id}
                  className={`char-wizard-pick ${draft.classe === c.id ? "char-wizard-pick--on" : ""}`}
                  onClick={() => {
                    patch({
                      classe: c.id,
                      starterKitId: getDefaultStarterKitId(c.id),
                      starterEquipment: getDefaultStarterEquipment(c.id),
                    });
                  }}
                >
                  <div style={{ display: "flex", width: "100%", alignItems: "flex-start" }}>
                    <WizardPickIcon kind={resolveClassIcon(c.id)} color={classIconColor(c.id)} />
                    <span className="char-wizard-pick__check" aria-hidden>
                      <IconCheck size={14} />
                    </span>
                  </div>
                  <strong>{c.id}</strong>
                  <span>
                    d{c.hpDie} · {c.primary}
                  </span>
                </button>
              ))}
            </div>
            {classDef ? (
              <>
                <ul className="char-wizard-notes">
                  <li>
                    <strong>Proficiências:</strong>{" "}
                    <WizardHoverTip text={`Armas, armaduras e ferramentas que ${draft.classe} usa sem penalidade de treino.`}>
                      {classDef.proficiencies}
                    </WizardHoverTip>
                  </li>
                  <li>
                    <WizardHoverTip text={classSurvivalPassiveTooltip(draft.classe)}>
                      <strong>Bônus passivo (nv 1):</strong> {classDef.dietBonus}
                    </WizardHoverTip>
                  </li>
                  {classFeaturesAtLevelOne(draft.classe)
                    .filter((f) => !f.startsWith("Proficiências:"))
                    .map((f) => (
                      <li key={f}>
                        <strong>Nv 1:</strong> {f}
                      </li>
                    ))}
                  <li>
                    <WizardHoverTip text={subclassTrackIntroTooltip()}>
                      <strong>Nível 2:</strong> escolha um Caminho de Assimilação (subclasse) — trilhas abaixo.
                    </WizardHoverTip>
                  </li>
                </ul>
                {subclassTracks.length ? (
                  <div className="char-wizard-tracks">
                    <p className="char-wizard-meta">Caminhos disponíveis no nível 2</p>
                    {subclassTracks.map((t) => (
                      <SubclassTrackCard key={t.id} track={t} />
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}
          </>
        ) : null}

        {step === 3 ? (
          <>
            <StepHead index={3} title="Atributos" hint={STEP_HINTS.Atributos} />
            <div
              className={`char-wizard-pool${showValidation && stepError(3) ? " char-wizard-step-block--invalid" : ""}`}
            >
              <div className="char-wizard-pool__meter" style={{ flex: "1 1 12rem", minWidth: 0 }}>
                <label>
                  Pool de pontos
                  <strong className={pbLeft === 0 ? "is-ok" : "is-warn"}>
                    {pbLeft} restantes
                  </strong>
                </label>
                <div className="char-wizard-pool__bar" aria-hidden>
                  <span style={{ width: `${poolPct}%` }} />
                </div>
              </div>
              {pointBuyMode === "suggested" && pbLeft === 0 ? (
                <p className="char-wizard-meta" style={{ margin: 0 }}>
                  Sugestão para <strong>{draft.classe}</strong> ({draft.raca}
                  {draft.linhagem ? ` · ${draft.linhagem}` : ""}) — foco:{" "}
                  <strong>{classAttributeFocusSummary(draft.classe)}</strong>
                  {draft.classe === "Guerreiro" ? (
                    <> (padrão corpo a corpo; arqueiro pode inverter DES e FOR)</>
                  ) : null}
                </p>
              ) : pointBuyMode === "baseline" ? (
                <p className="char-wizard-meta" style={{ margin: 0 }}>
                  Baseline 8 em tudo — distribua os <strong>27 pontos</strong> (antes dos bônus raciais).
                </p>
              ) : null}
            </div>
            <div className="char-wizard-attr-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={applySuggestedPointBuy}
              >
                Sugestão para {draft.classe}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={resetPointBuyBaseline}
              >
                Resetar (8 em tudo)
              </button>
            </div>
            <div className="char-wizard-attr-grid">
              {ATTR_ORDER.map((key) => {
                const base = draft.pointBuy[key];
                const racial = racialBonuses[key] ?? 0;
                const final = finalAttrs[key];
                const mod = attributeMod(final);
                const focusRank = classAttributeFocusRank(draft.classe, key);
                return (
                  <div
                    key={key}
                    className={`char-wizard-attr-card${focusRank ? " char-wizard-attr-card--focus" : ""}`}
                  >
                    <span className="char-wizard-attr-card__label">
                      {ATTRIBUTE_LABELS[key]}
                      {focusRank ? (
                        <span className="char-wizard-attr-card__focus" title="Foco da classe">
                          {focusRank === 1 ? <IconStar size={12} /> : focusRank}
                        </span>
                      ) : null}
                    </span>
                    <span className="char-wizard-attr-card__score">{base}</span>
                    <span className="char-wizard-attr-card__mod">
                      {racial > 0 ? (
                        <>
                          +{racial} raça → <strong>{final}</strong> (mod {mod >= 0 ? "+" : ""}
                          {mod})
                        </>
                      ) : (
                        <>
                          mod {mod >= 0 ? "+" : ""}
                          {mod} → {final}
                        </>
                      )}
                    </span>
                    <span className="char-wizard-attr-card__cost">
                      custo {pointBuyCost(base)}
                    </span>
                    <div className="char-wizard-attr-card__controls">
                      <button
                        type="button"
                        onClick={() => setAttr(key, -1)}
                        disabled={!canDecreasePointBuy(draft.pointBuy, key)}
                        aria-label={`Diminuir ${ATTRIBUTE_LABELS[key]}`}
                      >
                        −
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttr(key, 1)}
                        disabled={!canIncreasePointBuy(draft.pointBuy, key)}
                        aria-label={`Aumentar ${ATTRIBUTE_LABELS[key]}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <StepHead index={4} title="Antecedente" hint={STEP_HINTS.Antecedente} />
            <div className="char-wizard-pick-grid char-wizard-pick-grid--wide" role="listbox" aria-label="Antecedente">
              {ANTECEDENTE_META.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  role="option"
                  aria-selected={draft.antecedente === a.id}
                  className={`char-wizard-pick ${draft.antecedente === a.id ? "char-wizard-pick--on" : ""}`}
                  onClick={() => patch({ antecedente: a.id, escolhaPericiaAntecedente: a.id !== "Aventureiro" ? null : draft.escolhaPericiaAntecedente })}
                >
                  <div style={{ display: "flex", width: "100%", alignItems: "flex-start" }}>
                    <span className="char-wizard-pick__icon">{pickInitial(a.title)}</span>
                    <span className="char-wizard-pick__check" aria-hidden>
                      <IconCheck size={14} />
                    </span>
                  </div>
                  <strong>{a.title}</strong>
                  <span>{a.summary}</span>
                  <span>
                    Você ganha:{" "}
                    {a.gains.map((g, i) => (
                      <span key={g}>
                        {i > 0 ? " · " : null}
                        <WizardHoverTip text={antecedenteGainDescription(g)}>{g}</WizardHoverTip>
                      </span>
                    ))}
                  </span>
                </button>
              ))}
            </div>
            {draft.antecedente === "Aventureiro" ? (
              <div className="char-wizard-aventureiro-pick">
                <p className="char-wizard-aventureiro-pick__label">
                  Escolha a perícia que o Aventureiro traz:
                </p>
                <div className="char-wizard-aventureiro-pick__grid" role="group" aria-label="Perícia do Aventureiro">
                  {ANTECEDENTE_SKILL_DEFS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`char-wizard-aventureiro-btn${draft.escolhaPericiaAntecedente === s.id ? " char-wizard-aventureiro-btn--on" : ""}`}
                      onClick={() => patch({ escolhaPericiaAntecedente: s.id })}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        {step === 5 ? (
          <>
            <StepHead index={5} title="Equipamento inicial" hint={STEP_HINTS.Equipamento} />
            <div
              className={
                showValidation && stepError(5) ? "char-wizard-step-block--invalid" : undefined
              }
            >
            <WizardEquipmentStep
              classe={draft.classe}
              attributes={finalAttrs}
              starterKitId={draft.starterKitId}
              equipment={draft.starterEquipment}
              onChange={(p) => patch(p)}
            />
            </div>
          </>
        ) : null}

        {step === 6 ? (
          <>
            <StepHead index={6} title="Religião e devotion" hint={STEP_HINTS.Religião} />
            <div
              className={
                showValidation && stepError(6) ? "char-wizard-step-block--invalid" : undefined
              }
            >
            <ReligionPickGrid
              value={draft.religiao}
              onChange={(id) => patch({ religiao: id })}
            />
            </div>
          </>
        ) : null}

        {step === 7 ? (
          <>
            <StepHead index={7} title="Retrato e token" hint={STEP_HINTS.Retrato} />
            <WizardPortraitStep
              ref={portraitStepRef}
              portraitUrl={draft.portraitUrl ?? null}
              tokenImageUrl={draft.tokenImageUrl ?? null}
              portraitFocus={draft.portraitFocus ?? null}
              tokenFocus={draft.tokenFocus ?? null}
              onChange={(p) => patch(p)}
            />
          </>
        ) : null}

        {step === 8 ? (
          <>
            <StepHead index={8} title="Revisão" hint={STEP_HINTS.Revisão} />
            <div className="char-wizard-review-grid">
              <dl
                className={`char-wizard-review-card${showValidation && stepError(0) ? " char-wizard-review-card--invalid" : ""}`}
              >
                <dt>Nome</dt>
                <dd>
                  {draft.name.trim() || "—"}
                  {showValidation && stepError(0) ? (
                    <button type="button" className="char-wizard-review-fix" onClick={() => goToStep(0)}>
                      Corrigir
                    </button>
                  ) : null}
                </dd>
              </dl>
              <dl
                className={`char-wizard-review-card${showValidation && stepError(1) ? " char-wizard-review-card--invalid" : ""}`}
              >
                <dt>Raça</dt>
                <dd>
                  {draft.raca}
                  {draft.linhagem ? ` (${draft.linhagem})` : ""}
                  {showValidation && stepError(1) ? (
                    <button type="button" className="char-wizard-review-fix" onClick={() => goToStep(1)}>
                      Corrigir
                    </button>
                  ) : null}
                </dd>
              </dl>
              <dl className="char-wizard-review-card">
                <dt>Classe</dt>
                <dd>
                  {draft.classe} · nível 1
                  {classDef ? (
                    <>
                      <br />
                      <span className="char-wizard-meta">{classDef.dietBonus}</span>
                    </>
                  ) : null}
                </dd>
              </dl>
              {subclassTracks.length ? (
                <dl className="char-wizard-review-card" style={{ gridColumn: "1 / -1" }}>
                  <dt>Caminhos (nv 2)</dt>
                  <dd>{subclassTracks.map((t) => t.subclass).join(" · ")}</dd>
                </dl>
              ) : null}
              <dl
                className={`char-wizard-review-card${showValidation && stepError(4) ? " char-wizard-review-card--invalid" : ""}`}
              >
                <dt>Antecedente</dt>
                <dd>
                  {draft.antecedente || "—"}
                  {showValidation && stepError(4) ? (
                    <button type="button" className="char-wizard-review-fix" onClick={() => goToStep(4)}>
                      Corrigir
                    </button>
                  ) : null}
                </dd>
              </dl>
              <dl
                className={`char-wizard-review-card${showValidation && stepError(5) ? " char-wizard-review-card--invalid" : ""}`}
              >
                <dt>Equipamento</dt>
                <dd>
                  {(() => {
                    const kitId = findMatchingStarterKitId(draft.classe, draft.starterEquipment);
                    const preset = kitId
                      ? resolveStarterKitOption(draft.classe, kitId)
                      : null;
                    if (preset) return `${preset.label} — ${describeStarterEquipment(draft.starterEquipment)}`;
                    return describeStarterEquipment(draft.starterEquipment);
                  })()}
                  {showValidation && stepError(5) ? (
                    <button type="button" className="char-wizard-review-fix" onClick={() => goToStep(5)}>
                      Corrigir
                    </button>
                  ) : null}
                </dd>
              </dl>
              <dl
                className={`char-wizard-review-card${showValidation && stepError(6) ? " char-wizard-review-card--invalid" : ""}`}
              >
                <dt>Devotion</dt>
                <dd>
                  {religionDisplayName(draft.religiao)}
                  {showValidation && stepError(6) ? (
                    <button type="button" className="char-wizard-review-fix" onClick={() => goToStep(6)}>
                      Corrigir
                    </button>
                  ) : null}
                </dd>
              </dl>
              <dl className="char-wizard-review-card">
                <dt>Vida máxima</dt>
                <dd>{previewHp}</dd>
              </dl>
              <dl className="char-wizard-review-card">
                <dt>Retrato</dt>
                <dd>
                  {draft.portraitUrl ? (
                    <div className="char-wizard-review-portrait">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={draft.portraitUrl} alt="" />
                    </div>
                  ) : (
                    "Adicionar depois na ficha"
                  )}
                </dd>
              </dl>
            </div>
            <p
              className={`char-wizard-meta${showValidation && stepError(3) ? " char-wizard-step-block--invalid" : ""}`}
              style={{ marginBottom: "0.75rem", padding: showValidation && stepError(3) ? "0.5rem 0.75rem" : undefined }}
            >
              Atributos finais
              {showValidation && stepError(3) ? (
                <button type="button" className="char-wizard-review-fix" onClick={() => goToStep(3)}>
                  Corrigir
                </button>
              ) : null}
            </p>
            <div className="char-wizard-preview-chips">
              {ATTR_ORDER.map((k) => (
                <span key={k} className="char-wizard-preview-chip">
                  {ATTRIBUTE_LABELS[k]} {finalAttrs[k]}
                </span>
              ))}
            </div>
            <dl className="char-wizard-preview-list">
              {previewLines.map((line) => (
                <div key={line.label} className="char-wizard-preview-row">
                  <dt>{line.label}</dt>
                  <dd>{line.value}</dd>
                </div>
              ))}
            </dl>
            <p className="char-wizard-meta">
              Após criar, você pode editar tudo na ficha. Restam{" "}
              <strong>{slotsLeft}</strong> {slotsLeft === 1 ? "vaga" : "vagas"} na conta.
            </p>
          </>
        ) : null}
          </div>

        {err ? <p className="char-wizard-err">{err}</p> : null}

        <footer className="char-wizard-footer">
          <p className="char-wizard-footer__hint">{footerHint}</p>
          <div className="char-wizard-footer__actions">
            {step > 0 ? (
              <button type="button" className="btn btn-secondary" onClick={back} disabled={busy}>
                Voltar
              </button>
            ) : null}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                className="btn btn-primary-cta"
                onClick={next}
                disabled={busy}
              >
                Próximo
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary-cta"
                onClick={finish}
                disabled={busy || slotsLeft <= 0}
              >
                {busy ? (isEdit ? "Salvando…" : "Criando…") : isEdit ? "Salvar alterações" : "Criar personagem"}
              </button>
            )}
          </div>
        </footer>
        </div>

        <aside className="glass char-wizard-preview" aria-label="Prévia da ficha">
          <p className="char-wizard-preview-eyebrow">Prévia ao vivo</p>
          <div className="char-wizard-preview__portrait" aria-hidden>
            {draft.portraitUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={draft.portraitUrl} alt="" />
            ) : (
              nameInitial
            )}
          </div>
          <h3 className="char-wizard-preview-title">{draft.name.trim() || "Sem nome"}</h3>
          <p className="char-wizard-preview-sub">
            {draft.raca}
            {draft.linhagem ? ` · ${draft.linhagem}` : ""}
            <br />
            {draft.classe} · {draft.antecedente}
            <br />
            {religionDisplayName(draft.religiao)}
          </p>
          <div className="char-wizard-preview-chips">
            <span className="char-wizard-preview-chip">Nv 1</span>
            <span className="char-wizard-preview-chip">{draft.classe}</span>
            {draft.linhagem ? (
              <span className="char-wizard-preview-chip">{draft.linhagem}</span>
            ) : null}
          </div>
          <div className="char-wizard-preview-hp">
            <label>
              Vida
              <strong>{previewHp}</strong>
            </label>
            <div className="char-wizard-preview-hp-bar" aria-hidden>
              <span />
            </div>
          </div>
          <dl className="char-wizard-preview-list">
            {previewLines.slice(0, 6).map((line) => (
              <div key={line.label} className="char-wizard-preview-row">
                <dt>{line.label}</dt>
                <dd>{line.value}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </div>
  );
}
