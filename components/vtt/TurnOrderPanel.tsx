"use client";



import { useState, type DragEvent } from "react";

import type { BattleToken } from "@/lib/vtt/types";

import { activeTokenId, normalizeCombatTrack, type CombatTrack } from "@/lib/room/combat";
import { resolveLivingActiveTokenId } from "@/lib/room/combat-order";
import type { CombatUndoEntry, RoomSnapshot } from "@/lib/room/types";

import { nextCombatTurn, postGmCombatAction, rollInitiative } from "@/hooks/useRoomSync";

import { collectPlayerActorIds, resolveTokenRing } from "@/lib/vtt/token-colors";
import { hpBarColor, hpRatio, isTokenDefeated } from "@/lib/vtt/token-hp-display";

import { TokenEffectsRow } from "@/components/vtt/TokenEffectsRow";
import {
  TurnOrderChevronLeftIcon,
  TurnOrderChevronRightIcon,
  TurnOrderRollIcon,
  TurnOrderSettingsIcon,
  TurnOrderTargetIcon,
} from "@/components/vtt/TurnOrderIcons";



type Props = {

  roomId: string;

  combat: CombatTrack;

  tokens: BattleToken[];

  canControl: boolean;

  canEndTurn?: boolean;

  onUpdate: () => void;

  /** Aplica snapshot retornado pela API (turno/PA imediato). */
  onSnapshot?: (snap: RoomSnapshot) => void;

  /** Tokens válidos no modo ataque (espelha o hex). */

  attackableIds?: ReadonlySet<string>;

  /** Tokens no alcance (anel no mapa) — pode incluir alvos bloqueados por turno/PA. */
  rangeTargetIds?: ReadonlySet<string>;

  /** Alvo sob o cursor no hex ou na lista de turnos. */

  hoverAttackTargetId?: string | null;

  onHoverAttackTargetChange?: (tokenId: string | null) => void;

  /** Pilha de desfazer — só mestre. */
  combatUndo?: CombatUndoEntry[];

  /** Layout estilo Roll20 — avatar + iniciativa, controles no rodapé. */
  compact?: boolean;

};



function hpPercent(token: BattleToken): number {
  if (isTokenDefeated(token)) return 0;
  if (token.vidaMax == null || token.vidaMax <= 0) return 100;
  const v = token.vida ?? token.vidaMax;
  return Math.round((v / token.vidaMax) * 100);
}

function livingOrderIds(order: string[], tokenMap: Map<string, BattleToken>): string[] {
  return order.filter((id) => {
    const t = tokenMap.get(id);
    return t != null && !isTokenDefeated(t);
  });
}

function reorderIds(order: string[], fromId: string, toId: string): string[] {
  const from = order.indexOf(fromId);
  const to = order.indexOf(toId);
  if (from < 0 || to < 0 || from === to) return order;
  const next = [...order];
  next.splice(from, 1);
  next.splice(to, 0, fromId);
  return next;
}



