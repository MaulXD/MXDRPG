/**
 * Verifica os 8 pré-gerados do Starter Set contra as tabelas culturais do
 * livro — entra em `npm run test`.
 *
 * O ponto do teste: as fichas do PDF divergem do livro em DOIS lugares, com
 * diagnósticos opostos. Um foi corrigido (o NA é calculado ao vivo com a
 * fórmula do livro), o outro foi preservado por fidelidade (a Resistência dos
 * Hobbits fica +2). Sem este teste, alguém "arruma" o segundo recalculando e
 * quebra a fidelidade ao material, ou "arruma" o primeiro copiando o NA
 * impresso e quebra a regra.
 *
 * Fontes: livros/um-anel/11-personagens-exemplo.md (fichas)
 *         livros/um-anel/03-aventureiros.md (tabelas culturais)
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = (...p) => join(__dirname, "..", ...p);

const BOOK = readFileSync(root("livros", "um-anel", "03-aventureiros.md"), "utf8");
const SHEET_MD = readFileSync(root("livros", "um-anel", "11-personagens-exemplo.md"), "utf8");
const PREGENS = readFileSync(root("lib", "character", "um-anel", "pregens.ts"), "utf8");
const DATA = readFileSync(root("lib", "character", "um-anel", "data.ts"), "utf8");
const RULES = readFileSync(root("lib", "character", "um-anel", "rules.ts"), "utf8");

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

/** Remove comentários trocando por espaços (preserva offsets e linhas). */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/\/\/[^\n]*/g, (m) => m.replace(/[^\n]/g, " "));
}

console.log("verify-um-anel-pregens: fichas do Starter Set × tabelas culturais");

/* ── 1. A fórmula de NA do livro ────────────────────────────────────────
   O livro afirma "20 minus" em quatro pontos independentes, e o 18 impresso
   nas fichas do Starter Set é a variante oficial de campanha curta, não erro.
   A VTT implementa o padrão; se alguém trocar rules.ts pelo 18, isto acusa. */

const TN_SOURCES = [
  "02-resolucao-de-acoes.md",
  "03-aventureiros.md",
  "09-starter-set-regras-condensadas.md",
];
let tnStatements = 0;
for (const f of TN_SOURCES) {
  const src = readFileSync(root("livros", "um-anel", f), "utf8");
  tnStatements += (src.match(/20 minus (its corresponding )?[Aa]ttribute/g) || []).length;
}
ok(
  "livro afirma NA = 20 − Atributo em 4+ pontos",
  tnStatements >= 4,
  `achou ${tnStatements}`
);
ok("rules.ts::attributeTN usa 20 − Atributo", /return 20 - score;/.test(stripComments(RULES)));
ok(
  "rules.ts NÃO usa o 18 impresso nas fichas",
  !/return 18 - score/.test(stripComments(RULES))
);
// O 18 é regra opcional oficial. Se este box sair do markdown, o comentário
// de pregens.ts passa a mentir — então a explicação tem que CONTINUAR lá.
ok(
  "livro documenta a variante 18 pra campanha curta",
  /subtracting their Attributes from 18 instead/.test(
    readFileSync(root("livros", "um-anel", "02-resolucao-de-acoes.md"), "utf8")
  )
);

/* ── 2. Bases culturais: livro × data.ts ────────────────────────────────
   Todas as 6 culturas do capítulo 3, não só as duas dos pré-gerados. */

const BOOK_TO_ID = {
  "Bardings": "bardos",
  "Dwarves of Durin's Folk": "anoes",
  "Elves of Lindon": "elfos",
  "Hobbits of the Shire": "hobbits",
  "Men of Bree": "homens-de-bri",
  "Rangers of the North": "rangers",
};

/** Bases derivadas de uma cultura, lidas da tabela "Derived Stats" do livro. */
function bookDerived(cultureHeading) {
  const start = BOOK.indexOf(`\n## ${cultureHeading}\n`);
  if (start < 0) return null;
  const nextSection = BOOK.indexOf("\n## ", start + 4);
  const body = BOOK.slice(start, nextSection < 0 ? BOOK.length : nextSection);
  const grab = (stat, attr) => {
    const m = body.match(new RegExp(`\\|\\s*${stat}\\s*\\|\\s*${attr}\\s*\\+\\s*(\\d+)\\s*\\|`));
    return m ? Number(m[1]) : null;
  };
  return {
    endurance: grab("Endurance", "STRENGTH"),
    hope: grab("Hope", "HEART"),
    parry: grab("Parry", "WITS"),
  };
}

