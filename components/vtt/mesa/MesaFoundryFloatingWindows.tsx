"use client";

import dynamic from "next/dynamic";
import type { SessionUser } from "@/lib/auth/types";
import type { BattleScene } from "@/lib/vtt/types";
import type { Axial } from "@/lib/vtt/grid-math";
import type { RoomSnapshot } from "@/lib/room/types";
import type { RpgSystemId } from "@/lib/rpg/systems";
import type { FoundryWindowLayout, MesaWindowId } from "@/hooks/vtt/useFoundryWindows";
import type { RoomSyncBridge } from "@/hooks/useRoomSync";
import type { RoomActorPatchResult } from "@/lib/character/portrait-persist-client";
import type { CombatChatRevealPhase } from "@/lib/combat/chat-display";
import { FoundryWindow } from "@/components/vtt/foundry/FoundryWindow";
import { MesaRoomChatPanel } from "@/components/vtt/mesa/MesaRoomChatPanel";
import { PlayableCharactersPanel } from "@/components/vtt/PlayableCharactersPanel";
import { RoomInvitePanel } from "@/components/vtt/RoomInvitePanel";
const DiceRoller = dynamic(
  () => import("@/components/vtt/DiceRoller").then((m) => m.DiceRoller),
  { ssr: false }
);
const CharacterSheetPopup = dynamic(
  () => import("@/components/vtt/CharacterSheetPopup").then((m) => m.CharacterSheetPopup),
  { ssr: false }
);
const MonsterSheetPopup = dynamic(
  () => import("@/components/compendium/MonsterSheetPopup").then((m) => m.MonsterSheetPopup),
  { ssr: false }
);
// Wizard de criação de personagem dentro da mesa — fluxo raro (GM criando
// ficha na sala), mas arrastava ~2000 linhas (CharacterCreationWizard +
// subárvore wizard/*) pro bundle inicial de toda mesa.
const MesaCharacterWizardPopup = dynamic(
  () =>
    import("@/components/vtt/MesaCharacterWizardPopup").then(
      (m) => m.MesaCharacterWizardPopup
    ),
  { ssr: false }
);
// Ferramenta só do mestre, uso pouco frequente por sessão.
const MonsterSpawnPanel = dynamic(
  () => import("@/components/vtt/MonsterSpawnPanel").then((m) => m.MonsterSpawnPanel),
  { ssr: false }
);
// Compêndio — cada sistema tem o seu, carregado só quando o painel abre.
const MesaEldarinCompendiumPanel = dynamic(
  () => import("@/components/vtt/MesaEldarinCompendiumPanel").then((m) => m.MesaEldarinCompendiumPanel),
  { ssr: false }
);
const TorCompendiumPage = dynamic(
  () => import("@/components/compendium/TorCompendiumPage").then((m) => m.TorCompendiumPage),
  { ssr: false }
);
// Só carregado em mesas do sistema "O Um Anel" — nunca no bundle de mesas Eldarin.
const TorPlayableCharactersPanel = dynamic(
  () => import("@/components/vtt/TorPlayableCharactersPanel").then((m) => m.TorPlayableCharactersPanel),
  { ssr: false }
);
const TorCharacterSheetPopup = dynamic(
  () => import("@/components/vtt/TorCharacterSheetPopup").then((m) => m.TorCharacterSheetPopup),
  { ssr: false }
);

