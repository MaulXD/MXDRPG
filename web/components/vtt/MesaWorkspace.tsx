"use client";

import { useCallback, useState } from "react";
import type { SessionUser } from "@/lib/auth/types";
import type { CompendiumEntry, CompendiumPackId, CompendiumPackMeta } from "@/lib/compendium/types";
import type { BattleScene } from "@/lib/vtt/types";
import { useRoomSync } from "@/hooks/useRoomSync";
import { HexBattlefield } from "@/components/vtt/HexBattlefield";
import { MesaDrawer } from "@/components/vtt/MesaDrawer";
import { MesaSheetPanel } from "@/components/vtt/MesaSheetPanel";
import { MesaCompendiumPanel } from "@/components/vtt/MesaCompendiumPanel";
import { RoomChat } from "@/components/vtt/RoomChat";
import { DiceRoller } from "@/components/vtt/DiceRoller";

type Drawer = "sheet" | "compendium" | null;

type Props = {
  roomId: string;
  scene: BattleScene;
  canEdit: boolean;
  canControlCombat: boolean;
  session: SessionUser | null;
  compendium: Record<CompendiumPackId, CompendiumEntry[]>;
  packs: CompendiumPackMeta[];
  defaultActorId?: string;
};

export function MesaWorkspace({
  roomId,
  scene,
  canEdit,
  canControlCombat,
  session,
  compendium,
  packs,
  defaultActorId = "pc-aventureiro",
}: Props) {
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [sheetActorId, setSheetActorId] = useState(defaultActorId);
  const { snapshot, refresh } = useRoomSync(roomId);

  const openSheet = useCallback(
    (actorId?: string) => {
      setSheetActorId(actorId ?? defaultActorId);
      setDrawer("sheet");
    },
    [defaultActorId]
  );

  const chat = snapshot?.chat ?? [];

  return (
    <div className="mesa-workspace">
      <div className="mesa-main">
        <HexBattlefield
          scene={scene}
          canEdit={canEdit}
          canControlCombat={canControlCombat}
          roomId={roomId}
          onOpenSheet={openSheet}
          onOpenCompendium={() => setDrawer("compendium")}
        />

        <MesaDrawer
          open={drawer === "sheet"}
          title="Ficha de personagem"
          wide
          onClose={() => setDrawer(null)}
        >
          <MesaSheetPanel
            actorId={sheetActorId}
            roomId={roomId}
            actors={snapshot?.actors ?? {}}
            session={session}
            compendium={compendium}
          />
        </MesaDrawer>

        <MesaDrawer
          open={drawer === "compendium"}
          title="Compêndios"
          wide
          onClose={() => setDrawer(null)}
        >
          <MesaCompendiumPanel
            packs={packs}
            data={compendium}
            role={session?.role ?? null}
          />
        </MesaDrawer>
      </div>

      <div className="mesa-dock">
        <RoomChat roomId={roomId} messages={chat} onUpdate={refresh} />
        <DiceRoller roomId={roomId} onUpdate={refresh} />
      </div>
    </div>
  );
}
