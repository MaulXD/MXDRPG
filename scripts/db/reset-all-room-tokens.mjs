#!/usr/bin/env node
/**
 * Remove todos os tokens das mesas, zera combate/PA legado e volta ao modo aventura.
 * node scripts/db/reset-all-room-tokens.mjs
 */
import { loadDotEnv } from "./load-env.mjs";
import { createMariaPool, mariaDbUrl } from "./mysql-pool.mjs";

loadDotEnv();

const rawUrl = process.env.DATABASE_URL ?? "";
const url = mariaDbUrl(rawUrl);
if (!url) {
  console.error("DATABASE_URL não definida (use mysql:// ou mariadb://).");
  process.exit(1);
}
if (/^postgres(ql)?:/i.test(rawUrl.trim())) {
  console.error("Postgres não é suportado — use MariaDB (mysql://).");
  process.exit(1);
}

const pool = await createMariaPool(rawUrl);

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

function resetActorsPa(actors) {
  if (!actors || typeof actors !== "object") return {};
  const out = { ...actors };
  for (const [id, actor] of Object.entries(out)) {
    if (!actor?.resources?.pontosAcao) continue;
    const paMax = actor.resources.pontosAcao.max ?? actor.resources.pontosAcao.value ?? 0;
    out[id] = {
      ...actor,
      resources: {
        ...actor.resources,
        pontosAcao: { ...actor.resources.pontosAcao, value: paMax },
      },
      revision: (actor.revision ?? 0) + 1,
    };
  }
  return out;
}

function resetRoomRow(row) {
  const scene = parseJson(row.scene) ?? {};
  const actors = parseJson(row.actors) ?? {};
  const combat = parseJson(row.combat) ?? {};
  const settings = parseJson(row.settings) ?? {};

  const nextScene = { ...scene, tokens: [] };
  const nextSettings = { ...settings, combatActive: false };
  const nextCombat = { order: [], activeIndex: 0, round: 1, notices: [] };

  return {
    scene: JSON.stringify(nextScene),
    actors: JSON.stringify(resetActorsPa(actors)),
    combat: JSON.stringify(nextCombat),
    settings: JSON.stringify(nextSettings),
    revision: (row.revision ?? 0) + 1,
    updated_at: Date.now(),
  };
}

try {
  const [rows] = await pool.query(
    "SELECT room_id, name, scene, actors, combat, settings, revision FROM eldarin_rooms ORDER BY room_id"
  );

  if (!rows.length) {
    console.log("Nenhuma mesa no banco.");
    process.exit(0);
  }

  let updated = 0;
  for (const row of rows) {
    const scene = parseJson(row.scene) ?? {};
    const combat = parseJson(row.combat) ?? {};
    const settings = parseJson(row.settings) ?? {};
    const tokenCount = Array.isArray(scene.tokens) ? scene.tokens.length : 0;
    const orderLen = Array.isArray(combat.order) ? combat.order.length : 0;
    const hadPaKey = Boolean(combat.paRefreshTurnKey);
    const hadAutoPass = Boolean(combat.pendingAutoPass);
    const combatOn = Boolean(settings.combatActive);

    const patch = resetRoomRow(row);
    await pool.query(
      `UPDATE eldarin_rooms SET
        scene = ?, actors = ?, combat = ?, settings = ?, revision = ?, updated_at = ?
      WHERE room_id = ?`,
      [
        patch.scene,
        patch.actors,
        patch.combat,
        patch.settings,
        patch.revision,
        patch.updated_at,
        row.room_id,
      ]
    );
    updated += 1;
    console.log(
      `✓ ${row.room_id} (${row.name ?? "sem nome"}) — tokens:${tokenCount} ordem:${orderLen} combate:${combatOn ? "on" : "off"} paKey:${hadPaKey} autoPass:${hadAutoPass}`
    );
  }

  console.log(
    `\nreset-all-room-tokens: ${updated} mesa(s) limpas. Reinicie o servidor dev se estiver rodando.`
  );
} catch (e) {
  console.error("Falha:", e instanceof Error ? e.message : e);
  process.exit(1);
} finally {
  await pool.end();
}
