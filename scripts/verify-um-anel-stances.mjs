/**
 * Verifica as posturas de combate do Um Anel (D17) — entra em `npm run test`.
 *
 * Reimplementa a tabela do livro aqui de propósito: se alguém "simplificar"
 * lib/combat/um-anel/stances.ts, este teste acusa. Mesmo padrão de
 * scripts/verify-pa-bank.mjs para o PA do Eldarin.
 *
 * Fonte: livros/um-anel/compendio/posturas.md
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(join(__dirname, "..", "lib", "combat", "um-anel", "stances.ts"), "utf8");

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

/** Extrai um número de campo do TOR_STANCE_META no fonte (evita build TS no teste). */
function metaField(stance, field) {
  const block = SRC.split(new RegExp(`\\b${stance}:\\s*\\{`))[1];
  if (!block) return null;
  const body = block.split(/\n  \},/)[0];
  const m = body.match(new RegExp(`${field}:\\s*(-?\\d+)`));
  return m ? Number(m[1]) : null;
}

console.log("verify-um-anel-stances: tabela de posturas (livro p.99-104)");

// Avançada: ataque ganha 1d; ataques contra você ganham 1d.
ok("Avançada: ataque +1d", metaField("avancada", "attackRankDelta") === 1);
ok("Avançada: ser atingido +1d", metaField("avancada", "incomingCloseRankDelta") === 1);

// Aberta: neutra nos dois sentidos.
ok("Aberta: ataque neutro", metaField("aberta", "attackRankDelta") === 0);
ok("Aberta: ser atingido neutro", metaField("aberta", "incomingCloseRankDelta") === 0);

// Defensiva: ataques contra você perdem 1d; seu ataque perde 1d por engajador.
ok("Defensiva: ser atingido -1d", metaField("defensiva", "incomingCloseRankDelta") === -1);
ok("Defensiva: -1d por engajador", metaField("defensiva", "attackRankPerEngager") === -1);
ok("Defensiva: sem bônus de ataque próprio", metaField("defensiva", "attackRankDelta") === 0);

// Retaguarda: alcance à distância.
ok("Retaguarda: alcance à distância", /retaguarda:[\s\S]*?range:\s*"ranged"/.test(SRC));
ok(
  "Avançada/Aberta/Defensiva: alcance corpo a corpo",
  ["avancada", "aberta", "defensiva"].every((s) =>
    new RegExp(`${s}:[\\s\\S]*?range:\\s*"close"`).test(SRC)
  )
);

// Tarefas de combate — uma por postura, conforme o livro.
const TASKS = {
  avancada: "Intimidar Inimigo",
  aberta: "Reunir Companheiros",
  defensiva: "Proteger Companheiro",
  retaguarda: "Preparar Tiro",
};
for (const [stance, task] of Object.entries(TASKS)) {
  ok(
    `${stance}: tarefa "${task}"`,
    new RegExp(`${stance}:[\\s\\S]*?combatTask:\\s*"${task}"`).test(SRC)
  );
}

// Limites de engajamento (POS-R03).
ok("Engajamento: 3 heróis por inimigo humano", /heroesPerHumanFoe:\s*3/.test(SRC));
ok("Engajamento: 6 heróis por inimigo grande", /heroesPerLargeFoe:\s*6/.test(SRC));
ok("Engajamento: 3 inimigos humanos por herói", /humanFoesPerHero:\s*3/.test(SRC));
ok("Engajamento: 2 inimigos grandes por herói", /largeFoesPerHero:\s*2/.test(SRC));

