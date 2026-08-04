"use client";

import dynamic from "next/dynamic";
import type { SessionUser } from "@/lib/auth/types";
import type { BattleScene } from "@/lib/vtt/types";
import type { Axial } from "@/lib/vtt/grid-math";
import type { RoomSnapshot } from "@/lib/room/types";
import type { FoundryWindowLayout, MesaWindowId } from "@/hooks/vtt/useFoundryWindows";
import { FoundryDockPanel } from "@/components/vtt/foundry/FoundryDockPanel";
import { MesaFoundrySidebar } from "@/components/vtt/foundry/MesaFoundrySidebar";
import { MesaRoomChatPanel } from "@/components/vtt/mesa/MesaRoomChatPanel";
import { PlayableCharactersPanel } from "@/components/vtt/PlayableCharactersPanel";
import { RoomInvitePanel } from "@/components/vtt/RoomInvitePanel";
import type { RpgSystemId } from "@/lib/rpg/systems";
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
const TorJourneyPanel = dynamic(
  () => import("@/components/vtt/TorJourneyPanel").then((m) => m.TorJourneyPanel),
  { ssr: false }
);

const TorCouncilPanel = dynamic(
  () => import("@/components/vtt/TorCouncilPanel").then((m) => m.TorCouncilPanel),
  { ssr: false }
);

const TorCompendiumPage = dynamic(
  () => import("@/components/compendium/TorCompendiumPage").then((m) => m.TorCompendiumPage),
  { ssr: false }
);
const TorPlayableCharactersPanel = dynamic(
  () => import("@/components/vtt/TorPlayableCharactersPanel").then((m) => m.TorPlayableCharactersPanel),
  { ssr: false }
);
const TorAdversaryPanel = dynamic(
  () => import("@/components/vtt/TorAdversaryPanel").then((m) => m.TorAdversaryPanel),
  { ssr: false }
);
import type { CombatChatRevealPhase } from "@/lib/combat/chat-display";

const DiceRoller = dynamic(
  () => import("@/components/vtt/DiceRoller").then((m) => m.DiceRoller),
  { ssr: false }
);

export type MesaFoundryDockRailProps = {
  roomId: string;
  adventureId: string;
  shareRoomId: string;
  roomOwnerId: string;
  memberIds: string[];
  roomName?: string;
  rpgSystemId?: RpgSystemId;
  fallbackScene: BattleScene;
  mapScene: BattleScene;
  mesaActors: RoomSnapshot["actors"];
  session: SessionUser | null;
  inviteCode?: string | null;
  roomInviteCode: string | null;
  showInviteUi: boolean;
  isRoomOwner: boolean;
  isActualGm: boolean;
  effectiveIsGm: boolean;
  effectiveCanControlCombat: boolean;
  canChat: boolean;
  canCreateCharacter: boolean;
  sheetPopupActorId: string | null;
  spawnAxial: Axial | null;
  combatChatReveal: Record<string, CombatChatRevealPhase>;
  dockOpen: boolean;
  isPanelActive: (id: MesaWindowId) => boolean;
  isFloating: (id: MesaWindowId) => boolean;
  win: (id: MesaWindowId) => FoundryWindowLayout;
  onOpenDock: (id: MesaWindowId) => void;
  onOpenPopup: (id: MesaWindowId) => void;
  onClosePanel: (id: MesaWindowId) => void;
  onMinimizePanel: (id: MesaWindowId) => void;
  onRestorePanel: (id: MesaWindowId) => void;
  onOpenSheet: (actorId?: string) => void;
  onOpenMonsterSheet: (entryId: string) => void;
  onOpenCharacterWizard?: () => void;
  onRefresh: () => Promise<void>;
  onApplySnapshot: (snap: RoomSnapshot, opts?: { force?: boolean }) => void;
};

