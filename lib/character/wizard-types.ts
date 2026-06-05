import type { AttributeKey } from "@/lib/character/rules";
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
  pointBuy: Record<AttributeKey, number>;
  portraitUrl?: string | null;
  tokenImageUrl?: string | null;
  portraitFocus?: PortraitFocus | null;
  coverFocus?: PortraitFocus | null;
  tokenFocus?: PortraitFocus | null;
};

export const EMPTY_WIZARD_DRAFT: CharacterWizardDraft = {
  name: "",
  biography: "",
  raca: "Humano",
  linhagem: null,
  classe: "Guerreiro",
  antecedente: "Explorador",
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
};
