"use client";

import { useCallback, useEffect, useState } from "react";
import { FoundryWindow } from "@/components/vtt/foundry/FoundryWindow";
import { TorCharacterSheetView } from "@/components/character/sheet/TorCharacterSheetView";
import { postRoomChat } from "@/hooks/useRoomSync";
import type { FoundryWindowLayout } from "@/hooks/vtt/useFoundryWindows";
import type { TorFeatDieRollPayload } from "@/lib/character/um-anel/dice";
import type { TorCharacterSheet, TorResourcePatch } from "@/lib/character/um-anel/types";

type Props = {
  characterId: string | null;
  roomId: string;
  layout: FoundryWindowLayout;
  onLayoutChange: (patch: Partial<FoundryWindowLayout>) => void;
  onFocus: () => void;
  onMinimize: () => void;
  onClose: () => void;
};

export function TorCharacterSheetPopup({
  characterId,
  roomId,
  layout,
  onLayoutChange,
  onFocus,
  onMinimize,
  onClose,
}: Props) {
  const [character, setCharacter] = useState<TorCharacterSheet | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/tor-characters/${encodeURIComponent(id)}`, { credentials: "same-origin" });
      const data = (await res.json()) as { character?: TorCharacterSheet; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Falha ao carregar ficha");
      setCharacter(data.character ?? null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar ficha");
    }
  }, []);

  useEffect(() => {
    if (characterId) void load(characterId);
    else setCharacter(null);
  }, [characterId, load]);

  async function handleResourceChange(patch: TorResourcePatch) {
    if (!character) return;
    const prev = character;
    // Feedback otimista — reverte se o PATCH falhar.
    setCharacter((c) => (c ? applyOptimisticPatch(c, patch) : c));
    try {
      const res = await fetch(`/api/tor-characters/${encodeURIComponent(character.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(patch),
      });
      const data = (await res.json()) as { character?: TorCharacterSheet; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Falha ao salvar");
      if (data.character) setCharacter(data.character);
    } catch (e) {
      setCharacter(prev);
      setError(e instanceof Error ? e.message : "Falha ao salvar ajuste");
    }
  }

  function handleRoll(message: string, featDie?: TorFeatDieRollPayload) {
    void postRoomChat(roomId, { text: message, kind: "chat", torFeatDie: featDie });
  }

  if (!characterId) return null;

  return (
    <FoundryWindow
      title={character?.name ?? "Ficha do Um Anel"}
      layout={{ ...layout, open: true }}
      onLayoutChange={onLayoutChange}
      onClose={onClose}
      onMinimize={onMinimize}
      onFocus={onFocus}
      className="foundry-window--character"
      minWidth={420}
      minHeight={360}
    >
      <div className="mesa-panel-scroll mesa-panel-scroll--rail">
        {error ? <p className="sheet-inline-msg">{error}</p> : null}
        {character ? (
          <TorCharacterSheetView
            character={character}
            interactive
            canEditPortrait
            onRoll={handleRoll}
            onResourceChange={(patch) => void handleResourceChange(patch)}
          />
        ) : !error ? (
          <p className="vtt-combat-hint" style={{ padding: "1rem" }}>
            Carregando…
          </p>
        ) : null}
      </div>
    </FoundryWindow>
  );
}

function applyOptimisticPatch(c: TorCharacterSheet, patch: TorResourcePatch): TorCharacterSheet {
  return {
    ...c,
    endurance: {
      ...c.endurance,
      value: patch.enduranceValue !== undefined ? patch.enduranceValue : c.endurance.value,
    },
    hope: { ...c.hope, value: patch.hopeValue !== undefined ? patch.hopeValue : c.hope.value },
    shadow: patch.shadow !== undefined ? patch.shadow : c.shadow,
    fatigue: patch.fatigue !== undefined ? patch.fatigue : c.fatigue,
    treasure: patch.treasure !== undefined ? patch.treasure : c.treasure,
    conditions: { ...c.conditions, wounded: patch.wounded !== undefined ? patch.wounded : c.conditions.wounded },
  };
}
