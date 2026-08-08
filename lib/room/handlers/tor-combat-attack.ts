import { WEAPON_BY_ID } from "@/lib/character/um-anel/data";
import {
  isTorIllFavouredByShadow,
  resolveWeaponInjury,
  torBrawlingRank,
} from "@/lib/character/um-anel/rules";
import { torVirtueRollEffect } from "@/lib/character/um-anel/virtues";
import { ADVERSARY_PIERCE_BONUS, heroPierceBonus } from "@/lib/combat/um-anel/special-damage";
import { resolveTorCharacter, patchTorCharacterResources } from "@/lib/character/um-anel/characters";
import { resolveTorAttack, formatTorAttackMessage } from "@/lib/combat/um-anel/resolve-attack";
import { featDieRollPayload } from "@/lib/character/um-anel/dice";
import { applyTorAttackResultToDefender } from "@/lib/combat/um-anel/vitals";
import { appendRoomChatMessage } from "./chat";
import { torTokenStance } from "./tor-stance";
import { consumeTorRoundEffect, type TorRoundEffect } from "@/lib/combat/um-anel/round-effects";
import { axialDistance } from "@/lib/vtt/grid-math";
import { syncCombatOrderWithTokens } from "../combat-order";
import { getRoom, persistRoom, toSnapshot } from "../internal/registry";
import type { ChatMessage } from "../chat";
import type { BattleToken } from "@/lib/vtt/types";
import type { RoomSnapshot, RoomState } from "../types";

export type TorAttackExecuteResult =
  | { ok: true; snapshot: RoomSnapshot }
  | { ok: false; error: string };

export type TorAttackExecuteOpts = {
  /** Só atacante kind:"hero" — id do TorWeaponDef equipado (warGear). */
  weaponId?: string;
  /** Só atacante kind:"adversary" — id da ação em torCombat.actions (padrão: a primeira). */
  actionId?: string;
  /**
   * Só atacante kind:"adversary" — o Mestre gasta 1 de Ódio/Resolução para o
   * adversário *ganhar (1d)* nesta rolagem (08-mestre-e-adversarios.md).
   *
   * É opção, nunca automático: o ponto pode valer mais numa Habilidade Sinistra
   * mais adiante na luta, e essa escolha é do Mestre.
   */
  spendHate?: boolean;
  /**
   * Ícones de Sucesso que o atacante quer gastar em Dano Especial. Declarado
   * antes da rolagem porque o ataque é uma requisição só; o motor gasta o que os
   * dados realmente derem.
   */
  specialDamage?: { heavyBlow?: number; pierce?: number };
  room?: RoomState;
};

/**
 * Quantos inimigos engajam este herói — só a postura Defensiva usa (perde 1d por
 * engajador).
 *
 * O livro trata engajamento de forma abstrata; aqui a mesa é posicional, então a
 * leitura do app é **célula adjacente**. É a única definição observável no mapa,
 * e sem ela a Defensiva ficava sem custo nenhum: dava −1d a quem ataca o herói e
 * não tirava nada dele, virando estritamente melhor que Aberta.
 *
 * Adversário em Retaguarda não existe, e eliminado não engaja.
 */
function countEngagingFoes(tokens: BattleToken[], hero: BattleToken): number {
  return tokens.filter(
    (t) =>
      t.id !== hero.id &&
      t.torCombat?.kind === "adversary" &&
      !t.torCombat.eliminated &&
      axialDistance(t.axial, hero.axial) === 1
  ).length;
}

/** Ódio (lacaios do Inimigo) × Resolução (Homens Maus) — muda só o nome na mesa. */
export function hateLabel(kind: "hate" | "resolve" | undefined): string {
  return kind === "resolve" ? "Resolução" : "Ódio";
}

function severityToInjuryText(severity: NonNullable<ReturnType<typeof resolveTorAttack>["severity"]>): string {
  if (severity.kind === "moderado") return "Ferimento Moderado — sem efeito duradouro";
  if (severity.kind === "grave-critico") return "Ferimento Gravíssimo — Morrendo";
  return `Ferimento Grave — ${severity.days} dias pra curar`;
}

/**
 * Ataque tático do Um Anel — paralelo a executeRoomAttack (Eldarin), nunca o
 * substitui. Ver plano da Fase 4: motor puro em lib/combat/um-anel/resolve-attack.ts,
 * vitals isolados (nunca patchTokenVitals), sync de volta pra um_anel_characters
 * só pro lado herói (adversário não tem ficha).
 */
