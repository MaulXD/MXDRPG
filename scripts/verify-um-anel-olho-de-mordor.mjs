/**
 * Atenção do Olho e a Caçada.
 *
 * Por que existe: o capítulo 8 traz o sistema do **Olho de Mordor** — Atenção do
 * Olho, limiar da Caçada e o episódio de Revelação — e nada dele existia no app.
 * Uma Companhia podia atravessar Terras Sombrias derramando Sombra sem que o
 * Inimigo jamais reparasse.
 *
 * Três armadilhas específicas, cada uma com asserção própria:
 * 1. a entrada de Cultura é a **mais alta**, não a soma — somar Anão + Elfo daria
 *    3 onde o livro dá 2, e o erro cresce com o tamanho do grupo;
 * 2. **igualar** o limiar já revela — usar `>` deixaria a Companhia escondida
 *    exatamente no ponto em que o livro manda revelá-la;
 * 3. depois do episódio a contagem volta ao valor **inicial**, não a zero.
 *
 * É regra OPCIONAL por escrito no livro, então nasce desligada e o app não a
 * impõe. E o episódio de Revelação em si é do Mestre — o app avisa, não decide.
 *
 * Fonte: livros/um-anel/08-mestre-e-adversarios.md §"O Olho de Mordor".
 */
import { readFileSync as rawReadFileSync, existsSync } from "fs";

const readFileSync = (p, enc) => rawReadFileSync(p, enc).replace(/\r\n/g, "\n");

import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = (...p) => join(__dirname, "..", ...p);

const CAP8 = readFileSync(root("livros", "um-anel", "08-mestre-e-adversarios.md"), "utf8");

const EYE = readFileSync(root("lib", "combat", "um-anel", "eye.ts"), "utf8");
const STATE = readFileSync(root("lib", "combat", "um-anel", "session-state.ts"), "utf8");
const HANDLER = readFileSync(root("lib", "room", "handlers", "tor-eye.ts"), "utf8");
const SHADOW_HANDLER = readFileSync(root("lib", "room", "handlers", "tor-shadow.ts"), "utf8");
const PANEL = readFileSync(root("components", "vtt", "TorEyePanel.tsx"), "utf8");
const JOURNEY_PANEL = readFileSync(root("components", "vtt", "TorJourneyPanel.tsx"), "utf8");
const SYNC = readFileSync(root("hooks", "useRoomSync.ts"), "utf8");
const SESSION_ROUTE = readFileSync(
  root("app", "api", "room", "[roomId]", "tor-session", "route.ts"),
  "utf8"
);
const ROUTE_PATH = root("app", "api", "room", "[roomId]", "tor-eye", "route.ts");

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

console.log("verify-um-anel-olho-de-mordor: Atenção do Olho, limiar da Caçada e Revelação");

/* ── 1. O livro ────────────────────────────────────────────────────────── */

ok(
  "livro: é regra OPCIONAL, dita em voz alta",
  /As regras relativas ao Olho de Mordor são particularmente adequadas para serem introduzidas mais tarde no jogo/.test(
    CAP8
  )
);
ok(
  "livro: aplique apenas a entrada mais alta, e some 1 por VALOR 4+",
  /aplique apenas a entrada mais alta aplicável\), depois some 1 por cada herói-jogador com VALOR de 4 ou mais/.test(
    CAP8
  )
);
ok(
  "livro: 2 por Arma e Armadura Famosa",
  /some 2 por cada Arma e Armadura Famosa carregada por membros da Companhia/.test(CAP8)
);
ok(
  "livro: Olho rolado fora do combate soma 1",
  /Aumente a Atenção do Olho da Companhia em 1 ponto sempre que uma rolagem feita por um jogador fora do combate produzir um ícone ⊘/.test(
    CAP8
  )
);
ok(
  "livro: Sombra fora do combate soma quantidade igual",
  /Sempre que um herói-jogador ganha 1 ou mais pontos de Sombra fora do combate, aumente o nível de Atenção do Olho em quantidade igual/.test(
    CAP8
  )
);
ok(
  "livro: magia soma 1, 2 ou 3 por porte do feitiço",
  /aumento da Atenção do Olho em 1 ponto no caso de um efeito menor, 2 pontos para um feitiço maior, e 3 pontos para um feitiço realmente poderoso/.test(
    CAP8
  )
);
ok("livro: limiar 18 nas Terras Fronteiriças", /\| Terra Fronteiriça \| 18 \|/.test(CAP8));
ok("livro: limiar 16 nas Terras Selvagens", /\| Terra Selvagem \| 16 \|/.test(CAP8));
ok("livro: limiar 14 nas Terras Sombrias", /\| Terra Sombria \| 14 \|/.test(CAP8));
ok(
  "livro: igualar ou exceder REVELA",
  /Se a Atenção do Olho igualar ou exceder o limiar da Caçada, o grupo será revelado ao Olho/.test(
    CAP8
  )
);
ok(
  "livro: depois do episódio volta ao valor INICIAL",
  /a Companhia é considerada escondida de novo, e o nível de Atenção do Olho da companhia é redefinido em seu valor inicial/.test(
    CAP8
  )
);
ok(
  "livro: o episódio de Revelação é julgamento do Mestre",
  /o Mestre deveria ponderar as circunstâncias atuais da Companhia e escolher um curso de eventos/.test(
    CAP8
  )
);

