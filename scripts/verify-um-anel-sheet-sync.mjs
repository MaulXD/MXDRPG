/**
 * Um Anel: a mesa e a ficha precisam dizer quando não estão de acordo.
 *
 * (1) TOR-SAVE — executeRoomTorAttack e executeRoomTorHazard aplicavam o resultado
 *     na mesa e, se patchTorCharacterResources falhasse, só davam console.error. O
 *     jogador via "ok" e a ficha ficava com o número antigo. Correção: as duas
 *     funções devolvem sheetSaved: false, as rotas repassam, e o cliente avisa.
 *
 * (2) BV-040 — o card de personagens da barra lateral (TorPlayableCharactersPanel)
 *     buscava a lista uma vez e nunca mais. Mudar a Resistência na ficha deixava o
 *     card com o número antigo até recarregar a página. Correção: a ficha, o ataque
 *     e a Fonte de Dano disparam TOR_CHARACTER_CHANGED_EVENT, e o card recarrega.
 *
 * (3) BV-039 — o botão ROLAR do painel Dados passava da borda: o input sem
 *     min-width: 0 não encolhia. Correção só de CSS.
 *
 * Teste estático: lê o código-fonte e confere as ligações. Ele NÃO executa os handlers
 * com a gravação da ficha falhando: o verify-d09-sheet-saved cobre só updateRoomActor
 * (retrato), não executeRoomTorAttack nem executeRoomTorHazard. Essa falha continua
 * sem teste de comportamento.
 *
 * node scripts/verify-um-anel-sheet-sync.mjs
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

console.log("verify-um-anel-sheet-sync: mesa e ficha do Um Anel batem");

/* ── 1. TOR-SAVE ───────────────────────────────────────────────────────── */

const ATTACK = stripComments(read("lib", "room", "handlers", "tor-combat-attack.ts"));
const HAZARD = stripComments(read("lib", "room", "handlers", "tor-hazard.ts"));
const ATTACK_ROUTE = stripComments(read("app", "api", "room", "[roomId]", "combat", "attack", "route.ts"));
const HAZARD_ROUTE = stripComments(read("app", "api", "room", "[roomId]", "tor-hazard", "route.ts"));
const SHEET_MSG = read("lib", "character", "portrait-sheet-saved.ts");
const POPUP = stripComments(read("components", "vtt", "TorAttackPopup.tsx"));
const PANEL_HAZARD = stripComments(read("components", "vtt", "TorHazardPanel.tsx"));

ok(
  "TOR-SAVE: mensagem exata para o jogador",
  /TOR_SHEET_NOT_SAVED_MESSAGE\s*=\s*\n?\s*"O resultado foi aplicado na mesa, mas não foi salvo na ficha\."/.test(
    SHEET_MSG
  )
);

// Ataque: flag declarada antes do sync e marcada nos dois catch.
ok("TOR-SAVE ataque: sheetSaved declarado", /let sheetSaved = true;/.test(ATTACK));
const attackCatches = ATTACK.match(/catch \(e\) \{\s*sheetSaved = false;\s*console\.error\("\[tor-attack\][^"]*"/g) ?? [];
ok(
  "TOR-SAVE ataque: os dois catch da ficha marcam sheetSaved = false",
  attackCatches.length === 2,
  `achei ${attackCatches.length}`
);
ok(
  "TOR-SAVE ataque: resultado de sucesso leva sheetSaved",
  /return \{ ok: true, snapshot: toSnapshot\(await persistRoom\(roomId, room\)\), sheetSaved \};/.test(ATTACK)
);
ok(
  "TOR-SAVE ataque: tipo do resultado inclui sheetSaved",
  /\| \{ ok: true; snapshot: RoomSnapshot; sheetSaved: boolean \}/.test(ATTACK)
);

// Fonte de Dano.
ok("TOR-SAVE Fonte de Dano: sheetSaved declarado", /let sheetSaved = true;/.test(HAZARD));
ok(
  "TOR-SAVE Fonte de Dano: catch da ficha marca sheetSaved = false",
  /catch \(e\) \{\s*sheetSaved = false;\s*console\.error\("\[tor-hazard\] falha ao sincronizar a ficha:"/.test(HAZARD)
);
ok(
  "TOR-SAVE Fonte de Dano: resultado de sucesso leva sheetSaved",
  /return \{ ok: true, snapshot: toSnapshot\(await persistRoom\(roomId, room\)\), sheetSaved \};/.test(HAZARD)
);
ok(
  "TOR-SAVE Fonte de Dano: tipo do resultado inclui sheetSaved",
  /\| \{ ok: true; snapshot: RoomSnapshot; sheetSaved: boolean \}/.test(HAZARD)
);

// Rotas.
ok(
  "TOR-SAVE rota de ataque: repassa sheetSaved: false",
  /"sheetSaved" in result && result\.sheetSaved === false/.test(ATTACK_ROUTE) &&
    /\{ \.\.\.payload, sheetSaved: false \}/.test(ATTACK_ROUTE)
);
ok(
  "TOR-SAVE rota da Fonte de Dano: devolve sheetSaved",
  /NextResponse\.json\(\{ snapshot: result\.snapshot, sheetSaved: result\.sheetSaved \}\)/.test(HAZARD_ROUTE)
);

// Cliente: avisa quando sheetSaved === false.
ok(
  "TOR-SAVE cliente do ataque: mostra o aviso",
  /if \(payload\.sheetSaved === false\) setErr\(TOR_SHEET_NOT_SAVED_MESSAGE\);/.test(POPUP)
);
ok(
  "TOR-SAVE cliente da Fonte de Dano: mostra o aviso",
  /if \(res\.sheetSaved === false\) setErr\(TOR_SHEET_NOT_SAVED_MESSAGE\);/.test(PANEL_HAZARD)
);

/* ── 2. BV-040: o card da barra lateral recarrega ──────────────────────── */

const EVENT_MOD = read("lib", "character", "um-anel", "character-changed-event.ts");
const CARD = stripComments(read("components", "vtt", "TorPlayableCharactersPanel.tsx"));
const SHEET_POPUP = stripComments(read("components", "vtt", "TorCharacterSheetPopup.tsx"));

const eventMatch = EVENT_MOD.match(/TOR_CHARACTER_CHANGED_EVENT\s*=\s*"([^"]+)"/);
const EVENT_NAME = eventMatch?.[1] ?? "";
ok("BV-040: evento tem nome", EVENT_NAME.length > 0);

ok(
  "BV-040 card: ouve o evento e soma no reloadKey",
  new RegExp(
    `window\\.addEventListener\\(TOR_CHARACTER_CHANGED_EVENT, onChanged\\)`
  ).test(CARD) && /setReloadKey\(\(k\) => k \+ 1\)/.test(CARD)
);
ok(
  "BV-040 card: revisão da mesa dispara um refetch só por rajada (1,5 s), não um por revisão",
  /\}, \[adventureId, reloadKey\]\);/.test(CARD) &&
    /window\.setTimeout\(\(\) => setReloadKey\(\(k\) => k \+ 1\), 1500\)/.test(CARD) &&
    /\}, \[roomRevision\]\);/.test(CARD)
);
ok(
  "BV-040/BV-048 card: lê a revisão da mesa pela fatia própria (SSE, sem polling)",
  /import \{ useMesaRoomRevision \} from "@\/hooks\/vtt\/useMesaRoomSlice";/.test(CARD) &&
    /const roomRevision = useMesaRoomRevision\(roomId \?\? ""\);/.test(CARD)
);

