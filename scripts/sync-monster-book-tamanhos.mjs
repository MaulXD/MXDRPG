/**
 * Sincroniza Tamanho (grid VTT / tabela de referência fantasia tática) nas fichas do LIVRO-DO-MESTRE.
 * Fonte: data/monster-tamanhos.json + data/compendiums/monstros.json
 * Uso: node scripts/sync-monster-book-tamanhos.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const LM = join(root, "livros", "LIVRO-DO-MESTRE.md");
const JOGADOR = join(root, "livros", "LIVRO-DO-JOGADOR.md");
const monsters = JSON.parse(readFileSync(join(root, "data", "compendiums", "monstros.json"), "utf8"));
const tamanhos = JSON.parse(readFileSync(join(root, "data", "monster-tamanhos.json"), "utf8"));

const SIZE_PT = {
  small: "Pequeno",
  medium: "Médio",
  large: "Grande",
  huge: "Gigante",
  gargantuan: "Imenso",
  colossal: "Colossal",
};
const SIZE_GRID = {
  small: "1×1",
  medium: "1×1",
  large: "2×2",
  huge: "3×3",
  gargantuan: "4×4",
  colossal: "5×5",
};

const byCod = new Map();
for (const m of monsters) {
  const cid = m.system?.catalogId;
  if (!cid || !/^MON-\d{3}$/.test(cid)) continue;
  const cod = cid.replace("MON-", "");
  const tam = tamanhos[m.id] ?? m.system?.tactical?.tamanho ?? "medium";
  byCod.set(cod, {
    name: m.name,
    pt: SIZE_PT[tam] ?? tam,
    grid: SIZE_GRID[tam] ?? "1×1",
    label: `${SIZE_PT[tam] ?? tam} · ${SIZE_GRID[tam] ?? "1×1"}`,
  });
}

function buildAppendixTable() {
  let table =
    "## APÊNDICE — TAMANHO NO GRID (001–080)\n\n| Cod | Espécime | Tamanho | Grid |\n|-----|----------|---------|------|\n";
  for (let c = 1; c <= 80; c++) {
    const cod = String(c).padStart(3, "0");
    const info = byCod.get(cod);
    if (!info) continue;
    table += `| ${cod} | ${info.name} | ${info.pt} | ${info.grid} |\n`;
  }
  return table.trim();
}

function patchCompactTable(section, info) {
  if (!section.includes("| HP | CA | Dano | Tamanho | Biomas |")) return section;
  return section.replace(
    /(\| HP \| CA \| Dano \| Tamanho \| Biomas \|\n\|[-| ]+\|\n)(\|[^\n]+\|)/,
    (match, header, dataRow) => {
      const parts = dataRow.split("|").map((p) => p.trim()).filter(Boolean);
      if (parts.length < 5 || !/^\d+$/.test(parts[0])) return match;
      parts[3] = info.pt;
      return `${header}| ${parts.join(" | ")} |`;
    }
  );
}

let lm = readFileSync(LM, "utf8").replace(/\r\n/g, "\n");

lm = lm.replace(/Extração\.## /g, "Extração.\n\n## ");

const sections = lm.split(/(?=^## \d{3} — )/m);

const patched = sections.map((section) => {
  const head = section.match(/^## (\d{3}) — /);
  if (!head) return section;
  const cod = head[1];
  const info = byCod.get(cod);
  if (!info) return section;

  let s = section;

  // Tabela completa — insere ou atualiza linha Tamanho
  if (s.includes("| Estatística | Valor |")) {
    if (s.includes("| Tamanho |")) {
      s = s.replace(/\| Tamanho \| [^\n]+ \|/g, `| Tamanho | ${info.label} |`);
    } else {
      s = s.replace(
        /(\| Movimento \| [^\n]+\|\n)/,
        `$1| Tamanho | ${info.label} |\n`
      );
    }
  }

  s = patchCompactTable(s, info);

  return s;
});

lm = patched.join("");

lm = lm.replace(
  /- \*\*Tamanho:\*\* Categoria corporal[^\n]+\n/,
  "- **Tamanho:** Categoria corporal no grid quadrado (tabela tática Eldarin: Pequeno a Colossal; ver Livro do Jogador §3.1.3.1)\n"
);

const appendixEnd = "\n\n---\n\n# ÍNDICE RÁPIDO — TODOS OS MONSTROS POR NÍVEL";
if (lm.includes("APÊNDICE — TAMANHO NO GRID")) {
  lm = lm.replace(
    /## APÊNDICE — TAMANHO NO GRID \(001–080\)[\s\S]*?(?=\n\n---\n\n# ÍNDICE RÁPIDO)/,
    buildAppendixTable()
  );
} else {
  lm = lm.replace(appendixEnd, `\n\n${buildAppendixTable()}${appendixEnd}`);
}

writeFileSync(LM, lm);

let jog = readFileSync(JOGADOR, "utf8").replace(/\r\n/g, "\n");
if (!jog.includes("| 061 |")) {
  const rows = [];
  for (let c = 61; c <= 80; c++) {
    const cod = String(c).padStart(3, "0");
    const info = byCod.get(cod);
    if (info) rows.push(`| ${cod} | ${info.name} |`);
  }
  jog = jog.replace(
    "| 060 | Caranguejo-Eremita Colossal |\n",
    `| 060 | Caranguejo-Eremita Colossal |\n${rows.join("\n")}\n`
  );
}
jog = jog.replace(
  "### 6.2 Indice de espécimes (001–060)",
  "### 6.2 Indice de espécimes (001–080)"
);
writeFileSync(JOGADOR, jog);

let okFull = 0;
let okCompact = 0;
let okAppendix = 0;
const lmOut = readFileSync(LM, "utf8");
for (let c = 1; c <= 80; c++) {
  const cod = String(c).padStart(3, "0");
  const info = byCod.get(cod);
  if (!info) continue;
  const chunk = lmOut.match(new RegExp(`## ${cod} — [\\s\\S]*?(?=## \\d{3} — |$)`));
  if (!chunk) continue;
  if (chunk[0].includes(`| Tamanho | ${info.label} |`)) {
    if (Number(cod) <= 60 && chunk[0].includes("| Estatística |")) okFull++;
  }
  if (chunk[0].includes("| HP | CA | Dano | Tamanho | Biomas |")) {
    const row = chunk[0].match(/\| \d+ \| \d+ \|[^|\n]+\| ([^|]+) \|/);
    if (row && row[1].trim() === info.pt) okCompact++;
  }
  if (lmOut.includes(`| ${cod} | ${info.name} | ${info.pt} | ${info.grid} |`)) okAppendix++;
}
console.log(
  `sync-monster-book-tamanhos: ${byCod.size} fichas · full ${okFull}/60 · compact ${okCompact}/20 · apêndice ${okAppendix}/80`
);
