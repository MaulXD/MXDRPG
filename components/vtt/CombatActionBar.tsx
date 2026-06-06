"use client";

import { useMemo } from "react";
import type { BattleToken } from "@/lib/vtt/types";
import type { RoomActor } from "@/lib/room/types";
import type { CombatTrack } from "@/lib/room/combat";
import { tokenAxialDistance } from "@/lib/vtt/creature-size";
import { canAttackTarget } from "@/lib/combat/attack";
import { attackerForCombatCheck } from "@/lib/combat/combat-token-pa";
import { isAreaSpellAction } from "@/lib/combat/area-spell";
import { canAbilityTarget, canUseAbility } from "@/lib/combat/ability";
import {
  useCombatActions,
  useCombatTurn,
  usePerformAttack,
} from "@/hooks/useCombatActions";
import type { ChatMessage } from "@/lib/room/chat";
import { CombatActionDetail } from "@/components/vtt/CombatActionDetail";

type Props = {
  roomId: string;
  attacker: BattleToken;
  tokens: BattleToken[];
  actors: Record<string, RoomActor>;
  combat: CombatTrack | null | undefined;
  canBypassTurn: boolean;
  onAttackResult: (msg: ChatMessage) => void;
  onUpdate: () => void;
};

export function CombatActionBar({
  roomId,
  attacker,
  tokens,
  actors,
  combat,
  canBypassTurn,
  onAttackResult,
  onUpdate,
}: Props) {
  const turn = useCombatTurn({ combat, canBypassTurn });
  const { actor, actions, action, extraAttacks, selfAbilityOk } = useCombatActions(
    attacker,
    tokens,
    actors,
    turn
  );
  const { busy, err, performAttack, performAbility, saveLoadout } = usePerformAttack();

  const isAreaSpell = Boolean(action && isAreaSpellAction(action));

  const targets = useMemo(() => {
    if (!action || action.selfTarget || isAreaSpellAction(action)) return [];
    const prepared = attackerForCombatCheck(attacker, actor, turn, {
      combatHasOrder: turn.combatHasOrder,
    });
    return tokens
      .filter((t) => t.id !== prepared.id)
      .map((t) => {
        const check =
          action.kind === "ability"
            ? canAbilityTarget(prepared, t, action, {
                activeTokenId: turn.activeTokenId,
                bypassTurn: turn.bypassTurn,
              }, actor)
            : canAttackTarget(prepared, t, action, {
                activeTokenId: turn.activeTokenId,
                bypassTurn: turn.bypassTurn,
              }, { actor });
        return { token: t, dist: tokenAxialDistance(prepared, t), ...check };
      })
      .filter((t) => t.dist <= action.rangeHex);
  }, [attacker, actor, tokens, action, turn]);

  if (!actor || !action) {
    return <p className="vtt-combat-hint">Token sem ficha linkada — não pode atacar.</p>;
  }

  const loadoutKey =
    actor.combatLoadout != null
      ? `${actor.combatLoadout.packId}:${actor.combatLoadout.entryId}`
      : `${action.packId}:${action.entryId}`;

  async function attack(defenderId: string) {
    if (action!.kind === "ability") {
      await performAbility(
        roomId,
        attacker.id,
        defenderId,
        action!,
        turn.bypassTurn,
        onAttackResult,
        onUpdate
      );
    } else {
      await performAttack(
        roomId,
        attacker,
        defenderId,
        action!,
        turn.bypassTurn,
        onAttackResult,
        onUpdate
      );
    }
  }

  async function useSelfAbility() {
    await performAbility(
      roomId,
      attacker.id,
      null,
      action!,
      turn.bypassTurn,
      onAttackResult,
      onUpdate
    );
  }

  async function onActionChange(value: string) {
    const [packId, entryId] = value.split(":");
    if (packId !== "armas" && packId !== "magias" && packId !== "habilidades") return;
    if (!attacker.actorId) return;
    await saveLoadout(roomId, attacker.actorId, packId, entryId, onUpdate);
  }

  const turnHint =
    turn.activeTokenId && turn.activeTokenId !== attacker.id && !turn.bypassTurn
      ? "Não é seu turno — aguarde iniciativa."
      : turn.activeTokenId === attacker.id
        ? "Seu turno — clique inimigo no mapa ou use botão."
        : null;

  const actionIcon =
    action.kind === "spell" ? "✦" : action.kind === "ability" ? "◆" : "⚔";
  const isSaveSpell = action.resolution === "save";
  const multiLabel =
    extraAttacks > 1 ? ` · ${extraAttacks} ataques` : "";

  return (
    <div className="vtt-combat-bar">
      <p className="vtt-eyebrow">Combate</p>

      {actions.length > 1 ? (
        <label className="vtt-combat-select">
          Ação
          <select value={loadoutKey} onChange={(e) => onActionChange(e.target.value)} disabled={busy !== null}>
            {actions.map((a) => (
              <option key={`${a.packId}:${a.entryId}`} value={`${a.packId}:${a.entryId}`}>
                {a.kind === "spell" ? "✦ " : a.kind === "ability" ? "◆ " : "⚔ "}
                {a.label}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="vtt-combat-weapon">
          {action.label}
          {multiLabel}
        </p>
      )}

      {extraAttacks > 1 && action.kind === "weapon" ? (
        <p className="vtt-combat-hint">Ataque Extra — {extraAttacks} rolagens por ação{multiLabel}</p>
      ) : null}

      <CombatActionDetail action={action} actor={actor} />

      {isSaveSpell ? (
        <p className="vtt-combat-hint">Magia com save — alvo rola vs CD (metade se passar).</p>
      ) : null}

      {turnHint ? <p className="vtt-combat-turn-hint">{turnHint}</p> : null}

      {isAreaSpell ? (
        <p className="vtt-combat-hint">
          Magia de área ({action.areaShape}) — selecione o centro ou a direção no mapa hexagonal.
        </p>
      ) : null}

      {action.selfTarget ? (
        <button
          type="button"
          className="btn btn-ghost vtt-attack-btn"
          disabled={!selfAbilityOk || busy !== null}
          onClick={useSelfAbility}
        >
          {busy === "self" ? "Ativando…" : `${actionIcon} Usar ${action.name}`}
        </button>
      ) : isAreaSpell ? null : !targets.length ? (
        <p className="vtt-combat-hint">Nenhum alvo no alcance ({action.rangeHex} hex).</p>
      ) : (
        <ul className="vtt-combat-targets">
          {targets.map(({ token, ok, reason }) => (
            <li key={token.id}>
              <button
                type="button"
                className="btn btn-ghost vtt-attack-btn"
                disabled={!ok || busy !== null}
                onClick={() => attack(token.id)}
              >
                {busy === token.id
                  ? "Rolando…"
                  : `${actionIcon} ${
                      action.kind === "spell"
                        ? isSaveSpell
                          ? "Conjurar"
                          : "Conjurar"
                        : action.kind === "ability"
                          ? "Usar"
                          : "Atacar"
                    } ${token.name}`}
                {token.defesa != null
                  ? ` (CA ${token.defesa}${token.defesaBonus ? `+${token.defesaBonus}` : ""})`
                  : ""}
              </button>
              {!ok && reason ? <small className="vtt-combat-reason">{reason}</small> : null}
            </li>
          ))}
        </ul>
      )}

      {!isAreaSpell ? (
        <p className="vtt-combat-click-hint">Ou clique no token inimigo destacado no mapa.</p>
      ) : null}
      {err ? <p className="dice-err">{err}</p> : null}
    </div>
  );
}

