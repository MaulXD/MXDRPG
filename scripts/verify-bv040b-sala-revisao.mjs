/**
 * BV-040b: quando o mestre ajusta a ficha do Um Anel pela rota PATCH
 * /api/tor-characters/[id], a mesa não ficava sabendo: a revisão da sala não
 * subia, e o card do dono (TorPlayableCharactersPanel, que recarrega pela
 * revisão) seguia com o número antigo.
 *
 * Correção: a rota, depois de gravar a ficha, sobe a revisão da sala da aventura
 * (persistRoom). Sem aventura ou sem sala, não faz nada. Falha ao subir a revisão
 * só loga, porque a ficha já foi gravada.
 *
 * Teste estático: lê o código-fonte e confere as ligações. O módulo da rota usa
 * server-only e banco, então não roda em Node puro.
 *
 * node scripts/verify-bv040b-sala-revisao.mjs
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = (...p) => join(__dirname, "..", ...p);
const read = (...p) => readFileSync(root(...p), "utf8").replace(/\r\n/g, "\n");

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

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

console.log("verify-bv040b-sala-revisao: ficha do Um Anel sobe a revisão da sala");

const ROUTE_RAW = read("app", "api", "tor-characters", "[id]", "route.ts");
const ROUTE = stripComments(ROUTE_RAW);
const PANEL = read("components", "vtt", "TorPlayableCharactersPanel.tsx");

/* ── 1. Imports ────────────────────────────────────────────────────────── */

ok(
  "rota importa getAdventure de lib/adventure/store",
  /import\s*\{[^}]*\bgetAdventure\b[^}]*\}\s*from\s*"@\/lib\/adventure\/store"/.test(ROUTE)
);
ok(
  "rota importa getRoom e persistRoom do registro da sala",
  /import\s*\{[^}]*\bgetRoom\b[^}]*\bpersistRoom\b[^}]*\}\s*from\s*"@\/lib\/room\/internal\/registry"/.test(ROUTE)
);

/* ── 2. Helper: aventura -> sala -> persistRoom ────────────────────────── */

const helperMatch = ROUTE.match(
  /async function bumpAdventureRoomRevision\(([^)]*)\)[^{]*\{([\s\S]*?)\n\}/
);
ok("helper bumpAdventureRoomRevision existe", !!helperMatch);
const helperBody = helperMatch ? helperMatch[2] : "";

ok(
  "helper sai sem fazer nada quando a ficha não tem aventura",
  /if\s*\(\s*!adventureId\s*\)\s*return;/.test(helperBody)
);
ok(
  "helper busca a aventura pelo id",
  /const\s+adventure\s*=\s*await\s+getAdventure\(\s*adventureId\s*\)/.test(helperBody)
);
ok(
  "helper sai quando a aventura não existe",
  /if\s*\(\s*!adventure\s*\)\s*return;/.test(helperBody)
);
ok(
  "helper usa a sala primária da aventura",
  /await\s+getRoom\(\s*adventure\.primaryRoomId\s*\)/.test(helperBody)
);
ok(
  "helper sai quando a sala não existe",
  /if\s*\(\s*!room\s*\)\s*return;/.test(helperBody)
);
ok(
  "helper grava a sala de volta com persistRoom (sobe a revisão)",
  /await\s+persistRoom\(\s*room\.roomId\s*,\s*room\s*\)/.test(helperBody)
);

/* ── 3. PATCH: depois de gravar a ficha, sobe a revisão ────────────────── */

const patchStart = ROUTE.indexOf("export async function PATCH");
const patchBody = patchStart >= 0 ? ROUTE.slice(patchStart) : "";
const patchCallIdx = patchBody.indexOf("await patchTorCharacterResources(");
const bumpCallIdx = patchBody.indexOf("bumpAdventureRoomRevision(character.adventureId)");

ok("PATCH chama patchTorCharacterResources", patchCallIdx >= 0);
ok(
  "PATCH sobe a revisão da aventura da ficha salva",
  bumpCallIdx >= 0,
  "falta chamar bumpAdventureRoomRevision(character.adventureId)"
);
ok(
  "a revisão sobe só depois de gravar a ficha",
  patchCallIdx >= 0 && bumpCallIdx > patchCallIdx
);
ok(
  "falha ao subir a revisão não derruba o PATCH (try/catch com log)",
  /try\s*\{\s*await\s+bumpAdventureRoomRevision\(character\.adventureId\);\s*\}\s*catch\s*\(e\)\s*\{[\s\S]*?console\.error/.test(
    patchBody
  )
);
ok(
  "PATCH ainda responde com a ficha salva",
  /return\s+NextResponse\.json\(\s*\{\s*ok:\s*true,\s*character\s*\}\s*\)/.test(patchBody)
);
ok(
  "GET continua sem tocar na sala",
  !/bumpAdventureRoomRevision/.test(
    ROUTE.slice(ROUTE.indexOf("export async function GET"), patchStart)
  )
);

/* ── 4. O card do dono recarrega pela revisão (já existia) ─────────────── */

ok(
  "TorPlayableCharactersPanel recarrega quando a revisão da mesa muda",
  /useMesaRoomRevision\(roomId \?\? ""\)/.test(PANEL) &&
    /\}, \[roomRevision\]\);/.test(PANEL)
);

console.log(`\n${pass} ok, ${fail} falha(s)`);
if (fail > 0) process.exit(1);
