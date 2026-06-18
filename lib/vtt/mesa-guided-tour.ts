export type MesaTourMode = "spectator" | "player" | "gm";

export type MesaTourStep = {
  title: string;
  body: string;
};

const STORAGE_PREFIX = "eldarin-mesa-first-tour-v1";

const SPECTATOR_STEPS: MesaTourStep[] = [
  {
    title: "Bem-vindo à mesa",
    body:
      "Você entrou em modo espectador: vê o mapa, iniciativa e chat em tempo real, sem mover tokens nem falar no chat.",
  },
  {
    title: "Para jogar de verdade",
    body:
      "Peça ao mestre o link de jogador (sem “só assistir”) ou entre na conta e use o código em Suas mesas.",
  },
  {
    title: "Tour e ajuda",
    body:
      "Reabra este tour pelo botão Tour. O botão ? no mapa traz dicas da interface quando precisar.",
  },
];

const PLAYER_STEPS: MesaTourStep[] = [
  {
    title: "Painéis da esquerda",
    body:
      "Ícones na barra lateral abrem ficha, chat, dados e ordem de turno. Clique esquerdo abre popup; direito fixa no dock.",
  },
  {
    title: "Seu token no mapa",
    body:
      "Clique no seu personagem para selecionar. No combate, clique direito abre o anel de ações (ataque, magia, movimento).",
  },
  {
    title: "Passar turno",
    body:
      "Quando terminar suas ações, use Passar turno na barra inferior ou no celular (ícone Turno). PA não gastos podem acumular até o limite da ficha.",
  },
  {
    title: "Chat e dados",
    body:
      "Chat e rolador ficam nos ícones verdes e roxos. Rolagens aparecem para todos na mesa.",
  },
  {
    title: "Delegar controle",
    body:
      "Ausente? Abra Status do seu token e escolha outro jogador para pilotar seu personagem até você voltar.",
  },
];

const GM_STEPS: MesaTourStep[] = [
  {
    title: "Convidar jogadores",
    body:
      "Use o painel Convite no topo: código, link de jogador e link “só assistir” para stream ou amigos que chegam tarde.",
  },
  {
    title: "Combate e iniciativa",
    body:
      "Ative modo combate, abra Turno e role iniciativa. Monstros entram pelo compêndio (arrastar para o mapa).",
  },
  {
    title: "Visão jogador",
    body:
      "O botão Visão jogador simula o que os jogadores veem — útil para conferir fog, tokens e HUD.",
  },
  {
    title: "Aprovações",
    body:
      "Pedidos de ficha e consumíveis aparecem no sino no canto do mapa. Aprove ou recuse antes do item entrar na mochila.",
  },
  {
    title: "Mobile na mesa",
    body:
      "No celular, a barra inferior traz chat, iniciativa, passar turno e dados — jogador no sofá continua na sessão.",
  },
];

export function getMesaTourMode(
  session: { id: string } | null | undefined,
  isRoomGm: boolean,
  watchOnly: boolean
): MesaTourMode {
  if (watchOnly || !session) return "spectator";
  if (isRoomGm) return "gm";
  return "player";
}

export function getMesaTourSteps(mode: MesaTourMode): MesaTourStep[] {
  switch (mode) {
    case "spectator":
      return SPECTATOR_STEPS;
    case "player":
      return PLAYER_STEPS;
    case "gm":
      return GM_STEPS;
  }
}

function storageKey(userId: string | null | undefined): string {
  return userId ? `${STORAGE_PREFIX}:${userId}` : STORAGE_PREFIX;
}

export function isMesaTourCompleted(userId?: string | null): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(storageKey(userId)) === "1";
  } catch {
    return true;
  }
}

export function markMesaTourCompleted(userId?: string | null): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(userId), "1");
  } catch {
    /* ignore */
  }
}

export function resetMesaTour(userId?: string | null): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(storageKey(userId));
  } catch {
    /* ignore */
  }
}
