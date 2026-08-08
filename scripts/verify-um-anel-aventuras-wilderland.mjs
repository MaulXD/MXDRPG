/**
 * As aventuras de *Tales from Wilderland* convertidas da 1ª para a 2ª edição.
 *
 * Por que existe: uma aventura convertida é onde a conversão pode dar errado sem
 * fazer barulho. Um nome de perícia antigo que sobrou, um NA fixo que ficou, um
 * adversário citado que não existe no bestiário — nada disso quebra build nem
 * tipo. Só quebra na mesa, com o Mestre procurando um bloco que não está lá.
 *
 * Um arquivo só para TODAS as aventuras, e não um teste por aventura: as
 * checagens são as mesmas, e sete cópias divergiriam na primeira vez que uma
 * delas fosse melhorada. Cada aventura entra na lista `AVENTURAS` com as
 * checagens próprias dela em `extra`.
 *
 * O que se amarra:
 * 1. **toda citação CVR-xxx aponta para uma entrada que existe** na tabela de
 *    conversão — referência quebrada é pior que ausência de referência;
 * 2. **todo adversário citado existe** em `lib/character/um-anel/adversaries.ts`,
 *    com o rótulo que o Mestre lê;
 * 3. **nenhum termo de 1ª edição sobreviveu**; os que aparecem para serem
 *    NEGADOS aparecem no contexto certo, nunca como instrução.
 *
 * Fonte: livros/um-anel/1x-wilderland-*.md e
 * livros/um-anel/compendio/conversao-primeira-edicao.md.
 */
import { readFileSync as rawReadFileSync } from "fs";

const readFileSync = (p, enc) => rawReadFileSync(p, enc).replace(/\r\n/g, "\n");

import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = (...p) => join(__dirname, "..", ...p);

const TABELA = readFileSync(
  root("livros", "um-anel", "compendio", "conversao-primeira-edicao.md"),
  "utf8"
);
const ADVERSARIES = readFileSync(root("lib", "character", "um-anel", "adversaries.ts"), "utf8");

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

/** Corpo de uma entrada `## CVR-0NN — …` até a próxima. */
function entradaTabela(id) {
  const i = TABELA.indexOf(`## ${id} —`);
  if (i < 0) return "";
  const rest = TABELA.slice(i + 3);
  const j = rest.indexOf("\n## ");
  return j < 0 ? rest : rest.slice(0, j);
}

/**
 * Bloco de um adversário no bestiário, do `id:` até o início do próximo bloco.
 *
 * Cortar por um número fixo de caracteres não serve: o Arqueiro Goblin tem duas
 * Habilidades Sinistras e a segunda ("Veneno de Orc") caía fora de uma janela de
 * 800 — a asserção passava a acusar ausência de algo que estava lá.
 */
function blocoAdversario(id) {
  const i = ADVERSARIES.indexOf(`id: "${id}"`);
  if (i < 0) return "";
  const rest = ADVERSARIES.slice(i);
  const j = rest.indexOf('\n    id: "');
  return j < 0 ? rest : rest.slice(0, j);
}

console.log("verify-um-anel-aventuras-wilderland: as conversões fecham com a régua e o bestiário");

/* ══════════════════════════════════════════════════════════════════════
   As aventuras convertidas até agora
   ══════════════════════════════════════════════════════════════════════ */

