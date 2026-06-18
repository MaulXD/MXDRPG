/** Substitui referências Vercel legadas nos docs (one-shot). */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const REPLACEMENTS = [
  ["https://mxdrpg.vercel.app", "https://www.mxdrpg.com.br"],
  ["mxdrpg.vercel.app", "www.mxdrpg.com.br"],
  ["drpg.vercel.app", "(legado — ignorar)"],
  ["npx vercel env pull .env.local", "copiar env do servidor / painel Neon"],
  ["vercel env pull", "copiar env do servidor"],
  ["Vercel →", "Servidor →"],
  ["na Vercel", "no servidor"],
  ["em prod (Vercel)", "em produção (Contabo)"],
  ["Deploy Vercel", "Deploy Contabo/Docker"],
  ["Build Vercel", "Build CI/Docker"],
  ["URL Vercel", "URL produção"],
  ["restart Vercel", "restart do container"],
  ["cold start Vercel", "cold start do container"],
  ["[VERCEL.md](VERCEL.md)", "[DEPLOY.md](DEPLOY.md)"],
  ["VERCEL.md", "DEPLOY.md"],
];

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, out);
    else if (/\.(md|tsx?|mjs|json)$/.test(name)) out.push(full);
  }
  return out;
}

let n = 0;
for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file);
  if (rel.includes("replace-vercel-docs")) continue;
  if (rel.startsWith("node_modules")) continue;
  let raw = fs.readFileSync(file, "utf8");
  let next = raw;
  for (const [a, b] of REPLACEMENTS) next = next.split(a).join(b);
  if (next !== raw) {
    fs.writeFileSync(file, next);
    n++;
  }
}
console.log(`updated ${n} files`);
