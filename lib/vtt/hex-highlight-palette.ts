import { readThemeColor } from "@/lib/theme";
import type { MapBackdropTone } from "@/lib/vtt/map-luminance";

export type HexHighlightPalette = {
  fill: string;
  stroke: string;
  walkFill: string;
  walkStroke: string;
  turnWalkFill: string;
  turnWalkStroke: string;
  walkPaidFill: string;
  walkPaidStroke: string;
  runFill: string;
  runStroke: string;
  attackFill: string;
  attackStroke: string;
  dirFill: string;
  dirStroke: string;
  areaFill: string;
  areaStroke: string;
  areaCenterFill: string;
  areaCenterStroke: string;
  invalidFill: string;
  invalidStroke: string;
  spawnFill: string;
  spawnStroke: string;
  hoverFill: string;
  hoverStroke: string;
  pathStroke: string;
  pathGlow: string;
  tokenText: string;
};

type PaletteKey = keyof HexHighlightPalette;

const VAR_SUFFIX: Record<PaletteKey, string> = {
  fill: "fill",
  stroke: "stroke",
  walkFill: "walk-fill",
  walkStroke: "walk-stroke",
  turnWalkFill: "turn-walk-fill",
  turnWalkStroke: "turn-walk-stroke",
  walkPaidFill: "walk-paid-fill",
  walkPaidStroke: "walk-paid-stroke",
  runFill: "run-fill",
  runStroke: "run-stroke",
  attackFill: "attack-fill",
  attackStroke: "attack-stroke",
  dirFill: "dir-fill",
  dirStroke: "dir-stroke",
  areaFill: "area-fill",
  areaStroke: "area-stroke",
  areaCenterFill: "area-center-fill",
  areaCenterStroke: "area-center-stroke",
  invalidFill: "invalid-fill",
  invalidStroke: "invalid-stroke",
  spawnFill: "spawn-fill",
  spawnStroke: "spawn-stroke",
  hoverFill: "hover-fill",
  hoverStroke: "hover-stroke",
  pathStroke: "path-stroke",
  pathGlow: "path-glow",
  tokenText: "token-text",
};

const FALLBACKS: HexHighlightPalette = {
  fill: "rgba(180,155,110,0.07)",
  stroke: "rgba(180,155,110,0.28)",
  walkFill: "rgba(90,115,82,0.28)",
  walkStroke: "rgba(120,150,95,0.75)",
  turnWalkFill: "rgba(90,115,82,0.18)",
  turnWalkStroke: "rgba(120,150,95,0.5)",
  walkPaidFill: "rgba(70,130,120,0.32)",
  walkPaidStroke: "rgba(100,180,165,0.85)",
  runFill: "rgba(184,134,11,0.22)",
  runStroke: "rgba(201,169,98,0.65)",
  attackFill: "rgba(139,69,19,0.2)",
  attackStroke: "rgba(180,80,60,0.7)",
  dirFill: "rgba(80,140,200,0.3)",
  dirStroke: "rgba(120,180,255,0.9)",
  areaFill: "rgba(120,60,180,0.35)",
  areaStroke: "rgba(180,120,255,0.85)",
  areaCenterFill: "rgba(200,100,255,0.45)",
  areaCenterStroke: "#e8c4ff",
  invalidFill: "rgba(160,50,50,0.35)",
  invalidStroke: "rgba(220,80,70,0.95)",
  spawnFill: "rgba(90, 115, 82, 0.38)",
  spawnStroke: "rgba(184, 255, 60, 0.9)",
  hoverFill: "rgba(201,169,98,0.18)",
  hoverStroke: "#c9a962",
  pathStroke: "rgba(201,169,98,0.92)",
  pathGlow: "rgba(120,180,95,0.35)",
  tokenText: "#e8e0d4",
};

function readHexVar(tone: MapBackdropTone, key: PaletteKey): string {
  const suffix = VAR_SUFFIX[key];
  const fallback = FALLBACKS[key];

  if (tone === "none") {
    if (key === "pathStroke") return readThemeColor("--vtt-path-stroke", fallback);
    if (key === "pathGlow") return readThemeColor("--vtt-path-glow", fallback);
    if (key === "tokenText") return readThemeColor("--vtt-token-text", fallback);
    return readThemeColor(`--vtt-hex-${suffix}`, fallback);
  }

  const tonePrefix =
    tone === "light"
      ? "--vtt-hex-on-light-"
      : tone === "green"
        ? "--vtt-hex-on-green-"
        : "--vtt-hex-on-dark-";
  const onMap = readThemeColor(`${tonePrefix}${suffix}`, "");
  if (onMap) return onMap;

  return readHexVar("none", key);
}

export function resolveHexPalette(tone: MapBackdropTone): HexHighlightPalette {
  const palette = {} as HexHighlightPalette;
  for (const key of Object.keys(FALLBACKS) as PaletteKey[]) {
    palette[key] = readHexVar(tone, key);
  }
  return palette;
}
