import type { Axial } from "@/lib/vtt/grid-math";
import { defaultMovementFields } from "@/lib/vtt/movement";
import type { BattleToken } from "@/lib/vtt/types";
import type { TorAdversaryStats } from "./adversary-types";

const TOR_TOKEN_PA = 999;
const TOR_TOKEN_WALK = 4;
const TOR_TOKEN_RUN = 6;

const TIER_COLOR: Record<TorAdversaryStats["tier"], string> = {
  mob: "#8b3a22",
  elite: "#7a4a6a",
  boss: "#c0392b",
};

export function createTorAdversaryToken(
  stats: TorAdversaryStats,
  axial: Axial,
  tokenId?: string
): BattleToken {
  const id = tokenId ?? `tk-tor-adv-${stats.id}-${Date.now().toString(36).slice(-5)}`;

  return {
    id,
    name: stats.name,
    axial,
    color: TIER_COLOR[stats.tier],
    walk: TOR_TOKEN_WALK,
    run: TOR_TOKEN_RUN,
    pa: TOR_TOKEN_PA,
    paMax: TOR_TOKEN_PA,
    ownerRole: "mestre",
    linked: false,
    vida: stats.endurance,
    vidaMax: stats.endurance,
    creatureSize: "medium",
    torCombat: {
      kind: "adversary",
      parry: stats.parry,
      protectionDice: stats.armour,
      attributeLevel: stats.attributeLevel,
      actions: stats.actions,
      wounded: false,
      // Vigor precisa chegar ao combate: é o número de Ferimentos pra abater o
      // adversário. Sem copiar aqui, o motor eliminava qualquer adversário no
      // primeiro Ferimento, e os 8 blocos de Vigor 2 morriam com metade — o
      // Grande Troll das Cavernas (Resistência 80) caía num único golpe.
      might: Math.max(1, stats.might),
      wounds: 0,
      // Ódio/Resolução e Habilidades Sinistras precisam viajar com o token: são a
      // metade do bloco que o Mestre usa DURANTE a luta. Sem copiar aqui ficavam
      // só em adversaries.ts, invisíveis na mesa.
      hate: stats.hate,
      hateMax: stats.hate,
      hateKind: stats.hateKind,
      fellAbilities: stats.fellAbilities,
      large: stats.large,
      eliminated: false,
    },
    ...defaultMovementFields({ walk: TOR_TOKEN_WALK, run: TOR_TOKEN_RUN }),
  };
}
