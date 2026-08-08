/**
 * Tarefas de Combate e efeitos com duração de rodada.
 *
 * Por que existe: `TOR_STANCE_META.combatTask` guardava só o NOME das quatro
 * tarefas — nenhuma era executável. E não havia onde guardar um efeito que dura
 * uma rodada, que é o que todas as quatro produzem.
 *
 * O erro mais fácil aqui é confundir as duas durações que o livro distingue:
 *
 * - "os oponentes ficam Exaustos em sua **próxima rolagem de ataque**",
 *   "o **próximo ataque** dirigido ao protegido perde (1d)", "ganha (1d) em seu
 *   **próximo ataque** à distância" — valem UMA vez e somem;
 * - "ganham (1d) em suas rolagens de ataque **na rodada seguinte**" — vale a
 *   rodada inteira.
 *
 * Tratar tudo como uso único faria o bônus de Reunir Companheiros sumir no
 * primeiro ataque; tratar tudo como duração daria Tiro Preparado em todos os
 * ataques da rodada.
 *
 * Fonte: livros/um-anel/06-fases-de-aventura-combate.md §Tarefas de Combate
 */
import { readFileSync as rawReadFileSync, existsSync } from "fs";

/* Normaliza CRLF -> LF na leitura: âncoras de linha não devem depender de fim
   de linha (no Windows um clone novo entrega CRLF). */
const readFileSync = (p, enc) => rawReadFileSync(p, enc).replace(/\r\n/g, "\n");

import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = (...p) => join(__dirname, "..", ...p);

const CAP6 = readFileSync(root("livros", "um-anel", "06-fases-de-aventura-combate.md"), "utf8");
const TASKS = readFileSync(root("lib", "combat", "um-anel", "combat-tasks.ts"), "utf8");
const EFFECTS = readFileSync(root("lib", "combat", "um-anel", "round-effects.ts"), "utf8");
const STANCES = readFileSync(root("lib", "combat", "um-anel", "stances.ts"), "utf8");
const HANDLER = readFileSync(root("lib", "room", "handlers", "tor-combat-task.ts"), "utf8");
const ATTACK = readFileSync(root("lib", "room", "handlers", "tor-combat-attack.ts"), "utf8");
const TURN = readFileSync(root("lib", "room", "handlers", "combat-turn.ts"), "utf8");
const TYPES = readFileSync(root("lib", "vtt", "types.ts"), "utf8");
const POPUP = readFileSync(root("components", "vtt", "TorAttackPopup.tsx"), "utf8");
const DATA = readFileSync(root("lib", "character", "um-anel", "data.ts"), "utf8");
const ROUTE_PATH = root("app", "api", "room", "[roomId]", "tor-task", "route.ts");

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

console.log("verify-um-anel-tarefas-combate: tarefas e efeitos de rodada × capítulo 6");

/* ── 1. Cada tarefa com sua postura e sua Perícia ──────────────────────── */

const ESPERADO = [
  {
    id: "intimidar-inimigo",
    label: "Intimidar Inimigo",
    stance: "avancada",
    skill: "imponencia",
    rotulo: "Fascínio",
    livro: /\*\*INTIMIDAR INIMIGO — Postura Avançada:\*\*/,
    pericia: /rolagem de \*\*FASCÍNIO\*\* como ação principal da rodada/,
  },
  {
    id: "reunir-companheiros",
    label: "Reunir Companheiros",
    stance: "aberta",
    skill: "encorajar",
    rotulo: "Indução",
    livro: /\*\*REUNIR COMPANHEIROS — Postura Aberta:\*\*/,
    pericia: /rolagem de \*\*INDUÇÃO\*\* como ação principal da rodada/,
  },
  {
    id: "proteger-companheiro",
    label: "Proteger Companheiro",
    stance: "defensiva",
    skill: "batalha",
    rotulo: "Batalha",
    livro: /\*\*PROTEGER COMPANHEIRO — Postura Defensiva:\*\*/,
    pericia: /rolagem de \*\*BATALHA\*\* como ação principal da rodada/,
  },
  {
    id: "preparar-tiro",
    label: "Preparar Tiro",
    stance: "retaguarda",
    skill: "vasculhar",
    rotulo: "Busca",
    livro: /\*\*PREPARAR TIRO — Postura de Retaguarda:\*\*/,
    pericia: /rolagem de \*\*BUSCA\*\* como ação principal da rodada/,
  },
];

