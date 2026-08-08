"use client";

import { useCallback, useState } from "react";
import { patchTorSession, postRoomTorEye } from "@/hooks/useRoomSync";
import {
  computeTorInitialEyeAwareness,
  torHuntThreshold,
  torIsRevealed,
  TOR_EYE_SOURCES,
  TOR_EYE_SOURCE_META,
  TOR_HUNT_MODIFIERS,
  TOR_HUNT_MODIFIER_META,
  TOR_HUNT_REGION_THRESHOLD,
  type TorEyeSource,
  type TorHuntModifier,
} from "@/lib/combat/um-anel/eye";
import { TOR_REGION_META, TOR_REGION_TYPES, type TorRegionType } from "@/lib/combat/um-anel/journey";
import type { TorEyeState } from "@/lib/combat/um-anel/session-state";
import { CULTURES } from "@/lib/character/um-anel/data";
import type { TorCultureId } from "@/lib/character/um-anel/types";

type Props = {
  roomId: string;
  /** Só o Mestre registra a Atenção do Olho. */
  canManage: boolean;
  /** Ausente = a mesa nunca ligou esta regra, que é opcional no livro. */
  eye: TorEyeState | null;
  onUpdate: () => void;
};

/** Uma linha do formulário de composição da Companhia. */
type HeroRow = { culture: TorCultureId; valour: number; famousItems: number };

const NEW_ROW: HeroRow = { culture: "hobbits", valour: 1, famousItems: 0 };

/**
 * Olho de Mordor — Atenção do Olho e o limiar da Caçada.
 *
 * **Regra opcional, e o livro diz isso em voz alta:** "particularmente adequadas
 * para serem introduzidas mais tarde no jogo (…) acrescentam uma camada de
 * complexidade que não todo grupo achará do seu gosto". Por isso nasce desligada
 * e o painel mostra só o botão de ligar até o Mestre decidir.
 *
 * O app **não escolhe** o episódio de Revelação: o livro deixa isso ao Mestre por
 * escrito. O que o app faz é avisar, em voz alta, no instante em que a Atenção
 * alcança o limiar — e devolver a contagem ao valor inicial depois que o Mestre
 * disser que já interpretou o episódio.
 */
