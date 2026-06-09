"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CharacterSheet } from "@/lib/character/types";
import type { LevelUpChoices } from "@/lib/character/level-up";
import {
  getLevelUpRequirements,
  validateLevelUpChoices,
} from "@/lib/character/level-up";
import {
  getLevelUpWizardSteps,
  listSubclassOptions,
  previewLevelUpGroups,
  resolveTrackForWizard,
} from "@/lib/character/level-up-ui";
import { ATTRIBUTE_LABELS, type AttributeKey } from "@/lib/character/rules";
import { parseCharacterTalents } from "@/lib/character/subclass-tracks";
import { TalentTreeGraph } from "@/components/character/TalentTreeGraph";
import "./level-up.css";

type Props = {
  preparedActor: CharacterSheet;
  originalCharacterId: string;
  requestId: string;
};

export function SheetEditLastLevelFlow({
  preparedActor,
  originalCharacterId,
  requestId,
}: Props) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [subclasse, setSubclasse] = useState(preparedActor.identity.subclasse ?? "");
  const [talentoId, setTalentoId] = useState("");
  const [asi, setAsi] = useState<Partial<Record<AttributeKey, number>>>({});

  const steps = useMemo(() => getLevelUpWizardSteps(preparedActor), [preparedActor]);
  const currentStep = steps[stepIndex];
  const owned = useMemo(
    () => parseCharacterTalents(preparedActor.identity.talentos),
    [preparedActor.identity.talentos]
  );
  const track = resolveTrackForWizard(preparedActor, subclasse || undefined);
  const subclassTracks = useMemo(
    () => listSubclassOptions(preparedActor.identity.classe),
    [preparedActor.identity.classe]
  );
  const nextLevel = preparedActor.identity.nivel + 1;

  const choices: LevelUpChoices = useMemo(
    () => ({
      subclasse: subclasse || undefined,
      talentoId: talentoId || undefined,
      asi: Object.keys(asi).length ? asi : undefined,
    }),
    [subclasse, talentoId, asi]
  );

  const previewGroups = useMemo(
    () => previewLevelUpGroups(preparedActor, choices),
    [preparedActor, choices]
  );

  const talentReq = useMemo(
    () => getLevelUpRequirements(preparedActor).find((r) => r.kind === "talento"),
    [preparedActor]
  );

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

  async function confirm() {
    const err = validateLevelUpChoices(preparedActor, choices);
    if (err) {
      setMsg(err);
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/characters/${originalCharacterId}/edit-save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          requestId,
          levelUpChoices: choices,
          preparedCharacter: preparedActor,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Falha ao salvar");
      router.push(`/personagem/${originalCharacterId}`);
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setBusy(false);
    }
  }

  function renderStep() {
    if (!currentStep) return null;
    switch (currentStep.type) {
      case "overview":
        return (
          <p className="lu-hint">
            Reeditando escolhas do <strong>nível {nextLevel}</strong>. Inventário e XP permanecem
            inalterados.
          </p>
        );
      case "subclass":
        return (
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
              </button>
            ))}
          </div>
        );
      case "asi":
        return (
          <div className="lu-asi-grid">
            {(Object.keys(ATTRIBUTE_LABELS) as AttributeKey[]).map((key) => (
              <button
                key={key}
                type="button"
                className={`lu-asi-btn ${asi[key] ? "lu-asi-btn--on" : ""}`}
                onClick={() => toggleAsi(key)}
              >
                {ATTRIBUTE_LABELS[key]} +1
              </button>
            ))}
          </div>
        );
      case "talent":
        return track ? (
          <TalentTreeGraph
            track={track}
            owned={owned}
            actorLevel={preparedActor.identity.nivel}
            pickingLevel={nextLevel}
            selectedId={talentoId}
            onSelect={setTalentoId}
          />
        ) : null;
      case "confirm":
        return (
          <ul className="lu-preview-list">
            {previewGroups.map((g) => (
              <li key={g.title}>
                <strong>{g.title}</strong>
                <ul>
                  {g.lines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        );
      default:
        return null;
    }
  }

  return (
    <div className="lu-shell">
      <header className="lu-header">
        <h2>Reeditar último nível</h2>
        <p>Passo {stepIndex + 1} de {steps.length}</p>
      </header>
      <div className="lu-body">{renderStep()}</div>
      {msg ? <p className="lu-err">{msg}</p> : null}
      <footer className="lu-footer">
        {stepIndex > 0 ? (
          <button type="button" className="btn btn-secondary" onClick={() => setStepIndex((i) => i - 1)}>
            Voltar
          </button>
        ) : null}
        {stepIndex < steps.length - 1 ? (
          <button
            type="button"
            className="btn btn-primary-cta"
            disabled={!canAdvanceStep()}
            onClick={() => setStepIndex((i) => i + 1)}
          >
            Próximo
          </button>
        ) : (
          <button type="button" className="btn btn-primary-cta" disabled={busy} onClick={() => void confirm()}>
            {busy ? "Salvando…" : "Salvar alterações"}
          </button>
        )}
      </footer>
    </div>
  );
}
