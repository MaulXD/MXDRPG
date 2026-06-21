"use client";

import { IconScroll, IconSword } from "@/components/ui/EldarinIcons";
import { useVttToast } from "@/components/vtt/VttToast";
import type { RoomApiPayload } from "@/hooks/useRoomSync";
import { useCombatModeToggle } from "@/hooks/vtt/useCombatModeToggle";
import { normalizeRoomSettings } from "@/lib/room/settings";
import type { RoomSnapshot } from "@/lib/room/types";

type Props = {
  roomId: string;
  snapshot: RoomSnapshot | null | undefined;
  combatActive: boolean;
  onApplyUpdate: (payload: RoomApiPayload, opts?: { force?: boolean; immediate?: boolean }) => void;
};

export function GmMesaModeToggle({ roomId, snapshot, combatActive, onApplyUpdate }: Props) {
  const toast = useVttToast();
  const { setCombatMode, busy } = useCombatModeToggle(roomId, snapshot, onApplyUpdate);
  const resolvedCombatActive = snapshot
    ? normalizeRoomSettings(snapshot.settings).combatActive
    : combatActive;

  async function setMode(active: boolean) {
    if (busy || active === resolvedCombatActive) return;
    try {
      await setCombatMode(active);
    } catch (e) {
      toast.push(
        e instanceof Error ? e.message : "Não foi possível alterar o modo da mesa",
        "warn"
      );
    }
  }

  return (
    <div
      className="gm-mesa-mode-toggle"
      role="group"
      aria-label="Modo da mesa"
      data-busy={busy ? "" : undefined}
    >
      <button
        type="button"
        className={`gm-mesa-mode-toggle__option${!resolvedCombatActive ? " gm-mesa-mode-toggle__option--active" : ""}`}
        aria-pressed={!resolvedCombatActive}
        disabled={busy}
        title="Exploração livre: movimento sem PA, magias sem custo de turno"
        onClick={() => void setMode(false)}
      >
        <IconScroll size={15} />
        <span>Aventura</span>
      </button>
      <button
        type="button"
        className={`gm-mesa-mode-toggle__option${resolvedCombatActive ? " gm-mesa-mode-toggle__option--active" : ""}`}
        aria-pressed={resolvedCombatActive}
        disabled={busy}
        title="Combate: PA, iniciativa e ações só na vez de cada token"
        onClick={() => void setMode(true)}
      >
        <IconSword size={15} />
        <span>Combate</span>
      </button>
    </div>
  );
}

type IndicatorProps = {
  combatActive: boolean;
};

/** Indicador somente leitura para jogadores. */
export function MesaModeIndicator({ combatActive }: IndicatorProps) {
  return (
    <span
      className={`mesa-mode-indicator${combatActive ? " mesa-mode-indicator--combat" : " mesa-mode-indicator--adventure"}`}
      title={
        combatActive
          ? "Modo combate — aguarde sua vez para mover e agir"
          : "Modo aventura — movimento e magias livres"
      }
    >
      {combatActive ? (
        <>
          <IconSword size={14} />
          <span>Combate</span>
        </>
      ) : (
        <>
          <IconScroll size={14} />
          <span>Aventura</span>
        </>
      )}
    </span>
  );
}
