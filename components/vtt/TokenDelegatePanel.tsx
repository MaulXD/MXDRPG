"use client";

import { useCallback, useState } from "react";
import type { BattleToken } from "@/lib/vtt/types";

type Candidate = {
  userId: string;
  label: string;
};

type Props = {
  roomId: string;
  token: BattleToken;
  candidates: Candidate[];
  onUpdate: () => void;
};

export function TokenDelegatePanel({ roomId, token, candidates, onUpdate }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const currentId = token.delegatedToUserId ?? "";
  const currentLabel =
    candidates.find((c) => c.userId === currentId)?.label ??
    (currentId ? "Jogador" : null);

  const apply = useCallback(
    async (userId: string | null) => {
      setBusy(true);
      setErr(null);
      try {
        const res = await fetch(
          `/api/room/${encodeURIComponent(roomId)}/tokens/${encodeURIComponent(token.id)}/delegate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
          }
        );
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Falha ao delegar");
        onUpdate();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Falha ao delegar");
      } finally {
        setBusy(false);
      }
    },
    [roomId, token.id, onUpdate]
  );

  if (candidates.length === 0) {
    return (
      <p className="vtt-combat-hint vtt-token-delegate-hint">
        Convide mais jogadores para delegar o controle deste token.
      </p>
    );
  }

  return (
    <div className="vtt-token-delegate">
      <p className="vtt-eyebrow">Delegar token</p>
      <p className="vtt-combat-hint vtt-token-delegate-hint">
        Outro jogador pode mover e agir com este personagem enquanto você estiver ausente.
      </p>
      {currentLabel ? (
        <p className="vtt-token-delegate-active">
          Piloto atual: <strong>{currentLabel}</strong>
        </p>
      ) : null}
      <label className="vtt-token-delegate-field">
        <span className="vtt-token-delegate-label">Piloto</span>
        <select
          className="vtt-token-delegate-select"
          value={currentId}
          disabled={busy}
          onChange={(e) => {
            const v = e.target.value;
            void apply(v === "" ? null : v);
          }}
        >
          <option value="">Dono da ficha</option>
          {candidates.map((c) => (
            <option key={c.userId} value={c.userId}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      {err ? (
        <p className="vtt-token-delegate-err" role="alert">
          {err}
        </p>
      ) : null}
    </div>
  );
}