const AVENTURAS = [
  {
    arquivo: "15-wilderland-01-nao-desvie-da-trilha.md",
    titulo: "Não Desvie da Trilha",
    /* Entradas da régua que ESTA aventura tem obrigação de usar. Se alguém
       apagar a citação, a conversão perde justamente a armadilha. */
    cvrObrigatorias: {
      "CVR-004": "Ódio × Resolução — os bandidos se rendem, e matá-los pode ser Malfeitoria",
      "CVR-013": "as perícias renomeadas",
      "CVR-016": "o NA fixo que some",
      "CVR-017": "a dificuldade que vira Complicação/Vantagem",
      "CVR-020": "a Tolerância que vira Conselho",
      "CVR-024": "o teste de corrupção que vira Teste de Sombra",
      "CVR-028": "as Fontes de Dano, lidas ao contrário",
      "CVR-030": "a lacuna do bloco de Aranha",
    },
    /* Rótulo lido pelo Mestre → id do bloco no bestiário. */
    adversarios: {
      Salteador: "batedor-de-bolsos",
      "Chefe dos Rufiões": "chefe-arruaceiro",
      "Ladrão de Estrada": "assaltante-de-estrada",
    },
    /* Quantos blocos de estatística em tabela a aventura pode ter. */
    blocosEsperados: 1,
    extra(AV) {
      for (const [campo, valor] of [
        ["Nível de Atributo", "4"],
        ["Resistência", "45"],
        ["Vigor", "2"],
        ["Ódio", "6"],
        ["Bloqueio", "4"],
        ["Armadura", "3"],
      ]) {
        ok(
          `  Coisa do Fosso: ${campo} = ${valor}`,
          new RegExp(`\\| ${campo} \\| ${valor} \\|`).test(AV)
        );
      }
      /* O Vigor é a única linha que a 1ª edição não tinha. Só pode ser afirmado
         porque o TEXTO da aventura diz "Ferida duas vezes" — e a justificativa
         tem de estar escrita, não subentendida. */
      ok(
        "  o Vigor 2 vem do texto, e a justificativa está escrita",
        /Ferida \*\*duas vezes\*\*/.test(AV) &&
          /Vigor é[\s>]*exatamente o número de Ferimentos/.test(AV),
        "sem a justificativa escrita, Vigor 2 seria estimativa disfarçada"
      );
      ok(
        "  Agarrar existe como Dano Especial no bestiário",
        /specialDamage: \["Agarrar"\]/.test(ADVERSARIES) && /\| Agarrar \|/.test(AV)
      );
      ok(
        "  Grande Tamanho virou criatura grande, que o motor conhece",
        /large: true/.test(ADVERSARIES) && /criatura grande para os limites de engajamento/.test(AV)
      );
      /* Bandidos são Homens Maus: Resolução, não Ódio. Se o bestiário mudar, o
         parágrafo sobre Malfeitoria vira mentira. */
      for (const id of ["batedor-de-bolsos", "chefe-arruaceiro", "assaltante-de-estrada"]) {
        ok(
          `  "${id}" tem Resolução, como a aventura afirma`,
          /hateKind: "resolve"/.test(blocoAdversario(id)),
          "a aventura diz que atacá-los pode ser Malfeitoria — isso só vale para Resolução"
        );
      }
    },
  },
  {
    arquivo: "16-wilderland-02-sobre-ervas-e-hobbits-cozidos.md",
    titulo: "Sobre Ervas e Hobbits Cozidos",
    cvrObrigatorias: {
      "CVR-004": "aqui os inimigos são de Ódio, ao contrário da aventura 1",
      "CVR-012": "as Habilidades Sinistras reaproveitadas do bestiário",
      "CVR-013": "as perícias renomeadas",
      "CVR-016": "o NA fixo que some",
      "CVR-017": "a dificuldade que vira Complicação/Vantagem",
      "CVR-019": "as ações prolongadas que viram Empreitada de Perícia",
      "CVR-020": "a Tolerância que vira Conselho",
      "CVR-021": "os testes de fadiga que viram Eventos de Jornada",
      "CVR-024": "o teste de corrupção que vira Teste de Sombra",
      "CVR-030": "as lacunas — Aranha e Prestígio",
    },
    adversarios: {
      "Arqueiro Goblin": "arqueiro-goblin",
      "Soldado Orc": "soldado-orc",
      "Guarda Orc": "guarda-orc",
      "Cacique Orc": "cacique-orc",
      Warg: "warg",
      "Troll das Cavernas Furtivo": "cave-troll-furtivo",
    },
    blocosEsperados: 1,
    extra(AV) {
      for (const [campo, valor] of [
        ["Nível de Atributo", "4"],
        ["Resistência", "54"],
        ["Ódio", "8"],
        ["Bloqueio", "7"],
        ["Armadura", "4"],
      ]) {
        ok(
          `  Fantasma da Noite: ${campo} = ${valor}`,
          new RegExp(`\\| ${campo} \\| ${valor} \\|`).test(AV)
        );
      }
      /* O contraste com a aventura 1: aqui o texto NÃO resolve o Vigor, então o
         campo fica declarado como lacuna em vez de receber um número. */
      ok(
        "  o Vigor do Fantasma fica em branco, declarado como lacuna",
        /\| Vigor \| \*\*lacuna/.test(AV) && !/\| Vigor \| \d+ \|/.test(AV),
        "o texto desta aventura não diz quantas Feridas o abatem — inventar seria estimativa"
      );
      ok(
        "  e a lacuna do Vigor está explicada no fim",
        /## Lacunas registradas/.test(AV) && /Vigor do Fantasma da Noite/.test(AV)
      );
      /* As quatro Habilidades Sinistras vêm do bestiário, com o nome de lá. */
      for (const hab of ["Medo do Fogo", "Habitante das Trevas", "Velocidade Serpentina", "Covarde"]) {
        ok(
          `  Habilidade Sinistra "${hab}" existe no bestiário com esse nome`,
          new RegExp(`name: "${hab}"`).test(ADVERSARIES) && AV.includes(hab)
        );
      }
      /* A diferença de ritmo do Medo do Fogo precisa estar avisada — usar a
         versão da 2ª edição muda a luta, e o Mestre tem de saber. */
      ok(
        "  a mudança de ritmo do Medo do Fogo está avisada",
        /Atenção à Medo do Fogo/.test(AV) && /1 por rodada/.test(AV)
      );
      /* O Arqueiro Goblin envenena, e a aventura amarra isso à regra de Veneno
         — inclusive dizendo que a flecha do pônei NÃO estava envenenada. */
      ok(
        "  o Arqueiro Goblin tem Veneno de Orc no bestiário",
        /name: "Veneno de Orc"/.test(blocoAdversario("arqueiro-goblin"))
      );
      ok(
        "  e a aventura usa a regra de Veneno da 2ª edição",
        /não pode descansar/.test(AV) && /Runa de Gandalf/.test(AV)
      );
      /* Orcs e Goblins são de ÓDIO — o oposto dos bandidos da aventura 1. */
      for (const id of ["arqueiro-goblin", "soldado-orc", "guarda-orc", "cacique-orc"]) {
        ok(
          `  "${id}" tem Ódio, como a aventura afirma`,
          /hateKind: "hate"/.test(blocoAdversario(id)),
          "a aventura diz que matá-los NÃO levanta Malfeitoria — isso só vale para Ódio"
        );
      }
    },
  },
];

