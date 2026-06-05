"use client";



import { useState } from "react";

import type { BattleToken } from "@/lib/vtt/types";

import type { CombatTrack } from "@/lib/room/combat";
import type { CombatUndoEntry } from "@/lib/room/types";

import { nextCombatTurn, postGmCombatAction, rollInitiative } from "@/hooks/useRoomSync";

import { collectPlayerActorIds, resolveTokenRing } from "@/lib/vtt/token-colors";
import { hpBarColor, hpRatio } from "@/lib/vtt/token-hp-display";

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

  /** Pilha de desfazer — só mestre. */
  combatUndo?: CombatUndoEntry[];

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

  combatUndo = [],

}: Props) {

  const [busy, setBusy] = useState(false);
  const [gmBusy, setGmBusy] = useState<string | null>(null);
  const [gmError, setGmError] = useState<string | null>(null);



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

      onUpdate();

    } finally {

      setBusy(false);

    }

  }

  async function runGmAction(key: string, body: Parameters<typeof postGmCombatAction>[1]) {
    setGmBusy(key);
    setGmError(null);
    try {
      await postGmCombatAction(roomId, body);
      onUpdate();
    } catch (e) {
      setGmError(e instanceof Error ? e.message : "Falha");
    } finally {
      setGmBusy(null);
    }
  }

  const undoByToken = new Map<string, CombatUndoEntry>();
  for (let i = combatUndo.length - 1; i >= 0; i--) {
    const entry = combatUndo[i]!;
    if (!undoByToken.has(entry.tokenId)) undoByToken.set(entry.tokenId, entry);
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

              onClick={() => void handleNext()}

            >

              Passar turno

            </button>

          ) : null}

        </div>

        {canControl && combat.orderOverridden ? (
          <div className="vtt-turn-gm-banner">
            <span>Ordem alterada pelo mestre</span>
            <button
              type="button"
              className="btn btn-ghost vtt-turn-gm-btn"
              disabled={gmBusy != null}
              onClick={() => void runGmAction("restore", { action: "restore-order" })}
            >
              {gmBusy === "restore" ? "…" : "↩ Ordem natural"}
            </button>
          </div>
        ) : null}

        {gmError ? <p className="vtt-turn-gm-error">{gmError}</p> : null}

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
                  className={`vtt-turn-avatar-slot${active ? " vtt-turn-avatar-slot--active" : ""}`}
                >
                  <span
                    className={avatarClass}
                    style={{
                      ...(ringShadow && !active ? { boxShadow: ringShadow } : {}),
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

                          style={{ width: `${hp}%`, background: hpBarColor(hpRatio(token)) }}

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

                {canControl && !defeated ? (
                  <div className="vtt-turn-gm-actions">
                    <button
                      type="button"
                      className="vtt-turn-gm-chip"
                      title="Restaurar PA deste token"
                      disabled={gmBusy != null}
                      onClick={() =>
                        void runGmAction(`pa-${id}`, { action: "reset-pa", tokenId: id })
                      }
                    >
                      {gmBusy === `pa-${id}` ? "…" : "PA"}
                    </button>
                    <button
                      type="button"
                      className="vtt-turn-gm-chip"
                      title={
                        active
                          ? "Adiar para o fim desta rodada"
                          : "Jogar ao fim desta rodada"
                      }
                      disabled={gmBusy != null}
                      onClick={() =>
                        void runGmAction(`defer-${id}`, { action: "defer-turn", tokenId: id })
                      }
                    >
                      {gmBusy === `defer-${id}` ? "…" : "Fim"}
                    </button>
                    {undoByToken.get(id) ? (
                      <button
                        type="button"
                        className="vtt-turn-gm-chip vtt-turn-gm-chip--undo"
                        title={`Desfazer: ${undoByToken.get(id)!.summary}`}
                        disabled={gmBusy != null}
                        onClick={() =>
                          void runGmAction(`undo-${id}`, {
                            action: "revert",
                            undoId: undoByToken.get(id)!.id,
                          })
                        }
                      >
                        {gmBusy === `undo-${id}` ? "…" : "↩"}
                      </button>
                    ) : null}
                  </div>
                ) : null}

              </li>

            );

          })}

        </ol>

      </div>



    </>

  );

}

