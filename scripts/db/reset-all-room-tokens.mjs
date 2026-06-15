#!/usr/bin/env node
/**
 * Remove todos os tokens das mesas, zera combate/PA legado e volta ao modo aventura.
 * node scripts/db/reset-all-room-tokens.mjs
 */
import postgres from "postgres";
import { loadDotEnv } from "./load-env.mjs";
import { normalizeDatabaseUrl } from "./normalize-url.mjs";

loadDotEnv();

const url = normalizeDatabaseUrl(process.env.DATABASE_URL ?? "");
if (!url) {
  console.error("DATABASE_URL não definida.");
  process.exit(1);
}

const local = url.includes("localhost") || url.includes("127.0.0.1");
const sql = postgres(url, {
  max: 1,
  ssl: local ? false : "require",
  connect_timeout: 20,
});

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
  const scene = {
    ...(row.scene ?? {}),
    tokens: [],
  };
  const settings = {
    ...(row.settings ?? {}),
    combatActive: false,
  };
  const combat = {
    order: [],
    activeIndex: 0,
    round: 1,
    notices: [],
  };
  return {
    scene: sql.json(scene),
    actors: sql.json(resetActorsPa(row.actors)),
    combat: sql.json(combat),
    settings: sql.json(settings),
    revision: (row.revision ?? 0) + 1,
    updated_at: Date.now(),
  };
}

try {
  const rows = await sql`
    SELECT room_id, name, scene, actors, combat, settings, revision
    FROM eldarin_rooms
    ORDER BY room_id
  `;

  if (!rows.length) {
    console.log("Nenhuma mesa no banco.");
    process.exit(0);
  }

  let updated = 0;
  for (const row of rows) {
    const tokenCount = Array.isArray(row.scene?.tokens) ? row.scene.tokens.length : 0;
    const orderLen = Array.isArray(row.combat?.order) ? row.combat.order.length : 0;
    const hadPaKey = Boolean(row.combat?.paRefreshTurnKey);
    const hadAutoPass = Boolean(row.combat?.pendingAutoPass);
    const combatOn = Boolean(row.settings?.combatActive);

    const patch = resetRoomRow(row);
    await sql`
      UPDATE eldarin_rooms SET
        scene = ${patch.scene},
        actors = ${patch.actors},
        combat = ${patch.combat},
        settings = ${patch.settings},
        revision = ${patch.revision},
        updated_at = ${patch.updated_at}
      WHERE room_id = ${row.room_id}
    `;
    updated += 1;
    console.log(
      `✓ ${row.room_id} (${row.name ?? "sem nome"}) — tokens:${tokenCount} ordem:${orderLen} combate:${combatOn ? "on" : "off"} paKey:${hadPaKey} autoPass:${hadAutoPass}`
    );
  }

  console.log(`\nreset-all-room-tokens: ${updated} mesa(s) limpas. Reinicie o servidor dev se estiver rodando.`);
} catch (e) {
  console.error("Falha:", e instanceof Error ? e.message : e);
  process.exit(1);
} finally {
  await sql.end({ timeout: 5 });
}
