/**
 * Remove terminologia "hex" legada do VTT (grid quadrado).
 * Mantém IDs/nomes próprios: investida-hexagonal, Nova Hex, hexágonos (lore).
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "vinite",
  "archive",
  "livros/pdf",
]);

const REPLACEMENTS = [
  ["rangeLongHex", "rangeLongCells"],
  ["areaRadiusHex", "areaRadiusCells"],
  ["areaHexCount", "areaCellCount"],
  ["rangeHex", "rangeCells"],
  ["movementSpentHex", "movementSpentCells"],
  ["sharedHex", "sharedCell"],
  ["revealedHexes", "revealedCells"],
  ["ELDARIN_RANGED_HEX", "ELDARIN_RANGED_CELLS"],
  ["METERS_PER_HEX", "METERS_PER_CELL"],
  ["dndLongRangeHex", "dndLongRangeCells"],
  ["dndNormalRangeHex", "dndNormalRangeCells"],
  ["reachableHexesBfsWithDist", "reachableCellsBfsWithDist"],
  ["reachableHexesBfs", "reachableCellsBfs"],
  ["computeAreaCells", "computeAreaCells"],
  ["findHexPath", "findGridPath"],
  ["hexesInRange", "cellsInRange"],
  ["hexNeighbors", "cellNeighbors"],
  ["hexDirection", "cellDirection"],
  ["hexDrawRadius", "cellDrawRadius"],
  ["hexInscribedRadius", "cellInscribedRadius"],
  ["hexCorners", "cellCorners"],
  ["hexDistance", "cellDistance"],
  ["lineHexes", "lineCells"],
  ["coneHexes", "coneCells"],
  ["lengthHex", "lengthCells"],
  ["buildHexGrid", "buildCellGrid"],
  ["displayHexGridRadius", "displayGridRadius"],
  ["drawHexCell", "drawGridCell"],
  ["useHexCanvas", "useGridCanvas"],
  ["HexBattlefield", "Battlefield"],
  ["hex-highlight-palette", "grid-highlight-palette"],
  ["hex-path", "grid-path"],
  ["hex-area", "grid-area"],
  ["hex-grid", "grid-cells"],
  ["hex-math", "grid-math"],
  ["verify-hex-path", "verify-grid-path"],
  ["hexSize", "cellSize"],
];

const FILE_RENAMES = [
  ["lib/vtt/hex-math.ts", "lib/vtt/grid-math.ts"],
  ["lib/vtt/hex-grid.ts", "lib/vtt/grid-cells.ts"],
  ["lib/vtt/hex-path.ts", "lib/vtt/grid-path.ts"],
  ["lib/vtt/hex-area.ts", "lib/vtt/grid-area.ts"],
  ["lib/vtt/hex-highlight-palette.ts", "lib/vtt/grid-highlight-palette.ts"],
  ["hooks/vtt/useHexCanvas.ts", "hooks/vtt/useGridCanvas.ts"],
  ["components/vtt/HexBattlefield.tsx", "components/vtt/Battlefield.tsx"],
  ["scripts/verify-hex-path.mjs", "scripts/verify-grid-path.mjs"],
];

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = path.relative(ROOT, full).replace(/\\/g, "/");
    if (SKIP_DIRS.has(name) || [...SKIP_DIRS].some((s) => rel.startsWith(s))) continue;
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|mjs|js|json|md|css|py)$/.test(name)) out.push(full);
  }
  return out;
}

function applyReplacements(content) {
  let next = content;
  for (const [from, to] of REPLACEMENTS) {
    next = next.split(from).join(to);
  }
  return next;
}

// 1) Rename files (bottom-up so dirs exist)
for (const [from, to] of FILE_RENAMES) {
  const src = path.join(ROOT, from);
  const dst = path.join(ROOT, to);
  if (!fs.existsSync(src)) continue;
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  if (fs.existsSync(dst)) fs.unlinkSync(dst);
  fs.renameSync(src, dst);
  console.log(`renamed ${from} -> ${to}`);
}

// 2) Patch file contents
let changed = 0;
for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  if (rel === "scripts/rename-grid-legacy.mjs") continue;
  const raw = fs.readFileSync(file, "utf8");
  const next = applyReplacements(raw);
  if (next !== raw) {
    fs.writeFileSync(file, next, "utf8");
    changed++;
  }
}

console.log(`patched ${changed} files`);
