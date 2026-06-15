"use client";

import Link from "next/link";
import { useMemo, useRef } from "react";

import { CharacterSheet } from "@/components/character/CharacterSheet";

import { getCharacter } from "@/lib/character/demo-characters";

import { canEditRoomActor, requiresInventoryGmApproval } from "@/lib/auth/room-access";
import { canEditRoomActorPortrait } from "@/lib/auth/portrait-access";

import type { CompendiumEntry, CompendiumPackId } from "@/lib/compendium/types";

import type { SessionUser } from "@/lib/auth/types";

import type { FoundryWindowLayout } from "@/hooks/vtt/useFoundryWindows";
import { useFoundryWindowDrag } from "@/hooks/vtt/useFoundryWindowDrag";

import type { RoomActor, RoomSnapshot } from "@/lib/room/types";
import type { RoomActorPatchResult } from "@/lib/character/portrait-persist-client";

import { isAdventureBoundCharacter } from "@/lib/character/adventure-bind";
import { FoundryWindow } from "@/components/vtt/foundry/FoundryWindow";
import type { Axial } from "@/lib/vtt/hex-math";
import { canDragActorToMap } from "@/lib/vtt/actor-board-spawn";
import { endActorSpawnDrag, startActorSpawnDrag } from "@/lib/vtt/actor-spawn-drag-ui";
import type { BattleToken } from "@/lib/vtt/types";

type Props = {
  actorId: string;
  roomId: string;
  adventureId: string;
  roomOwnerId: string;
  memberIds?: string[];
  actors: Record<string, RoomActor>;
  session: SessionUser | null;
  compendium: Record<CompendiumPackId, CompendiumEntry[]>;
  tokens?: BattleToken[];
  spawnAxial?: Axial | null;
  isRoomGm?: boolean;
  layout: FoundryWindowLayout;
  onLayoutChange: (patch: Partial<FoundryWindowLayout>) => void;
  onFocus: () => void;
  onMinimize: () => void;
  onClose: () => void;
  onRoomPortraitPatch?: (result: RoomActorPatchResult) => void;
  onPlaced?: (snapshot: RoomSnapshot) => void;
};

export function CharacterSheetPopup({
  actorId,
  roomId,
  adventureId,
  roomOwnerId,
  memberIds = [],
  actors,
  session,
  compendium,
  tokens = [],
  spawnAxial = null,
  isRoomGm = false,
  layout,
  onLayoutChange,
  onFocus,
  onMinimize,
  onClose,
  onRoomPortraitPatch,
  onPlaced: _onPlaced,
}: Props) {
  const live = actors[actorId];
  const seed = live ?? getCharacter(actorId);
  const toolbarDrag = useFoundryWindowDrag(layout, onLayoutChange, onFocus);
  const dragGhostRef = useRef<HTMLElement | null>(null);
  const roomCtx = useMemo(
    () => ({ roomId, adventureId, ownerId: roomOwnerId, memberIds: memberIds ?? [] }),
    [roomId, adventureId, roomOwnerId, memberIds]
  );

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
  const isOwner = session?.id === merged.ownerId;
  const campaignBound = isAdventureBoundCharacter(merged);
  const canEdit = canEditRoomActor(roomCtx, merged, session);
  const canEditPortrait = canEditRoomActorPortrait(roomCtx, merged, session);
  const showEditRequest = isOwner && campaignBound && !canEdit;
  const inventoryNeedsApproval = requiresInventoryGmApproval(roomCtx, merged, session);
  const inventoryEditMode = inventoryNeedsApproval
    ? "request"
    : canEdit
      ? "direct"
      : "readonly";

  const canDragToMap = canDragActorToMap(merged, tokens, roomCtx, session, isRoomGm);

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
      {canDragToMap ? (
        <button
          type="button"
          className="sheet-ddb-toolbar__btn sheet-ddb-toolbar__btn--drag"
          draggable
          title={
            spawnAxial
              ? `Arrastar para o mapa (q${spawnAxial.q}, r${spawnAxial.r})`
              : "Arrastar para o mapa"
          }
          aria-label="Arrastar personagem para o mapa"
          onPointerDown={(e) => e.stopPropagation()}
          onDragStart={(e) => {
            startActorSpawnDrag(e, actorId, merged.name, dragGhostRef);
          }}
          onDragEnd={() => endActorSpawnDrag(dragGhostRef)}
        >
          ⠿
        </button>
      ) : null}
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
      minWidth={720}
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
          inventoryEditMode={inventoryEditMode}
          popupToolbarTrailing={toolbarTrailing}
          popupToolbarDrag={toolbarDrag}
          onRoomPortraitPatch={onRoomPortraitPatch}
        />
      </div>
    </FoundryWindow>
  );
}