/** Bônus derivados de uma cultura em data.ts, escopado ao bloco daquele id. */
function dataDerived(id) {
  const start = DATA.indexOf(`id: "${id}",`);
  if (start < 0) return null;
  // Fecha o bloco no próximo `id:` de cultura, pra não vazar pro vizinho.
  const next = DATA.indexOf('\n    id: "', start + 5);
  const body = DATA.slice(start, next < 0 ? DATA.length : next);
  const grab = (field) => {
    const m = body.match(new RegExp(`${field}:\\s*(\\d+)`));
    return m ? Number(m[1]) : null;
  };
  return {
    endurance: grab("enduranceBonus"),
    hope: grab("hopeBonus"),
    parry: grab("parryBonus"),
  };
}

for (const [heading, id] of Object.entries(BOOK_TO_ID)) {
  const book = bookDerived(heading);
  const code = dataDerived(id);
  ok(`${heading}: tabela lida do livro`, book && book.endurance !== null, JSON.stringify(book));
  ok(`${heading}: bases derivadas batem com data.ts`,
    book && code &&
      book.endurance === code.endurance &&
      book.hope === code.hope &&
      book.parry === code.parry,
    `livro=${JSON.stringify(book)} código=${JSON.stringify(code)}`
  );
}

/* ── 3. Conjuntos oficiais de Atributos dos Hobbits ─────────────────────
   É a prova de que a coluna de "Valor" das fichas está certa e a de NA é
   que está errada: as 7 fichas Hobbit caem todas dentro desta tabela. */

function bookAttributeSets(cultureHeading) {
  const start = BOOK.indexOf(`\n## ${cultureHeading}\n`);
  const nextSection = BOOK.indexOf("\n## ", start + 4);
  const body = BOOK.slice(start, nextSection < 0 ? BOOK.length : nextSection);
  const attrStart = body.indexOf("### Attributes");
  const attrEnd = body.indexOf("### Derived Stats");
  const table = body.slice(attrStart, attrEnd);
  return [...table.matchAll(/^\|\s*[1-6]\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|/gm)].map(
    (m) => ({ forca: Number(m[1]), coracao: Number(m[2]), argucia: Number(m[3]) })
  );
}

const HOBBIT_SETS = bookAttributeSets("Hobbits of the Shire");
ok("livro: 6 conjuntos de Atributos pros Hobbits", HOBBIT_SETS.length === 6, `achou ${HOBBIT_SETS.length}`);

/* ── 4. Os 8 pré-gerados ────────────────────────────────────────────────── */

const pregenCode = stripComments(PREGENS);
const blocks = pregenCode.split(/\n  \{\n/).slice(1);

function pregen(block) {
  const g = (re) => {
    const m = block.match(re);
    return m ? m[1] : null;
  };
  const attrs = block.match(/attributes:\s*\{\s*forca:\s*(\d+),\s*coracao:\s*(\d+),\s*argucia:\s*(\d+)\s*\}/);
  return {
    id: g(/id: "([^"]+)"/),
    culture: g(/culture: "([^"]+)"/),
    attributes: attrs
      ? { forca: Number(attrs[1]), coracao: Number(attrs[2]), argucia: Number(attrs[3]) }
      : null,
    endurance: Number(g(/endurance: (\d+)/)),
    hope: Number(g(/hope: (\d+)/)),
    parry: Number(g(/parry: (\d+)/)),
    virtueNames: [...block.matchAll(/name: "([^"]+)", text:/g)].map((m) => m[1]),
  };
}

const PS = blocks.map(pregen).filter((p) => p.id && p.attributes);
ok("pregens.ts tem os 8 pré-gerados", PS.length === 8, `achou ${PS.length}`);

/** Bônus fixos de Virtude, com a Virtude que os produz — a ficha diz
 *  "já contado no total", então eles entram na derivada exibida. */
const VIRTUE_BONUS = {
  "drogo-bolseiro": { virtue: "Confiança", endurance: 0, hope: 2, parry: 0 },
  "paladin-took-ii": { virtue: "Agilidade", endurance: 0, hope: 0, parry: 1 },
  "rorimac-brandybuck": { virtue: "Robustez", endurance: 2, hope: 0, parry: 0 },
};

/** A divergência preservada: Resistência das fichas Hobbit vem +2. */
const HOBBIT_ENDURANCE_OFFSET = 2;

