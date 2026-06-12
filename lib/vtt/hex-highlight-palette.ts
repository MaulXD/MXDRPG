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
  fill: "transparent",
  stroke: "rgba(0, 0, 0, 0.5)",
  walkFill: "rgba(72, 130, 95, 0.35)",
  walkStroke: "rgba(0, 0, 0, 0.55)",
  turnWalkFill: "rgba(72, 130, 95, 0.25)",
  turnWalkStroke: "rgba(0, 0, 0, 0.4)",
  walkPaidFill: "rgba(180, 150, 60, 0.38)",
  walkPaidStroke: "rgba(0, 0, 0, 0.6)",
  runFill: "rgba(220, 170, 40, 0.32)",
  runStroke: "rgba(0, 0, 0, 0.55)",
  attackFill: "rgba(200, 90, 50, 0.35)",
  attackStroke: "rgba(0, 0, 0, 0.6)",
  dirFill: "rgba(80, 140, 200, 0.38)",
  dirStroke: "rgba(0, 0, 0, 0.65)",
  areaFill: "rgba(130, 80, 200, 0.38)",
  areaStroke: "rgba(0, 0, 0, 0.65)",
  areaCenterFill: "rgba(160, 100, 220, 0.45)",
  areaCenterStroke: "rgba(0, 0, 0, 0.75)",
  invalidFill: "rgba(200, 60, 50, 0.38)",
  invalidStroke: "rgba(0, 0, 0, 0.75)",
  spawnFill: "rgba(100, 160, 80, 0.35)",
  spawnStroke: "rgba(0, 0, 0, 0.65)",
  hoverFill: "rgba(0, 0, 0, 0.08)",
  hoverStroke: "rgba(0, 0, 0, 0.65)",
  pathStroke: "rgba(0, 0, 0, 0.75)",
  pathGlow: "rgba(0, 0, 0, 0.12)",
  tokenText: "#1a1a1a",
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
