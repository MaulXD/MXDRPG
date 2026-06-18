/** Finaliza purge hex: identificadores quebrados + renomeações restantes. */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

const REPLACEMENTS = [
  // broken identifiers from aggressive purge
  ["const areaCélulas =", "const areaCells ="],
  ["const aCélulas =", "const aCells ="],
  ["const bCélulas =", "const bCells ="],
  ["for (const h of células)", "for (const h of cells)"],
  ["footprintFillRadius(hs, células)", "footprintFillRadius(hs, cells)"],
  ["cellKey(cell.q, célula.r)", "cellKey(cell.q, cell.r)"],
  ["cellNeighbors(célula)", "cellNeighbors(cell)"],
  ["if (hexes.length", "if (cells.length"],
  ["cellInGridBounds(hex,", "cellInGridBounds(cell,"],
  ["canEnterCell(hex,", "canEnterCell(cell,"],
  ["const célula =", "const cell ="],

  // hex → cell renames
  ["SIZE_HEX_COUNT", "SIZE_CELL_COUNT"],
  ["HEX_INSCRIBED_RATIO", "CELL_INSCRIBED_RATIO"],
  ["CREATURE_SIZE_HEX_LABEL", "CREATURE_SIZE_CELL_LABEL"],
  ["effectiveRangedMaxHex", "effectiveRangedMaxCells"],
  ["rangedLongRangeHex", "rangedLongRangeCells"],
  ["revealRoomHex", "revealRoomCell"],
  ["revealHex", "revealCell"],
  ["applyDungeonHexEdit", "applyDungeonCellEdit"],
  ["DungeonHexEditResult", "DungeonCellEditResult"],
  ["onDungeonHexEdit", "onDungeonCellEdit"],
  ["onRevealHex", "onRevealCell"],
  ["onHexEdit", "onCellEdit"],
  ["castAreaAtHex", "castAreaAtCell"],
  ["nextHexPaLabel", "nextCellPaLabel"],
  ["readHexVar", "readPaletteCssVar"],
  ["hexPalette", "gridPalette"],
  ["gridHexSize", "gridCellSize"],
  ["isBaseHex", "isBaseCell"],
  ["tokenOuterBorderHexR", "tokenOuterBorderCellR"],
  ["walkHex", "walkCells"],
  ["longHex", "longCells"],

  // CSS / UI (stat gems, not grid hex)
  ["sheet-ddb-hex-row", "sheet-ddb-stat-row"],
  ["sheet-ddb-hex-tip", "sheet-ddb-stat-tip"],
  ["sheet-ddb-hex--center", "sheet-ddb-stat--center"],
  ["sheet-ddb-hex__label", "sheet-ddb-stat__label"],
  ["sheet-ddb-hex", "sheet-ddb-stat"],

  // comments / regex
  ["hex acumulados", "células acumuladas"],
  ["hex já gastos", "células já gastas"],
  ["hex gastos", "células gastas"],
  ["sala HEX", "sala de mesa"],
  ["Nomes legados `Axial` / `hex*` mantidos na API.", "Coordenadas axiais (`Axial`) na API."],
  [/(hex: Axial)/g, "(cell: Axial)"],
  [/inSquareGrid\(hex:/g, "inSquareGrid(cell:"],
  [/Math\.abs\(hex\./g, "Math.abs(cell."],
  [/cubo\\s\+\\(\\d\+\\)\\s\*hex/g, "cubo\\s+(\\d+)\\s*célula"],
  ["CSS só com hex/rgba", "CSS só com cores #/rgba"],
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

function applyReplacements(raw) {
  let next = raw;
  for (const [a, b] of REPLACEMENTS) {
    if (a instanceof RegExp) next = next.replace(a, b);
    else next = next.split(a).join(b);
  }
  return next;
}

let n = 0;
for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file);
  if (
    rel.includes("purge-hex") ||
    rel.includes("fix-hex") ||
    rel.includes("finish-hex") ||
    rel.includes("rename-grid-legacy")
  )
    continue;
  const raw = fs.readFileSync(file, "utf8");
  const next = applyReplacements(raw);
  if (next !== raw) {
    fs.writeFileSync(file, next);
    n++;
  }
}
console.log(`patched ${n} files`);
