"use client";

import { useCallback, useEffect, useRef, type CSSProperties } from "react";
import type { CombatDiceSequence, DiceCombatUiState } from "@/lib/vtt/combat-dice-model";
import { toDiceBoxRoll } from "@/lib/vtt/combat-dice-model";
import {
  getDiceBoxCombatPanelOptions,
  loadVendorDiceBox,
  type DiceBoxInstance,
} from "@/lib/vtt/dice-combat-box";

/** Hosts fixos — reutiliza instâncias WebGL entre ataques. */
const ATTACK_HOST_ID = "combat-dice-panel-attack";
const DAMAGE_HOST_ID = "combat-dice-panel-damage";

type Props = {
  sequence: CombatDiceSequence;
  ui: DiceCombatUiState;
  reducedMotion?: boolean;
  onAttackRollBegin?: () => void;
  onAttackRollSettled?: () => void;
  onDamageRollBegin?: () => void;
};

function waitLayout(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function slotGlowStyle(color: string, border: string): CSSProperties {
  return {
    "--dice-tier-color": color,
    "--dice-tier-border": border,
    boxShadow: `inset 0 0 0 1px ${border}, 0 0 18px ${color}33`,
  } as CSSProperties;
}

export function DiceCombatPanel({
  sequence,
  ui,
  reducedMotion = false,
  onAttackRollBegin,
  onAttackRollSettled,
  onDamageRollBegin,
}: Props) {
  const attackBoxRef = useRef<DiceBoxInstance | null>(null);
  const damageBoxRef = useRef<DiceBoxInstance | null>(null);
  const attackReadyRef = useRef(false);
  const damageReadyRef = useRef(false);
  const attackInitRef = useRef<Promise<void> | null>(null);
  const damageInitRef = useRef<Promise<void> | null>(null);
  const attackSeqRef = useRef<string | null>(null);
  const damageSeqRef = useRef<string | null>(null);
  const evictingRef = useRef(false);

  const { attack, attacker, damage, attackSlotLabel, damageSlotLabel, damageSlotBorder } =
    sequence;

  const clearBoth = useCallback(async () => {
    await Promise.all([
      attackReadyRef.current
        ? Promise.resolve(attackBoxRef.current?.clear()).catch(() => {})
        : Promise.resolve(),
      damageReadyRef.current
        ? Promise.resolve(damageBoxRef.current?.clear()).catch(() => {})
        : Promise.resolve(),
    ]);
  }, []);

  const ensureAttackBox = useCallback(async () => {
    await waitLayout();
    if (attackReadyRef.current) {
      attackBoxRef.current?.resizeWorld?.();
      attackBoxRef.current?.show?.();
      return;
    }
    if (attackInitRef.current) {
      await attackInitRef.current;
      return;
    }
    attackInitRef.current = (async () => {
      const DiceBox = await loadVendorDiceBox();
      attackBoxRef.current = new DiceBox({
        ...getDiceBoxCombatPanelOptions(reducedMotion),
        container: `#${ATTACK_HOST_ID}`,
      });
      await attackBoxRef.current.init();
      attackBoxRef.current.show?.();
      attackReadyRef.current = true;
    })();
    try {
      await attackInitRef.current;
    } catch (err) {
      attackInitRef.current = null;
      throw err;
    }
  }, [reducedMotion]);

  const ensureDamageBox = useCallback(async () => {
    await waitLayout();
    if (damageReadyRef.current) {
      damageBoxRef.current?.resizeWorld?.();
      damageBoxRef.current?.show?.();
      return;
    }
    if (damageInitRef.current) {
      await damageInitRef.current;
      return;
    }
    damageInitRef.current = (async () => {
      const DiceBox = await loadVendorDiceBox();
      damageBoxRef.current = new DiceBox({
        ...getDiceBoxCombatPanelOptions(reducedMotion),
        container: `#${DAMAGE_HOST_ID}`,
      });
      await damageBoxRef.current.init();
      damageBoxRef.current.show?.();
      damageReadyRef.current = true;
    })();
    try {
      await damageInitRef.current;
    } catch (err) {
      damageInitRef.current = null;
      throw err;
    }
  }, [reducedMotion]);

  useEffect(() => {
    attackSeqRef.current = null;
    damageSeqRef.current = null;
    evictingRef.current = false;
  }, [sequence.id]);

  useEffect(() => {
    if (!ui.attackRolling) return;
    if (attack.value == null) return;
    const rollKey = `${sequence.id}:${attack.value}`;
    if (attackSeqRef.current === rollKey) return;
    attackSeqRef.current = rollKey;

    void ensureAttackBox()
      .then(async () => {
        await Promise.resolve(attackBoxRef.current?.clear()).catch(() => {});
        onAttackRollBegin?.();
        return attackBoxRef.current?.roll(toDiceBoxRoll(attack));
      })
      .then(() => {
        onAttackRollSettled?.();
      })
      .catch((err) => console.error("[DiceCombatPanel] attack roll", err));
  }, [
    ui.attackRolling,
    attack,
    ensureAttackBox,
    onAttackRollBegin,
    onAttackRollSettled,
    sequence.id,
  ]);

  useEffect(() => {
    if (!ui.showDamage || !ui.damageRolling || !damage) return;
    if (damageSeqRef.current === sequence.id) return;
    damageSeqRef.current = sequence.id;

    void ensureDamageBox()
      .then(() => {
        onDamageRollBegin?.();
        return damageBoxRef.current?.roll(toDiceBoxRoll(damage));
      })
      .catch((err) => console.error("[DiceCombatPanel] damage roll", err));
  }, [ui.showDamage, ui.damageRolling, damage, ensureDamageBox, onDamageRollBegin, sequence.id]);

  useEffect(() => {
    if (!ui.evicting || evictingRef.current) return;
    evictingRef.current = true;
    void (async () => {
      await waitMs(sequence.timings.evictMs);
      await clearBoth();
      evictingRef.current = false;
    })();
  }, [ui.evicting, clearBoth, sequence.timings.evictMs]);

  useEffect(() => {
    return () => {
      void clearBoth();
    };
  }, [clearBoth]);

  const damageBorder = damageSlotBorder ?? damage?.themeColor ?? "#e05040";
  const damageColor = damage?.themeColor ?? "#e05040";

  return (
    <div
      className={`combat-dice-box-row${ui.evicting ? " combat-dice-box-row--evicting" : ""}${ui.showDamage && damage ? " combat-dice-box-row--dual" : ""}`}
    >
      <div
        className={`combat-dice-slot${ui.attackLocked ? " combat-dice-slot--locked" : ""}`}
        style={slotGlowStyle(attacker.color, attacker.border)}
      >
        <div id={ATTACK_HOST_ID} className="combat-dice-box-host" />
        <span className="combat-dice-slot__label">
          <span className="combat-dice-slot__dot" style={{ background: attacker.color }} />
          {attackSlotLabel}
        </span>
        {ui.attackLocked ? (
          <span className="combat-dice-slot__lock" aria-hidden>
            fixo
          </span>
        ) : null}
      </div>
      {ui.showDamage && damage ? (
        <div
          className="combat-dice-slot combat-dice-slot--damage"
          style={slotGlowStyle(damageColor, damageBorder)}
        >
          <div id={DAMAGE_HOST_ID} className="combat-dice-box-host" />
          <span className="combat-dice-slot__label">
            <span className="combat-dice-slot__dot" style={{ background: damageColor }} />
            {damageSlotLabel ?? `Dano d${damage.sides}`}
          </span>
        </div>
      ) : null}
    </div>
  );
}