export function TorEyePanel({ roomId, canManage, eye, onUpdate }: Props) {
  const [rows, setRows] = useState<HeroRow[]>([NEW_ROW]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const guard = useCallback(
    async (fn: () => Promise<void>) => {
      if (busy) return;
      setBusy(true);
      setErr(null);
      try {
        await fn();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Falha ao salvar");
      } finally {
        setBusy(false);
      }
    },
    [busy]
  );

  const breakdown = computeTorInitialEyeAwareness(rows);

  /* ── Desligado ─────────────────────────────────────────────────────── */
  if (!eye) {
    if (!canManage) return null;
    return (
      <section className="tor-journey__section">
        <p className="eyebrow">Olho de Mordor</p>
        <p className="tor-journey__pending-hint">
          Regra opcional. O livro recomenda introduzi-la mais tarde na campanha, quando a Companhia
          já tem alguns anos de jogo.
        </p>

        <div className="tor-journey__roles">
          {rows.map((row, i) => (
            <div key={i} className="tor-journey__grid">
              <label>
                Cultura
                <select
                  value={row.culture}
                  disabled={busy}
                  onChange={(e) =>
                    setRows((s) =>
                      s.map((r, j) =>
                        j === i ? { ...r, culture: e.target.value as TorCultureId } : r
                      )
                    )
                  }
                >
                  {CULTURES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                VALOR
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={row.valour}
                  disabled={busy}
                  onChange={(e) =>
                    setRows((s) =>
                      s.map((r, j) =>
                        j === i
                          ? { ...r, valour: Math.max(1, Math.min(6, Number(e.target.value) || 1)) }
                          : r
                      )
                    )
                  }
                />
              </label>
              <label>
                Armas/Armaduras Famosas
                <input
                  type="number"
                  min={0}
                  max={4}
                  value={row.famousItems}
                  disabled={busy}
                  onChange={(e) =>
                    setRows((s) =>
                      s.map((r, j) =>
                        j === i
                          ? {
                              ...r,
                              famousItems: Math.max(0, Math.min(4, Number(e.target.value) || 0)),
                            }
                          : r
                      )
                    )
                  }
                />
              </label>
            </div>
          ))}
        </div>

        <div className="tor-journey__ranks">
          <button
            type="button"
            className="btn-ghost"
            disabled={busy || rows.length >= 8}
            onClick={() => setRows((s) => [...s, NEW_ROW])}
          >
            + herói
          </button>
          {rows.length > 1 ? (
            <button
              type="button"
              className="btn-ghost"
              disabled={busy}
              onClick={() => setRows((s) => s.slice(0, -1))}
            >
              − herói
            </button>
          ) : null}
        </div>

        {/* A conta aberta: sem ela o Mestre teria de confiar no número. E a
            entrada de Cultura é a MAIS ALTA, não a soma — mostrar as três
            parcelas é o que deixa isso visível. */}
        <p className="tor-journey__estimate">
          Atenção do Olho inicial: {breakdown.total} (Cultura mais alta {breakdown.cultureBase} ·
          VALOR 4+ {breakdown.valourBonus} · Famosas {breakdown.famousBonus})
        </p>

        <button
          type="button"
          className="btn"
          disabled={busy}
          onClick={() =>
            void guard(async () => {
              await patchTorSession(roomId, {
                eye: {
                  value: breakdown.total,
                  initial: breakdown.total,
                  region: "selvagem",
                  modifiers: [],
                },
              });
              onUpdate();
            })
          }
        >
          Ligar o Olho de Mordor
        </button>
        {err ? <p className="dice-err">{err}</p> : null}
      </section>
    );
  }

  /* ── Ligado ────────────────────────────────────────────────────────── */
  const threshold = torHuntThreshold(eye.region, eye.modifiers);
  const revealed = torIsRevealed(eye.value, threshold);

  const patchEye = (patch: Partial<TorEyeState>) =>
    guard(async () => {
      await patchTorSession(roomId, { eye: { ...eye, ...patch } });
      onUpdate();
    });

  return (
    <section className="tor-journey__section">
      <p className="eyebrow">Olho de Mordor</p>

      <p className="tor-journey__remaining">
        Atenção do Olho {eye.value} / limiar da Caçada {threshold}
      </p>
      <p className="tor-journey__pending-hint">
        {revealed
          ? "A COMPANHIA FOI REVELADA — o Mestre introduz um episódio de Revelação"
          : "A Companhia está escondida."}
      </p>

      {!canManage ? null : (
        <>
          <div className="tor-journey__grid">
            <label>
              Região atravessada
              <select
                value={eye.region}
                disabled={busy}
                onChange={(e) => void patchEye({ region: e.target.value as TorRegionType })}
              >
                {TOR_REGION_TYPES.map((r) => (
                  <option key={r} value={r}>
                    {TOR_REGION_META[r].label} ({TOR_HUNT_REGION_THRESHOLD[r]})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="tor-journey__checks">
            {TOR_HUNT_MODIFIERS.map((m) => (
              <label key={m}>
                <input
                  type="checkbox"
                  checked={eye.modifiers.includes(m)}
                  disabled={busy}
                  onChange={(e) =>
                    void patchEye({
                      modifiers: e.target.checked
                        ? [...eye.modifiers, m]
                        : eye.modifiers.filter((x: TorHuntModifier) => x !== m),
                    })
                  }
                />
                {TOR_HUNT_MODIFIER_META[m].delta > 0 ? "+" : ""}
                {TOR_HUNT_MODIFIER_META[m].delta} — {TOR_HUNT_MODIFIER_META[m].label}
              </label>
            ))}
          </div>

          {/* As três fontes do livro. O Olho rolado tem um padrão de 1 ponto que
              o Mestre pode subir; a magia varia por porte do feitiço. A Sombra
              ganha fora do combate NÃO tem botão aqui de propósito: ela sobe
              sozinha quando o Mestre atribui Sombra pelo painel do token. */}
          <div className="tor-journey__ranks">
            <p className="tor-journey__pending-hint">Aumentar a Atenção do Olho</p>
            {TOR_EYE_SOURCES.filter((s) => s !== "sombra").map((s: TorEyeSource) =>
              (s === "magia" ? [1, 2, 3] : [1, 2]).map((p) => (
                <button
                  key={`${s}-${p}`}
                  type="button"
                  className="btn-ghost"
                  disabled={busy}
                  title={TOR_EYE_SOURCE_META[s].description}
                  onClick={() =>
                    void guard(async () => {
                      await postRoomTorEye(roomId, { action: "gain", source: s, points: p });
                      onUpdate();
                    })
                  }
                >
                  {TOR_EYE_SOURCE_META[s].label} +{p}
                </button>
              ))
            )}
          </div>
          <p className="tor-journey__pending-hint">
            A Sombra ganha fora do combate sobe a Atenção do Olho sozinha, pelo painel do token.
          </p>

          {revealed ? (
            <button
              type="button"
              className="btn"
              disabled={busy}
              onClick={() =>
                void guard(async () => {
                  await postRoomTorEye(roomId, { action: "reveal" });
                  onUpdate();
                })
              }
            >
              Episódio de Revelação interpretado — voltar ao inicial ({eye.initial})
            </button>
          ) : null}

          <button
            type="button"
            className="btn-ghost tor-journey__reset"
            disabled={busy}
            onClick={() =>
              void guard(async () => {
                await patchTorSession(roomId, { eye: null });
                onUpdate();
              })
            }
          >
            Desligar o Olho de Mordor
          </button>
        </>
      )}

      {err ? <p className="dice-err">{err}</p> : null}
    </section>
  );
}
