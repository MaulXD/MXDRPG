#!/usr/bin/env node
/**
 * D-21 (BV-056): traços de classe do livro, só leitura na aba Habilidades da ficha.
 * Fonte: livros/LIVRO-DO-JOGADOR.md, Cap. 4 (uma seção "### CLASSE" por classe).
 *   - "**Habilidades Base:**" seguido de "- Nome (Nivel N): texto" -> traço do nível N.
 *   - Parágrafo "**Nome:** texto" da seção (Ataque Furtivo, Fúria, Chi...) -> traço do nível 1.
 *     Ficam de fora o bônus passivo (já aparece na ficha), a tabela, as notas de PA e as subclasses.
 * Saída: data/character/class-traits.json (gerado; não editar à mão).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const LIVRO = join(root, "livros", "LIVRO-DO-JOGADOR.md");
const SAIDA = join(root, "data", "character", "class-traits.json");

/** Título da seção no livro -> id da classe no código (lib/character/rules.ts). */
const CLASSES = {
  GUERREIRO: "Guerreiro",
  PATRULHEIRO: "Patrulheiro",
  LADINO: "Ladino",
  MAGO: "Mago",
  CLERIGO: "Clérigo",
  BARBARO: "Bárbaro",
  BARDO: "Bardo",
  DRUIDA: "Druida",
  FEITICEIRO: "Feiticeiro",
  ESPIRITUALISTA: "Espiritualista",
  PALADINO: "Paladino",
  BRUXO: "Bruxo",
};

const FORA = /^(PA|PA \(VTT\)|PA na mesa digital|Tabela de Progressao|Habilidades Base|Subclasses.*|Bônus Passivo.*)$/i;

/** Tira o markdown de ênfase do texto (o livro usa **negrito** e *itálico*). */
function limpar(texto) {
  return texto.replace(/\*\*/g, "").replace(/(^|[^*])\*([^*]+)\*/g, "$1$2").replace(/\s+/g, " ").trim();
}

export function extrairTracos(livro) {
  const linhas = livro.split(/\r?\n/);
  const ini = linhas.findIndex((l) => /^## CAP[IÍ]TULO 4\b/.test(l));
  const fim = linhas.findIndex((l, i) => i > ini && /^## CAP[IÍ]TULO 5\b/.test(l));
  if (ini < 0 || fim < 0) throw new Error("Cap. 4 não encontrado no livro");

  const out = {};
  let classe = null;
  let emBase = false;
  let emSubclasses = false;
  for (let i = ini; i < fim; i++) {
    const linha = linhas[i];
    const titulo = /^### (\S+)\s*$/.exec(linha);
    if (titulo) {
      classe = CLASSES[titulo[1]] ?? null;
      if (classe) out[classe] = [];
      emBase = false;
      emSubclasses = false;
      continue;
    }
    if (!classe) continue;
    if (/^\*\*Subclasses/.test(linha)) {
      emSubclasses = true;
      emBase = false;
      continue;
    }
    if (/^\*\*Habilidades Base:\*\*/.test(linha)) {
      emBase = true;
      continue;
    }
    if (emBase) {
      const item = /^- (.+?) \(N[ií]vel (\d+)\):\s*(.+)$/.exec(linha);
      if (item) {
        out[classe].push({ nome: limpar(item[1]), nivel: Number(item[2]), texto: limpar(item[3]) });
        continue;
      }
      if (linha.trim() === "") continue;
      emBase = false;
    }
    if (emSubclasses) continue;
    const paragrafo = /^\*\*([^*]+?):\*\*\s*(.+)$/.exec(linha);
    if (paragrafo && !FORA.test(paragrafo[1].trim())) {
      out[classe].push({ nome: limpar(paragrafo[1]), nivel: 1, texto: limpar(paragrafo[2]) });
    }
  }
  for (const c of Object.values(CLASSES)) {
    if (!out[c]) throw new Error(`classe ${c} sem seção no Cap. 4`);
    out[c].sort((a, b) => a.nivel - b.nivel);
  }
  return out;
}

function main() {
  const tracos = extrairTracos(readFileSync(LIVRO, "utf8"));
  const doc = {
    fonte: "livros/LIVRO-DO-JOGADOR.md, Cap. 4 (gerado por scripts/generate-class-traits.mjs)",
    classes: tracos,
  };
  writeFileSync(SAIDA, `${JSON.stringify(doc, null, 2)}\n`, "utf8");
  const total = Object.values(tracos).reduce((n, l) => n + l.length, 0);
  console.log(`class-traits: ${total} traços de ${Object.keys(tracos).length} classes em data/character/class-traits.json`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
