"use client";

import { useState } from "react";
import type { BattleScene, BattleToken } from "@/lib/vtt/types";
import type { Axial } from "@/lib/vtt/hex-math";
import type { RoomSnapshot } from "@/lib/room/types";
import { GmActionHistoryPanel } from "@/components/vtt/GmActionHistoryPanel";
import { GmActorProgressPanel } from "@/components/vtt/GmActorProgressPanel";
import { GmCreationsPanel } from "@/components/vtt/GmCreationsPanel";
import { GmSavingThrowPanel } from "@/components/vtt/GmSavingThrowPanel";
import { CulinaryMealPanel } from "@/components/vtt/CulinaryMealPanel";
import { RoomSettingsPanel } from "@/components/vtt/RoomSettingsPanel";
import type { CombatUndoEntry } from "@/lib/room/types";
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
  onSceneUpdated: (snap: RoomSnapshot) => void;
  onRefresh?: () => void;
};

const TABS: { id: GmTab; label: string; hint: string }[] = [
  { id: "sala", label: "Sala", hint: "Nome, visibilidade e convite" },
  { id: "jogadores", label: "Jogadores", hint: "XP, vida e salvaguardas" },
  { id: "culinaria", label: "Culinária", hint: "Prato estruturado e assimilação" },
  { id: "criaturas", label: "Criaturas", hint: "Templates do mestre" },
  { id: "combate", label: "Combate", hint: "Desfazer ações" },
];

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
  onSceneUpdated,
  onRefresh,
}: Props) {
  const [tab, setTab] = useState<GmTab>("jogadores");
  const active = TABS.find((t) => t.id === tab) ?? TABS[0];

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
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`vtt-gm-tools__tab${tab === t.id ? " is-active" : ""}`}
            aria-current={tab === t.id ? "page" : undefined}
            onClick={() => setTab(t.id)}
          >
            {t.label}
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
          <GmActionHistoryPanel
            roomId={roomId}
            combatUndo={combatUndo}
            onUpdated={onSceneUpdated}
          />
        ) : null}
      </div>
    </aside>
  );
}
