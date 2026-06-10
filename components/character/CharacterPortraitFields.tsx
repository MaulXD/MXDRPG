"use client";

import { useRouter } from "next/navigation";
import { PortraitEditorPanel } from "@/components/character/PortraitEditorPanel";
import type { PortraitFocus } from "@/lib/media/portrait-focus";

type Props = {
  characterId: string;
  portraitUrl?: string | null;
  portraitFocus?: PortraitFocus | null;
  coverFocus?: PortraitFocus | null;
  tokenFocus?: PortraitFocus | null;
  tokenImageUrl?: string | null;
  canEdit: boolean;
};

export function CharacterPortraitFields({
  characterId,
  portraitUrl,
  portraitFocus,
  coverFocus,
  tokenFocus,
  tokenImageUrl,
  canEdit,
}: Props) {
  const router = useRouter();

  async function patchCharacter(body: Record<string, unknown>) {
    const res = await fetch(`/api/characters/${characterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error ?? `Erro ${res.status}`);
    }
    router.refresh();
  }

  return (
    <PortraitEditorPanel
      portraitUrl={portraitUrl ?? null}
      tokenImageUrl={tokenImageUrl}
      portraitFocus={portraitFocus}
      coverFocus={coverFocus}
      tokenFocus={tokenFocus}
      canEdit={canEdit}
      onPersist={async (bundle) => {
        await patchCharacter({
          portraitUrl: bundle.portraitUrl,
          tokenImageUrl: bundle.tokenImageUrl,
          portraitFocus: bundle.portraitFocus,
          coverFocus: bundle.coverFocus,
          tokenFocus: bundle.tokenFocus,
        });
      }}
      onClear={async () => {
        await patchCharacter({
          portraitUrl: null,
          tokenImageUrl: null,
          portraitFocus: null,
          coverFocus: null,
          tokenFocus: null,
        });
      }}
    />
  );
}
