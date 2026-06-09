"use client";

import Link from "next/link";

import { CharacterSheet } from "@/components/character/CharacterSheet";

import { getCharacter } from "@/lib/character/demo-characters";

import { canEditRoomActor } from "@/lib/auth/room-access";
import { canEditRoomActorPortrait } from "@/lib/auth/portrait-access";

import type { CompendiumEntry, CompendiumPackId } from "@/lib/compendium/types";

import type { SessionUser } from "@/lib/auth/types";

import type { FoundryWindowLayout } from "@/hooks/vtt/useFoundryWindows";
import { useFoundryWindowDrag } from "@/hooks/vtt/useFoundryWindowDrag";

import type { RoomActor } from "@/lib/room/types";

import { isAdventureBoundCharacter } from "@/lib/character/adventure-bind";
import { FoundryWindow } from "@/components/vtt/foundry/FoundryWindow";

import "@/components/character/sheet-popup.css";

type Props = {
  actorId: string;
  roomId: string;
  adventureId: string;
  roomOwnerId: string;
  actors: Record<string, RoomActor>;
  session: SessionUser | null;
  compendium: Record<CompendiumPackId, CompendiumEntry[]>;
  layout: FoundryWindowLayout;
  onLayoutChange: (patch: Partial<FoundryWindowLayout>) => void;
  onFocus: () => void;
  onMinimize: () => void;
  onClose: () => void;
};

export function CharacterSheetPopup({
  actorId,
  roomId,
  adventureId,
  roomOwnerId,
  actors,
  session,
  compendium,
  layout,
  onLayoutChange,
  onFocus,
  onMinimize,
  onClose,
}: Props) {
  const live = actors[actorId];
  const seed = live ?? getCharacter(actorId);
  const toolbarDrag = useFoundryWindowDrag(layout, onLayoutChange, onFocus);

  if (!seed) {
    return (
      <FoundryWindow
        title="Ficha"
        layout={{ ...layout, open: true }}
        onLayoutChange={onLayoutChange}
        onClose={onClose}
        onMinimize={onMinimize}
        onFocus={onFocus}
        className="foundry-window--character"
        chromeless
      >
        <p style={{ padding: "1rem" }}>Personagem não encontrado.</p>
      </FoundryWindow>
    );
  }

  const merged = { ...seed, ...live };
  const roomCtx = { roomId, adventureId, ownerId: roomOwnerId };
  const isOwner = session?.id === merged.ownerId;
  const campaignBound = isAdventureBoundCharacter(merged);
  const canEdit = canEditRoomActor(roomCtx, merged, session);
  const canEditPortrait = canEditRoomActorPortrait(roomCtx, merged, session);
  const showEditRequest = isOwner && campaignBound && !canEdit;

  const inventory = live?.inventory ?? seed.inventory ?? [];
  const sheetCharacter = {
    ...seed,
    ...live,
    adventureId: live?.adventureId ?? seed.adventureId ?? adventureId,
    inventory,
    combatLoadout: live?.combatLoadout ?? seed.combatLoadout ?? null,
    armorLoadout: live?.armorLoadout ?? seed.armorLoadout ?? null,
  };

  const toolbarTrailing = (
    <>
      <Link
        href={`/personagem/${actorId}`}
        className="sheet-ddb-toolbar__btn"
        title="Abrir ficha em página inteira"
        aria-label="Abrir em nova página"
        onPointerDown={(e) => e.stopPropagation()}
      >
        ↗
      </Link>
      <button
        type="button"
        className="sheet-ddb-toolbar__btn"
        onClick={onMinimize}
        aria-label="Recolher ficha"
        title="Recolher"
        onPointerDown={(e) => e.stopPropagation()}
      >
        −
      </button>
      <button
        type="button"
        className="sheet-ddb-toolbar__btn sheet-ddb-toolbar__btn--close"
        onClick={onClose}
        aria-label="Fechar ficha"
        title="Fechar"
        onPointerDown={(e) => e.stopPropagation()}
      >
        ✕
      </button>
    </>
  );

  return (
    <FoundryWindow
      title={seed.name}
      layout={layout}
      onLayoutChange={onLayoutChange}
      onClose={onClose}
      onMinimize={onMinimize}
      onFocus={onFocus}
      className="foundry-window--character foundry-window--character-sheet"
      minWidth={680}
      minHeight={400}
      chromeless
    >
      <div className="foundry-sheet-body foundry-sheet-body--ddb">
        <CharacterSheet
          character={sheetCharacter}
          canEdit={canEdit}
          canEditPortrait={canEditPortrait}
          compendium={compendium}
          roomId={roomId}
          variant="popup"
          showEditRequest={showEditRequest}
          popupToolbarTrailing={toolbarTrailing}
          popupToolbarDrag={toolbarDrag}
        />
      </div>
    </FoundryWindow>
  );
}