for (const t of ESPERADO) {
  ok(`livro descreve ${t.label} na postura certa`, t.livro.test(CAP6));
  ok(`livro manda rolar ${t.rotulo} em ${t.label}`, t.pericia.test(CAP6), String(t.pericia));
  ok(`código define ${t.id}`, new RegExp(`id: "${t.id}"`).test(TASKS));
  ok(
    `${t.id}: postura ${t.stance}`,
    new RegExp(`id: "${t.id}"[\\s\\S]{0,400}?stance: "${t.stance}"`).test(TASKS)
  );
  ok(
    `${t.id}: Perícia ${t.skill}`,
    new RegExp(`id: "${t.id}"[\\s\\S]{0,400}?skill: "${t.skill}"`).test(TASKS)
  );
  /* O id da Perícia é interno; o rótulo é o que o jogador vê na ficha. Os dois
     precisam continuar apontando para a mesma coisa — foi essa divergência
     (VASCULHAR × Busca) que impediu estas tarefas de existirem antes. */
  ok(
    `${t.skill} tem rótulo "${t.rotulo}" em data.ts`,
    new RegExp(`id: "${t.skill}", label: "${t.rotulo}"`).test(DATA)
  );
  /* E o nome da tarefa tem de bater com o que a postura anuncia. */
  ok(
    `postura ${t.stance} anuncia "${t.label}"`,
    new RegExp(`id: "${t.stance}"[\\s\\S]{0,400}?combatTask: "${t.label}"`).test(STANCES)
  );
}

/* ── 2. Escalonamento por ícones de Sucesso ────────────────────────────── */

ok(
  "livro: Intimidar pega Vigor 1, depois 2, depois todos",
  /todos os oponentes com Vigor 1[\s\S]{0,400}?adversários com Vigor 2[\s\S]{0,200}?todos os adversários na\s*\n?luta/.test(
    CAP6
  )
);
const tasksCode = stripComments(TASKS);
ok("intimidateMightCap: 2+ ícones = todos", /if \(successIcons >= 2\) return null;/.test(tasksCode));
ok("intimidateMightCap: 1 ícone = Vigor 2", /successIcons >= 1 \? 2 : 1/.test(tasksCode));

ok(
  "livro: Reunir pega Avançada, depois Aberta, depois todo corpo a corpo",
  /membros da Companhia lutando em postura Avançada[\s\S]{0,300}?aqueles lutando em postura Aberta[\s\S]{0,200}?todos os heróis-jogadores\s*\n?lutando em uma postura de combate corpo a corpo/.test(
    CAP6
  )
);
ok(
  "rallyStances: 2+ ícones = as três de corpo a corpo",
  /return \["avancada", "aberta", "defensiva"\]/.test(tasksCode)
);
/* Retaguarda nunca entra: o livro fecha em "postura de Combate Corpo a Corpo". */
ok(
  "Reunir Companheiros nunca alcança a Retaguarda",
  !/retaguarda/.test(tasksCode.split("export function rallyStances")[1] ?? ""),
  "Retaguarda é a postura à distância — o livro exclui"
);

/* ── 3. As duas durações não podem ser confundidas ─────────────────────── */

const effCode = stripComments(EFFECTS);
ok(
  "livro: Intimidar vale na PRÓXIMA rolagem de ataque",
  /ficam Exaustos em sua próxima rolagem de\s*\n?ataque/.test(CAP6)
);
ok(
  "livro: Reunir vale NA RODADA SEGUINTE",
  /\*ganham \(1d\)\* em suas rolagens de ataque na rodada\s*\n?seguinte/.test(CAP6)
);
ok("intimidado é de uso único", /intimidado: true/.test(effCode));
ok("protegido é de uso único", /protegido: true/.test(effCode));
ok("tiro-preparado é de uso único", /"tiro-preparado": true/.test(effCode));
ok(
  "reunido NÃO é consumido pelo primeiro ataque",
  /reunido: false/.test(effCode),
  "some no 1º ataque se virar uso único"
);

/* ── 4. Regras de uso ──────────────────────────────────────────────────── */

const handlerCode = stripComments(HANDLER);
ok(
  "livro: só um herói usa Reunir Companheiros por rodada",
  /Apenas um herói-jogador pode escolher Reunir Companheiros em uma dada rodada/.test(CAP6)
);
ok("handler respeita o uma-vez-por-rodada", /task\.oncePerRound/.test(handlerCode));
ok(
  "a marca do uso vence na própria rodada",
  /kind: "reuniu", dice: 0, untilRound: round/.test(handlerCode),
  "se durar mais, a tarefa fica travada para sempre"
);
ok(
  "handler exige a postura da tarefa",
  /stance !== task\.stance/.test(handlerCode),
  "cada tarefa é ligada a uma postura"
);
ok(
  "só herói usa Tarefa de Combate",
  /combat\?\.kind !== "hero"/.test(handlerCode),
  "adversário não escolhe postura, então não tem tarefa"
);
ok(
  "confere o dono da ficha quando não é o Mestre",
  /canonicalId !== sheet\.ownerId/.test(handlerCode)
);
ok("recusa mesa que não seja do Um Anel", /rpgSystemId !== "um-anel"/.test(handlerCode));
ok(
  "Proteger Companheiro recusa alvo em Retaguarda",
  /torTokenStance\(ally\) === "retaguarda"/.test(handlerCode),
  "o livro protege quem luta em corpo a corpo"
);
ok("Proteger Companheiro recusa o próprio herói", /ally\.id === actor\.id/.test(handlerCode));
ok(
  "handler não monta authorName sozinho",
  !/authorName:/.test(handlerCode),
  "nome real da conta vazaria pro chat"
);
ok(
  "rota usa apelido como autor",
  existsSync(ROUTE_PATH) &&
    /authorName: session\.user\.nickname\?\.trim\(\) \|\| "Jogador"/.test(readFileSync(ROUTE_PATH, "utf8"))
);
/* `stripComments` aqui não é preciosismo: o próprio comentário da rota explica
   por que ela não usa `requireRoomManage`, e sem escopar a asserção casaria com
   a explicação em vez do código. */
