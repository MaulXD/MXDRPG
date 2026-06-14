import type { ClassId, RaceId } from "@/lib/character/rules";

export type WizardIconKind =
  | "race-humano"
  | "race-elfo"
  | "race-anao"
  | "race-halfling"
  | "race-gnomo"
  | "race-meio-humano"
  | "lineage-gato"
  | "lineage-cobra"
  | "lineage-urso"
  | "lineage-tigre"
  | "lineage-aguia"
  | "lineage-lobo"
  | "lineage-tubarao"
  | "lineage-corvo"
  | "class-guerreiro"
  | "class-patrulheiro"
  | "class-ladino"
  | "class-mago"
  | "class-clerigo"
  | "class-barbaro"
  | "class-bardo"
  | "class-druida"
  | "class-feiticeiro"
  | "class-espiritualista"
  | "class-paladino"
  | "class-bruxo"
  | "fallback";

export const WIZARD_ICON_PATHS: Record<WizardIconKind, string> = {
  "race-humano": "M12 4a3 3 0 110 6 3 3 0 010-6z M6 20v-2a6 6 0 0112 0v2",
  "race-elfo":
    "M12 3l1 3h-2l1-3z M12 7a3 3 0 100 6 3 3 0 000-6z M7 20c1-4 3-6 5-6s4 2 5 6 M9 11l-2 2 M15 11l2 2",
  "race-anao":
    "M8 8h8v3H8z M10 11v3 M14 11v3 M7 17h10 M12 5v3 M9 6l3-2 3 2",
  "race-halfling":
    "M12 5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z M8 20c0-3 2-5 4-5s4 2 4 5 M10 10h4 M11 8l1-2 1 2",
  "race-gnomo":
    "M10 5h4v2h-4z M9 7h6v10c0 2-1 3-3 3s-3-1-3-3V7z M11 11h2 M11 14h2",
  "race-meio-humano":
    "M12 5a3 3 0 100 6 3 3 0 000-6z M7 20v-1c0-3 2-5 5-5s5 2 5 5v1 M9 12l-1 2 M15 12l1 2",
  "lineage-gato": "M8 9l-2-3 2 1 2-2 2 2 2-1-2 3 M10 13a2 2 0 104 0",
  "lineage-cobra": "M6 16c4-6 8-6 12-10 M14 6l2 2-2 2 M8 18h8",
  "lineage-urso": "M8 9a2 2 0 104 0 2 2 0 00-4 0z M14 9a2 2 0 104 0 2 2 0 00-4 0z M12 12c-3 0-5 2-5 5v3h10v-3c0-3-2-5-5-5z",
  "lineage-tigre": "M8 8l-1-2 1 1 1-1 1 1 1-1 1 1-1 2 M9 13h6 M10 15h1 M13 15h1",
  "lineage-aguia": "M5 14c4-5 10-5 14-2 M12 8l-4 6h8z M16 7l2-2",
  "lineage-lobo": "M7 10a2 2 0 104 0 2 2 0 00-4 0z M15 10a2 2 0 104 0 2 2 0 00-4 0z M8 16c2 2 6 2 8 0 M10 13h4",
  "lineage-tubarao": "M4 14c4-4 10-4 16-1 M18 12l3 3-3 1z M8 14v2",
  "lineage-corvo": "M6 10c2-3 6-4 10-2 M14 8l4-2-1 3 M9 14h6",
  "class-guerreiro": "M12 3l2 2-7 7 1 5 5 1 7-7 2 2-9 9-6-1-1-6z",
  "class-patrulheiro": "M6 4c4 4 4 12 0 16 M18 4c-4 4-4 12 0 16 M12 6v12 M14 14l3 3",
  "class-ladino": "M14 4l-4 14h4 M10 18h4 M16 6l2 2",
  "class-mago": "M12 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z",
  "class-clerigo": "M12 4v16 M8 8h8 M12 8l-4 8h8z",
  "class-barbaro": "M6 18l4-10 8-2-2 8-10 4z",
  "class-bardo": "M9 18V8l8-2v10 M9 14h8",
  "class-druida": "M12 20V9 M8 12c0-4 2-7 4-8 2 1 4 4 4 8z M16 12c0-4-2-7-4-8-2 1-4 4-4 8z",
  "class-feiticeiro": "M12 2l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3-4-1 2-4z",
  "class-espiritualista": "M12 4c-2 0-4 2-4 5v3l-2 6h12l-2-6V9c0-3-2-5-4-5z",
  "class-paladino": "M12 3l-2 4h4l-2-4z M12 7v14 M8 11h8 M10 8h4",
  "class-bruxo": "M4 12s4-6 8-6 8 6 8 6-4 6-8 6-8-6-8-6z M12 12a2 2 0 100 4 2 2 0 000-4z",
  fallback: "M8 8h8v8H8z",
};