/* ── 2. A conta, rodando de verdade ────────────────────────────────────── */

const mod = await import(
  "file://" + root("lib", "combat", "um-anel", "eye.ts").replace(/\\/g, "/")
).catch(() => null);
ok("eye.ts pôde ser importado para conferir a conta", mod != null);

if (mod) {
  const {
    computeTorInitialEyeAwareness,
    torHuntThreshold,
    torIsRevealed,
    TOR_HUNT_REGION_THRESHOLD,
    isTorEyeSource,
    isTorHuntModifier,
  } = mod;

  const hobbit = { culture: "hobbits", valour: 1 };
  const anao = { culture: "anoes", valour: 1 };
  const elfo = { culture: "elfos", valour: 1 };
  const ranger = { culture: "rangers", valour: 1 };

  ok("Companhia só de Hobbits: base 0", computeTorInitialEyeAwareness([hobbit, hobbit]).total === 0);
  ok("um Anão: base 1", computeTorInitialEyeAwareness([hobbit, anao]).total === 1);
  ok("um Elfo: base 2", computeTorInitialEyeAwareness([hobbit, elfo]).total === 2);
  ok("um Dúnedain: base 2", computeTorInitialEyeAwareness([hobbit, ranger]).total === 2);
  /* A armadilha: MÁXIMO, não soma. */
  ok(
    "Anão + Elfo dá 2, não 3",
    computeTorInitialEyeAwareness([anao, elfo]).total === 2,
    "'aplique apenas a entrada mais alta aplicável' — somar erra mais quanto maior o grupo"
  );
  ok(
    "Elfo + Dúnedain dá 2, não 4",
    computeTorInitialEyeAwareness([elfo, ranger]).total === 2
  );
  ok(
    "VALOR 4 soma 1, VALOR 3 não soma",
    computeTorInitialEyeAwareness([{ culture: "hobbits", valour: 4 }]).total === 1 &&
      computeTorInitialEyeAwareness([{ culture: "hobbits", valour: 3 }]).total === 0
  );
  ok(
    "cada Arma/Armadura Famosa soma 2",
    computeTorInitialEyeAwareness([{ culture: "hobbits", valour: 1, famousItems: 2 }]).total === 4
  );
  ok(
    "as três parcelas somam juntas",
    computeTorInitialEyeAwareness([
      { culture: "elfos", valour: 5, famousItems: 1 },
      { culture: "anoes", valour: 4 },
    ]).total === 6,
    "Cultura 2 + dois heróis com VALOR 4+ (2) + uma Famosa (2)"
  );

  ok("limiar Fronteiriça é 18", TOR_HUNT_REGION_THRESHOLD.fronteirica === 18);
  ok("limiar Selvagem é 16", TOR_HUNT_REGION_THRESHOLD.selvagem === 16);
  ok("limiar Sombria é 14", TOR_HUNT_REGION_THRESHOLD.sombria === 14);

  ok("bênção de Mago soma 4", torHuntThreshold("selvagem", ["bencao"]) === 20);
  ok("discrição soma 2", torHuntThreshold("selvagem", ["discricao"]) === 18);
  ok("renome tira 2", torHuntThreshold("selvagem", ["renome"]) === 14);
  ok("procurados tira 4", torHuntThreshold("selvagem", ["procurados"]) === 12);
  ok(
    "modificadores se somam entre si",
    torHuntThreshold("sombria", ["bencao", "procurados"]) === 14
  );
  ok("o limiar não fica negativo", torHuntThreshold("sombria", ["procurados", "procurados"]) >= 0);

  /* A armadilha: IGUALAR já revela. */
  ok(
    "igualar o limiar JÁ revela",
    torIsRevealed(16, 16) === true,
    "usar `>` deixaria escondida exatamente no ponto em que o livro revela"
  );
  ok("abaixo do limiar continua escondida", torIsRevealed(15, 16) === false);
  ok("acima do limiar revela", torIsRevealed(17, 16) === true);

  ok(
    "a rota só aceita fonte e modificador conhecidos",
    isTorEyeSource("magia") === true &&
      isTorEyeSource("qualquer") === false &&
      isTorHuntModifier("bencao") === true &&
      isTorHuntModifier("sorte") === false
  );
}

