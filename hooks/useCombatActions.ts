"use client";



import { useCallback, useMemo, useState } from "react";

import type { BattleToken } from "@/lib/vtt/types";

import type { RoomActor } from "@/lib/room/types";

import type { CombatTrack } from "@/lib/room/combat";

import { activeTokenId } from "@/lib/room/combat";

import { tokenAxialDistance } from "@/lib/vtt/creature-size";

import {
  canAttackTarget,
  combatAttackRequestOpts,
  listCombatActions,
  listTokenCombatActions,
  resolveCombatAction,
  warriorAttackCount,
} from "@/lib/combat/attack";

import { attackerForCombatCheck } from "@/lib/combat/combat-token-pa";

import { canAbilityTarget, canUseAbility } from "@/lib/combat/ability";

import type { CombatActionOption } from "@/lib/combat/types";

import { isAreaSpellAction } from "@/lib/combat/area-spell";

import { patchRoomActor, postRoomAttack, postRoomAbility } from "@/hooks/useRoomSync";

import type { ChatMessage } from "@/lib/room/chat";



type TurnOpts = {

  combat: CombatTrack | null | undefined;

  canBypassTurn: boolean;

};



export function useCombatTurn({ combat, canBypassTurn }: TurnOpts) {

  const activeId = combat ? activeTokenId(combat) : null;

  return {

    activeTokenId: activeId,

    bypassTurn: canBypassTurn,

    combatRound: combat?.round ?? 1,

    combatHasOrder: Boolean(combat?.order.length),

    isMyTurn: (tokenId: string) => !activeId || activeId === tokenId || canBypassTurn,

  };

}



export function useCombatActions(

  attacker: BattleToken | null,

  tokens: BattleToken[],

  actors: Record<string, RoomActor>,

  turn: ReturnType<typeof useCombatTurn>

) {

  const actor = attacker?.linked && attacker.actorId ? actors[attacker.actorId] ?? null : null;

  const actions = useMemo(() => {
    if (!attacker) return [];
    return actor ? listCombatActions(actor) : listTokenCombatActions(attacker, null);
  }, [attacker, actor]);

  const action = useMemo(() => {
    if (!attacker) return null;
    if (actor) return resolveCombatAction(actor);
    return listTokenCombatActions(attacker, null)[0] ?? null;
  }, [attacker, actor, actor?.combatLoadout?.packId, actor?.combatLoadout?.entryId]);



  const extraAttacks = useMemo(() => {

    if (!actor || !action || action.kind !== "weapon") return 0;

    return warriorAttackCount(actor, action);

  }, [actor, action]);



  const attackableIds = useMemo(() => {

    if (!attacker || !action) return new Set<string>();
    if (isAreaSpellAction(action)) return new Set<string>();

    const prepared = attackerForCombatCheck(attacker, actor, turn, {
      combatHasOrder: turn.combatHasOrder,
    });

    const ids = new Set<string>();

    for (const t of tokens) {

      if (t.id === prepared.id) continue;

      const check =

        action.kind === "ability" && action.selfTarget

          ? { ok: false }

          : action.kind === "ability"

            ? canAbilityTarget(prepared, t, action, {

                activeTokenId: turn.activeTokenId,

                bypassTurn: turn.bypassTurn,

              }, actor)

            : canAttackTarget(prepared, t, action, {

                activeTokenId: turn.activeTokenId,

                bypassTurn: turn.bypassTurn,

              }, { actor });

      if (check.ok && tokenAxialDistance(prepared, t) <= action.rangeHex) {

        ids.add(t.id);

      }

    }

    return ids;

  }, [attacker, actor, tokens, action, turn]);



  const selfAbilityOk = useMemo(() => {

    if (!attacker || !action || !action.selfTarget) return false;

    return canUseAbility(attacker, action, {

      activeTokenId: turn.activeTokenId,

      bypassTurn: turn.bypassTurn,

    }).ok;

  }, [attacker, action, turn]);



  return { actor, actions, action, attackableIds, extraAttacks, selfAbilityOk };

}



export function usePerformAttack() {

  const [busy, setBusy] = useState<string | null>(null);

  const [err, setErr] = useState<string | null>(null);



  const performAttack = useCallback(

    async (

      roomId: string,

      attacker: BattleToken,

      defenderId: string,

      action: CombatActionOption,

      bypassTurn: boolean,

      onAttackResult: (msg: ChatMessage) => void,

      onUpdate: () => void,

      channelExtraPa = 0

    ) => {

      setBusy(defenderId);

      setErr(null);

      try {

        const snapshot = await postRoomAttack(
          roomId,
          attacker.id,
          defenderId,
          combatAttackRequestOpts(action, attacker, {
            bypassTurn,
            channelExtraPa: action.channelMaxExtraPa && channelExtraPa > 0 ? channelExtraPa : undefined,
          })
        );

        const combatMsgs = snapshot.chat.filter((m) => m.kind === "combat");

        const last = combatMsgs[combatMsgs.length - 1];

        if (last?.kind === "combat") onAttackResult(last);

        onUpdate();

      } catch (e) {

        setErr(e instanceof Error ? e.message : "Falha no ataque");

      } finally {

        setBusy(null);

      }

    },

    []

  );



  const performAbility = useCallback(

    async (

      roomId: string,

      attackerId: string,

      defenderId: string | null,

      action: CombatActionOption,

      bypassTurn: boolean,

      onAttackResult: (msg: ChatMessage) => void,

      onUpdate: () => void

    ) => {

      setBusy(defenderId ?? "self");

      setErr(null);

      try {

        const snapshot = await postRoomAbility(roomId, attackerId, defenderId, {

          actionEntryId: action.entryId,

          bypassTurn,

        });

        const combatMsgs = snapshot.chat.filter((m) => m.kind === "combat");

        const last = combatMsgs[combatMsgs.length - 1];

        if (last?.kind === "combat") onAttackResult(last);

        onUpdate();

      } catch (e) {

        setErr(e instanceof Error ? e.message : "Falha na habilidade");

      } finally {

        setBusy(null);

      }

    },

    []

  );



  const saveLoadout = useCallback(

    async (

      roomId: string,

      actorId: string,

      packId: "armas" | "magias" | "habilidades",

      entryId: string,

      onUpdate: () => void

    ) => {

      await patchRoomActor(roomId, actorId, { combatLoadout: { packId, entryId } });

      onUpdate();

    },

    []

  );



  return { busy, err, setErr, performAttack, performAbility, saveLoadout };

}


