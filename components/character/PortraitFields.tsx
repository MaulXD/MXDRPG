"use client";

import { patchRoomActor } from "@/hooks/useRoomSync";
import { PortraitEditorPanel } from "@/components/character/PortraitEditorPanel";
import type { PortraitFocus } from "@/lib/media/portrait-focus";
import { playerColorForActor } from "@/lib/vtt/token-colors";

type Props = {
  roomId: string;
  actorId: string;
  portraitUrl?: string | null;
  portraitFocus?: PortraitFocus | null;
  coverFocus?: PortraitFocus | null;
  tokenFocus?: PortraitFocus | null;
  tokenImageUrl?: string | null;
  canEdit: boolean;
  onSaved: () => void;
};

export function PortraitFields({
  roomId,
  actorId,
  portraitUrl,
  portraitFocus,
  coverFocus,
  tokenFocus,
  tokenImageUrl,
  canEdit,
  onSaved,
}: Props) {
  const ringColor = playerColorForActor(actorId, [actorId]);

  return (
    <PortraitEditorPanel
      portraitUrl={portraitUrl ?? null}
      tokenImageUrl={tokenImageUrl}
      portraitFocus={portraitFocus}
      coverFocus={coverFocus}
      tokenFocus={tokenFocus}
      canEdit={canEdit}
      tokenRingColor={ringColor}
      onPersist={async (bundle) => {
        await patchRoomActor(roomId, actorId, {
          portraitUrl: bundle.portraitUrl,
          tokenImageUrl: bundle.tokenImageUrl,
          portraitFocus: bundle.portraitFocus,
          coverFocus: bundle.coverFocus,
          tokenFocus: bundle.tokenFocus,
        });
        onSaved();
      }}
      onClear={async () => {
        await patchRoomActor(roomId, actorId, {
          portraitUrl: null,
          tokenImageUrl: null,
          portraitFocus: null,
          coverFocus: null,
          tokenFocus: null,
        });
        onSaved();
      }}
    />
  );
}