for (const p of PS) {
  const base = dataDerived(p.culture);
  const bonus = VIRTUE_BONUS[p.id] || { endurance: 0, hope: 0, parry: 0 };
  const offset = p.culture === "hobbits" ? HOBBIT_ENDURANCE_OFFSET : 0;

  ok(
    `${p.id}: Resistência = ${base.endurance} + Força + Virtude + ${offset}`,
    p.endurance === base.endurance + p.attributes.forca + bonus.endurance + offset,
    `ficha=${p.endurance} esperado=${base.endurance + p.attributes.forca + bonus.endurance + offset}`
  );
  ok(
    `${p.id}: Esperança = ${base.hope} + Coração + Virtude`,
    p.hope === base.hope + p.attributes.coracao + bonus.hope,
    `ficha=${p.hope} esperado=${base.hope + p.attributes.coracao + bonus.hope}`
  );
  ok(
    `${p.id}: Bloqueio = ${base.parry} + Astúcia + Virtude`,
    p.parry === base.parry + p.attributes.argucia + bonus.parry,
    `ficha=${p.parry} esperado=${base.parry + p.attributes.argucia + bonus.parry}`
  );

  // Um bônus de Virtude só vale se a Virtude estiver de fato na ficha.
  if (VIRTUE_BONUS[p.id]) {
    ok(
      `${p.id}: Virtude "${VIRTUE_BONUS[p.id].virtue}" está na ficha`,
      p.virtueNames.includes(VIRTUE_BONUS[p.id].virtue),
      p.virtueNames.join(" | ")
    );
  }

  // Hobbit: o trio de Atributos tem que ser um dos 6 conjuntos oficiais.
  if (p.culture === "hobbits") {
    ok(
      `${p.id}: Atributos são um conjunto oficial de Hobbit`,
      HOBBIT_SETS.some(
        (s) =>
          s.forca === p.attributes.forca &&
          s.coracao === p.attributes.coracao &&
          s.argucia === p.attributes.argucia
      ),
      JSON.stringify(p.attributes)
    );
  }
}

// Balin é o controle que isola o desvio: sendo Anão, fecha exato nas três
// sem offset nenhum. Se um dia ele precisar de offset, o diagnóstico do
// markdown ("confinado à Resistência Hobbit") caiu.
const balin = PS.find((p) => p.id === "balin-filho-de-fundin");
ok("Balin existe e é Anão", balin && balin.culture === "anoes", balin?.culture);
ok(
  "Balin fecha exato nas três derivadas (sem offset)",
  balin &&
    balin.endurance === dataDerived("anoes").endurance + balin.attributes.forca &&
    balin.hope === dataDerived("anoes").hope + balin.attributes.coracao &&
    balin.parry === dataDerived("anoes").parry + balin.attributes.argucia
);

// Os 6 conjuntos oficiais são todos usados pelas 7 fichas Hobbit (Bilbo
// repete o de Drogo). Se um conjunto sumir, alguém editou um Atributo.
const usedSets = new Set(
  PS.filter((p) => p.culture === "hobbits").map(
    (p) => `${p.attributes.forca}/${p.attributes.coracao}/${p.attributes.argucia}`
  )
);
ok("as 7 fichas Hobbit cobrem os 6 conjuntos oficiais", usedSets.size === 6, `${usedSets.size} distintos`);

/* ── 5. O markdown ────────────────────────────────────────────────────── */

ok(
  "11-personagens-exemplo.md está traduzido",
  !/aguardando tradução colaborativa/.test(SHEET_MD)
);
// A explicação das duas divergências precisa CONTINUAR no markdown — é o que
// impede que o próximo leitor trate os números como erro de transcrição.
ok(
  "markdown explica que o NA 18 é a variante oficial",
  /NA = 18 − Valor do Atributo/.test(SHEET_MD) &&
    /variante oficial de campanha curta/.test(SHEET_MD) &&
    /Tweaking the Target Numbers/.test(SHEET_MD)
);
ok(
  "markdown explica a divergência de Resistência",
  /2 pontos acima/.test(SHEET_MD) && /Balin, o único Anão, fecha exato/.test(SHEET_MD)
);
ok(
  "pregens.ts documenta as duas divergências",
  /Resistência dos Hobbits/.test(PREGENS) && /NA impresso/.test(PREGENS)
);

console.log(`\nverify-um-anel-pregens: ${pass} passaram, ${fail} falharam`);
if (fail > 0) process.exit(1);