export function TurnOrderPanel({

  roomId,

  combat,

  tokens,

  canControl,

  canEndTurn = canControl,

  onUpdate,
  onSnapshot,

  attackableIds,

  rangeTargetIds,

  hoverAttackTargetId = null,

  onHoverAttackTargetChange,

  combatUndo = [],

  compact = false,

}: Props) {
  const track = normalizeCombatTrack(combat, tokens);

  const [busy, setBusy] = useState(false);
  const [gmBusy, setGmBusy] = useState<string | null>(null);
  const [gmError, setGmError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const attackHoverEnabled = Boolean(
    (attackableIds && attackableIds.size > 0) || (rangeTargetIds && rangeTargetIds.size > 0)
  );

  const tokenMap = new Map(tokens.map((t) => [t.id, t]));
  const displayOrder = livingOrderIds(track.order, tokenMap);

  const activeId =
    resolveLivingActiveTokenId(track, tokens) ?? activeTokenId(track);

  const activeToken = activeId ? tokenMap.get(activeId) : null;

  const playerActorIds = collectPlayerActorIds(tokens);



  async function handleRoll() {
    setGmError(null);
    try {
      const snap = await rollInitiative(roomId);
      onSnapshot?.(snap);
      onUpdate();
    } catch (e) {
      setGmError(e instanceof Error ? e.message : "Falha ao rolar iniciativa");
    }
  }



  async function handleNext() {
    setBusy(true);
    setGmError(null);
    try {
      const snap = await nextCombatTurn(roomId, { force: true });
      onSnapshot?.(snap);
    } catch (e) {
      setGmError(e instanceof Error ? e.message : "Falha ao passar turno");
    } finally {
      setBusy(false);
    }
  }

  function handlePrev() {
    if (!activeId || displayOrder.length < 2) return;
    const idx = displayOrder.indexOf(activeId);
    const prevId =
      idx <= 0 ? displayOrder[displayOrder.length - 1]! : displayOrder[idx - 1]!;
    void runGmAction("prev", { action: "set-active", tokenId: prevId });
  }

  function rowTitle(token: BattleToken, active: boolean): string {
    const parts = [token.name];
    if (token.initiative != null) parts.push(`Iniciativa ${token.initiative}`);
    if (token.vidaMax != null) parts.push(`${token.vida ?? 0}/${token.vidaMax} PV`);
    if (active) parts.push("Turno atual");
    return parts.join(" · ");
  }

  async function runGmAction(key: string, body: Parameters<typeof postGmCombatAction>[1]) {
    setGmBusy(key);
    setGmError(null);
    try {
      const snap = await postGmCombatAction(roomId, body);
      onSnapshot?.(snap);
      onUpdate();
    } catch (e) {
      setGmError(e instanceof Error ? e.message : "Falha");
    } finally {
      setGmBusy(null);
    }
  }

  async function handleReorder(fromId: string, toId: string) {
    if (fromId === toId) return;
    const base = livingOrderIds(track.order, tokenMap);
    const order = reorderIds(base, fromId, toId);
    await runGmAction("reorder", { action: "set-order", order });
  }

  const undoByToken = new Map<string, CombatUndoEntry>();
  for (let i = combatUndo.length - 1; i >= 0; i--) {
    const entry = combatUndo[i]!;
    if (!undoByToken.has(entry.tokenId)) undoByToken.set(entry.tokenId, entry);
  }

  const gmChips = (id: string, token: BattleToken, active: boolean, defeated: boolean) =>
    canControl && !defeated ? (
      <div className="vtt-turn-gm-actions" onPointerDown={(e) => e.stopPropagation()}>
        {!active ? (
          <button
            type="button"
            className="vtt-turn-gm-chip vtt-turn-gm-chip--active"
            title="Definir como turno ativo"
            disabled={gmBusy != null}
            onClick={(e) => {
              e.stopPropagation();
              void runGmAction(`active-${id}`, { action: "set-active", tokenId: id });
            }}
          >
            {gmBusy === `active-${id}` ? "…" : "▶"}
          </button>
        ) : null}
        <button
          type="button"
          className="vtt-turn-gm-chip"
          title="Restaurar PA deste token"
          disabled={gmBusy != null}
          onClick={(e) => {
            e.stopPropagation();
            void runGmAction(`pa-${id}`, { action: "reset-pa", tokenId: id });
          }}
        >
          {gmBusy === `pa-${id}` ? "…" : "PA"}
        </button>
        <button
          type="button"
          className="vtt-turn-gm-chip"
          title={active ? "Adiar para o fim desta rodada" : "Jogar ao fim desta rodada"}
          disabled={gmBusy != null}
          onClick={(e) => {
            e.stopPropagation();
            void runGmAction(`defer-${id}`, { action: "defer-turn", tokenId: id });
          }}
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
    ) : null;

  return (
    <>
      <div
        className={`vtt-turn-track${compact ? " vtt-turn-track--compact" : ""}`}
      >
        {compact ? (
          <div className="vtt-turn-compact-head">
            {canControl || canEndTurn ? (
              <div className="vtt-turn-compact-nav">
                {canControl ? (
                  <button
                    type="button"
                    className="vtt-turn-compact-nav-btn"
                    title="Turno anterior"
                    disabled={gmBusy != null || displayOrder.length < 2}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrev();
                    }}
                  >
                    <TurnOrderChevronLeftIcon className="vtt-turn-compact-nav-icon" />
                    <span>Anterior</span>
                  </button>
                ) : null}
                {canEndTurn || canControl ? (
                  <button
                    type="button"
                    className="vtt-turn-compact-nav-btn vtt-turn-compact-nav-btn--next"
                    title="Próximo turno"
                    disabled={busy || !track.order.length}
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleNext();
                    }}
                  >
                    <span>{busy ? "…" : "Próximo"}</span>
                    {!busy ? (
                      <TurnOrderChevronRightIcon className="vtt-turn-compact-nav-icon" />
                    ) : null}
                  </button>
                ) : null}
              </div>
            ) : null}
            <div className="vtt-turn-compact-meta">
              <span className="vtt-turn-compact-count">
                Contar: <strong>{displayOrder.length}</strong>
              </span>
              {canControl ? (
                <div className="vtt-turn-compact-tools">
                  <button
                    type="button"
                    className="vtt-turn-compact-icon-btn"
                    title="Rolar iniciativa"
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleRoll();
                    }}
                  >
                    <TurnOrderRollIcon />
                  </button>
                  <div className="vtt-turn-compact-settings">
                    <button
                      type="button"
                      className="vtt-turn-compact-icon-btn"
                      title="Opções do mestre"
                      aria-expanded={settingsOpen}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSettingsOpen((o) => !o);
                      }}
                    >
                      <TurnOrderSettingsIcon />
                    </button>
                    {settingsOpen ? (
                      <div className="vtt-turn-compact-settings-menu" role="menu">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setSettingsOpen(false);
                            void handleRoll();
                          }}
                        >
                          Rolar iniciativa
                        </button>
                        {track.orderOverridden ? (
                          <button
                            type="button"
                            role="menuitem"
                            disabled={gmBusy != null}
                            onClick={() => {
                              setSettingsOpen(false);
                              void runGmAction("restore", { action: "restore-order" });
                            }}
                          >
                            Ordem natural
                          </button>
                        ) : null}
                        <p className="vtt-turn-compact-settings-hint">
                          Arraste uma linha para reordenar.
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
              <span className="vtt-turn-compact-round">R{track.round}</span>
            </div>
          </div>
        ) : (
          <>
            <div className="vtt-turn-head">
              <p className="vtt-eyebrow" style={{ margin: 0 }}>
                Ordem de combate
              </p>
              <span className="vtt-turn-round">Rodada {track.round}</span>
            </div>
            <div className="vtt-turn-controls">
              {canControl ? (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleRoll();
                  }}
                >
                  Rolar iniciativa
                </button>
              ) : null}
              {canControl ? (
                <button
                  type="button"
                  className="btn btn-ghost vtt-turn-nav-btn"
                  disabled={gmBusy != null || displayOrder.length < 2}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                >
                  Anterior
                </button>
              ) : null}
              {canEndTurn || canControl ? (
                <button
                  type="button"
                  className="btn vtt-turn-next-btn"
                  disabled={busy || !track.order.length}
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleNext();
                  }}
                >
                  {busy ? "…" : "Próximo"}
                </button>
              ) : null}
            </div>
            {canControl ? (
              <p className="vtt-turn-gm-hint">Arraste ≡ para reordenar a fila manualmente.</p>
            ) : null}
          </>
        )}

        {canControl && track.orderOverridden ? (
          <div className={`vtt-turn-gm-banner${compact ? " vtt-turn-gm-banner--compact" : ""}`}>
            <span>Ordem manual</span>
            {!compact ? (
              <button
                type="button"
                className="btn btn-ghost vtt-turn-gm-btn"
                disabled={gmBusy != null}
                onClick={() => void runGmAction("restore", { action: "restore-order" })}
              >
                {gmBusy === "restore" ? "…" : "↩ Ordem natural"}
              </button>
            ) : null}
          </div>
        ) : null}

        {gmError ? <p className="vtt-turn-gm-error">{gmError}</p> : null}

        {displayOrder.length === 0 ? (
          <p className={`vtt-combat-hint vtt-turn-empty${compact ? " vtt-turn-empty--compact" : ""}`}>
            {canControl
              ? compact
                ? "Rolar iniciativa para começar."
                : "Nenhum combatente na fila — use Rolar iniciativa para começar."
              : "Aguardando o mestre rolar a iniciativa."}
          </p>
        ) : null}

        <ol
          className={[
            "vtt-turn-list",
            canControl && !compact ? "vtt-turn-list--gm" : "",
            compact ? "vtt-turn-list--compact" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >

          {displayOrder.map((id, index) => {

            const token = tokenMap.get(id);

            if (!token) return null;

            const active = id === activeId;

            const ring = resolveTokenRing(token, playerActorIds);

            const ringShadow = ring.rings.map((r) => `0 0 0 ${r.width}px ${r.color}`).join(", ");

            const hp = hpPercent(token);

            const defeated = isTokenDefeated(token);
            const draggable = canControl && !defeated;

            const attackable = Boolean(attackableIds?.has(id));
            const inRangeOnly = Boolean(!attackable && rangeTargetIds?.has(id));

            const attackFocus = hoverAttackTargetId === id;

            const rowClass = [

              active ? "active vtt-turn-active" : "",

              defeated ? "defeated" : "",

              attackFocus
                ? "vtt-turn-attack-focus"
                : attackable
                  ? "vtt-turn-attackable"
                  : inRangeOnly
                    ? "vtt-turn-in-range"
                    : "",

              draggable ? "vtt-turn-draggable" : "",

              dragOverId === id && dragId !== id ? "vtt-turn-drag-over" : "",

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



            const avatarNode = (
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
            );

            const dragProps = draggable
              ? {
                  draggable: true as const,
                  onDragStart: (e: DragEvent) => {
                    setDragId(id);
                    setDragOverId(id);
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", id);
                  },
                  onDragEnd: () => {
                    setDragId(null);
                    setDragOverId(null);
                  },
                }
              : {};

            return (
              <li
                key={id}
                className={rowClass || undefined}
                title={compact ? rowTitle(token, active) : undefined}
                {...dragProps}
                onDragOver={(e) => {
                  if (!draggable || !dragId || dragId === id) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setDragOverId(id);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!dragId || dragId === id) return;
                  void handleReorder(dragId, id);
                  setDragId(null);
                  setDragOverId(null);
                }}
                onMouseEnter={() => {
                  if (attackHoverEnabled && attackable) onHoverAttackTargetChange?.(id);
                }}
                onMouseLeave={() => {
                  if (attackHoverEnabled && attackable) onHoverAttackTargetChange?.(null);
                }}
              >
                {compact ? (
                  <>
                    <div className="vtt-turn-compact-main">
                      {avatarNode}
                      <div className="vtt-turn-compact-copy">
                        <div className="vtt-turn-compact-name-row">
                          <strong className="vtt-turn-compact-name">{token.name}</strong>
                          {active ? <span className="vtt-turn-compact-now">Agora</span> : null}
                          {canControl ? gmChips(id, token, active, defeated) : null}
                        </div>
                      </div>
                    </div>
                    <span className="vtt-turn-compact-init" aria-label="Iniciativa">
                      {token.initiative ?? "—"}
                    </span>
                  </>
                ) : (
                  <>
                    {draggable ? (
                      <span
                        className="vtt-turn-drag-handle"
                        draggable
                        aria-hidden
                        title="Arrastar para reordenar"
                        onDragStart={(e) => {
                          setDragId(id);
                          setDragOverId(id);
                          e.dataTransfer.effectAllowed = "move";
                          e.dataTransfer.setData("text/plain", id);
                        }}
                        onDragEnd={() => {
                          setDragId(null);
                          setDragOverId(null);
                        }}
                      >
                        ≡
                      </span>
                    ) : (
                      <span className="vtt-turn-drag-spacer" aria-hidden />
                    )}
                    <span className="vtt-turn-rank" aria-hidden>
                      {index + 1}
                    </span>
                    {avatarNode}
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
                            <TurnOrderTargetIcon />
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
                      <TokenEffectsRow token={token} className="vtt-effect-chips--turn" max={3} />
                    </div>
                    <div className="vtt-turn-side">
                      {token.initiative != null ? (
                        <span className="vtt-turn-init" title="Iniciativa">
                          {token.initiative}
                        </span>
                      ) : null}
                      {gmChips(id, token, active, defeated)}
                    </div>
                  </>
                )}
              </li>
            );

          })}

        </ol>

      </div>
    </>
  );

}

