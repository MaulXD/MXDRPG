/**
 * E2E: iniciativa → PA no ativo → passar turno → PA no próximo.
 * node scripts/smoke/pa-turn-flow.mjs
 */
import { loadDotEnv } from "../db/load-env.mjs";

loadDotEnv();

const base = (process.env.SMOKE_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

function fail(msg) {
  console.error("pa-turn-flow FALHOU:", msg);
  process.exit(1);
}

function ok(msg) {
  console.log("  ✓", msg);
}

function parseCookies(res) {
  const raw = res.headers.getSetCookie?.() ?? [];
  return raw.map((c) => c.split(";")[0]).join("; ");
}

async function login(login, password) {
  const res = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) fail(`login ${login}: ${data.error ?? res.status}`);
  return parseCookies(res);
}

async function post(path, cookie, body) {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      Cookie: cookie,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function main() {
  console.log("\n[pa-turn-flow]", base);
  const gm = await login("mestre", "123");

  // Demo começa sem tokens — coloca PC + monstro
  let { res, data } = await post("/api/room/demo/tokens/place-actor", gm, {
    actorId: "pc-thrain-ferroescudo",
    q: 0,
    r: 0,
  });
  if (!res.ok) fail(`place actor: ${data.error ?? res.status}`);
  ok("PC no mapa");

  ({ res, data } = await post("/api/room/demo/tokens/place-actor", gm, {
    actorId: "pc-lyanna-umbral",
    q: 2,
    r: 0,
  }));
  if (!res.ok) fail(`place actor 2: ${data.error ?? res.status}`);
  ok("segundo PC no mapa");

  ({ res, data } = await post("/api/room/demo/combat/roll-initiative", gm));
  if (!res.ok) fail(`iniciativa: ${data.error ?? res.status}`);

  const activeId = data.combat?.order?.[data.combat?.activeIndex];
  const active = data.scene?.tokens?.find((t) => t.id === activeId);
  if (!active) fail(`ativo ausente (order=${data.combat?.order?.length} tokens=${data.scene?.tokens?.length})`);
  if ((active.pa ?? 0) < 1) fail(`ativo sem PA após iniciativa (pa=${active.pa})`);
  ok(`iniciativa — ${active.name} com ${active.pa} PA`);

  const idxBefore = data.combat.activeIndex;
  ({ res, data } = await post("/api/room/demo/combat/next-turn", gm, { force: true }));
  if (!res.ok) fail(`passar turno: ${data.error ?? res.status}`);

  const tokensAfter = data.scene?.tokens ?? data.tokens ?? [];
  const combatAfter = data.combat;
  if (!combatAfter?.order?.length) fail("resposta sem combate");

  const nextId = combatAfter.order[combatAfter.activeIndex];
  const next = tokensAfter.find((t) => t.id === nextId);
  if (!next) fail("próximo ativo ausente");
  if (combatAfter.activeIndex === idxBefore && combatAfter.order.length > 1) {
    fail("turno não avançou");
  }
  if ((next.pa ?? 0) < 1) fail(`próximo ativo sem PA (pa=${next.pa}, ${next.name})`);
  ok(`passar turno — ${next.name} com ${next.pa} PA`);

  console.log("\npa-turn-flow OK\n");
}

main().catch((e) => fail(e.message));
