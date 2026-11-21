"use client";

import { useState } from "react";
import type { BattleScene, BattleToken } from "@/lib/vtt/types";
import type { Axial } from "@/lib/vtt/grid-math";
import type { RoomSnapshot } from "@/lib/room/types";
import type { RoomApiPayload } from "@/hooks/useRoomSync";
import { GmActionHistoryPanel } from "@/components/vtt/GmActionHistoryPanel";
import { GmCombatLogPanel } from "@/components/vtt/GmCombatLogPanel";
import { GmActorProgressPanel } from "@/components/vtt/GmActorProgressPanel";
import { GmCreationsPanel } from "@/components/vtt/GmCreationsPanel";
import { GmSavingThrowPanel } from "@/components/vtt/GmSavingThrowPanel";
import { CulinaryMealPanel } from "@/components/vtt/CulinaryMealPanel";
import { RoomSettingsPanel } from "@/components/vtt/RoomSettingsPanel";
import type { RpgSystemId } from "@/lib/rpg/systems";
import type { CombatUndoEntry } from "@/lib/room/types";
import {
  IconHome,
  IconPot,
  IconSkull,
  IconSword,
  IconUsers,
} from "@/components/ui/EldarinIcons";
import type { ReactNode } from "react";
import "./gm-tools.css";

type GmTab = "sala" | "jogadores" | "culinaria" | "criaturas" | "combate";

type Props = {
  roomId: string;
  scene: BattleScene;
  tokens: BattleToken[];
  snapshot: RoomSnapshot;
  inviteCode?: string | null;
  roomActors: RoomSnapshot["actors"];
  spawnAxial: Axial | null;
  combatUndo?: CombatUndoEntry[];
  combatLog?: RoomSnapshot["combatLog"];
  onSceneUpdated: (payload: RoomApiPayload) => void;
  onRefresh?: () => void;
  /** Sistema da mesa. No Um Anel o menu mostra so a aba Sala, sem regras do Eldarin. */
  rpgSystemId?: RpgSystemId;
};

const TABS: { id: GmTab; label: string; hint: string; icon: ReactNode }[] = [
  { id: "sala", label: "Sala", hint: "Nome, visibilidade e convite", icon: <IconHome size={17} /> },
  { id: "jogadores", label: "Jogadores", hint: "XP, vida e salvaguardas", icon: <IconUsers size={17} /> },
  { id: "culinaria", label: "Culinária", hint: "Prato estruturado e assimilação", icon: <IconPot size={17} /> },
  { id: "criaturas", label: "Criaturas", hint: "Templates do mestre", icon: <IconSkull size={17} /> },
  { id: "combate", label: "Combate", hint: "Histórico de PA e desfazer ações", icon: <IconSword size={17} /> },
];

/** Abas que o Um Anel nao mostra: sao do Eldarin (XP, vida e salvaguardas, culinaria, PA dos monstros e historico de PA). */
const UM_ANEL_HIDDEN_TABS: ReadonlySet<GmTab> = new Set<GmTab>(["jogadores", "culinaria", "criaturas", "combate"]);

/** Ferramentas do mestre — menu em abas. */
export function GmToolsPanel({
  roomId,
  scene,
  tokens,
  snapshot,
  inviteCode = null,
  roomActors,
  spawnAxial,
  combatUndo = [],
  combatLog = [],
  onSceneUpdated,
  onRefresh,
  rpgSystemId = "eldarin",
}: Props) {
  const isUmAnel = rpgSystemId === "um-anel";
  const visibleTabs = isUmAnel ? TABS.filter((t) => !UM_ANEL_HIDDEN_TABS.has(t.id)) : TABS;
  const [requestedTab, setTab] = useState<GmTab>("jogadores");
  const tab = visibleTabs.some((t) => t.id === requestedTab) ? requestedTab : visibleTabs[0].id;
  const active = visibleTabs.find((t) => t.id === tab) ?? visibleTabs[0];

  return (
    <aside className="vtt-sidebar vtt-sidebar--gm vtt-gm-tools">
      <header className="vtt-gm-tools__head">
        <p className="vtt-eyebrow">Menu do mestre</p>
        <p className="vtt-sync-live">
          <span className="vtt-sync-dot" aria-hidden />
          Sync · rev {snapshot.revision}
        </p>
        <h2 className="vtt-title vtt-gm-tools__title">{scene.name}</h2>
      </header>

      <nav className="vtt-gm-tools__nav" aria-label="Seções do mestre">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`vtt-gm-tools__tab${tab === t.id ? " is-active" : ""}`}
            aria-current={tab === t.id ? "page" : undefined}
            onClick={() => setTab(t.id)}
          >
            <span className="vtt-gm-tools__tab-icon" aria-hidden>
              {t.icon}
            </span>
            <span className="vtt-gm-tools__tab-label">{t.label}</span>
          </button>
        ))}
      </nav>

      <p className="vtt-gm-tools__tab-hint">{active.hint}</p>

      <div className="vtt-gm-tools__body">
        {tab === "sala" ? (
          <>
            <p className="vtt-hint vtt-gm-tools__short-hint">
              <strong>Delete</strong> pede confirmação para remover o token selecionado. Ctrl+clique revela névoa. Alt+clique
              envia ping.
            </p>
            <RoomSettingsPanel
              roomId={roomId}
              roomName={scene.name}
              settings={snapshot.settings}
              rpgSystemId={rpgSystemId}
              onUpdated={onSceneUpdated}
            />
          </>
        ) : null}

        {tab === "jogadores" ? (
          <>
            <GmSavingThrowPanel
              roomId={roomId}
              inviteCode={inviteCode}
              tokens={tokens}
              roomActors={roomActors}
              onUpdated={onSceneUpdated}
              onRefresh={onRefresh}
            />
            <GmActorProgressPanel
              roomId={roomId}
              roomActors={roomActors}
              onUpdated={onSceneUpdated}
            />
          </>
        ) : null}

        {tab === "culinaria" ? (
          <CulinaryMealPanel
            roomId={roomId}
            roomActors={roomActors}
            onUpdated={onSceneUpdated}
          />
        ) : null}

        {tab === "criaturas" ? (
          <GmCreationsPanel
            roomId={roomId}
            creations={snapshot.gmCreations ?? snapshot.settings.gmCreations ?? {}}
            roomActors={roomActors}
            spawnAxial={spawnAxial}
            onUpdated={onSceneUpdated}
          />
        ) : null}

        {tab === "combate" ? (
          <>
            <GmCombatLogPanel
              combatLog={combatLog}
              tokens={tokens}
              combat={snapshot.combat}
            />
            <GmActionHistoryPanel
              roomId={roomId}
              combatUndo={combatUndo}
              onUpdated={onSceneUpdated}
            />
          </>
        ) : null}
      </div>
    </aside>
  );
}
