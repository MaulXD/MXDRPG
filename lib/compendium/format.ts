export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** Tags que a descrição do compêndio pode usar. Qualquer outra tag some; atributos somem sempre. */
const COMPENDIUM_HTML_TAGS = new Set([
  "p", "strong", "em", "ul", "ol", "li", "br", "h3", "h4",
  "table", "thead", "tbody", "tr", "th", "td", "code",
]);

/**
 * A-22: sanitiza a descrição antes de dangerouslySetInnerHTML.
 * Remove blocos perigosos com conteúdo, mantém só a lista branca de tags sem atributos
 * e escapa qualquer "<" que não forme uma tag completa.
 */
export function sanitizeCompendiumHtml(html: string): string {
  return html
    .replace(/<(script|style|iframe|object|embed|svg|math|noscript|template)\b[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)(?:\s[^<>]*)?\/?>|</g, (_token, slash: string | undefined, name: string | undefined) => {
      if (name === undefined) return "&lt;";
      const tag = name.toLowerCase();
      return COMPENDIUM_HTML_TAGS.has(tag) ? `<${slash ?? ""}${tag}>` : "";
    });
}

export type EntryBookRef = {
  catalogId?: string;
  bookRef?: string;
};

export function entryDescriptionHtml(system: Record<string, unknown>): string {
  return String(system.description ?? "").trim();
}

/** Referência canônica (ID do livro + opcional capítulo). */
export function entryBookRef(system: Record<string, unknown>): EntryBookRef {
  const catalogId = system.catalogId != null ? String(system.catalogId) : undefined;
  const bookRef = system.bookRef != null ? String(system.bookRef) : undefined;
  return { catalogId, bookRef };
}

export function slugId(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type Tactical = { alcanceCells?: { value?: number }; custoPontosAcao?: { value?: number } };
type Weapon = { dano?: { formula?: string; tipo?: string }; ataque?: { bonus?: number } };
type Ability = { tipo?: string; recarga?: string };
type Spell = { nivel?: number; escola?: string; tempo?: string; alcance?: string };
type ActorResources = { vida?: { value?: number; max?: number }; pontosAcao?: { value?: number; max?: number } };

/** Texto para tooltip/hover em fichas e wizard (sem HTML). */
export function entryTooltipText(
  system: Record<string, unknown>,
  type: string,
  fallbackName?: string
): string {
  const desc = stripHtml(entryDescriptionHtml(system));
  const meta = entrySummary(system, type).join(" · ");
  if (desc && meta) return `${desc}\n\n${meta}`;
  if (desc) return desc;
  if (meta) return meta;
  return fallbackName?.trim() || "";
}

export function entrySummary(system: Record<string, unknown>, type: string): string[] {
  const lines: string[] = [];
  const tactical = system.tactical as Tactical | undefined;

  if (tactical?.alcanceCells?.value != null) {
    lines.push(`Alcance ${tactical.alcanceCells.value} cél.`);
  }
  if (tactical?.custoPontosAcao?.value != null) {
    lines.push(`PA ${tactical.custoPontosAcao.value}`);
  }

  const weapon = system.weapon as Weapon | undefined;
  if (weapon?.dano?.formula) {
    const tipo = weapon.dano.tipo ? ` ${weapon.dano.tipo}` : "";
    const enchant = typeof system.enchant === "number" && system.enchant > 0 ? `+${system.enchant}` : "";
    lines.push(`Dano ${weapon.dano.formula}${enchant}${tipo}`);
  }
  if (weapon?.ataque?.bonus != null && weapon.ataque.bonus !== 0) {
    lines.push(`Ataque ${weapon.ataque.bonus >= 0 ? "+" : ""}${weapon.ataque.bonus}`);
  }

  const ability = system.ability as Ability | undefined;
  if (ability?.tipo) lines.push(ability.tipo);
  if (ability?.recarga) lines.push(ability.recarga);

  const spell = system.spell as Spell | undefined;
  if (spell?.nivel != null) lines.push(`Nv ${spell.nivel}`);
  if (spell?.escola) lines.push(spell.escola);

  const resources = system.resources as ActorResources | undefined;
  if (resources?.vida?.max != null) lines.push(`Vida ${resources.vida.max}`);
  if (resources?.pontosAcao?.max != null) lines.push(`PA ${resources.pontosAcao.max}`);

  const attrs = system.attributes as Record<string, { value?: number }> | undefined;
  if (type === "npc" && attrs) {
    const forca = attrs.forca?.value;
    const agi = attrs.agilidade?.value;
    if (forca != null && agi != null) lines.push(`FOR ${forca} · AGI ${agi}`);
  }

  return lines;
}