/* ── 2b. BV-048: revisão sozinha também avisa o card ───────────────────── */

const STORE = stripComments(read("hooks", "vtt", "mesa-room-store.ts"));
const SLICE_HOOKS = stripComments(read("hooks", "vtt", "useMesaRoomSlice.ts"));
ok(
  "BV-048 store: emite a fatia \"revision\" quando só a revisão muda",
  /if \(prev\?\.revision !== nextSnap\?\.revision\) this\.emit\("revision"\);/.test(STORE) &&
    /"revision"/.test(STORE.match(/export type MesaRoomSlice =[^;]*;/)?.[0] ?? "")
);
ok(
  "BV-048 hook: useMesaRoomRevision assina a fatia \"revision\"",
  /export function useMesaRoomRevision\(roomId: string\): number/.test(SLICE_HOOKS) &&
    /store\.subscribe\("revision", cb\)/.test(SLICE_HOOKS)
);
ok(
  "BV-040 card: remove o ouvinte ao desmontar",
  /window\.removeEventListener\(TOR_CHARACTER_CHANGED_EVENT, onChanged\)/.test(CARD)
);
ok(
  "BV-040 ficha: PATCH bem-sucedido dispara o evento",
  /setCharacter\(data\.character\);\s*window\.dispatchEvent\(new Event\(TOR_CHARACTER_CHANGED_EVENT\)\);/.test(
    SHEET_POPUP
  )
);
ok(
  "BV-040 ataque e Fonte de Dano: não disparam o evento (a revisão da mesa já traz a mudança; um refetch por revisão)",
  !/TOR_CHARACTER_CHANGED_EVENT/.test(POPUP) && !/TOR_CHARACTER_CHANGED_EVENT/.test(PANEL_HAZARD)
);

const NOTIFIER = stripComments(read("lib", "room", "notifier.ts"));
ok(
  "BV-048 aviso da sala: um emissor só no processo (globalThis), não um por cópia do módulo",
  /globalThis\.__eldarinRoomNotifier = e;/.test(NOTIFIER) &&
    !/^const emitter = new EventEmitter\(\)/m.test(NOTIFIER) &&
    /emitter\(\)\.emit\(`room:\$\{roomId\}`, revision\);/.test(NOTIFIER)
);

ok(
  "BV-050 ficha aberta: recarrega pela revisão da sala, uma vez por rajada (1,5 s)",
  /const roomRevision = useMesaRoomRevision\(roomId\);/.test(SHEET_POPUP) &&
    /window\.setTimeout\(\(\) => void load\(characterId\), 1500\)/.test(SHEET_POPUP) &&
    /\}, \[roomRevision, characterId, load\]\);/.test(SHEET_POPUP)
);

/* ── 3. BV-039: botão ROLAR dentro do painel ───────────────────────────── */

const CSS = read("components", "vtt", "vtt.css");
const customInput = CSS.match(/\.dice-custom input \{([^}]*)\}/)?.[1] ?? "";
ok("BV-039: input do painel Dados encolhe (min-width: 0)", /min-width:\s*0\s*;/.test(customInput));
ok(
  "BV-039: botão ROLAR não encolhe no flex (flex: 0 0 auto)",
  /\.dice-custom \.btn \{\s*flex:\s*0 0 auto;\s*\}/.test(CSS)
);

console.log(`\n${pass} ok, ${fail} falha(s)`);
if (fail > 0) process.exit(1);
