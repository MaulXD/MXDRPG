/**
 * Remove nomes e referências proprietárias de D&D — substitui por vocabulário Eldarin.
 * Uso: node scripts/purge-dnd-names.mjs
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
  ".agents",
  "livros/pdf",
]);

/** Ordem: frases longas primeiro. */
const REPLACEMENTS = [
  ["Dungeons & Dragons", "Espada & Arcano"],
  ["Dungeons and Dragons", "Espada e Arcano"],
  ["SRD / D&D 5e", "tabela tática Eldarin"],
  ["SRD/D&D 5e", "tabela tática Eldarin"],
  ["D&D 5e", "fantasia tática"],
  ["D&D", "fantasia clássica"],
  ["SRD", "tabela de referência"],
  ["PHB", "manual base"],
  ["Lich (Arquiliche)", "Necroarca (Arquiliche)"],
  ["LICH (ARQUILICHE)", "NECROARCA (ARQUILICHE)"],
  ["Arco de Costela de Lich", "Arco de Costela de Necroarca"],
  ["Olhos de Lich", "Olhos de Necroarca"],
  ["Ossos de Lich", "Ossos de Necroarca"],
  ["Memória de Lich", "Memória de Necroarca"],
  ["Coração Cristalizado", "Coração Cristalizado"], // keep
  ["Phylactery", "Âncora de Alma"],
  ["lichificação", "ritual da Âncora"],
  ["Lichs", "Necroarcas"],
  ["Lich", "Necroarca"],
  ["Tarrasque (Bebê)", "Devorador Ancião (Filhote)"],
  ["TARRASQUE (BEBÊ)", "DEVORADOR ANCIÃO (FILHOTE)"],
  ["Tarrasque Bebê", "Devorador Ancião Filhote"],
  ["Tarrasque", "Devorador Ancião"],
  ["BALOR (ARQUIDEMÔNIO)", "ARQUIDEMÔNIO FLAMEJANTE"],
  ["CARNIÇAL ALADO (VROCK)", "CARNIÇAL ALADO"],
  ["Pena de Vrock", "Pena de Carniçal Alado"],
  ["Bico de Vrock", "Bico de Carniçal Alado"],
  ["Vrocks", "Carniçais Alados"],
  ["Vrock", "Carniçal Alado"],
  ["Balor", "Arquidemônio Flamejante"],
  ["Doppelgangers", "Metamorfos Dúbios"],
  ["Doppelganger", "Metamorfo Dúbio"],
  ["DOPPELGANGER", "METAMORFO DÚBIO"],
  ["Ghouls", "Necrófagos"],
  ["Ghoul", "Necrófago"],
  ["GHOUL", "NECRÓFAGO"],
  ["Bravura Halfling", "Bravura Pequenina"],
  ["Halflings", "Pequeninos"],
  ["Halfling", "Pequenino"],
  ["halflings", "pequeninos"],
  ["halfling", "pequenino"],
  ["estilo D&D", "estilo tático clássico"],
  ["layout estilo D&D Beyond", "layout estilo ficha digital"],
  ["seletor de magias estilo D&D", "seletor de magias em anel"],
  ["pés D&D", "pés táticos"],
  ["Pés (D&D)", "Pés (táticos)"],
  ["Motivo (D&D 5e)", "Motivo (tabela tática)"],
  ["Categoria D&D", "Categoria de tamanho"],
  ["fora do padrão D&D", "fora do padrão tático"],
  ["grid quadrado SRD", "grid quadrado tático"],
  ["quadrado / quadrados (mais D&D)", "quadrado / quadrados"],
];

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = path.relative(ROOT, full).replace(/\\/g, "/");
    if (SKIP_DIRS.has(name) || [...SKIP_DIRS].some((s) => rel.startsWith(s + "/"))) continue;
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|mjs|js|json|md|css|py|svg)$/.test(name)) out.push(full);
  }
  return out;
}

function apply(content) {
  let next = content;
  for (const [from, to] of REPLACEMENTS) {
    next = next.split(from).join(to);
  }
  return next;
}

let changed = 0;
for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  if (rel === "scripts/purge-dnd-names.mjs") continue;
  const raw = fs.readFileSync(file, "utf8");
  const next = apply(raw);
  if (next !== raw) {
    fs.writeFileSync(file, next, "utf8");
    changed++;
  }
}

console.log(`purge-dnd-names: ${changed} arquivo(s) atualizado(s)`);
