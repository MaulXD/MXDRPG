/**
 * *O Escurecimento da Floresta das Trevas* convertido para a 2ª edição.
 *
 * Por que existe SEPARADO do de Wilderland: lá cada arquivo é uma aventura solta
 * (uma trama, um clímax, um bloco de estatística por vilão). Aqui cada arquivo é
 * um BLOCO DE ANOS de uma campanha de trinta anos, e a forma que precisa ser
 * vigiada é outra — todo ano tem de ter Eventos, Fase de aventura e Fase de
 * Companhia, e as decisões de um ano vazam para os seguintes.
 *
 * O que este teste NÃO faz: conferir se o texto está bonito. Ele confere que a
 * régua CVR foi aplicada, que nenhum termo de 1ª edição sobreviveu solto, e que
 * cada número de bloco de adversário veio da fonte e não de estimativa.
 *
 * Fonte: `the one ring/The Darkening of Mirkwood - por Mateus Soares.pdf`
 * Régua: `livros/um-anel/compendio/conversao-primeira-edicao.md`
 */
import { readFileSync as rawReadFileSync, readdirSync } from "fs";

/* CRLF -> LF na leitura: âncoras de linha não podem depender de fim de linha. */
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
 * Achata a quebra de linha do markdown numa linha só.
 *
 * Por que existe: asserção de PROSA que atravessa quebra de linha é a falha que
 * mais se repetiu neste repositório. O markdown quebra no meio da frase — e pior,
 * dentro de citação em bloco a linha seguinte começa com `> `. Um regex como
 * `/sentido normal do jogo/` não casa com "sentido normal\n> do jogo", e a
 * asserção acusa texto que está correto.
 *
 * Usar SÓ para checagem de prosa. Quem depende de âncora de linha (`^`/`$`) tem
 * de ler o texto cru.
 */
const liso = (s) => s.replace(/\n\s*>?\s*/g, " ").replace(/[ \t]+/g, " ");

/**
 * Recorte de uma seção `## Título` até o próximo cabeçalho de mesmo nível OU
 * superior. Recortar por número fixo de caracteres já falhou neste repositório —
 * a seção seguinte entrava na janela e a asserção passava com texto alheio.
 */
