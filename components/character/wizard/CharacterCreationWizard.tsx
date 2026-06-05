"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SubclassTrackCard } from "@/components/character/wizard/SubclassTrackCard";
import { WizardHoverTip } from "@/components/character/wizard/WizardHoverTip";
import { WizardPortraitStep } from "@/components/character/wizard/WizardPortraitStep";
import {
  sanitizeWizardDraftForSave,
  validateWizardDraft,
} from "@/lib/character/build-from-wizard";
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
  isUnsetPointBuy,
  pointBuyCost,
  suggestedPointBuyForClass,
  totalPointBuyCost,
  validatePointBuy,
} from "@/lib/character/point-buy";
import { ANTECEDENTE_META } from "@/lib/character/wizard-meta";
import { subclassTrackIntroTooltip } from "@/lib/character/subclass-wizard-tooltips";
import {
  antecedenteGainDescription,
  linhagemTraitLines,
  racialTraitDescription,
} from "@/lib/character/wizard-tooltips";
import { buildWizardPreview } from "@/lib/character/wizard-preview";
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
  /** Ficha vinculada a esta aventura. */
  adventureId?: string | null;
  adventureName?: string | null;
  /** @deprecated use adventureId */
  roomId?: string | null;
  roomName?: string | null;
};

function ensurePointBuyIfUnset(
  draft: CharacterWizardDraft
): CharacterWizardDraft {
  if (!isUnsetPointBuy(draft.pointBuy)) return draft;
  return { ...draft, pointBuy: suggestedPointBuyForClass(draft.classe) };
}

