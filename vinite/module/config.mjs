/** @type {object} Configuração global exposta em CONFIG.ELDARIN */
export const ELDARIN = {};

ELDARIN.ATTRIBUTE_KEYS = ["forca", "agilidade"];

ELDARIN.MOVEMENT_MODES = {
  walk: "walk",
  run: "run",
};

ELDARIN.DRAG_RULER_COLORS = {
  walk: { id: "walk", default: 0x39ff14, name: "ELDARIN.DragRuler.walk" },
  run: { id: "run", default: 0xffd700, name: "ELDARIN.DragRuler.run" },
};

ELDARIN.NEON = {
  cyan: "#00f5ff",
  magenta: "#ff00e5",
  lime: "#39ff14",
  amber: "#ffd700",
};

ELDARIN.requiredModules = [
  { id: "drag-ruler", label: "Drag Ruler" },
  { id: "terrain-ruler", label: "Terrain Ruler" },
  { id: "sequencer", label: "Sequencer" },
  { id: "tokenmagic", label: "Token Magic FX" },
  { id: "socketlib", label: "socketlib" },
];
