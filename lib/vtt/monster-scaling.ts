import type { MonsterTemplate } from "@/lib/vtt/monsters";

/** Variante de spawn na mesa (Cap. XII — Elite / Colossal simplificado). */
export type MonsterSpawnVariant = "normal" | "elite" | "colossal";

export type MonsterSpawnOptions = {
  variant?: MonsterSpawnVariant;
  /**
   * Ajuste de nível de ameaça do grupo (Cap. XII).
   * Simplificado: soma ao `ameaca`, escala HP/PA e bônus de ataque das ações.
   */
  groupLevelDelta?: number;
};

function scaleHp(base: number, factor: number): number {
  return Math.max(1, Math.round(base * factor));
}

function scaleActions(
  template: MonsterTemplate,
  ameaca: number
): MonsterTemplate["actions"] {
  const bonus = ameaca >= 4 ? 2 : ameaca >= 2 ? 1 : 0;
  return template.actions.map((a) => ({
    ...a,
    attackBonus: (a.attackBonus ?? 0) + bonus,
  }));
}

/**
 * Aplica Elite (+HP/PA/dano), Colossal (×2 HP, +PA) e delta de ameaça de grupo.
 * Valores alinhados ao espírito Cap. XII; tabela completa fica no livro.
 */
export function applyMonsterSpawnScaling(
  template: MonsterTemplate,
  options: MonsterSpawnOptions = {}
): MonsterTemplate {
  const variant = options.variant ?? "normal";
  const delta = Math.max(0, Math.min(6, options.groupLevelDelta ?? 0));
  let ameaca = template.ameaca + delta;
  let hpFactor = 1 + delta * 0.15;
  let paBonus = delta >= 2 ? 1 : 0;

  if (variant === "elite") {
    hpFactor *= 1.5;
    paBonus += 1;
    ameaca += 1;
  } else if (variant === "colossal") {
    hpFactor *= 2;
    paBonus += 2;
    ameaca += 2;
  }

  const vidaMax = scaleHp(template.vidaMax, hpFactor);
  const paMax = template.paMax + paBonus;

  const nameSuffix =
    variant === "elite" ? " (Elite)" : variant === "colossal" ? " (Colossal)" : "";

  return {
    ...template,
    name: `${template.name}${nameSuffix}`,
    ameaca,
    vida: vidaMax,
    vidaMax,
    pa: paMax,
    paMax,
    actions: scaleActions(template, ameaca),
  };
}
