/**
 * A Fadiga que SOBE.
 *
 * Por que existe: o motor tinha três formas de TIRAR Fadiga (Descanso
 * Prolongado, Vigor da montaria, rolagem de VIAGEM no fim da jornada) e
 * **nenhuma de pôr**. `resolveTorJourneyEvent` calculava `fatigueAll` e
 * `fatigueTarget`, `computeTorJourneyLength` calculava `forcedMarchFatigue` — e
 * os três só viravam texto no chat. O único jeito de a Fadiga subir era alguém
 * digitar o número no contador da ficha.
 *
 * O efeito era silencioso e grave: **Exausto** é derivado de
 * `Resistência ≤ Carga + Fadiga`, então a condição que a Fadiga existe para
 * produzir nunca disparava sozinha.
 *
 * Junto vinham duas Virtudes Culturais que só existiam como texto de descrição —
 * **Cram** (Bardos) e **Resistência do Ranger** (Rangers do Norte) —, e a regra
 * de que a Fadiga não sai enquanto a jornada dura.
 *
 * Fonte: livros/um-anel/06-fases-de-aventura-combate.md §"Fadiga de Viagem",
 * §"Marcha Forçada" e a Tabela de Eventos de Jornada;
 * livros/um-anel/05-valor-e-sabedoria.md (Cram, Resistência do Ranger);
 * livros/um-anel/04-caracteristicas.md §FADIGA.
 */
import { readFileSync as rawReadFileSync, existsSync, readdirSync } from "fs";

/* Normaliza CRLF -> LF na leitura: âncoras de linha não devem depender de fim
   de linha (no Windows um clone novo entrega CRLF). */
const readFileSync = (p, enc) => rawReadFileSync(p, enc).replace(/\r\n/g, "\n");

import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = (...p) => join(__dirname, "..", ...p);

const CAP4 = readFileSync(root("livros", "um-anel", "04-caracteristicas.md"), "utf8");
const CAP5 = readFileSync(root("livros", "um-anel", "05-valor-e-sabedoria.md"), "utf8");
const CAP6 = readFileSync(root("livros", "um-anel", "06-fases-de-aventura-combate.md"), "utf8");

const FATIGUE = readFileSync(root("lib", "combat", "um-anel", "fatigue.ts"), "utf8");
const SHADOW = readFileSync(root("lib", "combat", "um-anel", "shadow.ts"), "utf8");
const HANDLER = readFileSync(root("lib", "room", "handlers", "tor-fatigue.ts"), "utf8");
const RECOVERY = readFileSync(root("lib", "room", "handlers", "tor-recovery.ts"), "utf8");
const JOURNEY_PANEL = readFileSync(root("components", "vtt", "TorJourneyPanel.tsx"), "utf8");
const SHADOW_PANEL = readFileSync(root("components", "vtt", "TorShadowPanel.tsx"), "utf8");
const SYNC = readFileSync(root("hooks", "useRoomSync.ts"), "utf8");
const VIRTUES = readFileSync(root("lib", "character", "um-anel", "cultural-virtues.ts"), "utf8");
const ROUTE_PATH = root("app", "api", "room", "[roomId]", "tor-fatigue", "route.ts");

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

console.log("verify-um-anel-fadiga: a Fadiga sobe, e as Virtudes que a seguram agem");

/* ── 1. O livro ────────────────────────────────────────────────────────── */

ok(
  "livro: todo Evento de Jornada dá Fadiga a TODOS na Companhia",
  /Todos os eventos adicionalmente fazem com que todos na Companhia ganhem uma quantidade de\s+pontos de Fadiga/.test(
    CAP6
  )
);
ok(
  "livro: marcha forçada custa 1 Fadiga por dia",
  /acumula \*\*1 ponto adicional de[\s>]+Fadiga\*\* por cada dia de marcha forçada/.test(CAP6)
);
ok(
  "livro: a Fadiga não sai enquanto a jornada dura",
  /não podem ser removidos enquanto a\s+jornada durar/.test(CAP6)
);
ok(
  "livro: o Descanso Prolongado que tira Fadiga é o de refúgio, não o da estrada",
  /refúgio abrigado e seguro \(isto é, não 'na estrada'\)/.test(CAP6)
);
ok(
  "livro: a Fadiga eleva a Carga total (é assim que vira Exausto)",
  /elevam temporariamente a Carga total de um herói-jogador em viagem/.test(CAP4)
);
ok(
  "livro: Cram tira 1 ponto de Fadiga de Evento de Jornada",
  /Cada vez que você ganha Fadiga por um Evento de Jornada, você ganha 1 ponto menos\./.test(CAP5)
);
ok(
  "livro: Resistência do Ranger cancela a Fadiga com Couro ou nada, e sem escudo",
  /Se você usar uma armadura de Couro ou nenhuma armadura, e não carregar escudo, você nunca ganha Fadiga durante uma jornada\./.test(
    CAP5
  )
);

