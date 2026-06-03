"use client";

import { useMemo, useState } from "react";
import type { CharacterSheet } from "@/lib/character/types";
import type { LevelUpChoices } from "@/lib/character/level-up";
import {
  canLevelUp,
  getLevelUpRequirements,
  previewLevelUp,
  validateLevelUpChoices,
} from "@/lib/character/level-up";
import { ATTRIBUTE_LABELS, CLASS_LIST, type AttributeKey } from "@/lib/character/rules";
import { getSubclassTrack } from "@/lib/character/subclass-tracks";
import { formatXpProgress } from "@/lib/character/xp";
import { levelUpRoomActor } from "@/hooks/useRoomSync";

type Props = {
  actor: CharacterSheet;
  roomId: string;
  canEdit: boolean;
  onDone: () => void;
};

export function LevelUpWizard({ actor, roomId, canEdit, onDone }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [subclasse, setSubclasse] = useState(actor.identity.subclasse ?? "");
  const [talentoId, setTalentoId] = useState("");
  const [asi, setAsi] = useState<Partial<Record<AttributeKey, number>>>({});

  const reqs = useMemo(() => getLevelUpRequirements(actor), [actor]);
  const classDef = CLASS_LIST.find((c) => c.id === actor.identity.classe);
  const talentReq = reqs.find((r) => r.kind === "talento");
  const ascensionReq = reqs.find((r) => r.kind === "ascension");

  const choices: LevelUpChoices = useMemo(
    () => ({
      subclasse: subclasse || undefined,
      talentoId: talentoId || undefined,
      asi: Object.keys(asi).length ? asi : undefined,
    }),
    [subclasse, talentoId, asi]
  );

  const preview = useMemo(() => previewLevelUp(actor, choices), [actor, choices]);

  const track = getSubclassTrack(subclasse || actor.identity.subclasse);

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

  async function confirm() {
    const err = validateLevelUpChoices(actor, choices);
    if (err) {
      setMsg(err);
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      await levelUpRoomActor(roomId, actor.id, choices);
      await onDone();
      setOpen(false);
      setTalentoId("");
      setMsg("Nível subiu — mesa sincronizada.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao subir nível");
    } finally {
      setBusy(false);
    }
  }

  const ready = canLevelUp(actor);

  return (
    <div className="sheet-level-box">
      <p className="sheet-xp-line">{formatXpProgress(actor.identity.nivel, actor.identity.xpTotal)}</p>
      <ul className="sheet-level-preview">
        {preview.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <button type="button" className="btn" disabled={!ready} onClick={() => setOpen(true)}>
        Subir nível…
      </button>

      {open ? (
        <div className="sheet-level-modal" role="dialog" aria-modal="true">
          <div className="sheet-level-panel glass">
            <h3>Nível {actor.identity.nivel + 1}</h3>

            {track ? (
              <p className="sheet-track-meta" style={{ marginBottom: "0.75rem" }}>
                Trilha: {track.subclass} · {track.diet}
              </p>
            ) : null}

            <ul className="sheet-rules-notes">
              {preview.map((line) => (
                <li key={`m-${line}`}>{line}</li>
              ))}
            </ul>

            {reqs.some((r) => r.kind === "subclasse") ? (
              <label>
                Subclasse — Dieta Marcial (nv 2)
                <select value={subclasse} onChange={(e) => setSubclasse(e.target.value)}>
                  <option value="">— escolher —</option>
                  {(classDef?.subclasses ?? []).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {reqs.some((r) => r.kind === "asi") ? (
              <fieldset className="sheet-asi">
                <legend>Humano nv4: +1 em dois atributos</legend>
                <div className="sheet-asi-grid">
                  {(Object.keys(ATTRIBUTE_LABELS) as AttributeKey[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      className={`sheet-asi-btn ${asi[k] ? "active" : ""}`}
                      onClick={() => toggleAsi(k)}
                    >
                      {ATTRIBUTE_LABELS[k]}
                    </button>
                  ))}
                </div>
              </fieldset>
            ) : null}

            {talentReq ? (
              talentReq.options.length ? (
                <label>
                  Talento nv {talentReq.level} (caminho obrigatório)
                  <select value={talentoId} onChange={(e) => setTalentoId(e.target.value)}>
                    <option value="">— escolher —</option>
                    {talentReq.options.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <p className="sheet-inline-msg" style={{ color: "var(--accent-secondary)" }}>
                  Falta talento nv {talentReq.level - 4} na trilha. Suba níveis anteriores com a cadeia
                  completa (4→8→12→16).
                </p>
              )
            ) : null}

            {ascensionReq ? (
              <p className="sheet-track-meta">
                Ascensão automática no nv 20: <strong>{ascensionReq.name}</strong>
              </p>
            ) : null}

            <div className="sheet-identity-actions">
              <button type="button" className="btn" disabled={busy} onClick={confirm}>
                {busy ? "Aplicando…" : "Confirmar"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {msg ? <p className="sheet-inline-msg">{msg}</p> : null}
    </div>
  );
}
