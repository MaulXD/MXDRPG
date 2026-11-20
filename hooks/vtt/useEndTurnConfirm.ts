"use client";

import { useCallback, useMemo, useState } from "react";
import {
  paTurnRulesForActor,
  paTurnRulesForMonster,
  type PaTurnRules,
} from "@/lib/combat/pa-economy";
import type { RoomSnapshot } from "@/lib/room/types";
import type { BattleToken } from "@/lib/vtt/types";

type Actors = RoomSnapshot["actors"] | undefined;

/** Mesma regra do servidor (paRulesForRoomToken em combat-pa-engine.ts). */
function paRulesForToken(token: BattleToken, actors: Actors): PaTurnRules {
  const actor = token.linked && token.actorId && actors ? actors[token.actorId] : undefined;
  if (actor) return paTurnRulesForActor(actor);
  return paTurnRulesForMonster(token.monsterTier);
}

type Options = {
  passTurn: () => Promise<unknown>;
  busy: boolean;
  snapshot: RoomSnapshot | null | undefined;
  activeToken: BattleToken | undefined;
  round: number;
};

/**
 * Confirmacao de "Passar turno" (D27). Um lugar so para o estado do modal:
 * cada botao Passar chama requestEndTurn() e renderiza <EndTurnConfirmDialog {...dialog} />.
 */
export function useEndTurnConfirm({ passTurn, busy, snapshot, activeToken, round }: Options) {
  // Guarda de quem era o turno quando o modal abriu. Se o turno muda por SSE com o
  // modal aberto, ele fecha sozinho: confirmar não pode passar o turno do próximo.
  const [openForTokenId, setOpenForTokenId] = useState<string | null>(null);
  const activeTokenId = activeToken?.id ?? null;
  const open = openForTokenId !== null && openForTokenId === activeTokenId;

  const requestEndTurn = useCallback(() => {
    if (!busy && activeTokenId) setOpenForTokenId(activeTokenId);
  }, [busy, activeTokenId]);

  const onCancel = useCallback(() => setOpenForTokenId(null), []);

  const onConfirm = useCallback(() => {
    void passTurn()
      .catch(() => undefined)
      .finally(() => setOpenForTokenId(null));
  }, [passTurn]);

  const actors = snapshot?.actors;
  const paRules = useMemo(
    () => (activeToken ? paRulesForToken(activeToken, actors) : undefined),
    [activeToken, actors]
  );

  return {
    requestEndTurn,
    dialog: {
      open,
      token: activeToken ?? null,
      paRules,
      round,
      busy,
      onConfirm,
      onCancel,
    },
  };
}
