#!/usr/bin/env node
/**
 * Smoke A1 — MariaDB: salas e fichas sobrevivem “reload” (novo pool).
 *
 * Uso:
 *   npm run db:migrate
 *   npm run smoke:a1
 *
 * Produção (health apenas):
 *   SMOKE_BASE_URL=https://www.mxdrpg.com.br npm run smoke:a1
 *
 * Local completo (DB + health):
 *   npm run dev   # outro terminal
 *   npm run smoke:a1
 */
import { loadDotEnv } from "../db/load-env.mjs";
import { createMariaPool, mariaDbUrl } from "../db/mysql-pool.mjs";

loadDotEnv();

const base = (process.env.SMOKE_BASE_URL ?? "").replace(/\/$/, "");
const rawUrl = process.env.DATABASE_URL ?? "";
const url = mariaDbUrl(rawUrl);

function fail(msg) {
  console.error("smoke:a1 FALHOU:", msg);
  process.exit(1);
}

function ok(msg) {
  console.log("  ✓", msg);
}

function parseJson(value) {
  if (value == null) return null;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return null;
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
  if (url && body.persistence !== "mariadb") {
    fail(`esperado persistence:mariadb, veio ${body.persistence}`);
  }
  ok("GET /api/health");
}

async function smokeDbRoundtrip() {
  if (!url) {
    console.warn("\n[db] DATABASE_URL ausente — pulando roundtrip (só health se SMOKE_BASE_URL/dev).");
    return;
  }
  if (/^postgres(ql)?:/i.test(rawUrl.trim())) {
    fail("Postgres não é suportado — use MariaDB (mysql://).");
  }

  const pool = await createMariaPool(rawUrl);

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
    cellSize: 36,
    tokens: [],
  };

  const combatV1 = { order: [], activeIndex: 0, round: 1 };

  try {
    await pool.query("SELECT 1");
    ok("MariaDB ping");

    const [tables] = await pool.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = DATABASE() AND table_name IN (
         'eldarin_users', 'eldarin_characters', 'eldarin_rooms'
       )`
    );
    if (tables.length < 3) {
      fail(
        `faltam tabelas (rode npm run db:migrate). Encontradas: ${tables.map((t) => t.table_name ?? t.TABLE_NAME).join(", ")}`
      );
    }
    ok("Tabelas eldarin_*");

    const t0 = Date.now();
    await pool.query(
      `INSERT INTO eldarin_rooms (
        room_id, adventure_id, owner_id, name, invite_code, member_ids,
        scene, actors, combat, chat, settings, revision, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        roomId,
        roomId,
        ownerId,
        "Smoke A1",
        invite,
        JSON.stringify([]),
        JSON.stringify(sceneV1),
        JSON.stringify({}),
        JSON.stringify(combatV1),
        JSON.stringify([welcomeChat]),
        JSON.stringify({}),
        1,
        t0,
      ]
    );
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
          movementSpentCells: 0,
          movementWalkMax: 4,
          movementRunMax: 6,
        },
      ],
    };
    const revision2 = 2;
    const t1 = Date.now();

    await pool.query(
      `UPDATE eldarin_rooms SET scene = ?, revision = ?, updated_at = ? WHERE room_id = ?`,
      [JSON.stringify(sceneV2), revision2, t1, roomId]
    );
    ok("UPDATE sala (token + revision 2)");

    await pool.end();

    const pool2 = await createMariaPool(rawUrl);
    const [rows] = await pool2.query(
      "SELECT room_id, revision, scene, updated_at FROM eldarin_rooms WHERE room_id = ? LIMIT 1",
      [roomId]
    );
    if (!rows[0]) fail("SELECT após reload: sala não encontrada");
    const row = rows[0];
    if (row.revision !== revision2) fail(`revision esperada ${revision2}, veio ${row.revision}`);
    const scene = parseJson(row.scene) ?? {};
    const tokens = scene.tokens ?? [];
    if (tokens.length !== 1 || tokens[0]?.id !== "t-smoke") {
      fail("scene.tokens não persistiu após reload simulado");
    }
    ok("SELECT sala (novo pool) — estado intacto");

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

    const now = Date.now();
    await pool2.query(
      `INSERT INTO eldarin_characters (id, owner_id, data, updated_at)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = VALUES(updated_at)`,
      [charId, ownerId, JSON.stringify(sheet), now]
    );
    ok(`UPSERT ficha ${charId}`);

    const [charRows] = await pool2.query(
      `SELECT JSON_UNQUOTE(JSON_EXTRACT(data, '$.name')) AS name,
              JSON_UNQUOTE(JSON_EXTRACT(data, '$.resources.vida.max')) AS hp
       FROM eldarin_characters WHERE id = ?`,
      [charId]
    );
    if (charRows[0]?.name !== "Smoke PC") fail("ficha não persistiu nome");
    ok("SELECT ficha após upsert");

    await pool2.query("DELETE FROM eldarin_rooms WHERE room_id = ?", [roomId]);
    await pool2.query("DELETE FROM eldarin_characters WHERE id = ?", [charId]);
    ok("Cleanup test rows");

    await pool2.end();
  } catch (e) {
    try {
      const cleanup = await createMariaPool(rawUrl);
      await cleanup.query("DELETE FROM eldarin_rooms WHERE room_id = ?", [roomId]);
      await cleanup.query("DELETE FROM eldarin_characters WHERE id = ?", [charId]);
      await cleanup.end();
    } catch {
      /* ignore */
    }
    fail(e instanceof Error ? e.message : String(e));
  }
}

console.log("=== smoke:a1 — MariaDB persistência (gate A1) ===\n");

await smokeDbRoundtrip();

if (process.env.SMOKE_SKIP_HEALTH === "1") {
  console.log("\nsmoke:a1 OK — roundtrip DB (health ignorado: SMOKE_SKIP_HEALTH=1)");
} else {
  await smokeHealth();
  console.log("\nsmoke:a1 OK — MariaDB roundtrip + health");
}
