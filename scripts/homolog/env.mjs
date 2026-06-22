import fs from "fs";
import path from "path";
import { loadDotEnv } from "../db/load-env.mjs";

const root = process.cwd();
const homologEnv = path.join(root, ".env.homolog");
const homologExample = path.join(root, ".env.homolog.example");

/** Carrega .env.homolog (cria a partir do example se faltar). */
export function ensureHomologEnv() {
  if (!fs.existsSync(homologEnv) && fs.existsSync(homologExample)) {
    fs.copyFileSync(homologExample, homologEnv);
    console.log("Criado .env.homolog a partir de .env.homolog.example");
  }
  loadDotEnv([".env.homolog", ".env.local", ".env"]);
  process.env.NEXT_PUBLIC_HOMOLOG = process.env.NEXT_PUBLIC_HOMOLOG ?? "1";
  process.env.HOMOLOG_LOCAL = process.env.HOMOLOG_LOCAL ?? "1";
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("Defina DATABASE_URL em .env.homolog (copie de .env.homolog.example).");
    process.exit(1);
  }
}

export const composeFile = path.join(root, "docker-compose.homolog.yml");