/* ── 2. A conta, rodando de verdade ────────────────────────────────────── */

/* fatigue.ts foi escrito SEM import de runtime justamente para poder ser
   importado aqui e conferido com números. O `catch` é proposital, mas não pode
   sumir em silêncio: sem a asserção abaixo, uma falha de import apagaria todas
   as checagens de aritmética e o teste seguiria verde. */
const mod = await import(
  "file://" + root("lib", "combat", "um-anel", "fatigue.ts").replace(/\\/g, "/")
).catch(() => null);
ok("fatigue.ts pôde ser importado para conferir a conta", mod != null);

if (mod) {
  const { torFatigueGain, torArmourWeight, torRangerEnduranceApplies, isTorFatigueSource } = mod;

  const semVirtude = { virtues: [], armour: "nenhuma", hasShield: false };
  /* Bardo de malha e escudo de propósito: prova que Cram age sozinho, sem
     depender do equipamento — quem olha equipamento é a outra Virtude. */
  const bardo = { virtues: ["cram"], armour: "pesada", hasShield: true };
  const rangerLeve = { virtues: ["resistencia-do-ranger"], armour: "couro", hasShield: false };

  ok(
    "sem Virtude, o herói ganha tudo o que o evento mandou",
    torFatigueGain(semVirtude, { points: 2, source: "evento" }).gained === 2
  );
  ok(
    "Cram tira 1 ponto num Evento de Jornada",
    torFatigueGain(bardo, { points: 2, source: "evento" }).gained === 1
  );
  ok(
    "Cram NÃO tira nada da marcha forçada",
    torFatigueGain(bardo, { points: 2, source: "marcha-forcada" }).gained === 2,
    "a Virtude diz 'por um Evento de Jornada' — marcha forçada não é evento"
  );
  ok(
    "Cram NÃO tira nada da Fadiga narrada pelo Mestre",
    torFatigueGain(bardo, { points: 2, source: "mestre" }).gained === 2
  );
  ok(
    "Cram não empurra o ganho abaixo de zero",
    torFatigueGain(bardo, { points: 1, source: "evento" }).gained === 0
  );
  ok(
    "Resistência do Ranger cancela tudo com Couro e sem escudo",
    torFatigueGain(rangerLeve, { points: 3, source: "evento" }).gained === 0
  );
  ok(
    "Resistência do Ranger cancela a marcha forçada também",
    torFatigueGain(rangerLeve, { points: 3, source: "marcha-forcada" }).gained === 0,
    "a Virtude diz 'nunca ganha Fadiga durante uma jornada', sem restringir a fonte"
  );
  ok(
    "com escudo, a Resistência do Ranger não vale",
    torFatigueGain({ ...rangerLeve, hasShield: true }, { points: 3, source: "evento" }).gained === 3
  );
  ok(
    "com armadura pesada, a Resistência do Ranger não vale",
    torFatigueGain({ ...rangerLeve, armour: "pesada" }, { points: 3, source: "evento" }).gained === 3
  );
  /* O lado OPOSTO: sem a Virtude, andar de couro e sem escudo não isenta
     ninguém. Sem esta, um bug que ignorasse a lista de Virtudes passaria. */
  ok(
    "sem a Virtude, Couro sem escudo NÃO isenta",
    torFatigueGain({ virtues: [], armour: "couro", hasShield: false }, { points: 3, source: "evento" })
      .gained === 3
  );
  ok(
    "quem foi poupado é dito em voz alta",
    torFatigueGain(rangerLeve, { points: 3, source: "evento" }).reasons.join() ===
      "Resistência do Ranger"
  );
  ok(
    "os pontos poupados são contados",
    torFatigueGain(bardo, { points: 2, source: "evento" }).spared === 1
  );

  ok("armadura ausente é 'nenhuma'", torArmourWeight({ equipped: false }) === "nenhuma");
  ok(
    "Couro da tabela vira 'couro'",
    torArmourWeight({ equipped: true, type: "leather" }) === "couro"
  );
  ok("Malha vira 'pesada'", torArmourWeight({ equipped: true, type: "mail" }) === "pesada");
  ok(
    "armadura desconhecida conta como pesada, não como isenção",
    torArmourWeight({ equipped: true, type: undefined }) === "pesada",
    "errar para o lado de conceder daria de graça o que a Virtude cobra"
  );

  ok(
    "torRangerEnduranceApplies exige a Virtude",
    torRangerEnduranceApplies({ virtues: [], armour: "nenhuma", hasShield: false }) === false &&
      torRangerEnduranceApplies(rangerLeve) === true
  );

  ok(
    "a rota só aceita fontes conhecidas",
    isTorFatigueSource("evento") === true && isTorFatigueSource("qualquer-coisa") === false
  );
}

