"use client";

import type { SessionUser } from "@/lib/auth/types";
import type { RpgSystemId } from "@/lib/rpg/systems";
import { VttHelpButton } from "@/components/vtt/VttHelpButton";
import { MesaGuidedTour } from "@/components/vtt/MesaGuidedTour";

type Props = {
  roomId: string;
  session: SessionUser | null;
  isRoomGm: boolean;
  watchOnly?: boolean;
  rpgSystemId?: RpgSystemId;
};

/** Ajuda (?) + tour — canto do mapa, ao lado da barra de ferramentas. */
export function VttMapGuideCluster({
  roomId,
  session,
  isRoomGm,
  watchOnly = false,
  rpgSystemId,
}: Props) {
  return (
    <div className="vtt-map-guide-cluster">
      <VttHelpButton rpgSystemId={rpgSystemId} />
      <MesaGuidedTour
        roomId={roomId}
        session={session}
        isRoomGm={isRoomGm}
        watchOnly={watchOnly}
        triggerVariant="map"
      />
    </div>
  );
}
