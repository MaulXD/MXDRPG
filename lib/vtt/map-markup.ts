import type { SessionUser } from "@/lib/auth/types";
import { canManageAllMapMarkups, mapMarkupAuthorId } from "@/lib/auth/room-access";
import type { RoomState } from "@/lib/room/types";
import type { MapMarkup, MapMarkupDurability, MapMarkupKind } from "@/lib/vtt/types";

export const TEMP_MARKUP_DURATION_MS = 30 * 60 * 1000;
export const MAX_MAP_MARKUPS = 240;
export const MAX_MARKUP_POINTS = 600;

export const MARKUP_COLORS = [
  "#e74c3c",
  "#f39c12",
  "#2ecc71",
  "#3498db",
  "#9b59b6",
  "#ecf0f1",
  "#1abc9c",
] as const;

export const MARKUP_WIDTHS = [2, 4, 6] as const;

/** Ferramentas da lousa (modelo Roll20: seleção, traço livre, formas, linha/polígono, texto). */
export type WhiteboardTool =
  | "select"
  | "pen"
  | "shape"
  | "line"
  | "polygon"
  | "text";

export function newMapMarkupId(): string {
  return `mk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function mapMarkupsOf(scene: { mapMarkups?: MapMarkup[] }): MapMarkup[] {
  return scene.mapMarkups ?? [];
}

export function pruneMapMarkups(markups: MapMarkup[], now = Date.now()): MapMarkup[] {
  return markups.filter((m) => {
    if (m.durability === "permanent") return true;
    const exp = m.expiresAt ?? m.createdAt + TEMP_MARKUP_DURATION_MS;
    return now < exp;
  });
}

function clampPoints(points: { x: number; y: number }[]): { x: number; y: number }[] {
  if (points.length <= MAX_MARKUP_POINTS) return points;
  const step = Math.ceil(points.length / MAX_MARKUP_POINTS);
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < points.length; i += step) out.push(points[i]!);
  if (out[out.length - 1] !== points[points.length - 1]) {
    out.push(points[points.length - 1]!);
  }
  return out;
}

export function sanitizeMapMarkups(raw: unknown): MapMarkup[] {
  if (!Array.isArray(raw)) return [];
  const kinds: MapMarkupKind[] = [
    "freehand",
    "line",
    "rect",
    "circle",
    "arrow",
    "polygon",
    "text",
  ];
  const out: MapMarkup[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const m = item as Partial<MapMarkup>;
    if (typeof m.id !== "string" || !m.id.trim()) continue;
    if (!kinds.includes(m.kind as MapMarkupKind)) continue;
    if (m.durability !== "temporary" && m.durability !== "permanent") continue;
    if (typeof m.color !== "string" || !/^#[0-9a-fA-F]{3,8}$/.test(m.color)) continue;
    const width = typeof m.width === "number" ? Math.min(12, Math.max(1, m.width)) : 3;
    if (!Array.isArray(m.points) || m.points.length === 0) continue;
    const points = m.points
      .filter((p) => p && typeof p.x === "number" && typeof p.y === "number")
      .map((p) => ({ x: p.x, y: p.y }));
    if (points.length === 0) continue;
    const createdAt = typeof m.createdAt === "number" ? m.createdAt : Date.now();
    const durability = m.durability as MapMarkupDurability;
    out.push({
      id: m.id.slice(0, 64),
      kind: m.kind as MapMarkupKind,
      durability,
      color: m.color,
      width,
      points: clampPoints(points),
      text: typeof m.text === "string" ? m.text.slice(0, 120) : undefined,
      author: typeof m.author === "string" ? m.author.slice(0, 64) : "mestre",
      createdAt,
      expiresAt:
        durability === "temporary"
          ? typeof m.expiresAt === "number"
            ? m.expiresAt
            : createdAt + TEMP_MARKUP_DURATION_MS
          : undefined,
    });
    if (out.length >= MAX_MAP_MARKUPS) break;
  }
  return pruneMapMarkups(out);
}

export function createMapMarkup(input: {
  kind: MapMarkupKind;
  durability: MapMarkupDurability;
  color: string;
  width: number;
  points: { x: number; y: number }[];
  text?: string;
  author: string;
}): MapMarkup {
  const createdAt = Date.now();
  return {
    id: newMapMarkupId(),
    kind: input.kind,
    durability: input.durability,
    color: input.color,
    width: input.width,
    points: clampPoints(input.points),
    text: input.text,
    author: input.author,
    createdAt,
    expiresAt:
      input.durability === "temporary" ? createdAt + TEMP_MARKUP_DURATION_MS : undefined,
  };
}

export function appendMapMarkup(markups: MapMarkup[], markup: MapMarkup): MapMarkup[] {
  const next = pruneMapMarkups([...markups, markup]);
  if (next.length <= MAX_MAP_MARKUPS) return next;
  return next.slice(next.length - MAX_MAP_MARKUPS);
}

export function removeMapMarkup(markups: MapMarkup[], id: string): MapMarkup[] {
  return markups.filter((m) => m.id !== id);
}

export function moveMapMarkup(
  markups: MapMarkup[],
  id: string,
  dx: number,
  dy: number
): MapMarkup[] {
  return markups.map((m) =>
    m.id === id
      ? { ...m, points: m.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) }
      : m
  );
}

function distPointSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-6) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function markupHitRadius(markup: MapMarkup): number {
  return Math.max(8, markup.width * 3);
}

export function hitTestMapMarkup(
  markups: MapMarkup[],
  wx: number,
  wy: number
): MapMarkup | null {
  for (let i = markups.length - 1; i >= 0; i--) {
    const m = markups[i]!;
    const tol = markupHitRadius(m);
    if (m.kind === "circle" && m.points.length >= 2) {
      const c = m.points[0]!;
      const e = m.points[1]!;
      const r = Math.hypot(e.x - c.x, e.y - c.y);
      const d = Math.hypot(wx - c.x, wy - c.y);
      if (Math.abs(d - r) <= tol || d <= r) return m;
      continue;
    }
    if (m.kind === "rect" && m.points.length >= 2) {
      const a = m.points[0]!;
      const b = m.points[1]!;
      const minX = Math.min(a.x, b.x) - tol;
      const maxX = Math.max(a.x, b.x) + tol;
      const minY = Math.min(a.y, b.y) - tol;
      const maxY = Math.max(a.y, b.y) + tol;
      if (wx >= minX && wx <= maxX && wy >= minY && wy <= maxY) return m;
      continue;
    }
    if (m.kind === "polygon" && m.points.length >= 2) {
      const poly = m.points;
      for (let j = 1; j < poly.length; j++) {
        const a = poly[j - 1]!;
        const b = poly[j]!;
        if (distPointSegment(wx, wy, a.x, a.y, b.x, b.y) <= tol) return m;
      }
      if (poly.length >= 3) {
        const a = poly[poly.length - 1]!;
        const b = poly[0]!;
        if (distPointSegment(wx, wy, a.x, a.y, b.x, b.y) <= tol) return m;
      }
      continue;
    }
    if (m.kind === "text" && m.points[0]) {
      const p = m.points[0];
      const w = Math.max(40, (m.text?.length ?? 4) * 7);
      const h = 22;
      if (wx >= p.x - tol && wx <= p.x + w + tol && wy >= p.y - h && wy <= p.y + tol) {
        return m;
      }
      continue;
    }
    const pts = m.points;
    for (let j = 1; j < pts.length; j++) {
      const a = pts[j - 1]!;
      const b = pts[j]!;
      if (distPointSegment(wx, wy, a.x, a.y, b.x, b.y) <= tol) return m;
    }
    if (pts.length === 1) {
      const p = pts[0]!;
      if (Math.hypot(wx - p.x, wy - p.y) <= tol) return m;
    }
  }
  return null;
}

/** Valida alteração da lousa por jogador (não pode apagar permanente alheio). */
export function validatePlayerMarkupPatch(
  before: MapMarkup[],
  after: MapMarkup[],
  user: SessionUser | null,
  room: Pick<RoomState, "ownerId">
): boolean {
  if (canManageAllMapMarkups(room, user)) return true;
  const author = mapMarkupAuthorId(user);
  const prev = pruneMapMarkups(before);
  const next = sanitizeMapMarkups(after);

  for (const old of prev) {
    const still = next.find((m) => m.id === old.id);
    if (!still) {
      if (old.author !== author && old.author !== user?.name && old.author !== user?.email) {
        return false;
      }
      if (old.durability === "permanent" && old.author !== author) return false;
    }
  }

  for (const m of next) {
    const existed = prev.find((p) => p.id === m.id);
    if (!existed && m.author !== author) return false;
    if (existed && existed.author !== author && m.author !== author) return false;
  }

  return true;
}

export function markupOpacity(markup: MapMarkup, now = Date.now()): number {
  if (markup.durability === "permanent") return 1;
  const exp = markup.expiresAt ?? markup.createdAt + TEMP_MARKUP_DURATION_MS;
  const remain = exp - now;
  if (remain <= 0) return 0;
  const fadeStart = TEMP_MARKUP_DURATION_MS * 0.15;
  if (remain > fadeStart) return 0.88;
  return 0.35 + (remain / fadeStart) * 0.53;
}