export function CharacterCreationWizard({
  slotsLeft,
  adventureId: adventureIdProp = null,
  adventureName = null,
  roomId = null,
  roomName = null,
}: Props) {
  const adventureId = adventureIdProp ?? roomId;
  const label = adventureName ?? roomName;
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<CharacterWizardDraft>({
    ...EMPTY_WIZARD_DRAFT,
    pointBuy: suggestedPointBuyForClass(EMPTY_WIZARD_DRAFT.classe),
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [portraitPending, setPortraitPending] = useState(false);
  const [pbAutoApplied, setPbAutoApplied] = useState(true);

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
    if (step !== 3 || !isUnsetPointBuy(draft.pointBuy)) return;
    setDraft((d) => ensurePointBuyIfUnset(d));
    setPbAutoApplied(true);
  }, [step, draft.pointBuy, draft.classe]);

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
    setPbAutoApplied(false);
  }

  function stepError(index: number): string | null {
    if (index === 0) {
      const name = draft.name.trim();
      if (!name) return "Nome obrigatório";
      if (name.length < 2) return "Nome precisa de pelo menos 2 caracteres";
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
    if (index === 5 && portraitPending) {
      return "Aplique o retrato com «Aplicar retrato + token» ou use «Pular por agora»";
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
    if (v.includes("classe")) return 2;
    if (v.includes("Nome")) return 0;
    return 6;
  }

  function goToStep(index: number) {
    if (index > step) return;
    setErr(null);
    setStep(index);
  }

  function next() {
    const e = stepError(step);
    if (e) {
      setErr(e);
      return;
    }
    setErr(null);
    const nextStep = Math.min(step + 1, STEPS.length - 1);
    if (nextStep === 3) {
      setDraft((d) => ensurePointBuyIfUnset(d));
      setPbAutoApplied(isUnsetPointBuy(draft.pointBuy));
    }
    setStep(nextStep);
  }

  function back() {
    setErr(null);
    setStep((s) => Math.max(0, s - 1));
  }

  async function finish() {
    const invalidAt = firstInvalidStep();
    if (invalidAt !== null) {
      const message = stepError(invalidAt) ?? validateWizardDraft(draft);
      setStep(invalidAt);
      setErr(message ?? "Revise os passos antes de criar");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const payload = sanitizeWizardDraftForSave(draft);
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
      let data: { error?: string; character?: { id: string } } = {};
      try {
        data = (await res.json()) as typeof data;
      } catch {
        if (!res.ok) throw new Error(res.status === 413 ? "Dados muito grandes — pule o retrato ou use imagem menor" : `Erro ${res.status}`);
      }
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar");
      if (!data.character?.id) throw new Error("Resposta inválida do servidor");
      const dest = adventureId
        ? `/personagem/${data.character.id}?campanha=${encodeURIComponent(adventureId)}`
        : `/personagem/${data.character.id}`;
      router.push(dest);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="char-wizard">
      {adventureId ? (
        <p className="char-wizard-meta" style={{ marginBottom: "0.75rem" }}>
          Ficha exclusiva da aventura <strong>{label ?? adventureId}</strong> — mesa, registros e
          progresso ficam nesta campanha.
        </p>
      ) : null}
      <nav className="char-wizard-steps" aria-label="Passos">
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            className={`char-wizard-step ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}
            disabled={i > step || busy}
            onClick={() => goToStep(i)}
            aria-current={i === step ? "step" : undefined}
          >
            {i + 1}. {label}
          </button>
        ))}
      </nav>

      <div className="char-wizard-body">
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
              <>
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
              </>
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
                {Object.keys(raceDef.milestones).length > 0 ? (
                  <div className="char-wizard-milestones">
                    <p className="char-wizard-milestones__title">Progressão racial (níveis futuros)</p>
                    <ul>
                      {Object.entries(raceDef.milestones)
                        .sort(([a], [b]) => Number(a) - Number(b))
                        .map(([lvl, text]) => (
                          <li key={lvl}>
                            <WizardHoverTip text={text}>
                              Nv {lvl}: {text}
                            </WizardHoverTip>
                          </li>
                        ))}
                    </ul>
                  </div>
                ) : null}
              </>
            ) : null}
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h2>Classe</h2>
            <div className="char-wizard-pick-grid" role="listbox" aria-label="Classe">
              {CLASS_LIST.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="option"
                  aria-selected={draft.classe === c.id}
                  className={`char-wizard-pick ${draft.classe === c.id ? "char-wizard-pick--on" : ""}`}
                  onClick={() => {
                    const pointBuy = isUnsetPointBuy(draft.pointBuy)
                      ? suggestedPointBuyForClass(c.id)
                      : draft.pointBuy;
                    patch({ classe: c.id, pointBuy });
                    setPbAutoApplied(isUnsetPointBuy(draft.pointBuy));
                  }}
                >
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
                    <strong>Dieta base:</strong>{" "}
                    <WizardHoverTip text="Bônus culinário permanente da classe — afeta preparo de refeições com ingredientes de monstro.">
                      {classDef.dietBonus}
                    </WizardHoverTip>
                  </li>
                  <li>
                    <WizardHoverTip text={subclassTrackIntroTooltip()}>
                      <strong>Nível 2:</strong> escolha uma Dieta Marcial (subclasse) — trilhas abaixo.
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
            <h2>Atributos — compra de pontos</h2>
            <p className="char-wizard-meta">
              Pool {POINT_BUY_POOL} · gastos {pbSpent} · restam{" "}
              <strong style={{ color: pbLeft !== 0 ? "#ff6b8a" : "var(--neon-lime)" }}>
                {pbLeft}
              </strong>
              {pbAutoApplied && pbLeft === 0 ? (
                <> · sugestão para {draft.classe} aplicada (ajuste com +/−)</>
              ) : null}
            </p>
            <div className="char-wizard-attr-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  patch({ pointBuy: suggestedPointBuyForClass(draft.classe) });
                  setPbAutoApplied(true);
                }}
              >
                Sugestão para {draft.classe}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  patch({ pointBuy: { ...EMPTY_WIZARD_DRAFT.pointBuy } });
                  setPbAutoApplied(false);
                }}
              >
                Resetar (8 em tudo)
              </button>
            </div>
            <div className="char-wizard-attrs">
              {ATTR_ORDER.map((key) => (
                <div key={key} className="char-wizard-attr">
                  <span>{ATTRIBUTE_LABELS[key]}</span>
                  <div className="char-wizard-attr-controls">
                    <button
                      type="button"
                      onClick={() => setAttr(key, -1)}
                      disabled={!canDecreasePointBuy(draft.pointBuy, key)}
                      aria-label={`Diminuir ${ATTRIBUTE_LABELS[key]}`}
                    >
                      −
                    </button>
                    <strong>{draft.pointBuy[key]}</strong>
                    <button
                      type="button"
                      onClick={() => setAttr(key, 1)}
                      disabled={!canIncreasePointBuy(draft.pointBuy, key)}
                      aria-label={`Aumentar ${ATTRIBUTE_LABELS[key]}`}
                    >
                      +
                    </button>
                  </div>
                  <small>
                    custo {pointBuyCost(draft.pointBuy[key])} → {finalAttrs[key]} (mod{" "}
                    {attributeMod(finalAttrs[key]) >= 0 ? "+" : ""}
                    {attributeMod(finalAttrs[key])})
                  </small>
                </div>
              ))}
            </div>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <h2>Antecedente</h2>
            <p className="char-wizard-meta">
              O antecedente define perícias, equipamento e contatos iniciais na ficha.
            </p>
            <div className="char-wizard-pick-grid char-wizard-pick-grid--wide" role="listbox" aria-label="Antecedente">
              {ANTECEDENTE_META.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  role="option"
                  aria-selected={draft.antecedente === a.id}
                  className={`char-wizard-pick ${draft.antecedente === a.id ? "char-wizard-pick--on" : ""}`}
                  onClick={() => patch({ antecedente: a.id })}
                >
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
          </>
        ) : null}

        {step === 5 ? (
          <>
            <h2>Retrato e token</h2>
            <WizardPortraitStep
              portraitUrl={draft.portraitUrl ?? null}
              tokenImageUrl={draft.tokenImageUrl ?? null}
              portraitFocus={draft.portraitFocus ?? null}
              coverFocus={draft.coverFocus ?? null}
              tokenFocus={draft.tokenFocus ?? null}
              onChange={(p) => patch(p)}
              onPendingChange={setPortraitPending}
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
            <dl className="char-wizard-preview-list">
              {previewLines.map((line) => (
                <div key={line.label} className="char-wizard-preview-row">
                  <dt>{line.label}</dt>
                  <dd>{line.value}</dd>
                </div>
              ))}
            </dl>
            <p className="char-wizard-meta">
              Ao criar, a ficha fica na sua conta e na mesa demo para testar. Fichas restantes:{" "}
              {slotsLeft}
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

      <aside className="glass char-wizard-preview" aria-label="Prévia da ficha">
        <p className="char-wizard-meta" style={{ marginTop: 0 }}>
          O que você terá
        </p>
        <h3 className="char-wizard-preview-title">
          {draft.name.trim() || "Sem nome"}
        </h3>
        <p className="char-wizard-preview-sub">
          {draft.raca}
          {draft.linhagem ? ` · ${draft.linhagem}` : ""} · {draft.classe} · {draft.antecedente}
        </p>
        <dl className="char-wizard-preview-list">
          <div className="char-wizard-preview-row">
            <dt>Vida</dt>
            <dd>{previewHp}</dd>
          </div>
          {previewLines.map((line) => (
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
