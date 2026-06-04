"use client";

import { useEffect, useMemo, useState } from "react";
import type { CharacterSheet } from "@/lib/character/types";
import type { LevelUpChoices } from "@/lib/character/level-up";
import {
  canLevelUp,
  getLevelUpRequirements,
  validateLevelUpChoices,
} from "@/lib/character/level-up";
import {
  getLevelUpWizardSteps,
  listSubclassOptions,
  previewLevelUpGroups,
  resolveTrackForWizard,
  type LevelUpWizardStep,
} from "@/lib/character/level-up-ui";
import { ATTRIBUTE_LABELS, type AttributeKey } from "@/lib/character/rules";
import { parseCharacterTalents } from "@/lib/character/subclass-tracks";
import { formatXpProgress, xpToNextLevel } from "@/lib/character/xp";
import { levelUpRoomActor, type LevelUpRoomResponse } from "@/hooks/useRoomSync";
import { TalentTreeGraph } from "@/components/character/TalentTreeGraph";
import "./level-up.css";

type Props = {
  actor: CharacterSheet;
  roomId: string;
  canEdit: boolean;
  onDone: () => void | Promise<void>;
  /** Atualiza o sync da mesa logo após o POST (antes do refresh). */
  onApplied?: (patch: LevelUpRoomResponse) => void;
};

const STEP_LABEL: Record<LevelUpWizardStep["type"], string> = {
  overview: "Resumo",
  subclass: "Subclasse",
  asi: "Atributos",
  talent: "Talento",
  ascension: "Ascensão",
  confirm: "Confirmar",
};

