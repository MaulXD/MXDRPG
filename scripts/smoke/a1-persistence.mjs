#!/usr/bin/env node
/**
 * Smoke A1 — Neon / Postgres: salas e fichas sobrevivem “reload” (novo cliente SQL).
 *
 * Uso:
 *   npm run db:migrate
 *   npm run smoke:a1
 *
 * Produção (health apenas):
 *   SMOKE_BASE_URL=https://mxdrpg.vercel.app npm run smoke:a1
 *
 * Local completo (DB + health):
 *   npm run dev   # outro terminal
 *   npm run smoke:a1
 */
import postgres from "postgres";
import { loadDotEnv } from "../db/load-env.mjs";
import { normalizeDatabaseUrl } from "../db/normalize-url.mjs";

loadDotEnv();

const base = (process.env.SMOKE_BASE_URL ?? "").replace(/\/$/, "");
const url = normalizeDatabaseUrl(process.env.DATABASE_URL ?? "");

function fail(msg) {
  console.error("smoke:a1 FALHOU:", msg);
  process.exit(1);
}

function ok(msg) {
  console.log("  ✓", msg);
}

async function smokeHealth() {
  const healthUrl = `${base || "http://localhost:3000"}/api/health`;
  let res;
  try {
    res = await fetch(healthUrl, { signal: AbortSignal.timeout(12000) });
  } catch (e) {
    fail(`GET ${healthUrl} — ${e instanceof Error ? e.message : e}. Suba: npm run dev`);
  }
  const body = await res.json().catch(() => ({}));
  console.log("\n[health]", healthUrl, "→", res.status);
  console.log(JSON.stringify(body, null, 2));

  if (!res.ok || !body.ok) fail("health ok:false");
  if (url && !body.db) {
    fail(
      `health db:false — ${body.dbError ?? "sem dbError; confira DATABASE_URL no processo Next"}`
    );
  }
  if (url && body.persistence !== "postgres") {
    fail(`esperado persistence:postgres, veio ${body.persistence}`);
  }
  ok("GET /api/health");
}

