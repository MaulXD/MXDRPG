import type { ChatMessage } from "@/lib/room/chat";

/** Nome por extenso do atributo (chave = sigla na ficha). */
export const SAVE_ATTRIBUTE_FULL: Record<string, string> = {
  FOR: "Força",
  DES: "Destreza",
  CON: "Constituição",
  INT: "Inteligência",
  SAB: "Sabedoria",
  CAR: "Carisma",
};

export function savingThrowAttributeFull(shortLabel: string): string {
  const key = shortLabel.trim().toUpperCase();
  return SAVE_ATTRIBUTE_FULL[key] ?? shortLabel.trim();
}

/** Salvaguarda pedida pelo mestre (painel GM), sem dano de magia. */
export function isGmSavingThrowCombat(
  c: NonNullable<ChatMessage["combat"]>
): boolean {
  if (c.gmSavingThrow) return true;
  return (
    c.resolution === "save" &&
    c.actionKind === "ability" &&
    (c.weaponName?.startsWith("Salvaguarda") ?? false) &&
    c.damageTotal == null &&
    !c.spellDamageType
  );
}

export type SavingThrowHeadline = {
  success?: boolean;
  /** Passou / Falhou — omitido se CD não foi definida. */
  verb: string | null;
  attributeShort: string;
  attributeFull: string;
  dc?: number;
};

export function savingThrowHeadline(
  c: NonNullable<ChatMessage["combat"]>
): SavingThrowHeadline | null {
  if (c.resolution !== "save") return null;
  const short = c.saveAttribute?.trim();
  if (!short) return null;

  const attributeFull = savingThrowAttributeFull(short);
  const dc = c.saveDc;
  const success = c.saveSuccess;

  if (dc != null && success !== undefined) {
    return {
      success,
      verb: success ? "Passou" : "Falhou",
      attributeShort: short,
      attributeFull,
      dc,
    };
  }

  if (isGmSavingThrowCombat(c)) {
    return {
      verb: null,
      attributeShort: short,
      attributeFull,
      dc,
    };
  }

  return null;
}
