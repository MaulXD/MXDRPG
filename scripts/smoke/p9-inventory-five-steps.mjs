#!/usr/bin/env node
/**
 * P9 — 5 passos do fluxo de inventário (demo local):
 * 1. Login jogador + mestre
 * 2. Jogador solicita consumível
 * 3. Mestre aprova
 * 4. Jogador vê notificação no sino
 * 5. Reload simulado — item na ficha + estado persiste
 */
import { loadDotEnv } from "../db/load-env.mjs";

loadDotEnv();

const base = (process.env.SMOKE_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

function fail(msg) {
  console.error("p9-inventory-five-steps FALHOU:", msg);
  process.exit(1);
}

function ok(step, msg) {
  console.log(`  ✓ [${step}/5]`, msg);
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
  const cookie = parseCookies(res);
  if (!cookie.includes("vinite_session")) fail(`login ${login}: sem cookie`);
  return cookie;
}

async function main() {
  console.log("\n[p9-inventory-five-steps]", base);

  const playerCookie = await login("jogador", "123");
  const gmCookie = await login("mestre", "123");
  ok(1, "login jogador e mestre");

  const characterId = "pc-thrain-ferroescudo";
  const entryId = "consumiveis-poc-02";

  const postRes = await fetch(`${base}/api/characters/${characterId}/inventory-request`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: playerCookie },
    body: JSON.stringify({
      packId: "consumiveis",
      entryId,
      adventureId: "demo",
      roomId: "demo",
      quantity: 1,
    }),
  });
  const postData = await postRes.json().catch(() => ({}));
  if (!postRes.ok) fail(`POST inventory-request: ${postData.error ?? postRes.status}`);
  const requestId = postData.request?.id;
  if (!requestId) fail("POST sem request.id");
  ok(2, `jogador solicitou ${entryId} (${requestId})`);

  const approveRes = await fetch(
    `${base}/api/characters/${characterId}/inventory-request/${requestId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: gmCookie },
      body: JSON.stringify({ action: "approve" }),
    }
  );
  const approveData = await approveRes.json().catch(() => ({}));
  if (!approveRes.ok) fail(`approve: ${approveData.error ?? approveRes.status}`);
  ok(3, "mestre aprovou");

  const notifyRes = await fetch(`${base}/api/adventures/demo/my-inventory-requests`, {
    headers: { Cookie: playerCookie },
  });
  const notifyData = await notifyRes.json();
  if (!notifyRes.ok) fail(`my-inventory-requests: ${notifyRes.status}`);
  const approved = notifyData.requests?.find((r) => r.id === requestId && r.status === "approved");
  if (!approved) fail("notificação approved ausente");
  ok(4, "jogador vê aprovação no sino");

  const charRes = await fetch(`${base}/api/characters/${characterId}`, {
    headers: { Cookie: playerCookie },
  });
  const charData = await charRes.json().catch(() => ({}));
  if (!charRes.ok) fail(`GET character: ${charData.error ?? charRes.status}`);
  const hasItem = charData.character?.inventory?.some(
    (i) => i.packId === "consumiveis" && i.entryId === entryId
  );
  if (!hasItem) fail("item não apareceu no inventário após aprovação");

  const roomRes = await fetch(`${base}/api/room/demo`, { headers: { Cookie: playerCookie } });
  const roomData = await roomRes.json().catch(() => ({}));
  if (!roomRes.ok) fail(`GET room reload: ${roomData.error ?? roomRes.status}`);
  const actor = roomData.actors?.[characterId];
  if (!actor) fail("ator ausente após reload da sala");
  const stillHasItem = actor.inventory?.some(
    (i) => i.packId === "consumiveis" && i.entryId === entryId
  );
  if (!stillHasItem) fail("inventário do ator na sala não persistiu");
  ok(5, "reload — item na ficha e na mesa");

  console.log("\np9-inventory-five-steps OK\n");
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)));
