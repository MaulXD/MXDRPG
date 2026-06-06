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
import { TokenConditionsPanel } from "@/components/vtt/TokenConditionsPanel";
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
  /** Aplicar condições (Cap. 3.4) — só mestre */
  canApplyConditions?: boolean;
  showMovementLegend: boolean;
  actionMode: TokenActionMode;
  actionErr: string | null;
  roomId: string;
  onOpenSheet?: (actorId?: string) => void;
  onPlaced: (snapshot: RoomSnapshot) => void;
  onUpdate: () => void;
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
  canApplyConditions = false,
  showMovementLegend,
  actionMode,
  actionErr,
  roomId,
  onOpenSheet,
  onPlaced,
  onUpdate,
  fogHint = false,
}: Props) {
  const canCreateInAdventure = roomId !== "demo" && Boolean(session);

  return (
    <aside className="vtt-sidebar vtt-sidebar--actors">
      <PlayerSpawnPanel
        roomId={roomId}
        adventureId={adventureId}
        actors={roomActors}
        session={session}
        tokens={allSceneTokens}
        spawnAxial={spawnAxial}
        onPlaced={onPlaced}
        showAllActors={canControlCombat}
        canPullBack={canControlCombat}
        showCreateLink={canCreateInAdventure}
      />

      <p className="vtt-eyebrow" style={{ marginTop: "0.75rem" }}>
        No mapa
      </p>
      {fogHint ? (
        <p className="vtt-combat-hint vtt-fog-list-hint">
          Só aparecem jogadores e criaturas no seu campo de visão.
        </p>
      ) : null}

      {showMovementLegend ? (
        <p className="vtt-move-legend vtt-combat-hint">
          <span className="vtt-move-legend-swatch vtt-move-legend-swatch--free" /> sem PA extra
          <span className="vtt-move-legend-swatch vtt-move-legend-swatch--paid" /> caminhada +PA
          <span className="vtt-move-legend-swatch vtt-move-legend-swatch--run" /> só corrida
        </p>
      ) : null}

      {selected ? (
        <div className="vtt-token-panel">
          <strong style={{ color: selected.color }}>{selected.name}</strong>
          {selected.linked ? (
            <p className="vtt-linked-badge">
              Ficha linkada
              {onOpenSheet ? (
                <>
                  {" "}
                  ·{" "}
                  <button
                    type="button"
                    className="vtt-inline-link"
                    onClick={() => onOpenSheet(selected.actorId ?? "pc-aventureiro")}
                  >
                    Abrir ficha →
                  </button>
                </>
              ) : null}
            </p>
          ) : selected.monsterEntryId ? (
            <p className="vtt-linked-badge">Monstro · {selected.monsterEntryId}</p>
          ) : null}
          {selected.vidaMax != null ? (
            <p>
              Vida {selected.vida}/{selected.vidaMax}
            </p>
          ) : null}
          {selected.defesa != null ? (
            <p>
              Defesa {selected.defesa}
              {selected.defesaBonus ? ` (+${selected.defesaBonus} buff)` : ""}
            </p>
          ) : null}
          <TokenEffectsRow token={selected} variant="full" className="vtt-effect-chips--sidebar" />
          {canViewTokenPa(selected) ? (
            <PaDotMeter
              current={selected.pa}
              max={selected.paMax}
              banked={selected.bankedPa}
              spentThisTurn={selected.paSpentThisTurn}
            />
          ) : (
            <p className="vtt-combat-hint">PA do monstro — só o mestre vê.</p>
          )}

          {canUseToken && combat?.order.length ? (
            <p className="vtt-combat-hint vtt-action-ring-hint">
              {selected.id === activeTokenId(combat)
                ? "Clique direito no personagem ou hex dele para o anel de ações. Passe o mouse para ver o alcance."
                : "Aguarde seu turno na iniciativa (painel ⏱)."}
            </p>
          ) : canUseToken ? (
            <p className="vtt-combat-hint">Inicie o combate (rolar iniciativa) para usar ações.</p>
          ) : (
            <p className="vtt-combat-hint">Token sem stats de combate.</p>
          )}
          {actionMode !== "idle" ? (
            <p className="vtt-combat-hint">
              Modo: <strong>{ACTION_MODE_LABEL[actionMode]}</strong> — use o mapa ou Esc para cancelar.
            </p>
          ) : null}
          {actionErr ? <p className="dice-err">{actionErr}</p> : null}

          {canApplyConditions ? (
            <TokenConditionsPanel
              roomId={roomId}
              token={selected}
              canEdit
              onUpdate={onUpdate}
            />
          ) : null}
        </div>
      ) : (
        <p className="vtt-combat-hint">Selecione um personagem na lista ou no mapa.</p>
      )}

      {tokens.length === 0 ? (
        <p className="vtt-combat-hint">Nenhum personagem visível no momento.</p>
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
