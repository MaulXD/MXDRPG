#!/usr/bin/env node
/**
 * Combate demo: iniciativa → ataque → passar turno.
 */
import { loadDotEnv } from "../db/load-env.mjs";

loadDotEnv();

const base = (process.env.SMOKE_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

function fail(msg) {
  console.error("combat-core FALHOU:", msg);
  process.exit(1);
}

function ok(msg) {
  console.log("  ✓", msg);
}

function hexDist(a, b) {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return (Math.abs(dq) + Math.abs(dq + dr) + Math.abs(dr)) / 2;
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

function aliveMonsters(tokens, excludeId) {
  return tokens.filter(
    (t) =>
      t.monsterEntryId &&
      !t.linked &&
      t.id !== excludeId &&
      (t.vida == null || t.vidaMax == null || t.vida > 0)
  );
}

function meleeTarget(attacker, tokens) {
  return aliveMonsters(tokens, attacker.id)
    .map((t) => ({ t, dist: hexDist(attacker, t) }))
    .filter(({ dist }) => dist <= 1)
    .sort((a, b) => a.dist - b.dist)[0]?.t;
}

async function main() {
  console.log("\n[combat-core]", base);

  const gm = await login("mestre", "123");
  const pl = await login("jogador", "123");

  let { res, data } = await post("/api/room/demo/combat/roll-initiative", gm);
  if (!res.ok) fail(`iniciativa: ${data.error ?? res.status}`);
  ok("iniciativa rolada");

  let attacked = false;
  let idxBefore = data.combat.activeIndex;

  for (let i = 0; i < 24; i++) {
    const activeId = data.combat.order[data.combat.activeIndex];
    const active = data.scene.tokens.find((t) => t.id === activeId);
    if (!active) fail("token ativo ausente");

    const target = meleeTarget(active, data.scene.tokens);
    const actor =
      active.linked && active.actorId ? data.actors[active.actorId] : null;
    const weapon = actor?.inventory?.find(
      (item) => item.packId === "armas" && item.quantity > 0
    );

    if (
      !attacked &&
      target &&
      (active.pa ?? 0) > 0 &&
      (weapon || active.monsterEntryId)
    ) {
      const cookie = actor ? pl : gm;
      const body = weapon
        ? {
            attackerTokenId: active.id,
            defenderTokenId: target.id,
            actionPack: "armas",
            actionEntryId: weapon.entryId,
          }
        : {
            attackerTokenId: active.id,
            defenderTokenId: target.id,
          };
      ({ res, data } = await post("/api/room/demo/combat/attack", cookie, body));
      if (!res.ok) fail(`ataque: ${data.error ?? res.status}`);
      attacked = true;
      ok(`ataque (${active.name} → ${target.name})`);
      idxBefore = data.combat.activeIndex;
      continue;
    }

    ({ res, data } = await post("/api/room/demo/combat/next-turn", gm));
    if (!res.ok) fail(`next-turn: ${data.error ?? res.status}`);

    if (attacked && data.combat.activeIndex !== idxBefore) {
      ok("turno avançou após ataque");
      console.log("\ncombat-core OK\n");
      return;
    }
  }

  if (!attacked) fail("não conseguiu atacar em 24 passos (alcance/PA)");
  fail("turno não avançou após ataque");
}

main().catch((e) => fail(e.message));
