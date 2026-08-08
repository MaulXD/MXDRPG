import type { TorSkillId } from "@/lib/character/um-anel/types";
import type { TorStanceId } from "@/lib/combat/um-anel/stances";

/**
 * Tarefas de Combate (06-fases-de-aventura-combate.md §Tarefas de Combate).
 *
 * Cada uma exige uma postura específica e uma rolagem de Perícia, e custa a
 * **ação principal** da rodada. As Virtudes Baruk Khazâd!, Arco Mortal, Realeza
 * Revelada e Amigo dos Anões são a exceção — deixam tentar a tarefa como ação
 * secundária, junto com o ataque. A exceção não está mecanizada: quem escolhe é
 * o jogador, e o app não impede ninguém de atacar e usar a tarefa na mesma
 * rodada (a mesa combina, como já combinava).
 *
 * Os ids das Perícias são os de `data.ts`; o rótulo que aparece na tela é o da
 * ficha (Fascínio, Indução, Batalha, Busca) — foi essa divergência entre livro e
 * ficha que precisou ser resolvida antes destas tarefas existirem.
 */
export const TOR_COMBAT_TASKS = ["intimidar-inimigo", "reunir-companheiros", "proteger-companheiro", "preparar-tiro"] as const;

export type TorCombatTaskId = (typeof TOR_COMBAT_TASKS)[number];

export type TorCombatTaskDef = {
  id: TorCombatTaskId;
  label: string;
  stance: TorStanceId;
  skill: TorSkillId;
  /** Precisa apontar outro herói (só Proteger Companheiro). */
  needsAlly?: boolean;
  /** Uma vez por rodada em toda a Companhia (só Reunir Companheiros). */
  oncePerRound?: boolean;
  description: string;
};

export const TOR_COMBAT_TASK_BY_ID: Record<TorCombatTaskId, TorCombatTaskDef> = {
  "intimidar-inimigo": {
    id: "intimidar-inimigo",
    label: "Intimidar Inimigo",
    stance: "avancada",
    skill: "imponencia",
    description:
      "Com sucesso, todo adversário de Vigor 1 fica Exausto na próxima rolagem de ataque; com 1 ícone, também os de Vigor 2; com 2 ou mais, todos os adversários na luta.",
  },
  "reunir-companheiros": {
    id: "reunir-companheiros",
    label: "Reunir Companheiros",
    stance: "aberta",
    skill: "encorajar",
    oncePerRound: true,
    description:
      "Com sucesso, quem luta em Avançada ganha (1d) no ataque na rodada seguinte; com 1 ícone, também quem está em Aberta; com 2 ou mais, todos em postura de corpo a corpo.",
  },
  "proteger-companheiro": {
    id: "proteger-companheiro",
    label: "Proteger Companheiro",
    stance: "defensiva",
    skill: "batalha",
    needsAlly: true,
    description:
      "Com sucesso, o próximo ataque dirigido ao herói protegido perde (1d), mais (1d) por ícone de Sucesso.",
  },
  "preparar-tiro": {
    id: "preparar-tiro",
    label: "Preparar Tiro",
    stance: "retaguarda",
    skill: "vasculhar",
    description:
      "Com sucesso, você ganha (1d) no próximo ataque à distância, mais (1d) por ícone de Sucesso.",
  },
};

export function isTorCombatTask(v: unknown): v is TorCombatTaskId {
  return typeof v === "string" && (TOR_COMBAT_TASKS as readonly string[]).includes(v);
}

/**
 * Vigor máximo afetado por Intimidar Inimigo, conforme os ícones de Sucesso.
 * `null` = todos, sem limite de Vigor.
 */
export function intimidateMightCap(successIcons: number): number | null {
  if (successIcons >= 2) return null;
  return successIcons >= 1 ? 2 : 1;
}

/**
 * Posturas alcançadas por Reunir Companheiros, conforme os ícones.
 *
 * Retaguarda nunca entra: o livro fecha em "todos os heróis-jogadores lutando em
 * uma postura de Combate Corpo a Corpo", e Retaguarda é a postura à distância.
 */
export function rallyStances(successIcons: number): TorStanceId[] {
  if (successIcons >= 2) return ["avancada", "aberta", "defensiva"];
  if (successIcons >= 1) return ["avancada", "aberta"];
  return ["avancada"];
}