export type MesaFoundryFloatingWindowsProps = {
  roomId: string;
  adventureId: string;
  rpgSystemId?: RpgSystemId;
  shareRoomId: string;
  roomOwnerId: string;
  memberIds: string[];
  roomName?: string;
  adventureName?: string;
  mapScene: BattleScene;
  mapSnapshot: RoomSnapshot | null;
  mesaActors: RoomSnapshot["actors"];
  session: SessionUser | null;
  roomInviteCode: string | null;
  showInviteUi: boolean;
  isRoomOwner: boolean;
  isActualGm: boolean;
  effectiveIsGm: boolean;
  canChat: boolean;
  canCreateCharacter: boolean;
  characterSlotsLeft: number;
  sheetPopupActorId: string | null;
  monsterSheetEntryId: string | null;
  setMonsterSheetEntryId: (id: string) => void;
  characterWizardOpen: boolean;
  torSheetId?: string | null;
  onOpenTorSheet?: (characterId: string) => void;
  onCloseTorSheet?: () => void;
  spawnAxial: Axial | null;
  combatChatReveal: Record<string, CombatChatRevealPhase>;
  roomSyncBridge: RoomSyncBridge;
  isFloating: (id: MesaWindowId) => boolean;
  win: (id: MesaWindowId) => FoundryWindowLayout;
  onPatchWindow: (id: MesaWindowId, patch: Partial<FoundryWindowLayout>) => void;
  onFocusWindow: (id: MesaWindowId) => void;
  onCloseWindow: (id: MesaWindowId) => void;
  onRestoreWindow: (id: MesaWindowId) => void;
  onMinimizeWindow: (id: MesaWindowId) => void;
  onOpenSheet: (actorId?: string) => void;
  onCloseSheet: () => void;
  onOpenMonsterSheet: (entryId: string) => void;
  onCloseMonsterSheet: () => void;
  onOpenCharacterWizard?: () => void;
  onCloseCharacterWizard: () => void;
  onCharacterCreated: (result: { characterId: string }) => void;
  onRefresh: () => Promise<void>;
  onApplySnapshot: (snap: RoomSnapshot, opts?: { force?: boolean }) => void;
  onRoomPortraitPatch: (result: RoomActorPatchResult) => void;
};

