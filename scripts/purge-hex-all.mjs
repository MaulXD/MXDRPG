/**
 * Remove toda terminologia "hex" — nomes, IDs, CSS, código e compendium.
 * Saves antigos: chaves legadas lidas via join em scene-normalize.ts.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "livros/pdf"]);

const FILE_RENAMES = [
  ["vinite/module/automation/hex-utils.mjs", "vinite/module/automation/grid-utils.mjs"],
];

const REPLACEMENTS = [
  // IDs e nomes canônicos (mais longos primeiro)
  ["habilidades-investida-hexagonal", "habilidades-investida-em-linha"],
  ["HAB-investida-hexagonal", "HAB-investida-em-linha"],
  ["magias-muralha-hexagonal", "magias-muralha-segmentada"],
  ["magias-nova-hex", "magias-nova-radiante"],
  ["Investida Hexagonal", "Investida em Linha"],
  ["Muralha Hexagonal", "Muralha Segmentada"],
  ["Nova Hex", "Nova Radiante"],
  ["Molde Hexagonal Vazio", "Molde Simétrico Vazio"],
  ["Molde Hexagonal", "Molde Simétrico"],
  ["hexágonos perfeitos", "polígonos simétricos perfeitos"],
  ["hexágonos", "polígonos simétricos"],
  ["hexagonos perfeitos", "poligonos simetricos perfeitos"],
  ["hexagonos", "poligonos simetricos"],
  ["grid hexagonal", "grid quadrado"],
  ["Grid hexagonal", "Grid quadrado"],
  ["GRID HEX", "GRID PA"],
  ["hexagonal SVG", "angular SVG"],
  ["hexagonal", "simétrico"],
  ["Hexagonal", "Simétrico"],
  // CSS
  ["--vtt-hex-", "--vtt-cell-"],
  ["vtt-hex-", "vtt-cell-"],
  // Compendium / tactical
  ["alcanceHex", "alcanceCells"],
  ["radiusHex", "radiusCells"],
  ["ELDARIN_RANGED_LONG_HEX", "ELDARIN_RANGED_LONG_CELLS"],
  ["metersBonusToHex", "metersBonusToCells"],
  ["dnd_normal_range_hex", "dnd_normal_range_cells"],
  ["meters_bonus_hex", "meters_bonus_cells"],
  ["_HEX_LONG_BOW", "_CELL_LONG_BOW"],
  ["_HEX_SHORT_BOW", "_CELL_SHORT_BOW"],
  ["_HEX_LIGHT_CROSSBOW", "_CELL_LIGHT_CROSSBOW"],
  ["_HEX_HEAVY_CROSSBOW", "_CELL_HEAVY_CROSSBOW"],
  ["_HEX_HAND_CROSSBOW", "_CELL_HAND_CROSSBOW"],
  ["_HEX_THROWN", "_CELL_THROWN"],
  ["movement?.hex", "movement?.cells"],
  ["movement: { hex:", "movement: { cells:"],
  ["movement: { hex", "movement: { cells"],
  ['movement?.hex?.', "movement?.cells?."],
  ["sys.movement?.hex", "sys.movement?.cells"],
  // Funções / tipos
  ["expandAnchorsToFootprintHexes", "expandAnchorsToFootprintCells"],
  ["reachableMovementFootprintHexes", "reachableMovementFootprintCells"],
  ["isMultiHexCreatureSize", "isMultiCellCreatureSize"],
  ["visibleHexSetForPlayer", "visibleCellSetForPlayer"],
  ["isHexVisibleToPlayer", "isCellVisibleToPlayer"],
  ["tokenOccupiedHexes", "tokenOccupiedCells"],
  ["reachableMovementHexes", "reachableMovementCells"],
  ["paidMovementHexKeys", "paidMovementCellKeys"],
  ["buildDisplayHexGrid", "buildDisplayGrid"],
  ["mapAlignedHexSize", "mapAlignedCellSize"],
  ["resolveHexPalette", "resolveGridPalette"],
  ["HexHighlightPalette", "GridHighlightPalette"],
  ["DEFAULT_MS_PER_HEX", "DEFAULT_MS_PER_CELL"],
  ["msPerHex", "msPerCell"],
  ["HexOccupants", "CellOccupants"],
  ["canEnterHex", "canEnterCell"],
  ["isHexBlocked", "isCellBlocked"],
  ["blockedHexSet", "blockedCellSet"],
  ["hexInDungeonGrid", "cellInGridBounds"],
  ["revealHexKeys", "revealCellKeys"],
  ["visibleHexSet", "visibleCellSet"],
  ["occupiedHexes", "occupiedCells"],
  ["reachableHexes", "reachableCells"],
  ["hexToMeters", "cellsToMeters"],
  ["hexToFeet", "cellsToFeet"],
  ["HEX_DIRECTIONS", "GRID_DIRECTIONS"],
  ["hex-utils.mjs", "grid-utils.mjs"],
  ["hex-utils", "grid-utils"],
  ["isTargetInHexRange", "isTargetInCellRange"],
  ["hex-utils.mjs", "grid-utils.mjs"],
  // Texto / docs
  [" multi-hex", " multi-célula"],
  ["multi-hex", "multi-célula"],
  [" hex ", " célula "],
  [" hex.", " célula."],
  [" hex,", " célula,"],
  [" hex)", " célula)"],
  [" hex;", " célula;"],
  [" hex:", " célula:"],
  [" hex\"", " célula\""],
  [" hex'", " célula'"],
  [" hex`", " célula`"],
  [" hex\n", " célula\n"],
  ["· hex", "· célula"],
  [" hex ·", " célula ·"],
  ["(hex)", "(célula)"],
  [" hexes", " células"],
  ["hexes ", "células "],
  ["Hexes ", "Células "],
  [" hexes.", " células."],
  [" hexes,", " células,"],
  [" hexes)", " células)"],
  [" hexes;", " células;"],
  [" hexes:", " células:"],
  [" hexes\n", " células\n"],
  [" hexes\"", " células\""],
  [" hexes'", " células'"],
  [" hexes`", " células`"],
  [" hexes.", " células."],
  [" hexes,", " células,"],
  [" hexes)", " células)"],
  [" hexes;", " células;"],
  [" hexes:", " células:"],
  [" hexes\n", " células\n"],
  [" hexes\"", " células\""],
  [" hexes'", " células'"],
  [" hexes`", " células`"],
  [" hexKey", " cellKey"],
  ["hexKey", "cellKey"],
  [" hexDist", " cellDist"],
  ["hexDist", "cellDist"],
  [" hexCount", " cellCount"],
  ["hexCount", "cellCount"],
  [" hexSize", " cellSize"],
  ["hexSize", "cellSize"],
  [" hexGrid", " cellGrid"],
  ["HexGrid", "CellGrid"],
  [" hexPath", " gridPath"],
  ["HexPath", "GridPath"],
  [" hexArea", " gridArea"],
  [" Hex ", " Célula "],
  [" Hex,", " Célula,"],
  [" Hex.", " Célula."],
  [" Hex)", " Célula)"],
  [" Hex:", " Célula:"],
  [" Hex\n", " Célula\n"],
  [" Hex\"", " Célula\""],
  [" Hex'", " Célula'"],
  [" Hex`", " Célula`"],
  [" Hexes", " Células"],
  [" HexBattlefield", " Battlefield"],
  [" hex-math", " grid-math"],
  [" useHexCanvas", " useGridCanvas"],
  [" verify-hex-path", " verify-grid-path"],
  ["rangeHex", "rangeCells"],
  ["movementSpentHex", "movementSpentCells"],
  ["revealedHexes", "revealedCells"],
  ["sharedHex", "sharedCell"],
  [" *Hex*", " *Cell*"],
  ["Hex*", "Cell*"],
  [" hex*", " cell*"],
  ["HexPreview", "GridPreview"],
  [" hex preview", " grid preview"],
  ["Mapa hex", "Mapa grid"],
  ["mesa hex", "mesa grid"],
  [" grid hex", " grid"],
  [" em hex", " em célula"],
  [" no hex", " na célula"],
  [" do hex", " da célula"],
  [" ao hex", " à célula"],
  [" por hex", " por célula"],
  [" até hex", " até célula"],
  [" de hex", " de célula"],
  [" a hex", " a célula"],
  [" o hex", " a célula"],
  [" um hex", " uma célula"],
  ["  hex", " célula"],
];

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = path.relative(ROOT, full).replace(/\\/g, "/");
    if (SKIP_DIRS.has(name) || [...SKIP_DIRS].some((s) => rel.startsWith(s))) continue;
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|mjs|js|json|md|css|py|hbs|html|svg|txt)$/.test(name)) out.push(full);
  }
  return out;
}

for (const [from, to] of FILE_RENAMES) {
  const src = path.join(ROOT, from);
  const dst = path.join(ROOT, to);
  if (!fs.existsSync(src)) continue;
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  if (fs.existsSync(dst)) fs.unlinkSync(dst);
  fs.renameSync(src, dst);
  console.log(`renamed ${from} -> ${to}`);
}

let changed = 0;
for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  if (rel.endsWith("purge-hex-all.mjs") || rel.endsWith("rename-grid-legacy.mjs")) continue;
  const raw = fs.readFileSync(file, "utf8");
  let next = raw;
  for (const [from, to] of REPLACEMENTS) {
    next = next.split(from).join(to);
  }
  if (next !== raw) {
    fs.writeFileSync(file, next, "utf8");
    changed++;
  }
}

console.log(`patched ${changed} files`);
