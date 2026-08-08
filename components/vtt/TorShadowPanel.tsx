"use client";

import { useState } from "react";
import { postRoomTorRecovery, postRoomTorShadow } from "@/hooks/useRoomSync";
import {
  TOR_SHADOW_SOURCES,
  TOR_SHADOW_SOURCE_META,
  type TorShadowSource,
} from "@/lib/combat/um-anel/shadow";
import type { BattleToken } from "@/lib/vtt/types";

type Props = {
  roomId: string;
  token: BattleToken;
  /** Só o Mestre atribui Sombra; Endurecer a Vontade aparece para todos. */
  canManage: boolean;
  onUpdate: () => void;
};

/**
 * Sombra de um herói, na mesa.
 *
 * Fica no painel do token porque é ali que o Mestre já clica quando algo
 * acontece com aquele herói — e porque a Sombra alimenta duas condições que o
 * combate consulta a cada rolagem (Arrasado e Desfavorecido). Antes disto, o
 * único jeito de mexer na Sombra era editar a ficha na mão.
 *
 * O painel não rola o Teste de Sombra: o teste é uma rolagem de Perícia comum,
 * feita pela ficha, e o Mestre informa aqui o que sobrou. Fingir que o painel
 * sabe o resultado do teste seria pior que pedir o número.
 */
export function TorShadowPanel({ roomId, token, canManage, onUpdate }: Props) {
  const [source, setSource] = useState<TorShadowSource>("pavor");
  const [points, setPoints] = useState(1);
  const [scars, setScars] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const combat = token.torCombat;
  const characterId = combat?.torCharacterId;

  async function recover(action: "spiritual" | "rest" | "madness" | "heal-scar") {
    if (busy || !characterId) return;
    setBusy(true);
    setErr(null);
    try {
      await postRoomTorRecovery(roomId, characterId, action);
      onUpdate();
    } catch (e) {
      // "Acesso de Loucura só ocorre quando a Sombra alcança a Esperança
      // máxima", "só no Yule" e "faltam pontos" chegam por aqui.
      setErr(e instanceof Error ? e.message : "Falha na recuperação");
    } finally {
      setBusy(false);
    }
  }

  if (combat?.kind !== "hero") return null;

  async function run(body: Parameters<typeof postRoomTorShadow>[2]) {
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      await postRoomTorShadow(roomId, token.id, body);
      onUpdate();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha ao registrar a Sombra");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="tor-shadow-panel">
      <p className="vtt-eyebrow">Sombra</p>

      {canManage ? (
        <>
          <label className="vtt-field">
            Fonte
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as TorShadowSource)}
              disabled={busy}
            >
              {TOR_SHADOW_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {TOR_SHADOW_SOURCE_META[s].label}
                </option>
              ))}
            </select>
            {/* Malfeito é a única fonte que o Teste de Sombra não reduz — quem
                atribui precisa ver isso antes de informar os pontos. */}
            <span className="vtt-field__hint">
              {TOR_SHADOW_SOURCE_META[source].resistible
                ? `Teste de Sombra pode reduzir (${
                    TOR_SHADOW_SOURCE_META[source].testAttribute === "valour" ? "Valor" : "Sabedoria"
                  }) — informe aqui o que sobrou.`
                : "Malfeito não pode ser reduzido nem cancelado por Teste de Sombra."}
            </span>
          </label>

          <div className="vtt-special-damage">
            <label>
              Pontos
              <input
                type="number"
                min={0}
                max={10}
                value={points}
                disabled={busy}
                onChange={(e) => setPoints(Math.max(0, Math.min(10, Number(e.target.value) || 0)))}
              />
            </label>
            <label>
              Cicatrizes
              <input
                type="number"
                min={0}
                max={4}
                value={scars}
                disabled={busy}
                onChange={(e) => setScars(Math.max(0, Math.min(4, Number(e.target.value) || 0)))}
              />
            </label>
          </div>

          <button
            type="button"
            className="btn btn-ghost"
            disabled={busy}
            onClick={() => void run({ action: "gain", source, points, scars })}
          >
            {busy ? "Registrando…" : "Atribuir Sombra"}
          </button>
        </>
      ) : null}

      <button
        type="button"
        className="btn btn-ghost"
        disabled={busy}
        onClick={() => void run({ action: "harden" })}
      >
        Endurecer a Vontade
      </button>
      <span className="vtt-field__hint">
        Troca toda a Sombra atual por 1 Cicatriz. Só antes de a Sombra alcançar a Esperança máxima —
        depois disso, só um Acesso de Loucura resolve.
      </span>

      {/* Sem o Acesso de Loucura, um herói com a Sombra no máximo ficava
          Desfavorecido para sempre: é a única regra que zera a Sombra ali. */}
      {characterId ? (
        <>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={busy}
            onClick={() => void recover("madness")}
          >
            Acesso de Loucura
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={busy}
            onClick={() => void recover("rest")}
          >
            Descanso Prolongado (−1 Fadiga)
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={busy}
            onClick={() => void recover("heal-scar")}
          >
            Curar Cicatriz (5 Pontos de Aventura, só no Yule)
          </button>
        </>
      ) : null}

      {err ? <p className="dice-err">{err}</p> : null}
    </div>
  );
}