export function MesaFoundryFloatingWindows(props: MesaFoundryFloatingWindowsProps) {
  const {
    roomId,
    adventureId,
    rpgSystemId = "eldarin",
    shareRoomId,
    roomOwnerId,
    memberIds,
    roomName,
    adventureName,
    mapScene,
    mapSnapshot,
    mesaActors,
    session,
    roomInviteCode,
    showInviteUi,
    isRoomOwner,
    isActualGm,
    effectiveIsGm,
    canChat,
    canCreateCharacter,
    characterSlotsLeft,
    sheetPopupActorId,
    monsterSheetEntryId,
    setMonsterSheetEntryId,
    characterWizardOpen,
    torSheetId = null,
    onOpenTorSheet,
    onCloseTorSheet,
    spawnAxial,
    combatChatReveal,
    roomSyncBridge,
    isFloating,
    win,
    onPatchWindow,
    onFocusWindow,
    onCloseWindow,
    onRestoreWindow,
    onMinimizeWindow,
    onOpenSheet,
    onCloseSheet,
    onOpenMonsterSheet,
    onCloseMonsterSheet,
    onOpenCharacterWizard,
    onCloseCharacterWizard,
    onCharacterCreated,
    onRefresh,
    onApplySnapshot,
    onRoomPortraitPatch,
  } = props;

  const panel = (id: MesaWindowId) => win(id);

  return (
    <>
      {isFloating("chat") ? (
        <FoundryWindow
          title="Chat"
          layout={panel("chat")}
          className="foundry-window--chat"
          onLayoutChange={(patch) => onPatchWindow("chat", patch)}
          onFocus={() => onFocusWindow("chat")}
          onMinimize={() =>
            panel("chat").minimized ? onRestoreWindow("chat") : onMinimizeWindow("chat")
          }
          onClose={() => onCloseWindow("chat")}
        >
          <MesaRoomChatPanel
            roomId={roomId}
            tokens={mapScene.tokens}
            combatReveal={combatChatReveal}
            readOnly={!canChat}
          />
        </FoundryWindow>
      ) : null}

      {isFloating("ficha") ? (
        <FoundryWindow
          title="Personagens jogáveis"
          layout={panel("ficha")}
          className="foundry-window--ficha"
          minHeight={280}
          onLayoutChange={(patch) => onPatchWindow("ficha", patch)}
          onFocus={() => onFocusWindow("ficha")}
          onMinimize={() =>
            panel("ficha").minimized ? onRestoreWindow("ficha") : onMinimizeWindow("ficha")
          }
          onClose={() => onCloseWindow("ficha")}
        >
          <div className="mesa-panel-scroll mesa-panel-scroll--rail">
            {rpgSystemId === "um-anel" ? (
              <TorPlayableCharactersPanel
                adventureId={adventureId}
                onOpenSheet={(id) => onOpenTorSheet?.(id)}
                roomId={roomId}
                spawnAxial={spawnAxial}
                onPlaced={onApplySnapshot}
                isRoomGm={effectiveIsGm}
              />
            ) : (
              <PlayableCharactersPanel
                roomId={roomId}
                adventureId={adventureId}
                actors={mesaActors}
                session={session}
                selectedActorId={sheetPopupActorId}
                canCreateCharacter={canCreateCharacter}
                isRoomGm={effectiveIsGm}
                roomOwnerId={roomOwnerId}
                memberIds={memberIds}
                tokens={mapScene.tokens}
                spawnAxial={spawnAxial}
                onOpenSheet={onOpenSheet}
                onCharactersChanged={onRefresh}
                onCreateCharacter={canCreateCharacter ? onOpenCharacterWizard : undefined}
                onPlaced={onApplySnapshot}
              />
            )}
          </div>
        </FoundryWindow>
      ) : null}

      {rpgSystemId === "um-anel" && torSheetId ? (
        <TorCharacterSheetPopup
          characterId={torSheetId}
          roomId={roomId}
          layout={panel("torFicha")}
          onLayoutChange={(patch) => onPatchWindow("torFicha", patch)}
          onFocus={() => onFocusWindow("torFicha")}
          onMinimize={() =>
            panel("torFicha").minimized ? onRestoreWindow("torFicha") : onMinimizeWindow("torFicha")
          }
          onClose={() => onCloseTorSheet?.()}
        />
      ) : null}

      {isFloating("dice") ? (
        <FoundryWindow
          title="Rolador de dados"
          layout={panel("dice")}
          className="foundry-window--dice"
          onLayoutChange={(patch) => onPatchWindow("dice", patch)}
          onFocus={() => onFocusWindow("dice")}
          onMinimize={() =>
            panel("dice").minimized ? onRestoreWindow("dice") : onMinimizeWindow("dice")
          }
          onClose={() => onCloseWindow("dice")}
        >
          {canChat ? (
            <DiceRoller roomId={roomId} onUpdate={onRefresh} />
          ) : (
            <p className="vtt-combat-hint" style={{ padding: "1rem" }}>
              Visitantes não rolam dados no chat.
            </p>
          )}
        </FoundryWindow>
      ) : null}

      {showInviteUi && isFloating("invite") ? (
        <FoundryWindow
          title="Compartilhar mesa"
          layout={panel("invite")}
          className="foundry-window--invite"
          minWidth={260}
          minHeight={260}
          onLayoutChange={(patch) => onPatchWindow("invite", patch)}
          onFocus={() => onFocusWindow("invite")}
          onMinimize={() =>
            panel("invite").minimized ? onRestoreWindow("invite") : onMinimizeWindow("invite")
          }
          onClose={() => onCloseWindow("invite")}
        >
          <div className="mesa-panel-scroll mesa-panel-scroll--invite">
            <RoomInvitePanel
              adventureId={adventureId}
              roomId={shareRoomId}
              inviteCode={roomInviteCode!}
              roomName={roomName ?? mapScene.name ?? "Mesa"}
              showConfigure={isRoomOwner}
            />
          </div>
        </FoundryWindow>
      ) : null}

      {isActualGm && isFloating("spawn") ? (
        <FoundryWindow
          title="Invocar monstros"
          layout={panel("spawn")}
          className="foundry-window--spawn"
          minHeight={200}
          onLayoutChange={(patch) => onPatchWindow("spawn", patch)}
          onFocus={() => onFocusWindow("spawn")}
          onMinimize={() =>
            panel("spawn").minimized ? onRestoreWindow("spawn") : onMinimizeWindow("spawn")
          }
          onClose={() => onCloseWindow("spawn")}
        >
          <div className="mesa-panel-scroll mesa-panel-scroll--rail">
            <MonsterSpawnPanel
              roomId={roomId}
              scene={mapScene}
              spawnAxial={spawnAxial}
              onSpawned={(snap) => onApplySnapshot(snap)}
              onOpenMonsterSheet={onOpenMonsterSheet}
            />
          </div>
        </FoundryWindow>
      ) : null}

      {isFloating("compendium") ? (
        <FoundryWindow
          title="Compêndio"
          layout={panel("compendium")}
          className="foundry-window--compendium"
          minWidth={420}
          minHeight={320}
          onLayoutChange={(patch) => onPatchWindow("compendium", patch)}
          onFocus={() => onFocusWindow("compendium")}
          onMinimize={() =>
            panel("compendium").minimized ? onRestoreWindow("compendium") : onMinimizeWindow("compendium")
          }
          onClose={() => onCloseWindow("compendium")}
        >
          <div className="mesa-panel-scroll mesa-panel-scroll--rail">
            {rpgSystemId === "um-anel" ? (
              <TorCompendiumPage />
            ) : (
              <MesaEldarinCompendiumPanel roomId={roomId} />
            )}
          </div>
        </FoundryWindow>
      ) : null}

      {monsterSheetEntryId ? (
        <MonsterSheetPopup
          entryId={monsterSheetEntryId}
          onEntryChange={setMonsterSheetEntryId}
          layout={panel("monsterSheet")}
          onLayoutChange={(patch) => onPatchWindow("monsterSheet", patch)}
          onFocus={() => onFocusWindow("monsterSheet")}
          onMinimize={() =>
            panel("monsterSheet").minimized
              ? onRestoreWindow("monsterSheet")
              : onMinimizeWindow("monsterSheet")
          }
          onClose={onCloseMonsterSheet}
        />
      ) : null}

      {sheetPopupActorId && mapSnapshot ? (
        <CharacterSheetPopup
          actorId={sheetPopupActorId}
          roomId={roomId}
          adventureId={adventureId}
          roomOwnerId={roomOwnerId}
          memberIds={memberIds}
          actors={mapSnapshot.actors}
          session={session}
          roomSync={roomSyncBridge}
          tokens={mapSnapshot.scene.tokens}
          spawnAxial={spawnAxial}
          isRoomGm={effectiveIsGm}
          layout={panel("character")}
          onLayoutChange={(patch) => onPatchWindow("character", patch)}
          onFocus={() => onFocusWindow("character")}
          onMinimize={() =>
            panel("character").minimized
              ? onRestoreWindow("character")
              : onMinimizeWindow("character")
          }
          onClose={onCloseSheet}
          onRoomPortraitPatch={onRoomPortraitPatch}
          onPlaced={onApplySnapshot}
        />
      ) : null}

      {characterWizardOpen && canCreateCharacter ? (
        <MesaCharacterWizardPopup
          adventureId={adventureId}
          adventureName={adventureName ?? roomName ?? "Aventura"}
          roomId={roomId}
          rpgSystemId={rpgSystemId}
          slotsLeft={characterSlotsLeft}
          layout={panel("createCharacter")}
          onLayoutChange={(patch) => onPatchWindow("createCharacter", patch)}
          onFocus={() => onFocusWindow("createCharacter")}
          onMinimize={() =>
            panel("createCharacter").minimized
              ? onRestoreWindow("createCharacter")
              : onMinimizeWindow("createCharacter")
          }
          onClose={onCloseCharacterWizard}
          onCreated={(result) => onCharacterCreated(result)}
        />
      ) : null}
    </>
  );
}
