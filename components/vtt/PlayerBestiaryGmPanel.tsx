"use client";

import { useCallback, useEffect, useState } from "react";
import type { PlayerBestiaryGmView, PlayerMonsterKnowledgeView } from "@/lib/bestiary/types";
import type { BattleToken } from "@/lib/vtt/types";

type Props = {
  token: BattleToken;
  playerUserId: string;
  adventureId: string;
  roomId: string;
  onClose: () => void;
};

function formatWhen(at: number): string {
  try {
    return new Date(at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function MonsterKnowledgeBlock({ knowledge }: { knowledge: PlayerMonsterKnowledgeView }) {
  return (
    <article className="vtt-player-bestiary__entry">
      <h4 className="vtt-player-bestiary__entry-title">{knowledge.displayName}</h4>

      {knowledge.damageDealtByPlayer > 0 ? (
        <p className="vtt-player-bestiary__line">
          Dano causado: <strong>{knowledge.damageDealtByPlayer} HP</strong>
        </p>
      ) : null}

      {knowledge.hpMaxKnown != null ? (
        <p className="vtt-player-bestiary__line">
          Vida máxima estimada: <strong>{knowledge.hpMaxKnown} HP</strong>
          {knowledge.killCount > 0
            ? ` · ${knowledge.killCount} abate${knowledge.killCount === 1 ? "" : "s"}`
            : null}
        </p>
      ) : knowledge.killCount > 0 ? (
        <p className="vtt-player-bestiary__line">
          Abates registrados: <strong>{knowledge.killCount}</strong>
        </p>
      ) : null}

      {knowledge.attacksAgainstPlayer.length > 0 ? (
        <div className="vtt-player-bestiary__attacks-wrap">
          <p className="vtt-player-bestiary__attacks-label">Ataques contra o jogador</p>
          <ul className="vtt-monster-knowledge__attacks">
            {knowledge.attacksAgainstPlayer.map((atk) => (
              <li key={atk.messageId}>
                <span className="vtt-monster-knowledge__attack-time">{formatWhen(atk.at)}</span>
                <strong>{atk.weaponName}</strong>
                {atk.hit ? (
                  atk.damageToPlayer > 0 ? (
                    <span> — {atk.damageToPlayer} de dano</span>
                  ) : (
                    <span> — acertou</span>
                  )
                ) : (
                  <span className="vtt-monster-knowledge__miss"> — errou</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

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
