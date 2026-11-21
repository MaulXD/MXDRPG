/**
 * BV-029b: a rota de pedido de inventário (POST /api/characters/[id]/inventory-request)
 * recusa magia para classe sem lista de magias, do mesmo jeito que a ficha (BV-029).
 *
 * Regra única em lib/character/spell-prep.ts (compendiumEntryAllowedForClass), usada pela
 * ficha (cliente) e pela rota (servidor). Fichas antigas com magia não são tocadas:
 * a checagem só roda no pedido novo (POST), não no GET nem na leitura da ficha.
 *
 * Checagem por leitura do código e dos dados, no mesmo estilo dos demais verify-*.mjs.
 */
import { readFileSync as rawReadFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const readFileSync = (p, enc) => rawReadFileSync(p, enc).replace(/\r\n/g, "\n");
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = (...p) => join(__dirname, "..", ...p);

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

const helperCode = readFileSync(root("lib/character/spell-prep.ts"), "utf8");
const routeCode = readFileSync(root("app/api/characters/[id]/inventory-request/route.ts"), "utf8");
const spellListsData = JSON.parse(readFileSync(root("data/character/spell-lists.json"), "utf8"));

// Regra: helper exportado, bloqueia só "magias" e só para classe sem classAccess.
const helperStart = helperCode.indexOf("export function compendiumEntryAllowedForClass(");
const helperBody = helperStart >= 0 ? helperCode.slice(helperStart, helperStart + 200) : "";
ok(
  "BV-029b regra: compendiumEntryAllowedForClass existe em spell-prep.ts",
  helperStart >= 0,
  "helper ausente"
);
ok(
  "BV-029b regra: só o pack 'magias' exige classe conjuradora (isCasterClassId)",
  /packId !== "magias" \|\| isCasterClassId\(classe\)/.test(helperBody),
  "corpo do helper diferente do esperado"
);
ok(
  "BV-029b dados: Guerreiro não tem classAccess, logo a regra recusa magia para ele",
  !("Guerreiro" in spellListsData.classAccess),
  "Guerreiro aparece em classAccess"
);

// Servidor: importa a mesma regra e recusa antes de criar o pedido.
ok(
  "BV-029b rota: importa compendiumEntryAllowedForClass de spell-prep",
  /import \{ compendiumEntryAllowedForClass \} from "@\/lib\/character\/spell-prep";/.test(routeCode),
  "rota sem o import"
);
const guardIdx = routeCode.indexOf(
  "!compendiumEntryAllowedForClass(character.identity.classe, packId)"
);
const createIdx = routeCode.indexOf("await createInventoryItemRequest(");
const entryIdx = routeCode.indexOf("const entry = getEntry(packId, entryId);");
ok(
  "BV-029b rota: a checagem usa a classe da ficha (character.identity.classe) e o packId do pedido",
  guardIdx >= 0,
  "guarda ausente na rota"
);
ok(
  "BV-029b rota: a recusa acontece depois de achar o item e antes de criar o pedido",
  guardIdx > entryIdx && createIdx > guardIdx,
  `ordem: entry=${entryIdx} guarda=${guardIdx} criar=${createIdx}`
);
const guardBlock = routeCode.slice(guardIdx, guardIdx + 250);
ok(
  "BV-029b rota: a recusa responde 400 com a mensagem 'não tem lista de magias'",
  /status: 400/.test(guardBlock) && /não tem lista de magias/.test(guardBlock),
  "status ou mensagem de recusa ausentes"
);

// Fichas antigas: o GET não passa pela checagem.
const getStart = routeCode.indexOf("export async function GET(");
const postStart = routeCode.indexOf("export async function POST(");
ok(
  "BV-029b fichas antigas: a checagem só existe no POST (GET de pedidos pendentes não muda)",
  getStart >= 0 && postStart > getStart && guardIdx > postStart,
  "checagem fora do POST"
);

console.log(`\n${pass} ok, ${fail} falha(s)`);
if (fail > 0) process.exit(1);