export async function executeRoomTorAttack(
  roomId: string,
  attackerTokenId: string,
  defenderTokenId: string,
  author: { authorId: string; authorName: string; authorRole: ChatMessage["authorRole"] },
  opts: TorAttackExecuteOpts = {}
): Promise<TorAttackExecuteResult> {
  const room = opts.room ?? (await getRoom(roomId, { skipAutoPass: true }));
  if (!room) return { ok: false, error: "Sala não encontrada" };

  const atkIdx = room.scene.tokens.findIndex((t) => t.id === attackerTokenId);
  const defIdx = room.scene.tokens.findIndex((t) => t.id === defenderTokenId);
  if (atkIdx < 0 || defIdx < 0) return { ok: false, error: "Token não encontrado" };

  const attackerToken = room.scene.tokens[atkIdx]!;
  const defenderToken = room.scene.tokens[defIdx]!;
  const atkCombat = attackerToken.torCombat;
  const defCombat = defenderToken.torCombat;
  if (!atkCombat || !defCombat) return { ok: false, error: "Token não é do Um Anel" };
  if (atkCombat.eliminated) return { ok: false, error: "Atacante já eliminado" };
  if (defCombat.eliminated) return { ok: false, error: "Alvo já eliminado" };

  let attackerRank: number;
  let attackerStrength: number | undefined;
  let attackerWeary = false;
  let attackerMiserable = false;
  let attackerIllFavoured = false;
  let attackerFavoured = false;
  /** Virtudes que favoreceram o ataque — vão pra mensagem, pro Mestre conferir. */
  let attackerFavouredBy: string[] = [];
  /**
   * Ataque à distância. Decide postura (Retaguarda só ataca/é atacada assim) e
   * se o modificador de corpo a corpo da postura do alvo vale.
   *
   * Do lado do adversário vem de `action.ranged`, marcado nas quatro ações de
   * Arco do bestiário. Ação sem a marca conta como corpo a corpo.
   */
  let attackIsRanged = false;
  /** O Mestre gastou 1 de Ódio/Resolução neste ataque — desconta ao persistir. */
  let hateSpent = false;
  /** Golpe Pesado: FORÇA (herói) ou Nível de Atributo (adversário). */
  let heavyBlowValue = 0;
  /** Perfurar: bônus por uso, 0 quando a arma não perfura. */
  let pierceValue = 0;
  let attackTwoHanded = false;
  let attackerSteadyHand = false;
  /** Efeitos de rodada já gastos — gravados no token depois de resolver. */
  let attackerRoundEffects: TorRoundEffect[] | undefined;
  let defenderRoundEffects: TorRoundEffect[] | undefined;
  const notasEfeito: string[] = [];
  const round = room.combat?.round ?? 1;
  let weaponDamage: number;
  let weaponInjury: number | null;
  let weaponLabel: string;

  if (atkCombat.kind === "hero") {
    if (!atkCombat.torCharacterId || !opts.weaponId) {
      return { ok: false, error: "Escolha uma arma" };
    }
    const sheet = await resolveTorCharacter(atkCombat.torCharacterId);
    if (!sheet) return { ok: false, error: "Ficha do atacante não encontrada" };
    const gearItem = sheet.warGear.find((w) => w.weaponId === opts.weaponId);
    const weapon = WEAPON_BY_ID[opts.weaponId];
    if (!gearItem || !weapon) return { ok: false, error: "Arma não equipada" };
    // Briga não é rank 0 — é a Proficiência mais alta do herói perdendo (1d).
    // Ver torBrawlingRank(); zerar aqui tornava desarmado/adaga inacertável.
    attackerRank =
      weapon.proficiency === "brawling"
        ? torBrawlingRank(sheet.combatProficiencies)
        : (sheet.combatProficiencies[weapon.proficiency] ?? 0);
    attackerStrength = sheet.attributes.forca;
    attackerWeary = sheet.conditions.weary;
    attackerMiserable = sheet.conditions.miserable;
    // Desfavorecido vale em TODAS as rolagens do herói, inclusive o próprio
    // ataque. Este era o TERCEIRO sítio da mesma confusão Arrasado ×
    // Desfavorecido: o campo já existia em TorAttackParams e era usado na
    // rolagem, mas o handler só o preenchia para o DEFENSOR — então o mesmo
    // herói ficava Desfavorecido ao se defender e não ao atacar.
    attackerIllFavoured = isTorIllFavouredByShadow({
      shadow: sheet.shadow,
      shadowScars: sheet.shadowScars,
      hopeMax: sheet.hope.max,
    });
    attackIsRanged = Boolean(weapon.ranged);
    // Virtudes que tornam ESTE ataque Favorecido. Só aqui dá pra decidir: o
    // motor não conhece ficha, e a rolagem avulsa da ficha não conhece o alvo.
    const virtue = torVirtueRollEffect(sheet.virtues, {
      kind: "attack",
      ranged: attackIsRanged,
      targetMight: defCombat.kind === "adversary" ? defCombat.might : undefined,
    });
    attackerFavoured = virtue.favoured;
    attackerFavouredBy = virtue.sources;
    weaponDamage = weapon.damage;
    weaponInjury = resolveWeaponInjury(weapon, gearItem.twoHanded);
    weaponLabel = weapon.label;
    // Golpe Pesado do herói soma a FORÇA; Perfurar depende da Proficiência
    // (Espadas +1, Arcos +2, Lanças +3 — Machados e Briga não perfuram).
    heavyBlowValue = sheet.attributes.forca;
    pierceValue = heroPierceBonus(weapon.proficiency);
    attackTwoHanded = Boolean(gearItem.twoHanded ?? weapon.twoHanded);
    // Mão Firme finalmente faz alguma coisa: existia em STARTING_VIRTUES desde
    // sempre e nenhuma rolagem a consultava.
    attackerSteadyHand = sheet.virtues.includes("mao-firme");

    // Reunir Companheiros dura a rodada inteira ("nas rolagens de ataque na
    // rodada seguinte") — não é consumido pelo primeiro ataque.
    const reunido = consumeTorRoundEffect(atkCombat.roundEffects, "reunido", round);
    if (reunido.effect) {
      attackerRank += reunido.effect.dice;
      attackerRoundEffects = reunido.rest;
      notasEfeito.push(`Reunido por ${reunido.effect.source ?? "um companheiro"} (+${reunido.effect.dice}d)`);
    }
    // Preparar Tiro vale só no PRÓXIMO ataque à distância — um ataque corpo a
    // corpo não gasta a mira.
    if (attackIsRanged) {
      const tiro = consumeTorRoundEffect(attackerRoundEffects ?? atkCombat.roundEffects, "tiro-preparado", round);
      if (tiro.effect) {
        attackerRank += tiro.effect.dice;
        attackerRoundEffects = tiro.rest;
        notasEfeito.push(`Tiro Preparado (+${tiro.effect.dice}d)`);
      }
    }
  } else {
    const action = atkCombat.actions?.find((a) => a.id === opts.actionId) ?? atkCombat.actions?.[0];
    if (!action) return { ok: false, error: "Adversário sem ação de ataque" };
    attackerRank = action.rating;
    // Adversário com Arco alcança quem está na Retaguarda — e só ele. É a outra
    // metade da regra: "só pode ser alvo de atacantes usando armas similares".
    attackIsRanged = Boolean(action.ranged);
    weaponDamage = action.damage;
    weaponInjury = action.injury;
    weaponLabel = action.label;
    // "Todos os adversários podem sempre escolher acionar um resultado de dano
    // especial de Golpe Pesado" (08-mestre-e-adversarios.md) — por isso não
    // depende de `action.specialDamage`, que lista só as opções EXTRAS do bloco.
    heavyBlowValue = atkCombat.attributeLevel ?? 0;
    // Perfurar é +2 fixo pro adversário, e só se o bloco listar a opção.
    pierceValue = action.specialDamage?.includes("Perfurar") ? ADVERSARY_PIERCE_BONUS : 0;

    // "O Mestre pode reduzir o Ódio ou a Resolução de um adversário para fazê-lo
    // ganhar (1d) em uma rolagem durante o combate." O gasto é (1d) de Dado de
    // SUCESSO — mexe no rank, nunca em Favorecida.
    // Exausto zera Dados de Sucesso de 1 a 3 — vale pro adversário igual ao
    // herói. A flag é marcada na virada de rodada (combat-turn.ts), não aqui.
    attackerWeary = Boolean(atkCombat.weary);

    // Intimidar Inimigo: "os oponentes ficam Exaustos em sua PRÓXIMA rolagem de
    // ataque" — vale uma vez e some, mesmo que a rodada continue.
    const intimidado = consumeTorRoundEffect(atkCombat.roundEffects, "intimidado", round);
    if (intimidado.effect) {
      attackerWeary = true;
      attackerRoundEffects = intimidado.rest;
      notasEfeito.push(`Intimidado por ${intimidado.effect.source ?? "um herói"} — Exausto neste ataque`);
    }

    if (opts.spendHate) {
      const available = atkCombat.hate ?? 0;
      if (available <= 0) {
        return {
          ok: false,
          error: `${attackerToken.name} não tem ${hateLabel(atkCombat.hateKind)} para gastar`,
        };
      }
      attackerRank += 1;
      hateSpent = true;
    }
  }

  let defenderWeary = false;
  let defenderMiserable = false;
  // Desfavorecido é condição SEPARADA de Arrasado (Sombra na Esperança máxima),
  // e a ficha não guarda essa flag — deriva aqui, do mesmo lugar que o motor de
  // Sombra usa. Ver lib/combat/um-anel/shadow.ts::deriveTorSpiritFlags.
  let defenderIllFavoured = false;
  let defenderProtectionFavoured = false;
  let defenderWoundSeverityFavoured = false;
  let defenderHeroSheetId: string | null = null;
  if (defCombat.kind === "hero" && defCombat.torCharacterId) {
    const defSheet = await resolveTorCharacter(defCombat.torCharacterId);
    if (defSheet) {
      // Lido ANTES de applyTorAttackResultToDefender: o Teste de Proteção é
      // feito antes de a Exaustão deste golpe surgir (livro §Piercing Blows).
      defenderWeary = defSheet.conditions.weary;
      defenderMiserable = defSheet.conditions.miserable;
      defenderIllFavoured = isTorIllFavouredByShadow({
        shadow: defSheet.shadow,
        shadowScars: defSheet.shadowScars,
        hopeMax: defSheet.hope.max,
      });
      // Duro como Pedra cai quando o herói está Arrasado — por isso lê
      // `defenderMiserable`, e não a flag de Desfavorecido.
      defenderProtectionFavoured = torVirtueRollEffect(defSheet.virtues, {
        kind: "protection",
        miserable: defenderMiserable,
      }).favoured;
      defenderWoundSeverityFavoured = torVirtueRollEffect(defSheet.virtues, {
        kind: "wound-severity",
      }).favoured;
      defenderHeroSheetId = defSheet.id;
    }
  } else if (defCombat.kind === "adversary") {
    // Adversário Exausto também rola Proteção pior — a condição não é privilégio
    // do herói. Sem isto, zerar o Ódio de um Troll não mudava nada na defesa dele.
    defenderWeary = Boolean(defCombat.weary);
  }

  // Proteger Companheiro: "o PRÓXIMO ataque dirigido ao herói protegido perde
  // (1d)". Cai sobre o rank de quem ataca, e some depois de um ataque só.
  const protegido = consumeTorRoundEffect(defCombat.roundEffects, "protegido", round);
  if (protegido.effect) {
    attackerRank = Math.max(0, attackerRank - protegido.effect.dice);
    defenderRoundEffects = protegido.rest;
    notasEfeito.push(
      `${defenderToken.name} protegido por ${protegido.effect.source ?? "um companheiro"} (−${protegido.effect.dice}d)`
    );
  }

  const result = resolveTorAttack({
    attackerKind: atkCombat.kind,
    attackerRank,
    attackerStrength,
    attackerWeary,
    attackerMiserable,
    attackerIllFavoured,
    attackerFavoured,
    defenderParry: defCombat.parry,
    weaponDamage,
    weaponInjury: weaponInjury ?? 999,
    weaponCanPierce: weaponInjury != null,
    defenderKind: defCombat.kind,
    defenderProtectionDice: defCombat.protectionDice,
    defenderWeary,
    defenderMiserable,
    defenderIllFavoured,
    defenderProtectionFavoured,
    defenderWoundSeverityFavoured,
    defenderAlreadyWounded: defCombat.wounded,
    // Vigor e Ferimentos acumulados do adversário — sem isto o motor não sabe
    // quantos Ferimentos faltam pra abatê-lo e eliminaria no primeiro.
    defenderMight: defCombat.might,
    defenderWounds: defCombat.wounds,
    // Posturas (D17). Adversário não escolhe postura — `resolveTorAttack` cai em
    // Aberta, que é neutra, quando o campo não vem.
    attackerStance: atkCombat.kind === "hero" ? torTokenStance(attackerToken) : undefined,
    defenderStance: defCombat.kind === "hero" ? torTokenStance(defenderToken) : undefined,
    attackIsRanged,
    specialDamagePlan: opts.specialDamage,
    heavyBlowValue,
    pierceValue,
    attackTwoHanded,
    attackerSteadyHand,
    attackerEngagedByCount:
      atkCombat.kind === "hero" ? countEngagingFoes(room.scene.tokens, attackerToken) : 0,
  });

  const patchedDefenderToken = applyTorAttackResultToDefender(defenderToken, result);
  const tokens = [...room.scene.tokens];
  tokens[defIdx] = defenderRoundEffects
    ? {
        ...patchedDefenderToken,
        torCombat: { ...patchedDefenderToken.torCombat!, roundEffects: defenderRoundEffects },
      }
    : patchedDefenderToken;
  // Efeitos gastos pelo atacante saem do token — senão o mesmo "Tiro Preparado"
  // valeria em todos os ataques da rodada.
  if (attackerRoundEffects) {
    tokens[atkIdx] = {
      ...tokens[atkIdx]!,
      torCombat: { ...tokens[atkIdx]!.torCombat!, roundEffects: attackerRoundEffects },
    };
  }
  // Desconta o ponto DEPOIS de resolver, e a partir do array já copiado: o
  // atacante pode ser o mesmo índice de nada mais, mas escrever antes faria a
  // cópia do defensor sobrescrever o desconto se os dois fossem tocados juntos.
  if (hateSpent && atkCombat.hate != null) {
    // Parte de `tokens[atkIdx]`, não de `atkCombat`: um adversário Intimidado
    // que também gasta Ódio já teve o efeito removido acima, e espalhar o
    // `atkCombat` original ressuscitaria o efeito gasto.
    tokens[atkIdx] = {
      ...tokens[atkIdx]!,
      torCombat: { ...tokens[atkIdx]!.torCombat!, hate: Math.max(0, atkCombat.hate - 1) },
    };
  }
  room.scene = { ...room.scene, tokens };

  // Sincroniza Resistência/Ferida de volta pra ficha — só se o requisitante tiver
  // permissão (dono da ficha ou mestre da aventura; ver patchTorCharacterResources).
  // Falha aqui não desfaz o ataque no token/mapa, só fica sem persistir na ficha.
  if (result.hit && defCombat.kind === "hero" && defenderHeroSheetId) {
    try {
      await patchTorCharacterResources(
        defenderHeroSheetId,
        {
          enduranceValue: patchedDefenderToken.vida ?? 0,
          wounded: patchedDefenderToken.torCombat?.wounded,
          injury: result.severity ? severityToInjuryText(result.severity) : undefined,
        },
        author.authorId
      );
    } catch (e) {
      console.error("[tor-attack] falha ao sincronizar ficha do defensor:", e);
    }
  }

  syncCombatOrderWithTokens(room);

  // Sem nomear a Virtude, a mensagem diz "(Favorecida)" e ninguém na mesa sabe
  // por quê — some no meio de Exausto/Arrasado/postura.
  const notas = [
    ...attackerFavouredBy,
    ...(hateSpent ? [`gastou 1 de ${hateLabel(atkCombat.hateKind)} — ganha (1d)`] : []),
    ...notasEfeito,
  ];
  const weaponTxt = notas.length > 0 ? `${weaponLabel}, ${notas.join(", ")}` : weaponLabel;
  const message = formatTorAttackMessage(attackerToken.name, defenderToken.name, weaponTxt, result);
  const { sides, value } = featDieRollPayload(result.attackRoll.featDie);
  appendRoomChatMessage(room, {
    ...author,
    kind: "chat",
    text: message,
    roll: { formula: `1d${sides}`, rolls: [value], total: value },
  });

  try {
    return { ok: true, snapshot: toSnapshot(await persistRoom(roomId, room)) };
  } catch (e) {
    console.error("[tor-attack] persistRoom failed:", e);
    return { ok: false, error: e instanceof Error ? e.message : "Falha ao salvar a mesa após o ataque" };
  }
}
