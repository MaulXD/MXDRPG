/**
 * Verifica a persistência do estado de sessão do Um Anel em `RoomState`.
 * Entra em `npm run test`.
 *
 * O que existe para proteger:
 *  - o estado vem de JSONB e pode ter sido escrito por versão anterior — tudo
 *    é recortado em `normalizeTorSession`, nada é confiado
 *  - `null` num campo do patch APAGA; ausente deixa como está. Sem essa
 *    distinção não haveria como encerrar uma jornada
 *  - só o Mestre escreve, e só em mesa do Um Anel (isolamento de hub)
 *  - `torSession` precisa estar no SNAPSHOT, senão os jogadores não veem o
 *    placar e a persistência não resolve o problema que motivou o trabalho
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const r = (...p) => readFileSync(join(__dirname, "..", ...p), "utf8");

const STATE = r("lib", "combat", "um-anel", "session-state.ts");
const HANDLER = r("lib", "room", "handlers", "tor-session.ts");
const TYPES = r("lib", "room", "types.ts");
const REGISTRY = r("lib", "room", "internal", "registry.ts");
const ROUTE = r("app", "api", "room", "[roomId]", "tor-session", "route.ts");
const STORE = r("lib", "room", "store.ts");
const PANEL = r("components", "vtt", "TorJourneyPanel.tsx");
const COUNCIL_PANEL = r("components", "vtt", "TorCouncilPanel.tsx");
const FELLOWSHIP_PANEL = r("components", "vtt", "TorFellowshipPanel.tsx");
const RAIL = r("components", "vtt", "mesa", "MesaFoundryDockRail.tsx");
const FLOATING = r("components", "vtt", "mesa", "MesaFoundryFloatingWindows.tsx");

let pass = 0;
let fail = 0;
const ok = (name, cond, detail = "") => {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
};

const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

function fnBody(src, name) {
  const start = src.search(new RegExp(`(export\\s+)?(async\\s+)?function ${name}\\b`));
  if (start < 0) return "";
  const rest = src.slice(start + 1);
  const end = rest.search(/\n(export\s+)?(async\s+)?function /);
  return end < 0 ? rest : rest.slice(0, end);
}

console.log("verify-um-anel-session-state: persistência de Jornada/Conselho/Companhia");

/* ── O campo chega ao estado E ao snapshot ────────────────────────── */

ok("RoomState tem torSession", /torSession\?:\s*TorSessionState;/.test(TYPES));
ok(
  "RoomSnapshot tem torSession (jogadores veem o placar)",
  (TYPES.match(/torSession\?:\s*TorSessionState;/g) ?? []).length === 2
);
ok("toSnapshot normaliza torSession", /torSession:\s*normalizeTorSession\(state\.torSession\)/.test(REGISTRY));

/* ── Normalização defensiva ───────────────────────────────────────── */

ok("Faixas recortadas por int()", /function int\(v: unknown, fallback: number, min: number, max: number\)/.test(STATE));
ok("Enums recortados por oneOf()", /function oneOf<T extends string>/.test(STATE));
ok("Listas têm tamanho máximo", /function strList\(v: unknown, max: number\)/.test(STATE));
ok(
  "Terreno difícil nunca passa do total de trechos",
  /hardTerrainTrechos:\s*int\(r\.hardTerrainTrechos,\s*0,\s*0,\s*trechos\)/.test(STATE)
);
ok(
  "phasesThisYear limitado a 0-2 (a 3ª Fase é Yule e zera)",
  /phasesThisYear:\s*int\(r\.phasesThisYear,\s*0,\s*0,\s*2\)/.test(STATE)
);
ok(
  "Resistência do Conselho validada por isTorCouncilResistance",
  /isTorCouncilResistance\(resistance\)/.test(STATE)
);
ok(
  "Sessão vazia devolve undefined (não infla o JSON da sala)",
  /if \(!journey && !council && !fellowship\) return undefined;/.test(STATE)
);

/* ── Patch: null apaga, ausente mantém ───────────────────────────── */

const patchBody = fnBody(STATE, "applyTorSessionPatch");
for (const field of ["journey", "council", "fellowship"]) {
  ok(
    `${field}: usa "in" para distinguir ausente de null`,
    new RegExp(`"${field}" in patch`).test(patchBody)
  );
  ok(
    `${field}: null apaga o trecho`,
    new RegExp(`patch\\.${field} === null\\) delete next\\.${field}`).test(patchBody)
  );
}
ok(
  "Rota usa `in` e não truthiness",
  /"journey" in body/.test(ROUTE) && /"council" in body/.test(ROUTE) && /"fellowship" in body/.test(ROUTE)
);

/* ── Autorização e isolamento ─────────────────────────────────────── */

