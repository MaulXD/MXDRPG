/**
 * BV-033: a aventura do Um Anel mostrava '0 fichas de jogadores' e 'Voce ainda nao tem
 * personagem nesta mesa' mesmo com a ficha criada.
 *
 * Causa: app/aventura/[adventureId]/page.tsx contava e listava so as fichas do Eldarin
 * (listCharactersForSessionUserInAdventureSafe) e a lista de jogadores vinha de room.actors,
 * que o sync da mesa preenche so com fichas Eldarin. A ficha do Um Anel existia, mas a
 * aventura nao a reconhecia.
 *
 * Regra: em aventura do Um Anel, a pagina usa as fichas do Um Anel (sessao e aventura).
 * O limite por aventura continua so do Eldarin: no Um Anel o botao Criar personagem nao
 * depende dele (o limite global de 10 fichas fica no wizard).
 *
 * node scripts/verify-aventura-um-anel-fichas.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const read = (p) => readFileSync(join(root, p), "utf8");

const page = read("app/aventura/[adventureId]/page.tsx");
const list = read("components/adventure/AdventurePlayerSheetsList.tsx");

let pass = 0;
let fail = 0;
function check(name, fn) {
  try {
    fn();
    pass++;
    console.log(`ok   ${name}`);
  } catch (e) {
    fail++;
    console.log(`FAIL ${name}\n     ${e.message.split("\n")[0]}`);
  }
}

check("a pagina reconhece aventura do Um Anel (rpgSystemId)", () => {
  assert.match(page, /const isUmAnel = adventure\.rpgSystemId === "um-anel"/);
});

check("fichas do jogador no Um Anel vem da lista do Um Anel, filtrada pela aventura", () => {
  assert.match(page, /listTorCharactersForSessionUserSafe\(accountUser\)/);
  assert.match(page, /c\.adventureId === adventureId/);
});

check("lista de fichas de jogadores do Um Anel vem de todos os membros da aventura", () => {
  assert.match(page, /listTorCharactersForAdventure\(adventureId\)/);
});

check("Eldarin continua usando room.actors e a lista Eldarin da sessao", () => {
  assert.match(page, /listCharactersForSessionUserInAdventureSafe\(accountUser, adventureId\)/);
  assert.match(page, /playerActors\(room\.actors\)/);
});

check("Criar personagem no Um Anel nao depende do limite por aventura do Eldarin", () => {
  assert.match(page, /const canCreateChar = isUmAnel \|\| charCount < MAX_CHARACTERS_PER_USER_PER_ADVENTURE/);
});

check("lista de jogadores aceita o formato comum (item com meta) nos dois sistemas", () => {
  assert.match(list, /export type AdventurePlayerSheetItem/);
  assert.match(list, /actor\.meta/);
  assert.doesNotMatch(list, /identity\?\.nivel/);
});

check("lista de fichas mostra so apelido, nunca o nome real da conta", () => {
  assert.doesNotMatch(list, /user\?\.name/);
  assert.match(list, /user\?\.nickname\?\.trim\(\) \|\| "Jogador"/);
});

check("texto do limite no Um Anel cita o limite por conta, nao o de 3 por mesa do Eldarin", () => {
  assert.match(page, /isUmAnel\s*\?\s*`Até \$\{MAX_TOR_CHARACTERS_PER_USER\} fichas do Um Anel por conta`/);
});

console.log(`\n${pass} ok, ${fail} falha${fail === 1 ? "" : "s"}`);
if (fail > 0) process.exit(1);
