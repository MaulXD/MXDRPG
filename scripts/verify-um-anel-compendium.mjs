/**
 * Verifica os compêndios gerados do Um Anel — entra em `npm run sync:data:check`.
 *
 * O ponto de existir (D13): a transcrição manual anterior não tinha nada que
 * acusasse divergência entre livro e site. Aqui um markdown editado sem rodar
 * `sync:data` quebra o check em vez de passar silenciosamente.
 */
import { readFileSync as rawReadFileSync, readdirSync, existsSync } from "fs";

/* Normaliza CRLF -> LF na leitura.

   As asserções deste arquivo casam conteúdo com âncoras de início/fim de linha
   e com trechos multilinha. No Windows, um clone novo — ou qualquer
   `git checkout` com core.autocrlf — entrega CRLF, e aí `\n## Título\n` não
   casa porque vem `\r` antes do `\n`. Comparar conteúdo não deve depender de
   fim de linha: sem isto a suíte falha num repo recém-clonado, e passava aqui
   só porque as ferramentas que escreveram os arquivos usavam LF. */
const readFileSync = (p, enc) => rawReadFileSync(p, enc).replace(/\r\n/g, "\n");

import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, "..", "livros", "um-anel", "compendio");
const OUT = join(__dirname, "..", "data", "compendiums", "um-anel");

let failed = 0;
const fail = (msg) => {
  console.error(`  ✗ ${msg}`);
  failed++;
};

if (!existsSync(OUT)) {
  fail(`${OUT} não existe — rode: node scripts/gen-um-anel.mjs`);
  process.exit(1);
}

const mdFiles = readdirSync(SRC).filter((f) => f.endsWith(".md"));
const indexPath = join(OUT, "index.json");

if (!existsSync(indexPath)) {
  fail("index.json ausente — rode: node scripts/gen-um-anel.mjs");
  process.exit(1);
}

const index = JSON.parse(readFileSync(indexPath, "utf8"));

// 1. Todo markdown tem JSON correspondente, e vice-versa.
for (const file of mdFiles) {
  const packId = basename(file, ".md");
  if (!existsSync(join(OUT, `${packId}.json`))) {
    fail(`${file} não tem ${packId}.json gerado`);
  }
  if (!index.some((p) => p.id === packId)) {
    fail(`${packId} não está no index.json`);
  }
}

// 2. Nenhum JSON órfão (markdown removido sem regerar).
for (const entry of index) {
  if (!mdFiles.includes(`${entry.id}.md`)) {
    fail(`index.json cita "${entry.id}" mas livros/um-anel/compendio/${entry.id}.md não existe`);
  }
}

// 3. Contagem, ids e campos obrigatórios.
for (const meta of index) {
  const path = join(OUT, `${meta.id}.json`);
  if (!existsSync(path)) continue;
  const entries = JSON.parse(readFileSync(path, "utf8"));

  if (entries.length !== meta.count) {
    fail(`${meta.id}: index diz ${meta.count} entradas, arquivo tem ${entries.length}`);
  }

  const seen = new Set();
  for (const e of entries) {
    if (!e.id) fail(`${meta.id}: entrada sem id (${e.name ?? "sem nome"})`);
    if (!e.name) fail(`${meta.id}: entrada ${e.id} sem nome`);
    if (seen.has(e.id)) fail(`${meta.id}: id duplicado ${e.id}`);
    seen.add(e.id);
    if (!e.system || typeof e.system !== "object") {
      fail(`${meta.id}: entrada ${e.id} sem bloco system`);
    }
  }
}

// 4. O JSON está em sincronia com o markdown? Regera em memória e compara.
//    É o que pega "editei o livro e esqueci de rodar sync:data".
try {
  execFileSync(process.execPath, [join(__dirname, "gen-um-anel.mjs")], { stdio: "pipe" });
  const after = JSON.parse(readFileSync(indexPath, "utf8"));
  for (const meta of after) {
    const before = index.find((p) => p.id === meta.id);
    if (before && before.count !== meta.count) {
      fail(
        `${meta.id}: JSON estava dessincronizado do markdown (${before.count} → ${meta.count}). ` +
          `Commite o JSON regerado.`
      );
    }
  }
} catch (err) {
  fail(`gen-um-anel.mjs falhou: ${err.message}`);
}

if (failed > 0) {
  console.error(`\nverify-um-anel-compendium: ${failed} problema(s).`);
  process.exit(1);
}

const total = index.reduce((sum, p) => sum + p.count, 0);
console.log(`OK: um-anel compendium verified (${index.length} packs, ${total} entradas)`);