const handlerCode = stripComments(HANDLER);
ok("Handler exige canManageRoom", /if \(!canManageRoom\(room, user\)\) return null;/.test(handlerCode));
ok(
  "Handler recusa mesa que não é do Um Anel",
  /room\.rpgSystemId !== "um-anel"\) return null;/.test(handlerCode)
);
ok("Rota exige requireRoomManage", /requireRoomManage\(roomId\)/.test(ROUTE));
ok("Handler persiste via persistRoom", /await persistRoom\(roomId, room\)/.test(handlerCode));
ok(
  "Handler devolve snapshot (não o estado cru)",
  /return toSnapshot\(updated\)/.test(handlerCode)
);
ok("Handler reexportado na fachada store", /patchTorSession/.test(STORE));

/* ── O painel usa o estado da sala, não estado local ─────────────── */

const panelCode = stripComments(PANEL);
ok("Painel recebe progress por prop", /progress:\s*TorJourneyProgress \| null;/.test(PANEL));
ok("Painel grava via patchTorSession", /patchTorSession\(roomId,/.test(panelCode));
ok(
  "Painel encerra jornada com null",
  /patchTorSession\(roomId,\s*\{\s*journey:\s*null\s*\}\)/.test(panelCode)
);
// `started` tem de derivar de progress, não de um useState paralelo — duas
// fontes de verdade fariam o painel discordar da sala depois de um SSE.
ok(
  "started deriva de progress",
  /const started = progress != null;/.test(panelCode)
);
ok(
  "Jogador sem permissão vê placar somente leitura",
  /if \(!canManage\)/.test(panelCode) && /Nenhuma jornada em curso/.test(PANEL)
);
// O evento guarda o ID; o meta é código. Guardar o meta inteiro no JSONB
// congelaria texto de regra no banco.
ok(
  "Evento pendente guarda ID, não o meta inteiro",
  /eventId:\s*TorJourneyEventId;/.test(STATE) && /TOR_JOURNEY_EVENT_META\[p\.eventId\]/.test(panelCode)
);
ok(
  "Painel trata eventId desconhecido",
  /Evento desconhecido/.test(PANEL)
);

/* ── Os TRÊS painéis leem da sala, não de estado local ───────────── */

const councilCode = stripComments(COUNCIL_PANEL);
ok("Conselho recebe council por prop", /council:\s*TorCouncilState \| null;/.test(COUNCIL_PANEL));
ok("Conselho grava via patchTorSession", /patchTorSession\(roomId,/.test(councilCode));
ok(
  "Conselho encerra com null",
  /patchTorSession\(roomId,\s*\{\s*council:\s*null\s*\}\)/.test(councilCode)
);
// `outcome` tem de derivar do estado da sala, senão o painel discorda dela.
ok(
  "Conselho: outcome deriva de council",
  /const outcome = council \? torCouncilOutcome\(council\) : null;/.test(councilCode)
);
ok("Conselho: jogador vê placar em leitura", /Nenhum conselho em curso/.test(COUNCIL_PANEL));

const fellowCode = stripComments(FELLOWSHIP_PANEL);
ok(
  "Companhia recebe fellowship por prop",
  /fellowship:\s*TorFellowshipProgress \| null;/.test(FELLOWSHIP_PANEL)
);
ok("Companhia grava via patchTorSession", /patchTorSession\(roomId,/.test(fellowCode));
// O calendário é o dado que MAIS importa persistir: decide quando cai o Yule.
ok(
  "Companhia: Yule deriva do calendário persistido",
  /state\.phasesThisYear \+ 1 >= TOR_PHASES_PER_YEAR/.test(fellowCode)
);
ok(
  "Companhia: encerrar Fase avança o calendário na sala",
  /year:\s*advanced\.calendar\.year/.test(fellowCode) &&
    /phasesThisYear:\s*advanced\.calendar\.phasesThisYear/.test(fellowCode)
);
ok("Companhia: escolhas zeram na Fase seguinte", /picks:\s*\[\],/.test(fellowCode));

/* ── A prop chega do snapshot até os três ────────────────────────── */

for (const [file, src] of [
  ["DockRail", RAIL],
  ["FloatingWindows", FLOATING],
]) {
  ok(`${file}: declara torSession`, /torSession\?:\s*RoomSnapshot\["torSession"\];/.test(src));
  ok(`${file}: passa progress à Jornada`, /progress=\{torSession\?\.journey \?\? null\}/.test(src));
  ok(`${file}: passa council ao Conselho`, /council=\{torSession\?\.council \?\? null\}/.test(src));
  ok(
    `${file}: passa fellowship à Companhia`,
    /fellowship=\{torSession\?\.fellowship \?\? null\}/.test(src)
  );
}


console.log(`\nverify-um-anel-session-state: ${pass} passaram, ${fail} falharam`);
if (fail > 0) process.exit(1);
