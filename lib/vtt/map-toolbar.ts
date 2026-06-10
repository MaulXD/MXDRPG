import type { WhiteboardTool } from "@/lib/vtt/map-markup";
import type { Axial } from "@/lib/vtt/hex-math";

/** Modos da barra de ferramentas do mapa (modelo Roll20). */
export type MapToolMode = "token" | "ping" | "measure" | "fog" | "draw";

export type MeasurePreview = {
  start: { x: number; y: number };
  end: { x: number; y: number };
  startAxial: Axial;
  endAxial: Axial;
};

export type MapDrawTool = WhiteboardTool;

export function isDrawMapMode(mode: MapToolMode): boolean {
  return mode === "draw";
}
