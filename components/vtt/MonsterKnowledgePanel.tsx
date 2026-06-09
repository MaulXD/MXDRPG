"use client";

import { useCallback, useEffect, useState } from "react";
import type { PlayerMonsterKnowledgeView } from "@/lib/bestiary/types";
import type { BattleToken } from "@/lib/vtt/types";

type Props = {
  token: BattleToken;
  adventureId: string;
  roomId: string;
  /** Mestre em visão jogador — API aceita bestiário do usuário logado. */
  simulatePlayerView?: boolean;
  onClose: () => void;
};

function formatWhen(at: number): string {
  try {
    return new Date(at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function MonsterKnowledgePanel({
  token,
  adventureId,
  roomId,
  simulatePlayerView = false,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [knowledge, setKnowledge] = useState<PlayerMonsterKnowledgeView | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ tokenId: token.id, roomId });
      if (simulatePlayerView) q.set("simulatePlayerView", "1");
      const res = await fetch(`/api/adventure/${encodeURIComponent(adventureId)}/monster-knowledge?${q}`);
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        knowledge?: PlayerMonsterKnowledgeView;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Falha ao carregar informações");
      }
      setKnowledge(data.knowledge ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
      setKnowledge(null);
    } finally {
      setLoading(false);
    }
  }, [adventureId, roomId, token.id, simulatePlayerView]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="vtt-monster-knowledge glass-panel" role="dialog" aria-labelledby="vtt-monster-knowledge-title">
      <header className="vtt-monster-knowledge__head">
        <div>
          <h3 id="vtt-monster-knowledge-title">{token.name}</h3>
          <p className="vtt-monster-knowledge__subtitle">Seu registro na mesa</p>
        </div>
        <button type="button" className="vtt-monster-knowledge__close" onClick={onClose} aria-label="Fechar">
          ×
        </button>
      </header>

      {loading ? (
        <p className="vtt-monster-knowledge__muted">Carregando…</p>
      ) : error ? (
        <p className="vtt-monster-knowledge__error">{error}</p>
      ) : knowledge ? (
        <div className="vtt-monster-knowledge__body">
          {!knowledge.hasAnyKnowledge ? (
            <p className="vtt-monster-knowledge__muted">
              Você ainda não registrou combate com esta criatura nesta aventura.
            </p>
          ) : null}

          {knowledge.damageDealtByPlayer > 0 ? (
            <section className="vtt-monster-knowledge__section">
              <h4>Dano que você causou</h4>
              <p>
                Você já tirou <strong>{knowledge.damageDealtByPlayer} HP</strong> de criaturas como esta.
              </p>
              <p className="vtt-monster-knowledge__hint">
                Você não sabe quanto de vida a criatura ainda tem — só o dano que você mesmo infligiu.
              </p>
            </section>
          ) : null}

          {knowledge.hpMaxKnown != null ? (
            <section className="vtt-monster-knowledge__section">
              <h4>Experiência anterior</h4>
              <p>
                Você já abateu {knowledge.killCount === 1 ? "um exemplar" : `${knowledge.killCount} exemplares`}{" "}
                deste tipo. Estima-se cerca de <strong>{knowledge.hpMaxKnown} HP</strong> de vida máxima.
              </p>
            </section>
          ) : knowledge.killCount === 0 ? (
            <section className="vtt-monster-knowledge__section">
              <h4>Vida</h4>
              <p className="vtt-monster-knowledge__muted">
                Você ainda não sabe a vida máxima desta criatura. Abata um exemplar igual para ter uma noção.
              </p>
            </section>
          ) : null}

          <section className="vtt-monster-knowledge__section">
            <h4>Ataques recebidos</h4>
            {knowledge.attacksAgainstPlayer.length === 0 ? (
              <p className="vtt-monster-knowledge__muted">
                Nenhum ataque desta criatura contra seu personagem foi registrado na mesa.
              </p>
            ) : (
              <ul className="vtt-monster-knowledge__attacks">
                {knowledge.attacksAgainstPlayer.map((atk) => (
                  <li key={atk.messageId}>
                    <span className="vtt-monster-knowledge__attack-time">{formatWhen(atk.at)}</span>
                    <strong>{atk.weaponName}</strong>
                    {atk.hit ? (
                      atk.damageToPlayer > 0 ? (
                        <span> — {atk.damageToPlayer} de dano em você</span>
                      ) : (
                        <span> — acertou</span>
                      )
                    ) : (
                      <span className="vtt-monster-knowledge__miss"> — errou</span>
                    )}
                    {atk.detail ? (
                      <small className="vtt-monster-knowledge__detail">{atk.detail}</small>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
