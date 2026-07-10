import type { AttributeKey } from "@/lib/character/rules";
import {
  getDefaultStarterEquipment,
  getDefaultStarterKitId,
  type StarterEquipmentDraft,
} from "@/lib/character/starter-kits";
import type { PortraitFocus } from "@/lib/media/portrait-focus";

export const ANTECEDENTE_OPTIONS = [
  "Explorador",
  "Erudito",
  "Mercador",
  "Soldado",
  "Eremita",
  "Criminoso",
  "Nobre",
  "Órfão da Masmorra",
  "Aventureiro",
] as const;

export type CharacterWizardDraft = {
  name: string;
  biography: string;
  raca: string;
  linhagem: string | null;
  classe: string;
  antecedente: string;
  /** Preset de equipamento (último kit aplicado ou correspondente à montagem manual). */
  starterKitId: string;
  /** Arma, armadura, magias e extras montados no passo Equipamento. */
  starterEquipment: StarterEquipmentDraft;
  religiao: string;
  pointBuy: Record<AttributeKey, number>;
  portraitUrl?: string | null;
  tokenImageUrl?: string | null;
  portraitFocus?: PortraitFocus | null;
  coverFocus?: PortraitFocus | null;
  tokenFocus?: PortraitFocus | null;
  /** Perícia escolhida pelo antecedente Aventureiro ("Uma perícia à escolha"). */
  escolhaPericiaAntecedente?: string | null;
};

export const EMPTY_WIZARD_DRAFT: CharacterWizardDraft = {
  name: "",
  biography: "",
  raca: "Humano",
  linhagem: null,
  classe: "Guerreiro",
  antecedente: "Explorador",
  starterKitId: getDefaultStarterKitId("Guerreiro"),
  starterEquipment: getDefaultStarterEquipment("Guerreiro"),
  religiao: "sem-deus",
  pointBuy: {
    forca: 8,
    destreza: 8,
    constituicao: 8,
    inteligencia: 8,
    sabedoria: 8,
    carisma: 8,
  },
  portraitUrl: null,
  tokenImageUrl: null,
  portraitFocus: null,
  coverFocus: null,
  tokenFocus: null,
  escolhaPericiaAntecedente: null,
};
