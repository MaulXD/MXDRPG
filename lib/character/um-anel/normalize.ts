import { computeDerivedStats, computeLoad, shieldParryBonus } from "./rules";
import type { TorCharacterSheet } from "./types";

/** Preenche defaults em fichas legadas/parciais — mesmo padrão de lib/character/normalize.ts. */
export function normalizeTorCharacter(raw: TorCharacterSheet): TorCharacterSheet {
  const derived = computeDerivedStats(raw.culture, raw.attributes);
  const enduranceMax = raw.endurance?.max ?? derived.enduranceMax;
  const hopeMax = raw.hope?.max ?? derived.hopeMax;
  const endurance = {
    max: enduranceMax,
    value: Math.min(raw.endurance?.value ?? enduranceMax, enduranceMax),
  };
  const hope = {
    max: hopeMax,
    value: Math.min(raw.hope?.value ?? hopeMax, hopeMax),
  };
  const warGear = raw.warGear ?? [];
  const armour = raw.armour ?? { armourId: null, helm: false, shieldId: null };
  const load = computeLoad(warGear, armour, raw.culture);
  const shadow = raw.shadow ?? 0;
  // Cicatrizes e Fadiga entram nas condições derivadas abaixo — ver comentário lá.
  const shadowScars = raw.shadowScars ?? 0;
  const fatigue = raw.fatigue ?? 0;

  return {
    ...raw,
    system: "um-anel",
    campaignRoomId: raw.campaignRoomId ?? null,
    adventureId: raw.adventureId ?? null,
    endurance,
    hope,
    shadow,
    // Explícitos, não só via `...raw`: ficha legada pode não ter os campos, e
    // `undefined` aqui quebraria as condições derivadas abaixo (NaN silencioso).
    shadowScars,
    fatigue,
    parry: raw.parry ?? derived.parry,
    // DERIVADO do escudo equipado, não persistido. A Carga já é recalculada
    // acima a partir de `armour`; deixar o bônus de escudo como valor guardado
    // criava duas fontes de verdade que divergem no momento em que o herói troca
    // de escudo: só a criação escrevia este campo, então o Bloqueio ficava com o
    // bônus do escudo ANTIGO. Livro: Broquel +1, Escudo +2, Grande Escudo +3.
    shieldParryBonus: shieldParryBonus(armour.shieldId),
    conditions: {
      // Exausto/Arrasado são derivados das regras — não ficam a cargo de um
      // toggle manual. Ferido continua manual (evento de jogo).
      //
      // Exausto: Resistência ≤ Carga TOTAL, e a Fadiga soma à Carga
      // ("Fatigue points temporarily raise a hero's total Load" —
      // 04-caracteristicas.md). Antes comparava só com a Carga do equipamento,
      // então um herói arrasado de Fadiga no fim de uma jornada não ficava
      // Exausto — exatamente o efeito que a Fadiga existe para produzir.
      weary: endurance.value <= load + fatigue,
      // Arrasado: Cicatriz de Sombra conta como ponto normal para todos os
      // efeitos (SOM-R06), então entra na comparação. Antes ficava de fora, e
      // quem trocou Sombra por Cicatriz em "Endurecer a Vontade" saía de
      // Arrasado sem ter melhorado de verdade.
      miserable: shadow + shadowScars >= hope.value,
      wounded: raw.conditions?.wounded ?? false,
    },
    warGear,
    armour,
    usefulItems: raw.usefulItems ?? [],
    distinctiveFeatures: raw.distinctiveFeatures ?? [],
    rewards: raw.rewards ?? [],
    virtues: raw.virtues ?? [],
    load,
  };
}
