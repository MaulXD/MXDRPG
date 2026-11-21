/**
 * CANAL: o bônus de dano de uma habilidade (ex.: Canalizar Energia) entra uma vez só.
 * O handler injeta bonusDamageFormula no atacante e resolveAttack soma; ability.ts não
 * pode somar de novo. node scripts/verify-canal-bonus-unico.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (rel) => readFileSync(join(root, rel), "utf8");

const ability = ler("lib/combat/ability.ts");
const handler = ler("lib/room/handlers/combat-ability.ts");
const attack = ler("lib/combat/attack.ts");

assert.match(handler, /bonusDamageFormula: action\.bonusDamageFormula/, "handler injeta o bônus no atacante");
assert.match(attack, /if \(attackerToken\.bonusDamageFormula\) \{\s*const extra = rollDice\(attackerToken\.bonusDamageFormula\)/, "resolveAttack soma o bônus");
assert.doesNotMatch(ability, /rollDice\(action\.bonusDamageFormula\)/, "ability.ts não soma o bônus de novo");
console.log("verify-canal-bonus-unico: ok");