export function LevelUpWizard({ actor, roomId, canEdit, onDone, onApplied }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  const [subclasse, setSubclasse] = useState(actor.identity.subclasse ?? "");
  const [talentoId, setTalentoId] = useState("");
  const [asi, setAsi] = useState<Partial<Record<AttributeKey, number>>>({});

  const nextLevel = actor.identity.nivel + 1;
  const steps = useMemo(() => getLevelUpWizardSteps(actor), [actor]);
  const currentStep = steps[stepIndex];
  const owned = useMemo(() => parseCharacterTalents(actor.identity.talentos), [actor.identity.talentos]);
  const track = resolveTrackForWizard(actor, subclasse || undefined);
  const subclassTracks = useMemo(
    () => listSubclassOptions(actor.identity.classe),
    [actor.identity.classe]
  );

  const choices: LevelUpChoices = useMemo(
    () => ({
      subclasse: subclasse || undefined,
      talentoId: talentoId || undefined,
      asi: Object.keys(asi).length ? asi : undefined,
    }),
    [subclasse, talentoId, asi]
  );

  const previewGroups = useMemo(
    () => previewLevelUpGroups(actor, choices),
    [actor, choices]
  );

  const talentReq = useMemo(
    () => getLevelUpRequirements(actor).find((r) => r.kind === "talento"),
    [actor]
  );

  useEffect(() => {
    if (!open) return;
    setStepIndex(0);
    setSubclasse(actor.identity.subclasse ?? "");
    setTalentoId("");
    setAsi({});
    setMsg(null);
  }, [open, actor.identity.subclasse]);

  if (!canEdit) return null;

  function toggleAsi(key: AttributeKey) {
    setAsi((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = 1;
      const keys = Object.keys(next);
      if (keys.length > 2) delete next[keys[0] as AttributeKey];
      return next;
    });
  }

  const asiPointsUsed = Object.values(asi).reduce((s, v) => s + (v ?? 0), 0);

  function canAdvanceStep(): boolean {
    if (!currentStep) return false;
    if (currentStep.type === "subclass") return Boolean(subclasse);
    if (currentStep.type === "asi") return asiPointsUsed === currentStep.points;
    if (currentStep.type === "talent") {
      if (!talentReq?.options.length) return false;
      return Boolean(talentoId);
    }
    return true;
  }

  function goNext() {
    if (stepIndex < steps.length - 1) setStepIndex((i) => i + 1);
  }

  function goBack() {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  }

  async function confirm() {
    const err = validateLevelUpChoices(actor, choices);
    if (err) {
      setMsg(err);
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const patch = await levelUpRoomActor(roomId, actor.id, choices);
      onApplied?.(patch);
      await onDone();
      setOpen(false);
      setTalentoId("");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao subir nível");
    } finally {
      setBusy(false);
    }
  }

  const ready = canLevelUp(actor);

  function renderStep() {
    if (!currentStep) return null;

    switch (currentStep.type) {
      case "overview":
        return (
          <>
            <p className="lu-hint">
              Você está subindo para o <strong>nível {nextLevel}</strong>. O assistente segue o
              fluxo do Foundry: bônus automáticos, depois escolhas de subclasse, atributos e
              talentos na árvore da trilha.
            </p>
            {track ? (
              <TalentTreeGraph
                track={track}
                owned={owned}
                actorLevel={actor.identity.nivel}
                compact
              />
            ) : (
              <p className="lu-hint">No nv 2 você escolhe a subclasse (Dieta Marcial) e desbloqueia a trilha.</p>
            )}
          </>
        );

      case "subclass":
        return (
          <>
            <p className="lu-hint">
              Escolha sua <strong>Dieta Marcial</strong> (subclasse). Cada cartão mostra a trilha de
              talentos nv 4 → 8 → 12 → 16 → ascensão 20.
            </p>
            <div className="lu-subclass-grid">
              {subclassTracks.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`lu-subclass-card ${subclasse === t.subclass ? "lu-subclass-card--active" : ""}`}
                  onClick={() => {
                    setSubclasse(t.subclass);
                    setTalentoId("");
                  }}
                >
                  <h4>{t.subclass}</h4>
                  <p>{t.specialty}</p>
                  <p style={{ marginTop: "0.35rem" }}>{t.diet}</p>
                </button>
              ))}
            </div>
            {subclasse && track ? (
              <div style={{ marginTop: "1rem" }}>
                <TalentTreeGraph
                  track={track}
                  owned={owned}
                  actorLevel={actor.identity.nivel}
                  pickingLevel={2}
                  compact
                />
              </div>
            ) : null}
          </>
        );

      case "asi":
        return (
          <>
            <p className="lu-hint">
              Humano nv4: distribua <strong>+1 em dois atributos</strong> diferentes (máx. 20).
            </p>
            <div className="lu-asi-grid">
              {(Object.keys(ATTRIBUTE_LABELS) as AttributeKey[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`lu-asi-btn ${asi[k] ? "lu-asi-btn--on" : ""}`}
                  onClick={() => toggleAsi(k)}
                >
                  {ATTRIBUTE_LABELS[k]}
                  {asi[k] ? " +1" : ""}
                </button>
              ))}
            </div>
            <p className="lu-asi-counter">
              Pontos: {asiPointsUsed} / {currentStep.points}
            </p>
          </>
        );

      case "talent":
        return (
          <>
            <p className="lu-hint">
              Escolha o talento do <strong>nível {currentStep.level}</strong> na árvore. Os nós
              anteriores precisam estar completos (cadeia 4→8→12→16).
            </p>
            {track ? (
              <TalentTreeGraph
                track={track}
                owned={owned}
                actorLevel={actor.identity.nivel}
                pickingLevel={currentStep.level}
                selectedId={talentoId}
                onSelect={setTalentoId}
              />
            ) : (
              <p className="lu-err">Defina uma subclasse antes de escolher talentos.</p>
            )}
            {!talentReq?.options.length ? (
              <p className="lu-err">
                Complete o talento nv {currentStep.level - 4} antes de subir — volte nos níveis
                anteriores.
              </p>
            ) : null}
          </>
        );

      case "ascension":
        return (
          <>
            <div className="lu-ascension-banner">
              <strong>Ascensão — nível 20</strong>
              <span>{currentStep.name} será aplicada automaticamente ao confirmar.</span>
            </div>
            {track ? (
              <TalentTreeGraph
                track={track}
                owned={owned}
                actorLevel={actor.identity.nivel}
                pickingLevel={20}
                compact
              />
            ) : null}
          </>
        );

      case "confirm":
        return (
          <>
            <p className="lu-hint">Revise tudo antes de aplicar na ficha e sincronizar a mesa.</p>
            <ul className="lu-confirm-list">
              <li>
                <strong>Nível:</strong> {actor.identity.nivel} → {nextLevel}
              </li>
              {choices.subclasse ? (
                <li>
                  <strong>Subclasse:</strong> {choices.subclasse}
                </li>
              ) : null}
              {choices.talentoId && track ? (
                <li>
                  <strong>Talento:</strong>{" "}
                  {track.talents.find((t) => t.id === choices.talentoId)?.name ?? choices.talentoId}
                </li>
              ) : null}
              {choices.asi ? (
                <li>
                  <strong>Atributos:</strong>{" "}
                  {Object.entries(choices.asi)
                    .filter(([, v]) => v)
                    .map(([k]) => ATTRIBUTE_LABELS[k as AttributeKey])
                    .join(", ")}
                </li>
              ) : null}
            </ul>
          </>
        );

      default:
        return null;
    }
  }

  return (
    <div className="sheet-level-box">
      <p className="sheet-xp-line">{formatXpProgress(actor.identity.nivel, actor.identity.xpTotal)}</p>

      <div className="lu-trigger-row">
        <button
          type="button"
          className={`btn ${ready ? "btn--level-ready" : ""}`}
          disabled={!ready}
          onClick={() => setOpen(true)}
        >
          {ready ? "Subir de nível" : "Subir nível…"}
        </button>
        {!ready ? (
          <span className="sheet-xp-line" style={{ margin: 0 }}>
            {actor.identity.nivel >= 20
              ? "Nível máximo"
              : `Faltam ${xpToNextLevel(actor.identity.nivel, actor.identity.xpTotal ?? 0)} XP`}
          </span>
        ) : null}
      </div>

      {open ? (
        <div className="lu-overlay" role="presentation" onClick={() => !busy && setOpen(false)}>
          <div
            className="lu-shell"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lu-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="lu-header">
              <div>
                <h2 id="lu-title">
                  Level up — {actor.name}
                </h2>
                <p className="lu-header-meta">
                  {actor.identity.classe} · Nv {actor.identity.nivel} → {nextLevel}
                  {actor.identity.subclasse ? ` · ${actor.identity.subclasse}` : ""}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost lu-close"
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                Fechar
              </button>
            </header>

            <nav className="lu-stepper" aria-label="Passos do level up">
              {steps.map((s, i) => (
                <span
                  key={`${s.type}-${i}`}
                  className={`lu-step-pill ${i === stepIndex ? "lu-step-pill--active" : ""} ${i < stepIndex ? "lu-step-pill--done" : ""}`}
                >
                  {i + 1}. {STEP_LABEL[s.type]}
                </span>
              ))}
            </nav>

            <div className="lu-body">
              <div className="lu-main">{renderStep()}</div>
              <aside className="lu-aside">
                <p className="lu-aside-title">Bônus aplicáveis</p>
                {previewGroups.map((g) => (
                  <div key={g.id} className="lu-bonus-group">
                    <h5>{g.title}</h5>
                    <ul>
                      {g.lines.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </aside>
            </div>

            <footer className="lu-footer">
              <span className="sheet-xp-line" style={{ margin: 0 }}>
                {formatXpProgress(actor.identity.nivel, actor.identity.xpTotal)}
              </span>
              <div className="lu-footer-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={busy || stepIndex === 0}
                  onClick={goBack}
                >
                  Voltar
                </button>
                {currentStep?.type === "confirm" ? (
                  <button type="button" className="btn" disabled={busy} onClick={confirm}>
                    {busy ? "Aplicando…" : `Aplicar nível ${nextLevel}`}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn"
                    disabled={!canAdvanceStep()}
                    onClick={goNext}
                  >
                    Próximo
                  </button>
                )}
              </div>
            </footer>
            {msg ? <p className="lu-err" style={{ padding: "0 1rem 0.75rem" }}>{msg}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
