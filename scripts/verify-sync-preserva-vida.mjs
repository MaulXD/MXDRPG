/**
 * B1: a sincronização ficha -> sala não pode apagar dano, cura e PA gastos em combate,
 * nem ignorar subida de nível ou reconstrução da ficha.
 *
 * Regra (lib/room/actor-vitals.ts, keepRoomVitals(next, prev)):
 * - prev = ator que já está na sala; next = ator montado a partir da ficha.
 * - máximo mudou na ficha -> vale o valor da ficha;
 * - máximo igual -> vale o valor da sala (dano/cura/PA de combate);
 * - sempre limitado ao máximo atual; vida temporária vem da sala;
 * - sem prev (ator novo na sala) -> ator da ficha, inteiro.
 *
 * Teste de comportamento: chama a função real, sem regex.
 * node scripts/verify-sync-preserva-vida.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Carrega a função real de lib/room/actor-vitals.ts transpilando com o pacote typescript
// do projeto. Funciona em qualquer Node do engines (>=20), sem depender de type stripping.
const vitalsTs = readFileSync(join(__dirname, "..", "lib", "room", "actor-vitals.ts"), "utf8");
const vitalsJs = ts.transpileModule(vitalsTs, {
  compilerOptions: { module: ts.ModuleKind.ES2020, target: ts.ScriptTarget.ES2020 },
}).outputText;
const { keepRoomVitals } = await import(
  "data:text/javascript;base64," + Buffer.from(vitalsJs).toString("base64")
);

let pass = 0;
let fail = 0;

function caso(name, fn) {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    fail++;
    console.error(`  ✗ ${name} — ${err.message.split("\n")[0]}`);
  }
}

/** Ator mínimo com os campos de recurso usados pela função. */
function ator({ vida, pa }, extra = {}) {
  return {
    id: "a1",
    resources: {
      vida: { value: vida.value, max: vida.max, temp: vida.temp },
      pontosAcao: { value: pa.value, max: pa.max },
    },
    ...extra,
  };
}

console.log("verify-sync-preserva-vida: B1 — sincronização preserva vida, PA e máximo da ficha");

caso("mesmo máximo: mantém a vida atual da sala (dano não some)", () => {
  const prev = ator({ vida: { value: 12, max: 20 }, pa: { value: 5, max: 5 } });
  const next = ator({ vida: { value: 20, max: 20 }, pa: { value: 5, max: 5 } });
  assert.equal(keepRoomVitals(next, prev).resources.vida.value, 12);
});

caso("mesmo máximo: mantém a cura da sala (não volta ao valor antigo)", () => {
  const prev = ator({ vida: { value: 18, max: 20 }, pa: { value: 5, max: 5 } });
  const next = ator({ vida: { value: 8, max: 20 }, pa: { value: 5, max: 5 } });
  assert.equal(keepRoomVitals(next, prev).resources.vida.value, 18);
});

caso("mantém o PA gasto na sala", () => {
  const prev = ator({ vida: { value: 20, max: 20 }, pa: { value: 3, max: 5 } });
  const next = ator({ vida: { value: 20, max: 20 }, pa: { value: 5, max: 5 } });
  assert.equal(keepRoomVitals(next, prev).resources.pontosAcao.value, 3);
});

caso("subida de nível: máximo mudou -> vale o valor da ficha (20/20 -> 30/30)", () => {
  const prev = ator({ vida: { value: 20, max: 20 }, pa: { value: 5, max: 5 } });
  const next = ator({ vida: { value: 30, max: 30 }, pa: { value: 5, max: 5 } });
  const out = keepRoomVitals(next, prev).resources.vida;
  assert.equal(out.max, 30);
  assert.equal(out.value, 30, "sala não pode ficar 20/30");
});

caso("reconstrução: máximo menor -> vale o valor da ficha, limitado ao máximo", () => {
  const prev = ator({ vida: { value: 25, max: 25 }, pa: { value: 5, max: 5 } });
  const next = ator({ vida: { value: 20, max: 20 }, pa: { value: 5, max: 5 } });
  const out = keepRoomVitals(next, prev).resources.vida;
  assert.equal(out.max, 20);
  assert.equal(out.value, 20, "sala não pode ficar 25/20");
});

caso("sempre limitado ao máximo: valor da sala acima do máximo é cortado", () => {
  const prev = ator({ vida: { value: 25, max: 20 }, pa: { value: 5, max: 5 } });
  const next = ator({ vida: { value: 20, max: 20 }, pa: { value: 5, max: 5 } });
  assert.equal(keepRoomVitals(next, prev).resources.vida.value, 20);
});

caso("mantém a vida temporária da sala", () => {
  const prev = ator({ vida: { value: 20, max: 20, temp: 4 }, pa: { value: 5, max: 5 } });
  const next = ator({ vida: { value: 20, max: 20 }, pa: { value: 5, max: 5 } });
  assert.equal(keepRoomVitals(next, prev).resources.vida.temp, 4);
});

caso("ator novo na sala (sem prev) vem inteiro da ficha", () => {
  const next = ator({ vida: { value: 30, max: 30 }, pa: { value: 5, max: 5 } }, { nome: "Novo" });
  const out = keepRoomVitals(next);
  assert.equal(out, next);
  assert.equal(out.resources.vida.value, 30);
});

caso("não confunde prev e next: o resultado segue a sala, não a ficha", () => {
  const prev = ator({ vida: { value: 5, max: 20 }, pa: { value: 1, max: 5 } });
  const next = ator({ vida: { value: 20, max: 20 }, pa: { value: 5, max: 5 } });
  const out = keepRoomVitals(next, prev);
  assert.equal(out.resources.vida.value, 5);
  assert.equal(out.resources.pontosAcao.value, 1);
});

caso("sync em adventure-actors.ts usa a função real com prev e next na ordem certa", () => {
  const src = readFileSync(
    join(__dirname, "..", "lib", "room", "adventure-actors.ts"),
    "utf8"
  ).replace(/\r\n/g, "\n");
  assert.match(src, /import \{ keepRoomVitals \} from "\.\/actor-vitals";/);
  assert.match(src, /keepRoomVitals\(\s*built\s*,\s*prev\s*\)/);
});

console.log(`\n${pass} ok, ${fail} falha(s)`);
if (fail > 0) process.exit(1);
