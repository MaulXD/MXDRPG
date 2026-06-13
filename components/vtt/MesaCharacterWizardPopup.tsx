"use client";

import { CharacterCreationWizard } from "@/components/character/wizard/CharacterCreationWizard";
import { FoundryWindow } from "@/components/vtt/foundry/FoundryWindow";
import type { FoundryWindowLayout } from "@/hooks/vtt/useFoundryWindows";

type Props = {
  adventureId: string;
  adventureName: string;
  roomId: string;
  slotsLeft: number;
  layout: FoundryWindowLayout;
  onLayoutChange: (patch: Partial<FoundryWindowLayout>) => void;
  onFocus: () => void;
  onMinimize: () => void;
  onClose: () => void;
  onCreated: (result: { characterId: string; name?: string }) => void;
};

export function MesaCharacterWizardPopup({
  adventureId,
  adventureName,
  roomId,
  slotsLeft,
  layout,
  onLayoutChange,
  onFocus,
  onMinimize,
  onClose,
  onCreated,
}: Props) {
  return (
    <FoundryWindow
      title="Novo personagem"
      layout={{ ...layout, open: true }}
      onLayoutChange={onLayoutChange}
      onClose={onClose}
      onMinimize={onMinimize}
      onFocus={onFocus}
      className="foundry-window--create-character"
      minWidth={640}
      minHeight={420}
    >
      <div className="mesa-panel-scroll mesa-panel-scroll--rail mesa-char-wizard-scroll">
        <CharacterCreationWizard
          variant="mesa"
          slotsLeft={slotsLeft}
          adventureId={adventureId}
          adventureName={adventureName}
          roomId={roomId}
          onCreated={onCreated}
        />
      </div>
    </FoundryWindow>
  );
}
