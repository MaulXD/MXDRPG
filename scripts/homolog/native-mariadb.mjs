#!/usr/bin/env node
import { spawn, spawnSync } from "child_process";
import fs from "fs";
import net from "net";
import path from "path";
import { createMariaPool } from "../db/mysql-pool.mjs";
import { ensureHomologEnv } from "./env.mjs";

const WIN_PATHS = [
  "C:\\Program Files\\MariaDB 12.3\\bin",
  "C:\\Program Files\\MariaDB 11.8\\bin",
  "C:\\Program Files\\MariaDB 11.4\\bin",
];

function findMariaBin() {
  for (const dir of WIN_PATHS) {
    const mysqld = path.join(dir, process.platform === "win32" ? "mysqld.exe" : "mysqld");
    if (fs.existsSync(mysqld)) return dir;
  }
  return null;
}

function portOpen(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host }, () => {
      socket.end();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
    socket.setTimeout(1500, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function waitPort(port, attempts = 30) {
  for (let i = 1; i <= attempts; i++) {
    if (await portOpen(port)) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

export async function ensureNativeMariaDb() {
  if (process.platform !== "win32") return false;

  ensureHomologEnv();

  if (await portOpen(3306)) {
    try {
      const pool = await createMariaPool(process.env.DATABASE_URL);
      await pool.query("SELECT 1");
      await pool.end();
      console.log("MariaDB nativo já em execução (porta 3306).");
      return true;
    } catch {
      console.log("Porta 3306 ocupada, mas credenciais homolog falharam — verifique DATABASE_URL.");
      return false;
    }
  }

  const binDir = findMariaBin();
  if (!binDir) return false;

  const defaultsFile = path.join(path.dirname(binDir), "data", "my.ini");
  if (!fs.existsSync(defaultsFile)) {
    console.error("MariaDB instalado, mas my.ini não encontrado:", defaultsFile);
    return false;
  }

  console.log("→ iniciar MariaDB nativo (sem Docker)");
  const mysqld = path.join(binDir, "mysqld.exe");
  const child = spawn(mysqld, [`--defaults-file=${defaultsFile}`], {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  child.unref();

  if (!(await waitPort(3306))) {
    console.error("MariaDB nativo não subiu na porta 3306.");
    return false;
  }

  const mysql = path.join(binDir, "mysql.exe");
  const setupSql = `
CREATE DATABASE IF NOT EXISTS eldarin;
CREATE USER IF NOT EXISTS 'eldarin'@'localhost' IDENTIFIED BY 'eldarin_homolog';
CREATE USER IF NOT EXISTS 'eldarin'@'127.0.0.1' IDENTIFIED BY 'eldarin_homolog';
GRANT ALL PRIVILEGES ON eldarin.* TO 'eldarin'@'localhost';
GRANT ALL PRIVILEGES ON eldarin.* TO 'eldarin'@'127.0.0.1';
FLUSH PRIVILEGES;
`;
  const r = spawnSync(mysql, ["-u", "root", "-e", setupSql], { encoding: "utf8" });
  if (r.status !== 0) {
    console.error("Falha ao criar usuário/banco homolog:", r.stderr || r.stdout);
    return false;
  }

  console.log("MariaDB nativo OK — banco eldarin + usuário homolog.");
  return true;
}