async function smokeDbRoundtrip() {
  if (!url) {
    console.warn("\n[db] DATABASE_URL ausente — pulando roundtrip (só health se SMOKE_BASE_URL/dev).");
    return;
  }

  const local = url.includes("localhost") || url.includes("127.0.0.1");
  const sql = postgres(url, {
    max: 1,
    ssl: local ? false : "require",
    connect_timeout: 20,
    prepare: false,
  });

  const suffix = Date.now().toString(36);
  const roomId = `smoke-a1-${suffix}`;
  const ownerId = `usr_smoke_a1_${suffix}`;
  const charId = `pc_smoke_a1_${suffix}`;
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let invite = "";
  for (let i = 0; i < 8; i++) invite += chars[Math.floor(Math.random() * chars.length)];

  const welcomeChat = {
    id: `welcome-${suffix}`,
    authorId: "system",
    authorName: "Sistema",
    authorRole: "mestre",
    kind: "chat",
    text: "Bem-vindos à mesa Eldarin.",
    at: Date.now(),
  };

  const sceneV1 = {
    id: roomId,
    name: "Smoke A1",
    gridRadius: 8,
    hexSize: 36,
    tokens: [],
  };

  const combatV1 = { order: [], activeIndex: 0, round: 1 };

  try {
    await sql`SELECT 1`;
    ok("Postgres ping");

    const tables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name IN (
        'eldarin_users', 'eldarin_characters', 'eldarin_rooms'
      )
    `;
    if (tables.length < 3) {
      fail(`faltam tabelas (rode npm run db:migrate). Encontradas: ${tables.map((t) => t.table_name).join(", ")}`);
    }
    ok("Tabelas eldarin_*");

    const t0 = Date.now();
    await sql`
      INSERT INTO eldarin_rooms (
        room_id, adventure_id, owner_id, name, invite_code, member_ids,
        scene, actors, combat, chat, settings, revision, updated_at
      ) VALUES (
        ${roomId}, ${roomId}, ${ownerId}, ${"Smoke A1"}, ${invite},
        ${sql.json([])},
        ${sql.json(sceneV1)}, ${sql.json({})}, ${sql.json(combatV1)},
        ${sql.json([welcomeChat])}, ${sql.json({})}, ${1}, ${t0}
      )
    `;
    ok(`INSERT sala ${roomId}`);

    const sceneV2 = {
      ...sceneV1,
      tokens: [
        {
          id: "t-smoke",
          name: "Token teste",
          axial: { q: 1, r: 0 },
          color: "#4a90d9",
          walk: 4,
          run: 6,
          pa: 5,
          paMax: 5,
          ownerRole: "mestre",
          movementSpentHex: 0,
          movementWalkMax: 4,
          movementRunMax: 6,
        },
      ],
    };
    const revision2 = 2;
    const t1 = Date.now();

    await sql`
      UPDATE eldarin_rooms SET
        scene = ${sql.json(sceneV2)},
        revision = ${revision2},
        updated_at = ${t1}
      WHERE room_id = ${roomId}
    `;
    ok("UPDATE sala (token + revision 2)");

    await sql.end({ timeout: 5 });

    const sql2 = postgres(url, {
      max: 1,
      ssl: local ? false : "require",
      connect_timeout: 20,
      prepare: false,
    });

    const rows = await sql2`
      SELECT room_id, revision, scene, updated_at
      FROM eldarin_rooms WHERE room_id = ${roomId} LIMIT 1
    `;
    if (!rows[0]) fail("SELECT após reload: sala não encontrada");
    const row = rows[0];
    if (row.revision !== revision2) fail(`revision esperada ${revision2}, veio ${row.revision}`);
    const tokens = row.scene?.tokens ?? [];
    if (tokens.length !== 1 || tokens[0]?.id !== "t-smoke") {
      fail("scene.tokens não persistiu após reload simulado");
    }
    ok("SELECT sala (novo cliente) — estado intacto");

    const sheet = {
      id: charId,
      ownerId,
      name: "Smoke PC",
      biography: "",
      identity: {
        nivel: 1,
        xpTotal: 0,
        raca: "Humano",
        classe: "Guerreiro",
        talentos: [],
      },
      attributes: {
        forca: 10,
        destreza: 10,
        constituicao: 10,
        inteligencia: 10,
        sabedoria: 10,
        carisma: 10,
      },
      culinary: { trinchar: 0, harmonizacao: 0, coccao: 0, estomagoDeFerro: 0 },
      resources: { vida: { value: 10, max: 10 }, pontosAcao: { value: 5, max: 5 } },
      movement: { walk: 4, run: 6 },
      tactical: { defesa: 10, iniciativa: 0 },
      inventory: [],
      lootEconomy: { po: 0, especiarias: {}, minerios: {}, tesouros: {} },
    };

    await sql2`
      INSERT INTO eldarin_characters (id, owner_id, data, updated_at)
      VALUES (${charId}, ${ownerId}, ${sql2.json(sheet)}, ${Date.now()})
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at
    `;
    ok(`UPSERT ficha ${charId}`);

    const charRows = await sql2`
      SELECT data->>'name' AS name, data->'resources'->'vida'->>'max' AS hp
      FROM eldarin_characters WHERE id = ${charId}
    `;
    if (charRows[0]?.name !== "Smoke PC") fail("ficha não persistiu nome");
    ok("SELECT ficha após upsert");

    await sql2`DELETE FROM eldarin_rooms WHERE room_id = ${roomId}`;
    await sql2`DELETE FROM eldarin_characters WHERE id = ${charId}`;
    ok("Cleanup test rows");

    await sql2.end({ timeout: 5 });
  } catch (e) {
    try {
      await sql`DELETE FROM eldarin_rooms WHERE room_id = ${roomId}`;
      await sql`DELETE FROM eldarin_characters WHERE id = ${charId}`;
    } catch {
      /* ignore */
    }
    await sql.end({ timeout: 5 }).catch(() => {});
    fail(e instanceof Error ? e.message : String(e));
  }
}

console.log("=== smoke:a1 — Neon persistência (gate A1) ===\n");

await smokeDbRoundtrip();

if (process.env.SMOKE_SKIP_HEALTH === "1") {
  console.log("\nsmoke:a1 OK — roundtrip DB (health ignorado: SMOKE_SKIP_HEALTH=1)");
} else {
  await smokeHealth();
  console.log("\nsmoke:a1 OK — Postgres roundtrip + health");
}
