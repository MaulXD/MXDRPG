/**
 * Filtro de nomes exibidos (personagens, mesas) — palavrões e evasões comuns.
 * Usável no cliente (wizard) e no servidor (API / store).
 */

const BLOCKED_WORDS = [
  "caralho",
  "caralhu",
  "porra",
  "merda",
  "puta",
  "puto",
  "putaria",
  "buceta",
  "boceta",
  "xoxota",
  "cacete",
  "foder",
  "fodase",
  "foda-se",
  "vsf",
  "pqp",
  "krl",
  "krlh",
  "pau",
  "pauzao",
  "rola",
  "roludo",
  "cu",
  "cuzao",
  "arrombado",
  "pentelho",
  "punheta",
  "siririca",
  "vtnc",
  "fds",
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "dick",
  "pussy",
  "cock",
  "cunt",
] as const;

const BLOCKED_PHRASES = [
  "minha rola",
  "sua rola",
  "vai tomar",
  "toma no",
  "filho da puta",
  "filha da puta",
  "filho daputa",
  "filha daputa",
  "tomar no cu",
  "no cu",
  "vai se foder",
  "va se foder",
] as const;

/** Normaliza para comparação (acentos, leetspeak, espaços). */
export function normalizeForModeration(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[@]/g, "a")
    .replace(/[0]/g, "o")
    .replace(/[1!|]/g, "i")
    .replace(/[3]/g, "e")
    .replace(/[4]/g, "a")
    .replace(/[5$]/g, "s")
    .replace(/[7]/g, "t")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokensFromNormalized(norm: string): string[] {
  return norm.split(/[^a-z0-9]+/).filter(Boolean);
}

/** Detecta termos bloqueados (palavras inteiras, frases ou evasão sem espaços). */
export function containsProfanity(input: string): boolean {
  const norm = normalizeForModeration(input);
  if (!norm) return false;

  const compact = norm.replace(/\s+/g, "");
  const tokens = tokensFromNormalized(norm);

  for (const phrase of BLOCKED_PHRASES) {
    const phraseCompact = phrase.replace(/\s+/g, "");
    if (norm.includes(phrase) || compact.includes(phraseCompact)) return true;
  }

  for (const word of BLOCKED_WORDS) {
    if (tokens.includes(word)) return true;
    if (word.length >= 5 && compact.includes(word)) return true;
  }

  return false;
}

export type DisplayNameValidation =
  | { ok: true; name: string }
  | { ok: false; error: string };

export function validateDisplayName(raw: string): DisplayNameValidation {
  const name = raw.trim().replace(/\s+/g, " ");
  if (!name) return { ok: false, error: "Nome obrigatório" };
  if (name.length < 2) return { ok: false, error: "Nome precisa de pelo menos 2 caracteres" };
  if (name.length > 80) return { ok: false, error: "Nome muito longo (máx 80)" };
  if (containsProfanity(name)) {
    return {
      ok: false,
      error: "Este nome não é permitido. Evite palavrões e termos ofensivos.",
    };
  }
  return { ok: true, name };
}

/** Renomeia títulos legados conhecidos (dados já salvos). */
export function migrateLegacyDisplayName(name: string): string {
  const norm = normalizeForModeration(name);
  const compact = norm.replace(/\s+/g, "");
  if (norm === "minha rola" || compact === "minharola") return "Minha paz";
  return name.trim();
}
