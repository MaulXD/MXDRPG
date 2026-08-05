/**
 * Detecta tradução TRUNCADA nos capítulos do Um Anel.
 *
 * Por que existe: `livros/um-anel/*.md` é a FONTE DA VERDADE de regras do
 * projeto — os testes de regra e as auditorias leem dali. Uma tradução que
 * resume em vez de traduzir não quebra nada visivelmente: ela só apaga regras,
 * e o apagamento passa por todos os outros gates. É a falha mais perigosa de
 * toda a Fase B.
 *
 * Como detecta: compara a contagem de HEADINGS (`#`) e de linhas de TABELA (`|`)
 * do arquivo atual com a versão no commit anterior. Heading é melhor métrica que
 * linha porque sobrevive à variação natural de comprimento entre inglês e
 * português — se o capítulo tinha 119 headings e passou a ter 58, metade do
 * conteúdo sumiu, independentemente de quantas linhas cada parágrafo ocupa.
 *
 * Uso: node scripts/verify-um-anel-traducao-completa.mjs [ref-git]
 *      (ref-git padrão: HEAD)
 */
import { readFileSync as rawReadFileSync, readdirSync } from "fs";

/* Normaliza CRLF -> LF na leitura.

   As asserções deste arquivo casam conteúdo com âncoras de início/fim de linha
   e com trechos multilinha. No Windows, um clone novo — ou qualquer
   `git checkout` com core.autocrlf — entrega CRLF, e aí `\n## Título\n` não
   casa porque vem `\r` antes do `\n`. Comparar conteúdo não deve depender de
   fim de linha: sem isto a suíte falha num repo recém-clonado, e passava aqui
   só porque as ferramentas que escreveram os arquivos usavam LF. */
const readFileSync = (p, enc) => rawReadFileSync(p, enc).replace(/\r\n/g, "\n");

import { execFileSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIR = join(ROOT, "livros", "um-anel");
const REF = process.argv[2] || "HEAD";

/** Tolerância: variação de estrutura aceitável (headings podem mudar 1-2 por
 *  ajuste editorial legítimo, como fundir dois boxes). Abaixo disso é perda. */
const MIN_RATIO = 0.9;

let pass = 0;
let fail = 0;

function ok(name, cond, detail = "") {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const countHeadings = (s) => (s.match(/^#{1,6} /gm) || []).length;
const countTableRows = (s) => (s.match(/^\|/gm) || []).length;

function atRef(relPath) {
  try {
    return execFileSync("git", ["show", `${REF}:${relPath}`], {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch {
    return null; // arquivo novo nesse ref
  }
}

console.log(`verify-um-anel-traducao-completa: estrutura atual vs ${REF}`);

const files = readdirSync(DIR)
  .filter((f) => f.endsWith(".md"))
  .sort();

ok("achou capítulos em livros/um-anel", files.length >= 10, `achou ${files.length}`);

for (const file of files) {
  const rel = `livros/um-anel/${file}`;
  const antes = atRef(rel);
  if (antes === null) {
    console.log(`  · ${file} — novo em ${REF}, sem base de comparação`);
    continue;
  }
  const agora = readFileSync(join(DIR, file), "utf8");

  const hAntes = countHeadings(antes);
  const hAgora = countHeadings(agora);
  const tAntes = countTableRows(antes);
  const tAgora = countTableRows(agora);

  // Só compara se havia estrutura pra comparar.
  if (hAntes >= 5) {
    ok(
      `${file}: headings preservados (${hAntes} → ${hAgora})`,
      hAgora >= Math.floor(hAntes * MIN_RATIO),
      `perdeu ${hAntes - hAgora} de ${hAntes}`
    );
  }
  if (tAntes >= 5) {
    ok(
      `${file}: linhas de tabela preservadas (${tAntes} → ${tAgora})`,
      tAgora >= Math.floor(tAntes * MIN_RATIO),
      `perdeu ${tAntes - tAgora} de ${tAntes}`
    );
  }

  // Marcador de pendência: se saiu, o capítulo tem de estar de fato traduzido.
  const marcadorAntes = /aguardando tradução colaborativa/.test(antes);
  const marcadorAgora = /aguardando tradução colaborativa/.test(agora);
  if (marcadorAntes && !marcadorAgora) {
    // Heurística de idioma: um capítulo em PT-BR tem palavras funcionais
    // portuguesas em abundância. Pega o caso de "removeu o marcador mas deixou
    // o corpo em inglês".
    const ptWords = (agora.match(/\b(de|que|para|com|não|uma|dos|das|seu|sua)\b/gi) || []).length;
    ok(
      `${file}: marcador removido E corpo em PT-BR`,
      ptWords >= 200,
      `só ${ptWords} palavras funcionais portuguesas`
    );
  }
}

console.log(`\nverify-um-anel-traducao-completa: ${pass} passaram, ${fail} falharam`);
if (fail > 0) process.exit(1);
