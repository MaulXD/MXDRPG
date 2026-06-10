import type { PlayerMonsterKnowledgeView } from "@/lib/bestiary/types";

function formatWhen(at: number): string {
  try {
    return new Date(at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function MonsterKnowledgeBlock({ knowledge }: { knowledge: PlayerMonsterKnowledgeView }) {
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
