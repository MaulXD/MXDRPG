/**
 * A-10b: a guarda de limite de fichas por aventura precisa barrar ANTES do wizard abrir.
 *
 * Causa: app/mesa/[roomId]/page.tsx passava charactersInAdventure = 0 fixo, então
 * MesaWorkspace nunca via o número real e a recusa só vinha no servidor, depois do wizard.
 *
 * Regra: o valor do limite (1 ou 3) é decisão pendente. Este teste NÃO fixa o número:
 * só confere que a mesa conta as fichas da aventura com a mesma função do servidor,
 * que a constante vem da mesma fonte, e que existe aviso ao abrir o wizard já no limite.
 *
 * node scripts/verify-limite-fichas-mesa.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const read = (p) => readFileSync(join(root, p), "utf8");

const page = read("app/mesa/[roomId]/page.tsx");
const mesa = read("components/vtt/MesaWorkspace.tsx");
const chars = read("lib/character/characters.ts");
const bind = read("lib/character/adventure-bind.ts");

let pass = 0;
let fail = 0;
function check(name, fn) {
  try {
    fn();
    pass++;
    console.log("OK  ", name);
  } catch (e) {
    fail++;
    console.log("FAIL", name, "-", e.message.split("\n")[0]);
  }
}

check("mesa nao fixa charactersInAdventure em 0", () => {
  assert.doesNotMatch(page, /const\s+charactersInAdventure\s*=\s*0\s*;/);
});

check("mesa conta as fichas da aventura com a funcao do servidor", () => {
  assert.match(page, /listCharactersForSessionUserInAdventureSafe\(/);
  assert.match(page, /charactersInAdventure\s*=/);
});

check("guarda por aventura so vale no Eldarin (Um Anel nao tem limite)", () => {
  assert.match(
    page,
    /charactersInAdventure\s*=\s*canParticipate && accountUser && room\.rpgSystemId === "eldarin"/
  );
  assert.doesNotMatch(page, /removidas do SSR/);
});

check("servidor e mesa usam a mesma constante (adventure-bind)", () => {
  assert.match(bind, /export const MAX_CHARACTERS_PER_USER_PER_ADVENTURE\s*=/);
  assert.match(
    chars,
    /export \{ MAX_CHARACTERS_PER_USER_PER_ADVENTURE \} from "\.\/adventure-bind"/
  );
  assert.match(chars, /inAdv >= MAX_CHARACTERS_PER_USER_PER_ADVENTURE/);
  assert.match(
    mesa,
    /import \{ MAX_CHARACTERS_PER_USER_PER_ADVENTURE \} from "@\/lib\/character\/adventure-bind"/
  );
});

check("mesa avisa ao abrir o wizard ja no limite", () => {
  assert.match(mesa, /function CharacterLimitToast/);
  assert.match(mesa, /<CharacterLimitToast\s+active=\{/);
});

check("aviso de limite nao cita numero fixo", () => {
  const line = mesa.split("\n").find((l) => l.includes("limite de fichas nesta aventura"));
  assert.ok(line, "mensagem de limite nao encontrada");
  assert.doesNotMatch(line, /\d/);
});

console.log(`\n${pass} ok, ${fail} falha(s)`);
process.exit(fail ? 1 : 0);
