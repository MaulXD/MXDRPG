/**
 * Injeta Tamanho (grid VTT) nas fichas do LIVRO-DO-MESTRE e corrige cabeçalhos 061+ colados.
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
const SIZE_HEX = {
  small: "1 hex",
  medium: "1 hex",
  large: "3 hex",
  huge: "7 hex",
  gargantuan: "19 hex",
  colossal: "37 hex",
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
    hex: SIZE_HEX[tam] ?? "1 hex",
    label: `${SIZE_PT[tam] ?? tam} · ${SIZE_HEX[tam] ?? "1 hex"}`,
  });
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

  // Tabela completa (| Estatística | Valor |)
  if (s.includes("| Estatística | Valor |") && !s.includes("| Tamanho |")) {
    s = s.replace(
      /(\| Movimento \| [^\n]+\|\n)/,
      `$1| Tamanho | ${info.label} |\n`
    );
  }

  // Tabela compacta (| HP | CA | Dano | …)
  if (s.includes("| HP | CA | Dano |")) {
    s = s.replace(
      /\| HP \| CA \| Dano \|(?: Tamanho \|)? Biomas \|\n\|[-| ]+\|\n\| ([^\n]+)\|/,
      (block, dataRow) => {
        const parts = dataRow.split("|").map((p) => p.trim()).filter(Boolean);
        if (parts.length >= 5) {
          return `| HP | CA | Dano | Tamanho | Biomas |\n|----|-----|------|---------|--------|\n| ${parts[0]} | ${parts[1]} | ${parts[2]} | ${info.pt} | ${parts.slice(4).join(" | ") || parts[3]} |`;
        }
        if (parts.length === 4 && !dataRow.includes(info.pt)) {
          return `| HP | CA | Dano | Tamanho | Biomas |\n|----|-----|------|---------|--------|\n| ${parts[0]} | ${parts[1]} | ${parts[2]} | ${info.pt} | ${parts[3]} |`;
        }
        return block;
      }
    );
    if (!s.includes("| Tamanho |")) {
      s = s.replace(
        /\| HP \| CA \| Dano \| Biomas \|\n\|[-| ]+\|\n/,
        `| HP | CA | Dano | Tamanho | Biomas |\n|----|-----|------|---------|--------|\n`
      );
      s = s.replace(
        /(\| HP \| CA \| Dano \| Tamanho \| Biomas \|\n\|[-| ]+\|\n\| )(\d+ \| \d+ \| [^|]+\| )/,
        `$1$2${info.pt} | `
      );
    }
  }

  return s;
});

lm = patched.join("");

if (!lm.includes("- **Tamanho:** Categoria corporal")) {
  lm = lm.replace(
    "- **Dano:** Dado de dano por ataque base\n",
    "- **Dano:** Dado de dano por ataque base\n- **Tamanho:** Categoria corporal no grid hexagonal (Pequeno a Colossal; ver Livro do Jogador §3.1.3.1)\n"
  );
}

const appendixEnd = "\n\n---\n\n# ÍNDICE RÁPIDO — TODOS OS MONSTROS POR NÍVEL";
if (!lm.includes("APÊNDICE — TAMANHO NO GRID")) {
  let table =
    "\n\n## APÊNDICE — TAMANHO NO GRID (001–080)\n\n| Cod | Espécime | Tamanho | Hex |\n|-----|----------|---------|-----|\n";
  for (let c = 1; c <= 80; c++) {
    const cod = String(c).padStart(3, "0");
    const info = byCod.get(cod);
    if (!info) continue;
    table += `| ${cod} | ${info.name} | ${info.pt} | ${info.hex} |\n`;
  }
  lm = lm.replace(appendixEnd, `${table}${appendixEnd}`);
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
if (!jog.includes("061–080")) {
  jog = jog.replace(
    "**Variante Elite / Colossal:** use a tabela do **espécime base**",
    "**Espécimes 061–080:** bestiário estendido (Livro do Mestre); invocação no VTT, sem tabela de assimilação 8×1.\n\n**Variante Elite / Colossal:** use a tabela do **espécime base**"
  );
}
writeFileSync(JOGADOR, jog);

let okFull = 0;
let okCompact = 0;
for (let c = 1; c <= 80; c++) {
  const cod = String(c).padStart(3, "0");
  const chunk = lm.match(new RegExp(`## ${cod} — [\\s\\S]*?(?=## \\d{3} — |$)`));
  if (!chunk) continue;
  if (chunk[0].includes("| Tamanho |")) {
    if (Number(cod) <= 60 && chunk[0].includes("| Estatística |")) okFull++;
    if (Number(cod) >= 61) okCompact++;
  }
}
console.log(
  `sync-monster-book-tamanhos: ${byCod.size} fichas · tabelas com Tamanho: ${okFull} (001–060) + ${okCompact} (061–080)`
);
