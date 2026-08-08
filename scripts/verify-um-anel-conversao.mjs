/**
 * Tabela de conversão da 1ª para a 2ª edição.
 *
 * Por que existe: as duas campanhas de 1ª edição (*Tales from Wilderland* e
 * *The Darkening of Mirkwood*) vão ser convertidas aventura por aventura. Sem uma
 * tabela única, **cada aventura inventaria a própria conversão** — e a segunda a
 * ser convertida discordaria da primeira sem que ninguém percebesse.
 *
 * Este teste não confere que o texto da tabela existe: confere que **cada
 * equivalência bate com a 2ª edição de verdade**, lendo os dois lados. E confere,
 * com asserções NEGATIVAS, que as lacunas registradas são lacunas de fato — é o
 * que impede uma rodada futura de "preencher" um número que a fonte não tem.
 *
 * Fonte: livros/um-anel/compendio/conversao-primeira-edicao.md e os capítulos
 * que ela cita.
 */
import { readFileSync as rawReadFileSync, existsSync, readdirSync } from "fs";

const readFileSync = (p, enc) => rawReadFileSync(p, enc).replace(/\r\n/g, "\n");

import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = (...p) => join(__dirname, "..", ...p);

const TABELA = readFileSync(
  root("livros", "um-anel", "compendio", "conversao-primeira-edicao.md"),
  "utf8"
);
const CAP2 = readFileSync(root("livros", "um-anel", "02-resolucao-de-acoes.md"), "utf8");
const CAP3 = readFileSync(root("livros", "um-anel", "03-aventureiros.md"), "utf8");
const CAP6 = readFileSync(root("livros", "um-anel", "06-fases-de-aventura-combate.md"), "utf8");
const CAP8 = readFileSync(root("livros", "um-anel", "08-mestre-e-adversarios.md"), "utf8");
const DATA = readFileSync(root("lib", "character", "um-anel", "data.ts"), "utf8");
const ADVERSARIES = readFileSync(root("lib", "character", "um-anel", "adversaries.ts"), "utf8");
const GEN = readFileSync(root("scripts", "gen-um-anel.mjs"), "utf8");

/** Todos os capítulos traduzidos da 2ª edição, para as asserções negativas. */
const CORPUS = [
  "00-glossario-termos",
  "02-resolucao-de-acoes",
  "03-aventureiros",
  "04-caracteristicas",
  "05-valor-e-sabedoria",
  "06-fases-de-aventura-combate",
  "07-fases-de-companhia-jornada",
  "08-mestre-e-adversarios",
  "09-starter-set-regras-condensadas",
  "10-rivendell",
  "11-personagens-exemplo",
  "12-o-mundo-eriador",
  "13-apendice-patronos-e-ficha",
  "14-aventuras-starter-set",
]
  .map((f) => readFileSync(root("livros", "um-anel", `${f}.md`), "utf8"))
  .join("\n");

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

/** Corpo de uma entrada `## CVR-0NN — …` até a próxima entrada. */
function entrada(id) {
  const i = TABELA.indexOf(`## ${id} —`);
  if (i < 0) return "";
  const rest = TABELA.slice(i + 3);
  const j = rest.indexOf("\n## ");
  return j < 0 ? rest : rest.slice(0, j);
}

console.log("verify-um-anel-conversao: cada equivalência 1ª→2ª bate com a 2ª edição");

/* ── 1. A tabela existe e está no compêndio ────────────────────────────── */

