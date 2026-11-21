/**
 * P-09: arquivos da pasta public (imagens, texturas, motor dos dados) com cache de
 * navegador, e o sw.js de fora. Executa o headers() real do next.config.ts.
 *
 * node scripts/verify-p09-cache-estaticos.mjs
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(ROOT, "next.config.ts"), "utf8");
const js = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const cfg = (await import("data:text/javascript," + encodeURIComponent(js))).default;
const regras = await cfg.headers();

let falhas = 0;
function caso(nome, fn) {
  try {
    fn();
    console.log(`  ✓ ${nome}`);
  } catch (err) {
    falhas++;
    console.log(`  ✗ ${nome}: ${err.message.split("\n")[0]}`);
  }
}

function cachePara(source) {
  const r = regras.find((x) => x.source === source);
  return r?.headers.find((h) => h.key === "Cache-Control")?.value ?? null;
}

console.log("verify-p09-cache-estaticos");

for (const source of ["/assets/:path*", "/brand/:path*", "/icons/:path*", "/favicon.ico"]) {
  caso(`${source} tem cache de navegador (max-age > 0)`, () => {
    const v = cachePara(source);
    assert.ok(v, "sem regra");
    const m = v.match(/max-age=(\d+)/);
    assert.ok(m && Number(m[1]) >= 3600, v);
    assert.ok(!/immutable/.test(v), "nome sem hash não pode ser immutable");
  });
}

caso("sw.js não ganha cache longo", () => {
  for (const r of regras) {
    assert.ok(!/sw\.js/.test(r.source), r.source);
    assert.notEqual(r.source, "/:path*", "regra global pegaria o sw.js");
  }
  assert.ok(existsSync(join(ROOT, "public", "sw.js")));
});

caso("as pastas cobertas existem em public/", () => {
  assert.ok(existsSync(join(ROOT, "public", "assets")));
  assert.ok(existsSync(join(ROOT, "public", "brand")));
});

if (falhas) {
  console.log(`  ${falhas} caso(s) falharam`);
  process.exit(1);
}
console.log("  todos os casos passaram");