ok(
  "rota NÃO exige requireRoomManage",
  existsSync(ROUTE_PATH) && !/requireRoomManage/.test(stripComments(readFileSync(ROUTE_PATH, "utf8"))),
  "a tarefa é ação do jogador"
);

/* ── 5. Os efeitos chegam ao ataque e são gastos ───────────────────────── */

const attackCode = stripComments(ATTACK);
ok("token guarda os efeitos de rodada", /roundEffects\?:/.test(TYPES));
ok("Intimidado deixa o adversário Exausto no ataque", /"intimidado", round\)/.test(attackCode));
ok("Reunido soma Dados de Sucesso", /"reunido", round\)/.test(attackCode));
ok("Protegido tira Dados de quem ataca", /"protegido", round\)/.test(attackCode));
ok(
  "Tiro Preparado só vale em ataque à distância",
  /if \(attackIsRanged\) \{[\s\S]{0,300}?"tiro-preparado"/.test(attackCode),
  "um golpe corpo a corpo não pode gastar a mira"
);
ok(
  "efeito gasto é gravado de volta no token",
  /roundEffects: attackerRoundEffects/.test(attackCode) &&
    /roundEffects: defenderRoundEffects/.test(attackCode),
  "sem gravar, o mesmo efeito valeria em todos os ataques"
);
/* Regressão real: o desconto de Ódio espalhava o `atkCombat` ORIGINAL e
   ressuscitava o efeito que o ataque tinha acabado de gastar. */
ok(
  "gasto de Ódio não ressuscita efeito já usado",
  /torCombat: \{ \.\.\.tokens\[atkIdx\]!\.torCombat!, hate:/.test(attackCode),
  "espalhar atkCombat desfaria o consumo do efeito"
);

/* ── 6. Limpeza na virada de rodada ────────────────────────────────────── */

const turnCode = stripComments(TURN);
ok("efeitos vencidos são limpos na virada de rodada", /pruneTorRoundEffects\(c\.roundEffects, round\)/.test(turnCode));
ok(
  "limpeza continua guardada por rpgSystemId",
  /rpgSystemId !== "um-anel"\) return;/.test(turnCode),
  "isolamento de hub"
);

/* ── 7. UI ─────────────────────────────────────────────────────────────── */

ok("popup mostra a tarefa da postura", /Tarefa de Combate — \{task\.label\}/.test(POPUP));
ok(
  "a tarefa oferecida vem da postura",
  /Object\.values\(TOR_COMBAT_TASK_BY_ID\)\.find\(\(t\) => t\.stance === stance\)/.test(POPUP),
  "oferecer Preparar Tiro a quem está no corpo a corpo confundiria a mesa"
);
ok("Proteger Companheiro pede o aliado", /task\.needsAlly \? \(/.test(POPUP));
ok(
  "lista de aliados exclui quem está em Retaguarda",
  /t\.torCombat\.stance !== "retaguarda"/.test(POPUP)
);
ok("erro da tarefa aparece pro jogador", /Falha na Tarefa de Combate/.test(POPUP));
ok(
  "popup avisa que custa a ação principal",
  /Custa a ação principal da rodada/.test(POPUP),
  "as Virtudes são a exceção, e a mesa precisa saber disso"
);
ok(
  "UI sem emoji",
  !/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(POPUP),
  "convenção do projeto: ícones só em SVG"
);

/* ── 8. O que segue fora ───────────────────────────────────────────────── */

/* Aparar, Investida de Escudo, Quebrar Escudo e Agarrar agora TÊM onde ser
   guardados, mas continuam fora: cada uma mexe em coisa diferente (Bloqueio da
   rodada, penalidade no alvo, escudo da ficha, restrição de postura) e entrar
   pela metade seria pior. O teste marca a fronteira. */
for (const nome of ["Aparar", "Investida de Escudo", "Quebrar Escudo", "Agarrar"]) {
  ok(
    `"${nome}" ainda não é aplicado pelo motor`,
    !new RegExp(`\\b${nome}\\b`).test(effCode) && !new RegExp(`\\b${nome}\\b`).test(attackCode)
  );
}

console.log(`\n  ${pass} ok, ${fail} falhas`);
if (fail > 0) process.exit(1);
