import type { ChatMessage } from "@/lib/room/chat";

export type TokenCastFxKind = "heal" | "fire" | "slash" | "buff";

export type ActiveTokenCastFx = {
  id: string;
  tokenId: string;
  kind: TokenCastFxKind;
  startedAt: number;
  durationMs: number;
};

const FIRE_KEYWORDS = ["fogo", "chama", "incêndio", "incendio", "piro", "ardente", "brasas"];
const HEAL_KEYWORDS = ["cura", "curar", "curou", "restaura", "restaurou"];

export function castFxDuration(kind: TokenCastFxKind): number {
  return kind === "slash" ? 1000 : 3000;
}

function nameLooksFire(name: string): boolean {
  const n = name.toLowerCase();
  return FIRE_KEYWORDS.some((k) => n.includes(k));
}

function nameLooksHeal(name: string, detail: string): boolean {
  const blob = `${name} ${detail}`.toLowerCase();
  return HEAL_KEYWORDS.some((k) => blob.includes(k));
}

function nameLooksBuff(name: string, detail: string): boolean {
  const blob = `${name} ${detail}`.toLowerCase();
  return (
    blob.includes("inspir") ||
    blob.includes("escudo") ||
    blob.includes("vantagem") ||
    blob.includes("postura") ||
    blob.includes("barreira") ||
    blob.includes("fúria controlada") ||
    blob.includes("furia controlada")
  );
}

/** Escolhe animação persistente no token após resolução do combate. */
export function resolveCastFxFromCombat(msg: ChatMessage): {
  kind: TokenCastFxKind;
  tokenId: string;
} | null {
  if (msg.kind !== "combat" || !msg.combat) return null;
  const c = msg.combat;
  const name = c.weaponName;
  const detail = c.detail ?? "";

  if (c.attackerHeal && c.attackerHeal > 0 && c.attackerTokenId) {
    return { kind: "heal", tokenId: c.attackerTokenId };
  }

  const isHeal =
    (c.damageTotal != null && c.damageTotal > 0 && nameLooksHeal(name, detail)) ||
    (c.actionKind === "ability" && nameLooksHeal(name, detail));

  if (isHeal && c.defenderTokenId) {
    return { kind: "heal", tokenId: c.defenderTokenId };
  }

  if (c.actionKind === "ability" && c.damageTotal == null && nameLooksBuff(name, detail)) {
    return { kind: "buff", tokenId: c.defenderTokenId };
  }

  if (c.actionKind === "weapon" || c.actionKind === "unarmed") {
    if (c.hit && c.defenderTokenId) {
      return { kind: "slash", tokenId: c.defenderTokenId };
    }
    return null;
  }

  if (c.actionKind === "spell") {
    if (nameLooksHeal(name, detail) && c.defenderTokenId) {
      return { kind: "heal", tokenId: c.defenderTokenId };
    }
    if (nameLooksFire(name) && c.defenderTokenId && (c.hit !== false || c.saveTotal != null)) {
      return { kind: "fire", tokenId: c.defenderTokenId };
    }
  }

  if (c.actionKind === "ability" && c.hit && !nameLooksHeal(name, detail)) {
    return { kind: "slash", tokenId: c.defenderTokenId };
  }

  return null;
}

