#!/usr/bin/env node
/**
 * Level-up na mesa demo: XP → subir nível → token sincroniza nivel + paMax.
 */
import { loadDotEnv } from "../db/load-env.mjs";

loadDotEnv();

const base = (process.env.SMOKE_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

function fail(msg) {
  console.error("level-up-pa-sync FALHOU:", msg);
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

async function main() {
  console.log("\n[level-up-pa-sync]", base);

  const playerCookie = await login("jogador", "123");
  const actorId = "pc-thrain-ferroescudo";

  const roomBefore = await fetch(`${base}/api/room/demo`, { headers: { Cookie: playerCookie } });
  const before = await roomBefore.json().catch(() => ({}));
  if (!roomBefore.ok) fail(`GET room: ${before.error ?? roomBefore.status}`);
  const actorBefore = before.actors?.[actorId];
  if (!actorBefore) fail("ator demo ausente");
  const nivelBefore = actorBefore.identity?.nivel ?? 0;
  const tokenBefore = before.scene?.tokens?.find((t) => t.actorId === actorId && t.linked);
  if (!tokenBefore) fail("token linkado ausente");

  const xpRes = await fetch(`${base}/api/room/demo/gm/actor-progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: playerCookie },
    body: JSON.stringify({ action: "grant-xp", actorId, amount: 800 }),
  });
  const xpData = await xpRes.json().catch(() => ({}));
  if (!xpRes.ok) fail(`grant-xp: ${xpData.error ?? xpRes.status}`);
  ok("XP concedido para level-up");

  const levelRes = await fetch(`${base}/api/room/demo/actors/${actorId}/level-up`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: playerCookie },
    body: JSON.stringify({}),
  });
  const levelData = await levelRes.json().catch(() => ({}));
  if (!levelRes.ok) fail(`level-up: ${levelData.error ?? levelRes.status}`);

  const actor = levelData.actor;
  const token = levelData.scene?.tokens?.find((t) => t.actorId === actorId && t.linked);
  if (!actor) fail("resposta sem actor");
  if (!token) fail("resposta sem token linkado");

  const nivelAfter = actor.identity?.nivel ?? 0;
  if (nivelAfter !== nivelBefore + 1) {
    fail(`nível esperado ${nivelBefore + 1}, obteve ${nivelAfter}`);
  }
  ok(`nível ${nivelBefore} → ${nivelAfter}`);

  const sheetPaMax = actor.resources?.pontosAcao?.max;
  const tokenPaMax = token.paMax;
  if (sheetPaMax == null || tokenPaMax == null) fail("PA máx ausente na ficha ou token");
  if (sheetPaMax !== tokenPaMax) {
    fail(`PA máx divergente ficha=${sheetPaMax} token=${tokenPaMax}`);
  }
  ok(`PA máx sincronizado (${tokenPaMax})`);

  if (token.nivel !== nivelAfter) {
    fail(`token.nivel=${token.nivel} ≠ actor.nivel=${nivelAfter}`);
  }
  ok("token.nivel sincronizado");

  const reloadRes = await fetch(`${base}/api/room/demo`, { headers: { Cookie: playerCookie } });
  const reload = await reloadRes.json().catch(() => ({}));
  if (!reloadRes.ok) fail(`reload room: ${reload.error ?? reloadRes.status}`);
  const reloaded = reload.actors?.[actorId];
  const reloadedToken = reload.scene?.tokens?.find((t) => t.actorId === actorId && t.linked);
  if (reloaded?.identity?.nivel !== nivelAfter) fail("nível não persistiu após reload");
  if (reloadedToken?.paMax !== tokenPaMax) fail("paMax do token não persistiu após reload");
  ok("reload — nível e PA máx persistem");

  console.log("\nlevel-up-pa-sync OK\n");
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)));
