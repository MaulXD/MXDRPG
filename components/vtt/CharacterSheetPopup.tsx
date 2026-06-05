"use client";



import Link from "next/link";

import { CharacterSheet } from "@/components/character/CharacterSheet";

import { getCharacter } from "@/lib/character/demo-characters";

import { canEditRoomActor } from "@/lib/auth/room-access";

import type { CompendiumEntry, CompendiumPackId } from "@/lib/compendium/types";

import type { SessionUser } from "@/lib/auth/types";

import type { FoundryWindowLayout } from "@/hooks/vtt/useFoundryWindows";

import type { RoomActor } from "@/lib/room/types";

import { FoundryWindow } from "@/components/vtt/foundry/FoundryWindow";

import "@/components/character/sheet-popup.css";



type Props = {

  actorId: string;

  roomId: string;

  adventureId: string;

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

      >

        <p style={{ padding: "1rem" }}>Personagem não encontrado.</p>

      </FoundryWindow>

    );

  }



  const merged = { ...seed, ...live };

  const canEdit = canEditRoomActor({ roomId, adventureId }, merged, session);

  const inventory = live?.inventory?.length ? live.inventory : seed.inventory;



  return (

    <FoundryWindow

      title={seed.name}

      layout={layout}

      onLayoutChange={onLayoutChange}

      onClose={onClose}

      onMinimize={onMinimize}

      onFocus={onFocus}

      className="foundry-window--character"

      minWidth={360}

      minHeight={280}

    >

      <div className="foundry-sheet-body">

        <div className="foundry-sheet-toolbar">

          <Link

            href={`/personagem/${actorId}`}

            className="foundry-window__btn"

            title="Abrir ficha em página inteira"

            aria-label="Abrir em nova página"

          >

            ↗

          </Link>

        </div>

        <CharacterSheet

          character={{ ...seed, ...live, inventory }}

          canEdit={canEdit}

          compendium={compendium}

          roomId={roomId}

          variant="popup"

        />

      </div>

    </FoundryWindow>

  );

}


