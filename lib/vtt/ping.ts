import type { BattlePing } from "@/lib/vtt/types";

export const PING_DURATION_MS = 5500;
export const PING_MAX_ACTIVE = 16;

export function prunePings(pings: BattlePing[], now = Date.now()): BattlePing[] {
  return pings.filter((p) => now - p.at < PING_DURATION_MS);
}

export function createPing(
  q: number,
  r: number,
  author: string,
  color: string
): BattlePing {
  return {
    id: `ping-${nowId()}`,
    q,
    r,
    color,
    author,
    at: Date.now(),
  };
}

function nowId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
