/**
 * D-15: o log do mestre mostra a mesma PA que ActiveCharactersPanel e MapTokenList
 * (pool + bankedPa legado via materializeCombatPa). A regra de PA não muda.
 * Verificação por leitura do código.
 * node scripts/verify-d15-gm-log-pa.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ler = (rel) => readFileSync(join(__dirname, "..", rel), "utf8");

const DISPLAY = ler("lib/combat/pa-display.ts");
assert.ok(
  /export function resolveGmLogPa\(token: BattleToken\): number \{[\s\S]*?materializeCombatPa\(token, recovery\)/.test(DISPLAY),
  "resolveGmLogPa soma bankedPa via materializeCombatPa"
);

const LOG = ler("components/vtt/GmCombatLogPanel.tsx");
assert.ok(
  LOG.includes('import { resolveGmLogPa } from "@/lib/combat/pa-display";'),
  "GmCombatLogPanel importa resolveGmLogPa"
);
assert.ok(LOG.includes("PA {resolveGmLogPa(t)}"), "log do mestre mostra resolveGmLogPa(t), não só t.pa");
assert.ok(!LOG.includes("PA {t.pa ?? 0}"), "log do mestre não mostra mais só t.pa");

// Mostradores de mesa seguem somando bankedPa (referência do D-15).
const ATIVOS = ler("components/vtt/ActiveCharactersPanel.tsx");
assert.ok(ATIVOS.includes("banked={t.bankedPa}"), "ActiveCharactersPanel segue passando bankedPa");
const PA_DOT = ler("components/vtt/PaDotMeter.tsx");
assert.ok(PA_DOT.includes("bankedPa: banked"), "PaDotMeter segue usando bankedPa em materializeCombatPa");

console.log("verify-d15-gm-log-pa: OK");
