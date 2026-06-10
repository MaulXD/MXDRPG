"use client";

import { useMemo, useState } from "react";
import type { CharacterSheet } from "@/lib/character/types";
import type { IdentityPatch } from "@/lib/character/identity";
import { describeIdentity } from "@/lib/character/identity";
import {
  ATTRIBUTE_LABELS,
  CLASS_LIST,
  RACE_LIST,
  attributeMod,
  proficiencyBonus,
  type AttributeKey,
} from "@/lib/character/rules";
import { formatXpProgress } from "@/lib/character/xp";
import { getSubclassTrack } from "@/lib/character/subclass-tracks";
import { ReligionPickGrid } from "@/components/character/ReligionPickGrid";
import { patchRoomActor } from "@/hooks/useRoomSync";

type Props = {
  actor: CharacterSheet;
  roomId?: string;
  canEdit: boolean;
  onSaved: () => void;
  /** Persistência fora da sala (ex.: PATCH /api/characters) */
  onSaveIdentity?: (patch: IdentityPatch) => Promise<void>;
};

const ATTR_KEYS = Object.keys(ATTRIBUTE_LABELS) as AttributeKey[];

export function CharacterIdentityEditor({
  actor,
  roomId,
  canEdit,
  onSaved,
  onSaveIdentity,
}: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [raca, setRaça] = useState(actor.identity.raca);
  const [classe, setClasse] = useState(actor.identity.classe);
  const [subclasse, setSubclasse] = useState(actor.identity.subclasse ?? "");
  const [linhagem, setLinhagem] = useState(actor.identity.linhagem ?? "");
  const [antecedente, setAntecedente] = useState(actor.identity.antecedente);
  const [religiao, setReligiao] = useState(actor.identity.religiao ?? "sem-deus");
  const [attrs, setAttrs] = useState({ ...actor.attributes });

  const classDef = CLASS_LIST.find((c) => c.id === classe);
  const raceDef = RACE_LIST.find((r) => r.id === raca);
  const linhagens = raceDef?.linhagens ?? [];

  const notes = useMemo(
    () =>
      describeIdentity({
        ...actor,
        identity: { ...actor.identity, raca, classe, subclasse, linhagem, antecedente, religiao },
      }),
    [actor, raca, classe, subclasse, linhagem, antecedente, religiao]
  );

  const previewTrack = useMemo(() => getSubclassTrack(subclasse || null), [subclasse]);
  const subclassWillResetTalents =
    Boolean(subclasse && actor.identity.subclasse && subclasse !== actor.identity.subclasse && (actor.identity.talentos?.length ?? 0) > 0);

  if (!canEdit) return null;

  async function save(patch: IdentityPatch) {
    setBusy(true);
    setMsg(null);
    try {
      if (onSaveIdentity) {
        await onSaveIdentity(patch);
      } else {
        if (!roomId) throw new Error("Sala ausente para salvar identidade");
        await patchRoomActor(roomId, actor.id, { identityPatch: patch });
      }
      await onSaved();
      setMsg("Ficha atualizada.");
      setOpen(false);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setBusy(false);
    }
  }

  function handleSave() {
    save({
      raca,
      classe,
      subclasse: subclasse || null,
      linhagem: raca === "Meio-Humano" ? linhagem || null : null,
      antecedente,
      religiao,
      attributes: attrs,
    });
  }

  function applyRaceDefaults() {
    save({ raca, linhagem: raca === "Meio-Humano" ? linhagem || null : null, resetAttributes: true });
  }

  return (
    <div className="sheet-identity">
      <div className="sheet-prof">
        <span>Prof +{proficiencyBonus(actor.identity.nivel)}</span>
        <span>{formatXpProgress(actor.identity.nivel, actor.identity.xpTotal)}</span>
      </div>

      <button type="button" className="btn btn-ghost sheet-identity-toggle" onClick={() => setOpen((v) => !v)}>
        {open ? "Fechar identidade" : "Editar raça / classe / atributos"}
      </button>

      {open ? (
        <div className="sheet-identity-form">
          <label>
            Raça
            <select value={raca} onChange={(e) => setRaça(e.target.value)}>
              {RACE_LIST.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id}
                </option>
              ))}
            </select>
          </label>

          {raca === "Meio-Humano" ? (
            <label>
              Linhagem
              <select value={linhagem} onChange={(e) => setLinhagem(e.target.value)}>
                <option value="">— escolher —</option>
                {linhagens.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.id}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label>
            Classe
            <select
              value={classe}
              onChange={(e) => {
                const next = e.target.value;
                setClasse(next);
                const nextDef = CLASS_LIST.find((c) => c.id === next);
                if (subclasse && nextDef && !nextDef.subclasses.includes(subclasse)) {
                  setSubclasse("");
                }
              }}
            >
              {CLASS_LIST.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} (d{c.hpDie})
                </option>
              ))}
            </select>
          </label>

          <label>
            Caminho de Assimilação (subclasse)
            <select value={subclasse} onChange={(e) => setSubclasse(e.target.value)}>
              <option value="">— nv 2 —</option>
              {(classDef?.subclasses ?? []).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          {previewTrack ? (
            <div className="sheet-track sheet-track-preview">
              <p className="eyebrow">Preview trilha — {previewTrack.subclass}</p>
              <p className="sheet-track-meta">{previewTrack.specialty}</p>
              <ol className="sheet-track-list">
                {previewTrack.talents.map((t) => (
                  <li key={t.id} className="sheet-track-item">
                    <span className="sheet-track-lv">Nv {t.level}</span>
                    <span className="sheet-track-label">
                      {t.name}
                      {t.kind === "ascension" ? " (Ascensão)" : ""}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {subclassWillResetTalents ? (
            <p className="sheet-inline-msg sheet-inline-warn">
              Trocar subclasse remove talentos já escolhidos nesta trilha.
            </p>
          ) : null}

          <div className="sheet-identity-religion">
            <p className="eyebrow">Devotion religiosa</p>
            <ReligionPickGrid value={religiao} onChange={setReligiao} compact disabled={busy} />
          </div>

          <label>
            Antecedente
            <input value={antecedente} onChange={(e) => setAntecedente(e.target.value)} maxLength={60} />
          </label>

          <div className="sheet-attr-edit">
            {ATTR_KEYS.map((k) => (
              <label key={k}>
                {ATTRIBUTE_LABELS[k]}
                <input
                  type="number"
                  min={3}
                  max={20}
                  value={attrs[k]}
                  onChange={(e) => setAttrs({ ...attrs, [k]: Number(e.target.value) })}
                />
                <span className="sheet-attr-mod">
                  {attributeMod(attrs[k]) >= 0 ? "+" : ""}
                  {attributeMod(attrs[k])}
                </span>
              </label>
            ))}
          </div>

          <ul className="sheet-rules-notes">
            {notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>

          <div className="sheet-identity-actions">
            <button type="button" className="btn" disabled={busy} onClick={handleSave}>
              {busy ? "Salvando…" : "Aplicar e recalcular HP/CA"}
            </button>
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={applyRaceDefaults}>
              Reset atributos (padrão raça)
            </button>
          </div>
        </div>
      ) : null}

      {msg ? <p className="sheet-inline-msg">{msg}</p> : null}
    </div>
  );
}

function attrModSign(value: number): "pos" | "neg" | "zero" {
  if (value > 0) return "pos";
  if (value < 0) return "neg";
  return "zero";
}

export function CharacterStatsGrid({ actor }: { actor: CharacterSheet }) {
  const mod = attributeMod;

  return (
    <div className="sheet-stat-grid sheet-stat-grid-3">
      {(Object.keys(ATTRIBUTE_LABELS) as AttributeKey[]).map((k) => {
        const m = mod(actor.attributes[k]);
        return (
          <div className="sheet-stat sheet-attr-cell" key={k}>
            <label className="sheet-attr-cell__label">{ATTRIBUTE_LABELS[k]}</label>
            <strong className="sheet-attr-cell__base">{actor.attributes[k]}</strong>
            <span className="sheet-attr-cell__divider" aria-hidden />
            <span className={`sheet-attr-cell__mod sheet-attr-cell__mod--${attrModSign(m)}`}>
              {m >= 0 ? `+${m}` : m}
            </span>
          </div>
        );
      })}
    </div>
  );
}
