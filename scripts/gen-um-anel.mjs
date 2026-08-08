/**
 * Gera os compêndios do Um Anel a partir de livros/um-anel/compendio/*.md.
 *
 * Uso: node scripts/gen-um-anel.mjs
 *
 * PRD v2.0, decisões D13/D15: o markdown é a fonte da verdade e este script é o
 * único caminho até o JSON. Nunca editar data/compendiums/um-anel/*.json à mão.
 *
 * Isolamento de hub (princípio fundacional do PRD): este gerador NÃO lê nada de
 * livros/ do Eldarin nem escreve nos packs dele. Saída em pasta própria.
 *
 * Formato lido (determinístico, sem heurística de prosa):
 *
 *   # Título de arquivo             → ignorado
 *   # Nome de grupo                 → grupo (h1 depois do primeiro)
 *   ## ID — Nome                    → abre uma entrada
 *   - **Campo:** valor              → campo da entrada
 *   > Descrição: texto              → descrição longa (continua nas linhas `>`)
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, "..", "livros", "um-anel", "compendio");
const OUT = join(__dirname, "..", "data", "compendiums", "um-anel");

/** Cada arquivo vira um pack. `label`/`description` alimentam a navegação do compêndio. */
const PACKS = {
  posturas: {
    label: "Combate e Posturas",
    description:
      "As quatro posturas de combate, limites de engajamento e regras de rodada.",
  },
  jornada: {
    label: "Jornada",
    description:
      "Papéis da Companhia, Testes de Marcha, eventos por região e Fadiga de viagem.",
  },
  sombra: {
    label: "Sombra e Miséria",
    description:
      "Fontes de Sombra, Testes de Sombra, Miserável, Cicatrizes e Acesso de Loucura.",
  },
  conselho: {
    label: "Conselho",
    description:
      "Resistência, Introdução, Interação e as perícias do encontro social.",
  },
  progressao: {
    label: "Progressão e Companhia",
    description:
      "Custos de Experiência, limites por Fase, Valor e Sabedoria, Yule, Empreitadas e Nível de Companhia.",
  },
  propriedades: {
    label: "Propriedades",
    description:
      "A regra de campanha de The Darkening of Mirkwood convertida: Valor, manutenção de fim de ano e a Empreitada Tratar das Terras.",
  },
  "conversao-primeira-edicao": {
    label: "Conversão da 1ª edição",
    description:
      "Equivalências de termos e regras entre a 1ª e a 2ª edição, para converter aventuras antigas sem inventar números.",
  },
};

/** "**Campo:** valor" → ["campo", "valor"]. Chave normalizada em minúsculas sem acento. */
function normalizeKey(raw) {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** Números puros viram number; o resto fica string (ex.: "4 mais 1 Cicatriz"). */
function coerce(value) {
  const v = value.trim();
  if (/^-?\d+$/.test(v)) return Number(v);
  return v;
}

function parseFile(path) {
  const md = readFileSync(path, "utf8");
  const lines = md.split(/\r?\n/);

  const entries = [];
  let group = null;
  let current = null;
  let descLines = [];

  const flushDesc = () => {
    if (!current) return;
    const text = descLines.join(" ").replace(/\s+/g, " ").trim();
    if (text) current.system.descricao = text;
    descLines = [];
  };

  const flushEntry = () => {
    flushDesc();
    if (current) entries.push(current);
    current = null;
  };

  let sawFirstH1 = false;

  for (const line of lines) {
    // h1: o primeiro é o título do arquivo; os seguintes são grupos.
    const h1 = line.match(/^#\s+(.+)$/);
    if (h1) {
      flushEntry();
      if (sawFirstH1) group = h1[1].trim();
      else sawFirstH1 = true;
      continue;
    }

    // "## ID — Nome" (aceita em-dash, en-dash ou hífen)
    const h2 = line.match(/^##\s+([A-Z]{3}-[A-Z0-9]+)\s*[—–-]\s*(.+)$/);
    if (h2) {
      flushEntry();
      current = {
        id: h2[1].trim(),
        name: h2[2].trim(),
        type: "efeito",
        system: {},
      };
      if (group) current.system.grupo = group;
      continue;
    }

    if (!current) continue;

    // "- **Campo:** valor"
    const field = line.match(/^\s*-\s+\*\*(.+?):\*\*\s*(.*)$/);
    if (field) {
      flushDesc();
      current.system[normalizeKey(field[1])] = coerce(field[2]);
      continue;
    }

    // "> Descrição: ..." abre o bloco; linhas "> ..." seguintes continuam.
    const quote = line.match(/^\s*>\s?(.*)$/);
    if (quote) {
      const body = quote[1];
      const opener = body.match(/^Descri[çc][ãa]o:\s*(.*)$/i);
      if (opener) descLines = [opener[1]];
      else if (descLines.length) descLines.push(body);
      continue;
    }

    // Linha em branco não fecha a entrada — só encerra o parágrafo corrente.
    if (!line.trim()) {
      flushDesc();
      continue;
    }
  }

  flushEntry();
  return entries;
}

function main() {
  mkdirSync(OUT, { recursive: true });

  const files = readdirSync(SRC).filter((f) => f.endsWith(".md"));
  const manifest = [];
  let total = 0;

  for (const file of files) {
    const packId = basename(file, ".md");
    const meta = PACKS[packId];
    if (!meta) {
      console.error(
        `gen-um-anel: ${file} não tem entrada em PACKS — adicione o pack ou remova o arquivo.`
      );
      process.exitCode = 1;
      continue;
    }

    const entries = parseFile(join(SRC, file));
    if (entries.length === 0) {
      console.error(`gen-um-anel: ${file} não produziu nenhuma entrada.`);
      process.exitCode = 1;
      continue;
    }

    // IDs duplicados dentro do mesmo pack quebram o índice do compêndio.
    const seen = new Set();
    for (const e of entries) {
      if (seen.has(e.id)) {
        console.error(`gen-um-anel: id duplicado em ${file}: ${e.id}`);
        process.exitCode = 1;
      }
      seen.add(e.id);
    }

    writeFileSync(join(OUT, `${packId}.json`), JSON.stringify(entries, null, 2) + "\n");
    manifest.push({ id: packId, label: meta.label, description: meta.description, count: entries.length });
    total += entries.length;
    console.log(`  ${packId.padEnd(10)} ${String(entries.length).padStart(3)} entradas`);
  }

  writeFileSync(join(OUT, "index.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(`gen-um-anel: ${manifest.length} packs, ${total} entradas.`);
}

main();