function secao(texto, titulo) {
  const i = texto.indexOf(titulo);
  if (i < 0) return "";
  const rest = texto.slice(i + titulo.length);
  const j = rest.search(/\n#{1,3} /);
  return j < 0 ? rest : rest.slice(0, j);
}

console.log("verify-um-anel-campanha-mirkwood: a campanha de trinta anos, bloco a bloco");

/* ══════════════════════════════════════════════════════════════════════
   Os blocos convertidos
   ══════════════════════════════════════════════════════════════════════ */

const BLOCOS = [
  {
    titulo: "Bloco 1 — Os Últimos Bons Anos (2947–2950)",
    arquivo: "22-mirkwood-01-os-ultimos-bons-anos.md",
    anos: [2947, 2948, 2949, 2950],
    fasesDeAventura: [
      "Homem do Mago",
      "O Debate-do-Povo em Rhosgobel",
      "Caçada ao Animal",
      "Segredos Enterrados",
    ],
    cvrObrigatorias: {
      "CVR-005": "o Aparar da 1ª ed que vira Bloqueio",
      "CVR-008": "o Gume descartado — do bloco E do arco Penbregol",
      "CVR-017": "o NA fixo que vira Complicação/Vantagem",
      "CVR-020": "o debate e a negociação que viram Conselho",
      "CVR-024": "o teste de corrupção e o de medo que viram Teste de Sombra",
      "CVR-026": "as ações prolongadas que viram Empreitada",
      "CVR-030": "as lacunas — Prestígio, Vigor e a notação de Armadura",
      "CVR-035": "o bloco de Aranha, agora que a lacuna fechou",
      "CVR-036": "o veneno de aranha que vira Fonte de Dano",
    },
    adversarios: {
      "Aranha Caçadora": "aranha-cacadora",
      "Selvagem Tauler": "tauler-o-cacador",
    },
    /* Um bloco de estatística: o Servo da Colina do Tirano. Um a mais seria
       estatística inventada — a fonte não traz mais nenhum neste bloco. */
    blocosEsperados: 1,
    /* Cita Propriedades porque a Fase de Companhia de 2947 mexe no teste da
       Propriedade, e essa tabela é lida ao CONTRÁRIO da de Fontes de Dano. */
    propriedades: true,
    extra(AV) {
      /* ── O bloco do Servo, campo a campo ─────────────────────────────── */
      const servo = secao(AV, "## Servo da Colina do Tirano");
      ok("  o bloco do Servo da Colina do Tirano é recortável", servo.length > 0);
      /* Números da página impressa 9 do original. */
      for (const [campo, valor] of [
        ["Nível de Atributo", "3"],
        ["Resistência", "16"],
        ["Ódio", "3"],
        ["Bloqueio", "6"],
      ]) {
        ok(
          `  Servo: ${campo} = ${valor}`,
          new RegExp(`\\| ${campo} \\| \\*?\\*?${valor}`).test(servo),
          "número da página 9 do original"
        );
      }
      /* Bloqueio 6 = Aparar 4 + 2 do Escudo. O escudo é NOMEADO no original, e é
         só por isso que a soma pode ser feita — a asserção confere que a conta
         está explicada, não só que o 6 apareceu. */
      ok(
        "  Servo: o Bloqueio 6 mostra de onde veio (4 + 2 do Escudo)",
        /Aparar 4 \+2 \(Escudo\)/.test(servo) && /soma: \*\*6\*\*/.test(servo)
      );
      /* Vigor e o "+2" da Armadura são LACUNA. Se virarem número, é invenção. */
      ok(
        "  Servo: o Vigor continua lacuna, não virou número",
        /\| Vigor \| \*\*lacuna/.test(servo),
        "os blocos de 1ª edição não têm o campo (CVR-030)"
      );
      ok(
        "  Servo: a Armadura converte os 2d e declara o +2 como lacuna",
        /\| Armadura \| 2 \(\*\*lacuna/.test(servo)
      );
      ok(
        "  Servo: 'Sem trégua' está declarada pendente, sem efeito inventado",
        /"Sem trégua"/.test(AV) &&
          /fica \*\*pendente\*\*/.test(AV) &&
          !/\*\*Habilidade Sinistra — Sem [Tt]régua\*\*/.test(AV),
        "o original não descreve a habilidade em lugar nenhum"
      );
      /* Desarmar não existe na lista de Dano Especial da 2ª edição. */
      ok(
        "  Servo: o Ataque Direcionado 'Desarma' não virou Dano Especial",
        !/\| Desarma(r)? \|/.test(servo) && /Quebrar Escudo/.test(servo)
      );

      /* ── Prestígio: aparece três vezes, sempre declarado como não-converte ─ */
      /* A varredura roda no CORPO da conversão, sem a seção de lacunas. Motivo:
         a seção de lacunas existe justamente para citar o termo e negá-lo, e ali
         a frase se estende por vários períodos — cortar por ponto produz
         fragmentos sem a palavra que os inocenta, e a asserção acusava texto
         correto. A seção de lacunas ganha checagem PRÓPRIA logo abaixo, então
         nada deixou de ser vigiado. */
      const corpo = AV.slice(0, AV.indexOf("# Lacunas registradas"));
      ok("  a seção de lacunas é separável do corpo", corpo.length > 0 && corpo.length < AV.length);
      const mencoesPrestigio = [...corpo.matchAll(/[^.]*[Pp]rest[íi]gio[^.]*/g)].map((m) => m[0]);
      ok(
        "  Prestígio aparece nas três cenas do original",
        mencoesPrestigio.length >= 3,
        `achei ${mencoesPrestigio.length}`
      );
      const prestigioSolto = mencoesPrestigio.filter(
        (f) => !/não existe|original|Nada foi inventado|não converte|CVR-030/.test(f)
      );
      ok(
        "  …e nenhuma delas trata Prestígio como pontuação usável",
        prestigioSolto.length === 0,
        prestigioSolto.map((f) => f.replace(/\s+/g, " ").trim().slice(0, 90)).join(" | ")
      );
      /* E a seção de lacunas tem de dizer as três coisas: que são três cenas,
         que Prestígio não existe na 2ª edição, e que nada foi inventado. */
      const lacunas = AV.slice(AV.indexOf("# Lacunas registradas"));
      ok(
        "  a seção de lacunas declara Prestígio nas três cenas",
        /três vezes/.test(liso(lacunas)) &&
          /Prestígio não existe no corpus traduzido da 2ª edição/.test(liso(lacunas)) &&
          /nada foi inventado/i.test(liso(lacunas))
      );

      /* ── Empreitada: só 3, 6 e 9 existem ──────────────────────────────── */
      const empreitadas = [...AV.matchAll(/Empreitada de [^.]{0,40}?(\d+) sucessos?/g)].map((m) =>
        Number(m[1])
      );
      ok("  o arquivo usa Empreitadas", empreitadas.length > 0);
      const forasDeEscala = empreitadas.filter((n) => ![3, 6, 9].includes(n));
      ok(
        "  toda Empreitada é 3, 6 ou 9",
        forasDeEscala.length === 0,
        `fora de escala: ${forasDeEscala.join(", ")}`
      );
      /* A conversão de 5 para 6 é uma DECISÃO, e decisão calada é decisão
         perdida: o texto tem de dizer que subiu, e por quê. */
      ok(
        "  a subida de 5 para 6 está declarada, não escondida",
        /5 não é uma delas/.test(liso(AV)) && /sobe para \*\*6\*\*/.test(liso(AV))
      );

      /* ── A tabela de Propriedades é lida ao CONTRÁRIO da de Fontes de Dano ─ */
      ok(
        "  o bônus de +2 na Propriedade avisa a direção da tabela",
        /PRO-01[01]/.test(AV) &&
          /sentido normal do jogo/.test(liso(AV)) &&
          /oposto\*\* da tabela de Fontes de Dano/.test(liso(AV)),
        "as duas tabelas convivem no corpus e são lidas em direções contrárias"
      );

      /* ── Penbregol: o Gume some e NADA entra no lugar ──────────────────── */
      const arco = secao(AV, "#### O Arco da Fúria Repentina");
      ok("  a seção do arco Penbregol é recortável", arco.length > 0);
      ok(
        "  Penbregol: o Gume é descartado e nada foi inventado no lugar",
        /Gume é descartado/.test(arco) &&
          /Nenhuma qualidade foi inventada/.test(arco) &&
          /salva inicial adicional/.test(arco)
      );

      /* ── "Temporariamente exausto" nunca vira Exausto ─────────────────── */
      ok(
        "  o pesadelo deixa ARRASADO, não Exausto",
        /Pesadelos.*\n?.*ARRASADOS/s.test(AV) || /ou ficar \*\*ARRASADOS\*\*/.test(AV)
      );
      ok(
        "  …e a troca está justificada pela causa (medo)",
        /a causa aqui é \*\*medo\*\*/.test(AV) && /Exausto não se atribui/.test(AV)
      );

      /* ── O ponto de Sombra do cervo escuro tem FONTE ──────────────────── */
      ok(
        "  o ponto de Sombra do cervo escuro tem fonte declarada",
        /é um \*\*Malfeito\*\*/.test(AV) && /não se reduz/.test(AV),
        "a 2ª edição não ganha Sombra sem fonte"
      );
    },
  },
];

/* ══════════════════════════════════════════════════════════════════════
   Termos de 1ª edição
   ══════════════════════════════════════════════════════════════════════ */

/** Não podem aparecer de jeito nenhum. */
const PROIBIDOS = [
  ["Tiro Certeiro", "Dano Especial"],
  ["pontos? de tesouro", "ponto de Tesouro"],
  ["ponto de [Aa]vanço", "ponto de Perícia"],
  ["ponto de Experiência", "ponto de Aventura"],
];

/** Podem aparecer, mas SÓ dizendo no que viraram. Banir a palavra inteira
    falharia contra o próprio texto que explica a conversão — fixa-se o
    CONTEXTO, não a ausência. */
const SO_PARA_NEGAR = [
  ["[Cc]omitiva", "Companhia"],
  ["Tolerância", "Conselho"],
  ["[Tt]estes? de corrup[çc][ãa]o", "Teste de Sombra"],
  ["[Ff]ase em Sociedade", "Fase de Companhia"],
  ["Called Shot", "Dano Especial"],
  ["[Tt]estes? de fadiga", "Evento de Jornada"],
  ["[Tt]estes? de medo", "Teste de Sombra"],
];

for (const bl of BLOCOS) {
  console.log(`\n── ${bl.titulo} ──`);
  const AV = readFileSync(root("livros", "um-anel", bl.arquivo), "utf8");

  /* 1. A forma da campanha ---------------------------------------------- */
  /* Um bloco de anos não é uma aventura: cada ano precisa das TRÊS partes. Um
     ano sem Fase de Companhia é um ano em que a campanha para de avançar. */
  for (const ano of bl.anos) {
    const doAno = secao(AV, `# Ano ${ano}`);
    ok(`  ano ${ano}: tem seção própria`, doAno.length > 0);
  }
  ok(
    `  os ${bl.anos.length} anos aparecem em ordem crescente`,
    (() => {
      const pos = bl.anos.map((a) => AV.indexOf(`# Ano ${a}`));
      return pos.every((p, i) => p >= 0 && (i === 0 || p > pos[i - 1]));
    })()
  );
  for (const parte of ["## Eventos", "## Fase de aventura:", "## Fase de Companhia:"]) {
    const n = [...AV.matchAll(new RegExp(parte.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"))].length;
    ok(
      `  "${parte}" aparece uma vez por ano (${bl.anos.length})`,
      n === bl.anos.length,
      `achei ${n}`
    );
  }
  for (const fase of bl.fasesDeAventura) {
    ok(`  Fase de aventura "${fase}" está no arquivo`, AV.includes(fase));
  }

  /* 2. Citações da régua ------------------------------------------------- */
  const citados = [...new Set([...AV.matchAll(/\bCVR-\d{3}\b/g)].map((m) => m[0]))].sort();
  ok(
    `  cita a régua de conversão (${citados.length} entradas)`,
    citados.length >= 8,
    "conversão sem referência é conversão sem régua"
  );
  for (const id of citados) {
    ok(
      `  citação ${id} existe na tabela`,
      entradaTabela(id).length > 0,
      "referência quebrada manda o Mestre procurar o que não existe"
    );
  }
  for (const [id, porque] of Object.entries(bl.cvrObrigatorias)) {
    ok(`  usa ${id} (${porque})`, AV.includes(id));
  }
  if (bl.propriedades) {
    const pros = [...new Set([...AV.matchAll(/\bPRO-\d{3}\b/g)].map((m) => m[0]))];
    ok("  cita o pack de Propriedades", pros.length > 0);
    const PROP = readFileSync(
      root("livros", "um-anel", "compendio", "propriedades.md"),
      "utf8"
    );
    for (const id of pros) {
      ok(`  citação ${id} existe no pack de Propriedades`, PROP.includes(`## ${id} —`));
    }
  }

  /* 3. Adversários ------------------------------------------------------- */
  for (const [rotulo, id] of Object.entries(bl.adversarios)) {
    ok(
      `  adversário "${rotulo}" (${id}) existe no bestiário`,
      AV.includes(rotulo) &&
        AV.includes(`\`${id}\``) &&
        ADVERSARIES.includes(`name: "${rotulo}"`) &&
        ADVERSARIES.includes(`id: "${id}"`),
      "o id nunca aparece sozinho na tela — o Mestre lê o rótulo, e o id acha o bloco"
    );
  }

  /* 4. Termos de 1ª edição ---------------------------------------------- */
  for (const [termo, viraram] of PROIBIDOS) {
    ok(
      `  "${termo}" não sobreviveu (virou ${viraram})`,
      !new RegExp(termo).test(AV),
      "sem exceção: nem no resumo esse termo precisa aparecer"
    );
  }
  /* Delimitado por PONTO, não por quebra de linha: o markdown quebra no meio da
     frase e a palavra que inocenta o trecho cai na linha seguinte. */
  for (const [termo, viraram] of SO_PARA_NEGAR) {
    const frases = [...AV.matchAll(new RegExp(`[^.]*${termo}[^.]*`, "g"))].map((m) => m[0]);
    const soltas = frases.filter((f) => !/vir(ou|aram)|original|CVR-\d{3}/.test(f));
    ok(
      `  "${termo}" ${frases.length === 0 ? "não aparece" : `só aparece dizendo que virou ${viraram}`}`,
      soltas.length === 0,
      soltas.map((f) => f.replace(/\s+/g, " ").trim().slice(0, 90)).join(" | ")
    );
  }

  /* NA fixo: pode ser MENCIONADO ao explicar o original, nunca como instrução.
     Dois dígitos de propósito — "a 2ª edição" não pode ser acusada pelo "2ª". */
  const mencoesNA = [...AV.matchAll(/[^.]*\bNA\b(?: de)? \d{2}[^.]*/g)].map((m) => m[0]);
  const semOriginal = mencoesNA.filter((f) => !/original/.test(f));
  ok(
    "  todo NA numérico só aparece explicando o ORIGINAL",
    semOriginal.length === 0,
    semOriginal.map((f) => f.replace(/\s+/g, " ").trim().slice(0, 90)).join(" | ")
  );

  /* 5. Lacunas e blocos inventados --------------------------------------- */
  ok("  tem seção de lacunas registradas", /# Lacunas registradas/.test(AV));
  const blocos = [...AV.matchAll(/\| Nível de Atributo \| \d+ \|/g)];
  ok(
    `  só existem ${bl.blocosEsperados} bloco(s) de estatística`,
    blocos.length === bl.blocosEsperados,
    `achei ${blocos.length}; um bloco a mais seria estatística inventada`
  );

  /* 6. Checagens próprias do bloco --------------------------------------- */
  bl.extra(AV);
}

/* ══════════════════════════════════════════════════════════════════════
   Varredura de DIRETÓRIO, não de lista fixa
   ══════════════════════════════════════════════════════════════════════ */

/* Lista fixa já deixou passar duas dívidas neste repositório: o arquivo novo
   simplesmente não estava na lista, e a varredura não olhava para ele. Aqui a
   fonte da verdade é o diretório — um bloco convertido sem entrar em BLOCOS
   quebra o teste em vez de passar despercebido. */
const NA_PASTA = readdirSync(root("livros", "um-anel"))
  .filter((f) => /^\d\d-mirkwood-.*\.md$/.test(f))
  .sort();
const NA_LISTA = BLOCOS.map((b) => b.arquivo).sort();
console.log("\n── varredura do diretório ──");
ok(
  `todo arquivo de Mirkwood em livros/um-anel/ está coberto (${NA_PASTA.length})`,
  NA_PASTA.length === NA_LISTA.length && NA_PASTA.every((f, i) => f === NA_LISTA[i]),
  `na pasta: [${NA_PASTA.join(", ")}] · na lista: [${NA_LISTA.join(", ")}]`
);

/* A campanha tem CINCO blocos no plano. Enquanto faltarem, o teste diz quantos —
   um número calado vira "acho que já convertemos tudo". */
const TOTAL_PLANEJADO = 5;
console.log(
  `\nblocos convertidos: ${BLOCOS.length}/${TOTAL_PLANEJADO} — faltam ${
    TOTAL_PLANEJADO - BLOCOS.length
  }`
);

console.log(`\nverify-um-anel-campanha-mirkwood: ${pass} ok, ${fail} falhas`);
if (fail > 0) process.exit(1);
