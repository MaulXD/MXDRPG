"use client";

import { useState } from "react";
import { postRoomTorHelm } from "@/hooks/useRoomSync";
import {
  TOR_HELM_RECOVER_ACTION,
  TOR_HELM_REMOVE_ACTION,
} from "@/lib/combat/um-anel/gear-in-combat";
import type { BattleToken } from "@/lib/vtt/types";

type Props = {
  roomId: string;
  token: BattleToken;
  onUpdate: () => void;
};

/**
 * Tirar e recuperar o Elmo no meio do combate.
 *
 * A jogada é do livro: "às vezes, durante o combate, um herói pode recorrer a
 * descartá-lo para reduzir a Carga carregada e evitar ficar Exausto muito cedo".
 * Aparece para quem joga o herói e para o Mestre — o servidor separa os dois.
 *
 * As duas metades custam ações diferentes, e o botão diz qual: tirar é
 * secundária, recuperar é principal. O app **não policia** a economia de ações
 * (a mesa é que conta ações principais e secundárias); ele diz o preço.
 */
export function TorHelmControl({ roomId, token, onUpdate }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const combat = token.torCombat;
  if (combat?.kind !== "hero") return null;

  const wearing = Boolean(combat.helm);

  return (
    <div className="tor-shadow-panel">
      <p className="vtt-eyebrow">Elmo</p>
      <button
        type="button"
        className="btn btn-ghost"
        disabled={busy}
        onClick={() => {
          if (busy) return;
          setBusy(true);
          setErr(null);
          postRoomTorHelm(roomId, token.id)
            .then(() => onUpdate())
            .catch((e: unknown) =>
              setErr(e instanceof Error ? e.message : "Falha ao trocar o Elmo")
            )
            .finally(() => setBusy(false));
        }}
      >
        {wearing
          ? `Tirar o Elmo (ação ${TOR_HELM_REMOVE_ACTION})`
          : `Recuperar o Elmo (ação ${TOR_HELM_RECOVER_ACTION})`}
      </button>
      <span className="vtt-field__hint">
        {wearing
          ? "Alivia a Carga — pode tirar o herói de Exausto — mas perde 1 dado de Proteção."
          : "Devolve 1 dado de Proteção e volta a somar Carga."}
      </span>
      {err ? <p className="dice-err">{err}</p> : null}
    </div>
  );
}
