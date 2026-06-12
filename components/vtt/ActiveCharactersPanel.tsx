"use client";

import type { BattleToken } from "@/lib/vtt/types";
import type { Axial } from "@/lib/vtt/hex-math";
import type { RoomActor, RoomSnapshot } from "@/lib/room/types";
import type { CombatTrack } from "@/lib/room/combat";
import { activeTokenId } from "@/lib/room/combat";
import type { SessionUser } from "@/lib/auth/types";
import { ACTION_MODE_LABEL, type TokenActionMode } from "@/lib/vtt/action-mode";
import { PaDotMeter } from "@/components/vtt/PaDotMeter";
import { TokenEffectsRow } from "@/components/vtt/TokenEffectsRow";
import { PlayerSpawnPanel } from "@/components/vtt/PlayerSpawnPanel";

type Props = {
  tokens: BattleToken[];
  allSceneTokens: BattleToken[];
  roomActors: Record<string, RoomActor>;
  session: SessionUser | null;
  adventureId: string;
  spawnAxial: Axial | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  selected: BattleToken | null;
  combat: CombatTrack | null | undefined;
  canViewTokenPa: (token: BattleToken) => boolean;
  canUseToken: boolean;
  canControlCombat: boolean;
  showMovementLegend: boolean;
  actionMode: TokenActionMode;
  actionErr: string | null;
  roomId: string;
  roomOwnerId?: string;
  memberIds?: string[];
  onPlaced: (snapshot: RoomSnapshot) => void;
  fogHint?: boolean;
};

export function ActiveCharactersPanel({
  tokens,
  allSceneTokens,
  roomActors,
  session,
  adventureId,
  spawnAxial,
  selectedId,
  onSelect,
  selected,
  combat,
  canViewTokenPa,
  canUseToken,
  canControlCombat,
  showMovementLegend,
  actionMode,
  actionErr,
  roomId,
  roomOwnerId = "",
  memberIds = [],
  onPlaced,
  fogHint = false,
}: Props) {
  const canCreateInAdventure = roomId !== "demo" && Boolean(session);

  return (
    <aside className="vtt-sidebar vtt-sidebar--actors">
      <PlayerSpawnPanel
        roomId={roomId}
        roomOwnerId={roomOwnerId}
        memberIds={memberIds}
        adventureId={adventureId}
        actors={roomActors}
        session={session}
        tokens={allSceneTokens}
        spawnAxial={spawnAxial}
        onPlaced={onPlaced}
        showAllActors={canControlCombat}
        canPullBack={canControlCombat}
        allowOwnerPullBack
        showCreateLink={canCreateInAdventure}
      />

      <p className="vtt-eyebrow vtt-sidebar-map-label">No mapa</p>
      {fogHint ? (
        <p className="vtt-combat-hint vtt-fog-list-hint">
          Só aparecem jogadores e criaturas no seu campo de visão.
        </p>
      ) : (
        <p className="vtt-combat-hint">Clique na lista ou direto no hex.</p>
      )}

      {showMovementLegend ? (
        <p className="vtt-move-legend vtt-combat-hint">
          <span className="vtt-move-legend-swatch vtt-move-legend-swatch--free" /> sem PA extra
          <span className="vtt-move-legend-swatch vtt-move-legend-swatch--paid" /> caminhada +PA
          <span className="vtt-move-legend-swatch vtt-move-legend-swatch--run" /> só corrida
        </p>
      ) : null}

      {canUseToken && selected && combat?.order?.length ? (
        <p className="vtt-combat-hint vtt-action-ring-hint">
          {selected.id === activeTokenId(combat)
            ? "Clique direito no token para o anel de ações."
            : "Aguarde seu turno — use a HUD embaixo ou o painel ⏱."}
        </p>
      ) : null}
      {actionMode !== "idle" ? (
        <p className="vtt-combat-hint">
          Modo: <strong>{ACTION_MODE_LABEL[actionMode]}</strong> — Esc cancela.
        </p>
      ) : null}
      {actionErr ? <p className="dice-err">{actionErr}</p> : null}

      {tokens.length === 0 ? (
        <p className="vtt-combat-hint">Nenhum token visível no momento.</p>
      ) : (
        <ul className="vtt-token-list">
          {tokens.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className={t.id === selectedId ? "active" : ""}
                onClick={() => onSelect(t.id)}
              >
                <span className="token-dot" style={{ background: t.color }} />
                <span className="vtt-token-list-label">
                  <span className="vtt-token-list-name">{t.name}</span>
                  {canViewTokenPa(t) ? (
                    <PaDotMeter
                      current={t.pa}
                      max={t.paMax}
                      banked={t.bankedPa}
                      showLabel={false}
                      size="sm"
                      compact
                    />
                  ) : null}
                  <TokenEffectsRow token={t} className="vtt-effect-chips--list" max={4} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
