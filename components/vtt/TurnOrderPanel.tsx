"use client";



import { useState } from "react";

import type { BattleToken } from "@/lib/vtt/types";

import type { CombatTrack } from "@/lib/room/combat";

import { nextCombatTurn, rollInitiative } from "@/hooks/useRoomSync";

import { collectPlayerActorIds, resolveTokenRing } from "@/lib/vtt/token-colors";

import { EndTurnConfirmDialog } from "@/components/vtt/EndTurnConfirmDialog";
import { TokenEffectsRow } from "@/components/vtt/TokenEffectsRow";



type Props = {

  roomId: string;

  combat: CombatTrack;

  tokens: BattleToken[];

  canControl: boolean;

  canEndTurn?: boolean;

  onUpdate: () => void;

  /** Tokens válidos no modo ataque (espelha o hex). */

  attackableIds?: ReadonlySet<string>;

  /** Alvo sob o cursor no hex ou na lista de turnos. */

  hoverAttackTargetId?: string | null;

  onHoverAttackTargetChange?: (tokenId: string | null) => void;

};



function hpPercent(token: BattleToken): number {

  if (token.vidaMax == null || token.vidaMax <= 0) return 100;

  const v = token.vida ?? token.vidaMax;

  return Math.round((v / token.vidaMax) * 100);

}



export function TurnOrderPanel({

  roomId,

  combat,

  tokens,

  canControl,

  canEndTurn = canControl,

  onUpdate,

  attackableIds,

  hoverAttackTargetId = null,

  onHoverAttackTargetChange,

}: Props) {

  const [confirmOpen, setConfirmOpen] = useState(false);

  const [busy, setBusy] = useState(false);



  const tokenMap = new Map(tokens.map((t) => [t.id, t]));

  const activeId = combat.order[combat.activeIndex] ?? null;

  const activeToken = activeId ? tokenMap.get(activeId) : null;

  const playerActorIds = collectPlayerActorIds(tokens);



  async function handleRoll() {

    await rollInitiative(roomId);

    onUpdate();

  }



  async function handleNext() {

    setBusy(true);

    try {

      await nextCombatTurn(roomId);

      setConfirmOpen(false);

      onUpdate();

    } finally {

      setBusy(false);

    }

  }



  return (

    <>

      <div className="vtt-turn-track">

        <div className="vtt-turn-head">

          <p className="vtt-eyebrow" style={{ margin: 0 }}>

            Ordem de combate

          </p>

          <span className="vtt-turn-round">Rodada {combat.round}</span>

        </div>



        <div className="vtt-turn-controls">

          {canControl ? (

            <button type="button" className="btn btn-ghost" onClick={handleRoll}>

              Rolar iniciativa

            </button>

          ) : null}

          {canEndTurn ? (

            <button

              type="button"

              className="btn vtt-turn-next-btn"

              disabled={busy}

              onClick={() => setConfirmOpen(true)}

            >

              Passar turno

            </button>

          ) : null}

        </div>



        <ol className="vtt-turn-list">

          {combat.order.map((id, index) => {

            const token = tokenMap.get(id);

            if (!token) return null;

            const active = id === activeId;

            const ring = resolveTokenRing(token, playerActorIds);

            const ringShadow = ring.rings.map((r) => `0 0 0 ${r.width}px ${r.color}`).join(", ");

            const hp = hpPercent(token);

            const defeated = token.vidaMax != null && (token.vida ?? 0) <= 0;

            const attackable = Boolean(attackableIds?.has(id));

            const attackFocus = hoverAttackTargetId === id;

            const rowClass = [

              active ? "active vtt-turn-active" : "",

              defeated ? "defeated" : "",

              attackFocus ? "vtt-turn-attack-focus" : attackable ? "vtt-turn-attackable" : "",

            ]

              .filter(Boolean)

              .join(" ");

            const avatarClass = [

              "vtt-turn-avatar",

              active ? "vtt-turn-avatar--active" : "",

              attackFocus ? "vtt-turn-avatar--attack-focus" : attackable ? "vtt-turn-avatar--attackable" : "",

            ]

              .filter(Boolean)

              .join(" ");



            return (

              <li
                key={id}
                className={rowClass || undefined}
                onMouseEnter={() => {
                  if (attackable) onHoverAttackTargetChange?.(id);
                }}
                onMouseLeave={() => {
                  if (attackable) onHoverAttackTargetChange?.(null);
                }}
              >

                <span className="vtt-turn-rank" aria-hidden>

                  {index + 1}

                </span>

                <span

                  className={avatarClass}

                  style={{

                    ...(ringShadow ? { boxShadow: ringShadow } : {}),

                    borderColor: token.color,

                  }}

                >

                  {token.imageUrl ? (

                    // eslint-disable-next-line @next/next/no-img-element

                    <img src={token.imageUrl} alt="" />

                  ) : (

                    <span

                      className="vtt-turn-initial"

                      style={{ background: `${token.color}33`, color: token.color }}

                    >

                      {token.name.slice(0, 1).toUpperCase()}

                    </span>

                  )}

                </span>

                <div className="vtt-turn-info">

                  <div className="vtt-turn-name-row">

                    <strong className="vtt-turn-name">{token.name}</strong>

                    {active ? <span className="vtt-turn-now">Agora</span> : null}

                    {attackFocus ? (

                      <span className="vtt-turn-target-badge" title="Alvo do ataque">

                        Alvo

                      </span>

                    ) : attackable ? (

                      <span className="vtt-turn-target-hint" title="Alvo válido">

                        ◎

                      </span>

                    ) : null}

                  </div>

                  {token.vidaMax != null ? (

                    <div className="vtt-turn-hp">

                      <div className="vtt-turn-hp-track">

                        <div

                          className="vtt-turn-hp-fill"

                          style={{ width: `${hp}%`, background: token.color }}

                        />

                      </div>

                      <small>

                        {token.vida}/{token.vidaMax}

                      </small>

                    </div>

                  ) : (

                    <small className="vtt-turn-no-hp">—</small>

                  )}

                  <TokenEffectsRow token={token} className="vtt-effect-chips--turn" max={6} />

                </div>

                {token.initiative != null ? (

                  <span className="vtt-turn-init" title="Iniciativa">

                    {token.initiative}

                  </span>

                ) : null}

              </li>

            );

          })}

        </ol>

      </div>



      <EndTurnConfirmDialog

        open={confirmOpen}

        token={activeToken ?? null}

        round={combat.round}

        busy={busy}

        onConfirm={() => void handleNext()}

        onCancel={() => {

          if (!busy) setConfirmOpen(false);

        }}

      />

    </>

  );

}

