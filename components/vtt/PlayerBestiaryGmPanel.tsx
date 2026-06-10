"use client";

import { useCallback, useEffect, useState } from "react";
import type { PlayerBestiaryGmView } from "@/lib/bestiary/types";
import { MonsterKnowledgeBlock } from "@/components/vtt/MonsterKnowledgeBlock";
import type { BattleToken } from "@/lib/vtt/types";

type Props = {
  token: BattleToken;
  playerUserId: string;
  adventureId: string;
  roomId: string;
  onClose: () => void;
};

export function PlayerBestiaryGmPanel({
  token,
  playerUserId,
  adventureId,
  roomId,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bestiary, setBestiary] = useState<PlayerBestiaryGmView | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ userId: playerUserId, roomId, tokenId: token.id });
      const res = await fetch(
        `/api/adventure/${encodeURIComponent(adventureId)}/player-bestiary?${q}`
      );
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        bestiary?: PlayerBestiaryGmView;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Falha ao carregar bestiário");
      }
      setBestiary(data.bestiary ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
      setBestiary(null);
    } finally {
      setLoading(false);
    }
  }, [adventureId, playerUserId, roomId, token.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const title = bestiary
    ? `${bestiary.characterName} (${bestiary.playerName})`
    : token.name;

  return (
    <div
      className="vtt-player-bestiary glass-panel"
      role="dialog"
      aria-labelledby="vtt-player-bestiary-title"
    >
      <header className="vtt-monster-knowledge__head">
        <div>
          <h3 id="vtt-player-bestiary-title">{title}</h3>
          <p className="vtt-monster-knowledge__subtitle">Bestiário do jogador (visão do mestre)</p>
        </div>
        <button
          type="button"
          className="vtt-monster-knowledge__close"
          onClick={onClose}
          aria-label="Fechar"
        >
          ×
        </button>
      </header>

      {loading ? (
        <p className="vtt-monster-knowledge__muted">Carregando…</p>
      ) : error ? (
        <p className="vtt-monster-knowledge__error">{error}</p>
      ) : bestiary ? (
        <div className="vtt-player-bestiary__body">
          {bestiary.entries.length === 0 ? (
            <p className="vtt-monster-knowledge__muted">
              Este jogador ainda não registrou combate com nenhuma criatura nesta aventura.
            </p>
          ) : (
            bestiary.entries.map((entry) => (
              <MonsterKnowledgeBlock key={entry.typeKey} knowledge={entry} />
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
