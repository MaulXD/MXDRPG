/**
 * Curvas de balanceamento Eldarin v4 — monstros vs grupo de 4 PCs.
 * Alvo: 1 mob do mesmo nv cai em ~1–2 rodadas (foco); mini ~2–3; boss ~3–5.
 */

export function mod(n) {
  return Math.floor((n - 10) / 2);
}

export function proficiencyBonus(level) {
  if (level >= 17) return 6;
  if (level >= 13) return 5;
  if (level >= 9) return 4;
  if (level >= 5) return 3;
  return 2;
}

/** HP base por tier e nível de ameaça. */
export function defaultMonsterHp(nivel, tier, flags = {}) {
  if (flags.hp != null) return flags.hp;
  let hp;
  if (tier === "boss") {
    hp = 24 + nivel * 14 + Math.floor((nivel * nivel) / 35);
  } else if (tier === "mini") {
    hp = 16 + nivel * 8;
  } else {
    hp = 10 + nivel * 6;
  }
  if (flags.swarm) hp = Math.round(hp * 0.5);
  if (flags.glass) hp = Math.round(hp * 0.75);
  if (flags.tank) hp = Math.round(hp * 1.3);
  if (flags.hpDelta) hp += flags.hpDelta;
  return Math.max(4, hp);
}

/** CA base — PCs marciais ~12–20 conforme nível. */
export function defaultMonsterCa(nivel, tier, flags = {}) {
  if (flags.ca != null) return flags.ca;
  let ca = 11 + Math.floor(nivel / 2);
  if (tier === "mini") ca += 1;
  if (tier === "boss") ca += 2;
  if (flags.heavy) ca += 2;
  if (flags.nimble) ca += 1;
  if (flags.soft) ca -= 2;
  if (flags.caDelta) ca += flags.caDelta;
  return Math.max(8, Math.min(24, ca));
}

export function monsterAttackBonus(nivel, tier, kind, agiMod = 0) {
  const base = 2 + Math.floor(nivel / 2);
  if (kind === "bite") return base + (tier === "boss" ? 1 : 0);
  if (kind === "claw") return Math.max(base - 1, agiMod + Math.floor(nivel / 4));
  if (kind === "special") return base + 1 + Math.floor(nivel / 3);
  return base;
}

export function avgDice(formula) {
  const m = formula.match(/(\d+)d(\d+)(?:\+(\d+))?/);
  if (!m) return 0;
  const dice = Number(m[1]);
  const sides = Number(m[2]);
  const flat = Number(m[3] ?? 0);
  return dice * ((sides + 1) / 2) + flat;
}

/** Guerreiro referência (STR primária, CON 14). */
export function referencePc(level) {
  const prof = proficiencyBonus(level);
  const str = 14 + Math.min(6, Math.floor((level - 1) / 3));
  const dex = 14;
  const con = 14;
  const strMod = mod(str);
  const dexMod = mod(dex);
  const conMod = mod(con);
  const hpDieMax = 10;
  const hpDieAvg = 6;
  const hp =
    level === 1
      ? hpDieMax + conMod
      : hpDieMax + conMod + (level - 1) * (hpDieAvg + conMod);
  let ac = 10 + dexMod;
  if (level >= 10) ac = 18;
  else if (level >= 5) ac = 15 + Math.min(2, dexMod);
  else if (level >= 3) ac = 16;
  else ac = 13;
  const attacksPerTurn = level >= 5 ? 2 : 1;
  const hitBonus = prof + strMod;
  const dmgPerHit = avgDice("1d8") + strMod;
  return { level, hp, ac, hitBonus, dmgPerHit, attacksPerTurn, partySize: 4 };
}

export function hitChance(attackBonus, targetAc) {
  const need = targetAc - attackBonus;
  if (need <= 1) return 0.95;
  if (need >= 20) return 0.05;
  return (21 - need) / 20;
}

/** DPR do grupo num alvo único (foco), 1 rodada. */
export function partyDprVs(pc, monsterCa) {
  const hit = hitChance(pc.hitBonus, monsterCa);
  return pc.partySize * pc.attacksPerTurn * pc.dmgPerHit * hit;
}

/** Rodadas até zerar HP (foco do grupo). */
export function roundsToKill(hp, dpr) {
  if (dpr <= 0) return Infinity;
  return Math.ceil(hp / dpr);
}

/** Ameaça do monstro a 1 PC marcial (3 ataques de 2 PA, 6 PA/rodada). */
export function monsterDprVsPc(nivel, tier, attrs, pcAc) {
  const agiMod = mod(attrs.agilidade ?? 10);
  const biteBonus = monsterAttackBonus(nivel, tier, "bite");
  const clawBonus = monsterAttackBonus(nivel, tier, "claw", agiMod);
  const biteDmg = avgDice(tier === "boss" ? "2d8" : tier === "mini" ? "1d10" : "1d6");
  const clawDmg = avgDice(tier === "boss" ? "2d6" : "1d8");
  const attacks = tier === "mob" && nivel < 2 ? 3 : 6; // 3× mordida ou 3 pares
  const hitB = hitChance(biteBonus, pcAc);
  const hitC = hitChance(clawBonus, pcAc);
  if (tier === "mob" && nivel < 2) return 3 * biteDmg * hitB;
  return 1.5 * (biteDmg * hitB + clawDmg * hitC);
}

export function simulateMonster(entry, pcLevel = null) {
  const nivel = entry.system?.tactical?.ameaca?.value ?? 1;
  const tier = entry.system?.tactical?.tier ?? "mob";
  const hp = entry.system?.resources?.vida?.max ?? 1;
  const ca = entry.system?.tactical?.defesa?.value ?? 10;
  const attrs = {
    forca: entry.system?.attributes?.forca?.value ?? 10,
    agilidade: entry.system?.attributes?.agilidade?.value ?? 10,
  };
  const L = pcLevel ?? nivel;
  const pc = referencePc(L);
  const dpr = partyDprVs(pc, ca);
  const ttk = roundsToKill(hp, dpr);
  const mDpr = monsterDprVsPc(nivel, tier, attrs, pc.ac);
  const ttd = roundsToKill(pc.hp, mDpr);
  return {
    name: entry.name,
    nivel,
    tier,
    hp,
    ca,
    pcLevel: L,
    partyDpr: Math.round(dpr * 10) / 10,
    monsterDpr: Math.round(mDpr * 10) / 10,
    roundsToKill: ttk,
    roundsToDownPc: ttd,
    hitVsPc: Math.round(hitChance(monsterAttackBonus(nivel, tier, "bite"), pc.ac) * 100),
  };
}
