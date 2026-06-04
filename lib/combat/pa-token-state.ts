import { PA_ACCUMULATION_CAP_DEFAULT } from "@/lib/combat/pa-economy";
import type { BattleToken } from "@/lib/vtt/types";

/** Corrige PA incoerentes após sync ou estados legados (sem cortar PA ganhos no turno). */
export function normalizeTokenPaFields(
  token: BattleToken,
  paMax: number,
  accumulationCap = PA_ACCUMULATION_CAP_DEFAULT
): { pa: number; bankedPa: number; paMax: number } {
  let pa = Math.max(0, (token.pa ?? 0) + (token.bankedPa ?? 0));
  if (token.bankedPa) {
    pa = Math.min(accumulationCap, pa);
  }
  return { pa, bankedPa: 0, paMax };
}
