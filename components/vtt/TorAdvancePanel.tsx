"use client";

import { useEffect, useState } from "react";
import { postRoomTorAdvance, postRoomTorRecovery } from "@/hooks/useRoomSync";
import { COMBAT_PROFICIENCY_LABEL, SKILLS } from "@/lib/character/um-anel/data";
import { TOR_XP_COST_BY_LEVEL } from "@/lib/combat/um-anel/progression";
import type { TorCharacterSheet, TorCombatProficiencyId } from "@/lib/character/um-anel/types";

type Props = {
  roomId: string;
  /** Fichas do Um Anel visíveis na mesa. */
  characterIds: string[];
  onUpdate: () => void;
};

const PROFICIENCIES: TorCombatProficiencyId[] = ["machados", "arcos", "lancas", "espadas"];

/**
 * Gastar Pontos de Perícia e de Aventura durante a Fase de Companhia.
 *
 * Fica no painel da Fase porque é ali que a regra acontece: o limite do livro é
 * "um grau em cada Perícia **por Fase de Companhia**", e Valor e Sabedoria
 * competem entre si na mesma Fase. Antes disto, o herói acumulava pontos e não
 * tinha como gastá-los pelo app.
 *
 * O custo aparece antes do clique — o preço sobe com o grau, e sem ver o número
 * o jogador descobre o custo só depois de gastar.
 */
export function TorAdvancePanel({ roomId, characterIds, onUpdate }: Props) {
  const [sheets, setSheets] = useState<TorCharacterSheet[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      characterIds.map((id) =>
        fetch(`/api/tor-characters/${encodeURIComponent(id)}`, { credentials: "same-origin" })
          .then((r) => r.json())
          .then((d: { character?: TorCharacterSheet }) => d.character ?? null)
          .catch(() => null)
      )
    ).then((list) => {
      if (!cancelled) setSheets(list.filter((s): s is TorCharacterSheet => Boolean(s)));
    });
    return () => {
      cancelled = true;
    };
  }, [characterIds]);

  async function buy(characterId: string, what: Parameters<typeof postRoomTorAdvance>[2]) {
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      await postRoomTorAdvance(roomId, characterId, what);
      onUpdate();
    } catch (e) {
      // "Máximo de 1 grau por Perícia em cada Fase", "Faltam N pontos" e
      // "Valor e Sabedoria não podem ambos subir" chegam por aqui.
      setErr(e instanceof Error ? e.message : "Falha ao avançar");
    } finally {
      setBusy(false);
    }
  }

  async function recover(characterId: string) {
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      await postRoomTorRecovery(roomId, characterId, "spiritual");
      onUpdate();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha na recuperação");
    } finally {
      setBusy(false);
    }
  }

  if (sheets.length === 0) return null;

  return (
    <section className="tor-journey__section">
      <p className="eyebrow">Avanço</p>
      {err ? <p className="dice-err">{err}</p> : null}

      {sheets.map((s) => (
        <div key={s.id} className="tor-advance__hero">
          <p className="tor-journey__remaining">
            {s.name} — {s.skillPoints} Pontos de Perícia · {s.adventurePoints} Pontos de Aventura
          </p>

          <label className="vtt-field">
            Perícia
            <select
              disabled={busy}
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) void buy(s.id, { kind: "skill", skillId: e.target.value });
                e.currentTarget.value = "";
              }}
            >
              <option value="">Subir uma Perícia…</option>
              {SKILLS.map((sk) => {
                const atual = s.skills[sk.id] ?? 0;
                const custo = TOR_XP_COST_BY_LEVEL[atual + 1];
                return (
                  <option key={sk.id} value={sk.id} disabled={custo == null}>
                    {sk.label} {atual} → {atual + 1} ({custo ?? "máx"} pts)
                  </option>
                );
              })}
            </select>
          </label>

          <label className="vtt-field">
            Proficiência de Combate
            <select
              disabled={busy}
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  void buy(s.id, { kind: "proficiency", proficiencyId: e.target.value });
                }
                e.currentTarget.value = "";
              }}
            >
              <option value="">Subir uma Proficiência…</option>
              {PROFICIENCIES.map((p) => {
                const atual = s.combatProficiencies[p] ?? 0;
                const custo = TOR_XP_COST_BY_LEVEL[atual + 1];
                return (
                  <option key={p} value={p} disabled={custo == null}>
                    {COMBAT_PROFICIENCY_LABEL[p]} {atual} → {atual + 1} ({custo ?? "máx"} pts)
                  </option>
                );
              })}
            </select>
          </label>

          {/* Fecho da Fase: devolve Esperança (cheia no Yule, senão até o
              CORAÇÃO) e tira Sombra até o limite do resultado da Fase. */}
          <button
            type="button"
            className="btn btn-ghost"
            disabled={busy}
            onClick={() => void recover(s.id)}
          >
            Recuperação espiritual da Fase
          </button>

          <div className="vtt-special-damage">
            <button
              type="button"
              className="btn btn-ghost"
              disabled={busy}
              onClick={() => void buy(s.id, { kind: "valour" })}
            >
              Valor {s.valour} → {s.valour + 1} ({TOR_XP_COST_BY_LEVEL[s.valour + 1] ?? "máx"} pts)
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={busy}
              onClick={() => void buy(s.id, { kind: "wisdom" })}
            >
              Sabedoria {s.wisdom} → {s.wisdom + 1} ({TOR_XP_COST_BY_LEVEL[s.wisdom + 1] ?? "máx"} pts)
            </button>
          </div>
        </div>
      ))}

      <p className="tor-journey__pending-hint">
        Um grau por Perícia e por Proficiência em cada Fase de Companhia. Valor e Sabedoria competem
        entre si — só um dos dois por Fase.
      </p>
    </section>
  );
}
