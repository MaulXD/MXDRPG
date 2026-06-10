import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const svgPath = path.join(root, "public", "brand", "favicon.svg");
const svg = await fs.readFile(svgPath);

const targets = [
  { out: path.join(root, "public", "favicon.png"), size: 32 },
  { out: path.join(root, "app", "icon.png"), size: 32 },
  { out: path.join(root, "app", "apple-icon.png"), size: 180 },
];

for (const { out, size } of targets) {
  await sharp(svg).resize(size, size).png().toFile(out);
  console.log(`wrote ${path.relative(root, out)} (${size}px)`);
}

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img" aria-label="MXDRPG">
  <rect width="32" height="32" rx="6" fill="#121110"/>
  <circle cx="16" cy="16" r="13.5" fill="#1c1a17" stroke="#b8922e" stroke-width="1"/>
  <g transform="translate(16 16.5)" stroke="#2a1410" stroke-width="0.6" stroke-linejoin="round">
    <polygon points="0,-8.5 7.25,2.75 0,5.75" fill="#ef5f52"/>
    <polygon points="0,-8.5 -7.25,2.75 0,5.75" fill="#c43428"/>
    <polygon points="0,-8.5 7.25,2.75 -7.25,2.75" fill="#e8685a"/>
    <polygon points="0,5.75 7.25,2.75 4.5,8.5" fill="#9a251c"/>
    <polygon points="0,5.75 -7.25,2.75 -4.5,8.5" fill="#b83228"/>
    <polygon points="0,5.75 4.5,8.5 -4.5,8.5" fill="#a82e24"/>
  </g>
</svg>`;

for (const rel of ["public/icon.svg", "app/icon.svg"]) {
  const out = path.join(root, rel);
  await fs.writeFile(out, iconSvg, "utf8");
  console.log(`wrote ${rel}`);
}
