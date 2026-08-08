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
import { readFileSync as rawReadFileSync } from "fs";

/* Normaliza CRLF -> LF na leitura.

   As asserções deste arquivo casam conteúdo com âncoras de início/fim de linha
   e com trechos multilinha. No Windows, um clone novo — ou qualquer
   `git checkout` com core.autocrlf — entrega CRLF, e aí `\n## Título\n` não
   casa porque vem `\r` antes do `\n`. Comparar conteúdo não deve depender de
   fim de linha: sem isto a suíte falha num repo recém-clonado, e passava aqui
   só porque as ferramentas que escreveram os arquivos usavam LF. */
const readFileSync = (p, enc) => rawReadFileSync(p, enc).replace(/\r\n/g, "\n");

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
// Bilíngue de propósito: estes capítulos vão sendo traduzidos ao longo da Fase
// B, e a afirmação tem que continuar sendo reconhecida em PT-BR. Sem isso o
// teste passa a falhar a cada tradução (aconteceu ao traduzir o capítulo 2).
const TN_STATEMENT = /\b20 (minus|menos)\b/g;
let tnStatements = 0;
for (const f of TN_SOURCES) {
  const src = readFileSync(root("livros", "um-anel", f), "utf8");
  const hits = (src.match(TN_STATEMENT) || []).length;
  ok(`${f} afirma NA = 20 − Atributo`, hits >= 1, `achou ${hits}`);
  tnStatements += hits;
}
ok(
  "livro afirma NA = 20 − Atributo em 4+ pontos",
  tnStatements >= 4,
  `achou ${tnStatements}`
);
/* O 20 deixou de ser literal e virou o PADRÃO do parâmetro, quando a variante de
   NA 18 entrou como opção de mesa (quadro "Ajustando os Números-Alvo"). O que
   este teste protege continua sendo o mesmo: quem não escolheu nada joga com 20. */
ok(
  "rules.ts::attributeTN tem 20 como padrão",
  /export function attributeTN\(score: number, base = 20\)/.test(stripComments(RULES))
);
ok(
  "rules.ts NÃO fixa o 18 impresso nas fichas",
  !/base = 18/.test(stripComments(RULES)) && !/return 18 - score/.test(stripComments(RULES)),
  "18 é opção de campanha, nunca o padrão"
);
// O 18 é regra opcional oficial. Se este box sair do markdown, o comentário
// de pregens.ts passa a mentir — então a explicação tem que CONTINUAR lá.
ok(
  "livro documenta a variante 18 pra campanha curta",
  /(subtracting their Attributes from 18 instead|subtraindo os Atributos de \*\*18\*\* em vez disso)/.test(
    readFileSync(root("livros", "um-anel", "02-resolucao-de-acoes.md"), "utf8")
  )
);

/* ── 2. Bases culturais: livro × data.ts ────────────────────────────────
   Todas as 6 culturas do capítulo 3, não só as duas dos pré-gerados. */

/**
 * Nome de cada Cultura no livro, por id, LIDO DE data.ts.
 *
 * Antes era um mapa fixo com os nomes em inglês, e quebrou inteiro quando o
 * capítulo 3 foi traduzido. Derivar do `name` de data.ts resolve duas coisas de
 * uma vez: acompanha a tradução sozinho, e passa a exigir que o heading do livro
 * e o rótulo exibido no app sejam a MESMA string — se alguém renomear a Cultura
 * só num lado, isto acusa.
 *
 * Os nomes em inglês ficam como alternativa porque o capítulo pode ser
 * re-extraído do PDF antes de ser traduzido de novo.
 */
const NOME_EN_POR_ID = {
  bardos: "Bardings",
  anoes: "Dwarves of Durin's Folk",
  elfos: "Elves of Lindon",
  hobbits: "Hobbits of the Shire",
  "homens-de-bri": "Men of Bree",
  rangers: "Rangers of the North",
};

/** Lê `name` do bloco daquela Cultura em data.ts. */
function dataCultureName(id) {
  const start = DATA.indexOf(`id: "${id}",`);
  if (start < 0) return null;
  const m = DATA.slice(start, start + 400).match(/name:\s*"([^"]+)"/);
  return m ? m[1] : null;
}

/** Encontra o corpo da seção `## <Cultura>` no livro, em PT-BR ou inglês. */
function bookCultureBody(id) {
  for (const nome of [dataCultureName(id), NOME_EN_POR_ID[id]]) {
    if (!nome) continue;
    const start = BOOK.indexOf(`\n## ${nome}\n`);
    if (start < 0) continue;
    const next = BOOK.indexOf("\n## ", start + 4);
    return { nome, body: BOOK.slice(start, next < 0 ? BOOK.length : next) };
  }
  return null;
}

