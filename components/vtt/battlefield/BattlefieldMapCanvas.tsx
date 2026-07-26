"use client";

import type { RefObject, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import type { MapToolMode } from "@/lib/vtt/map-toolbar";
import type { MapMarkupDurability } from "@/lib/vtt/types";
import type { WhiteboardTool } from "@/lib/vtt/map-markup";
import { MapToolbar } from "@/components/vtt/MapToolbar";
import { MapMarkupTextEditor } from "@/components/vtt/MapMarkupTextEditor";
import { VttHelpButton } from "@/components/vtt/VttHelpButton";
import { VttMapGuideCluster } from "@/components/vtt/VttMapGuideCluster";
import type { SessionUser } from "@/lib/auth/types";
import type { RpgSystemId } from "@/lib/rpg/systems";

type BattlefieldViewHandle = {
  view: { scale: number; panX: number; panY: number };
  isPanning: boolean;
  zoomPercent: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  onPointerDown: (e: ReactPointerEvent) => boolean;
  onPointerMove: (e: ReactPointerEvent) => boolean;
  endPan: (e: ReactPointerEvent) => boolean;
};

type MarkupDraft = { wx: number; wy: number } | null;

export type BattlefieldMapCanvasProps = {
  wrapRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  attackTargetCursor: boolean;
  spawnDragActive: boolean;
  battlefieldView: BattlefieldViewHandle;
  canvasWrapSize: { w: number; h: number };
  mapToolMode: MapToolMode;
  onMapToolModeChange: (mode: MapToolMode) => void;
  whiteboardTool: WhiteboardTool;
  onDrawToolChange: (tool: WhiteboardTool) => void;
  markupColor: string;
  markupWidth: number;
  markupDurability: MapMarkupDurability;
  onColorChange: (color: string) => void;
  onWidthChange: (width: number) => void;
  onDurabilityChange: (d: MapMarkupDurability) => void;
  canUseWhiteboard: boolean;
  canManageMarkups: boolean;
  canPing: boolean;
  showFogTool: boolean;
  onClearSession?: () => void;
  onClearPermanent?: () => void;
  onClearAll?: () => void;
  showDungeonEditor: boolean;
  dungeonEditorActive: boolean;
  onToggleDungeonEditor: () => void;
  spawnDropHandlers: Record<string, unknown>;
  pointerHandlers: {
    onPointerDown: (e: ReactPointerEvent<HTMLCanvasElement>) => void;
    onPointerMove: (e: ReactPointerEvent<HTMLCanvasElement>) => void;
    onPointerUp: (e: ReactPointerEvent<HTMLCanvasElement>) => void;
    onPointerLeave: () => void;
    onContextMenu: (e: ReactPointerEvent<HTMLCanvasElement>) => void;
  };
  markupTextDraft: MarkupDraft;
  onMarkupTextCommit: (text: string) => void;
  onMarkupDraftCancel: () => void;
  children?: ReactNode;
  foundryLayout?: boolean;
  mapGuide?: {
    roomId: string;
    session: SessionUser | null;
    isRoomGm: boolean;
    watchOnly?: boolean;
    rpgSystemId?: RpgSystemId;
  };
};

/** Toolbar + canvas 2D — camada de desenho do tabuleiro. */
export function BattlefieldMapCanvas({
  wrapRef,
  canvasRef,
  attackTargetCursor,
  spawnDragActive,
  battlefieldView,
  canvasWrapSize,
  mapToolMode,
  onMapToolModeChange,
  whiteboardTool,
  onDrawToolChange,
  markupColor,
  markupWidth,
  markupDurability,
  onColorChange,
  onWidthChange,
  onDurabilityChange,
  canUseWhiteboard,
  canManageMarkups,
  canPing,
  showFogTool,
  onClearSession,
  onClearPermanent,
  onClearAll,
  showDungeonEditor,
  dungeonEditorActive,
  onToggleDungeonEditor,
  spawnDropHandlers,
  pointerHandlers,
  markupTextDraft,
  onMarkupTextCommit,
  onMarkupDraftCancel,
  children,
  foundryLayout = false,
  mapGuide,
}: BattlefieldMapCanvasProps) {
  return (
    <div
      ref={wrapRef}
      className={`vtt-canvas-wrap${foundryLayout ? " vtt-canvas-wrap--foundry" : ""}${attackTargetCursor ? " vtt-canvas-wrap--attack-target" : ""}${spawnDragActive ? " vtt-canvas-wrap--spawn-drop" : ""}${battlefieldView.isPanning ? " vtt-canvas-wrap--panning" : ""}`}
      onContextMenu={(e) => e.preventDefault()}
      onContextMenuCapture={(e) => e.preventDefault()}
      {...spawnDropHandlers}
    >
      {mapGuide ? (
        <VttMapGuideCluster
          roomId={mapGuide.roomId}
          session={mapGuide.session}
          isRoomGm={mapGuide.isRoomGm}
          watchOnly={mapGuide.watchOnly}
          rpgSystemId={mapGuide.rpgSystemId}
        />
      ) : (
        <VttHelpButton />
      )}
      <MapToolbar
        mapToolMode={mapToolMode}
        onMapToolModeChange={onMapToolModeChange}
        drawTool={whiteboardTool}
        onDrawToolChange={onDrawToolChange}
        color={markupColor}
        width={markupWidth}
        durability={markupDurability}
        onColorChange={onColorChange}
        onWidthChange={onWidthChange}
        onDurabilityChange={onDurabilityChange}
        canUseDraw={canUseWhiteboard}
        canManageAll={canManageMarkups}
        canPing={canPing}
        showFogTool={showFogTool}
        onClearSession={onClearSession}
        onClearPermanent={onClearPermanent}
        onClearAll={onClearAll}
        zoomPercent={battlefieldView.zoomPercent}
        canZoomIn={battlefieldView.canZoomIn}
        canZoomOut={battlefieldView.canZoomOut}
        onZoomIn={battlefieldView.zoomIn}
        onZoomOut={battlefieldView.zoomOut}
        onResetView={battlefieldView.resetView}
        showDungeonEditor={showDungeonEditor}
        dungeonEditorActive={dungeonEditorActive}
        onToggleDungeonEditor={onToggleDungeonEditor}
      />
      <canvas
        ref={canvasRef}
        className="vtt-canvas"
        {...spawnDropHandlers}
        onPointerDown={(e) => {
          if (battlefieldView.onPointerDown(e)) return;
          pointerHandlers.onPointerDown(e);
        }}
        onPointerMove={(e) => {
          if (battlefieldView.onPointerMove(e)) return;
          pointerHandlers.onPointerMove(e);
        }}
        onPointerUp={(e) => {
          if (battlefieldView.endPan(e)) return;
          pointerHandlers.onPointerUp(e);
        }}
        onPointerLeave={(e) => {
          battlefieldView.endPan(e);
          pointerHandlers.onPointerLeave();
        }}
        onContextMenu={pointerHandlers.onContextMenu}
      />
      {markupTextDraft && canvasWrapSize.w > 0 && canvasWrapSize.h > 0 ? (
        <MapMarkupTextEditor
          wx={markupTextDraft.wx}
          wy={markupTextDraft.wy}
          wrapW={canvasWrapSize.w}
          wrapH={canvasWrapSize.h}
          view={battlefieldView.view}
          color={markupColor}
          onCommit={(text) => {
            onMarkupTextCommit(text);
            onMarkupDraftCancel();
          }}
          onCancel={onMarkupDraftCancel}
        />
      ) : null}
      {children}
    </div>
  );
}