/* ══════════════════════════════════════════════════════════════════════
   Checagens comuns a todas
   ══════════════════════════════════════════════════════════════════════ */

/* Termos que não podem aparecer NUNCA — nem para explicar. */
const PROIBIDOS = [
  ["Tiro Certeiro", "Dano Especial"],
  ["pontos? de tesouro", "ponto de Tesouro"],
];

/* Termos que PODEM aparecer, mas só dizendo no que viraram. Banir a palavra
   inteira falharia contra o próprio resumo da conversão — a mesma armadilha do
   "Parada" na tabela de conversão. Então se fixa o CONTEXTO. */
const SO_PARA_NEGAR = [
  ["[Cc]omitiva", "Companhia"],
  ["Tolerância", "Conselho"],
  ["[Tt]estes? de corrup[çc][ãa]o", "Teste de Sombra"],
  ["Fase em Sociedade", "Fase de Companhia"],
  ["Called Shot", "Dano Especial"],
];

for (const av of AVENTURAS) {
  console.log(`\n── ${av.titulo} ──`);
  const AV = readFileSync(root("livros", "um-anel", av.arquivo), "utf8");

  /* 1. Citações da régua ------------------------------------------------ */
  const citados = [...new Set([...AV.matchAll(/\bCVR-\d{3}\b/g)].map((m) => m[0]))].sort();
  ok(
    `cita a régua de conversão (${citados.length} entradas)`,
    citados.length >= 10,
    "conversão sem referência é conversão sem régua"
  );
  for (const id of citados) {
    ok(
      `  citação ${id} existe na tabela`,
      entradaTabela(id).length > 0,
      "referência quebrada manda o Mestre procurar o que não existe"
    );
  }
  for (const [id, porque] of Object.entries(av.cvrObrigatorias)) {
    ok(`  usa ${id} (${porque})`, AV.includes(id));
  }

  /* 2. Adversários ------------------------------------------------------ */
  for (const [rotulo, id] of Object.entries(av.adversarios)) {
    ok(
      `  adversário "${rotulo}" (${id}) existe no bestiário`,
      AV.includes(rotulo) &&
        AV.includes(`\`${id}\``) &&
        ADVERSARIES.includes(`name: "${rotulo}"`) &&
        ADVERSARIES.includes(`id: "${id}"`),
      "o id nunca aparece sozinho na tela — o Mestre lê o rótulo, e o id acha o bloco"
    );
  }

  /* 3. Termos de 1ª edição --------------------------------------------- */
  for (const [termo, viraram] of PROIBIDOS) {
    ok(
      `  "${termo}" não sobreviveu (virou ${viraram})`,
      !new RegExp(termo).test(AV),
      "sem exceção: nem no resumo esse termo precisa aparecer"
    );
  }
  /* Nem toda aventura precisa citar todo termo antigo — só quem converte aquilo.
     A regra é condicional: SE aparecer, tem de estar dizendo no que virou.

     A frase é delimitada por PONTO, não por quebra de linha: o markdown quebra
     no meio da frase, e `[^.\n]*` cortava "O `Called Shot`" da explicação que
     vinha na linha seguinte — acusando texto correto. */
  for (const [termo, viraram] of SO_PARA_NEGAR) {
    const frases = [...AV.matchAll(new RegExp(`[^.]*${termo}[^.]*`, "g"))].map((m) => m[0]);
    const soltas = frases.filter((f) => !/vir(ou|aram)|original/.test(f));
    ok(
      `  "${termo}" ${frases.length === 0 ? "não aparece" : `só aparece dizendo que virou ${viraram}`}`,
      soltas.length === 0,
      soltas.map((f) => f.replace(/\s+/g, " ").trim().slice(0, 90)).join(" | ")
    );
  }
  ok("  o Teste de Sombra aparece no lugar da corrupção", /Teste de Sombra/.test(AV));

  /* NA fixo: pode ser MENCIONADO ao explicar o original, nunca como instrução.
     Dois dígitos de propósito — "a 2ª edição rola contra o NA do Atributo" é a
     forma CERTA e não pode ser acusada por causa do "2ª". */
  const mencoesNA = [...AV.matchAll(/[^.\n]*\bNA\b(?: de)? \d{2}[^.\n]*/g)].map((m) => m[0]);
  const semOriginal = mencoesNA.filter((f) => !/original/.test(f));
  ok(
    "  todo NA numérico só aparece explicando o ORIGINAL",
    semOriginal.length === 0,
    semOriginal.map((f) => f.trim().slice(0, 90)).join(" | ")
  );

  /* 4. Lacunas e blocos inventados -------------------------------------- */
  ok(
    "  a lacuna do bloco de Aranha continua declarada",
    /## Lacunas registradas/.test(AV) && /bloco de Aranha/i.test(AV)
  );
  const blocos = [...AV.matchAll(/\| Nível de Atributo \| \d+ \|/g)];
  ok(
    `  só existem ${av.blocosEsperados} bloco(s) de estatística`,
    blocos.length === av.blocosEsperados,
    `achei ${blocos.length}; um bloco a mais seria estatística inventada`
  );

  /* 5. Checagens próprias da aventura ----------------------------------- */
  av.extra(AV);
}

/* ══════════════════════════════════════════════════════════════════════
   A lacuna das Aranhas ainda é lacuna
   ══════════════════════════════════════════════════════════════════════ */

console.log("\n── lacunas ──");
ok(
  "o bestiário traduzido continua sem bloco de Aranha",
  !/id: "aranha/i.test(ADVERSARIES) && !/name: "Aranha/i.test(ADVERSARIES),
  "se um bloco aparecer, as seções de lacuna das aventuras precisam mudar"
);
ok(
  "e a régua continua registrando a lacuna",
  /Aranha/.test(entradaTabela("CVR-030"))
);

console.log(`\nverify-um-anel-aventuras-wilderland: ${pass} ok, ${fail} falhas`);
if (fail > 0) process.exit(1);
