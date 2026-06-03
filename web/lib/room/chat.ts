export type ChatMessage = {
  id: string;
  at: number;
  authorId: string;
  authorName: string;
  authorRole: "admin" | "mestre" | "jogador" | "guest";
  kind: "chat" | "roll" | "system" | "combat";
  text: string;
  roll?: {
    formula: string;
    rolls: number[];
    total: number;
  };
  combat?: {
    attackerTokenId: string;
    defenderTokenId: string;
    actionKind: "weapon" | "spell" | "unarmed" | "ability";
    weaponName: string;
    resolution?: "attack" | "save";
    attackNatural?: number;
    attackTotal?: number;
    attackRollMode?: "normal" | "advantage" | "disadvantage";
    defenderAc?: number;
    hit?: boolean;
    critical?: boolean;
    criticalFail?: boolean;
    saveNatural?: number;
    saveTotal?: number;
    saveDc?: number;
    saveSuccess?: boolean;
    saveAttribute?: string;
    saveRollMode?: "normal" | "advantage" | "disadvantage";
    areaCenterQ?: number;
    areaCenterR?: number;
    areaHexCount?: number;
    damageTotal: number | null;
    defenderHpBefore: number;
    defenderHpAfter: number;
    detail: string;
    attackIndex?: number;
    attackCount?: number;
  };
};

export function createChatId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function welcomeChat(): ChatMessage {
  return {
    id: createChatId(),
    at: Date.now(),
    authorId: "system",
    authorName: "Mesa",
    authorRole: "guest",
    kind: "system",
    text: "Chat da sessão aberto. Rolagens e mensagens ficam registradas aqui.",
  };
}
