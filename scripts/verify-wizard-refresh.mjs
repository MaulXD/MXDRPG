/**
 * Todo ponto de saída bem-sucedido dos assistentes de criação atualiza a árvore
 * do servidor.
 *
 * POR QUE ESTE TESTE EXISTE. `CharacterCreationWizard` tem TRÊS saídas de sucesso:
 * edição salva, criação com navegação, e criação embutida na mesa (`onCreated`).
 * As duas primeiras chamavam `router.refresh()`; a terceira fazia
 * `onCreated(...); return;` e saía antes. Resultado: **quem criava personagem
 * dentro da mesa não via a ficha aparecer até recarregar a página na mão.**
 *
 * `onCreated` atualiza o snapshot da SALA (o `refresh()` do room-sync). Isso é
 * outra coisa: os dados de ficha na mesa vêm de Server Component e só se renovam
 * com `router.refresh()`. Precisa dos dois — e essa distinção é justamente o que
 * fazia o defeito passar por revisão de código.
 *
 * O MESMO defeito estava nos DOIS assistentes (Eldarin e O Um Anel), no mesmo
 * lugar. Por isso a checagem varre o diretório de assistentes em vez de olhar um
 * arquivo: consertar um e deixar o outro é o padrão 18 deste repositório.
 */
import { readFileSync as rawReadFileSync, readdirSync } from "fs";

const readFileSync = (p, enc) => rawReadFileSync(p, enc).replace(/\r\n/g, "\n");

import { join, dirname, relative } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = (...p) => join(__dirname, "..", ...p);
const rel = (p) => relative(root(), p).replace(/\\/g, "/");

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

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

console.log("verify-wizard-refresh: criar personagem aparece sem recarregar a página");

const DIR = root("components", "character", "wizard");
const ASSISTENTES = readdirSync(DIR)
  .filter((f) => /CreationWizard\.tsx$/.test(f))
  .map((f) => join(DIR, f));

/* Se o nome do arquivo mudar, é melhor falhar do que examinar zero arquivos. */
ok(
  `achou os assistentes de criação (${ASSISTENTES.length})`,
  ASSISTENTES.length >= 2,
  `procurei *CreationWizard.tsx em ${rel(DIR)}`
);

/**
 * Recorta o bloco `if (onCreated) { … }` — o ponto de saída da mesa.
 *
 * Recorte por BLOCO, contando chaves, não por janela de linhas: já paguei essa
 * lição neste repositório com uma asserção que não viu um campo por causa de
 * comentários no meio.
 */
function blocoOnCreated(src) {
  const i = src.indexOf("if (onCreated)");
  if (i < 0) return null;
  let nivel = 0;
  let comecou = false;
  for (let j = i; j < src.length; j++) {
    if (src[j] === "{") {
      nivel++;
      comecou = true;
    } else if (src[j] === "}") {
      nivel--;
      if (comecou && nivel === 0) return src.slice(i, j + 1);
    }
  }
  return null;
}

/* Sanidade da função: sem isso, um recorte quebrado faria tudo passar. */
ok(
  "blocoOnCreated recorta o bloco inteiro",
  blocoOnCreated("if (onCreated) { a(); b(); }\nc();") === "if (onCreated) { a(); b(); }"
);
ok(
  "blocoOnCreated não vaza para depois do bloco",
  !blocoOnCreated("if (onCreated) { a(); }\nrouter.refresh();").includes("router.refresh")
);
ok("blocoOnCreated devolve null quando não existe", blocoOnCreated("const x = 1;") === null);

for (const caminho of ASSISTENTES) {
  const nome = rel(caminho);
  const src = stripComments(readFileSync(caminho, "utf8"));

  /* Só cobra de quem TEM o caminho embutido — condicional, não universal. Um
     assistente sem `onCreated` não deve ser acusado de não ter o refresh dele. */
  const bloco = blocoOnCreated(src);
  if (!bloco) {
    ok(`  ${nome}: não tem caminho embutido (nada a exigir)`, true);
    continue;
  }

  ok(
    `  ${nome}: o caminho da mesa atualiza a árvore do servidor`,
    /router\.refresh\(\)/.test(bloco),
    "sem isso a ficha criada só aparece depois de recarregar a página na mão"
  );
  /* Lado OPOSTO: o refresh tem de vir ANTES do `return`, senão é inalcançável —
     exatamente o tipo de conserto que parece feito e não está. */
  const posRefresh = bloco.indexOf("router.refresh()");
  const posReturn = bloco.indexOf("return");
  ok(
    `  ${nome}: …e o refresh vem antes do return`,
    posRefresh >= 0 && posReturn >= 0 && posRefresh < posReturn,
    "refresh depois do return é código morto"
  );

  /* E os OUTROS pontos de saída continuam atualizando. A regra é "toda saída de
     sucesso atualiza", não "o caminho da mesa atualiza". */
  const total = [...src.matchAll(/router\.refresh\(\)/g)].length;
  ok(
    `  ${nome}: todas as saídas de sucesso atualizam (${total} chamadas)`,
    total >= 2,
    "eram 2 de 3 saídas antes desta correção"
  );
}

console.log(`\nverify-wizard-refresh: ${pass} ok, ${fail} falhas`);
if (fail > 0) process.exit(1);