/* ── 3. A soma existe, e mora ao lado de quem tira ─────────────────────── */

const shadowCode = stripComments(SHADOW);
ok(
  "shadow.ts ganhou a direção que faltava",
  /export function applyTorFatigueGain\(/.test(shadowCode)
);
ok(
  "a soma parte da Fadiga atual, não substitui",
  /fatigue: Math\.max\(0, state\.fatigue\) \+ add/.test(shadowCode),
  "gravar só o delta apagaria a Fadiga acumulada da jornada"
);
/* O lado OPOSTO da mudança: quem TIRA continua tirando. */
ok(
  "o Descanso Prolongado continua subtraindo",
  /fatigue: Math\.max\(0, state\.fatigue - fatigueRemoved\)/.test(shadowCode)
);
ok(
  "o fim de jornada continua subtraindo",
  /fatigue: state\.fatigue - removed/.test(shadowCode)
);
ok(
  "Exausto é comparado ANTES e DEPOIS para anunciar a virada",
  /const before = deriveTorSpiritFlags\(state\);/.test(shadowCode) &&
    /becameWeary: !before\.weary && flags\.weary/.test(shadowCode),
  "sem o antes/depois a mesa não lê o momento em que o herói ficou Exausto"
);

/* ── 4. O caminho até a ficha ──────────────────────────────────────────── */

ok("a rota existe", existsSync(ROUTE_PATH));
const routeCode = stripComments(readFileSync(ROUTE_PATH, "utf8"));
ok("a rota valida a fonte antes de chamar o handler", /isTorFatigueSource\(source\)/.test(routeCode));
ok(
  "a rota exige o token quando o alvo é um herói só",
  /if \(!tokenId\) return NextResponse\.json\(\{ error: "Informe o token" \}/.test(routeCode)
);
ok(
  "a rota manda o apelido para o chat, nunca o nome da conta",
  /authorName: session\.user\.nickname\?\.trim\(\) \|\| "Jogador"/.test(routeCode)
);

const handlerCode = stripComments(HANDLER);
ok("handler usa a conta por herói", /torFatigueGain\(/.test(handlerCode));
ok("handler usa a soma do motor", /applyTorFatigueGain\(spiritStateFromSheet\(sheet\)/.test(handlerCode));
ok(
  "handler grava o TOTAL, não o ganho",
  /\{ fatigue: applied\.state\.fatigue \}/.test(handlerCode),
  "gravar `gain.gained` zeraria a Fadiga acumulada a cada evento"
);
ok(
  "handler exige o Mestre",
  /if \(!canManageRoom\(room, user\)\) return \{ ok: false, error: "Só o Mestre atribui Fadiga" \}/.test(
    handlerCode
  )
);
ok(
  "a Companhia é resolvida no servidor, a partir da cena",
  /room\.scene\.tokens\.filter\(/.test(handlerCode) &&
    /t\.torCombat\?\.kind === "hero"/.test(handlerCode),
  "deixar o painel montar a lista deixaria de fora quem o Mestre não vê"
);
ok(
  "a armadura da ficha é traduzida pela tabela, não adivinhada",
  /torArmourWeight\(\{[\s\S]{0,160}ARMOUR_BY_ID\[armourId\]\?\.type/.test(handlerCode)
);

/* Grava antes de anunciar — ancorado na CHAMADA, não no import. */
const gravou = handlerCode.indexOf("patchTorCharacterResources(\n");
const anunciou = handlerCode.indexOf("appendRoomChatMessage(room");
ok(
  "grava a ficha ANTES de anunciar no chat",
  gravou > 0 && anunciou > 0 && gravou < anunciou,
  `gravou=${gravou} anunciou=${anunciou}`
);
ok(
  "quem foi poupado ainda aparece no chat",
  /if \(gain\.gained > 0\) \{/.test(handlerCode),
  "sem o `if`, um Ranger isento sofreria uma escrita à toa; sem a linha, sumiria do chat"
);

/* ── 5. Os dois gatilhos automáticos do painel de Jornada ──────────────── */

const journeyCode = stripComments(JOURNEY_PANEL);
ok(
  "o Evento de Jornada aplica a Fadiga da Companhia",
  /if \(outcome\.fatigueAll > 0\) \{[\s\S]{0,200}postRoomTorFatigue\(roomId, \{[\s\S]{0,120}scope: "company"[\s\S]{0,120}source: "evento"/.test(
    journeyCode
  )
);
ok(
  "a marcha forçada cobra na chegada, e só se houve marcha forçada",
  /if \(progress\.forcedMarch && length\.forcedMarchFatigue > 0\) \{[\s\S]{0,220}source: "marcha-forcada"/.test(
    journeyCode
  ),
  "sem a guarda, toda chegada cobraria Fadiga de marcha"
);
/* NEGATIVA: a Fadiga extra do ALVO não pode ser aplicada sozinha. O alvo do
   evento é um PAPEL preenchido com nomes digitados, não um token — o app não
   sabe qual herói rolou, e chutar cobraria do herói errado. */
ok(
  "o painel NÃO aplica sozinho a Fadiga extra do alvo",
  !/fatigueTarget[\s\S]{0,200}postRoomTorFatigue/.test(journeyCode),
  "o alvo é um papel com nomes digitados, não um token — quem sabe é o Mestre"
);

const shadowPanelCode = stripComments(SHADOW_PANEL);
ok(
  "o painel do token aplica Fadiga a um herói só",
  /postRoomTorFatigue\(roomId, \{[\s\S]{0,160}scope: "token"[\s\S]{0,160}source: "mestre"/.test(
    shadowPanelCode
  )
);
ok(
  "o painel do token pede pelo menos 1 ponto",
  /Math\.max\(1, Math\.min\(10, Number\(e\.target\.value\) \|\| 1\)\)/.test(shadowPanelCode)
);
ok("o hook expõe a chamada", /export async function postRoomTorFatigue\(/.test(SYNC));
ok(
  "o hook aponta para a rota certa",
  /`\/api\/room\/\$\{roomId\}\/tor-fatigue`/.test(SYNC)
);

/* ── 6. A Fadiga não sai na estrada ────────────────────────────────────── */

const recoveryCode = stripComments(RECOVERY);
ok(
  "o descanso sabe se a Companhia ainda está viajando",
  /const journeyInProgress = \(torSession\?\.journey\?\.remaining \?\? 0\) > 0;/.test(recoveryCode)
);
ok(
  "o Descanso Prolongado na estrada NÃO tira Fadiga",
  /prolongado && !journeyInProgress \? applyTorProlongedRest\(state\)\.state\.fatigue : sheet\.fatigue/.test(
    recoveryCode
  ),
  "o livro só tira Fadiga num refúgio abrigado, depois da jornada"
);
ok(
  "a Resistência continua voltando mesmo na estrada",
  /endurance: \{ \.\.\.sheet\.endurance, value: sheet\.endurance\.value \+ recovered \}/.test(
    recoveryCode
  ),
  "o livro trava só a Fadiga; travar a Resistência junto seria inventar"
);

/* ── 7. As duas Virtudes deixaram de ser só descrição ──────────────────── */

ok("Cram existe na tabela de Virtudes Culturais", /id: "cram"/.test(VIRTUES));
ok(
  "Resistência do Ranger existe na tabela",
  /id: "resistencia-do-ranger"/.test(VIRTUES)
);

/* Varredura por DIRETÓRIO, não por lista fixa: uma dívida paga num arquivo novo
   precisa ser vista. */
function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name.startsWith(".")) {
      continue;
    }
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const arquivos = [
  ...walk(root("lib")),
  ...walk(root("components")),
  ...walk(root("app")),
  ...walk(root("hooks")),
];

function usadoFora(nome, arquivoQueDefine) {
  return arquivos.some(
    (f) =>
      !f.endsWith(arquivoQueDefine) &&
      new RegExp(`\\b${nome}\\b`).test(stripComments(readFileSync(f, "utf8")))
  );
}

for (const [id, arquivo] of [
  ["cram", "cultural-virtues.ts"],
  ["resistencia-do-ranger", "cultural-virtues.ts"],
]) {
  ok(
    `a Virtude "${id}" é consultada fora da tabela que a descreve`,
    arquivos.some(
      (f) => !f.endsWith(arquivo) && stripComments(readFileSync(f, "utf8")).includes(`"${id}"`)
    ),
    "descrição sem consumidor é regra desligada"
  );
}

for (const [fn, arquivo] of [
  ["torFatigueGain", join("um-anel", "fatigue.ts")],
  ["torArmourWeight", join("um-anel", "fatigue.ts")],
  ["formatTorFatigueLine", join("um-anel", "fatigue.ts")],
  ["applyTorFatigueGain", join("um-anel", "shadow.ts")],
  ["postRoomTorFatigue", "useRoomSync.ts"],
]) {
  ok(`${fn} tem consumidor real fora de ${arquivo}`, usadoFora(fn, arquivo));
}

console.log(`\nverify-um-anel-fadiga: ${pass} ok, ${fail} falhas`);
if (fail > 0) process.exit(1);
