export type DemoTourMode = "visitor" | "player" | "gm";

export type DemoTourStep = {
  title: string;
  body: string;
};

const STORAGE_KEY = "eldarin-demo-guided-tour-v1";

const VISITOR_STEPS: DemoTourStep[] = [
  {
    title: "Bem-vindo à mesa demo",
    body:
      "Esta é a sala pública do Eldarin VTT — mapa hexagonal, tokens, combate por PA e fichas de personagem. Use este tour para conhecer o fluxo de consumíveis.",
  },
  {
    title: "Modo visitante",
    body:
      "Sem conta você joga como visitante: pode mover o Aventureiro no mapa, mas sem chat nem solicitações de inventário. Explore à vontade antes de entrar.",
  },
  {
    title: "Conta para o fluxo completo",
    body:
      "Para pedir consumíveis, ver o sino de aprovação e usar itens em combate, entre na sua conta. Em desenvolvimento local: na tela de login use os botões Demo Jogador ou Demo Mestre (senha 123).",
  },
];

const PLAYER_STEPS: DemoTourStep[] = [
  {
    title: "Abra sua ficha",
    body:
      "Na coluna esquerda, clique no ícone Ficha (clique esquerdo abre popup; direito fixa na barra lateral). Escolha seu personagem na lista.",
  },
  {
    title: "Inventário → + Consumível",
    body:
      "Na ficha, vá à aba Inventário e use + Consumível para pedir um item (poção, pergaminho, etc.). Descreva o que precisa — o mestre aprova antes de entrar na mochila.",
  },
  {
    title: "Aguardando aprovação",
    body:
      "Enquanto o mestre não aprovar, o item fica pendente. Um aviso aparece na própria ficha mostrando que a solicitação está em análise.",
  },
  {
    title: "Sino do frasco",
    body:
      "No canto superior direito do mapa, o ícone de frasco avisa quando o mestre aprovar ou recusar. Abra o painel para ver o resultado e dispensar a notificação.",
  },
  {
    title: "Consumível em combate",
    body:
      "No seu turno, clique direito no seu token no mapa para abrir o anel de ações. Escolha Consumível, selecione o item aprovado e confirme o alvo se necessário.",
  },
  {
    title: "Passar o turno",
    body:
      "Depois de usar o item (ou de suas outras ações), clique em Passar turno na barra inferior. PA não gastos podem acumular até o limite da ficha.",
  },
  {
    title: "Dúvidas na interface",
    body:
      "O botão ? no canto superior esquerdo do mapa abre dicas gerais da mesa (painéis, combate, mapa). Você pode reabrir este tour a qualquer momento pelo botão Tour.",
  },
];

const GM_STEPS: DemoTourStep[] = [
  {
    title: "Você é o mestre na demo",
    body:
      "Com a conta Demo Mestre você controla iniciativa, monstros e aprovações de inventário. Este tour cobre o fluxo de consumíveis dos jogadores.",
  },
  {
    title: "Sino com badge",
    body:
      "Quando um jogador pede um consumível, o sino no canto superior direito ganha um número. Abra para ver personagem, item pedido e motivo.",
  },
  {
    title: "Aprovar ou recusar",
    body:
      "Use Aprovar em cada pedido ou Aprovar todos para liberar de uma vez. Itens aprovados entram no inventário do personagem; recusados somem da fila.",
  },
  {
    title: "Jogador é notificado",
    body:
      "O jogador vê o frasco com badge quando você decide. Ele dispensa a notificação e encontra o item na ficha, pronto para usar em combate.",
  },
  {
    title: "Iniciativa e combate",
    body:
      "Abra o painel Turno e role iniciativa. No turno do jogador, ele usa clique direito no token → anel de ações → Consumível para gastar o item aprovado.",
  },
  {
    title: "Visão do jogador",
    body:
      "O botão Visão jogador no header simula a tela do jogador sem perder o controle de mestre — útil para conferir o que eles veem após aprovar itens.",
  },
  {
    title: "Tour e ajuda",
    body:
      "Reabra este tour pelo botão Tour. O ? no mapa traz o manual completo da mesa. Em produção, jogadores entram com conta Clerk; localmente use Demo Jogador (senha 123).",
  },
];

export function getDemoTourMode(
  session: { id: string } | null | undefined,
  isRoomGm: boolean
): DemoTourMode {
  if (!session) return "visitor";
  if (isRoomGm) return "gm";
  return "player";
}

export function getDemoTourSteps(mode: DemoTourMode): DemoTourStep[] {
  switch (mode) {
    case "visitor":
      return VISITOR_STEPS;
    case "player":
      return PLAYER_STEPS;
    case "gm":
      return GM_STEPS;
  }
}

export function isDemoTourCompleted(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

export function markDemoTourCompleted(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore quota / private mode */
  }
}

export function resetDemoTour(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