export const RACE_ICON_COLOR: Record<RaceId, string> = {
  Humano: "#c9a962",
  Elfo: "#6ec9a8",
  Anão: "#b87333",
  Halfling: "#8fbc6b",
  Gnomo: "#9b7ed9",
  "Meio-Humano": "#d4845a",
};

export const CLASS_ICON_COLOR: Record<ClassId, string> = {
  Guerreiro: "#e07050",
  Patrulheiro: "#5a9e6a",
  Ladino: "#7a8a9a",
  Mago: "#8b5cf6",
  Clérigo: "#f0d060",
  Bárbaro: "#c04040",
  Bardo: "#e88ca0",
  Druida: "#4a8a5a",
  Feiticeiro: "#c45ae8",
  Espiritualista: "#d4a574",
  Paladino: "#e8c040",
  Bruxo: "#6b2d8a",
};

const LINEAGE_ICON: Record<string, WizardIconKind> = {
  "Linhagem do Gato": "lineage-gato",
  "Linhagem da Cobra": "lineage-cobra",
  "Linhagem do Urso": "lineage-urso",
  "Linhagem do Tigre": "lineage-tigre",
  "Linhagem da Águia": "lineage-aguia",
  "Linhagem do Lobo": "lineage-lobo",
  "Linhagem do Tubarão": "lineage-tubarao",
  "Linhagem do Corvo": "lineage-corvo",
};

const RACE_ICON: Record<RaceId, WizardIconKind> = {
  Humano: "race-humano",
  Elfo: "race-elfo",
  Anão: "race-anao",
  Halfling: "race-halfling",
  Gnomo: "race-gnomo",
  "Meio-Humano": "race-meio-humano",
};

const CLASS_ICON: Record<ClassId, WizardIconKind> = {
  Guerreiro: "class-guerreiro",
  Patrulheiro: "class-patrulheiro",
  Ladino: "class-ladino",
  Mago: "class-mago",
  Clérigo: "class-clerigo",
  Bárbaro: "class-barbaro",
  Bardo: "class-bardo",
  Druida: "class-druida",
  Feiticeiro: "class-feiticeiro",
  Espiritualista: "class-espiritualista",
  Paladino: "class-paladino",
  Bruxo: "class-bruxo",
};

export function resolveRaceIcon(raceId: string): WizardIconKind {
  return RACE_ICON[raceId as RaceId] ?? "fallback";
}

export function resolveClassIcon(classId: string): WizardIconKind {
  return CLASS_ICON[classId as ClassId] ?? "fallback";
}

export function resolveLineageIcon(lineageId: string): WizardIconKind {
  return LINEAGE_ICON[lineageId] ?? "race-meio-humano";
}

export function raceIconColor(raceId: string): string {
  return RACE_ICON_COLOR[raceId as RaceId] ?? "#00f5ff";
}

export function classIconColor(classId: string): string {
  return CLASS_ICON_COLOR[classId as ClassId] ?? "#00f5ff";
}

export function lineageIconColor(lineageId: string): string {
  const hues: Record<string, string> = {
    "Linhagem do Gato": "#d4a85a",
    "Linhagem da Cobra": "#6a9e5a",
    "Linhagem do Urso": "#8b6914",
    "Linhagem do Tigre": "#e09030",
    "Linhagem da Águia": "#5a8ec9",
    "Linhagem do Lobo": "#7a8a9a",
    "Linhagem do Tubarão": "#4a7a9a",
    "Linhagem do Corvo": "#4a4a5a",
  };
  return hues[lineageId] ?? RACE_ICON_COLOR["Meio-Humano"];
}

export function wizardIconLabel(kind: WizardIconKind): string {
  const labels: Record<WizardIconKind, string> = {
    "race-humano": "Humano",
    "race-elfo": "Elfo",
    "race-anao": "Anão",
    "race-halfling": "Halfling",
    "race-gnomo": "Gnomo",
    "race-meio-humano": "Meio-humano",
    "lineage-gato": "Linhagem do Gato",
    "lineage-cobra": "Linhagem da Cobra",
    "lineage-urso": "Linhagem do Urso",
    "lineage-tigre": "Linhagem do Tigre",
    "lineage-aguia": "Linhagem da Águia",
    "lineage-lobo": "Linhagem do Lobo",
    "lineage-tubarao": "Linhagem do Tubarão",
    "lineage-corvo": "Linhagem do Corvo",
    "class-guerreiro": "Guerreiro",
    "class-patrulheiro": "Patrulheiro",
    "class-ladino": "Ladino",
    "class-mago": "Mago",
    "class-clerigo": "Clérigo",
    "class-barbaro": "Bárbaro",
    "class-bardo": "Bardo",
    "class-druida": "Druida",
    "class-feiticeiro": "Feiticeiro",
    "class-espiritualista": "Espiritualista",
    "class-paladino": "Paladino",
    "class-bruxo": "Bruxo",
    fallback: "Opção",
  };
  return labels[kind];
}
