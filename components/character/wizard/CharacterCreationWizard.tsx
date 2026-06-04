"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { WizardPortraitStep } from "@/components/character/wizard/WizardPortraitStep";
import {
  ANTECEDENTE_OPTIONS,
  EMPTY_WIZARD_DRAFT,
  type CharacterWizardDraft,
} from "@/lib/character/wizard-types";
import {
  ATTR_ORDER,
  POINT_BUY_POOL,
  attributesAfterRacial,
  pointBuyCost,
  totalPointBuyCost,
  validatePointBuy,
} from "@/lib/character/point-buy";
import {
  ATTRIBUTE_LABELS,
  CLASS_LIST,
  RACE_LIST,
  attributeMod,
  getClass,
  getRace,
  hpMaxFor,
} from "@/lib/character/rules";
import { validateWizardDraft } from "@/lib/character/build-from-wizard";
import "@/components/character/wizard/wizard.css";

const STEPS = [
  "Conceito",
  "Raça",
  "Classe",
  "Atributos",
  "Antecedente",
  "Retrato",
  "Revisão",
] as const;

type Props = {
  slotsLeft: number;
};

export function CharacterCreationWizard({ slotsLeft }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<CharacterWizardDraft>({ ...EMPTY_WIZARD_DRAFT });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const raceDef = getRace(draft.raca);
  const classDef = getClass(draft.classe);
  const pbSpent = totalPointBuyCost(draft.pointBuy);
  const pbLeft = POINT_BUY_POOL - pbSpent;

  const finalAttrs = useMemo(
    () => attributesAfterRacial(draft.pointBuy, draft.raca, draft.linhagem),
    [draft.pointBuy, draft.raca, draft.linhagem]
  );

  const previewHp = hpMaxFor(draft.classe, 1, attributeMod(finalAttrs.constituicao));

  function patch(p: Partial<CharacterWizardDraft>) {
    setDraft((d) => ({ ...d, ...p }));
  }

  function setAttr(key: (typeof ATTR_ORDER)[number], delta: number) {
    setDraft((d) => ({
      ...d,
      pointBuy: {
        ...d.pointBuy,
        [key]: Math.max(8, Math.min(15, d.pointBuy[key] + delta)),
      },
    }));
  }

  function stepError(index: number): string | null {
    if (index === 0) {
      if (!draft.name.trim()) return "Nome obrigatório";
      return null;
    }
    if (index === 1) {
      if (draft.raca === "Meio-Humano" && !draft.linhagem) return "Escolha a linhagem";
      return null;
    }
    if (index === 3) return validatePointBuy(draft.pointBuy);
    if (index === 4) {
      if (!draft.antecedente) return "Escolha antecedente";
      return null;
    }
    return null;
  }

  function next() {
    const e = stepError(step);
    if (e) {
      setErr(e);
      return;
    }
    setErr(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setErr(null);
    setStep((s) => Math.max(0, s - 1));
  }

  async function finish() {
    const validation = validateWizardDraft(draft);
    if (validation) {
      setErr(validation);
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar");
      router.push(`/personagem/${data.character.id}`);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro");
      setBusy(false);
    }
  }

  return (
    <div className="char-wizard">
      <nav className="char-wizard-steps" aria-label="Passos">
        {STEPS.map((label, i) => (
          <span
            key={label}
            className={`char-wizard-step ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}
          >
            {i + 1}. {label}
          </span>
        ))}
      </nav>

      <div className="glass char-wizard-panel">
        {step === 0 ? (
          <>
            <h2>Conceito</h2>
            <label>
              Nome do personagem
              <input
                value={draft.name}
                onChange={(e) => patch({ name: e.target.value })}
                maxLength={80}
                required
                placeholder="Ex: Lyra das Profundezas"
              />
            </label>
            <label>
              Biografia (opcional)
              <textarea
                value={draft.biography}
                onChange={(e) => patch({ biography: e.target.value })}
                rows={4}
                maxLength={2000}
                placeholder="Por que está nas masmorras?"
              />
            </label>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <h2>Raça</h2>
            <label>
              Raça
              <select
                value={draft.raca}
                onChange={(e) =>
                  patch({
                    raca: e.target.value,
                    linhagem: e.target.value === "Meio-Humano" ? draft.linhagem : null,
                  })
                }
              >
                {RACE_LIST.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id}
                  </option>
                ))}
              </select>
            </label>
            {draft.raca === "Meio-Humano" ? (
              <label>
                Linhagem
                <select
                  value={draft.linhagem ?? ""}
                  onChange={(e) => patch({ linhagem: e.target.value || null })}
                >
                  <option value="">— escolher —</option>
                  {(raceDef?.linhagens ?? []).map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.id}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {raceDef ? (
              <ul className="char-wizard-notes">
                {raceDef.traits.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            ) : null}
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h2>Classe</h2>
            <label>
              Classe
              <select value={draft.classe} onChange={(e) => patch({ classe: e.target.value })}>
                {CLASS_LIST.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} (d{c.hpDie} · {c.primary})
                  </option>
                ))}
              </select>
            </label>
            {classDef ? (
              <ul className="char-wizard-notes">
                <li>{classDef.proficiencies}</li>
                <li>{classDef.dietBonus}</li>
                <li>Subclasse (Dieta Marcial) no nível 2 — na ficha depois.</li>
              </ul>
            ) : null}
          </>
        ) : null}

        {step === 3 ? (
          <>
            <h2>Atributos — compra de pontos</h2>
            <p className="char-wizard-meta">
              Pool {POINT_BUY_POOL} · gastos {pbSpent} · restam{" "}
              <strong style={{ color: pbLeft < 0 ? "#ff6b8a" : undefined }}>{pbLeft}</strong>
            </p>
            <div className="char-wizard-attrs">
              {ATTR_ORDER.map((key) => (
                <div key={key} className="char-wizard-attr">
                  <span>{ATTRIBUTE_LABELS[key]}</span>
                  <div className="char-wizard-attr-controls">
                    <button type="button" onClick={() => setAttr(key, -1)} disabled={draft.pointBuy[key] <= 8}>
                      −
                    </button>
                    <strong>{draft.pointBuy[key]}</strong>
                    <button type="button" onClick={() => setAttr(key, 1)} disabled={draft.pointBuy[key] >= 15}>
                      +
                    </button>
                  </div>
                  <small>
                    custo {pointBuyCost(draft.pointBuy[key])} → {finalAttrs[key]} c/ raça
                  </small>
                </div>
              ))}
            </div>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <h2>Antecedente</h2>
            <label>
              Antecedente
              <select
                value={draft.antecedente}
                onChange={(e) => patch({ antecedente: e.target.value })}
              >
                {ANTECEDENTE_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : null}

        {step === 5 ? (
          <>
            <h2>Retrato e token</h2>
            <WizardPortraitStep
              portraitUrl={draft.portraitUrl ?? null}
              tokenImageUrl={draft.tokenImageUrl ?? null}
              portraitFocus={draft.portraitFocus ?? null}
              onChange={(p) => patch(p)}
            />
          </>
        ) : null}

        {step === 6 ? (
          <>
            <h2>Revisão</h2>
            <dl className="char-wizard-review">
              <dt>Nome</dt>
              <dd>{draft.name}</dd>
              <dt>Raça / classe</dt>
              <dd>
                {draft.raca}
                {draft.linhagem ? ` (${draft.linhagem})` : ""} · {draft.classe} nv 1
              </dd>
              <dt>Antecedente</dt>
              <dd>{draft.antecedente}</dd>
              <dt>Vida</dt>
              <dd>{previewHp}</dd>
              <dt>Atributos</dt>
              <dd>
                {ATTR_ORDER.map((k) => `${ATTRIBUTE_LABELS[k]} ${finalAttrs[k]}`).join(" · ")}
              </dd>
              <dt>Retrato</dt>
              <dd>{draft.portraitUrl ? "Sim" : "Depois"}</dd>
            </dl>
            {classDef ? (
              <ul className="char-wizard-notes">
                <li>{classDef.proficiencies}</li>
                <li>{classDef.dietBonus}</li>
                {raceDef?.traits.slice(0, 2).map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            ) : null}
            <p className="char-wizard-meta">
              Fichas restantes nesta conta: {slotsLeft}
            </p>
          </>
        ) : null}

        {err ? <p className="char-wizard-err">{err}</p> : null}

        <div className="char-wizard-actions">
          {step > 0 ? (
            <button type="button" className="btn btn-secondary" onClick={back} disabled={busy}>
              Voltar
            </button>
          ) : null}
          {step < STEPS.length - 1 ? (
            <button type="button" className="btn" onClick={next} disabled={busy}>
              Próximo
            </button>
          ) : (
            <button type="button" className="btn" onClick={finish} disabled={busy || slotsLeft <= 0}>
              {busy ? "Criando…" : "Criar personagem"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
