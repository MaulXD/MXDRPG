"use client";

import { useState } from "react";
import { IconScroll, IconSword } from "@/components/ui/EldarinIcons";
import { useVttToast } from "@/components/vtt/VttToast";
import { postGmCombatAction } from "@/hooks/useRoomSync";
import type { RoomSnapshot } from "@/lib/room/types";

type Props = {
  roomId: string;
  combatActive: boolean;
  onUpdated: (snapshot: RoomSnapshot) => void;
};

export function GmMesaModeToggle({ roomId, combatActive, onUpdated }: Props) {
  const [busy, setBusy] = useState(false);
  const toast = useVttToast();

  async function setMode(active: boolean) {
    if (busy || active === combatActive) return;
    setBusy(true);
    try {
      const snapshot = await postGmCombatAction(roomId, {
        action: "set-combat-mode",
        active,
      });
      onUpdated(snapshot);
    } catch (e) {
      toast.push(
        e instanceof Error ? e.message : "Não foi possível alterar o modo da mesa",
        "warn"
      );
    } finally {
      setBusy(false);
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
        className={`gm-mesa-mode-toggle__option${!combatActive ? " gm-mesa-mode-toggle__option--active" : ""}`}
        aria-pressed={!combatActive}
        disabled={busy}
        title="Exploração livre: movimento sem PA, magias sem custo de turno"
        onClick={() => void setMode(false)}
      >
        <IconScroll size={15} />
        <span>Aventura</span>
      </button>
      <button
        type="button"
        className={`gm-mesa-mode-toggle__option${combatActive ? " gm-mesa-mode-toggle__option--active" : ""}`}
        aria-pressed={combatActive}
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