// Clamp em 0 — rank negativo quebraria o motor de dados.
ok("attackRankWithStance clampa em 0", /attackRankWithStance[\s\S]*?Math\.max\(0,/.test(SRC));
ok("incomingRankWithStance clampa em 0", /incomingRankWithStance[\s\S]*?Math\.max\(0,/.test(SRC));

// Postura padrão é Aberta (neutra) — adversário não escolhe postura.
ok("Padrão é Aberta", /TOR_DEFAULT_STANCE:\s*TorStanceId\s*=\s*"aberta"/.test(SRC));

// O compêndio e o TS precisam concordar nas 4 posturas.
const md = readFileSync(
  join(__dirname, "..", "livros", "um-anel", "compendio", "posturas.md"),
  "utf8"
);
for (const label of Object.values({ a: "Avançada", b: "Aberta", c: "Defensiva", d: "Retaguarda" })) {
  ok(`compêndio tem "${label}"`, md.includes(`— ${label}`));
}


/* ── Arrasado ≠ Desfavorecido (bug corrigido) ─────────────────────── */

const ATTACK = readFileSync(
  join(__dirname, "..", "lib", "combat", "um-anel", "resolve-attack.ts"),
  "utf8"
);
const HANDLER = readFileSync(
  join(__dirname, "..", "lib", "room", "handlers", "tor-combat-attack.ts"),
  "utf8"
);
const BOOK_GM = readFileSync(
  join(__dirname, "..", "livros", "um-anel", "08-mestre-e-adversarios.md"),
  "utf8"
);
const stripC = (x) => x.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
const attackCode = stripC(ATTACK);

// O livro trata as duas como condições distintas — Arrasado faz o Olho falhar;
// Desfavorecido é a condição pior, ao atingir a Esperança máxima.
ok(
  "livro: Arrasado faz o Olho virar falha",
  /become Miserable[\s\S]{0,200}?rolling an .{0,3} icon on the Feat die results in failure/i.test(BOOK_GM)
);
ok(
  "livro: Desfavorecido vem da Sombra na Esperança máxima",
  /Shadow score reaches their maximum Hope rating[\s\S]{0,80}?Ill-favoured/i.test(BOOK_GM)
);

// A REGRESSÃO: o Teste de Proteção usava `illFavoured: params.defenderMiserable`,
// aplicando uma penalidade que o livro não dá.
ok(
  "Teste de Proteção NÃO desfavorece por estar Arrasado",
  !/illFavoured:\s*params\.defenderMiserable/.test(attackCode)
);
ok(
  "Teste de Proteção usa defenderIllFavoured próprio",
  /illFavoured:\s*params\.defenderIllFavoured/.test(attackCode)
);
ok("TorAttackParams tem defenderIllFavoured", /defenderIllFavoured\?:\s*boolean;/.test(ATTACK));

// O handler deriva Desfavorecido de Sombra + Cicatrizes vs Esperança MÁXIMA,
// pelo helper compartilhado (era fórmula inline; virou helper na rodada 5 pra
// não haver cópia divergindo entre handler, dice.ts e resolve-attack.ts).
ok(
  "handler deriva Desfavorecido pelo helper compartilhado",
  /isTorIllFavouredByShadow\(\{[\s\S]{0,200}?hopeMax: defSheet\.hope\.max/.test(HANDLER)
);
const RULES_TS = readFileSync(
  join(__dirname, "..", "lib", "character", "um-anel", "rules.ts"),
  "utf8"
);
ok(
  "helper compara Sombra + Cicatrizes com a Esperança MÁXIMA",
  /isTorIllFavouredByShadow[\s\S]{0,400}?params\.shadow \+ params\.shadowScars >= params\.hopeMax/.test(
    stripC(RULES_TS)
  )
);
// E lê o estado do defensor ANTES de aplicar o dano.
const readIdx = HANDLER.indexOf("defenderWeary = defSheet.conditions.weary");
const applyIdx = HANDLER.indexOf("applyTorAttackResultToDefender(defenderToken");
ok(
  "estado do defensor é lido ANTES de aplicar o dano",
  readIdx >= 0 && applyIdx >= 0 && readIdx < applyIdx,
  `leitura@${readIdx} aplicacao@${applyIdx}`
);

// Golpe Perfurante em 10 OU Runa — numeric === 10 cobre os dois de propósito.
ok(
  "livro: Golpe Perfurante em 10 ou Runa",
  /Piercing Blow on a \*\*10 or \[Rune\]\*\* result/i.test(
    readFileSync(join(__dirname, "..", "livros", "um-anel", "06-fases-de-aventura-combate.md"), "utf8")
  )
);
ok(
  "Golpe Perfurante testa numeric === 10 (cobre 10 e Runa)",
  /attackRoll\.featDie\.numeric === 10/.test(attackCode)
);


/* ── Nomes de exibição em PT-BR (convenção do projeto) ───────────────
   `docs/CLAUDE-PROJETO.md`: "Textos de UI em PT-BR". Nome de adversário
   aparece no compêndio E no nameplate do token no mapa, então um nome em
   inglês vaza direto para a mesa.

   Achado na rodada 2 do loop: "Barrow-wight" e "Cave-troll Furtivo" tinham
   escapado (20 dos 22 já estavam certos). Os `id` seguem em inglês de
   propósito — são chave estável e renomear quebraria salas salvas. */

const ADV = readFileSync(
  join(__dirname, "..", "lib", "character", "um-anel", "adversaries.ts"),
  "utf8"
);

/** Palavras que só aparecem em nome não traduzido. Não inclui termos que
 *  ficam no original de propósito (Orc, Goblin, Troll, Warg são usados em
 *  PT-BR na tradução brasileira de Tolkien). */
const ENGLISH_MARKERS = [
  "Barrow",
  "wight",
  "Cave-troll",
  "Hound",
  "Slayer",
  "Chieftain",
  "Bandit",
  "Marsh-dweller",
  "Wolf",
  "Spider",
  "Bodyguard",
  "Archer",
  "Soldier",
  "Guard",
  "Thief",
  "Robber",
];

const names = [...ADV.matchAll(/^\s{4}name: "([^"]+)",/gm)].map((m) => m[1]);

ok("adversaries.ts tem nomes de exibição", names.length >= 20, `achou ${names.length}`);

const englishNames = names.filter((n) =>
  // Fronteira de palavra nas DUAS pontas. Sem a do final, "Guard" casa com
  // "Guarda"/"Guarda-costas" e "Bandit" com "Bandido" — todas portuguesas.
  // Erro cometido ao escrever este próprio teste.
  ENGLISH_MARKERS.some((w) => new RegExp(`\\b${w}\\b`, "i").test(n))
);
ok(
  "nenhum nome de adversário em inglês",
  englishNames.length === 0,
  englishNames.join(" | ")
);

// Os dois casos concretos corrigidos, para a regressão ser nomeada.
ok('"Barrow-wight" virou "Tumulário"', names.includes("Tumulário"));
ok(
  '"Cave-troll Furtivo" virou "Troll das Cavernas Furtivo"',
  names.includes("Troll das Cavernas Furtivo")
);

// Os ids continuam em inglês — chave estável, não rótulo.
ok('id "barrow-wight" preservado', /id: "barrow-wight"/.test(ADV));
ok('id "cave-troll-furtivo" preservado', /id: "cave-troll-furtivo"/.test(ADV));

console.log(`\nverify-um-anel-stances: ${pass} passaram, ${fail} falharam`);
if (fail > 0) process.exit(1);
