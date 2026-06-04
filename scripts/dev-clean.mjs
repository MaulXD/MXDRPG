/**
 * Limpa .next e sobe o Next dev (evita cache corrompido com build paralelo).
 * npm run dev:clean
 */
import { rmSync } from "node:fs";
import { spawn } from "node:child_process";

rmSync(".next", { recursive: true, force: true });
console.log("Removed .next — starting next dev…");

const child = spawn("npx", ["next", "dev", "--turbo"], {
  stdio: "inherit",
  shell: true,
  cwd: process.cwd(),
});

child.on("exit", (code) => process.exit(code ?? 0));
