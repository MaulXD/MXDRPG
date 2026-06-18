/** Corrige identificadores quebrados pelo purge (célula como var, areaHexes, etc.). */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

const REPLACEMENTS = [
  ["computeSpellAreaHexes", "computeSpellAreaCells"],
  ["areaHexesFromCombat", "areaCellsFromCombat"],
  ["areaHexList", "areaCellList"],
  ["areaHexes", "areaCells"],
  ["hexPathPoints", "cellPathPoints"],
  ["HexCanvasDrawState", "GridCanvasDrawState"],
  ["placeRoomActorOnHex", "placeRoomActorOnCell"],
  ["GROUP_HEAL_AOE_HEX", "GROUP_HEAL_AOE_CELLS"],
  ["aoeHex", "aoeCells"],
  ["defHexes", "defCells"],
  ["attHexes", "attCells"],
  ["aHexes", "aCells"],
  ["bHexes", "bCells"],
  ["hexLabel", "cellLabel"],
  ["IconHex", "IconGridCell"],
  ["combat-fx-hex-svg", "combat-fx-cell-svg"],
  ["combat-fx-area-hex", "combat-fx-area-cell"],
  ["combat-fx-mark-hex", "combat-fx-mark-cell"],
  ["combat-fx-damage--hex", "combat-fx-damage--cell"],
  ["const células =", "const cells ="],
  ["for (const célula of células)", "for (const cell of cells)"],
  ["for (const célula of body)", "for (const cell of body)"],
  ["for (const célula of occupiedCells", "for (const cell of occupiedCells"],
  ["for (const célula of tokenOccupiedCells", "for (const cell of tokenOccupiedCells"],
  ["(célula) =>", "(cell) =>"],
  ["(célula:", "(cell:"],
  [", célula)", ", cell)"],
  ["axialKey(célula)", "axialKey(cell)"],
  ["cellKey(hex.q", "cellKey(cell.q"],
  ["cellAllowsMover(célula", "cellAllowsMover(cell"],
  ["isCellBlocked(scene, célula)", "isCellBlocked(scene, cell)"],
  ["!inGrid(célula", "!inGrid(cell"],
  ["axialToPixel(hex.q, célula.r", "axialToPixel(cell.q, cell.r"],
  ["gridPathPoints(hex,", "gridPathPoints(cell,"],
  ["cellsToFeet(célula)", "cellsToFeet(cells)"],
  ["footprintFillRadius(cellSize: number, células:", "footprintFillRadius(cellSize: number, cells:"],
  ["movement?: { hex?:", "movement?: { cells?:"],
  ["system.movement.hex.", "system.movement.cells."],
  ["${hex} hex", "${cells} células"],
  ["runHexBefore", "runCellBefore"],
  ["runHexAfter", "runCellAfter"],
  ["movimento hex ausente", "movimento em células ausente"],
  [" hex 3-5", " células 3-5"],
  [" hex 6", " célula 6"],
  ["desloca 2 hex", "desloca 2 células"],
  [" alcance hex", " alcanceCells"],
  [" alcanceHex", " alcanceCells"],
];

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === ".git") continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|mjs|js|json|css|hbs|md|py)$/.test(name)) out.push(full);
  }
  return out;
}

let n = 0;
for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file);
  if (rel.includes("purge-hex") || rel.includes("fix-hex")) continue;
  let raw = fs.readFileSync(file, "utf8");
  let next = raw;
  for (const [a, b] of REPLACEMENTS) next = next.split(a).join(b);
  if (next !== raw) {
    fs.writeFileSync(file, next);
    n++;
  }
}
console.log(`fixed ${n} files`);
