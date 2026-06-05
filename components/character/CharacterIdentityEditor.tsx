"use client";

import { useMemo, useState } from "react";
import type { CharacterSheet } from "@/lib/character/types";
import type { IdentityPatch } from "@/lib/character/identity";
import { describeIdentity } from "@/lib/character/identity";
import {
  ATTRIBUTE_LABELS,
  CLASS_LIST,
  CULINARY_LABELS,
  RACE_LIST,
  attributeMod,
  proficiencyBonus,
  type AttributeKey,
} from "@/lib/character/rules";
import { formatXpProgress } from "@/lib/character/xp";
import { getSubclassTrack } from "@/lib/character/subclass-tracks";
import { patchRoomActor } from "@/hooks/useRoomSync";

type Props = {
  actor: CharacterSheet;
  roomId: string;
  canEdit: boolean;
  onSaved: () => void;
};

const ATTR_KEYS = Object.keys(ATTRIBUTE_LABELS) as AttributeKey[];

export function CharacterIdentityEditor({ actor, roomId, canEdit, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [raca, setRaça] = useState(actor.identity.raca);
  const [classe, setClasse] = useState(actor.identity.classe);
  const [subclasse, setSubclasse] = useState(actor.identity.subclasse ?? "");
  const [linhagem, setLinhagem] = useState(actor.identity.linhagem ?? "");
  const [antecedente, setAntecedente] = useState(actor.identity.antecedente);
  const [attrs, setAttrs] = useState({ ...actor.attributes });

  const classDef = CLASS_LIST.find((c) => c.id === classe);
  const raceDef = RACE_LIST.find((r) => r.id === raca);
  const linhagens = raceDef?.linhagens ?? [];

  const notes = useMemo(() => describeIdentity({ ...actor, identity: { ...actor.identity, raca, classe, subclasse, linhagem } }), [actor, raca, classe, subclasse, linhagem]);

  const previewTrack = useMemo(() => getSubclassTrack(subclasse || null), [subclasse]);
  const subclassWillResetTalents =
    Boolean(subclasse && actor.identity.subclasse && subclasse !== actor.identity.subclasse && (actor.identity.talentos?.length ?? 0) > 0);

  if (!canEdit) return null;

  async function save(patch: IdentityPatch) {
    setBusy(true);
    setMsg(null);
    try {
      await patchRoomActor(roomId, actor.id, { identityPatch: patch });
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
            <select value={classe} onChange={(e) => setClasse(e.target.value)}>
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
              <p className="sheet-track-meta">Dieta nv2: {previewTrack.diet}</p>
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

export function CharacterStatsGrid({ actor }: { actor: CharacterSheet }) {
  const mod = attributeMod;
  const cul = actor.culinary;

  return (
    <>
      <div className="sheet-stat-grid sheet-stat-grid-3">
        {(Object.keys(ATTRIBUTE_LABELS) as AttributeKey[]).map((k) => (
          <div className="sheet-stat" key={k}>
            <label>{ATTRIBUTE_LABELS[k]}</label>
            <strong>
              {actor.attributes[k]}{" "}
              <span className="sheet-mod">
                ({mod(actor.attributes[k]) >= 0 ? "+" : ""}
                {mod(actor.attributes[k])})
              </span>
            </strong>
          </div>
        ))}
      </div>

      <div className="sheet-culinary">
        <p className="eyebrow">Culinária</p>
        <div className="sheet-stat-grid">
          {(Object.keys(CULINARY_LABELS) as (keyof typeof CULINARY_LABELS)[]).map((k) => (
            <div className="sheet-stat" key={k}>
              <label>{CULINARY_LABELS[k]}</label>
              <strong>+{cul[k]}</strong>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
