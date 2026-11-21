/**
 * BV-058: subir de nível recarregava PA (0/9 virava 5/9 sem turno). O livro só
 * recupera PA no início do turno (LIVRO-DO-JOGADOR.md:194-196) e PA não sobem por
 * nível (:182). Agora o level-up mantém o PA atual, limitado ao teto do pool.
 *
 * node scripts/verify-bv058-levelup-pa.mjs
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "lib", "character", "level-up.ts"), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/(^|[^:])\/\/[^\n]*/g, "$1");

let fail = 0;
const ok = (n, c) => {
  console.log(`  ${c ? "✓" : "✗"} ${n}`);
  if (!c) fail++;
};
console.log("verify-bv058-levelup-pa: subir de nível não recarrega PA");
ok("não grava mais value: paMax", !/pontosAcao: \{ value: paMax, max: paMax \}/.test(src));
ok(
  "mantém o PA atual limitado ao teto do pool",
  /value: Math\.max\(0, Math\.min\(actor\.resources\.pontosAcao\.value, paPoolMaxForSheet\(actor\)\)\)/.test(src)
);
if (fail) process.exit(1);
