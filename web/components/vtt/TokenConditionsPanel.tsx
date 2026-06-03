"use client";

import type { BattleToken } from "@/lib/vtt/types";
import type { TokenCondition } from "@/lib/combat/conditions";
import { toggleTokenCondition } from "@/lib/combat/conditions";
import { patchRoomToken } from "@/hooks/useRoomSync";

const CONDITION_LABEL: Record<TokenCondition, string> = {
  amedrontado: "Amedrontado",
  cego: "Cego",
  atordoado: "Atordoado",
  envenenado: "Envenenado",
  prostrado: "Prostrado",
  restringido: "Restringido",
  encantado: "Encantado",
};

const ALL_CONDITIONS: TokenCondition[] = [
  "amedrontado",
  "cego",
  "atordoado",
  "envenenado",
  "prostrado",
  "restringido",
  "encantado",
];

type Props = {
  roomId: string;
  token: BattleToken;
  canEdit: boolean;
  onUpdate: () => void;
};

export function TokenConditionsPanel({ roomId, token, canEdit, onUpdate }: Props) {
  if (!canEdit) return null;

  async function toggle(condition: TokenCondition) {
    const next = toggleTokenCondition(token, condition);
    await patchRoomToken(roomId, token.id, { conditions: next });
    onUpdate();
  }

  const active = token.conditions ?? [];

  return (
    <div className="vtt-conditions-panel">
      <p className="vtt-eyebrow">Condições (Cap. 3.4)</p>
      <div className="vtt-conditions-grid">
        {ALL_CONDITIONS.map((c) => (
          <button
            key={c}
            type="button"
            className={`btn btn-ghost vtt-condition-btn${active.includes(c) ? " active" : ""}`}
            onClick={() => void toggle(c)}
            title={CONDITION_LABEL[c]}
          >
            {CONDITION_LABEL[c]}
          </button>
        ))}
      </div>
      <p className="vtt-combat-hint">
        Vantagem/desvantagem aplicam em ataque e save automaticamente.
      </p>
    </div>
  );
}