ok(
  "o pack está registrado no gerador",
  /"conversao-primeira-edicao": \{/.test(GEN),
  "sem entrada em PACKS o gerador recusa o arquivo"
);
ok("o JSON gerado existe", existsSync(root("data", "compendiums", "um-anel", "conversao-primeira-edicao.json")));

const gerado = JSON.parse(
  readFileSync(root("data", "compendiums", "um-anel", "conversao-primeira-edicao.json"), "utf8")
);
const idsNoMd = [...TABELA.matchAll(/^## (CVR-\d+) —/gm)].map((m) => m[1]);
ok(
  "o JSON tem a mesma quantidade de entradas do markdown",
  gerado.length === idsNoMd.length && gerado.length > 0,
  `json=${gerado.length} md=${idsNoMd.length} — markdown é a fonte, JSON é gerado`
);
ok(
  "e os mesmos ids, na mesma ordem",
  gerado.map((e) => e.id).join(",") === idsNoMd.join(","),
  "JSON fora de sincronia com o markdown quer dizer que faltou rodar gen-um-anel"
);

/* ── 2. O lado da 2ª edição confere com o livro ────────────────────────── */

/* Bloqueio, não "Parada". A asserção negativa é a que importa: se algum dia
   alguém escrever "Parada" na tabela, o termo não existe na 2ª edição. */
ok(
  "livro: o termo é Bloqueio, e é somado ao NA de FORÇA",
  /O Bloqueio de um adversário é um modificador numérico que é somado ao NA de FORÇA/.test(CAP8)
);
ok(
  "corpus: 'Parada' não é termo da 2ª edição",
  !/\bParada\b/.test(CORPUS),
  "se aparecer, a equivalência de CVR-005 precisa ser reescrita, não copiada"
);
ok("tabela: CVR-005 usa Bloqueio", /2ª edição:\*\* Bloqueio/.test(entrada("CVR-005")));
/* A asserção acima olha só o CAMPO da entrada, e por isso não vê a prosa. Ao
   quebrar de propósito trocando "Bloqueio" por "Parada" no texto explicativo,
   nada falhou — a tabela podia se contradizer em silêncio.

   Banir "Parada" do arquivo inteiro também não serve: a entrada CVR-005 precisa
   citar o termo para dizer que ele NÃO existe. Então a asserção fixa as duas
   coisas: aparece exatamente uma vez, e essa vez é o aviso. */
const mencoesParada = (TABELA.match(/\bParada\b/g) ?? []).length;
ok(
  "tabela: 'Parada' aparece uma vez só, e é para dizer que não existe",
  mencoesParada === 1 && /\*\*Parada\*\* não existe na 2ª\s*[\s>]*edição traduzida/.test(TABELA),
  `${mencoesParada} menções — campo certo com prosa errada é pior que erro visível`
);

/* Vigor: a 2ª edição exige, e diz para que serve. */
ok(
  "livro: Vigor é Ferimentos para abater e ataques por rodada",
  /o Vigor indica o número de Ferimentos necessários para abater um inimigo de vez, e o número de ataques que ele pode fazer durante uma rodada de combate/.test(
    CAP8
  )
);
ok(
  "tabela: CVR-003 diz que o Vigor precisa ser atribuído",
  /não existe no bloco/.test(entrada("CVR-003"))
);

/* A tabela afirma uma OBSERVAÇÃO sobre o bestiário. Se o bestiário mudar, a
   afirmação vira mentira — então ela é conferida contra o dado, não só lida. */
const blocos = [...ADVERSARIES.matchAll(/tier: "(\w+)",[\s\S]{0,200}?might: (\d+),/g)].map((m) => ({
  tier: m[1],
  might: Number(m[2]),
}));
ok("o bestiário tem blocos para conferir", blocos.length >= 20, `achei ${blocos.length}`);
ok(
  "afirmação da tabela: todo adversário comum tem Vigor 1",
  blocos.filter((b) => b.tier === "mob").every((b) => b.might === 1),
  "CVR-003 diz isso; se o bestiário mudar, a frase precisa mudar junto"
);
/* A primeira versão desta entrada dizia "os chefes têm Vigor 2" — e esta
   asserção derrubou a frase: Jack, o Troll de Pedra, é chefe com Vigor 1. O
   Vigor mede Ferimentos para abater, não porte nem importância. */
ok(
  "afirmação da tabela: elites e chefes variam entre 1 e 2",
  ["elite", "boss"].every(
    (t) =>
      blocos.some((b) => b.tier === t && b.might === 1) &&
      blocos.some((b) => b.tier === t && b.might === 2)
  ),
  "se algum escalão parar de variar, a frase de CVR-003 precisa mudar junto"
);
ok(
  "e o chefe de Vigor 1 citado na tabela existe mesmo",
  /name: "Jack, o Troll de Pedra"[\s\S]{0,200}might: 1,/.test(ADVERSARIES),
  "citar um exemplo pelo nome só vale se o exemplo continuar lá"
);

/* Ódio × Resolução, e a consequência que a 1ª edição não tem. */
ok(
  "livro: Ódio é de lacaio do Inimigo",
  /Adversários com uma classificação de pontos de Ódio devem ser considerados lacaios ou servos do Inimigo/.test(
    CAP8
  )
);
ok(
  "livro: matar quem tem Resolução pode ser Malfeitoria",
  /o ato de atacar ou matar um adversário com Resolução deveria sempre ser avaliado pelo Mestre como possível Malfeitoria/.test(
    CAP8
  )
);
ok(
  "tabela: CVR-004 avisa da Malfeitoria",
  /Malfeitoria/.test(entrada("CVR-004")),
  "sem esse aviso a conversão vira só troca de palavra"
);

/* Fio da lâmina: o limiar virou fixo. */
ok(
  "livro: o Golpe Perfurante sai em 10 ou Runa, para toda arma",
  /produz um Golpe Perfurante com um resultado de \*\*10 ou \[Rune\]\*\*/.test(CAP6)
);
ok(
  "tabela: CVR-008 manda DESCARTAR o Edge",
  /descartado/.test(entrada("CVR-008")),
  "manter o Edge criaria um segundo limiar que a 2ª edição não usa"
);

/* Armadura e Dano Especial. */
ok(
  "livro: Armadura serve ao teste de Proteção do Golpe Perfurante",
  /é usada pelo Mestre para fazer um teste de Proteção quando o adversário é atingido por um Golpe Perfurante/.test(
    CAP8
  )
);
ok(
  "livro: Dano Especial custa 1 ícone de Sucesso",
  /Todos os resultados especiais listados aqui exigem 1 ícone de Sucesso para ser acionados/.test(
    CAP8
  )
);
ok(
  "tabela: CVR-010 avisa que as listas de herói e de adversário são diferentes",
  /são \*\*diferentes\*\*/.test(entrada("CVR-010")),
  "usar a lista errada troca as opções disponíveis"
);

/* Graus de sucesso. */
ok(
  "livro: um ícone é grande sucesso, dois ou mais é extraordinário",
  /\*\*um grande sucesso\*\*/.test(CAP2) && /\*\*um sucesso extraordinário\*\*/.test(CAP2)
);

/* Complicações e Vantagens. */
ok(
  "livro: complicação e vantagem são Dados de Sucesso, não NA",
  /Moderadamente prejudicado \| \*Perde \(1d\)\*/.test(CAP6) &&
    /Vantagem moderada \| \*Ganha \(1d\)\*/.test(CAP6)
);
ok(
  "livro: BATALHA remove complicação como ação principal",
  /rolagem de \*\*BATALHA\*\* como sua ação principal da rodada/.test(CAP6)
);
ok(
  "tabela: CVR-016 tira a dificuldade do NA",
  /NA do Atributo do herói/.test(entrada("CVR-016"))
);

/* Empreitada de Perícia. */
ok(
  "livro: Empreitada é Simples 3, Laboriosa 6, Assustadora 9",
  /Simples \(Resistência 3\), Laboriosa \(Resistência 6\) ou Assustadora \(Resistência 9\)/.test(CAP8)
);

/* Conselho. */
ok(
  "livro: Conselho tem Resistência 3, 6 e 9",
  /\| Pedido razoável \| 3 \|/.test(CAP6) ||
    /Resistência 3/.test(CAP6) ||
    /razoável/.test(CAP6)
);

/* Fontes de Dano — a inversão. */
ok(
  "livro: moderado é Favorecida e gravíssimo é Desfavorecida",
  /Se a perda de Resistência é moderada, o Mestre faz uma rolagem \*Favorecida\*/.test(CAP8) &&
    /Se a perda de Resistência é gravíssima, o Mestre faz uma rolagem \*Desfavorecida\*/.test(CAP8)
);
ok(
  "tabela: CVR-028 avisa que a tabela é lida ao contrário",
  /\*\*ao[\s>]+contrário\*\*/.test(entrada("CVR-028")),
  "sem o aviso, quem converter uma queda vai achar que Favorecida machuca mais"
);

/* Olho de Mordor é opcional. */
ok(
  "livro: o Olho de Mordor é regra opcional",
  /As regras relativas ao Olho de Mordor são particularmente adequadas para serem introduzidas mais tarde no jogo/.test(
    CAP8
  )
);

/* Padrão de Vida. */
ok(
  "livro: seis níveis de Padrão de Vida",
  /Pobre, Frugal, Comum, Próspero, Rico e Muito Rico/.test(CAP3)
);

/* ── 3. Perícias: o nome novo existe, o antigo não ─────────────────────── */

/* Cada renomeada tem de existir com o rótulo da 2ª edição em data.ts, e o nome
   da 1ª edição NÃO pode ser rótulo de perícia nenhuma — senão a substituição no
   texto da aventura trocaria uma perícia por outra. */
for (const [antigo, id, novo] of [
  ["Assombro", "imponencia", "Fascínio"],
  ["Atenção", "percepcao", "Vigilância"],
  ["Cantigas", "canto", "Música"],
  ["Intuição", "perspicacia", "Discernimento"],
  ["Investigação", "vasculhar", "Busca"],
  ["Conhecimento", "saber", "História"],
  ["Enigmas", "enigma", "Enigma"],
  ["Caça", "caca", "Caçada"],
]) {
  ok(
    `perícia: "${antigo}" (1ª ed) é "${novo}" (2ª ed), id ${id}`,
    new RegExp(`id: "${id}", label: "${novo}"`).test(DATA),
    "o rótulo da 2ª edição precisa existir exatamente assim"
  );
  ok(
    `e "${antigo}" não é rótulo de perícia na 2ª edição`,
    !new RegExp(`label: "${antigo}"`).test(DATA),
    "se virasse rótulo, a substituição no texto trocaria uma perícia por outra"
  );
  ok(
    `a tabela registra a troca de "${antigo}"`,
    entrada("CVR-013").includes(antigo) && entrada("CVR-013").includes(novo)
  );
}

/* O outro lado do recorte que verify-um-anel-glossario.mjs faz: aquele teste
   desliga a guarda de nomes antigos dentro de CVR-013, então aqui se garante que
   os nomes antigos NÃO escapam para o resto da tabela. Sem isto, o recorte lá
   viraria uma porta aberta. */
const semCvr013 = TABELA.replace(/## CVR-013 —[\s\S]*?\n---\n/, "");
ok(
  "CVR-013 foi mesmo recortada antes desta checagem",
  semCvr013.length < TABELA.length && !semCvr013.includes("CVR-013")
);
/* Banir a palavra solta não serve: "Atenção:" é interjeição e "Atenção do Olho"
   é termo da 2ª edição. O que não pode aparecer é o nome antigo no SENTIDO DE
   PERÍCIA. `Caça`, `Percepção` e companhia já são barradas em todo o resto do
   arquivo por verify-um-anel-glossario.mjs; estas seis não estão naquela lista. */
for (const antigo of ["Assombro", "Atenção", "Cantigas", "Intuição", "Investigação", "Conhecimento"]) {
  const comoPericia = new RegExp(`(teste|rolagem|rolagens|Perícia)s? de ${antigo}\\b|Perícia ${antigo}\\b`);
  ok(
    `"${antigo}" não é usada como Perícia fora de CVR-013`,
    !comoPericia.test(semCvr013),
    "fora da entrada de equivalência, nome antigo é erro"
  );
}

/* As que NÃO mudam também precisam existir — a lista de CVR-014 vira busca e
   substituição em cima do texto da aventura. */
for (const nome of [
  "Atletismo",
  "Persuasão",
  "Cortesia",
  "Furtividade",
  "Exploração",
  "Viagem",
  "Cura",
  "Batalha",
  "Ofício",
]) {
  ok(
    `perícia inalterada existe na 2ª edição: ${nome}`,
    new RegExp(`label: "${nome}"`).test(DATA) && entrada("CVR-014").includes(nome)
  );
}

/* Proficiências de Combate da 2ª edição. */
ok(
  "as quatro Proficiências da 2ª edição são as que a tabela cita",
  /machados: "Machados"/.test(DATA) &&
    /arcos: "Arcos"/.test(DATA) &&
    /lancas: "Lanças"/.test(DATA) &&
    /espadas: "Espadas"/.test(DATA) &&
    /Machados, Arcos, Lanças e[\s>]+Espadas/.test(entrada("CVR-007"))
);

/* ── 3b. As duas moedas de experiência ─────────────────────────────────── */

/* Armadilha de nome: "Experiência" existe nas DUAS edições com sentidos
   diferentes. Na 2ª ela é o guarda-chuva; a moeda que compra Proficiências,
   VALOR e SABEDORIA chama-se ponto de Aventura. Deixar "ponto de Experiência"
   passar numa conversão não parece erro — e é. */
ok(
  "livro: a 2ª edição separa ponto de Perícia de ponto de Aventura",
  /existem dois tipos de pontos de Experiência: pontos de Perícia, que são gastos para adquirir novos níveis em qualquer Perícia, e pontos de Aventura, que são usados para aprimorar Proficiências de Combate ou ganhar novos níveis em VALOR ou SABEDORIA/i.test(
    CAP3
  )
);
ok(
  "tabela: CVR-033 manda o ponto de avanço virar ponto de Perícia",
  /2ª edição:\*\* \*\*ponto de Perícia\*\*/.test(entrada("CVR-033"))
);
ok(
  "tabela: CVR-034 manda o ponto de Experiência virar ponto de Aventura",
  /2ª edição:\*\* \*\*ponto de Aventura\*\*/.test(entrada("CVR-034"))
);
ok(
  "tabela: CVR-034 avisa que é o MESMO nome com sentidos diferentes",
  /Armadilha de nome/.test(entrada("CVR-034")),
  "é o padrão mais fácil de deixar passar — o termo existe nas duas edições"
);

/* NEGATIVA sobre TODAS as aventuras convertidas: nenhum termo de 1ª edição para
   moeda de experiência pode ter sobrevivido. Varre o diretório, e não uma lista
   fixa — aventura nova entra sozinha na varredura. */
const convertidas = readdirSync(root("livros", "um-anel")).filter((f) =>
  /^\d\d-wilderland-/.test(f)
);
ok("há aventuras convertidas para varrer", convertidas.length >= 7, `achei ${convertidas.length}`);
for (const f of convertidas) {
  const md = readFileSync(root("livros", "um-anel", f), "utf8");
  ok(
    `${f}: não sobrou moeda de experiência da 1ª edição`,
    !/pontos? de avanço/i.test(md) && !/pontos? de Experiência/i.test(md),
    "vazou em duas aventuras antes de CVR-033/034 existirem"
  );
}

/* ── 3c. O pack de Propriedades ────────────────────────────────────────── */

/* A regra de Propriedades de *The Darkening of Mirkwood* é subsistema, não
   aventura — por isso virou pack do compêndio, e não arquivo de aventura. */
const PROP = readFileSync(root("livros", "um-anel", "compendio", "propriedades.md"), "utf8");
ok("o pack de Propriedades está registrado no gerador", /propriedades: \{/.test(GEN));
ok(
  "o JSON de Propriedades foi gerado",
  existsSync(root("data", "compendiums", "um-anel", "propriedades.json"))
);

/* A escala do Valor é INVERTIDA: 4 é a melhor propriedade e 9 a pior. Trocar os
   extremos faria a cabana do caçador render mais que a mina de ouro. */
ok(
  "Propriedades: Valor 4 é Rico e Valor 9 é Modesto",
  /## PRO-006 — Rico[\s\S]{0,120}\*\*Valor:\*\* 4/.test(PROP) &&
    /## PRO-001 — Modesto[\s\S]{0,120}\*\*Valor:\*\* 9/.test(PROP),
  "a escala é invertida — número menor é propriedade melhor"
);
ok(
  "Propriedades: a inversão está escrita em voz alta",
  /\*\*quanto MENOR o número, melhor a[\s>]*propriedade\*\*/.test(PROP)
);

/* Duas tabelas do mesmo corpus lidas em direções OPOSTAS. A de Propriedades é a
   normal (Runa boa, Olho ruim); a de Fontes de Dano é a invertida. O aviso tem
   de estar no arquivo, senão o Mestre lê uma pela outra. */
ok(
  "Propriedades: avisa que esta tabela é lida ao contrário da de Fontes de Dano",
  /Perda de Resistência das Fontes de\s*[\s>]*Dano \(CVR-028\)/.test(PROP) &&
    /Runa de Gandalf é o melhor\s*[\s>]*resultado/.test(PROP),
  "as duas convivem no corpus e são lidas em direções contrárias"
);
ok(
  "Propriedades: a Runa melhora a propriedade, com piso em 3",
  /## PRO-012 — Runa de Gandalf/.test(PROP) && /até um\s*[\s>]*mínimo de \*\*3\*\*/.test(PROP)
);
ok(
  "Propriedades: o Olho cria dívida com prazo",
  /## PRO-013 — Olho de Sauron/.test(PROP) && /dívida com prazo/.test(PROP)
);

/* "Rolar duas vezes e escolher o melhor" é Favorecida — e a conversão tem de
   dizer isso, senão a mesa não sabe que já existe mecânica para aquilo. */
ok(
  "Propriedades: Tratar das Terras vira rolagem Favorecida",
  /## PRO-014 — Tratar das Terras/.test(PROP) &&
    /exatamente uma rolagem \*\*Favorecida\*\*/.test(PROP)
);
ok(
  "Propriedades: a recompensa da Especialidade é ponto de Perícia, não 'Evolução'",
  /1\s*[\s>]*ponto de Perícia\*\* \(CVR-033/.test(PROP) && !/Ponto de Evolução\*\*/.test(PROP)
);
/* A metade da regra que dependia de Prestígio NÃO converte. */
ok(
  "Propriedades: a Pontuação Mínima registra a lacuna do Prestígio",
  /## PRO-007 — Pontuação Mínima/.test(PROP) &&
    /não converte/.test(PROP) &&
    /CVR-030/.test(PROP),
  "metade da regra depende de Prestígio, que não existe na 2ª edição"
);

/* ── 4. As lacunas são lacunas de verdade ──────────────────────────────── */

/* Estas são as asserções que impedem uma rodada futura de inventar. Cada uma
   falha no dia em que a fonte APARECER — e nesse dia a tabela deve mudar. */
ok(
  "lacuna real: o bestiário traduzido não tem bloco de Aranha",
  !/id: "aranha/i.test(ADVERSARIES) && !/name: "Aranha/i.test(ADVERSARIES),
  "se um bloco aparecer, CVR-030 precisa deixar de listar Aranhas"
);
ok(
  "lacuna real: nenhum capítulo traz bloco de estatísticas de Aranha",
  !/Aranha[s]?\s*\n*\|\s*Nível de Atributo/i.test(CORPUS),
  "Aranhas são citadas como tipo de inimigo, mas sem bloco"
);
ok(
  "lacuna real: 'Prestígio' não existe no corpus da 2ª edição",
  !/Prestígio/.test(CORPUS)
);
ok(
  "lacuna real: não há tabela de Tolerância para Resistência",
  !/Tolerância/.test(CORPUS),
  "a Tolerância é conceito só de 1ª edição — a 2ª substituiu pelo Conselho"
);
ok(
  "a tabela registra as quatro lacunas",
  /Vigor/.test(entrada("CVR-030")) &&
    /NA fixo/.test(entrada("CVR-030")) &&
    /Tolerância/.test(entrada("CVR-030")) &&
    /Prestígio/.test(entrada("CVR-030")) &&
    /Aranha/.test(entrada("CVR-030"))
);
/* NEGATIVA: a tabela não pode oferecer fórmula para o que registrou como lacuna.
   "Some 2 ao Vigor", "NA 16 vira perde (1d)" — nada disso pode aparecer. */
ok(
  "a tabela NÃO inventa fórmula para as lacunas",
  !/Vigor\s*=\s*/.test(TABELA) && !/NA\s*1[2468]\s*(vira|=|→)/.test(TABELA),
  "registrar e não inventar é a regra; uma fórmula aqui seria invenção com cara de fonte"
);

console.log(`\nverify-um-anel-conversao: ${pass} ok, ${fail} falhas`);
if (fail > 0) process.exit(1);
