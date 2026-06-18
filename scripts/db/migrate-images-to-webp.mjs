#!/usr/bin/env node
/**
 * Converte imagens JPEG/PNG/GIF embutidas (data URLs) para WebP no MariaDB.
 *
 * Uso: npm run db:migrate-images
 */
import sharp from "sharp";
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

const MAX_CHARS = 600_000 * 1.4;
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

function mimeOf(dataUrl) {
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) return null;
  const semi = dataUrl.indexOf(";");
  return semi > 5 ? dataUrl.slice(5, semi) : null;
}

async function toWebp(dataUrl, maxEdge) {
  const mime = mimeOf(dataUrl);
  if (!mime || mime === "image/webp") return dataUrl;
  const comma = dataUrl.indexOf(",");
  const buf = Buffer.from(dataUrl.slice(comma + 1), "base64");
  let quality = 82;
  let out = await sharp(buf)
    .rotate()
    .resize(maxEdge, maxEdge, { fit: "inside", withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();
  for (let i = 0; i < 4; i++) {
    const candidate = `data:image/webp;base64,${out.toString("base64")}`;
    if (candidate.length <= MAX_CHARS) return candidate;
    quality = Math.max(40, quality - 10);
    out = await sharp(buf)
      .rotate()
      .resize(maxEdge, maxEdge, { fit: "inside", withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();
  }
  return `data:image/webp;base64,${out.toString("base64")}`;
}

async function maybeConvert(value, maxEdge) {
  if (typeof value !== "string") return { value, changed: false };
  const mime = mimeOf(value);
  if (!mime || mime === "image/webp") return { value, changed: false };
  const next = await toWebp(value, maxEdge);
  return { value: next, changed: next !== value };
}

let converted = 0;

try {
  const [chars] = await pool.query("SELECT id, data FROM eldarin_characters");
  for (const row of chars) {
    const data = parseJson(row.data);
    if (!data || typeof data !== "object") continue;
    let changed = false;
    const next = { ...data };
    for (const [field, edge] of [
      ["portraitUrl", 1024],
      ["tokenImageUrl", 512],
    ]) {
      if (!(field in next)) continue;
      const r = await maybeConvert(next[field], edge);
      if (r.changed) {
        next[field] = r.value;
        changed = true;
        converted++;
      }
    }
    if (changed) {
      await pool.query("UPDATE eldarin_characters SET data = ? WHERE id = ?", [
        JSON.stringify(next),
        row.id,
      ]);
      console.log(`  ficha ${row.id}`);
    }
  }

  const [rooms] = await pool.query("SELECT room_id, scene, actors FROM eldarin_rooms");
  for (const row of rooms) {
    let sceneChanged = false;
    let actorsChanged = false;
    const scene = structuredClone(parseJson(row.scene) ?? {});
    const actors = structuredClone(parseJson(row.actors) ?? {});

    if (scene.mapImageUrl) {
      const r = await maybeConvert(scene.mapImageUrl, 1920);
      if (r.changed) {
        scene.mapImageUrl = r.value;
        sceneChanged = true;
        converted++;
      }
    }
    if (Array.isArray(scene.tokens)) {
      for (const token of scene.tokens) {
        if (!token?.imageUrl) continue;
        const r = await maybeConvert(token.imageUrl, 512);
        if (r.changed) {
          token.imageUrl = r.value;
          sceneChanged = true;
          converted++;
        }
      }
    }
    for (const [actorId, actor] of Object.entries(actors)) {
      if (!actor || typeof actor !== "object") continue;
      for (const [field, edge] of [
        ["portraitUrl", 1024],
        ["tokenImageUrl", 512],
      ]) {
        if (!(field in actor)) continue;
        const r = await maybeConvert(actor[field], edge);
        if (r.changed) {
          actor[field] = r.value;
          actorsChanged = true;
          converted++;
        }
      }
      actors[actorId] = actor;
    }

    if (sceneChanged || actorsChanged) {
      await pool.query("UPDATE eldarin_rooms SET scene = ?, actors = ? WHERE room_id = ?", [
        JSON.stringify(scene),
        JSON.stringify(actors),
        row.room_id,
      ]);
      console.log(`  sala ${row.room_id}`);
    }
  }

  console.log(`\nOK — ${converted} imagem(ns) convertida(s) para WebP`);
} catch (e) {
  console.error("Falha:", e instanceof Error ? e.message : e);
  process.exit(1);
} finally {
  await pool.end();
}
