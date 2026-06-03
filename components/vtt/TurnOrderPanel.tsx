"use client";

import type { BattleToken } from "@/lib/vtt/types";
import type { CombatTrack } from "@/lib/room/combat";
import { nextCombatTurn, rollInitiative } from "@/hooks/useRoomSync";
import { collectPlayerActorIds, resolveTokenRing } from "@/lib/vtt/token-colors";

type Props = {
  roomId: string;
  combat: CombatTrack;
  tokens: BattleToken[];
  canControl: boolean;
  onUpdate: () => void;
};

export function TurnOrderPanel({ roomId, combat, tokens, canControl, onUpdate }: Props) {
  const tokenMap = new Map(tokens.map((t) => [t.id, t]));
  const activeId = combat.order[combat.activeIndex] ?? null;
  const playerActorIds = collectPlayerActorIds(tokens);

  async function handleRoll() {
    await rollInitiative(roomId);
    onUpdate();
  }

  async function handleNext() {
    await nextCombatTurn(roomId);
    onUpdate();
  }

  return (
    <div className="vtt-turn-track">
      <div className="vtt-turn-head">
        <p className="vtt-eyebrow" style={{ margin: 0 }}>
          Ordem de combate
        </p>
        <span className="vtt-turn-round">Rodada {combat.round}</span>
      </div>

      {canControl ? (
        <div className="vtt-turn-controls">
          <button type="button" className="btn btn-ghost" onClick={handleRoll}>
            Rolar iniciativa
          </button>
          <button type="button" className="btn" onClick={handleNext}>
            Próximo turno
          </button>
        </div>
      ) : null}

      <ol className="vtt-turn-list">
        {combat.order.map((id, index) => {
          const token = tokenMap.get(id);
          if (!token) return null;
          const active = id === activeId;
          const ring = resolveTokenRing(token, playerActorIds);
          const ringShadow = ring.rings
            .map((r) => `0 0 0 ${r.width}px ${r.color}`)
            .join(", ");
          return (
            <li key={id} className={active ? "active" : ""}>
              <span className="vtt-turn-rank">{index + 1}</span>
              <span
                className="vtt-turn-avatar"
                style={ringShadow ? { boxShadow: ringShadow } : undefined}
              >
                {token.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={token.imageUrl} alt="" />
                ) : (
                  <span style={{ background: token.color }} />
                )}
              </span>
              <span className="vtt-turn-info">
                <strong>{token.name}</strong>
                <small>
                  {token.initiative != null ? `Ini ${token.initiative}` : "—"}
                  {token.ownerRole === "jogador" ? " · Jogador" : ""}
                  {token.monsterTier ? ` · ${token.monsterTier}` : ""}
                  {token.monsterVariant && token.monsterVariant !== "normal"
                    ? ` · ${token.monsterVariant}`
                    : ""}
                </small>
              </span>
              {active ? <span className="vtt-turn-now">vez</span> : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
