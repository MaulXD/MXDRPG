/** Nomes antigos (culinários) → nomes atuais (masmorra/sobrevivência). */

export const LEGACY_RACE_NAMES: Record<string, string> = {
  Pequenino: "Pequenino",
};

export function migrateRaceName(name: string | null | undefined): string | null | undefined {
  if (!name) return name;
  return LEGACY_RACE_NAMES[name] ?? name;
}

export const LEGACY_CLASS_NAMES: Record<string, string> = {
  Artífice: "Feiticeiro",
};

export const LEGACY_SUBCLASS_NAMES: Record<string, string> = {
  "Predador Voraz": "Caçador de Feras",
  "Quebra-Cascos": "Quebrador de Carapaças",
  "Guerreiro das Profundezas": "Sentinela das Profundezas",
  "Forrageiro dos Esporos": "Explorador de Esporos",
  "Rastreador de Sangue Frio": "Rastreador de Escamas",
  "Guia de Enxame": "Mestre de Enxame",
  "Degustador de Sombras": "Sombra Etérea",
  "Extrator de Geleias": "Forma Amorfa",
  "Ladrão de Glândulas": "Assassino Venenoso",
  "Piromante de Forno": "Piromante das Brasas",
  "Criomante de Conservação": "Criomante do Gelo",
  "Mago Fermentador": "Mago Alquímico",
  "Alquimista de Caldos": "Alquimista Ácido",
  "Mago Confeiteiro": "Mago dos Encantos",
  "Clérigo do Pão da Vida": "Clérigo do Sustento",
  "Devorador de Corações": "Devorador de Essência",
  "Ruminante das Neves": "Colosso do Gelo",
  "Frenético do Açúcar": "Berserker Veloz",
  "Sommelier de Masmorra": "Estratega de Masmorra",
  "Bardo Cervejeiro": "Bardo Fermentador",
  "Dançarino das Facas": "Dançarino das Lâminas",
  "Cantor das Especiarias": "Cantor dos Venenos",
  "Círculo da Decomposição": "Círculo da Podridão",
  "Círculo do Superpredador": "Círculo do Predador",
  "Círculo do Solo Vivo": "Círculo da Terra",
  "Monge Ascético": "Clérigo Contemplativo",
  "Ferreiro de Utensílios": "Linhagem Bestial",
  "Engenheiro de Fogareiros": "Chama Inata",
  "Biólogo Alquímico": "Sangue Selvagem",
  "Construtor de Armadilhas": "Eco Abissal",
  "Linhagem Dracônica": "Linhagem Bestial",
  "Ferreiro de Campo": "Linhagem Bestial",
  "Engenheiro de Explosivos": "Chama Inata",
  "Biólogo de Masmorra": "Sangue Selvagem",
};

export function migrateClassName(name: string | null | undefined): string | null | undefined {
  if (!name) return name;
  return LEGACY_CLASS_NAMES[name] ?? name;
}

export const LEGACY_SPELL_NAMES: Record<string, string> = {
  "Chama de Fogareiro": "Brasa Espectral",
  "Detectar Veneno": "Sentir Toxina",
  "Mãos Firmes": "Mãos Estáveis",
  "Extração Amplificada": "Marca da Caçada",
  "Inspiração Culinária": "Ímpeto Inspirador",
  "Gelo de Conservação": "Couraça de Gelo",
  "Identificar Ingrediente": "— (removida; use Anatomia/Forrageio)",
  "Aprimoramento Biomágico": "— (removida; Gourmet +1 assimilação)",
  "Preservação Perfeita": "— (item: Frasco de Estase)",
  "Preservação Anual": "— (item: Frasco de Estase Maior)",
  "Calor de Panela": "— (removida; Kit de Brasas / Cap. 5.2.1)",
};

export function migrateSpellName(name: string | null | undefined): string | null | undefined {
  if (!name) return name;
  return LEGACY_SPELL_NAMES[name] ?? name;
}

export function migrateSubclassName(name: string | null | undefined): string | null | undefined {
  if (!name) return name;
  return LEGACY_SUBCLASS_NAMES[name] ?? name;
}
