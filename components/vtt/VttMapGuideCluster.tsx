"use client";

import type { SessionUser } from "@/lib/auth/types";
import { VttHelpButton } from "@/components/vtt/VttHelpButton";
import { DemoGuidedTour } from "@/components/vtt/DemoGuidedTour";
import { MesaGuidedTour } from "@/components/vtt/MesaGuidedTour";

type Props = {
  roomId: string;
  session: SessionUser | null;
  isRoomGm: boolean;
  watchOnly?: boolean;
};

/** Ajuda (?) + tour — canto do mapa, ao lado da barra de ferramentas. */
export function VttMapGuideCluster({ roomId, session, isRoomGm, watchOnly = false }: Props) {
  return (
    <div className="vtt-map-guide-cluster">
      <VttHelpButton />
      <DemoGuidedTour
        roomId={roomId}
        session={session}
        isRoomGm={isRoomGm}
        triggerVariant="map"
      />
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
