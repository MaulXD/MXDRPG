"use client";

import { useRouter } from "next/navigation";
import { PortraitEditorPanel } from "@/components/character/PortraitEditorPanel";
import type { PortraitFocus } from "@/lib/media/portrait-focus";
import {
  clearPortraitOnCharacter,
  clearPortraitOnRoom,
  persistPortraitBundleToCharacter,
  persistPortraitBundleToRoom,
} from "@/lib/character/portrait-persist-client";
import { playerColorForActor } from "@/lib/vtt/token-colors";

type BaseProps = {
  portraitUrl?: string | null;
  portraitFocus?: PortraitFocus | null;
  coverFocus?: PortraitFocus | null;
  tokenFocus?: PortraitFocus | null;
  tokenImageUrl?: string | null;
  canEdit: boolean;
  onSaved?: () => void;
};

type Props = BaseProps &
  (
    | { mode: "room"; roomId: string; actorId: string }
    | { mode: "character"; characterId: string }
  );

/** Editor completo de retrato — mesa (room) ou ficha offline (character). */
export function PortraitEditorFields(props: Props) {
  const {
    portraitUrl,
    portraitFocus,
    coverFocus,
    tokenFocus,
    tokenImageUrl,
    canEdit,
    onSaved,
    mode,
  } = props;
  const router = useRouter();

  const colorKey = mode === "room" ? props.actorId : props.characterId;
  const ringColor = playerColorForActor(colorKey, [colorKey]);

  async function afterSave() {
    onSaved?.();
    if (mode === "character") {
      router.refresh();
    }
  }

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
        if (mode === "room") {
          await persistPortraitBundleToRoom(props.roomId, props.actorId, bundle);
        } else {
          await persistPortraitBundleToCharacter(props.characterId, bundle);
        }
        await afterSave();
      }}
      onClear={async () => {
        if (mode === "room") {
          await clearPortraitOnRoom(props.roomId, props.actorId);
        } else {
          await clearPortraitOnCharacter(props.characterId);
        }
        await afterSave();
      }}
    />
  );
}
