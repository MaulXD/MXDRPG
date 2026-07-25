import type { BaseCharacterFields } from "@/lib/character/types";
import type { PortraitFocus } from "@/lib/media/portrait-focus";

/** Os três Atributos do Um Anel — Força, Coração, Astúcia. */
export type TorAttributeKey = "forca" | "coracao" | "argucia";

export type TorAttributes = Record<TorAttributeKey, number>;

/** As 18 Perícias, nomeadas em PT-BR (ver livros/um-anel/00-glossario-termos.md). */
export type TorSkillId =
  | "imponencia"
  | "atletismo"
  | "percepcao"
  | "caca"
  | "canto"
  | "oficio"
  | "encorajar"
  | "viajar"
  | "perspicacia"
  | "cura"
  | "cortesia"
  | "batalha"
  | "persuasao"
  | "furtividade"
  | "vasculhar"
  | "explorar"
  | "enigma"
  | "saber";

export type TorSkillRatings = Record<TorSkillId, number>;

/** As 4 Proficiências de Combate. */
export type TorCombatProficiencyId = "machados" | "arcos" | "lancas" | "espadas";

export type TorCombatProficiencyRatings = Record<TorCombatProficiencyId, number>;

export type TorCultureId =
  | "bardos"
  | "anoes"
  | "elfos"
  | "hobbits"
  | "homens-de-bri"
  | "rangers"
  | "altos-elfos-de-valfenda";

export type TorCallingId =
  | "capitao"
  | "campeao"
  | "mensageiro"
  | "erudito"
  | "cacador-de-tesouros"
  | "guardiao";

export type TorStandardOfLivingId =
  | "pobre"
  | "frugal"
  | "comum"
  | "prospero"
  | "rico"
  | "muito-rico";

export type TorWarGearItem = {
  instanceId: string;
  weaponId: string;
  /** Empunhadura escolhida, para armas que podem ser 1h ou 2h. */
  twoHanded?: boolean;
};

export type TorArmourLoadout = {
  armourId?: string | null;
  helm?: boolean;
  shieldId?: string | null;
};

/** Campos ajustáveis durante a sessão (Resistência/Esperança/Sombra/etc.) — ver
 * lib/character/um-anel/characters.ts::patchTorCharacterResources. */
export type TorResourcePatch = Partial<{
  enduranceValue: number;
  hopeValue: number;
  shadow: number;
  shadowScars: number;
  fatigue: number;
  wounded: boolean;
  /** Texto da Severidade da Ferida (ex.: "Ferimento Grave — 6 dias pra curar"). */
  injury: string;
  treasure: number;
  fellowship: number;
  /** Retrato/token — ver lib/character/portrait-persist-client.ts::persistPortraitBundleToTorCharacter. */
  portraitUrl: string | null;
  tokenImageUrl: string | null;
  portraitFocus: PortraitFocus | null;
  coverFocus: PortraitFocus | null;
  tokenFocus: PortraitFocus | null;
}>;

/**
 * Ficha do Um Anel (2ª ed.) — layout espelha a ficha oficial impressa (p.239),
 * ver livros/um-anel/13-apendice-patronos-e-ficha.md.
 */
export type TorCharacterSheet = BaseCharacterFields & {
  system: "um-anel";

  culture: TorCultureId;
  calling: TorCallingId;
  age: number | null;
  distinctiveFeatures: string[];
  flaws: string;
  standardOfLiving: TorStandardOfLivingId;
  patron: string | null;
  shadowPathId: string;
  heirName?: string | null;

  attributes: TorAttributes;
  /** Perícias marcadas como Favorecidas (cultura + vocação, até 3). */
  favouredSkills: TorSkillId[];
  skills: TorSkillRatings;
  combatProficiencies: TorCombatProficiencyRatings;

  endurance: { value: number; max: number };
  hope: { value: number; max: number };
  parry: number;
  shieldParryBonus: number;
  /** Carga total (Equipamento de Guerra + armadura/elmo/escudo) — recalculada em normalizeTorCharacter. */
  load: number;

  shadow: number;
  shadowScars: number;
  fatigue: number;
  conditions: { weary: boolean; miserable: boolean; wounded: boolean };
  injury: string;

  valour: number;
  wisdom: number;
  rewards: string[];
  virtues: string[];

  treasure: number;
  adventurePoints: number;
  skillPoints: number;
  fellowship: number;

  warGear: TorWarGearItem[];
  armour: TorArmourLoadout;
  travellingGear: string;
  usefulItems: string[];
};
