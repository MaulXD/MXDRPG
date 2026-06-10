/**
 * Gera data/character/subclass-track-details.json a partir do Cap. 12
 * (+ suplemento LIVRO-DO-JOGADOR para trilhas ausentes no _CAP12).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function slug(s) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseSections(md) {
  const sections = [];
  for (const sec of md.split(/^### /m).slice(1)) {
    const head = sec.split("\n")[0].replace(/\r$/, "").trim();
    const m = head.match(/^(.+?) \(([^)]+)\)/);
    if (!m) continue;
    sections.push({ subclass: m[1].trim(), classId: m[2].trim(), body: sec });
  }
  return sections;
}

function parseTrackSection(sec) {
  const dietM = sec.body.match(/\*\*Dieta nv\.2:\*\* (.+)/);
  const dietDetail = dietM ? dietM[1].trim() : "";
  const talents = {};

  for (const raw of sec.body.split("\n")) {
    const line = raw.replace(/\r$/, "").trim();
    let tm = line.match(/^\*\*Nv (\d+) — (.+?):\*\* (.+)$/);
    if (tm) {
      talents[tm[1]] = { name: tm[2].trim(), summary: tm[3].trim() };
      continue;
    }
    tm = line.match(/^\*\*Nv 20 — Ascensao — (.+?):\*\* (.+)$/);
    if (tm) {
      talents["20"] = { name: tm[1].trim(), summary: tm[2].trim() };
    }
  }

  return { dietDetail, talents };
}

const tracks = JSON.parse(
  fs.readFileSync(path.join(root, "data/character/subclass-tracks.json"), "utf8")
).tracks;
const bySlug = new Map(tracks.map((t) => [t.id, t]));

const cap12 = fs.readFileSync(
  path.join(root, "livros/_CAP12_CAMINHOS_SUBCLASSE.md"),
  "utf8"
);
const livro = fs.readFileSync(
  path.join(root, "livros/LIVRO-DO-JOGADOR.md"),
  "utf8"
);

const details = {};

for (const sec of parseSections(cap12)) {
  const id = slug(sec.subclass);
  if (!bySlug.has(id)) {
    console.warn("skip (no track):", id, sec.subclass);
    continue;
  }
  details[id] = parseTrackSection(sec);
}

for (const sec of parseSections(livro)) {
  const id = slug(sec.subclass);
  if (!bySlug.has(id) || details[id]) continue;
  details[id] = parseTrackSection(sec);
  console.log("supplement from livro:", id);
}

for (const t of tracks) {
  if (!details[t.id]) console.warn("MISSING detail:", t.id);
}

const outPath = path.join(root, "data/character/subclass-track-details.json");
fs.writeFileSync(
  outPath,
  `${JSON.stringify({ version: 1, details }, null, 2)}\n`
);
console.log("wrote", Object.keys(details).length, "tracks to", outPath);