/* ── 3. A regra é opcional, e o estado prova isso ──────────────────────── */

const stateCode = stripComments(STATE);
ok(
  "o estado do Olho é opcional no tipo",
  /eye\?: TorEyeState \| null;/.test(stateCode),
  "ausente tem de significar 'a mesa nunca ligou', distinguível de zero"
);
ok(
  "estado ausente devolve null, não um objeto zerado",
  /function normalizeEye\(raw: unknown\): TorEyeState \| null \{\s*\n\s*if \(!raw \|\| typeof raw !== "object"\) return null;/.test(
    stateCode
  )
);
ok(
  "modificador repetido no JSONB não conta duas vezes",
  /modifiers: \[\.\.\.new Set\(modifiers\)\]/.test(stateCode),
  "sem o Set, 'discricao' gravado duas vezes daria +4 em vez de +2"
);
/* A auditoria da rodada: `applyTorSessionPatch` descartava o estado inteiro
   quando não havia jornada/conselho/companhia — então ligar só o NA 18 (ou só o
   Olho) era jogado fora na gravação, enquanto `normalizeTorSession` já
   preservava. Duas leituras opostas da mesma condição. */
ok(
  "a guarda de estado vazio cita TODOS os campos",
  /if \(!next\.journey && !next\.council && !next\.fellowship && !next\.attributeTnBase && !next\.eye\) \{/.test(
    stateCode
  ),
  "faltando um campo, ligar só aquela opção era descartado na gravação"
);
ok(
  "a leitura concorda com a gravação",
  /if \(!journey && !council && !fellowship && !attributeTnBase && !eye\) return undefined;/.test(
    stateCode
  )
);
ok(
  "a rota de sessão aceita ligar e desligar o Olho",
  /if \("eye" in body\) patch\.eye = body\.eye as TorSessionPatch\["eye"\];/.test(
    stripComments(SESSION_ROUTE)
  )
);

/* ── 4. Caminho: rota, handler, painel ─────────────────────────────────── */

ok("a rota existe", existsSync(ROUTE_PATH));
const routeCode = stripComments(readFileSync(ROUTE_PATH, "utf8"));
ok("a rota valida a fonte", /isTorEyeSource\(body\.source\)/.test(routeCode));
ok(
  "a rota manda o apelido para o chat, nunca o nome da conta",
  /authorName: session\.user\.nickname\?\.trim\(\) \|\| "Jogador"/.test(routeCode)
);

const handlerCode = stripComments(HANDLER);
ok(
  "handler exige o Mestre",
  /if \(!canManageRoom\(room, user\)\) \{[\s\S]{0,120}"Só o Mestre registra a Atenção do Olho"/.test(
    handlerCode
  )
);
ok(
  "handler recusa quando a mesa não ligou a regra opcional",
  /if \(!eye\) \{[\s\S]{0,160}regra opcional e não está ligado nesta mesa/.test(handlerCode)
);
ok(
  "a Revelação devolve ao valor INICIAL, não a zero",
  /after = eye\.initial;/.test(handlerCode),
  "zerar apagaria a Atenção que a composição da Companhia sempre dá"
);
ok(
  "o limiar sai da região e dos modificadores guardados",
  /torHuntThreshold\(eye\.region, eye\.modifiers\)/.test(handlerCode)
);
/* NEGATIVA: o app NÃO escolhe o episódio de Revelação. O livro entrega isso ao
   Mestre por escrito; um app que sorteasse o episódio estaria jogando por ele. */
ok(
  "o app NÃO sorteia o episódio de Revelação",
  !/Math\.random/.test(handlerCode) && !/EPISODIOS|EPISODIOS_DE_REVELACAO/.test(handlerCode),
  "o livro manda o Mestre ponderar as circunstâncias — o app avisa, não decide"
);

/* O gancho automático: Sombra fora do combate. */
const shadowCode = stripComments(SHADOW_HANDLER);
ok(
  "ganhar Sombra chama a Atenção do Olho",
  /applyTorEyeShadowGain\(room, result\.state\.shadow - state\.shadow\)/.test(shadowCode),
  "usa o ganho EFETIVO, não os pontos pedidos — o Teste de Sombra pode ter reduzido"
);
ok(
  "e o resultado entra na mesma mensagem de chat",
  /if \(olho\) text \+= ` · \$\{olho\}`;/.test(shadowCode)
);
ok(
  "só fora do combate",
  /if \(\(room\.combat\?\.order\.length \?\? 0\) > 0\) return null;/.test(handlerCode),
  "o livro diz 'fora do combate' — fila de iniciativa montada é o sinal da mesa"
);
ok(
  "e não faz nada se a mesa não ligou a regra",
  /const eye = session\?\.eye;\s*\n\s*if \(!eye\) return null;/.test(handlerCode)
);

const panelCode = stripComments(PANEL);
ok("o painel liga a regra com a conta aberta", /Ligar o Olho de Mordor/.test(panelCode));
ok(
  "a conta inicial aparece parcela a parcela",
  /breakdown\.cultureBase[\s\S]{0,120}breakdown\.valourBonus[\s\S]{0,120}breakdown\.famousBonus/.test(
    panelCode
  ),
  "sem as parcelas o Mestre não vê que a Cultura é máximo e não soma"
);
ok(
  "o botão de Revelação só aparece quando a Companhia está revelada",
  /\{revealed \?[\s\S]{0,500}action: "reveal"/.test(panelCode)
);
/* NEGATIVA: nenhuma das DUAS fontes automáticas pode ter botão de "+1" aqui,
   senão o Mestre somaria duas vezes — uma pelo gancho e outra pela mão.

   A asserção antiga casava com o `filter((s) => s !== "sombra")` do painel, que
   sumiu quando o ⊘ rolado também virou automático. Ela travava a FORMA, não a
   regra; esta trava a regra. */
ok(
  "o painel NÃO oferece botão manual de Sombra",
  !/source: "sombra"/.test(panelCode),
  "a Sombra já sobe sozinha pelo painel do token; um botão aqui contaria em dobro"
);
ok(
  "o ⊘ rolado aparece como AJUSTE, com um botão que TIRA",
  /source: "olho-rolado",\s*points: p,/.test(panelCode) && /\{ p: -1, label: "−1/.test(panelCode),
  "o gancho já lançou o +1 padrão; o que sobra é o julgamento do livro, e ele vai nos dois sentidos"
);
ok(
  "o jogador vê o placar, mas não os controles",
  /if \(!canManage\) return null;/.test(panelCode) && /\{!canManage \? null : \(/.test(panelCode)
);

/* ── 4b. O gancho automático do ⊘ rolado ───────────────────────────────── */

const chatRoute = stripComments(
  readFileSync(root("app", "api", "room", "[roomId]", "chat", "route.ts"), "utf8")
);
ok(
  "a rota de chat chama o gancho quando veio um Dado de Proeza",
  /if \(featDieValue != null\) \{[\s\S]{0,220}appendTorEyeFromFeatDie\(roomId, featDieValue, author\)/.test(
    chatRoute
  ),
  "é a única rota por onde passam TODAS as rolagens de painel e de ficha"
);
/* Ordem: o gancho roda DEPOIS de a rolagem estar persistida — ancorado nas
   CHAMADAS, não nos imports. */
const persistiu = chatRoute.indexOf("await addRoomChatMessage(roomId, {\n    ...author,\n    kind: \"chat\"");
const enganchou = chatRoute.indexOf("appendTorEyeFromFeatDie(roomId");
ok(
  "o gancho roda DEPOIS de a rolagem estar gravada",
  persistiu > 0 && enganchou > 0 && persistiu < enganchou,
  `persistiu=${persistiu} enganchou=${enganchou} — o gancho não pode desfazer o que a mesa já leu`
);
ok(
  "o gancho só reage à face do Olho",
  /if \(featDieFace !== TOR_EYE_FEAT_FACE\) return null;/.test(handlerCode),
  "é a FACE (11) que trafega no chat, não o valor de jogo — o Olho vale zero"
);
ok(
  "a face do Olho no gancho bate com a de dice.ts",
  /export const TOR_EYE_FEAT_FACE = 11;/.test(EYE) &&
    /"eye"\) return 11;/.test(readFileSync(root("lib", "character", "um-anel", "dice.ts"), "utf8")),
  "duas constantes que divergissem fariam o gancho nunca disparar"
);
ok(
  "o gancho recusa mesa que não é do Um Anel",
  /if \(!room \|\| room\.rpgSystemId !== "um-anel"\) return null;/.test(handlerCode)
);
ok(
  "as duas fontes automáticas passam pela MESMA função",
  /function applyTorEyeAutoGain\(/.test(handlerCode) &&
    /return applyTorEyeAutoGain\(room, "sombra", shadowPoints\);/.test(handlerCode) &&
    /return applyTorEyeAutoGain\(room, "olho-rolado", 1\);/.test(handlerCode),
  "a guarda de 'fora do combate' e a de regra desligada valem para as duas"
);
/* O julgamento do livro vai nos DOIS sentidos: subir para 2+ numa cena grave, ou
   anular num lugar seguro. Como o automático já lançou o +1, anular exige tirar. */
ok(
  "o handler aceita ajuste negativo",
  /const points = Math\.max\(-10, Math\.min\(10, Math\.floor\(action\.points\)\)\);/.test(
    handlerCode
  ),
  "sem negativo, 'um ⊘ pode não provocar aumento algum' seria impossível de aplicar"
);
ok(
  "mas a Atenção nunca fica negativa",
  /after = Math\.max\(0, Math\.min\(99, before \+ points\)\);/.test(handlerCode)
);
ok("e zero não é um ajuste válido", /if \(points === 0\) return \{ ok: false/.test(handlerCode));

const journeyCode = stripComments(JOURNEY_PANEL);
ok(
  "iniciar jornada sincroniza a região do limiar",
  /if \(eye && eye\.region !== draftRegion\) \{[\s\S]{0,160}eye: \{ \.\.\.eye, region: draftRegion \}/.test(
    journeyCode
  ),
  "sem isso a Companhia entraria em Terras Sombrias com o limiar das Fronteiriças"
);
ok("o painel do Olho é renderizado", /<TorEyePanel/.test(journeyCode));
ok("o hook expõe a chamada", /export async function postRoomTorEye\(/.test(SYNC));
ok("o hook aponta para a rota certa", /`\/api\/room\/\$\{roomId\}\/tor-eye`/.test(SYNC));

/* ── 5. Nada ficou desligado ───────────────────────────────────────────── */

const consumidores = handlerCode + panelCode + stateCode + shadowCode;
for (const fn of [
  "computeTorInitialEyeAwareness",
  "torHuntThreshold",
  "torIsRevealed",
  "formatTorEyeMessage",
  "isTorHuntModifier",
  "TOR_HUNT_MODIFIER_META",
  "TOR_EYE_SOURCE_META",
]) {
  ok(`${fn} tem consumidor fora de eye.ts`, new RegExp(`\\b${fn}\\b`).test(consumidores));
}

console.log(`\nverify-um-anel-olho-de-mordor: ${pass} ok, ${fail} falhas`);
if (fail > 0) process.exit(1);
