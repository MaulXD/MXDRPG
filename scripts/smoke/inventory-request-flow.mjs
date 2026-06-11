#!/usr/bin/env node
/**
 * E2E inventário: jogador solicita → mestre aprova → jogador vê notificação.
 * Requer dev server + DATABASE_URL (ou memória com login demo).
 */
import { loadDotEnv } from "../db/load-env.mjs";

loadDotEnv();

const base = (process.env.SMOKE_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

function fail(msg) {
  console.error("inventory-request-flow FALHOU:", msg);
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
  const cookie = parseCookies(res);
  if (!cookie.includes("vinite_session")) fail(`login ${login}: sem cookie de sessão`);
  ok(`login ${login}`);
  return cookie;
}

async function main() {
  console.log("\n[inventory-request-flow]", base);

  const playerCookie = await login("jogador", "123");
  const gmCookie = await login("mestre", "123");

  const characterId = "pc-thrain-ferroescudo";

  const postRes = await fetch(`${base}/api/characters/${characterId}/inventory-request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: playerCookie,
    },
    body: JSON.stringify({
      packId: "consumiveis",
      entryId: "consumiveis-poc-01",
      adventureId: "demo",
      roomId: "demo",
      quantity: 1,
    }),
  });
  const postData = await postRes.json().catch(() => ({}));
  if (!postRes.ok) fail(`POST inventory-request: ${postData.error ?? postRes.status}`);
  const requestId = postData.request?.id;
  if (!requestId) fail("POST sem request.id");
  ok(`solicitação criada ${requestId}`);

  const pendingRes = await fetch(`${base}/api/characters/${characterId}/inventory-request`, {
    headers: { Cookie: playerCookie },
  });
  const pendingData = await pendingRes.json();
  if (!pendingRes.ok || !pendingData.requests?.some((r) => r.id === requestId)) {
    fail("pendente não listado para o jogador");
  }
  ok("pendente visível na ficha");

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
  ok("mestre aprovou");

  const notifyRes = await fetch(`${base}/api/adventures/demo/my-inventory-requests`, {
    headers: { Cookie: playerCookie },
  });
  const notifyData = await notifyRes.json();
  if (!notifyRes.ok) fail(`my-inventory-requests: ${notifyRes.status}`);
  const approved = notifyData.requests?.find((r) => r.id === requestId && r.status === "approved");
  if (!approved) fail("notificação approved ausente para jogador");
  ok("jogador vê aprovação no sino");

  const dismissRes = await fetch(
    `${base}/api/characters/${characterId}/inventory-request/${requestId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: playerCookie },
      body: JSON.stringify({ action: "dismiss" }),
    }
  );
  if (!dismissRes.ok) fail("dismiss falhou");
  ok("jogador dispensou notificação");

  const afterRes = await fetch(`${base}/api/adventures/demo/my-inventory-requests`, {
    headers: { Cookie: playerCookie },
  });
  const afterData = await afterRes.json();
  if (afterData.requests?.some((r) => r.id === requestId)) {
    fail("notificação ainda ativa após dismiss");
  }
  ok("notificação removida após OK");

  console.log("\ninventory-request-flow OK\n");
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)));