/** Coluna dock Foundry (chat, ficha, invite, dados, spawn). */
export function MesaFoundryDockRail({
  roomId,
  adventureId,
  shareRoomId,
  roomOwnerId,
  memberIds,
  roomName,
  rpgSystemId = "eldarin",
  fallbackScene,
  mapScene,
  mesaActors,
  session,
  roomInviteCode,
  showInviteUi,
  isRoomOwner,
  isActualGm,
  effectiveIsGm,
  effectiveCanControlCombat,
  canChat,
  canCreateCharacter,
  sheetPopupActorId,
  spawnAxial,
  combatChatReveal,
  dockOpen,
  isPanelActive,
  isFloating,
  win,
  onOpenDock,
  onOpenPopup,
  onClosePanel,
  onMinimizePanel,
  onRestorePanel,
  onOpenSheet,
  onOpenMonsterSheet,
  onOpenCharacterWizard,
  onRefresh,
  onApplySnapshot,
}: MesaFoundryDockRailProps) {
  const panel = (id: MesaWindowId) => win(id);

  return (
    <MesaFoundrySidebar
      isActive={isPanelActive}
      onOpenDock={onOpenDock}
      onOpenPopup={onOpenPopup}
      showGm={effectiveCanControlCombat}
      showInvite={showInviteUi}
      showTorGmTools={rpgSystemId === "um-anel" && Boolean(effectiveIsGm)}
      dockOpen={dockOpen}
    >
      {!isFloating("chat") ? (
        <FoundryDockPanel
          title="Chat"
          open={panel("chat").open}
          minimized={panel("chat").minimized}
          className="foundry-dock-panel--chat"
          onClose={() => onClosePanel("chat")}
          onMinimize={() =>
            panel("chat").minimized ? onRestorePanel("chat") : onMinimizePanel("chat")
          }
        >
          <MesaRoomChatPanel
            roomId={roomId}
            tokens={mapScene.tokens}
            combatReveal={combatChatReveal}
            readOnly={!canChat}
          />
        </FoundryDockPanel>
      ) : null}

      {!isFloating("ficha") ? (
        <FoundryDockPanel
          title="Personagens jogáveis"
          open={panel("ficha").open}
          minimized={panel("ficha").minimized}
          className="foundry-dock-panel--ficha"
          onClose={() => onClosePanel("ficha")}
          onMinimize={() =>
            panel("ficha").minimized ? onRestorePanel("ficha") : onMinimizePanel("ficha")
          }
        >
          <div className="mesa-panel-scroll mesa-panel-scroll--rail">
            {rpgSystemId === "um-anel" ? (
              <TorPlayableCharactersPanel
                adventureId={adventureId}
                roomId={roomId}
                spawnAxial={spawnAxial}
                onOpenSheet={onOpenSheet}
                onPlaced={onApplySnapshot}
                canCreateCharacter={canCreateCharacter}
                onCreateCharacter={canCreateCharacter ? onOpenCharacterWizard : undefined}
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
        </FoundryDockPanel>
      ) : null}

      {showInviteUi && !isFloating("invite") ? (
        <FoundryDockPanel
          title="Compartilhar mesa"
          open={panel("invite").open}
          minimized={panel("invite").minimized}
          className="foundry-dock-panel--invite"
          onClose={() => onClosePanel("invite")}
          onMinimize={() =>
            panel("invite").minimized ? onRestorePanel("invite") : onMinimizePanel("invite")
          }
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
        </FoundryDockPanel>
      ) : null}

      {!isFloating("dice") ? (
        <FoundryDockPanel
          title="Rolador de dados"
          open={panel("dice").open}
          minimized={panel("dice").minimized}
          className="foundry-dock-panel--dice"
          onClose={() => onClosePanel("dice")}
          onMinimize={() =>
            panel("dice").minimized ? onRestorePanel("dice") : onMinimizePanel("dice")
          }
        >
          {canChat ? (
            <DiceRoller roomId={roomId} onUpdate={onRefresh} />
          ) : (
            <p className="vtt-combat-hint" style={{ padding: "1rem" }}>
              Visitantes não rolam dados no chat.
            </p>
          )}
        </FoundryDockPanel>
      ) : null}

      {isActualGm && !isFloating("spawn") ? (
        <FoundryDockPanel
          title="Invocar"
          open={panel("spawn").open}
          minimized={panel("spawn").minimized}
          className="foundry-dock-panel--spawn"
          onClose={() => onClosePanel("spawn")}
          onMinimize={() =>
            panel("spawn").minimized ? onRestorePanel("spawn") : onMinimizePanel("spawn")
          }
        >
          <div className="mesa-panel-scroll mesa-panel-scroll--rail">
            {rpgSystemId === "um-anel" ? (
              <TorAdversaryPanel
                roomId={roomId}
                spawnAxial={spawnAxial}
                onPlaced={(snap) => onApplySnapshot(snap)}
              />
            ) : (
              <MonsterSpawnPanel
                roomId={roomId}
                scene={mapScene}
                spawnAxial={spawnAxial}
                onSpawned={(snap) => onApplySnapshot(snap)}
                onOpenMonsterSheet={onOpenMonsterSheet}
              />
            )}
          </div>
        </FoundryDockPanel>
      ) : null}

      {rpgSystemId === "um-anel" && !isFloating("torJourney") ? (
        <FoundryDockPanel
          title="Jornada"
          open={panel("torJourney").open}
          minimized={panel("torJourney").minimized}
          className="foundry-dock-panel--tor-journey"
          onClose={() => onClosePanel("torJourney")}
          onMinimize={() =>
            panel("torJourney").minimized
              ? onRestorePanel("torJourney")
              : onMinimizePanel("torJourney")
          }
        >
          <div className="mesa-panel-scroll mesa-panel-scroll--rail">
            <TorJourneyPanel
              roomId={roomId}
              canManage={Boolean(effectiveIsGm)}
              onUpdate={() => void onRefresh()}
            />
          </div>
        </FoundryDockPanel>
      ) : null}

      {rpgSystemId === "um-anel" && !isFloating("torCouncil") ? (
        <FoundryDockPanel
          title="Conselho"
          open={panel("torCouncil").open}
          minimized={panel("torCouncil").minimized}
          className="foundry-dock-panel--tor-council"
          onClose={() => onClosePanel("torCouncil")}
          onMinimize={() =>
            panel("torCouncil").minimized
              ? onRestorePanel("torCouncil")
              : onMinimizePanel("torCouncil")
          }
        >
          <div className="mesa-panel-scroll mesa-panel-scroll--rail">
            <TorCouncilPanel
              roomId={roomId}
              canManage={Boolean(effectiveIsGm)}
              onUpdate={() => void onRefresh()}
            />
          </div>
        </FoundryDockPanel>
      ) : null}

      {!isFloating("compendium") ? (
        <FoundryDockPanel
          title="Compêndio"
          open={panel("compendium").open}
          minimized={panel("compendium").minimized}
          className="foundry-dock-panel--compendium"
          onClose={() => onClosePanel("compendium")}
          onMinimize={() =>
            panel("compendium").minimized ? onRestorePanel("compendium") : onMinimizePanel("compendium")
          }
        >
          <div className="mesa-panel-scroll mesa-panel-scroll--rail">
            {rpgSystemId === "um-anel" ? (
              <TorCompendiumPage />
            ) : (
              <MesaEldarinCompendiumPanel roomId={roomId} />
            )}
          </div>
        </FoundryDockPanel>
      ) : null}
    </MesaFoundrySidebar>
  );
}