function seeded(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** Cura — apenas sinais + verdes no centro do token (~3s). */
function drawHealCastFx(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  t: number
): void {
  const fade = t < 0.85 ? 1 : 1 - (t - 0.85) / 0.15;
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const pulse = 1 + Math.sin(t * Math.PI * 5) * 0.12;
  const centerSize = Math.round(20 * pulse);
  ctx.font = `900 ${centerSize}px Source Sans 3, system-ui, sans-serif`;
  ctx.shadowColor = "rgba(40, 180, 90, 0.75)";
  ctx.shadowBlur = 10;
  ctx.fillStyle = `rgba(140, 255, 170, ${0.82 + (1 - t) * 0.18})`;
  ctx.fillText("+", x, y);
  ctx.shadowBlur = 0;

  for (let i = 0; i < 9; i++) {
    const phase = (t * 1.3 + i * 0.11) % 1;
    const angle = seeded(i * 3.7) * Math.PI * 2;
    const spread = r * 0.35 * (1 - phase * 0.65);
    const px = x + Math.cos(angle) * spread;
    const py = y - phase * r * 1.15;
    const size = Math.round(10 + seeded(i + 2) * 7);

    ctx.font = `800 ${size}px Source Sans 3, system-ui, sans-serif`;
    ctx.fillStyle = `rgba(160, 255, 185, ${(1 - phase) * 0.9})`;
    ctx.fillText("+", px, py);
  }

  ctx.beginPath();
  ctx.arc(x, y, r + 4, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(100, 230, 140, ${0.22 + Math.sin(t * Math.PI * 4) * 0.1})`;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

/** Alvo em chamas — overlay laranja/vermelho por ~3s. */
function drawFireCastFx(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  t: number
): void {
  const fade = t < 0.88 ? 1 : 1 - (t - 0.88) / 0.12;
  const flicker = 0.65 + Math.sin(t * Math.PI * 10) * 0.2 + Math.sin(t * Math.PI * 17) * 0.15;

  ctx.save();
  ctx.globalAlpha = fade * flicker;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.92, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 90, 20, 0.32)";
  ctx.fill();

  for (let i = 0; i < 8; i++) {
    const phase = (t * 1.6 + i * 0.13) % 1;
    const fx = x + (seeded(i * 5.1) - 0.5) * r * 1.1;
    const baseY = y + r * 0.35;
    const fy = baseY - phase * r * 1.3;
    const w = 4 + seeded(i + 1) * 5;
    const h = 8 + seeded(i + 3) * 12;

    ctx.beginPath();
    ctx.moveTo(fx, fy + h);
    ctx.quadraticCurveTo(fx - w * 0.4, fy + h * 0.4, fx, fy);
    ctx.quadraticCurveTo(fx + w * 0.4, fy + h * 0.4, fx, fy + h);
    ctx.fillStyle = `rgba(255, ${120 + seeded(i) * 80}, 30, ${0.45 + (1 - phase) * 0.35})`;
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(x, y, r + 3, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255, 140, 40, 0.55)";
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();
}

/** Talho físico — diagonal branca por ~1s. */
function drawSlashCastFx(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  t: number
): void {
  const fade = 1 - t;
  const width = 2 + (1 - t) * 3;
  const inset = r * 0.15;
  const x1 = x - r + inset;
  const y1 = y - r + inset;
  const x2 = x + r - inset;
  const y2 = y + r - inset;

  ctx.save();
  ctx.globalAlpha = fade;
  ctx.strokeStyle = "rgba(255, 248, 240, 0.95)";
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.shadowColor = "rgba(255, 80, 60, 0.8)";
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(220, 60, 50, 0.55)";
  ctx.lineWidth = width + 1.5;
  ctx.globalAlpha = fade * 0.45;
  ctx.beginPath();
  ctx.moveTo(x1 + 2, y1 - 1);
  ctx.lineTo(x2 + 2, y2 - 1);
  ctx.stroke();
  ctx.restore();
}

/** Buff aliado — brilhos dourados por ~3s. */
function drawBuffCastFx(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  t: number
): void {
  const fade = t < 0.85 ? 1 : 1 - (t - 0.85) / 0.15;
  ctx.save();
  ctx.globalAlpha = fade;

  for (let i = 0; i < 8; i++) {
    const phase = (t * 1.2 + i * 0.14) % 1;
    const angle = seeded(i * 2.9) * Math.PI * 2 + t * 0.8;
    const dist = r * (0.5 + phase * 0.55);
    const px = x + Math.cos(angle) * dist;
    const py = y + Math.sin(angle) * dist * 0.6 - phase * r * 0.35;
    ctx.beginPath();
    ctx.arc(px, py, 2 + seeded(i) * 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 210, 80, ${0.4 + (1 - phase) * 0.45})`;
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(x, y, r + 5, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(201, 169, 98, ${0.35 + Math.sin(t * Math.PI * 3) * 0.15})`;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

export function drawTokenCastFx(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  kind: TokenCastFxKind,
  elapsedMs: number,
  durationMs: number
): void {
  const t = Math.min(1, Math.max(0, elapsedMs / durationMs));
  switch (kind) {
    case "heal":
      drawHealCastFx(ctx, x, y, r, t);
      break;
    case "fire":
      drawFireCastFx(ctx, x, y, r, t);
      break;
    case "slash":
      drawSlashCastFx(ctx, x, y, r, t);
      break;
    case "buff":
      drawBuffCastFx(ctx, x, y, r, t);
      break;
  }
}

export function pruneActiveCastFx(
  effects: ActiveTokenCastFx[],
  now = Date.now()
): ActiveTokenCastFx[] {
  return effects.filter((fx) => now - fx.startedAt < fx.durationMs);
}