/** Bases derivadas de uma Cultura, lidas da tabela de Estatísticas Derivadas. */
function bookDerived(id) {
  const secao = bookCultureBody(id);
  if (!secao) return null;
  // Rótulos bilíngues: a tabela é `| Resistência | FORÇA + 18 |` em PT-BR e
  // `| Endurance | STRENGTH + 18 |` em inglês.
  const grab = (stats, attrs) => {
    const m = secao.body.match(
      new RegExp(`\\|\\s*(?:${stats})\\s*\\|\\s*(?:${attrs})\\s*\\+\\s*(\\d+)\\s*\\|`, "i")
    );
    return m ? Number(m[1]) : null;
  };
  return {
    endurance: grab("Endurance|Resistência", "STRENGTH|FORÇA"),
    hope: grab("Hope|Esperança", "HEART|CORAÇÃO"),
    parry: grab("Parry|Bloqueio", "WITS|ASTÚCIA"),
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

for (const id of Object.keys(NOME_EN_POR_ID)) {
  const nome = dataCultureName(id) ?? id;
  const secao = bookCultureBody(id);
  ok(`${nome}: seção achada no livro`, Boolean(secao), `id=${id}`);
  const book = bookDerived(id);
  const code = dataDerived(id);
  ok(`${nome}: tabela lida do livro`, book && book.endurance !== null, JSON.stringify(book));
  ok(`${nome}: bases derivadas batem com data.ts`,
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

function bookAttributeSets(id) {
  const secao = bookCultureBody(id);
  if (!secao) return [];
  // Recorta ENTRE os dois headings pra não capturar a tabela de Perícias, que
  // vem depois e também tem 4 colunas numéricas.
  const inicio = secao.body.search(/^### (Attributes|Atributos)\s*$/m);
  const fim = secao.body.search(/^### (Derived Stats|Estatísticas Derivadas)\s*$/m);
  if (inicio < 0 || fim < 0 || fim <= inicio) return [];
  const table = secao.body.slice(inicio, fim);
  return [...table.matchAll(/^\|\s*[1-6]\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|/gm)].map(
    (m) => ({ forca: Number(m[1]), coracao: Number(m[2]), argucia: Number(m[3]) })
  );
}

const HOBBIT_SETS = bookAttributeSets("hobbits");
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

/* ── Virtude Mão Firme: texto completo em data.ts, abreviado em pregens.ts ──
   Achado na rodada 6: `data.ts` guardava só a metade do Golpe Pesado do texto
   do capítulo 5, apagando "+1 ao resultado numérico do Dado de Proeza em um
   Golpe Perfurante" — que é a metade que mais pesa, porque pode levar um 9 a 10
   e disparar o Golpe Perfurante.

   Os DOIS lados precisam de guarda, e eles divergem de propósito:
   - `data.ts` é a regra jogável → texto completo do capítulo 5.
   - `pregens.ts` reproduz a ficha do Starter Set, que traz o resumo curto →
     fica curto, por fidelidade ao material. "Consertar" ali seria errado. */

const CAP5 = readFileSync(root("livros", "um-anel", "05-valor-e-sabedoria.md"), "utf8");
const DATA_TS = readFileSync(root("lib", "character", "um-anel", "data.ts"), "utf8");

ok(
  "livro (cap.5): Mão Firme tem as duas metades",
  /some \+1 ao seu valor de FORÇA em um Golpe Pesado, e \+1 ao resultado numérico do Dado de Proeza em um Golpe Perfurante/i.test(
    CAP5
  )
);

const maoFirmeData = DATA_TS.match(/id: "mao-firme",[^}]*?description: "([^"]+)"/);
ok("data.ts tem a Virtude Mão Firme", Boolean(maoFirmeData));
ok(
  "data.ts: Mão Firme cobre o Golpe Pesado",
  maoFirmeData && /Golpe Pesado/.test(maoFirmeData[1])
);
/* A segunda metade continua exigida, agora com o nome certo do gasto.
   O capítulo diz "em um Golpe Perfurante", mas Golpe Perfurante não é opção de
   Dano Especial — e depois de disparado o valor do Dado de Proeza não é mais
   consultado, o que tornaria o +1 inerte. O Dano Especial que soma no Dado de
   Proeza é PERFURAR. Ver a nota de leitura no capítulo 5 e
   scripts/verify-um-anel-dano-especial.mjs. */
ok(
  "data.ts: Mão Firme cobre a segunda metade (o +1 ao Perfurar)",
  maoFirmeData && /Dado de Proeza ao Perfurar/.test(maoFirmeData[1]),
  maoFirmeData?.[1]
);

// A ficha do Balin no Starter Set traz só o resumo — pregens.ts acompanha ela.
const maoFirmePregen = PREGENS.match(/name: "Mão Firme", text: "([^"]+)"/);
ok("pregens.ts tem Mão Firme (ficha do Balin)", Boolean(maoFirmePregen));
ok(
  "pregens.ts mantém o texto curto da ficha do Starter Set",
  maoFirmePregen && !/Golpe Perfurante/.test(maoFirmePregen[1]),
  maoFirmePregen?.[1]
);
ok(
  "markdown da ficha do Balin também traz só o resumo",
  /Mão Firme \(soma \+1 ao dano infligido em um Golpe Pesado\)/.test(SHEET_MD)
);

/* ── Virtudes e Recompensas devem carregar a regra do capítulo 5 ───────────
   O capítulo 3 apresenta a mesma lista de forma ABREVIADA (é resumo de criação
   de personagem); o capítulo 5 é quem DEFINE cada Virtude e Recompensa. Copiar
   o resumo do capítulo 3 para o app perde conteúdo mecânico — em Mão Firme
   perdia um efeito inteiro, em Cruel perdia a cláusula das armas de mão-e-meia
   (afeta 3 armas com dois valores de Ferimento), em Confiança/Robustez perdia a
   palavra "máximo", que é o que distingue o valor máximo do atual.

   Regra do projeto que estes testes fixam: `data.ts` carrega o texto do
   capítulo 5. `pregens.ts` é exceção — reproduz a ficha do Starter Set. */

const desc = (id) => {
  const m = DATA_TS.match(new RegExp(`id: "${id}",[^}]*?description: "([^"]+)"`));
  return m ? m[1] : null;
};

// Cruz: a cláusula de mão-e-meia só importa porque existem armas com dois
// valores de Ferimento. Se um dia não houver, a asserção perde sentido.
const dualInjuryWeapons = [...DATA_TS.matchAll(/injury: "(\d+) \(1m\) \/ (\d+) \(2m\)"/g)];
ok(
  "data.ts tem armas com dois valores de Ferimento",
  dualInjuryWeapons.length >= 3,
  `achou ${dualInjuryWeapons.length}`
);
ok(
  "livro (cap.5): Cruel dá o bônus nos DOIS valores de Ferimento",
  /recebe o bônus em ambos os seus valores de Ferimento/i.test(CAP5)
);
ok(
  "data.ts: Cruel traz a cláusula de mão-e-meia",
  /ambos os seus valores de Ferimento/.test(desc("cruel") || ""),
  desc("cruel")
);

for (const [id, stat] of [
  ["confianca", "Esperança"],
  ["robustez", "Resistência"],
]) {
  ok(
    `livro (cap.5): ${id} aumenta o valor MÁXIMO de ${stat}`,
    new RegExp(`Aumente em 2 pontos seu valor máximo de ${stat}`, "i").test(CAP5)
  );
  ok(
    `data.ts: ${id} diz "valor máximo", não o valor atual`,
    new RegExp(`valor máximo de ${stat}`).test(desc(id) || ""),
    desc(id)
  );
}

/* ── Nome da tarefa de combate: Virtude × motor ──────────────────────────
   A Virtude Cultural "Realeza Revelada" manda tentar uma tarefa de combate da
   postura Aberta. Se o nome ali divergir do nome em stances.ts, o Mestre
   procura uma tarefa que o app não tem. */

const VIRT = readFileSync(root("lib", "character", "um-anel", "cultural-virtues.ts"), "utf8");
const STANCES = readFileSync(root("lib", "combat", "um-anel", "stances.ts"), "utf8");
const abertaTask = STANCES.match(/aberta:[\s\S]{0,400}?combatTask: "([^"]+)"/);
ok("stances.ts define a tarefa da postura Aberta", Boolean(abertaTask), abertaTask?.[1]);
ok(
  `Virtude Cultural usa o nome do motor ("${abertaTask?.[1]}")`,
  abertaTask && VIRT.includes(abertaTask[1]),
  `motor="${abertaTask?.[1]}"`
);
// O nome antigo não pode voltar por copiar/colar de outra fonte.
ok(
  'nenhuma Virtude usa "Reanimar Companheiros"',
  !/Reanimar Companheiros/.test(stripComments(VIRT))
);

/* ── Criação de personagem: 4 achados da auditoria do capítulo 3 ──────── */

const WIZ = readFileSync(root("lib", "character", "um-anel", "build-from-wizard.ts"), "utf8");
const RULES_TS = readFileSync(root("lib", "character", "um-anel", "rules.ts"), "utf8");
const CAP3 = readFileSync(root("livros", "um-anel", "03-aventureiros.md"), "utf8");

/* 1. A Cultura COPIA graduações de Proficiência (2 numa do par, 1 numa à
      escolha) — não incrementa. Com `+= 1`, escolher a MESMA Proficiência nas
      duas dava graduação 3 de graça: o mesmo degrau que custaria 6 dos 10 pontos
      de Experiência Prévia. */
ok(
  "Proficiência da escolha B usa Math.max, não +=",
  /combatProficiencies\[draft\.combatProficiencyChoiceB!\] = Math\.max\(/.test(WIZ)
);
ok(
  "escolha B NÃO incrementa",
  !/combatProficiencies\[draft\.combatProficiencyChoiceB!\] \+= 1/.test(WIZ)
);

/* 2. Traço da Vocação entra UMA vez. O Campeão gravava o genérico E o
      especializado, terminando com 4 Traços Distintivos em vez de 3. */
ok(
  "traço da Vocação entra uma vez (especializado OU genérico)",
  /especializado \?\? calling\.traitId/.test(WIZ)
);
ok(
  "não empilha mais o genérico junto do especializado",
  !/distinctiveFeatures\.push\(`\$\{calling\.traitId\}:/.test(WIZ)
);

/* 3. Bênção que dá +1 num Atributo é reconhecida por FLAG, não pelo id
      "rangers" — os Altos-Elfos de Valfenda têm a mesma mecânica e perdiam o
      ponto (e com ele 1 de NA e 1 na derivada correspondente). */
ok("tipo de Cultura tem a flag do +1 de Atributo", /blessingAttributeBonus\?: boolean;/.test(DATA_TS));
ok(
  "Rangers e Altos-Elfos têm a flag",
  (DATA_TS.match(/blessingAttributeBonus: true/g) || []).length >= 2
);
ok(
  "criação aplica o +1 pela flag, não pelo id",
  /culture\.blessingAttributeBonus && draft\.rangerAttributeBonus/.test(WIZ) &&
    !/culture\.id === "rangers"/.test(WIZ)
);
// O texto das duas Bênçãos tem de continuar prometendo o ponto.
ok(
  "livro: Bênção dos Rangers dá +1 num Atributo",
  /Adicione 1 ponto a um Atributo à sua escolha/.test(CAP3)
);

/* 4. Virtude inicial de valor fixo soma nas derivadas — o livro manda anotar a
      derivada JÁ com o efeito ("já contado no total" nas fichas do Starter Set).
      Antes a Virtude era só um id numa lista e nada somava: herói com Confiança
      ficava com Esperança máxima 2 abaixo, e o limiar de Desfavorecido (que usa
      hopeMax) saía errado junto. */
const virtueBonusBody = RULES_TS.slice(
  RULES_TS.indexOf("export function torVirtueDerivedBonus"),
  RULES_TS.indexOf("export function computeDerivedStats")
);
ok("torVirtueDerivedBonus existe", virtueBonusBody.length > 100);
ok('Robustez soma 2 na Resistência máxima', /has\("robustez"\) \? 2 : 0/.test(virtueBonusBody));
ok('Confiança soma 2 na Esperança máxima', /has\("confianca"\) \? 2 : 0/.test(virtueBonusBody));
ok('Agilidade soma 1 no Bloqueio', /has\("agilidade-de-aparar"\) \? 1 : 0/.test(virtueBonusBody));
ok(
  "criação soma o bônus da Virtude nas três derivadas",
  /enduranceMax: base\.enduranceMax \+ virtueBonus\.enduranceMax/.test(WIZ) &&
    /hopeMax: base\.hopeMax \+ virtueBonus\.hopeMax/.test(WIZ) &&
    /parry: base\.parry \+ virtueBonus\.parry/.test(WIZ)
);
// Os valores têm de bater com as descrições que o app exibe.
for (const [id, texto] of [
  ["robustez", "Aumente em 2 pontos seu valor máximo de Resistência"],
  ["confianca", "Aumente em 2 pontos seu valor máximo de Esperança"],
  ["agilidade-de-aparar", "Aumente seu valor de Bloqueio em 1"],
]) {
  ok(
    `descrição de "${id}" bate com o bônus aplicado`,
    new RegExp(`id: "${id}"[^}]*?${texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(DATA_TS)
  );
}

/* 5. Nome do traço cultural dos Hobbits — o app mostrava "Meios-Homens", string
      que não existe em livros/um-anel/. Mesmo modo de falha de "Reanimar
      Companheiros": o Mestre procura no livro pelo nome do app e não acha. */
ok('traço dos Hobbits é "Pequenos"', /extraTraitName: "Pequenos"/.test(DATA_TS));
ok('"Meios-Homens" não voltou', !/Meios-Homens/.test(DATA_TS));
ok("livro tem a seção Pequenos", /^### Pequenos$/m.test(CAP3));

console.log(`\nverify-um-anel-pregens: ${pass} passaram, ${fail} falharam`);
if (fail > 0) process.exit(1);
