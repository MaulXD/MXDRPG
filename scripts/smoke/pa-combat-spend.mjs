/**
 * E2E completo: PA gasta em movimento e persiste após poll.
 * node scripts/smoke/pa-combat-spend.mjs
 */
import { loadDotEnv } from "../db/load-env.mjs";

loadDotEnv();

const base = (process.env.SMOKE_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

function fail(msg) {
  console.error("pa-combat-spend FALHOU:", msg);
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

async function get(path, cookie) {
  const res = await fetch(`${base}${path}`, { headers: { Cookie: cookie }, cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function main() {
  console.log("\n[pa-combat-spend]", base);
  const gm = await login("mestre", "123");
  const pl = await login("jogador", "123");

  await post("/api/room/demo/tokens/place-actor", gm, {
    actorId: "pc-thrain-ferroescudo",
    q: 0,
    r: 0,
  });
  await post("/api/room/demo/tokens/place-actor", gm, {
    actorId: "pc-lyanna-umbral",
    q: 3,
    r: 0,
  });

  let { res, data } = await post("/api/room/demo/combat/roll-initiative", gm);
  if (!res.ok) fail(`iniciativa: ${data.error ?? res.status}`);

  const activeId = data.combat.order[data.combat.activeIndex];
  const active = data.scene.tokens.find((t) => t.id === activeId);
  const paBefore = active?.pa ?? 0;
  if (paBefore < 1) fail(`ativo sem PA (${paBefore})`);

  const actorId = active.linked ? active.actorId : null;
  const cookie = actorId === "pc-thrain-ferroescudo" ? pl : gm;

  // Move 1 hex (gasta PA em combate)
  const dest = { q: active.axial.q + 1, r: active.axial.r };
  ({ res, data } = await post("/api/room/demo/tokens/move", cookie, {
    tokenId: activeId,
    q: dest.q,
    r: dest.r,
    mode: "walk",
  }));
  if (!res.ok) fail(`movimento: ${data.error ?? res.status}`);

  const moved = data.scene.tokens.find((t) => t.id === activeId);
  const paAfter = moved?.pa ?? 0;
  if (paAfter >= paBefore) fail(`PA não debitou (${paBefore} → ${paAfter})`);
  ok(`movimento debitou PA (${paBefore} → ${paAfter})`);

  if (actorId && data.actors[actorId]) {
    const sheetPa = data.actors[actorId].resources.pontosAcao.value;
    if (sheetPa !== paAfter) fail(`ficha desync (${sheetPa} vs token ${paAfter})`);
    ok(`ficha sincronizada (${sheetPa} PA)`);
  }

  // Simula poll GET
  ({ res, data } = await get("/api/room/demo", gm));
  const polled = data.scene.tokens.find((t) => t.id === activeId);
  if ((polled?.pa ?? 0) !== paAfter) fail(`poll alterou PA (${polled?.pa} vs ${paAfter})`);
  ok("poll manteve PA");

  // Passar turno — próximo deve ter PA
  ({ res, data } = await post("/api/room/demo/combat/next-turn", gm, { force: true }));
  const nextId = data.combat.order[data.combat.activeIndex];
  const next = data.scene.tokens.find((t) => t.id === nextId);
  if ((next?.pa ?? 0) < 1) fail(`próximo sem PA após passar (${next?.name} pa=${next?.pa})`);
  ok(`próximo turno — ${next.name} com ${next.pa} PA`);

  console.log("\npa-combat-spend OK\n");
}

main().catch((e) => fail(e.message));
